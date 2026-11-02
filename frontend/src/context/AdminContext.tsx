import React, { createContext, ReactNode, useContext, useState } from 'react';
import { adminHospitals } from '../data/adminHospitals';
import { adminUsers } from '../data/adminUsers';
import { auditLog } from '../data/auditLog';
import { ROLE_LABELS } from '../lib/rbac';
import { AdminUser, AuditAction, AuditEntry, Hospital } from '../types/admin';
import { useAuth } from './AuthContext';

type UserInput = Omit<AdminUser, 'id' | 'lastLogin'>;
type HospitalInput = Omit<Hospital, 'id' | 'registered'>;

interface AdminContextType {
  users: AdminUser[];
  hospitals: Hospital[];
  audit: AuditEntry[];
  saveUser: (input: UserInput, id?: string) => void;
  toggleStatus: (id: string) => void;
  saveHospital: (input: HospitalInput, officerId: string, id?: string) => void;
  officersAt: (hospitalId: string) => AdminUser[];
  hospitalName: (id?: string) => string;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

function stamp() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function AdminProvider({ children }: {children: ReactNode;}) {
  const { userName } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>(adminUsers);
  const [hospitals, setHospitals] = useState<Hospital[]>(adminHospitals);
  const [audit, setAudit] = useState<AuditEntry[]>(auditLog);

  const log = (action: AuditAction, target: string, details: string) =>
  setAudit((list) => [
  { id: `A-${Date.now()}`, time: stamp(), user: userName, role: 'Admin', action, target, details },
  ...list]
  );

  const hospitalName = (id?: string) => hospitals.find((h) => h.id === id)?.name ?? '—';

  const saveUser = (input: UserInput, id?: string) => {
    const clean: UserInput = { ...input, hospitalId: input.role === 'officer' ? input.hospitalId : undefined };
    if (id) {
      const before = users.find((u) => u.id === id);
      setUsers((list) => list.map((u) => u.id === id ? { ...u, ...clean } : u));
      const changes: string[] = [];
      if (before && before.role !== clean.role) changes.push(`Role ${ROLE_LABELS[before.role]} → ${ROLE_LABELS[clean.role]}`);
      if (before && before.hospitalId !== clean.hospitalId && clean.hospitalId) changes.push(`Hospital set to ${hospitalName(clean.hospitalId)}`);
      log('User updated', clean.name, changes.join('; ') || 'Details updated');
    } else {
      setUsers((list) => [...list, { ...clean, id: `U-${Date.now()}`, lastLogin: 'Never' }]);
      log('User created', clean.name, `${ROLE_LABELS[clean.role]}${clean.hospitalId ? ` · ${hospitalName(clean.hospitalId)}` : ''}`);
    }
  };

  const toggleStatus = (id: string) => {
    const u = users.find((x) => x.id === id);
    if (!u) return;
    const next = u.status === 'Active' ? 'Inactive' : 'Active';
    setUsers((list) => list.map((x) => x.id === id ? { ...x, status: next } : x));
    log('Account status changed', u.name, `${u.status} → ${next}`);
  };

  const saveHospital = (input: HospitalInput, officerId: string, id?: string) => {
    const hospitalId = id ?? `H-${Date.now()}`;
    if (id) {
      setHospitals((list) => list.map((h) => h.id === id ? { ...h, ...input } : h));
      log('Hospital updated', input.name, `${input.district} · ${input.isolationBeds} isolation beds`);
    } else {
      const today = stamp().slice(0, 10);
      setHospitals((list) => [...list, { ...input, id: hospitalId, registered: today }]);
      log('Hospital registered', input.name, `${input.district} · ${input.isolationBeds} isolation beds`);
    }
    if (officerId) {
      const officer = users.find((u) => u.id === officerId);
      if (officer && officer.hospitalId !== hospitalId) {
        setUsers((list) => list.map((u) => u.id === officerId ? { ...u, hospitalId } : u));
        log('User updated', officer.name, `Hospital set to ${input.name}`);
      }
    }
  };

  const officersAt = (hospitalId: string) => users.filter((u) => u.role === 'officer' && u.hospitalId === hospitalId);

  return (
    <AdminContext.Provider value={{ users, hospitals, audit, saveUser, toggleStatus, saveHospital, officersAt, hospitalName }}>
      {children}
    </AdminContext.Provider>);

}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
}