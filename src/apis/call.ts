import {
  CoordinateResponse,
  RoboTaxiCallRouteListResponse,
  RoboTaxiCallRouteResponse,
  RoboTaxiCallTrajectoryResponse
} from '@/generated/orval/monitoring/acMonitoringApi.schemas'
import { Methods, request } from '@/lib/request'

export interface CallDetailResponse{
  call_id: number;
  departure_coordinate?: CoordinateResponse;
  destination_coordinate?: CoordinateResponse;
}

export const getCall = (callId: number, signal?: AbortSignal) => {
  return request<CallDetailResponse>({
    url: `/v1/driving-logs/taxi-calls/${callId}`,
    method: Methods.GET,
    signal
  })
}

export const getCallTrajectory = (callId: number, signal?: AbortSignal) => {
  return request<RoboTaxiCallTrajectoryResponse>({
    url: `/v1/driving-logs/taxi-calls/${callId}/trajectory`,
    method: Methods.GET,
    signal
  })
}

export const getCallRoutes = (callId: number, signal?: AbortSignal) => {
  return request<RoboTaxiCallRouteListResponse>({
    url: `/v1/driving-logs/taxi-calls/${callId}/routes`,
    method: Methods.GET,
    signal
  })
}

export const getCallRoute = (callId: number, routeId: number, signal?: AbortSignal) => {
  return request<RoboTaxiCallRouteResponse>({
    url: `/v1/driving-logs/taxi-calls/${callId}/routes/${routeId}`,
    method: Methods.GET,
    signal
  })
}
