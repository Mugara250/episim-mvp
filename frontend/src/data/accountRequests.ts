import { AccountRequest } from '../types/accountRequests';

export const accountRequests: AccountRequest[] = [
{
  id: 'REQ-1027',
  name: 'Dr. John Mugisha',
  email: 'j.mugisha@chuk.rw',
  institution: 'University Teaching Hospital of Kigali (CHUK)',
  institutionAccountId: 'CHUK-EMP-04418',
  position: 'Infectious Disease Physician',
  password: 'request123',
  status: 'Pending',
  submittedAt: '2026-10-09T08:12:00',
  seenByAdmin: false
},
{
  id: 'REQ-1026',
  name: 'Alice Uwimana',
  email: 'a.uwimana@moh.gov.rw',
  institution: 'Ministry of Health Rwanda',
  institutionAccountId: 'MOH-2291',
  position: 'Director of Epidemic Preparedness',
  password: 'request123',
  status: 'Pending',
  submittedAt: '2026-10-08T15:40:00',
  seenByAdmin: true
},
{
  id: 'REQ-1024',
  name: 'Dr. Claudine Ingabire',
  email: 'c.ingabire@rbc.gov.rw',
  institution: 'Rwanda Biomedical Centre',
  institutionAccountId: 'RBC-STF-1180',
  position: 'Senior Epidemiologist',
  password: 'request123',
  status: 'Approved',
  submittedAt: '2026-10-06T09:05:00',
  decidedAt: '2026-10-06T11:30:00',
  decidedBy: 'Dr. Jean Damascene',
  assignedRole: 'analyst',
  seenByAdmin: true
},
{
  id: 'REQ-1021',
  name: 'Kevin Habimana',
  email: 'kevin.h@gmail.com',
  institution: 'Other',
  institutionAccountId: 'N/A',
  position: 'Student',
  password: 'request123',
  status: 'Rejected',
  submittedAt: '2026-10-03T13:22:00',
  decidedAt: '2026-10-04T08:10:00',
  decidedBy: 'Dr. Jean Damascene',
  rejectionReason: 'Account ID could not be verified with a registered institution.',
  seenByAdmin: true
}];


export const requestInstitutions = [
'Ministry of Health Rwanda',
'Rwanda Biomedical Centre',
'University Teaching Hospital of Kigali (CHUK)',
'WHO Africa',
'UNICEF',
'University of Rwanda',
'Other'];