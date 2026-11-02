import { AdminUser } from '../types/admin';

export const adminUsers: AdminUser[] = [
{ id: 'U-01', name: 'Dr. Jean Damascene', email: 'j.damascene@rbc.gov.rw', role: 'admin', organisation: 'Rwanda Biomedical Centre', status: 'Active', lastLogin: '2026-10-08 08:12' },
{ id: 'U-02', name: 'Dr. Sarah Icyeza', email: 's.icyeza@rbc.gov.rw', role: 'analyst', organisation: 'Rwanda Biomedical Centre', status: 'Active', lastLogin: '2026-10-08 09:40' },
{ id: 'U-03', name: 'Dr. Eric Habimana', email: 'e.habimana@ur.ac.rw', role: 'analyst', organisation: 'University of Rwanda', status: 'Active', lastLogin: '2026-10-06 14:05' },
{ id: 'U-04', name: 'Aline Uwase', email: 'a.uwase@rbc.gov.rw', role: 'analyst', organisation: 'Rwanda Biomedical Centre', status: 'Active', lastLogin: '2026-10-08 10:02' },
{ id: 'U-05', name: 'Patrick Niyonzima', email: 'p.niyonzima@pih.org', role: 'analyst', organisation: 'Partners In Health', status: 'Pending', lastLogin: 'Never' },
{ id: 'U-06', name: 'Dr. Robert K.', email: 'r.kalisa@gisenyihospital.rw', role: 'officer', organisation: 'Ministry of Health', hospitalId: 'H-01', status: 'Active', lastLogin: '2026-10-08 07:55' },
{ id: 'U-07', name: 'Grace Mukamana', email: 'g.mukamana@kibagabaga.rw', role: 'officer', organisation: 'Ministry of Health', hospitalId: 'H-02', status: 'Active', lastLogin: '2026-10-07 18:21' },
{ id: 'U-08', name: 'Claude Nshimiyimana', email: 'c.nshimiyimana@masaka.rw', role: 'officer', organisation: 'Ministry of Health', hospitalId: 'H-03', status: 'Inactive', lastLogin: '2026-08-14 11:30' },
{ id: 'U-09', name: 'Hon. Minister', email: 'minister.office@moh.gov.rw', role: 'policymaker', organisation: 'Ministry of Health', status: 'Active', lastLogin: '2026-10-07 16:48' },
{ id: 'U-10', name: 'Diane Ingabire', email: 'd.ingabire@moh.gov.rw', role: 'policymaker', organisation: 'Ministry of Health', status: 'Active', lastLogin: '2026-10-05 09:15' }];


export const ORGANISATIONS = [
'Rwanda Biomedical Centre',
'Ministry of Health',
'University of Rwanda',
'Partners In Health'];