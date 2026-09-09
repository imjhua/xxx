export type TargetType = 'mock' | 'local' | 'alpha' | 'prod-kakao' | 'prod-km'

export type AccessType = 'internal' | 'external'

type EndPointType = {
  [env in TargetType]: {
    [access in AccessType]: {
      url: string;
    };
  };
}

/**
 * Heimdall Web Domain 정의
 * 참고: https://wiki.daumkakao.com/pages/viewpage.action?pageId=550409708
 */

export const ENDPOINT: EndPointType = {
  mock: {
    internal: {
      url: 'https://heimdall-web.dev.onkakao.net'
    },
    external: {
      url: 'https://heimdall-web.dev.onkakao.net'
    }
  },
  local: {
    internal: {
      url: 'https://heimdall-web.dev.onkakao.net'
    },
    external: {
      url: 'https://heimdall-web.dev.onkakao.net'
    }
  },
  alpha: {
    internal: {
      url: 'https://heimdall-web.dev.onkakao.net'
    },
    external: {
      url: 'https://heimdall-web.dev.onkakao.net'
    }
  },
  'prod-kakao': {
    internal: {
      url: 'https://heimdall-web.onkakao.net'
    },
    external: {
      url: 'https://heimdall-public.kakao.com'
    }
  },
  'prod-km': {
    internal: {
      url: 'https://heimdall-web.kakaosecure.net'
    },
    external: {
      url: 'https://heimdall-public.kakaomobility.com'
    }
  }
}

export function getHeimdallConfig(target: TargetType, accessType: AccessType, serviceName: string, returnURL: string){
  const { url } = ENDPOINT[target][accessType]

  const loginUrl = `${url}${accessType === 'internal' ? '/login_internal' : '/login'}?targetUrl=${encodeURIComponent(returnURL)}`
  const logoutUrl = `${url}/logout?targetUrl=${encodeURIComponent(returnURL)}`
  return {
    target,
    baseURL: url,
    loginUrl,
    logoutUrl,
    serviceName: serviceName
  }
}