import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Role } from '../lib/rbac';
import { demoLoginRequest, loginRequest, logoutRequest, meRequest } from '../api/auth';
import { getToken, setToken, UNAUTHORIZED_EVENT } from '../api/http';
import type { ApiUser, TokenResponse } from '../api/types';

type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

interface AuthContextType {
  status: AuthStatus;
  user: ApiUser | null;
  /** Role of the signed-in user. Falls back to 'analyst' only so signed-out screens can render. */
  role: Role;
  userName: string;
  login: (email: string, password: string) => Promise<ApiUser>;
  /** DEMO_MODE only: sign in as the seeded demo user for a role (real token swap). */
  demoLogin: (role: Role) => Promise<ApiUser>;
  logout: () => Promise<void>;
  /** Kept for the prototype's role switcher: switches by signing in as that role's demo user. */
  setRole: (role: Role) => Promise<ApiUser>;
  /** Local display-name override (profile modal); not saved to the server. */
  setUserName: (name: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: {children: ReactNode;}) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<ApiUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>(() => getToken() ? 'loading' : 'anonymous');
  const [nameOverride, setNameOverride] = useState<string | null>(null);

  // Restore the session from a stored token.
  useEffect(() => {
    if (!getToken()) return;
    let alive = true;
    meRequest().
    then((me) => {
      if (!alive) return;
      setUser(me);
      setStatus('authenticated');
    }).
    catch(() => {
      if (!alive) return;
      setToken(null);
      setStatus('anonymous');
    });
    return () => {
      alive = false;
    };
  }, []);

  // Any 401 from the API ends the session.
  useEffect(() => {
    const onUnauthorized = () => {
      setUser(null);
      setStatus('anonymous');
      queryClient.clear();
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [queryClient]);

  const accept = useCallback(
    (res: TokenResponse) => {
      setToken(res.accessToken);
      // Data cached for the previous user must not leak into the next one.
      queryClient.clear();
      setNameOverride(null);
      setUser(res.user);
      setStatus('authenticated');
      return res.user;
    },
    [queryClient]
  );

  const login = useCallback((email: string, password: string) => loginRequest(email, password).then(accept), [accept]);
  const demoLogin = useCallback((role: Role) => demoLoginRequest(role).then(accept), [accept]);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      // The token is dropped locally either way.
    }
    setToken(null);
    setUser(null);
    setNameOverride(null);
    setStatus('anonymous');
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo<AuthContextType>(
    () => ({
      status,
      user,
      role: user?.role ?? 'analyst',
      userName: nameOverride ?? user?.name ?? '',
      login,
      demoLogin,
      logout,
      setRole: demoLogin,
      setUserName: setNameOverride
    }),
    [status, user, nameOverride, login, demoLogin, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
