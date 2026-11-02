import { createContext, ReactNode, useContext, useState } from 'react';
import {
  fetchRequestStatus,
  mergeStatus,
  useAccessRequests,
  useApproveRequest,
  useMarkRequestsSeen,
  useRejectRequest,
  useRequestStatus,
  useSubmitRequest } from
'../api/accessRequests';
import { Role } from '../lib/rbac';
import { AccountRequest, AccountRequestInput } from '../types/accountRequests';

// Account requests are stored on the server. This context keeps one piece of browser state:
// the request submitted from this browser, so the requester sees its status on Request Account
// and Login without signing in.

type MyRequest = Omit<AccountRequest, 'status' | 'seenByAdmin'>;

interface AccountRequestContextType {
  /** All requests (administrators only; empty for everyone else). */
  requests: AccountRequest[];
  isLoading: boolean;
  error: Error | null;
  pendingCount: number;
  unseenCount: number;
  /** The request submitted from this browser, with its live status. */
  myRequest?: AccountRequest;
  submitRequest: (input: AccountRequestInput) => Promise<AccountRequest>;
  approveRequest: (id: string, role: Role, hospitalId?: string) => Promise<unknown>;
  rejectRequest: (id: string, reason: string) => Promise<unknown>;
  markAllSeen: () => void;
  /** Server lookup of the latest request for an email (used when sign-in fails). */
  lookupRequest: (email: string) => Promise<AccountRequest | undefined>;
}

const AccountRequestContext = createContext<AccountRequestContextType | undefined>(undefined);
const MY_REQUEST_KEY = 'episim.myAccountRequest';

function loadMine(): MyRequest | null {
  try {
    const raw = window.sessionStorage.getItem(MY_REQUEST_KEY);
    return raw ? JSON.parse(raw) as MyRequest : null;
  } catch {
    return null;
  }
}

function saveMine(r: MyRequest) {
  try {
    window.sessionStorage.setItem(MY_REQUEST_KEY, JSON.stringify(r));
  } catch {
    // Storage blocked: the status banner lasts until reload.
  }
}

export function AccountRequestProvider({ children }: {children: ReactNode;}) {
  const listQ = useAccessRequests();
  const submitM = useSubmitRequest();
  const approveM = useApproveRequest();
  const rejectM = useRejectRequest();
  const seenM = useMarkRequestsSeen();
  const [mine, setMine] = useState<MyRequest | null>(loadMine);
  const statusQ = useRequestStatus(mine?.email);

  const requests = listQ.data ?? [];
  const pendingCount = requests.filter((r) => r.status === 'Pending').length;
  const unseenCount = requests.filter((r) => r.status === 'Pending' && !r.seenByAdmin).length;
  const myRequest = mine ? mergeStatus(mine, statusQ.data) : undefined;

  const submitRequest = async (input: AccountRequestInput) => {
    const res = await submitM.mutateAsync(input);
    const stored: MyRequest = {
      id: res.id,
      name: input.name.trim(),
      email: res.email,
      institution: input.institution,
      institutionAccountId: input.institutionAccountId,
      position: input.position,
      submittedAt: res.submittedAt
    };
    saveMine(stored);
    setMine(stored);
    return mergeStatus(stored, { status: 'Pending', submittedAt: res.submittedAt });
  };

  const lookupRequest = async (email: string) => {
    const s = await fetchRequestStatus(email);
    if (!s) return undefined;
    return mergeStatus(
      // The public lookup returns only the status; the email is the one the person typed.
      { id: '', name: '', email: email.trim().toLowerCase(), institution: '', institutionAccountId: '', position: '', submittedAt: s.submittedAt },
      s
    );
  };

  return (
    <AccountRequestContext.Provider
      value={{
        requests,
        isLoading: listQ.isLoading,
        error: listQ.error as Error | null,
        pendingCount,
        unseenCount,
        myRequest,
        submitRequest,
        approveRequest: (id, role, hospitalId) => approveM.mutateAsync({ id, role, institutionId: hospitalId }),
        rejectRequest: (id, reason) => rejectM.mutateAsync({ id, reason }),
        markAllSeen: () => {
          if (unseenCount > 0 && !seenM.isPending) seenM.mutate();
        },
        lookupRequest
      }}>
      
      {children}
    </AccountRequestContext.Provider>);

}

export function useAccountRequests() {
  const ctx = useContext(AccountRequestContext);
  if (!ctx) throw new Error('useAccountRequests must be used within AccountRequestProvider');
  return ctx;
}
