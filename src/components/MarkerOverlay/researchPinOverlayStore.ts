import {
  createPinImage,
  PIN_TYPES,
  type PinSpec,
  RESEARCH_BUBBLE_GAP,
  type ResearchLabelPlacement
} from './createPinImage'
import type { MarkerLayer } from './markerOverlayStore'

export interface ResearchPinOverlayStore{
  sync: (layers: MarkerLayer[]) => void;
  hideCallouts: () => void;
  destroy: () => void;
}

interface TrackedResearchPin{
  badgeOverlay: kakao.maps.CustomOverlay;
  hideCallout: () => void;
  detachHover: () => void;
  signature: string;
}

const DEFAULT_Z_INDEX = 10
const CALLOUT_Z_INDEX_BOOST = 10
const BADGE_SIZE = 18

function calloutOffsetY(placement: ResearchLabelPlacement){
  const offset = BADGE_SIZE / 2 + RESEARCH_BUBBLE_GAP
  return placement === 'above' ? -offset : offset
}

function isResearchPin(pin: PinSpec): pin is Extract<PinSpec, { type: typeof PIN_TYPES.RESEARCH }>{
  return pin.type === PIN_TYPES.RESEARCH
}

function layerSignature(layer: MarkerLayer){
  if(!isResearchPin(layer.pin)) {
    return ''
  }
  const placement = layer.pin.labelPlacement ?? 'above'
  return `${layer.id}:${layer.pin.index}:${placement}`
}

function createCalloutContent(src: string, width: number, height: number, placement: ResearchLabelPlacement){
  const root = document.createElement('div')
  root.style.pointerEvents = 'none'
  root.style.lineHeight = '0'
  root.style.width = `${width}px`
  root.style.height = `${height}px`
  root.style.transform = `translateY(${calloutOffsetY(placement)}px)`

  const img = document.createElement('img')
  img.src = src
  img.width = width
  img.height = height
  img.alt = ''
  img.draggable = false
  img.style.display = 'block'
  img.style.width = `${width}px`
  img.style.height = `${height}px`
  root.appendChild(img)

  return root
}

function createBadgeContent(src: string, width: number, height: number){
  const root = document.createElement('div')
  root.style.width = `${width}px`
  root.style.height = `${height}px`
  root.style.pointerEvents = 'auto'
  root.style.cursor = 'default'
  root.style.lineHeight = '0'

  const img = document.createElement('img')
  img.src = src
  img.width = width
  img.height = height
  img.alt = ''
  img.draggable = false
  img.style.display = 'block'
  img.style.width = `${width}px`
  img.style.height = `${height}px`
  img.style.pointerEvents = 'none'
  root.appendChild(img)

  return root
}

function createResearchPinOverlays(
  map: kakao.maps.Map,
  layer: MarkerLayer,
  position: kakao.maps.LatLng,
  zIndex: number,
  visible: boolean
){
  if(!isResearchPin(layer.pin)) {
    throw new Error('research pin layer expected')
  }

  const { index, labelPlacement = 'above' } = layer.pin
  const badge = createPinImage({ type: PIN_TYPES.RESEARCH, index, variant: 'badge' })
  const bubble = createPinImage({
    type: PIN_TYPES.RESEARCH, index, labelPlacement, variant: 'bubble'
  })

  let calloutOverlay: kakao.maps.CustomOverlay | null = null

  const hideCallout = () => {
    calloutOverlay?.setMap(null)
    calloutOverlay = null
  }

  const showCallout = () => {
    if(calloutOverlay) {
      calloutOverlay.setMap(visible ? map : null)
      return
    }

    calloutOverlay = new kakao.maps.CustomOverlay({
      map: visible ? map : undefined,
      position,
      content: createCalloutContent(bubble.src, bubble.width, bubble.height, labelPlacement),
      xAnchor: bubble.anchorX / bubble.width,
      yAnchor: bubble.anchorY / bubble.height,
      zIndex: zIndex + CALLOUT_Z_INDEX_BOOST,
      clickable: false
    })
  }

  const badgeRoot = createBadgeContent(badge.src, badge.width, badge.height)
  const onEnter = () => showCallout()
  const onLeave = () => hideCallout()
  badgeRoot.addEventListener('mouseenter', onEnter)
  badgeRoot.addEventListener('mouseleave', onLeave)

  const badgeOverlay = new kakao.maps.CustomOverlay({
    map: visible ? map : undefined,
    position,
    content: badgeRoot,
    xAnchor: 0.5,
    yAnchor: 0.5,
    zIndex,
    clickable: true
  })

  return {
    badgeOverlay,
    hideCallout,
    detachHover: () => {
      badgeRoot.removeEventListener('mouseenter', onEnter)
      badgeRoot.removeEventListener('mouseleave', onLeave)
    }
  }
}

/**
 * 재탐색 핀은 CustomOverlay + DOM hover로 그린다.
 * kakao.maps.Marker의 mouseover는 커스텀 MarkerImage(18px)에서 동작하지 않는다.
 */
export function createResearchPinOverlayStore(map: kakao.maps.Map): ResearchPinOverlayStore{
  const overlays = new Map<string, TrackedResearchPin>()

  const destroyOne = (id: string) => {
    const tracked = overlays.get(id)
    if(!tracked) {
      return
    }
    tracked.detachHover()
    tracked.hideCallout()
    tracked.badgeOverlay.setMap(null)
    overlays.delete(id)
  }

  return {
    sync(layers){
      const liveIds = new Set<string>()

      layers.forEach((layer) => {
        if(!isResearchPin(layer.pin)) {
          return
        }

        liveIds.add(layer.id)

        const position = new kakao.maps.LatLng(layer.position.lat, layer.position.lng)
        const zIndex = layer.zIndex ?? DEFAULT_Z_INDEX
        const visible = layer.visible !== false
        const signature = layerSignature(layer)

        const existing = overlays.get(layer.id)
        if(existing && existing.signature === signature) {
          existing.badgeOverlay.setPosition(position)
          existing.badgeOverlay.setZIndex(zIndex)
          existing.badgeOverlay.setMap(visible ? map : null)
          if(!visible) {
            existing.hideCallout()
          }
          return
        }

        if(existing) {
          destroyOne(layer.id)
        }

        const created = createResearchPinOverlays(map, layer, position, zIndex, visible)

        overlays.set(layer.id, {
          badgeOverlay: created.badgeOverlay,
          hideCallout: created.hideCallout,
          detachHover: created.detachHover,
          signature
        })
      })

      overlays.forEach((_tracked, id) => {
        if(!liveIds.has(id)) {
          destroyOne(id)
        }
      })
    },
    hideCallouts(){
      overlays.forEach((tracked) => tracked.hideCallout())
    },
    destroy(){
      [...overlays.keys()].forEach(destroyOne)
    }
  }
}
