import { ArrowRight, Inbox } from 'lucide-react';

interface ConfigEmptyProps {
  title: string;
  text: string;
  linkLabel?: string;
  onLink?: () => void;
}

export function ConfigEmpty({ title, text, linkLabel, onLink }: ConfigEmptyProps) {
  return (
    <div className="rounded-xl border-2 border-dashed border-border px-6 py-14 text-center">
      <span className="w-12 h-12 rounded-full bg-hover flex items-center justify-center mx-auto mb-3">
        <Inbox size={20} className="text-primary" />
      </span>
      <h3 className="text-h3 text-text-primary">{title}</h3>
      <p className="text-[13px] text-text-secondary mt-1 max-w-md mx-auto">{text}</p>
      {linkLabel && onLink &&
      <button onClick={onLink} className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary hover:underline">
          {linkLabel} <ArrowRight size={14} />
        </button>
      }
    </div>);

}