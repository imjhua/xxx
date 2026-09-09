import { DrivingPoint, LatLng, MIN_PATH_POINTS } from '@/lib/utils/route'

export const INITIAL_SEQUENCE = 0

export type RouteDetail
  = | { status: 'unknown' }
  | { status: 'empty' }
  | { status: 'ready'; path: LatLng[]; startPoint: LatLng }

interface RouteLayerRow{
  routeId: number;
  sequence: number;
  routeTrigger: string;
  issuedAt: string;
}

export interface RouteLayerState extends RouteLayerRow{
  checked: boolean;
  detail: RouteDetail | undefined;
}

export type NaviCheckedMap = Record<number, boolean>

export const toDrawableDrivingPoints = (points: DrivingPoint[]) =>
  points.length < MIN_PATH_POINTS ? [] : points

export interface FitPointSource{
  departure: LatLng | undefined;
  destination: LatLng | undefined;
  drivingPoints: LatLng[];
  drivingVisible: boolean;
  naviLayers: RouteLayerState[];
}

export const collectFitPoints = ({
  departure, destination, drivingPoints, drivingVisible, naviLayers
}: FitPointSource): LatLng[] => {
  const endpoints = [departure, destination].filter((point): point is LatLng => point !== undefined)
  const driving = drivingVisible ? drivingPoints : []
  const navi = naviLayers
    .filter((layer) => layer.checked)
    .flatMap((layer) => (layer.detail?.status === 'ready' ? layer.detail.path : []))

  return [...endpoints, ...driving, ...navi]
}
