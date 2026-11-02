import { useQuery } from '@tanstack/react-query';
import { api } from './http';
import type { Meta } from './types';

export const metaKey = ['meta'] as const;

/** Public build information. While it loads (or if the API is down) the app assumes demo mode, so labels are never missing. */
export function useMeta() {
  return useQuery({
    queryKey: metaKey,
    queryFn: () => api.get<Meta>('/meta'),
    staleTime: Infinity
  });
}

export function useDemoMode() {
  const { data } = useMeta();
  return data?.demoMode ?? true;
}
