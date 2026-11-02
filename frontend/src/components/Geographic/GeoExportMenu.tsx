import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Download, FileSpreadsheet, Image } from 'lucide-react';

type Format = 'png' | 'csv';

const OPTIONS: {id: Format;label: string;icon: typeof Image;}[] = [
{ id: 'png', label: 'Map image', icon: Image },
{ id: 'csv', label: 'District CSV', icon: FileSpreadsheet }];


export function GeoExportMenu({ onExport }: {onExport: (f: Format) => void;}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="h-10 px-4 rounded-full border border-border bg-surface hover:bg-background text-text-primary text-[14px] font-semibold flex items-center gap-2 transition-colors">
        
        <Download size={15} />
        Export
        <ChevronDown size={14} />
      </button>
      {open &&
      <div role="menu" className="absolute right-0 bottom-full mb-2 w-48 bg-surface border border-border rounded-xl shadow-lg z-50 p-1.5">
          {OPTIONS.map((o) =>
        <button
          key={o.id}
          role="menuitem"
          onClick={() => {
            setOpen(false);
            onExport(o.id);
          }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-[14px] font-medium text-text-primary hover:bg-hover transition-colors">
          
              <o.icon size={16} className="text-primary" />
              {o.label}
            </button>
        )}
        </div>
      }
    </div>);

}