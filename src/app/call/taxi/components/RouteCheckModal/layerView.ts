import { INITIAL_SEQUENCE, type RouteLayerState } from '../../utils/routeTrace'
import { buildLayerMeta, buildLayerTitle, INITIAL_LAYER_TITLE, NO_ROUTE_TEXT } from './layerLabel'

/** 내비 경로 한 줄. 최초 경로는 진한 파랑, 재탐색은 모두 같은 연한 파랑이다 */
export interface NaviLayerView{
  routeId: number;
  title: string;
  meta: string;
  checked: boolean;
  isInitial: boolean;
  hasRoute: boolean;
  locked: boolean;
}

// 켜진 행은 잠그지 않는다 — 잠그면 켠 뒤 다시 끌 수 없다
export const isRowLocked = (checked: boolean, hasRoute: boolean) => !checked && !hasRoute

const toNaviLayerView = (layer: RouteLayerState): NaviLayerView => {
  // 한 번도 안 물어본 레이어는 상태가 없어 `경로 없음`도 붙이지 않는다
  // `ready`가 아니라 `empty`만 본다 — 조회 중을 경로 없음으로 치면 켜는 순간 번쩍인다
  const hasRoute = layer.detail?.status !== 'empty'

  return {
    routeId: layer.routeId,
    title: buildLayerTitle(layer.sequence),
    meta: buildLayerMeta({
      issuedAt: layer.issuedAt,
      routeTrigger: layer.routeTrigger,
      isEmpty: layer.detail?.status === 'empty'
    }),
    checked: layer.checked,
    isInitial: layer.sequence === INITIAL_SEQUENCE,
    hasRoute,
    locked: isRowLocked(layer.checked, hasRoute)
  }
}

/** 그릴 줄이 없을 때만 쓰는 자리표시 id. 실제 경로와 같은 목록에 섞이지 않는다 */
const EMPTY_ROW_ID = 0

/** 경로 이력이 아예 없는 콜. 최초 경로 한 줄만 `경로 없음`으로 보여준다 */
const EMPTY_NAVI_LAYER: NaviLayerView = {
  routeId: EMPTY_ROW_ID,
  title: INITIAL_LAYER_TITLE,
  meta: NO_ROUTE_TEXT,
  checked: false,
  isInitial: true,
  hasRoute: false,
  locked: isRowLocked(false, false)
}

export const toNaviLayerViews = (layers: RouteLayerState[]): NaviLayerView[] => {
  return layers.length === 0 ? [EMPTY_NAVI_LAYER] : layers.map(toNaviLayerView)
}
