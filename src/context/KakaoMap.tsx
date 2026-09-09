import { createContext, PropsWithChildren, useContext, useEffect, useRef, useState } from 'react'

type KakaoMapProps = {
  width?: number;
  height?: number;
  appKey: string;
  // onMapReady?: (map: kakao.maps.Map) => void;
}
const KakaoMapContext = createContext(
  undefined as unknown as kakao.maps.Map
)

const { Provider } = KakaoMapContext

const KAKAO_MAP_SDK_URL = '//dapi.kakao.com/v2/maps/sdk.js'
const KAKAO_MAP_SDK_ERROR_STATE = 'error'

function buildSdkSrc(appKey: string){
  return `${KAKAO_MAP_SDK_URL}?appkey=${appKey}&libraries=services,clusterer,drawing&autoload=false`
}

function isKakaoMapsReady(){
  return typeof window !== 'undefined' && Boolean(window.kakao?.maps)
}

function isKakaoMapSdkScriptFailed(script: HTMLScriptElement | null | undefined){
  return script?.dataset['kakaoMapSdkState'] === KAKAO_MAP_SDK_ERROR_STATE
}

function markKakaoMapSdkScriptFailed(script: HTMLScriptElement){
  script.dataset['kakaoMapSdkState'] = KAKAO_MAP_SDK_ERROR_STATE
}

export function KakaoMap({
  appKey, children
}: PropsWithChildren<KakaoMapProps>){
  const [map, setMap] = useState<kakao.maps.Map>()
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // 대한민국 중심으로 초기 설정
    const center = [36.5, 127.5]
    let cancelled = false
    let created = false

    const createMap = () => {
      if(cancelled || created || !mapRef.current) {
        return
      }

      created = true

      window.kakao.maps.load(() => {
        if(cancelled || !mapRef.current) {
          return
        }

        const options = {
          level: 12,
          center: new window.kakao.maps.LatLng(center[0]!, center[1]!)
        }
        const nextMap = new window.kakao.maps.Map(mapRef.current, options)

        setMap(nextMap)
        // onMapReady?.(map)

        nextMap.setMaxLevel(12)
        nextMap.setMinLevel(1)
      })
    }

    const onScriptError = (event: Event) => {
      markKakaoMapSdkScriptFailed(event.currentTarget as HTMLScriptElement)
    }

    const attachScriptListeners = (script: HTMLScriptElement) => {
      script.addEventListener('load', createMap)
      script.addEventListener('error', onScriptError)

      return () => {
        script.removeEventListener('load', createMap)
        script.removeEventListener('error', onScriptError)
      }
    }

    // 같은 페이지에 메인 맵이 이미 있으면 SDK가 로드된 상태다. 스크립트를 또 붙이면 load가 안 떠 미니맵이 비게 된다.
    if(isKakaoMapsReady()) {
      createMap()
      return () => {
        cancelled = true
      }
    }

    let existingScript = document.querySelector<HTMLScriptElement>('script[src*="dapi.kakao.com/v2/maps/sdk.js"]')

    if(isKakaoMapSdkScriptFailed(existingScript) && !isKakaoMapsReady()) {
      existingScript?.remove()
      existingScript = null
    }

    if(existingScript) {
      const detachScriptListeners = attachScriptListeners(existingScript)
      // load가 이미 끝난 스크립트에는 이벤트가 다시 안 오므로 재확인한다
      if(isKakaoMapsReady()) {
        createMap()
      }
      return () => {
        cancelled = true
        detachScriptListeners()
      }
    }

    const script = document.createElement('script')
    script.async = false
    script.src = buildSdkSrc(appKey)
    document.head.appendChild(script)

    const detachScriptListeners = attachScriptListeners(script)

    return () => {
      cancelled = true
      detachScriptListeners()
    }
  }, [appKey])

  return (
    <div ref={mapRef} className="w-full h-full">
      {map && (
        <Provider value={map}>
          {children}
        </Provider>
      )}
    </div>
  )
}

export const useKakaoMap = () => {
  const kakaoMap = useContext(KakaoMapContext)

  if(!kakaoMap) {
    throw new Error('kakaoMap instance가 없습니다.')
  }

  return kakaoMap
}
