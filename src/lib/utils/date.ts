// 날짜 관련 유틸리티
import { format, isDate, parse } from 'date-fns'

export const DATE_TIME_FORMAT = 'yy.MM.dd HH:mm:ss'

export const DATE_FORMAT = 'yy.MM.dd'
export const DATE_FORMAT_FOR_QUERY_PARAM = 'yyyy-MM-dd'

export const DATE_ONLY_TIME_FORMAT = 'HH:mm:ss' // 00 ~ 23

/**
 * 날짜 또는 날짜 범위를 텍스트(문자열)로 변환합니다.
 * @param date Date 객체, 또는 { from, to } 형태의 객체
 * @param dateFormat 출력할 날짜 포맷 문자열
 * @returns 변환된 날짜 문자열
 */
export const formatDateToText = (date: { from: Date; to?: Date } | Date | string | undefined | null, dateFormat = DATE_TIME_FORMAT): string => {
  if(!date) {
    return '-'
  }

  if(isDate(date) || typeof date === 'string') {
    return format(date, dateFormat)
  }

  const { from, to } = date
  if(from && to) {
    const fromText = format(from, dateFormat)
    const toText = format(to, dateFormat)
    if(fromText === toText) {
      return fromText
    }
    return `${fromText} - ${toText}`
  }
  if(from) {
    return format(from, dateFormat)
  }

  return '-'
}

export function convertDateFormat(dateString: string, prevDateFormat: string, nextDateFormat: string): string{
  if(!dateString) {
    return dateString
  }

  const date = parse(dateString, prevDateFormat, new Date())

  return format(date, nextDateFormat)
}

export function convertToQueryParamDateFormat(dateString: string): string{
  if(!dateString) {
    return dateString
  }

  return convertDateFormat(dateString, DATE_FORMAT, DATE_FORMAT_FOR_QUERY_PARAM)
}

export function setStartOfDay(date: Date): Date{
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}
export function setEndOfDay(date: Date): Date{
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}
