import { Methods, request } from '@/repo/request/http'

type HeimdallUserType = {
  id: number;
  email: string;
  type: 'INTERNAL' | 'EXTERNAL';
  status: string;
  roles: {
    id: number;
    name: string;
    service: {
      id: number;
      name: string;
    };
  }[];
}

type SuccessResponse = {
  result: {
    code: 'SUCCESS';
    user: HeimdallUserType;
    error_message: null;
  };
}

type FailResponse = {
  result: {
    code: 'FAIL';
    error_message: string;
  };
}

type GetResponseType = SuccessResponse | FailResponse

const HEIMDALL_AUTH_TOKEN_KEY = 'HEIMDALL_AUTH_TOKEN'
/* TODO: 필요하지 않으면 정리 */
export const getHeimdallUser = async (baseURL: string, serviceName: string, token: string) => {
  const data = await request<GetResponseType>({
    baseURL,
    url: '/api/users/current',
    method: Methods.GET,
    headers: token ? { cookie: `${HEIMDALL_AUTH_TOKEN_KEY}=${token}` } : undefined
  })

  if(!data) {
    throw new Error('Failed to fetch user data')
  }

  const { result } = data
  if(result.code !== 'SUCCESS') {
    throw new Error(`Failed to get user: ${result.error_message}`)
  }

  const { email, roles } = result.user
  /* NOTE: 역할이 부여되지 않으면 role이 존재하지 않음 */
  const filteredRole = roles.filter(({ service }) => {
    return serviceName === service.name
  })[0]

  return { email, role: filteredRole?.name || '' }
}
