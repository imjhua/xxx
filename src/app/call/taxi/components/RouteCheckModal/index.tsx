import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/repo/ui/dialog'
import { ReactNode, useState } from 'react'

import RouteCheckContent from './RouteCheckContent'

type RouteCheckModalProps = {
  callId: number;
  trigger: ReactNode;
}

export default function RouteCheckModal({ callId, trigger }: RouteCheckModalProps){
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="flex max-h-[90vh] w-full max-w-[1280px] flex-col gap-6 overflow-hidden p-6">
        <DialogHeader>
          <DialogTitle className="text-headline font-bold text-tweb-neutral1">
            [{callId}] 경로
          </DialogTitle>
          <DialogDescription className="sr-only">
            호출 운행 경로를 확인하는 지도와 레이어 설정 패널입니다.
          </DialogDescription>
        </DialogHeader>
        {/* 닫으면 언마운트돼 조회가 취소된다 */}
        {open && <RouteCheckContent callId={callId} />}
      </DialogContent>
    </Dialog>
  )
}
