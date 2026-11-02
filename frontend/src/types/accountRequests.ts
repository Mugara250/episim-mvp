import { Role } from '../lib/rbac';

export type AccountRequestStatus = 'Pending' | 'Approved' | 'Rejected';

export interface AccountRequest {
  id: string;
  name: string;
  email: string;
  institution: string;
  institutionAccountId: string;
  /** Role or position the person holds at their institution, e.g. "District Epidemiologist". */
  position: string;
  status: AccountRequestStatus;
  /** ISO timestamp */
  submittedAt: string;
  decidedAt?: string;
  decidedBy?: string;
  /** System role assigned by the administrator on approval. */
  assignedRole?: Role;
  rejectionReason?: string;
  /** False until an administrator has opened the notification or requests page. */
  seenByAdmin: boolean;
  /** Seeded sample request for the demo. */
  illustrative?: boolean;
}

export type AccountRequestInput = Pick<AccountRequest, 'name' | 'email' | 'institution' | 'institutionAccountId' | 'position'> & {
  /** Sent once to the server, which stores only its hash; becomes the password when approved. */
  password: string;
};