import type { LatLng } from '@/lib/utils/route'

import { buildRouteArrowPlacementTransform, getRouteArrowRenderSize, ROUTE_ARROW_PATH, ROUTE_ARROW_VIEW_BOX } from './routeArrowShape'

export type PixelArrowMarker = {
  x: number;
  y: number;
  rotation: number;
}

type PixelPoint = {
  x: number;
  y: number;
}

function calculatePixelBearing(from: PixelPoint, to: PixelPoint): number{
  const bearing = (Math.atan2(to.x - from.x, -(to.y - from.y)) * 180) / Math.PI

  return (bearing + 360) % 360
}

export function generateArrowPixelMarkers(
  path: LatLng[],
  toPixelPoint: (coordinate: LatLng) => PixelPoint,
  spacingPixels: number,
  edgeMarginPixels: number
): PixelArrowMarker[]{
  if(path.length < 2){
    return []
  }

  const segments = path.slice(0, -1).map((from, index) => {
    const fromPoint = toPixelPoint(from)
    const toPoint = toPixelPoint(path[index + 1]!)

    return {
      fromPoint,
      toPoint,
      distance: Math.hypot(toPoint.x - fromPoint.x, toPoint.y - fromPoint.y)
    }
  })
  const totalDistance = segments.reduce((sum, segment) => sum + segment.distance, 0)
  const arrows: PixelArrowMarker[] = []
  let accumulatedDistance = 0
  let nextArrowDistance = edgeMarginPixels

  segments.forEach(({ fromPoint, toPoint, distance }) => {
    if(distance === 0){
      return
    }

    while (nextArrowDistance < accumulatedDistance + distance
      && nextArrowDistance <= totalDistance - edgeMarginPixels){
      const t = (nextArrowDistance - accumulatedDistance) / distance
      arrows.push({
        x: fromPoint.x + (toPoint.x - fromPoint.x) * t,
        y: fromPoint.y + (toPoint.y - fromPoint.y) * t,
        rotation: calculatePixelBearing(fromPoint, toPoint)
      })
      nextArrowDistance += spacingPixels
    }

    accumulatedDistance += distance
  })

  return arrows
}

export function appendRouteArrowToSvg(
  parent: SVGGElement,
  arrow: PixelArrowMarker,
  arrowSize: number,
  scale: number
): void{
  const size = getRouteArrowRenderSize(arrowSize, scale)
  const half = size / 2

  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  group.setAttribute('transform', buildRouteArrowPlacementTransform(arrow.x, arrow.y, arrow.rotation))

  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  icon.setAttribute('x', String(-half))
  icon.setAttribute('y', String(-half))
  icon.setAttribute('width', String(size))
  icon.setAttribute('height', String(size))
  icon.setAttribute('viewBox', ROUTE_ARROW_VIEW_BOX)
  icon.setAttribute('overflow', 'visible')

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttribute('d', ROUTE_ARROW_PATH)
  path.setAttribute('fill', '#FFFFFF')
  path.setAttribute('fill-rule', 'evenodd')
  path.setAttribute('clip-rule', 'evenodd')

  icon.appendChild(path)
  group.appendChild(icon)
  parent.appendChild(group)
}

export function buildRouteArrowsSvg(
  arrows: PixelArrowMarker[],
  width: number,
  height: number,
  arrowSize: number,
  scale: number
): SVGSVGElement{
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
  svg.setAttribute('width', String(width))
  svg.setAttribute('height', String(height))
  svg.style.position = 'absolute'
  svg.style.top = '0'
  svg.style.left = '0'
  svg.style.overflow = 'visible'
  svg.style.pointerEvents = 'none'

  const layer = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  arrows.forEach((arrow) => appendRouteArrowToSvg(layer, arrow, arrowSize, scale))
  svg.appendChild(layer)

  return svg
}
