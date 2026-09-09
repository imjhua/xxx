import { isAxiosError, Methods } from '@/repo/request/http'
import { AxiosError, type InternalAxiosRequestConfig } from 'axios'

import { transformMockResponse } from '@/mocks/mock-response-transform'

import { convertApiUrlToMockPath } from './utils/mock'

const toMockUrl = (apiUrl: string) => {
  const mockPath = convertApiUrlToMockPath(apiUrl)

  if(!mockPath) {
    throw new Error(`Mock path not found for ${apiUrl}`)
  }

  return `/mock${mockPath}`
}

const notFoundError = (url: string) => {
  const config = { url, headers: {} } as InternalAxiosRequestConfig

  return new AxiosError('Mock: 경로 데이터를 찾을 수 없습니다', 'ERR_BAD_REQUEST', config, undefined, {
    status: 404,
    statusText: 'Not Found',
    data: { code: 'NOT_FOUND', message: '경로를 찾을 수 없습니다' },
    headers: {},
    config
  })
}

export const request = async <T>(options: {
  url: string;
  method?: string;
  params?: unknown;
  signal?: AbortSignal;
}): Promise<T> => {
  const apiUrl = options.url
  const response = await fetch(toMockUrl(apiUrl), { signal: options.signal })

  if(response.status === 404) {
    throw notFoundError(apiUrl)
  }

  if(!response.ok) {
    throw new Error(`Mock fetch failed: ${response.status} ${apiUrl}`)
  }

  const data = await response.json()

  return transformMockResponse(apiUrl, data, options.params) as T
}

export { isAxiosError, Methods }
