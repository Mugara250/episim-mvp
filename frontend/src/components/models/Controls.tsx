
export function SliderField({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
  hint









}: {label: string;value: number;min: number;max: number;step: number;format?: (v: number) => string;onChange: (v: number) => void;hint?: string;}) {
  const id = `sl-${label.replace(/\W+/g, '-').toLowerCase()}`;
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label htmlFor={id} className="text-micro text-text-secondary">{label.toUpperCase()}</label>
        <span className="text-[13px] font-bold text-primary tabular-nums">{format ? format(value) : value}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-background rounded-lg appearance-none cursor-pointer accent-primary" />
      
      {hint && <p className="text-[11px] text-text-secondary mt-1">{hint}</p>}
    </div>);

}

export function Stat({
  label,
  value,
  detail,
  tone = 'default'





}: {label: string;value: string;detail?: string;tone?: 'default' | 'danger' | 'warning' | 'success';}) {
  const color = tone === 'danger' ? 'text-danger' : tone === 'warning' ? 'text-warning' : tone === 'success' ? 'text-success' : 'text-text-primary';
  return (
    <div className="bg-surface p-5 rounded-xl border border-border flex flex-col">
      <div className="text-micro text-text-secondary mb-2">{label.toUpperCase()}</div>
      <div className={`text-kpi ${color}`}>{value}</div>
      {detail && <div className="text-[12px] text-text-secondary mt-auto pt-1">{detail}</div>}
    </div>);

}