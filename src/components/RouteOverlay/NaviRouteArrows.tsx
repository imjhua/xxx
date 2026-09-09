/** web 과거경로에는 아직 연동하지 않는다. demo 옵션·추후 실시간 경로용으로 보관 */

import { useEffect, useRef, useState } from 'react'

import type { RouteLayerSource } from '@/app/call/taxi/utils/routeLayers'
import { toNaviArrowPaths } from '@/app/call/taxi/utils/routeLayers'
import { toMapView } from '@/components/RouteOverlay/RouteOverlay'
import { NAVI_ROUTE_MAP_STYLE } from '@/config/route-legend'
import { useKakaoMap } from '@/context/KakaoMap'
import type { LatLng } from '@/lib/utils/route'
import { buildRouteArrowsSvg, generateArrowPixelMarkers } from '@/lib/utils/routeArrowPolyline'

type NaviRouteArrowsProps = {
  paths: LatLng[][];
}

type RouteNaviArrowsFromSourceProps = {
  source: RouteLayerSource;
}

function RouteArrowsOverlay({ path }: { path: LatLng[] }){
  const map = useKakaoMap()

  useEffect(() => {
    if(path.length < 2){
      return
    }

    class ArrowsOverlay extends kakao.maps.AbstractOverlay{
      private container!: HTMLDivElement

      onAdd(){
        this.container = document.createElement('div')
        this.container.style.position = 'absolute'
        this.container.style.pointerEvents = 'none'
        this.getPanels().overlayLayer.appendChild(this.container)
      }

      draw(){
        const mapInstance = this.getMap()
        if(!mapInstance){
          return
        }

        const mapNode = mapInstance.getNode()
        const width = mapNode.clientWidth
        const height = mapNode.clientHeight
        if(width === 0 || height === 0){
          return
        }

        this.container.style.left = '0px'
        this.container.style.top = '0px'
        this.container.style.width = `${width}px`
        this.container.style.height = `${height}px`
        this.container.style.zIndex = '20'

        const projection = this.getProjection()
        const toPixelPoint = (coordinate: LatLng) => {
          const point = projection.pointFromCoords(
            new window.kakao.maps.LatLng(coordinate.lat, coordinate.lng)
          )
          return { x: point.x, y: point.y }
        }
        const arrows = generateArrowPixelMarkers(
          path,
          toPixelPoint,
          NAVI_ROUTE_MAP_STYLE.arrowSpacingPixels,
          NAVI_ROUTE_MAP_STYLE.arrowEdgeMarginPixels
        )

        this.container.replaceChildren(
          buildRouteArrowsSvg(
            arrows,
            width,
            height,
            NAVI_ROUTE_MAP_STYLE.arrowSize,
            NAVI_ROUTE_MAP_STYLE.arrowScale
          )
        )
      }

      onRemove(){
        this.container.remove()
      }
    }

    const overlay = new ArrowsOverlay()
    overlay.setMap(map)

    return () => {
      overlay.setMap(null)
    }
  }, [map, path])

  return null
}

/** 내비 중심선 위 방향 화살표. 줌·이동 시 AbstractOverlay draw()로 갱신된다 */
export function NaviRouteArrows({ paths }: NaviRouteArrowsProps){
  return paths.map((path, index) => (
    <RouteArrowsOverlay key={index} path={path} />
  ))
}

/** 오프셋 좌표는 줌·축척에 따라 바뀌므로 idle마다 경로를 다시 만든다 */
export function RouteNaviArrowsFromSource({ source }: RouteNaviArrowsFromSourceProps){
  const map = useKakaoMap()
  const [paths, setPaths] = useState<LatLng[][]>([])
  const sourceRef = useRef(source)

  sourceRef.current = source

  useEffect(() => {
    const update = () => setPaths(toNaviArrowPaths(sourceRef.current, toMapView(map)))

    update()
    kakao.maps.event.addListener(map, 'zoom_changed', update)
    kakao.maps.event.addListener(map, 'idle', update)

    return () => {
      kakao.maps.event.removeListener(map, 'zoom_changed', update)
      kakao.maps.event.removeListener(map, 'idle', update)
    }
  }, [map, source])

  return <NaviRouteArrows paths={paths} />
}
