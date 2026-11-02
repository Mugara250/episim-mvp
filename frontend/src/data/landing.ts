import {
  UserPlus,
  LayoutDashboard,
  Users,
  FlaskConical,
  Zap,
  LineChart,
  Bot,
  ShieldCheck,
  Map,
  Building2,
  BarChart3,
  GitCompare,
  FileText,
  KeyRound } from
'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface LandingModule {
  icon: LucideIcon;
  label: string;
  desc: string;
  tint: string;
}

export const navLinks = [
{ label: 'Features', href: '#features' },
{ label: 'Modules', href: '#modules' },
{ label: 'How It Works', href: '#workflow' },
{ label: 'For Epidemiologists', href: '#features' }];


export const workflowSteps = [
{
  n: 1,
  title: 'Configure',
  desc: 'Pick a disease preset (each value shows its source and whether it is provisional), a population dataset and an intervention package.'
},
{
  n: 2,
  title: 'Simulate',
  desc: 'Run the stochastic SEIHFR model hundreds of times, nationally or across the 30 districts. Results in seconds, as ranges.'
},
{
  n: 3,
  title: 'Decide',
  desc: 'Compare completed runs against bed capacity, write a report, have it approved, and share it with decision-makers.'
}];


export const landingModules: LandingModule[] = [
{ icon: UserPlus, label: 'Registration', desc: 'Onboard your organization and configure access roles', tint: '#F59E0B' },
{ icon: LayoutDashboard, label: 'Dashboard', desc: 'Central command view of all active simulations', tint: '#3B82F6' },
{ icon: Users, label: 'Population Data', desc: 'Import and manage demographic and census datasets', tint: '#A78BFA' },
{ icon: FlaskConical, label: 'Disease Parameters', desc: 'Configure R₀, incubation, CFR, and transmission rates', tint: '#22C55E' },
{ icon: Zap, label: 'Simulation Engine', desc: 'Run multi-model epidemic simulations at scale', tint: '#FACC15' },
{ icon: LineChart, label: 'SEIHFR Model', desc: 'Community, hospital and funeral transmission routes', tint: '#38BDF8' },
{ icon: Bot, label: 'Health-Worker Layer', desc: 'Staff infections from hospitalised patients', tint: '#94A3B8' },
{ icon: ShieldCheck, label: 'Interventions', desc: 'Time-windowed levers on the model', tint: '#F472B6' },
{ icon: Map, label: 'Geographic Spread', desc: 'Estimated spread across the 30 districts', tint: '#2DD4BF' },
{ icon: Building2, label: 'Healthcare Capacity', desc: 'Isolation-bed demand vs capacity', tint: '#FB923C' },
{ icon: BarChart3, label: 'Visualization', desc: 'Interactive curves, maps, and fan charts', tint: '#60A5FA' },
{ icon: GitCompare, label: 'Scenario Comparison', desc: 'Side-by-side outcomes for every intervention mix', tint: '#C084FC' },
{ icon: FileText, label: 'Reports & Export', desc: 'PDF reports, CSV tables and shareable links', tint: '#4ADE80' },
{ icon: KeyRound, label: 'User Management', desc: 'Roles, permissions and audit trails', tint: '#F87171' }];


export const landingStats = [
{ v: '2', l: 'Diseases so far (Ebola, Marburg)' },
{ v: '30', l: 'Districts on the map' },
{ v: '200', l: 'Monte Carlo runs per scenario' },
{ v: '4', l: 'User roles' }];


export const exportItems = [
{ name: 'Approved Scenario Report', format: 'PDF' },
{ name: 'District Projections Table', format: 'CSV' },
{ name: 'Spread Map Image', format: 'PNG' },
{ name: 'Shareable Comparison Link', format: 'URL' }];


export const footerColumns = [
{
  title: 'PLATFORM',
  items: ['Documentation', 'API Reference', 'Simulation Guide', 'Changelog', 'Status']
},
{
  title: 'ORGANIZATION',
  items: ['About EpiSim', 'Research Papers', 'Partners', 'Support', 'Contact']
},
{
  title: 'LEGAL',
  items: ['Privacy Policy', 'Terms of Use', 'Data Security', 'Accessibility']
}];