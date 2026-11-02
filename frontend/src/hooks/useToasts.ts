import { useEffect, useRef, useState } from 'react';
import { PresetToast } from '../types/presets';

export function useToasts() {
  const [toasts, setToasts] = useState<PresetToast[]>([]);
  const seq = useRef(0);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const dismiss = (id: number) => setToasts((list) => list.filter((t) => t.id !== id));
  const push = (tone: PresetToast['tone'], text: string, replaceId?: number) => {
    const id = ++seq.current;
    setToasts((list) => [...list.filter((t) => t.id !== replaceId), { id, tone, text }]);
    if (tone !== 'loading') timers.current.push(window.setTimeout(() => dismiss(id), 3500));
    return id;
  };
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));

  return { toasts, push, dismiss, later };
}

export type Toasts = ReturnType<typeof useToasts>;