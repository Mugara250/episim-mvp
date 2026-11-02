import type { Role } from '../lib/rbac';

// Hand-written shapes for the auth and meta endpoints the shell needs before the
// generated schema exists. Feature code should prefer the generated types.

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  title?: string | null;
  institutionId?: string | null;
  institutionName?: string | null;
  status?: string;
}

export interface TokenResponse {
  accessToken: string;
  tokenType: string;
  expiresAt: string;
  user: ApiUser;
}

export interface Meta {
  demoMode: boolean;
  engineVersion: string;
  appVersion: string;
  boundaryAttribution: string;
}
