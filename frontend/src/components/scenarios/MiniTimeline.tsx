import React from 'react';
import { InterventionPackage, InterventionType } from '../../types/interventions';
import { timelineLength } from '../../utils/interventions';
import { ITEM_COLORS } from '../interventionLibrary/PackageTimeline';

/** Compact, label-free preview of a package timeline. */
export function MiniTimeline({ pkg, types }: {pkg: InterventionPackage;types: InterventionType[];}) {
  const length = timelineLength(pkg.items);
  const pos = (d: number) => Math.min(d, length) / length * 100;
  const summary = pkg.items.
  map((i) => {
    const name = types.find((t) => t.id === i.typeId)?.name ?? 'Intervention';
    return `${name}: day ${i.startDay}${i.endDay === null ? ' onward' : `–${i.endDay}`}`;
  }).
  join('; ');
  return (
    <div role="img" aria-label={summary} className="space-y-1.5">
      {pkg.items.map((item, idx) => {
        const start = pos(item.startDay);
        const end = item.endDay === null ? 100 : pos(item.endDay);
        return (
          <div key={item.id} className="relative h-2 rounded-full bg-surface-2">
            <div
              className={`absolute inset-y-0 ${item.endDay === null ? 'rounded-l-full' : 'rounded-full'}`}
              style={{ left: `${start}%`, width: `${Math.max(end - start, 2)}%`, backgroundColor: ITEM_COLORS[idx % ITEM_COLORS.length] }} />
            
          </div>);

      })}
      <div className="flex justify-between text-[10px] text-text-secondary tabular-nums pt-0.5">
        <span>Day 0</span>
        <span>Day {length}</span>
      </div>
    </div>);

}