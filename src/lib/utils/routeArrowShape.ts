/** Figma ic_14_arrow > Fill 1 (14×14 프레임 안 6×6, offset 4,8) */
export const ROUTE_ARROW_PATH = 'M7.44902 13.722L9.94702 8.72599C10.071 8.47798 9.97002 8.17699 9.72302 8.05299C9.59902 7.99099 9.45502 7.98299 9.32502 8.03099L7.17302 8.82099C7.06102 8.86199 6.93902 8.86199 6.82702 8.82099L4.67502 8.03099C4.41502 7.93499 4.12702 8.06799 4.03102 8.32799C3.98302 8.45799 3.99102 8.60198 4.05302 8.72599L6.55202 13.722C6.67502 13.97 6.97702 14.071 7.22402 13.947C7.32202 13.898 7.40102 13.819 7.44902 13.722Z'

export const ROUTE_ARROW_VIEW_BOX = '4 8 6 6'

export const ROUTE_ARROW_PIVOT = { x: 7, y: 11 } as const

export function toRouteArrowRotation(bearing: number): number{
  return (bearing - 180 + 360) % 360
}

export function buildRouteArrowPlacementTransform(x: number, y: number, bearing: number): string{
  const rotation = toRouteArrowRotation(bearing)
  return `translate(${x} ${y}) rotate(${rotation})`
}

export function getRouteArrowRenderSize(arrowSize: number, scale: number): number{
  return arrowSize * scale
}
