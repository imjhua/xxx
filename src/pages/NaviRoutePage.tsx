import RouteCheckContent from '@/app/call/taxi/components/RouteCheckModal/RouteCheckContent'
import { PageLayout } from '@/components/PageLayout'

const DEMO_CALL_ID = 1043829100

function Page(){
  return (
    <PageLayout title="내비/주행 경로 표기">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <RouteCheckContent callId={DEMO_CALL_ID} />
      </div>
    </PageLayout>
  )
}

export default Page
