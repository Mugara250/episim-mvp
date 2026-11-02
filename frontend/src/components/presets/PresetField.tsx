import { ReactNode, useId, useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface PresetFieldProps {
  label: string;
  unit?: string;
  help: string;
  error?: string;
  hint?: ReactNode;
  readOnly: boolean;
  /** Plain value shown when read-only. */
  display: ReactNode;
  children: (id: string, describedBy: string | undefined) => ReactNode;
  wide?: boolean;
}

export function PresetField({ label, unit, help, error, hint, readOnly, display, children, wide }: PresetFieldProps) {
  const id = useId();
  const [tip, setTip] = useState(false);
  const msgId = `${id}-msg`;

  return (
    <div className={wide ? 'md:col-span-2' : ''}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <label htmlFor={id} className="text-[13px] font-medium text-text-primary">
          {label}
          {unit && <span className="text-text-secondary font-normal"> ({unit})</span>}
        </label>
        <span className="relative">
          <button
            type="button"
            aria-label={`About ${label}`}
            onMouseEnter={() => setTip(true)}
            onMouseLeave={() => setTip(false)}
            onFocus={() => setTip(true)}
            onBlur={() => setTip(false)}
            className="text-text-secondary hover:text-primary flex">
            
            <HelpCircle size={14} />
          </button>
          {tip &&
          <span
            role="tooltip"
            className="absolute z-20 left-1/2 -translate-x-1/2 bottom-full mb-2 w-60 px-3 py-2 rounded-lg bg-surface-2 border border-border text-[12px] text-text-primary shadow-card">
            
              {help}
            </span>
          }
        </span>
      </div>
      {readOnly ?
      <div id={id} className="px-3 py-2.5 rounded-lg bg-background border border-border text-[14px] text-text-primary min-h-[42px]">
          {display}
        </div> :

      children(id, error || hint ? msgId : undefined)
      }
      {!readOnly && error ?
      <p id={msgId} className="text-[12px] text-danger mt-1.5">
          {error}
        </p> :
      !readOnly && hint ?
      <p id={msgId} className="text-[12px] text-text-secondary mt-1.5">
          {hint}
        </p> :
      null}
    </div>);

}