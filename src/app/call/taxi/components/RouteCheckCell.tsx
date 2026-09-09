import { Button } from '@/repo/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/repo/ui/tooltip'
import { Map } from 'lucide-react'

import { isRouteCheckReady, ROUTE_CHECK_PENDING_TEXT } from '../utils/routeCheckAvailability'
import RouteCheckModal from './RouteCheckModal'

type RouteCheckCellProps = {
  callId: number;
  updatedAt?: string;
}

export default function RouteCheckCell({ callId, updatedAt }: RouteCheckCellProps){
  const isReady = isRouteCheckReady(updatedAt)
  const button = (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={!isReady}
      className="gap-1 rounded-md border-tweb-neutral5 bg-white px-2 text-body2 font-regular leading-5 text-tweb-neutral1 shadow-none hover:bg-tweb-neutral6 hover:text-tweb-neutral1"
    >
      <Map className="size-4" />
      경로 확인
    </Button>
  )

  if(isReady) {
    return <RouteCheckModal callId={callId} trigger={button} />
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        {/* disabled 버튼은 포인터 이벤트가 없어 감싼 요소가 hover를 받는다 */}
        <TooltipTrigger asChild>
          <span className="inline-flex">{button}</span>
        </TooltipTrigger>
        <TooltipContent
          align="end"
          className="w-fit whitespace-nowrap border border-tweb-neutral5 bg-white leading-relaxed text-tweb-neutral1 shadow-md pointer-events-none"
        >
          {ROUTE_CHECK_PENDING_TEXT}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
