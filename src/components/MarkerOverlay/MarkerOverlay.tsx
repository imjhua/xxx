import { useEffect, useRef } from 'react'

import { useKakaoMap } from '@/context/KakaoMap'

import { createPinImage, PIN_TYPES, pinCacheKey, type PinSpec } from './createPinImage'
import {
  createMarkerOverlayStore,
  MarkerFactory,
  MarkerLayer,
  MarkerOverlayStore
} from './markerOverlayStore'
import { createResearchPinOverlayStore, ResearchPinOverlayStore } from './researchPinOverlayStore'

type Props = {
  layers: MarkerLayer[];
}

const pinImages = new Map<string, kakao.maps.MarkerImage>()

function getPinImage(pin: PinSpec){
  const key = pinCacheKey(pin)
  const cached = pinImages.get(key)
  if(cached) {
    return cached
  }

  const { src, width, height, anchorX, anchorY } = createPinImage(pin)
  const image = new kakao.maps.MarkerImage(
    src,
    new kakao.maps.Size(width, height),
    { offset: new kakao.maps.Point(anchorX, anchorY) }
  )
  pinImages.set(key, image)
  return image
}

const createKakaoMarker: MarkerFactory = () => {
  const marker = new kakao.maps.Marker({ position: new kakao.maps.LatLng(0, 0), clickable: true })

  return {
    setPosition: ({ lat, lng }) => marker.setPosition(new kakao.maps.LatLng(lat, lng)),
    setPin: (pin) => marker.setImage(getPinImage(pin)),
    setZIndex: (zIndex) => marker.setZIndex(zIndex),
    setMap: (target) => marker.setMap(target as kakao.maps.Map | null)
  }
}

const isResearchLayer = (layer: MarkerLayer) => layer.pin.type === PIN_TYPES.RESEARCH

/**
 * 출도착 핀은 Marker, 재탐색 핀은 CustomOverlay(18px 뱃지 + DOM hover)로 그린다.
 */
export function MarkerOverlay({ layers }: Props){
  const map = useKakaoMap()
  const markerStoreRef = useRef<MarkerOverlayStore | null>(null)
  const researchStoreRef = useRef<ResearchPinOverlayStore | null>(null)

  useEffect(() => {
    const markerStore = createMarkerOverlayStore(createKakaoMarker, map)
    const researchStore = createResearchPinOverlayStore(map)
    markerStoreRef.current = markerStore
    researchStoreRef.current = researchStore

    return () => {
      markerStore.destroy()
      researchStore.destroy()
      markerStoreRef.current = null
      researchStoreRef.current = null
    }
  }, [map])

  useEffect(() => {
    markerStoreRef.current?.sync(layers.filter((layer) => !isResearchLayer(layer)))
    researchStoreRef.current?.sync(layers.filter(isResearchLayer))
  }, [layers])

  useEffect(() => {
    const clearHover = () => researchStoreRef.current?.hideCallouts()

    kakao.maps.event.addListener(map, 'dragstart', clearHover)
    kakao.maps.event.addListener(map, 'zoom_changed', clearHover)

    return () => {
      kakao.maps.event.removeListener(map, 'dragstart', clearHover)
      kakao.maps.event.removeListener(map, 'zoom_changed', clearHover)
    }
  }, [map])

  return null
}
