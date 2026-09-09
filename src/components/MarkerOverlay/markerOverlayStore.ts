import type { LatLng } from '@/lib/utils/route'

import type { PinSpec } from './createPinImage'

export interface MarkerLayer{
  /** 마커 정체성. 좌표로 만들면 위치가 바뀔 때마다 재생성된다 */
  id: string;
  position: LatLng;
  pin: PinSpec;
  zIndex?: number;
  /** false면 인스턴스는 남기고 지도에서만 뗀다(토글 off→on 재생성 방지) */
  visible?: boolean;
}

/** kakao.maps.Marker에서 쓰는 부분만. 노드 테스트가 가짜를 넣을 수 있게 좁혀 둔다 */
export interface MarkerLike{
  setPosition: (position: LatLng) => void;
  /** 이미지 생성·캐시는 어댑터 몫이라 스토어는 스펙만 넘긴다 */
  setPin: (pin: PinSpec) => void;
  setZIndex: (zIndex: number) => void;
  setMap: (map: object | null) => void;
}

export type MarkerFactory = () => MarkerLike

export interface MarkerOverlayStore{
  sync: (layers: MarkerLayer[]) => void;
  destroy: () => void;
}

/** RouteOverlay 기본값이 0이라 그 위에 둔다(경로선 < 마커) */
const DEFAULT_Z_INDEX = 10

/**
 * 핀 마커를 reconciliation으로 관리한다(docs/MAP_RENDERING_GUIDE.md).
 * 같은 id가 다시 들어오면 인스턴스를 재사용해 좌표·이미지만 바꾼다.
 */
export function createMarkerOverlayStore(createMarker: MarkerFactory, map: object): MarkerOverlayStore{
  const markers = new Map<string, MarkerLike>()

  const apply = (marker: MarkerLike, layer: MarkerLayer) => {
    marker.setPosition(layer.position)
    marker.setPin(layer.pin)
    marker.setZIndex(layer.zIndex ?? DEFAULT_Z_INDEX)
    marker.setMap(layer.visible === false ? null : map)
  }

  return {
    sync(layers){
      const liveIds = new Set<string>()

      layers.forEach((layer) => {
        liveIds.add(layer.id)

        const existing = markers.get(layer.id)
        if(existing) {
          apply(existing, layer)
          return
        }

        const marker = createMarker()
        markers.set(layer.id, marker)
        apply(marker, layer)
      })

      markers.forEach((marker, id) => {
        if(!liveIds.has(id)) {
          marker.setMap(null)
          markers.delete(id)
        }
      })
    },
    destroy(){
      markers.forEach((marker) => marker.setMap(null))
      markers.clear()
    }
  }
}
