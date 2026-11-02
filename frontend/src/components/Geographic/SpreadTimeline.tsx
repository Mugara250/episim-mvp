import React from 'react';
import { Pause, Play } from 'lucide-react';

interface SpreadTimelineProps {
  day: number;
  horizon: number;
  onDay: (d: number) => void;
  playing: boolean;
  onTogglePlay: () => void;
}

export function SpreadTimeline({ day, horizon, onDay, playing, onTogglePlay }: SpreadTimelineProps) {
  return (
    <div className="flex items-center gap-4">
      <button
        onClick={onTogglePlay}
        aria-label={playing ? 'Pause timeline' : 'Play timeline'}
        className="w-10 h-10 rounded-full bg-primary hover:bg-primary-dark text-white flex items-center justify-center flex-shrink-0 transition-colors">
        
        {playing ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
      </button>
      <input
        type="range"
        min={0}
        max={horizon}
        value={day}
        onChange={(e) => onDay(Number(e.target.value))}
        aria-label="Projection day"
        aria-valuetext={`Day ${day} of ${horizon}`}
        className="flex-1 accent-[#12A594] cursor-pointer" />
      
      <span className="text-[14px] text-text-secondary tabular-nums whitespace-nowrap w-[104px] text-right">
        <span className="font-semibold text-text-primary">Day {day}</span> of {horizon}
      </span>
    </div>);

}