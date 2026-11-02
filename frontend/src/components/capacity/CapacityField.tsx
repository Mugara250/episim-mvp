
interface CapacityFieldProps {
  id: string;
  label: string;
  unit: string;
  helper: string;
  value: string;
  error?: string;
  readOnly: boolean;
  optional?: boolean;
  onChange: (v: string) => void;
}

export function CapacityField({ id, label, unit, helper, value, error, readOnly, optional, onChange }: CapacityFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-[13px] font-medium text-text-primary mb-1.5">
        {label}
        {optional && <span className="text-text-secondary font-normal"> · Optional - leave blank if not applicable</span>}
      </label>
      <div className="relative">
        <input
          id={id}
          inputMode="numeric"
          value={value}
          disabled={readOnly}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={`${id}-help`}
          placeholder={optional ? 'Not applicable' : '0'}
          className={`w-full pl-3 pr-28 py-2.5 rounded-lg border bg-background text-[14px] text-text-primary tabular-nums focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed ${
          error ? 'border-danger focus:border-danger' : 'border-border focus:border-primary'}`
          } />
        
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-text-secondary pointer-events-none">{unit}</span>
      </div>
      <p id={`${id}-help`} className={`text-[12px] mt-1.5 ${error ? 'text-danger' : 'text-text-secondary'}`}>
        {error || helper}
      </p>
    </div>);

}