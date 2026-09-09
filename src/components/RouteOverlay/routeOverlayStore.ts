import { type LatLng, MIN_PATH_POINTS } from '@/lib/utils/route'

export interface RouteLayerStyle{
  strokeColor: string;
  strokeWeight: number;
  /** 경로선은 불투명이 기본. 카카오 기본값 0.6은 겹친 레이어가 섞여 보인다 */
  strokeOpacity?: number;
  strokeStyle?: kakao.maps.StrokeStyles;
  /** 마커보다 낮게 둔다. 미지정 시 0 */
  zIndex?: number;
}

export interface RouteLayer{
  /** 레이어 정체성. 내비=route_id, 주행=mode별 고정 키. 좌표로 만들면 갱신마다 재생성된다 */
  id: string;
  /** 한 레이어가 여러 조각으로 끊긴다(mode 구간·좌표 점프 분리) */
  paths: LatLng[][];
  style: RouteLayerStyle;
  /** false면 인스턴스는 남기고 지도에서만 뗀다(토글 off→on 재생성 방지). 미지정 시 표시 */
  visible?: boolean;
}

/** kakao.maps.Polyline에서 이 스토어가 쓰는 부분만. 노드 테스트가 가짜를 넣을 수 있게 좁혀 둔다 */
export interface PolylineLike{
  setPath: (path: LatLng[]) => void;
  setOptions: (options: RouteStrokeOptions) => void;
  setZIndex: (zIndex: number) => void;
  setMap: (map: object | null) => void;
}

export interface RouteStrokeOptions{
  strokeColor: string;
  strokeWeight: number;
  strokeOpacity: number;
  strokeStyle: kakao.maps.StrokeStyles;
}

/** 좌표·스타일은 생성자로 넣지 않는다. 초기화도 sync의 갱신 경로 하나로 흐르게 한다 */
export type PolylineFactory = () => PolylineLike

export interface RouteOverlayStore{
  sync: (layers: RouteLayer[]) => void;
  destroy: () => void;
}

const DEFAULT_STROKE_OPACITY = 1
const DEFAULT_STROKE_STYLE: kakao.maps.StrokeStyles = 'solid'
const DEFAULT_Z_INDEX = 0

export function toStrokeOptions(style: RouteLayerStyle): RouteStrokeOptions{
  return {
    strokeColor: style.strokeColor,
    strokeWeight: style.strokeWeight,
    strokeOpacity: style.strokeOpacity ?? DEFAULT_STROKE_OPACITY,
    strokeStyle: style.strokeStyle ?? DEFAULT_STROKE_STYLE
  }
}

/** 레이어 하나가 조각 N개로 그려지므로 조각 단위로 키를 붙인다 */
const pieceKey = (layerId: string, index: number) => `${layerId}#${index}`

/**
 * 폴리라인 레이어를 reconciliation으로 관리한다(docs/MAP_RENDERING_GUIDE.md).
 * 같은 키가 다시 들어오면 인스턴스를 재사용해 `setPath`로 좌표만 바꾼다 —
 * 매초 좌표가 바뀌는 실시간 경로에서 파기·재생성을 막는 것이 이 스토어의 목적이다.
 */
export function createRouteOverlayStore(createPolyline: PolylineFactory, map: object): RouteOverlayStore{
  const pieces = new Map<string, PolylineLike>()

  const apply = (polyline: PolylineLike, layer: RouteLayer, path: LatLng[]) => {
    // 값이 그대로여도 매번 호출한다. 조건부로 만들면 무엇이 바뀌었는지 추적할 상태가 늘고
    // 그 상태를 빠뜨린 항목만 갱신 경로를 잃는다
    polyline.setPath(path)
    polyline.setOptions(toStrokeOptions(layer.style))
    polyline.setZIndex(layer.style.zIndex ?? DEFAULT_Z_INDEX)
    polyline.setMap(layer.visible === false ? null : map)
  }

  const remove = (key: string, polyline: PolylineLike) => {
    polyline.setMap(null)
    pieces.delete(key)
  }

  return {
    sync(layers){
      const liveKeys = new Set<string>()

      layers.forEach((layer) => {
        layer.paths.forEach((path, index) => {
          if(path.length < MIN_PATH_POINTS) {
            return
          }
          const key = pieceKey(layer.id, index)
          liveKeys.add(key)

          const existing = pieces.get(key)
          if(existing) {
            apply(existing, layer, path)
            return
          }

          const polyline = createPolyline()
          pieces.set(key, polyline)
          apply(polyline, layer, path)
        })
      })

      // 조기 return을 두면 레이어 0건일 때 여기를 건너뛰어 누수된다
      pieces.forEach((polyline, key) => {
        if(!liveKeys.has(key)) {
          remove(key, polyline)
        }
      })
    },
    destroy(){
      pieces.forEach((polyline) => polyline.setMap(null))
      pieces.clear()
    }
  }
}
