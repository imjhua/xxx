export interface CoordinateResponse {
  latitude: number;
  longitude: number;
}

export interface TrajectoryPoint {
  coordinate: CoordinateResponse;
  timestamp: number;
  control_mode: string;
}

/** 검증을 통과한 지도 좌표(toLatLng 산출물). 오버레이가 API 스키마를 모르게 하는 경계다 */
export interface LatLng{
  lat: number;
  lng: number;
}

const CONTROL_MODE = { AUTO: 'AUTO', MANUAL: 'MANUAL' } as const

export const isAutoMode = (controlMode: string) => controlMode === CONTROL_MODE.AUTO

export interface DrivingPoint extends LatLng{
  auto: boolean;
}

/** 선을 그릴 수 있는 최소 점 수. 이보다 짧은 조각은 선이 그려지지 않아 오버레이도 만들지 않는다 */
export const MIN_PATH_POINTS = 2

const MAX_LATITUDE = 90
const MAX_LONGITUDE = 180

/** 국내 운행이라 위경도는 늘 양수다. 0·음수·범위 밖은 엉뚱한 곳에 찍힌다 */
const isUsable = (value: number | undefined, max: number): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= max

// 좌표 검증은 여기 한 곳에서만 한다. 못 쓸 좌표는 기본값으로 바꾸지 않고 버린다
export const toLatLng = (coordinate: Partial<CoordinateResponse> | undefined): LatLng | undefined => {
  // 스펙은 required지만 좌표 객체가 빠진 200을 받았다(254061eb)
  const { latitude, longitude } = coordinate ?? {}

  return isUsable(latitude, MAX_LATITUDE) && isUsable(longitude, MAX_LONGITUDE)
    ? { lat: latitude, lng: longitude }
    : undefined
}

export const toPath = (coordinates: Partial<CoordinateResponse>[]): LatLng[] => {
  return coordinates.map(toLatLng).filter((point): point is LatLng => point !== undefined)
}

export const toDrivingPoints = (points: TrajectoryPoint[]): DrivingPoint[] => {
  return points.flatMap((point) => {
    const latLng = toLatLng(point.coordinate)
    return latLng ? [{ ...latLng, auto: isAutoMode(point.control_mode) }] : []
  })
}

export interface DrivingSegment{
  auto: boolean;
  path: LatLng[];
}

// 카카오맵 Polyline이 단색만 지원해 주행모드 연속 구간으로 나눈다. 경계 좌표 공유는 route.test.ts 참고
export function splitDrivingByMode(points: DrivingPoint[]): DrivingSegment[]{
  if(points.length === 0) {
    return []
  }
  const toLatLngOnly = ({ lat, lng }: DrivingPoint): LatLng => ({ lat, lng })

  const segments: DrivingSegment[] = []
  let current: DrivingSegment = {
    auto: points[0]!.auto,
    path: [toLatLngOnly(points[0]!)]
  }

  for (let i = 1; i < points.length; i++) {
    const point = points[i]!
    current.path.push(toLatLngOnly(point))
    if(point.auto !== current.auto) {
      segments.push(current)
      current = { auto: point.auto, path: [toLatLngOnly(point)] }
    }
  }
  segments.push(current)
  return segments
}

const EARTH_RADIUS = 6371000

/** 경로가 짧아 등거리 근사로 충분하다. 첫 점 기준 평면 좌표(m) */
const toPlanar = (origin: LatLng, point: LatLng) => {
  const toRad = (degree: number) => (degree * Math.PI) / 180

  return {
    x: EARTH_RADIUS * toRad(point.lng - origin.lng) * Math.cos(toRad(origin.lat)),
    y: EARTH_RADIUS * toRad(point.lat - origin.lat)
  }
}

/** toPlanar의 역변환. 오프셋은 평면에서 밀고 좌표로 돌려놓는다 */
const fromPlanar = (origin: LatLng, { x, y }: Planar): LatLng => {
  const toDegree = (radian: number) => (radian * 180) / Math.PI
  const toRad = (degree: number) => (degree * Math.PI) / 180

  return {
    lat: origin.lat + toDegree(y / EARTH_RADIUS),
    lng: origin.lng + toDegree(x / (EARTH_RADIUS * Math.cos(toRad(origin.lat))))
  }
}

export const distanceMeters = (a: LatLng, b: LatLng) => {
  const { x, y } = toPlanar(a, b)

  return Math.hypot(x, y)
}

interface Planar{
  x: number;
  y: number;
}

/** 무한직선이 아니라 a~b 선분까지의 거리. 화면에 그려지는 건 선분이라 이탈도 선분 기준이어야 한다 */
const segmentDistanceMeters = (p: Planar, a: Planar, b: Planar) => {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const lengthSquared = dx * dx + dy * dy

  if(lengthSquared === 0) {
    return Math.hypot(p.x - a.x, p.y - a.y)
  }

  // 선분을 벗어난 발은 끝점으로 당긴다 — 안 당기면 연장선 위의 점이 거리 0으로 버려진다(왕복·오버슈트)
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSquared))

  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy)
}

/**
 * 꼭짓점을 줄인다(Douglas-Peucker). 선 두께보다 촘촘한 꼭짓점이 실루엣을 톱니로 만들어 줄인다.
 * 남기는 점은 전부 원본이고 이탈은 tolerance 이하로 제한된다.
 * 양 끝점은 항상 남으므로 구간별로 돌리면 경계 좌표가 보존된다(route.test.ts 참고).
 */
export function simplifyPath<T extends LatLng>(path: T[], toleranceMeters: number): T[]{
  // NaN·Infinity면 비교가 전부 false가 되어 경로가 양 끝 2점으로 조용히 붕괴한다
  if(!Number.isFinite(toleranceMeters) || toleranceMeters <= 0 || path.length < 3) {
    return path
  }

  const origin = path[0]!
  const planar = path.map((point) => toPlanar(origin, point))
  const keep = new Array<boolean>(path.length).fill(false)

  keep[0] = true
  keep[path.length - 1] = true

  // 좌표가 수천 개면 재귀는 스택을 넘길 수 있어 명시적 스택을 쓴다
  const stack: [number, number][] = [[0, path.length - 1]]

  while (stack.length > 0) {
    const [first, last] = stack.pop()!
    let farthest = -1
    let maxDistance = 0

    for (let i = first + 1; i < last; i++) {
      const distance = segmentDistanceMeters(planar[i]!, planar[first]!, planar[last]!)

      if(distance > maxDistance) {
        maxDistance = distance
        farthest = i
      }
    }

    if(farthest !== -1 && maxDistance > toleranceMeters) {
      keep[farthest] = true
      stack.push([first, farthest], [farthest, last])
    }
  }

  return path.filter((_, index) => keep[index])
}

/**
 * 진행 방향 오른쪽 단위벡터. 방향은 `radiusMeters` 이상 떨어진 앞뒤 점으로 잰다 —
 * 바로 옆 점으로 재면 정차 구간의 cm 단위 표류가 방향이 되어 점마다 다른 쪽으로 밀린다
 */
const rightNormal = (planar: Planar[], index: number, radiusMeters: number): Planar | undefined => {
  const here = planar[index]!
  const walk = (step: number) => {
    let cursor = index

    while (Math.hypot(planar[cursor]!.x - here.x, planar[cursor]!.y - here.y) < radiusMeters) {
      const next = cursor + step

      if(next < 0 || next >= planar.length) {
        break
      }
      cursor = next
    }

    return planar[cursor]!
  }

  const before = walk(-1)
  const after = walk(1)
  const dx = after.x - before.x
  const dy = after.y - before.y
  const length = Math.hypot(dx, dy)

  // 앞뒤가 같은 자리면 방향을 못 정한다 — 되돌아오는 정점이 여기 걸려 제자리에 남는다
  return length === 0 ? undefined : { x: dy / length, y: -dx / length }
}

/**
 * 경로 전체를 진행 방향 오른쪽으로 민다. 내비 원본은 양방향이 도로 중심선 하나를 공유해
 * 왕복 좌표가 완전히 같은데, 균일하게 밀면 두 통과분이 반대쪽으로 물러나 갈린다
 */
export function offsetToTravelSide(path: LatLng[], offsetMeters: number): LatLng[]{
  // NaN이면 전 좌표가 NaN이 되어 아무것도 그려지지 않는다
  if(!Number.isFinite(offsetMeters) || offsetMeters <= 0 || path.length < MIN_PATH_POINTS) {
    return path
  }

  const origin = path[0]!
  const planar = path.map((point) => toPlanar(origin, point))

  return planar.map((point, index) => {
    const normal = rightNormal(planar, index, offsetMeters)

    return normal
      ? fromPlanar(origin, { x: point.x + normal.x * offsetMeters, y: point.y + normal.y * offsetMeters })
      : path[index]!
  })
}

/** 누적 경로거리 기준 — 인덱스 간격이 아니라 경로거리로 재야 정차 구간 오판이 없다 */
const DEFAULT_MIN_PATH_SEPARATION_METERS = 80

const DEFAULT_MAX_LATERAL_SEPARATION_METERS = 8

const DEFAULT_MAX_SAME_DIRECTION_DOT = -0.3

const OVERLAP_COMPONENT_MAX_GAP_POINTS = 5

export interface RoundTripOverlapOptions{
  minPathSeparationMeters?: number;
  maxLateralSeparationMeters?: number;
  maxSameDirectionDot?: number;
}

export type RoutePathKind = 'navi' | 'driving'

export const NAVI_ROUND_TRIP_OVERLAP_OPTIONS: RoundTripOverlapOptions = {
  maxLateralSeparationMeters: 8
}

export const DRIVING_ROUND_TRIP_OVERLAP_OPTIONS: RoundTripOverlapOptions = {
  maxLateralSeparationMeters: 12
}

export const roundTripOverlapOptionsFor = (kind: RoutePathKind): RoundTripOverlapOptions =>
  kind === 'driving' ? DRIVING_ROUND_TRIP_OVERLAP_OPTIONS : NAVI_ROUND_TRIP_OVERLAP_OPTIONS

const segmentDirection = (path: LatLng[], index: number): Planar | undefined => {
  const before = path[Math.max(0, index - 1)]!
  const after = path[Math.min(path.length - 1, index + 1)]!
  const dx = after.lng - before.lng
  const dy = after.lat - before.lat
  const length = Math.hypot(dx, dy)

  return length === 0 ? undefined : { x: dx / length, y: dy / length }
}

export function findRoundTripOverlapMask(
  path: LatLng[],
  options: RoundTripOverlapOptions = {}
): boolean[]{
  const mask = Array.from({ length: path.length }, () => false)

  if(path.length < 3) {
    return mask
  }

  const minPathSeparation = options.minPathSeparationMeters ?? DEFAULT_MIN_PATH_SEPARATION_METERS
  const maxLateralSeparation = options.maxLateralSeparationMeters ?? DEFAULT_MAX_LATERAL_SEPARATION_METERS
  const maxSameDirectionDot = options.maxSameDirectionDot ?? DEFAULT_MAX_SAME_DIRECTION_DOT
  const origin = path[0]!
  const planar = path.map((point) => toPlanar(origin, point))
  const cumDist = Array.from({ length: path.length }, () => 0)

  for (let index = 1; index < path.length; index++) {
    const previous = planar[index - 1]!
    const current = planar[index]!

    cumDist[index] = cumDist[index - 1]! + Math.hypot(current.x - previous.x, current.y - previous.y)
  }

  const directions = path.map((_, index) => segmentDirection(path, index))

  for (let i = 0; i < path.length; i++) {
    const dirI = directions[i]
    const pI = planar[i]!

    if(!dirI) {
      continue
    }

    for (let j = i + 2; j < path.length; j++) {
      if(cumDist[j]! - cumDist[i]! < minPathSeparation) {
        continue
      }

      const pJ = planar[j]!

      if(Math.hypot(pJ.x - pI.x, pJ.y - pI.y) > maxLateralSeparation) {
        continue
      }

      const dirJ = directions[j]

      if(!dirJ) {
        continue
      }

      const directionDot = dirI.x * dirJ.x + dirI.y * dirJ.y

      if(directionDot > maxSameDirectionDot) {
        continue
      }

      mask[i] = true
      mask[j] = true
    }
  }

  return mask
}

const mergeOverlapComponents = (mask: boolean[]) => {
  const components: { start: number; end: number }[] = []
  let index = 0

  while (index < mask.length) {
    if(!mask[index]) {
      index++
      continue
    }

    const start = index

    while (index + 1 < mask.length && mask[index + 1]) {
      index++
    }

    components.push({ start, end: index })
    index++
  }

  if(components.length <= 1) {
    return components
  }

  const merged: { start: number; end: number }[] = [components[0]!]

  for (let componentIndex = 1; componentIndex < components.length; componentIndex++) {
    const previous = merged[merged.length - 1]!
    const current = components[componentIndex]!

    if(current.start - previous.end <= OVERLAP_COMPONENT_MAX_GAP_POINTS) {
      previous.end = current.end
      continue
    }

    merged.push(current)
  }

  return merged
}

/** 왕복 중심선이 겹치는 구간만 offset한다. 일방통행 직선은 원본 좌표를 유지한다 */
export function offsetToTravelSideOnOverlap(
  path: LatLng[],
  offsetMeters: number,
  options: RoundTripOverlapOptions = {}
): LatLng[]{
  if(!Number.isFinite(offsetMeters) || offsetMeters <= 0 || path.length < MIN_PATH_POINTS) {
    return path
  }

  const components = mergeOverlapComponents(findRoundTripOverlapMask(path, options))

  if(components.length === 0) {
    return path
  }

  const result: LatLng[] = []
  let cursor = 0

  for (const { start, end } of components) {
    result.push(...path.slice(cursor, start))
    result.push(...offsetToTravelSide(path.slice(start, end + 1), offsetMeters))
    cursor = end + 1
  }

  result.push(...path.slice(cursor))

  return result
}
