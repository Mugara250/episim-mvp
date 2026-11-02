export const CHART = {
  grid: '#EEF2F6',
  tick: { fontSize: 11, fill: '#94A3B8' },
  tooltip: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E6EBF1',
    borderRadius: 8,
    fontSize: 12,
    color: '#0F172A'
  },
  primary: '#12A594',
  accent: '#FB923C',
  danger: '#EF4444',
  warning: '#F59E0B',
  muted: '#64748B',
  blue: '#38BDF8'
};

export const inputCls =
'w-full px-3 py-2 rounded-lg border border-border bg-background text-[13px] text-text-primary focus:outline-none focus:border-primary transition-colors';

export const labelCls = 'block text-micro text-text-secondary mb-2';

export function pct(v: number, digits = 0) {
  return `${(v * 100).toFixed(digits)}%`;
}

export function round(v: number) {
  return Math.round(v).toLocaleString();
}