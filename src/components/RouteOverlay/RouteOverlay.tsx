import { useEffect, useRef } from 'react'

import { useKakaoMap } from '@/context/KakaoMap'
import { distanceMeters, type LatLng } from '@/lib/utils/route'

import {
  createRouteOverlayStore,
  PolylineFactory,
  RouteLayer,
  RouteOverlayStore
} from './routeOverlayStore'

/** 줌에 따라 달라지는 값. 픽셀 기준 좌표 가공은 축척으로 정한다. 두께는 고정이다 */
export interface MapView{
  mapLevel: number;
  /** 레벨별 축척표를 두지 않고 투영에서 직접 잰 값 */
  metersPerPixel: number;
}

type Props = {
  /** 줌 상태를 받아 그릴 레이어를 만든다. 줌과 무관하면 인자를 무시하면 된다 */
  buildLayers: (view: MapView) => RouteLayer[];
}

/** 1px은 반올림 오차가 커서 표본을 넓게 잡는다 */
const SAMPLE_PIXELS = 100

/**
 * 투영을 못 쓸 때 쓰는 폴백. 레벨당 2배인 카카오 축척을 그대로 옮긴 값이고
 * 실측(레벨 2에서 0.50 / 4에서 1.99 / 6에서 8.02 m/px)과 일치한다
 */
const toFallbackMetersPerPixel = (mapLevel: number) => 0.25 * 2 ** (mapLevel - 1)

export const toMapView = (map: kakao.maps.Map): MapView => {
  const projection = map.getProjection()
  const center = map.getCenter()
  const origin = projection.containerPointFromCoords(center)
  const shifted = projection.coordsFromContainerPoint(
    new kakao.maps.Point(origin.x + SAMPLE_PIXELS, origin.y)
  )
  const meters = distanceMeters(
    { lat: center.getLat(), lng: center.getLng() },
    { lat: shifted.getLat(), lng: shifted.getLng() }
  )

  const mapLevel = map.getLevel()
  const metersPerPixel = meters / SAMPLE_PIXELS

  // 레이아웃 전이면 투영이 NaN을 줄 수 있다. 그대로 흘리면 tolerance·오프셋이 NaN이 되고,
  // 줌이 바뀌기 전까지 다시 계산되지 않아 스스로 복구되지 않는다
  return Number.isFinite(metersPerPixel) && metersPerPixel > 0
    ? { mapLevel, metersPerPixel }
    : { mapLevel, metersPerPixel: toFallbackMetersPerPixel(mapLevel) }
}

const toKakaoPath = (path: LatLng[]) => path.map(({ lat, lng }) => new kakao.maps.LatLng(lat, lng))

/** SDK 경계. 스토어는 이 어댑터로만 카카오맵을 만진다 */
const createKakaoPolyline: PolylineFactory = () => {
  // path는 생성자 필수라 빈 좌표열로 만든다. 좌표·스타일은 스토어가 setPath·setOptions로 넣는다
  // 색·두께가 안 먹으면 setOptions 미반영을 의심할 것 — 생성자에 스타일을 넣는 방식으로 되돌리면 된다
  const polyline = new kakao.maps.Polyline({ path: [] })

  return {
    setPath: (next) => polyline.setPath(toKakaoPath(next)),
    setOptions: (options) => polyline.setOptions(options),
    setZIndex: (zIndex) => polyline.setZIndex(zIndex),
    setMap: (target) => polyline.setMap(target as kakao.maps.Map | null)
  }
}

/**
 * 경로 폴리라인 레이어를 그리는 명령형 오버레이. 지도에 직접 붙고 DOM은 내지 않는다.
 * 실시간·과거 경로가 함께 쓰므로 색·두께·순서는 전부 호출자가 정한다.
 */
export function RouteOverlay({ buildLayers }: Props){
  const map = useKakaoMap()
  const storeRef = useRef<RouteOverlayStore | null>(null)
  // 줌 리스너가 최신 빌더를 보게 한다 — 재구독하면 지도 이벤트가 매 갱신마다 붙었다 떨어진다
  const buildRef = useRef(buildLayers)
  const appliedLevelRef = useRef<number | null>(null)

  // 파기는 언마운트·map 교체 시에만. 데이터 effect의 cleanup에서 파기하면 갱신마다
  // 전량 재생성된다(docs/MAP_RENDERING_GUIDE.md 함정 3)
  useEffect(() => {
    const store = createRouteOverlayStore(createKakaoPolyline, map)
    storeRef.current = store

    return () => {
      store.destroy()
      storeRef.current = null
    }
  }, [map])

  useEffect(() => {
    const view = toMapView(map)

    buildRef.current = buildLayers
    appliedLevelRef.current = view.mapLevel
    storeRef.current?.sync(buildLayers(view))
  }, [map, buildLayers])

  // 줌이 바뀌면 픽셀 기준 좌표 가공(tolerance·오프셋)만 다시 계산한다. 두께는 고정이다
  useEffect(() => {
    // zoom_changed가 갱신 전 레벨을 줄 수 있어 idle로 한 번 더 받는다.
    // 축척은 레벨의 함수라 레벨로 걸러도 새 값을 놓치지 않는다
    const reapply = () => {
      const level = map.getLevel()

      if(appliedLevelRef.current === level) {
        return
      }

      appliedLevelRef.current = level
      storeRef.current?.sync(buildRef.current(toMapView(map)))
    }

    kakao.maps.event.addListener(map, 'zoom_changed', reapply)
    kakao.maps.event.addListener(map, 'idle', reapply)

    return () => {
      kakao.maps.event.removeListener(map, 'zoom_changed', reapply)
      kakao.maps.event.removeListener(map, 'idle', reapply)
    }
  }, [map])

  return null
}
