export const ROUTE_TRIGGER_TEXT: Record<string, string> = {
  INITIAL: '호출 시점',
  DEVIATION: '경로이탈',
  SYSTEM_REROUTE: '시스템 재탐색',
  TRAFFIC_CHANGED: '교통정보 변경',
  USER_REQUESTED: '사용자 요청',
  ALTERNATIVE_ROUTE_SELECTED: '다중경로 선택',
  WAYPOINT_ADDED: '경유지 추가',
  WAYPOINT_CHANGED: '경유지 변경',
  WAYPOINT_REMOVED: '경유지 삭제',
  UNKNOWN: ''
}

export const getRouteTriggerText = (routeTrigger: string | undefined) =>
  ROUTE_TRIGGER_TEXT[routeTrigger ?? ''] ?? ''
