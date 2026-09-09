export interface CoordinateResponse {
  latitude: number;
  longitude: number;
}

export interface RoboTaxiCallTrajectoryResponse {
  call_id: number;
  departure_coordinate?: CoordinateResponse;
  destination_coordinate?: CoordinateResponse;
  points: RoboTaxiCallTrajectoryResponseTrajectoryPoint[];
}

export type RoboTaxiCallTrajectoryResponseTrajectoryPointControlMode = 'AUTO' | 'MANUAL'

export interface RoboTaxiCallTrajectoryResponseTrajectoryPoint {
  coordinate: CoordinateResponse;
  timestamp: number;
  control_mode: RoboTaxiCallTrajectoryResponseTrajectoryPointControlMode;
}

export interface RoboTaxiCallRouteListResponse {
  call_id: number;
  routes: RoboTaxiCallRouteListResponseRoboTaxiCallRouteListResponseRoute[];
}

export type RoboTaxiCallRouteListResponseRoboTaxiCallRouteListResponseRouteRouteTrigger =
  | 'INITIAL'
  | 'DEVIATION'
  | 'SYSTEM_REROUTE'
  | 'TRAFFIC_CHANGED'
  | 'USER_REQUESTED'
  | 'ALTERNATIVE_ROUTE_SELECTED'
  | 'WAYPOINT_ADDED'
  | 'WAYPOINT_CHANGED'
  | 'WAYPOINT_REMOVED'
  | 'UNKNOWN'

export interface RoboTaxiCallRouteListResponseRoboTaxiCallRouteListResponseRoute {
  id: number;
  sequence: number;
  issued_at: string;
  route_trigger: RoboTaxiCallRouteListResponseRoboTaxiCallRouteListResponseRouteRouteTrigger;
}

export type RoboTaxiCallRouteResponseRouteTrigger =
  RoboTaxiCallRouteListResponseRoboTaxiCallRouteListResponseRouteRouteTrigger

export interface RoboTaxiCallRouteResponseCongestionSegment {
  start_index: number;
  end_index: number;
  congestion_level: string;
}

export interface RoboTaxiCallRouteResponse {
  id: number;
  call_id: number;
  route_sequence: number;
  route_trigger: RoboTaxiCallRouteResponseRouteTrigger;
  issued_at: string;
  path: CoordinateResponse[];
  congestion_segments: RoboTaxiCallRouteResponseCongestionSegment[];
}
