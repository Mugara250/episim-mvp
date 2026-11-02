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
  desc: 'Set disease parameters — R₀, incubation period, CFR — and load population data for your target region. EpiSim connects to WHO and national health registries.'
},
{
  n: 2,
  title: 'Simulate',
  desc: 'Run AI-powered models across multiple intervention scenarios simultaneously. SEIR, agent-based, and network models compute in parallel. Results in seconds.'
},
{
  n: 3,
  title: 'Decide',
  desc: 'Export scenario comparisons, generate policy briefings, and share live dashboards with ministers and WHO representatives. Evidence-based decisions, faster.'
}];


export const landingModules: LandingModule[] = [
{ icon: UserPlus, label: 'Registration', desc: 'Onboard your organization and configure access roles', tint: '#F59E0B' },
{ icon: LayoutDashboard, label: 'Dashboard', desc: 'Central command view of all active simulations', tint: '#3B82F6' },
{ icon: Users, label: 'Population Data', desc: 'Import and manage demographic and census datasets', tint: '#A78BFA' },
{ icon: FlaskConical, label: 'Disease Parameters', desc: 'Configure R₀, incubation, CFR, and transmission rates', tint: '#22C55E' },
{ icon: Zap, label: 'Simulation Engine', desc: 'Run multi-model epidemic simulations at scale', tint: '#FACC15' },
{ icon: LineChart, label: 'SEIR Model', desc: 'Classic compartmental modeling with extensions', tint: '#38BDF8' },
{ icon: Bot, label: 'Agent-Based Model', desc: 'Individual-level behavioral simulation', tint: '#94A3B8' },
{ icon: ShieldCheck, label: 'Interventions', desc: 'Vaccines, lockdowns, masking and school closures', tint: '#F472B6' },
{ icon: Map, label: 'Geographic Spread', desc: 'Track propagation across districts and borders', tint: '#2DD4BF' },
{ icon: Building2, label: 'Healthcare Capacity', desc: 'Model ICU, bed, and ventilator strain', tint: '#FB923C' },
{ icon: BarChart3, label: 'Visualization', desc: 'Interactive curves, maps, and fan charts', tint: '#60A5FA' },
{ icon: GitCompare, label: 'Scenario Comparison', desc: 'Side-by-side outcomes for every intervention mix', tint: '#C084FC' },
{ icon: FileText, label: 'Reports & Export', desc: 'PDF, CSV and shareable dashboard links', tint: '#4ADE80' },
{ icon: KeyRound, label: 'User Management', desc: 'Roles, permissions and audit trails', tint: '#F87171' }];


export const landingStats = [
{ v: '14', l: 'Simulation Modules' },
{ v: '5', l: 'Disease Models' },
{ v: '3', l: 'AI Modeling Approaches' },
{ v: '∞', l: 'Scenarios Possible' }];


export const exportItems = [
{ name: 'Outbreak Summary Report', format: 'PDF' },
{ name: 'Scenario Analysis Data', format: 'CSV' },
{ name: 'Policy Briefing Deck', format: 'PPT' },
{ name: 'Raw Simulation Data', format: 'JSON' },
{ name: 'Shareable Dashboard Link', format: 'URL' }];


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