import React, { createContext, ReactNode, useContext, useState } from 'react';
import { accountRequests } from '../data/accountRequests';
import { Role } from '../lib/rbac';
import { AccountRequest, AccountRequestInput } from '../types/accountRequests';
import { useAdmin } from './AdminContext';
import { useAuth } from './AuthContext';

interface AccountRequestContextType {
  requests: AccountRequest[];
  pendingCount: number;
  unseenCount: number;
  /** The request submitted from this browser session, so the requester can be notified. */
  myRequest?: AccountRequest;
  submitRequest: (input: AccountRequestInput) => AccountRequest;
  approveRequest: (id: string, role: Role, hospitalId?: string) => void;
  rejectRequest: (id: string, reason: string) => void;
  markAllSeen: () => void;
  findByEmail: (email: string) => AccountRequest | undefined;
  emailInUse: (email: string) => boolean;
}

const AccountRequestContext = createContext<AccountRequestContextType | undefined>(undefined);

export function AccountRequestProvider({ children }: {children: ReactNode;}) {
  const { userName } = useAuth();
  const { saveUser, users } = useAdmin();
  const [requests, setRequests] = useState<AccountRequest[]>(accountRequests);
  const [myRequestId, setMyRequestId] = useState<string | null>(null);

  const normalise = (email: string) => email.trim().toLowerCase();

  const findByEmail = (email: string) =>
  requests.find((r) => normalise(r.email) === normalise(email));

  const emailInUse = (email: string) =>
  users.some((u) => normalise(u.email) === normalise(email)) ||
  requests.some((r) => normalise(r.email) === normalise(email) && r.status !== 'Rejected');

  const submitRequest = (input: AccountRequestInput) => {
    const request: AccountRequest = {
      ...input,
      email: input.email.trim(),
      id: `REQ-${1028 + requests.length}`,
      status: 'Pending',
      submittedAt: new Date().toISOString(),
      seenByAdmin: false
    };
    setRequests((list) => [request, ...list]);
    setMyRequestId(request.id);
    return request;
  };

  const approveRequest = (id: string, role: Role, hospitalId?: string) => {
    const req = requests.find((r) => r.id === id);
    if (!req) return;
    setRequests((list) =>
    list.map((r) =>
    r.id === id ?
    { ...r, status: 'Approved', assignedRole: role, decidedAt: new Date().toISOString(), decidedBy: userName, seenByAdmin: true } :
    r
    )
    );
    saveUser({
      name: req.name,
      email: req.email,
      role,
      organisation: req.institution,
      hospitalId,
      status: 'Active'
    });
  };

  const rejectRequest = (id: string, reason: string) =>
  setRequests((list) =>
  list.map((r) =>
  r.id === id ?
  { ...r, status: 'Rejected', rejectionReason: reason, decidedAt: new Date().toISOString(), decidedBy: userName, seenByAdmin: true } :
  r
  )
  );

  const markAllSeen = () =>
  setRequests((list) => list.some((r) => !r.seenByAdmin) ? list.map((r) => ({ ...r, seenByAdmin: true })) : list);

  const pendingCount = requests.filter((r) => r.status === 'Pending').length;
  const unseenCount = requests.filter((r) => r.status === 'Pending' && !r.seenByAdmin).length;
  const myRequest = requests.find((r) => r.id === myRequestId);

  return (
    <AccountRequestContext.Provider
      value={{ requests, pendingCount, unseenCount, myRequest, submitRequest, approveRequest, rejectRequest, markAllSeen, findByEmail, emailInUse }}>
      
      {children}
    </AccountRequestContext.Provider>);

}

export function useAccountRequests() {
  const ctx = useContext(AccountRequestContext);
  if (!ctx) throw new Error('useAccountRequests must be used within AccountRequestProvider');
  return ctx;
}