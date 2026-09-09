// '@/config'로 묶어서 가져오면 테스트가 깨져서 파일을 직접 지정한다
import { getRouteTriggerText } from '@/config/call'
import { DATE_ONLY_TIME_FORMAT, formatDateToText } from '@/lib/utils/date'

import { INITIAL_SEQUENCE } from '../../utils/routeTrace'

const SEPARATOR = '・'

export const NO_ROUTE_TEXT = '경로 없음'

interface LayerMetaInput{
  /** 경로 발급 시각(ISO) */
  issuedAt?: string;
  routeTrigger?: string;
  isEmpty?: boolean;
}

const formatIssuedTime = (issuedAt: string | undefined) => {
  if(!issuedAt || Number.isNaN(new Date(issuedAt).getTime())) {
    return ''
  }
  return formatDateToText(issuedAt, DATE_ONLY_TIME_FORMAT)
}

export function buildLayerMeta({ issuedAt, routeTrigger, isEmpty }: LayerMetaInput){
  return [
    formatIssuedTime(issuedAt),
    getRouteTriggerText(routeTrigger),
    isEmpty ? NO_ROUTE_TEXT : ''
  ].filter(Boolean).join(SEPARATOR)
}

export const INITIAL_LAYER_TITLE = '최초 내비 경로'

/** 레이어 이름. sequence 0은 최초 경로, 1부터는 `재탐색 1` */
export function buildLayerTitle(sequence: number){
  return sequence === INITIAL_SEQUENCE ? INITIAL_LAYER_TITLE : `재탐색 ${sequence}`
}
