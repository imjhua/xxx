import { isCallRouteMockUrl, transformCallRouteMockResponse } from './call-route-mock'

type MockTransformer = {
  match: (url: string) => boolean;
  transform: (url: string, data: unknown, params?: unknown) => unknown;
}

const transformers: MockTransformer[] = [
  { match: isCallRouteMockUrl, transform: transformCallRouteMockResponse }
]

export function transformMockResponse(url: string, data: unknown, params?: unknown): unknown{
  const transformer = transformers.find(({ match }) => match(url))
  return transformer ? transformer.transform(url, data, params) : data
}
