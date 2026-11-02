import { Role } from '../lib/rbac';

export type AccountStatus = 'Active' | 'Inactive' | 'Pending';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  organisation: string;
  /** Institution the account belongs to (for officers, their hospital). */
  institutionId?: string;
  /** Required when role is 'officer'. */
  hospitalId?: string;
  status: AccountStatus;
  lastLogin: string;
  /** One of the seeded demo accounts. */
  isDemo?: boolean;
  canEditBuiltins?: boolean;
  illustrative?: boolean;
}

export interface Hospital {
  id: string;
  name: string;
  district: string;
  isolationBeds: number;
  registered: string;
  kind?: 'District hospital catchment' | 'Referral hospital';
  illustrative?: boolean;
}

export type AuditAction =
'Parameter change' |
'Parameter set approved' |
'Report approved' |
'Report published' |
'Report submitted' |
'Simulation run' |
'User created' |
'User updated' |
'Account status changed' |
'Hospital registered' |
'Hospital updated' |
'Sign in';

export interface AuditEntry {
  id: string;
  /** YYYY-MM-DD HH:mm */
  time: string;
  user: string;
  role: string;
  action: AuditAction | string;
  target: string;
  details: string;
  illustrative?: boolean;
}