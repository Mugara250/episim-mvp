// 'analyst' is the internal key for the Epidemiologist role (epidemiologists, researchers, public health analysts)
export type Role = 'admin' | 'analyst' | 'officer' | 'policymaker';

export type AccessLevel =
'full' |
'write' |
'limited' |
'review' |
'read' |
'self' |
'none';

export const ROLES: Role[] = ['admin', 'analyst', 'officer', 'policymaker'];

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrator',
  officer: 'Public Health Officer',
  policymaker: 'Policy Maker',
  analyst: 'Epidemiologist'
};

// Demo user shown when switching roles from the top bar
export const ROLE_DEMO_NAMES: Record<Role, string> = {
  admin: 'Dr. Jean Damascene',
  officer: 'Dr. Robert K.',
  policymaker: 'Hon. Minister',
  analyst: 'Aline Uwase'
};

// Map routes to module IDs for the permission matrix
export type ModuleId =
'auth' |
'dashboard' |
'population' |
'disease' |
'simulation' |
'branching' |
'hcw' |
'rt' |
'interventions' |
'geographic' |
'healthcare' |
'visualization' |
'scenario' |
'reports' |
'users' |
'dataquality' |
'instructions' |
'presets' |
'capacity' |
'scenarios';

export const ROUTE_MODULES: Record<string, ModuleId> = {
  '/dashboard': 'dashboard',
  '/instructions': 'instructions',
  '/population': 'population',
  '/population/import': 'population',
  '/presets': 'presets',
  '/intervention-library': 'presets',
  '/simulation': 'simulation',
  '/health-workers': 'hcw',
  '/rt': 'rt',
  '/interventions': 'interventions',
  '/geographic': 'geographic',
  '/healthcare': 'healthcare',
  '/capacity': 'capacity',
  '/scenarios': 'scenarios',
  '/scenario': 'scenario',
  '/reports': 'reports',
  '/users': 'users'
};

export const PERMISSION_MATRIX: Record<Role, Record<ModuleId, AccessLevel>> = {
  // Admin area only: no science pages, no simulations, no report approval
  admin: {
    auth: 'full',
    dashboard: 'none',
    population: 'none',
    disease: 'none',
    simulation: 'none',
    branching: 'none',
    hcw: 'none',
    rt: 'none',
    interventions: 'none',
    geographic: 'none',
    healthcare: 'none',
    visualization: 'none',
    scenario: 'none',
    reports: 'none',
    users: 'full',
    dataquality: 'none',
    instructions: 'none',
    presets: 'none',
    capacity: 'full', // all profiles, all institutions (when given main-app access)
    scenarios: 'full' // all scenarios (when given main-app access)
  } as Record<ModuleId, AccessLevel>,
  // Own hospital only
  officer: {
    auth: 'self',
    dashboard: 'full',
    population: 'none',
    disease: 'none',
    simulation: 'write', // run own and shared scenarios
    branching: 'none',
    hcw: 'write', // staff-risk scenarios
    rt: 'write', // daily case entry
    interventions: 'full', // local response plans
    geographic: 'none',
    healthcare: 'full', // hospital tracker
    visualization: 'none',
    scenario: 'none',
    reports: 'read', // view and export own hospital
    users: 'none',
    dataquality: 'none',
    instructions: 'write',
    presets: 'read',
    capacity: 'write', // own institution's profiles
    scenarios: 'full' // own scenarios
  },
  // Executive, read-only view
  policymaker: {
    auth: 'self',
    dashboard: 'read',
    population: 'none',
    disease: 'none',
    simulation: 'read', // run history for shared scenarios only
    branching: 'none',
    hcw: 'none',
    rt: 'none',
    interventions: 'review',
    geographic: 'none',
    healthcare: 'none',
    visualization: 'none',
    scenario: 'read', // approved scenarios only
    reports: 'read', // approved reports only
    users: 'none',
    dataquality: 'none',
    instructions: 'none',
    presets: 'read',
    capacity: 'read',
    scenarios: 'review' // view shared scenarios, clone at clone level
  },
  // Epidemiologists, researchers and public health analysts: owns the science
  analyst: {
    auth: 'self',
    dashboard: 'full',
    population: 'write',
    disease: 'full', // edit and approve parameters
    simulation: 'full',
    branching: 'full',
    hcw: 'full',
    rt: 'full',
    interventions: 'full',
    geographic: 'full',
    healthcare: 'none',
    visualization: 'full',
    scenario: 'full',
    reports: 'full', // draft, submit, approve, export
    users: 'none',
    dataquality: 'full',
    instructions: 'none',
    presets: 'full', // create and edit custom presets
    capacity: 'none', // capacity planning belongs to Public Health Officers
    scenarios: 'full'
  }
};

export function getAccessLevel(role: Role, moduleId: ModuleId): AccessLevel {
  return PERMISSION_MATRIX[role][moduleId] || 'none';
}

export function hasAccess(role: Role, moduleId: ModuleId): boolean {
  const level = getAccessLevel(role, moduleId);
  return level !== 'none';
}