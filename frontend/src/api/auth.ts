import { useMutation, useQuery } from '@tanstack/react-query';
import type { Role } from '../lib/rbac';
import { api, getToken } from './http';
import type { ApiUser, TokenResponse } from './types';

export const meKey = ['auth', 'me'] as const;

export const loginRequest = (email: string, password: string) =>
api.post<TokenResponse>('/auth/login', { email, password });

export const demoLoginRequest = (role: Role) => api.post<TokenResponse>('/auth/demo-login', { role });

export const meRequest = () => api.get<ApiUser>('/auth/me');

export const logoutRequest = () => api.post<void>('/auth/logout');

export function useMe(enabled = true) {
  return useQuery({ queryKey: meKey, queryFn: meRequest, enabled: enabled && !!getToken(), staleTime: 5 * 60_000 });
}

export function useLogin() {
  return useMutation({ mutationFn: ({ email, password }: {email: string;password: string;}) => loginRequest(email, password) });
}

export function useDemoLogin() {
  return useMutation({ mutationFn: (role: Role) => demoLoginRequest(role) });
}

export function useLogout() {
  return useMutation({ mutationFn: logoutRequest });
}
