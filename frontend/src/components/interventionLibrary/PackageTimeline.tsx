import React from 'react';
import { ArrowRight } from 'lucide-react';
import { InterventionType, PackageItem } from '../../types/interventions';
import { timelineLength } from '../../utils/interventions';

export const ITEM_COLORS = ['#10B981', '#38BDF8', '#FB923C', '#A78BFA', '#F472B6', '#FACC15'];

interface PackageTimelineProps {
  items: PackageItem[];
  types: InterventionType[];
}

export function PackageTimeline({ items, types }: PackageTimelineProps) {
  const length = timelineLength(items);
  const ticks = Array.from({ length: length / 10 + 1 }, (_, i) => i * 10);
  const pos = (day: number) => `${Math.min(day, length) / length * 100}%`;

  return (
    <figure className="rounded-xl border border-border bg-background p-5" aria-label="Package timeline">
      <div className="grid grid-cols-[150px_1fr] gap-x-4">
        <div />
        <div className="relative h-6 text-[11px] text-text-secondary">
          {ticks.map((t) =>
          <span key={t} className="absolute -translate-x-1/2 tabular-nums" style={{ left: pos(t) }}>
              {t}
            </span>
          )}
        </div>

        {items.map((item, idx) => {
          const type = types.find((t) => t.id === item.typeId);
          const color = ITEM_COLORS[idx % ITEM_COLORS.length];
          const start = pos(item.startDay);
          const ongoing = item.endDay === null;
          const width = ongoing ? `calc(100% - ${start})` : `${(Math.min(item.endDay!, length) - item.startDay) / length * 100}%`;
          return (
            <React.Fragment key={item.id}>
              <div className="py-2 flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: color }} aria-hidden />
                <span className="text-[12px] font-medium text-text-primary truncate">{type?.name ?? 'Unknown type'}</span>
              </div>
              <div className="relative py-2">
                <div className="absolute inset-y-0 left-0 right-0 flex" aria-hidden>
                  {ticks.map((t) =>
                  <span key={t} className="absolute top-0 bottom-0 w-px bg-border" style={{ left: pos(t) }} />
                  )}
                </div>
                <div
                  className="relative h-7 rounded-md flex items-center px-2 text-[11px] font-semibold text-background overflow-hidden"
                  style={{ marginLeft: start, width, minWidth: 6, backgroundColor: color }}
                  title={`${type?.name}: day ${item.startDay} to ${ongoing ? 'end of simulation' : `day ${item.endDay}`}`}>
                  
                  <span className="truncate">
                    {ongoing ? `From day ${item.startDay}` : `Day ${item.startDay}–${item.endDay}`}
                  </span>
                  {ongoing &&
                  <span className="ml-auto flex items-center gap-0.5 whitespace-nowrap">
                      ongoing <ArrowRight size={12} />
                    </span>
                  }
                </div>
              </div>
            </React.Fragment>);

        })}

        <div />
        <figcaption className="pt-2 text-[11px] text-text-secondary text-center">Simulation day</figcaption>
      </div>
    </figure>);

}