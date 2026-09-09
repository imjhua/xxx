import { PIN_TYPES, type ResearchLabelPlacement } from '@/components/MarkerOverlay/createPinImage'
import type { MarkerLayer } from '@/components/MarkerOverlay/markerOverlayStore'
import type { MapView } from '@/components/RouteOverlay/RouteOverlay'
import { type RouteLayer } from '@/components/RouteOverlay/routeOverlayStore'
import {
  ROUTE_SIMPLIFY_TOLERANCE_PIXELS, type RouteStrokeWeights,
  toRouteWeights, toSimplifyToleranceMeters, toTravelSideOffsetMeters
} from '@/config/route-legend'
import {
  DrivingPoint, LatLng, offsetToTravelSideOnOverlap, roundTripOverlapOptionsFor, simplifyPath,
  splitDrivingByMode
} from '@/lib/utils/route'

import { LAYER_COLOR, type LayerColor } from '../config/layerColor'
import { INITIAL_SEQUENCE, type RouteLayerState } from './routeTrace'

/** 경로선 위. 출도착 핀보다 위에 둔다 */
const RESEARCH_MARKER_Z_INDEX = 110

/** 재탐색 핀 아래 (시안 순서) */
const ENDPOINT_MARKER_Z_INDEX = 100

/** 2겹으로 펼치기 전 단계. 좌표·색만 있고 두께는 지도 레벨을 알 때 붙는다 */
export interface StyledLayer{
  id: string;
  /** 한 레이어가 조각 여러 개로 끊길 수 있다 */
  paths: LatLng[][];
  color: LayerColor;
}

/** 스토어가 두 인스턴스로 갈라 잡게 id를 다르게 준다 — 같으면 한쪽이 덮어써 테두리가 사라진다 */
const toOutlineId = (id: string) => `${id}-outline`

const toOutline = (
  { id, paths, color }: StyledLayer, zIndex: number, { outlineWeight }: RouteStrokeWeights
): RouteLayer => ({
  id: toOutlineId(id),
  paths,
  style: { strokeColor: color.border, strokeWeight: outlineWeight, zIndex }
})

const toCenter = (
  { id, paths, color }: StyledLayer, zIndex: number, { strokeWeight }: RouteStrokeWeights
): RouteLayer => ({
  id,
  paths,
  style: { strokeColor: color.fill, strokeWeight, zIndex }
})

/** Polyline에 테두리 속성이 없어 굵은 선(외곽선) 위에 얇은 선(중심선)을 겹쳐 흉내낸다 */
const toOutlinedLayers = (
  routes: StyledLayer[][],
  weightsFor: (route: StyledLayer[]) => RouteStrokeWeights
): RouteLayer[] => {
  let next = 0

  return routes.flatMap((route) => {
    const weights = weightsFor(route)
    // 경로마다 외곽선·중심선을 붙여 쌓는다 — 떨어뜨리면 남의 중심선이 내 테두리를 덮는다
    const outlines = route.map((layer, index) => toOutline(layer, next + index, weights))
    // 한 경로 안(주행 구간들)은 붙이지 않는다 — 이음새에서 뒤 구간 외곽선이 앞 구간 채움을 파고든다
    const centers = route.map((layer, index) => toCenter(layer, next + route.length + index, weights))

    next += route.length * 2

    return [...outlines, ...centers]
  })
}

/** 주행 경로 꼭짓점 줄이기 tolerance(px). 내비는 원본 좌표를 그대로 쓴다 */
export interface RouteTolerances{
  driving: number;
}

const DEFAULT_TOLERANCES: RouteTolerances = {
  driving: ROUTE_SIMPLIFY_TOLERANCE_PIXELS
}

interface OffsetShaping{
  /** 0이면 오프셋을 걸지 않는다 */
  offsetMeters: number;
}

interface PathShaping extends OffsetShaping{
  toleranceMeters: number;
}

/** 내비는 원본 좌표를 유지하고, 왕복 중심선이 겹치는 구간만 오프셋으로 분리한다 */
const toNaviDrawnPath = (path: LatLng[], { offsetMeters }: OffsetShaping) =>
  offsetToTravelSideOnOverlap(path, offsetMeters, roundTripOverlapOptionsFor('navi'))

/**
 * 주행 궤적은 꼭짓점 줄이기가 먼저다 — 오프셋이 점 수에 비례해 싸진다.
 * 오프셋이 좌표를 옮기므로 원본 기준 이탈은 `tolerance + 오프셋`이다
 */
const toDrivingDrawnPath = (path: LatLng[], { toleranceMeters, offsetMeters }: PathShaping) =>
  offsetToTravelSideOnOverlap(
    simplifyPath(path, toleranceMeters),
    offsetMeters,
    roundTripOverlapOptionsFor('driving')
  )

const toNaviStyledLayers = (layer: RouteLayerState, shaping: OffsetShaping): StyledLayer[] => {
  if(!layer.checked || layer.detail?.status !== 'ready') {
    return []
  }

  return [{
    id: `navi-${layer.routeId}`,
    paths: [toNaviDrawnPath(layer.detail.path, shaping)],
    color: layer.sequence === INITIAL_SEQUENCE ? LAYER_COLOR.naviInitial : LAYER_COLOR.reroute
  }]
}

/** Polyline이 단색만 지원해 모드가 바뀔 때마다 끊는다. 구간을 안 묶어야 배열 순서가 주행 시간순이 된다 */
const toDrivingStyledLayers = (
  points: DrivingPoint[], checked: boolean, shaping: PathShaping
): StyledLayer[] => {
  if(!checked) {
    return []
  }

  // 과거 경로는 좌표가 고정이라 구간 index를 키로 써도 재생성되지 않는다.
  // 좌표 가공은 구간을 나눈 뒤에 건다 — 먼저 걸면 모드 경계 좌표가 지워진다
  return splitDrivingByMode(points).map((segment, index) => ({
    id: `driving-${index}`,
    paths: [toDrivingDrawnPath(segment.path, shaping)],
    color: segment.auto ? LAYER_COLOR.drivingAuto : LAYER_COLOR.drivingManual
  }))
}

export interface RouteLayerSource{
  drivingPoints: DrivingPoint[];
  drivingChecked: boolean;
  naviLayers: RouteLayerState[];
  /** 생략하면 화면 기본값. 검증 화면만 넘긴다 */
  tolerances?: RouteTolerances;
  /** 진행방향 우측 오프셋. 검증 화면에서 끄고 비교한다 */
  offsetEnabled?: boolean;
}

/** 위에서부터 주행 > 최초 > 재탐색1 > 재탐색2… 순이라 늦은 재탐색부터 깐다 */
const toStackOrder = (naviLayers: RouteLayerState[]) =>
  [...naviLayers].sort((a, b) => b.sequence - a.sequence)

/** 좌표·색까지 만든다. 주행 tolerance·오프셋은 픽셀 기준이라 줌이 바뀌면 좌표가 다시 계산된다 */
export const toStyledRoutes = (
  {
    drivingPoints, drivingChecked, naviLayers,
    tolerances = DEFAULT_TOLERANCES, offsetEnabled = true
  }: RouteLayerSource,
  { metersPerPixel }: MapView
): StyledLayer[][] => {
  const { outlineWeight } = toRouteWeights()
  const offsetMeters = offsetEnabled
    ? toTravelSideOffsetMeters(outlineWeight, metersPerPixel)
    : 0

  return [
    // map에 함수를 그대로 넘기면 두 번째 인자로 index가 들어가 shaping을 덮는다
    ...toStackOrder(naviLayers).map((layer) => toNaviStyledLayers(layer, { offsetMeters })),
    toDrivingStyledLayers(drivingPoints, drivingChecked, {
      toleranceMeters: toSimplifyToleranceMeters(tolerances.driving, metersPerPixel),
      offsetMeters
    })
  ]
}

/** 모든 경로 같은 px 고정 두께로 2겹을 펼친다 */
export const toRouteLayers = (routes: StyledLayer[][]): RouteLayer[] =>
  toOutlinedLayers(routes, () => toRouteWeights())

/** 내비 중심선 위 방향 화살표용 좌표. 오프셋은 줌·축척에 따라 다시 계산된다 */
export const toNaviArrowPaths = (
  { naviLayers, offsetEnabled = true }: Pick<RouteLayerSource, 'naviLayers' | 'offsetEnabled'>,
  { metersPerPixel }: MapView
): LatLng[][] => {
  const { outlineWeight } = toRouteWeights()
  const offsetMeters = offsetEnabled ? toTravelSideOffsetMeters(outlineWeight, metersPerPixel) : 0

  return toStackOrder(naviLayers)
    .flatMap((layer) => toNaviStyledLayers(layer, { offsetMeters }))
    .flatMap(({ paths }) => paths)
}

export interface EndpointSource{
  departure: LatLng | undefined;
  destination: LatLng | undefined;
}

/** 토글과 무관하게 항상 표시된다 */
export const toEndpointMarkers = ({ departure, destination }: EndpointSource): MarkerLayer[] => [
  ...(departure
    ? [{
      id: 'origin', position: departure, pin: { type: PIN_TYPES.ORIGIN }, zIndex: ENDPOINT_MARKER_Z_INDEX
    }]
    : []),
  ...(destination
    ? [{
      id: 'destination',
      position: destination,
      pin: { type: PIN_TYPES.DESTINATION },
      zIndex: ENDPOINT_MARKER_Z_INDEX
    }]
    : [])
]

/** 좌표가 화면 어디에 있는지 아는 쪽(지도)이 말풍선 방향을 정한다 */
export type PlacementResolver = (position: LatLng) => ResearchLabelPlacement

const placeAbove: PlacementResolver = () => 'above'

/** 재탐색이 일어난 지점. 위치는 그 경로의 첫 좌표, 번호는 sequence 그대로다 */
const toResearchMarker = (layer: RouteLayerState, placementOf: PlacementResolver): MarkerLayer[] => {
  // 선 없이 마커만 뜨면 경로가 있는 것으로 오독된다
  if(layer.sequence === INITIAL_SEQUENCE || !layer.checked || layer.detail?.status !== 'ready') {
    return []
  }

  const { startPoint } = layer.detail

  return [{
    id: `research-${layer.routeId}`,
    position: startPoint,
    pin: {
      type: PIN_TYPES.RESEARCH,
      index: layer.sequence,
      labelPlacement: placementOf(startPoint),
      variant: 'badge'
    },
    zIndex: RESEARCH_MARKER_Z_INDEX
  }]
}

/** 폴리라인과 같은 토글을 따른다 */
export const toResearchMarkers = (
  naviLayers: RouteLayerState[],
  placementOf: PlacementResolver = placeAbove
): MarkerLayer[] => naviLayers.flatMap((layer) => toResearchMarker(layer, placementOf))
