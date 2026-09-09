import { useEffect, useRef, useState } from 'react'

import { RESEARCH_LABEL_CLEARANCE } from '@/components/MarkerOverlay/createPinImage'
import { MarkerOverlay } from '@/components/MarkerOverlay/MarkerOverlay'
import { RouteOverlay } from '@/components/RouteOverlay/RouteOverlay'
import { KakaoMap, useKakaoMap } from '@/context/KakaoMap'
import { routeCheckMock } from '@/mockData/routeCheckMock'

import {
  EndpointSource,
  PlacementResolver,
  toEndpointMarkers,
  toResearchMarkers,
  toRouteLayers,
  toStyledRoutes
} from '../../utils/routeLayers'
import { collectFitPoints, type FitPointSource, NaviCheckedMap, RouteLayerState } from '../../utils/routeTrace'
import LayerTogglePanel from './LayerTogglePanel'
import { isRowLocked, toNaviLayerViews } from './layerView'

const APP_KEY = import.meta.env.VITE_ADMIN_APP_JS_KEY || '1fec6fe0d083f08f36263c8b7db592e0'

function useMapIdle(map: kakao.maps.Map){
  const [, setIdleCount] = useState(0)

  useEffect(() => {
    const bump = () => setIdleCount((prev) => prev + 1)

    kakao.maps.event.addListener(map, 'idle', bump)

    return () => kakao.maps.event.removeListener(map, 'idle', bump)
  }, [map])
}

function RouteMarkers({ naviLayers, departure, destination }: EndpointSource & { naviLayers: RouteLayerState[] }){
  const map = useKakaoMap()

  useMapIdle(map)

  const placementOf: PlacementResolver = ({ lat, lng }) => {
    const { y } = map.getProjection().containerPointFromCoords(new kakao.maps.LatLng(lat, lng))
    return y < RESEARCH_LABEL_CLEARANCE ? 'below' : 'above'
  }

  return (
    <MarkerOverlay
      layers={[...toResearchMarkers(naviLayers, placementOf), ...toEndpointMarkers({ departure, destination })]}
    />
  )
}

function FitBounds({
  departure, destination, drivingPoints, drivingVisible, naviLayers
}: FitPointSource){
  const map = useKakaoMap()
  const fitted = useRef(false)

  useEffect(() => {
    if(fitted.current) {
      return
    }

    const points = collectFitPoints({
      departure, destination, drivingPoints, drivingVisible, naviLayers
    })

    if(points.length === 0) {
      return
    }

    fitted.current = true

    map.setBounds(points.reduce((bounds, { lat, lng }) => {
      bounds.extend(new kakao.maps.LatLng(lat, lng))
      return bounds
    }, new kakao.maps.LatLngBounds()))
  }, [map, departure, destination, drivingPoints, drivingVisible, naviLayers])

  return null
}

export default function RouteCheckContent(){
  const { departure, destination, drivingPoints, naviLayers: initialNaviLayers } = routeCheckMock

  const [drivingChecked, setDrivingChecked] = useState(true)
  const [checkedMap, setCheckedMap] = useState<NaviCheckedMap>({})

  const naviLayers = initialNaviLayers.map((layer) => ({
    ...layer,
    checked: checkedMap[layer.routeId] ?? layer.checked
  }))

  const drivingHasRoute = drivingPoints.length > 0
  const drivingVisible = drivingChecked && drivingHasRoute
  const layerSource = { drivingPoints, drivingChecked: drivingVisible, naviLayers }

  const toggleDriving = () => setDrivingChecked((prev) => !prev)

  const toggleNavi = (routeId: number) => {
    setCheckedMap((prev) => {
      const layer = naviLayers.find((item) => item.routeId === routeId)
      return { ...prev, [routeId]: !(prev[routeId] ?? layer?.checked ?? false) }
    })
  }

  return (
    <div className="flex min-h-0 items-stretch justify-center gap-4">
      <div className="h-[450px] min-w-0 flex-1 overflow-hidden rounded-lg border border-tweb-neutral5 bg-tweb-neutral6">
        <KakaoMap appKey={APP_KEY}>
          <FitBounds
            departure={departure}
            destination={destination}
            drivingPoints={drivingPoints}
            drivingVisible={drivingVisible}
            naviLayers={naviLayers}
          />
          <RouteOverlay
            buildLayers={(view) => toRouteLayers(toStyledRoutes(layerSource, view))}
          />
          <RouteMarkers naviLayers={naviLayers} departure={departure} destination={destination} />
        </KakaoMap>
      </div>
      <LayerTogglePanel
        drivingChecked={drivingVisible}
        drivingHasRoute={drivingHasRoute}
        drivingLocked={isRowLocked(drivingVisible, drivingHasRoute)}
        onDrivingToggle={toggleDriving}
        naviLayers={toNaviLayerViews(naviLayers)}
        onNaviToggle={toggleNavi}
      />
    </div>
  )
}
