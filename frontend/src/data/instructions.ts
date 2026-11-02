import { Instruction } from '../types/officer';

export const instructions: Instruction[] = [
{ id: 'INS-041', action: 'Open additional isolation beds in the annex ward', target: '8 beds', deadline: '2026-10-11', from: 'Dr. Sarah Icyeza', disease: 'Ebola', received: '2026-10-07', status: 'In progress' },
{ id: 'INS-040', action: 'Refresh protective equipment training for ward staff', target: '30 staff', deadline: '2026-10-10', from: 'Dr. Sarah Icyeza', disease: 'Marburg', received: '2026-10-06', status: 'Not started' },
{ id: 'INS-039', action: 'Follow up contacts listed for Kanama sector daily', target: '90 contacts', deadline: '2026-10-09', from: 'Dr. Sarah Icyeza', disease: 'Ebola', received: '2026-10-05', status: 'In progress' },
{ id: 'INS-037', action: 'Keep a second safe-burial team on standby', target: '1 team', deadline: '2026-10-08', from: 'Dr. Sarah Icyeza', disease: 'Ebola', received: '2026-10-03', status: "Can't do", reason: 'Only one trained team in the district; request support from RBC.' },
{ id: 'INS-035', action: 'Set up a screening point at the main entrance', target: '1 point, 24 h', deadline: '2026-10-04', from: 'Dr. Sarah Icyeza', disease: 'Ebola', received: '2026-10-01', status: 'Done' }];