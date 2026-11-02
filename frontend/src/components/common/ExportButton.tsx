import React, { useEffect, useState, useRef } from 'react';
import {
  Download,
  FileText,
  FileSpreadsheet,
  FileJson,
  ChevronDown } from
'lucide-react';
interface ExportButtonProps {
  label?: string;
  onExport: (format: 'pdf' | 'csv' | 'json') => void;
  variant?: 'default' | 'icon';
  className?: string;
  formats?: Array<'pdf' | 'csv' | 'json'>;
  disabled?: boolean;
}
export function ExportButton({
  label = 'Export',
  onExport,
  variant = 'default',
  className = '',
  formats = ['pdf', 'csv', 'json'],
  disabled = false
}: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  const FORMAT_META = {
    pdf: {
      icon: FileText,
      label: 'PDF Report',
      desc: 'Formatted document'
    },
    csv: {
      icon: FileSpreadsheet,
      label: 'CSV Spreadsheet',
      desc: 'Raw data, tabular'
    },
    json: {
      icon: FileJson,
      label: 'JSON',
      desc: 'Machine-readable'
    }
  };
  const handleSelect = (fmt: 'pdf' | 'csv' | 'json') => {
    setOpen(false);
    onExport(fmt);
  };
  return (
    <div
      ref={ref}
      className={`relative ${className}`}
      // Show on hover and on click for accessibility
      onMouseEnter={() => !disabled && setOpen(true)}
      onMouseLeave={() => setOpen(false)}>
      
      {variant === 'icon' ?
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        aria-label="Export"
        aria-haspopup="menu"
        aria-expanded={open}
        className="p-2 text-text-secondary hover:text-primary hover:bg-hover rounded-lg transition-colors disabled:opacity-50">
        
          <Download size={18} />
        </button> :

      <button
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        className="bg-surface border border-border hover:bg-background disabled:opacity-50 text-text-primary px-4 py-2.5 rounded-lg text-[13px] font-semibold flex items-center transition-colors">
        
          <Download size={16} className="mr-2" />
          {label}
          <ChevronDown
          size={14}
          className={`ml-2 transition-transform ${open ? 'rotate-180' : ''}`} />
        
        </button>
      }

      {open && !disabled &&
      <div
        role="menu"
        className="absolute right-0 top-full mt-1 w-56 bg-surface border border-border rounded-lg shadow-lg z-50 overflow-hidden">
        
          <div className="px-3 py-2 border-b border-border bg-background">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
              Export as
            </span>
          </div>
          {formats.map((fmt) => {
          const meta = FORMAT_META[fmt];
          const Icon = meta.icon;
          return (
            <button
              key={fmt}
              role="menuitem"
              onClick={() => handleSelect(fmt)}
              className="w-full flex items-center px-3 py-2.5 text-left hover:bg-hover transition-colors group">
              
                <Icon
                size={16}
                className="text-text-secondary group-hover:text-primary mr-3 flex-shrink-0" />
              
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-text-primary">
                    {meta.label}
                  </div>
                  <div className="text-[11px] text-text-secondary">
                    {meta.desc}
                  </div>
                </div>
              </button>);

        })}
        </div>
      }
    </div>);

}