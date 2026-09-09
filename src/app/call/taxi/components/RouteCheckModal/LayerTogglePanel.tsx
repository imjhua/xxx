import { Checkbox } from '@/repo/ui/checkbox'
import { Label } from '@/repo/ui/label'

import { cn } from '@/lib/utils'

import { LAYER_COLOR, type LayerColor } from '../../config/layerColor'
import { NO_ROUTE_TEXT } from './layerLabel'
import type { NaviLayerView } from './layerView'

interface LayerTogglePanelProps{
  drivingChecked: boolean;
  drivingHasRoute: boolean;
  drivingLocked: boolean;
  onDrivingToggle: () => void;
  naviLayers: NaviLayerView[];
  onNaviToggle: (routeId: number) => void;
}

function ColorSwatch({ color, className }: { color: LayerColor; className?: string }){
  return (
    <span
      aria-hidden
      className={cn('inline-block h-[8px] w-[18px] shrink-0 rounded-full border', className)}
      style={{ backgroundColor: color.fill, borderColor: color.border }}
    />
  )
}

/** 경로가 없는 행은 제목까지 흐리게 둔다 */
const titleClass = (hasRoute: boolean) => cn(
  'text-body2 font-bold leading-5',
  hasRoute ? 'cursor-pointer text-tweb-neutral1' : 'cursor-default text-tweb-neutral3'
)

export default function LayerTogglePanel({
  drivingChecked, drivingHasRoute, drivingLocked, onDrivingToggle, naviLayers, onNaviToggle
}: LayerTogglePanelProps){
  return (
    <aside className="flex h-[450px] w-[284px] shrink-0 flex-col overflow-y-auto rounded-lg border border-tweb-neutral5 bg-white py-3">
      <div className="flex items-start gap-4 px-6 py-3">
        <Checkbox
          id="route-layer-driving"
          checked={drivingChecked}
          disabled={drivingLocked}
          onCheckedChange={onDrivingToggle}
          className="mt-0.5"
        />
        <div className="flex min-w-0 flex-col gap-0.5">
          <Label htmlFor="route-layer-driving" className={titleClass(drivingHasRoute)}>
            주행 경로
          </Label>
          {drivingHasRoute ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <ColorSwatch color={LAYER_COLOR.drivingAuto} />
                <span className="text-body2 font-regular leading-5 text-tweb-neutral2">자율 주행</span>
              </div>
              <div className="flex items-center gap-1">
                <ColorSwatch color={LAYER_COLOR.drivingManual} />
                <span className="text-body2 font-regular leading-5 text-tweb-neutral2">수동 주행</span>
              </div>
            </div>
          ) : (
            <span className="text-body2 font-regular leading-5 text-tweb-neutral3">{NO_ROUTE_TEXT}</span>
          )}
        </div>
      </div>
      <div className="px-6">
        <div className="h-px w-full bg-tweb-neutral5" />
      </div>
      <div className="flex flex-col">
        {naviLayers.map((layer) => (
          <div key={layer.routeId} className="flex items-center gap-4 px-6 py-3">
            <Checkbox
              id={`route-layer-${layer.routeId}`}
              checked={layer.checked}
              disabled={layer.locked}
              onCheckedChange={() => onNaviToggle(layer.routeId)}
            />
            <div className="flex min-w-0 items-center gap-3">
              {layer.hasRoute && (
                <ColorSwatch color={layer.isInitial ? LAYER_COLOR.naviInitial : LAYER_COLOR.reroute} />
              )}
              <div className="flex min-w-0 flex-col gap-0.5">
                <Label htmlFor={`route-layer-${layer.routeId}`} className={titleClass(layer.hasRoute)}>
                  {layer.title}
                </Label>
                <span
                  className={cn(
                    'text-body2 font-regular leading-5',
                    layer.hasRoute ? 'text-tweb-neutral2' : 'text-tweb-neutral3'
                  )}
                >
                  {layer.meta}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}
