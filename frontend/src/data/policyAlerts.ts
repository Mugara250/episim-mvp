import { PolicyAlert } from '../types/policy';

export const policyAlerts: PolicyAlert[] = [
{
  id: 'AL-1',
  level: 'high',
  title: 'Isolation beds in Rubavu are almost full',
  detail: 'Gisenyi District Hospital reports 21 of 24 isolation beds in use. Extra beds are being opened.',
  date: '08 Oct 2026'
},
{
  id: 'AL-2',
  level: 'medium',
  title: 'Health workers among Marburg cases',
  detail: 'Two health workers infected this week. Early protection for staff is under review.',
  date: '07 Oct 2026'
},
{
  id: 'AL-3',
  level: 'info',
  title: 'New report approved',
  detail: 'Weekly situation report for week 40 is ready to read.',
  date: '06 Oct 2026'
}];