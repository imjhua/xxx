export type RouteLegendColor = {
  fill: string;
  border: string;
}

/**
 * 내비/주행 경로 맵 범례 색.
 * 위치상태·주행모니터링 맵 범례 공통 컴포넌트에서 사용한다.
 * 호출운행내역(LayerTogglePanel)과는 분리한다.
 */
export const ROUTE_LEGEND_COLOR = {
  navi: { fill: '#3496FF', border: '#004997' },
  driving: { fill: '#17C2A0', border: '#0E947C' }
} as const satisfies Record<string, RouteLegendColor>

/**
 * 내비·주행 경로 맵 선 두께. 줌과 무관하게 px 고정이다.
 * Figma ic_14_arrow · gap 16px 기준 — 화살표 오버레이(NaviRouteArrows)용, 현재 UI 미연동
 */
export const NAVI_ROUTE_MAP_STYLE = {
  strokeWeight: 6,
  outlineWeight: 8,
  arrowSpacingPixels: 16,
  /** ic_14_arrow 내부 Fill 1 실제 크기 (컴포넌트 프레임 14×14) */
  arrowSize: 6,
  arrowScale: 0.7,
  arrowEdgeMarginPixels: 18
} as const

/** 꼭짓점 줄이기 임계값. 미터로 두면 축소할 때 실효값이 픽셀 이하로 떨어져 효과가 사라진다 */
export const ROUTE_SIMPLIFY_TOLERANCE_PIXELS = 1

export const toSimplifyToleranceMeters = (tolerancePixels: number, metersPerPixel: number) =>
  tolerancePixels * metersPerPixel

/**
 * 경로를 진행 방향 오른쪽으로 밀 폭. 왕복이면 두 통과분이 반대쪽으로 물러나므로
 * 화면 이격은 이 값의 2배 = 외곽선 두께가 되고, 두 외곽선 사이 테두리가 이음선이 된다
 */
export const toTravelSideOffsetMeters = (outlineWeight: number, metersPerPixel: number) =>
  (outlineWeight / 2) * metersPerPixel

/** 검증·테스트용 기준 지도 레벨 */
export const REFERENCE_MAP_LEVEL = 5

export type RouteStrokeWeights = {
  strokeWeight: number;
  /** 중심선 +2. 차이가 2가 아니면 테두리 여백 1px이 깨진다 */
  outlineWeight: number;
}

/** 내비·주행·재탐색 전부 같은 px 두께. 줌과 무관하다 */
export const toRouteWeights = (): RouteStrokeWeights => {
  const { strokeWeight, outlineWeight } = NAVI_ROUTE_MAP_STYLE

  return { strokeWeight, outlineWeight }
}
