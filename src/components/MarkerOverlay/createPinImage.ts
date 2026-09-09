/**
 * 지도 핀 이미지 4종. 크기를 함께 돌려주는 이유는 선언 크기와 SVG 크기가 어긋나면
 * 마커가 늘어나 보이기 때문(apps/demo markerConfig가 그 상태다).
 */

export const PIN_TYPES = {
  DISPATCH: 'dispatch',
  ORIGIN: 'origin', // PICKUP
  DESTINATION: 'destination',
  RESEARCH: 'research'
} as const

export type PinType = (typeof PIN_TYPES)[keyof typeof PIN_TYPES]
export type LabelPinType = Exclude<PinType, typeof PIN_TYPES.RESEARCH>

/** 뱃지가 좌표에 붙고 라벨만 뒤집힌다. 어느 쪽에 둘지는 뷰포트를 아는 호출자가 정한다 */
export type ResearchLabelPlacement = 'above' | 'below'

/** badge=숫자 뱃지만, callout=말풍선+뱃지, bubble=말풍선만(오버레이용) */
export type ResearchPinVariant = 'badge' | 'callout' | 'bubble'

export type PinSpec
  = | { type: LabelPinType }
  | {
    type: typeof PIN_TYPES.RESEARCH;
    index: number;
    labelPlacement?: ResearchLabelPlacement;
    variant?: ResearchPinVariant;
  }

export interface PinImage{
  src: string;
  width: number;
  height: number;
  /** 좌표가 붙는 지점(이미지 좌상단 기준) — 라벨 핀은 끝점, 재탐색은 뱃지 중심 */
  anchorX: number;
  anchorY: number;
}

const FONT_SIZE = 14
/** data URI SVG는 페이지 웹폰트를 못 읽어 로컬에 있는 폰트로만 그려진다 */
const FONT_STACK = 'Roboto, Apple SD Gothic Neo, -apple-system, BlinkMacSystemFont, sans-serif'

/* ── SVG 조각 ── */

interface RectProps{
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  radius?: number;
  stroke?: string;
}

const rect = ({ x, y, width, height, fill, radius = 0, stroke }: RectProps) =>
  `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="${fill}"`
  + `${stroke ? ` stroke="${stroke}" stroke-width="1"` : ''}/>`

const circle = (centerX: number, centerY: number, radius: number, fill: string) =>
  `<circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="${fill}"/>`

/** 밑변이 baseY에 놓이고 꼭짓점이 tipY를 향하는 이등변삼각형 */
const triangle = (centerX: number, baseY: number, tipY: number, width: number, fill: string) =>
  `<path d="M${centerX - width / 2} ${baseY}L${centerX + width / 2} ${baseY}L${centerX} ${tipY}Z" fill="${fill}"/>`

// dominant-baseline은 렌더러마다 기준선이 달라 글자가 위로 뜬다(18px 뱃지에서 확인)
const TEXT_BASELINE_SHIFT = '0.37em'

const text = (centerX: number, centerY: number, content: string, weight: number, size = FONT_SIZE) =>
  `<text x="${centerX}" y="${centerY}" dy="${TEXT_BASELINE_SHIFT}" font-family="${FONT_STACK}" font-size="${size}"`
  + ` font-weight="${weight}" fill="#FFFFFF" text-anchor="middle">${content}</text>`

function toPinImage(width: number, height: number, anchorX: number, anchorY: number, body: string): PinImage{
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`

  return {
    src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    width,
    height,
    anchorX,
    anchorY
  }
}

/* ── 배차 위치·출발지·도착지 ── */

/** 라벨이 고정 문자열이라 폭도 피그마 실측값을 그대로 쓴다 */
const LABEL_PINS: Record<LabelPinType, { label: string; color: string; boxWidth: number }> = {
  [PIN_TYPES.DISPATCH]: { label: '배차 위치', color: '#014B98', boxWidth: 71 },
  [PIN_TYPES.ORIGIN]: { label: '출발지', color: '#262D39', boxWidth: 56 },
  [PIN_TYPES.DESTINATION]: { label: '도착지', color: '#D12020', boxWidth: 56 }
}

/** 세로로 여백 2 + 박스 30 + 줄기 12 + 끝점 = 프레임 48 */
const LABEL_PIN = {
  edge: 2,
  boxHeight: 30,
  boxRadius: 2,
  border: 'rgba(38,45,57,0.32)',
  fontWeight: 500,
  stemWidth: 2,
  stemHeight: 12,
  tipRadius: 2
}

function createLabelPin(type: LabelPinType): PinImage{
  const { label, color, boxWidth } = LABEL_PINS[type]
  const { edge, boxHeight, stemWidth, stemHeight, tipRadius } = LABEL_PIN

  const width = boxWidth + edge * 2
  const centerX = width / 2
  const boxBottom = edge + boxHeight
  const tipY = boxBottom + stemHeight
  const height = tipY + tipRadius + edge

  const box = rect({
    x: edge, y: edge, width: boxWidth, height: boxHeight, fill: color, radius: LABEL_PIN.boxRadius, stroke: LABEL_PIN.border
  })
  const stem = rect({
    x: centerX - stemWidth / 2, y: boxBottom, width: stemWidth, height: stemHeight, fill: color
  })
  const tip = circle(centerX, tipY, tipRadius, color)
  const caption = text(centerX, edge + boxHeight / 2, label, LABEL_PIN.fontWeight)

  return toPinImage(width, height, centerX, tipY, box + stem + tip + caption)
}

/* ── 재탐색 지점 ── */

/** 세로로 말풍선 36 + 꼬리 6 + 간격 4 + 뱃지 18 = 프레임 64 */
const RESEARCH_PIN = {
  color: '#7C5CFF',
  boxHeight: 36,
  boxRadius: 8,
  tailWidth: 12,
  tailHeight: 6,
  /** body2_14 — 라벨 핀의 500과 다르다 */
  fontWeight: 400,
  gap: 4,
  badgeSize: 18,
  /** 흰 테두리는 획이 아니라 뱃지 안쪽에 겹쳐 그리는 원으로 만든다 */
  badgeInnerSize: 16,
  /** caption1_12B */
  badgeFontSize: 12,
  badgeFontWeight: 700
}

/** 가로 폭 = "재탐색 지점" 92 + 번호 자리 */
const RESEARCH_TEXT = { baseWidth: 92, spaceWidth: 4, digitWidth: 8 }

/** 말풍선이 좌표에서 뻗는 높이. 지도 가장자리까지 이만큼 없으면 잘리므로 방향을 뒤집는다 */
export const RESEARCH_LABEL_CLEARANCE = RESEARCH_PIN.boxHeight
  + RESEARCH_PIN.tailHeight
  + RESEARCH_PIN.gap
  + RESEARCH_PIN.badgeSize / 2

function createResearchBadge(index: number): PinImage{
  const { color, badgeSize, badgeInnerSize, badgeFontSize, badgeFontWeight } = RESEARCH_PIN
  const center = badgeSize / 2

  const badgeRing = circle(center, center, badgeSize / 2, '#FFFFFF')
  const badge = circle(center, center, badgeInnerSize / 2, color)
  const number = text(center, center, String(index), badgeFontWeight, badgeFontSize)

  return toPinImage(badgeSize, badgeSize, center, center, badgeRing + badge + number)
}

function createResearchCallout(index: number, labelPlacement: ResearchLabelPlacement): PinImage{
  const { color, boxHeight, tailWidth, tailHeight, gap, badgeSize } = RESEARCH_PIN

  const width = RESEARCH_TEXT.baseWidth + RESEARCH_TEXT.spaceWidth + String(index).length * RESEARCH_TEXT.digitWidth
  const centerX = width / 2
  const height = boxHeight + tailHeight + gap + badgeSize

  // 뱃지가 좌표에 붙으므로 말풍선만 위아래로 옮긴다
  const labelAbove = labelPlacement === 'above'
  const boxTop = labelAbove ? 0 : badgeSize + gap + tailHeight
  const badgeY = labelAbove ? height - badgeSize / 2 : badgeSize / 2
  const tailBase = labelAbove ? boxTop + boxHeight : boxTop
  const tailTip = labelAbove ? tailBase + tailHeight : tailBase - tailHeight

  const bubble = rect({
    x: 0, y: boxTop, width, height: boxHeight, fill: color, radius: RESEARCH_PIN.boxRadius
  })
  const tail = triangle(centerX, tailBase, tailTip, tailWidth, color)
  const caption = text(centerX, boxTop + boxHeight / 2, `재탐색 ${index} 지점`, RESEARCH_PIN.fontWeight)
  const badgeRing = circle(centerX, badgeY, badgeSize / 2, '#FFFFFF')
  const badge = circle(centerX, badgeY, RESEARCH_PIN.badgeInnerSize / 2, color)
  const number = text(centerX, badgeY, String(index), RESEARCH_PIN.badgeFontWeight, RESEARCH_PIN.badgeFontSize)

  return toPinImage(width, height, centerX, badgeY, bubble + tail + caption + badgeRing + badge + number)
}

/** 뱃지 오버레이와 겹치지 않게 말풍선만 그린다 */
function createResearchBubble(index: number, labelPlacement: ResearchLabelPlacement): PinImage{
  const { color, boxHeight, tailWidth, tailHeight } = RESEARCH_PIN
  const width = RESEARCH_TEXT.baseWidth + RESEARCH_TEXT.spaceWidth + String(index).length * RESEARCH_TEXT.digitWidth
  const centerX = width / 2
  const height = boxHeight + tailHeight
  const labelAbove = labelPlacement === 'above'

  const boxTop = labelAbove ? 0 : tailHeight
  const tailBase = labelAbove ? boxHeight : tailHeight
  const tailTip = labelAbove ? height : 0
  const anchorY = labelAbove ? height : 0

  const bubble = rect({
    x: 0, y: boxTop, width, height: boxHeight, fill: color, radius: RESEARCH_PIN.boxRadius
  })
  const tail = triangle(centerX, tailBase, tailTip, tailWidth, color)
  const caption = text(centerX, boxTop + boxHeight / 2, `재탐색 ${index} 지점`, RESEARCH_PIN.fontWeight)

  return toPinImage(width, height, centerX, anchorY, bubble + tail + caption)
}

/** bubble 오버레이를 뱃지에서 띄울 px. 꼬리 끝이 뱃지 가장자리에 닿도록 */
export const RESEARCH_BUBBLE_GAP = RESEARCH_PIN.gap

const DEFAULT_LABEL_PLACEMENT: ResearchLabelPlacement = 'above'
const DEFAULT_RESEARCH_VARIANT: ResearchPinVariant = 'badge'

/** 이미지 재생성을 막는 캐시 키 */
export function pinCacheKey(spec: PinSpec){
  if(spec.type !== PIN_TYPES.RESEARCH) {
    return spec.type
  }
  const variant = spec.variant ?? DEFAULT_RESEARCH_VARIANT
  if(variant === 'badge') {
    return `${spec.type}:${spec.index}:badge`
  }
  if(variant === 'bubble') {
    return `${spec.type}:${spec.index}:bubble:${spec.labelPlacement ?? DEFAULT_LABEL_PLACEMENT}`
  }
  return `${spec.type}:${spec.index}:callout:${spec.labelPlacement ?? DEFAULT_LABEL_PLACEMENT}`
}

export function createPinImage(spec: PinSpec): PinImage{
  if(spec.type === PIN_TYPES.RESEARCH) {
    const variant = spec.variant ?? DEFAULT_RESEARCH_VARIANT
    if(variant === 'badge') {
      return createResearchBadge(spec.index)
    }
    if(variant === 'bubble') {
      return createResearchBubble(spec.index, spec.labelPlacement ?? DEFAULT_LABEL_PLACEMENT)
    }
    return createResearchCallout(spec.index, spec.labelPlacement ?? DEFAULT_LABEL_PLACEMENT)
  }
  return createLabelPin(spec.type)
}
