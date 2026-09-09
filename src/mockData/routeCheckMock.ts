import { INITIAL_SEQUENCE, type RouteLayerState } from '@/app/call/taxi/utils/routeTrace'
import { toDrivingPoints, toLatLng, toPath } from '@/lib/utils/route'

import callIndex from './call-index.json'
import naviRoute770021 from './navi-route-770021.json'
import routesIndex from './routes-index.json'
import trajectory from './trajectory.json'

const initialRoute = routesIndex.routes.find((route) => route.sequence === INITIAL_SEQUENCE)!
const naviPath = toPath(naviRoute770021.path)
const startPoint = naviPath[0]

export const routeCheckMock = {
  departure: toLatLng(callIndex.departure_coordinate),
  destination: toLatLng(callIndex.destination_coordinate),
  drivingPoints: toDrivingPoints(trajectory.points),
  naviLayers: routesIndex.routes.map((route): RouteLayerState => ({
    routeId: route.id,
    sequence: route.sequence,
    routeTrigger: route.route_trigger,
    issuedAt: route.issuedAt,
    checked: route.sequence === INITIAL_SEQUENCE,
    detail: route.id === initialRoute.id && startPoint
      ? { status: 'ready', path: naviPath, startPoint }
      : { status: 'empty' }
  }))
}
