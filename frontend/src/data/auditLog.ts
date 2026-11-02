import { AuditEntry } from '../types/admin';

// Newest first. Includes parameter changes, approvals and report publishing.
export const auditLog: AuditEntry[] = [
{ id: 'A-0412', time: '2026-10-08 10:02', user: 'Aline Uwase', role: 'Epidemiologist', action: 'Sign in', target: 'EpiSim', details: 'Signed in' },
{ id: 'A-0411', time: '2026-10-08 09:47', user: 'Dr. Sarah Icyeza', role: 'Epidemiologist', action: 'Simulation run', target: 'Ebola · Rubavu', details: '200 runs, approved set v2.1' },
{ id: 'A-0410', time: '2026-10-08 08:15', user: 'Dr. Jean Damascene', role: 'Admin', action: 'User updated', target: 'Grace Mukamana', details: 'Hospital set to Kibagabaga District Hospital' },
{ id: 'A-0409', time: '2026-10-07 17:30', user: 'Aline Uwase', role: 'Epidemiologist', action: 'Report submitted', target: 'Weekly situation report · week 41', details: 'Sent for approval' },
{ id: 'A-0408', time: '2026-10-07 11:20', user: 'Dr. Sarah Icyeza', role: 'Epidemiologist', action: 'Parameter change', target: 'Marburg · draft set v1.4', details: 'Incubation period range 5–9 → 4–10 days' },
{ id: 'A-0407', time: '2026-10-06 15:05', user: 'Dr. Sarah Icyeza', role: 'Epidemiologist', action: 'Report published', target: 'Weekly situation report · week 40', details: 'Visible to policy makers' },
{ id: 'A-0406', time: '2026-10-06 14:58', user: 'Dr. Sarah Icyeza', role: 'Epidemiologist', action: 'Report approved', target: 'Weekly situation report · week 40', details: 'Approved without changes' },
{ id: 'A-0405', time: '2026-10-05 10:40', user: 'Dr. Sarah Icyeza', role: 'Epidemiologist', action: 'Simulation run', target: 'Ebola · 4 approved scenarios', details: '150 runs each' },
{ id: 'A-0404', time: '2026-10-04 16:12', user: 'Dr. Sarah Icyeza', role: 'Epidemiologist', action: 'Report approved', target: 'Effect of faster isolation on Ebola', details: 'Approved' },
{ id: 'A-0403', time: '2026-10-04 16:14', user: 'Dr. Sarah Icyeza', role: 'Epidemiologist', action: 'Report published', target: 'Effect of faster isolation on Ebola', details: 'Visible to policy makers' },
{ id: 'A-0402', time: '2026-10-02 09:05', user: 'Dr. Eric Habimana', role: 'Epidemiologist', action: 'Parameter set approved', target: 'Ebola · set v2.1', details: 'Replaces v2.0' },
{ id: 'A-0401', time: '2026-10-01 18:44', user: 'Dr. Eric Habimana', role: 'Epidemiologist', action: 'Parameter change', target: 'Ebola · draft set v2.1', details: 'Spread rate (R0) range 1.4–2.2 → 1.5–2.4' },
{ id: 'A-0400', time: '2026-10-01 12:30', user: 'Dr. Sarah Icyeza', role: 'Epidemiologist', action: 'Report published', target: 'Marburg: protecting health workers', details: 'Visible to policy makers' },
{ id: 'A-0399', time: '2026-09-29 08:50', user: 'Dr. Jean Damascene', role: 'Admin', action: 'Account status changed', target: 'Claude Nshimiyimana', details: 'Active → Inactive' },
{ id: 'A-0398', time: '2026-09-24 14:10', user: 'Dr. Sarah Icyeza', role: 'Epidemiologist', action: 'Parameter set approved', target: 'Marburg · set v1.3', details: 'Provisional values' },
{ id: 'A-0397', time: '2026-09-22 11:02', user: 'Dr. Jean Damascene', role: 'Admin', action: 'Hospital updated', target: 'Gisenyi District Hospital', details: 'Isolation beds 20 → 24' }];