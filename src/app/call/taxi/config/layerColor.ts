export type LayerColor = {
  fill: string;
  border: string;
}

/**
 * 범례 스와치와 지도 폴리라인이 같이 쓴다.
 * route-legend의 관제 맵 색과 값이 겹치지만 참조하지 않는다 — 분리 결정(31ff3c27).
 */
export const LAYER_COLOR = {
  drivingAuto: { fill: '#17C2A0', border: '#0E947C' },
  drivingManual: { fill: '#838E9C', border: '#727E8F' },
  naviInitial: { fill: '#3496FF', border: '#004997' },
  reroute: { fill: '#7FB6FF', border: '#3496FF' }
} as const satisfies Record<string, LayerColor>
