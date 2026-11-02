import React, { useState } from 'react';
import { useScreenInit } from './useScreenInit.js';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Landing } from './pages/Landing';
import { MFA } from './pages/MFA';
import { Login } from './pages/Login';
import { RequestAccount } from './pages/RequestAccount';
import { AccountRequestProvider } from './context/AccountRequestContext';
import { ForgotPassword } from './pages/ForgotPassword';
import { PopulationData } from './pages/PopulationData';
import { Simulations } from './pages/Simulations';
import { SimulationRunsProvider } from './context/SimulationRunsContext';
import { HealthWorkerLayer } from './pages/HealthWorkerLayer';
import { RtTracking } from './pages/RtTracking';
import { Interventions } from './pages/Interventions';
import { Geographic } from './pages/Geographic';
import { CapacityProfiles } from './pages/CapacityProfiles';
import { Scenarios } from './pages/Scenarios';
import { hasAccess } from './lib/rbac';
import { ScenarioComparison } from './pages/ScenarioComparison';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AnalystDashboard } from './pages/AnalystDashboard';
import { AnalystScenarios } from './pages/AnalystScenarios';
import { AnalystReports } from './pages/AnalystReports';
import { OfficerProvider } from './context/OfficerContext';
import { OfficerDashboard } from './pages/OfficerDashboard';
import { HospitalTracker } from './pages/HospitalTracker';
import { ResponseInstructions } from './pages/ResponseInstructions';
import { LocalResponsePlans } from './pages/LocalResponsePlans';
import { OfficerReports } from './pages/OfficerReports';
import { PolicyDashboard } from './pages/PolicyDashboard';
import { PolicyScenarios } from './pages/PolicyScenarios';
import { PolicyInterventions } from './pages/PolicyInterventions';
import { PolicyReports } from './pages/PolicyReports';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminUserManagement } from './pages/admin/AdminUserManagement';
import { AdminRolesPermissions } from './pages/admin/AdminRolesPermissions';
import { AdminHospitals } from './pages/admin/AdminHospitals';
import { AdminProvider } from './context/AdminContext';
import { ImportJobProvider } from './context/ImportJobContext';
import { PopulationImport } from './pages/PopulationImport';
import { DiseasePresets } from './pages/DiseasePresets';
import { AdminAccessRequests } from './pages/admin/AdminAccessRequests';
import { AdminAuditLogs } from './pages/admin/AdminAuditLogs';
import { AdminSystemHealth } from './pages/admin/AdminSystemHealth';
import { AdminAnnouncements } from './pages/admin/AdminAnnouncements';
import { AdminSupportTickets } from './pages/admin/AdminSupportTickets';
import { AdminSettings } from './pages/admin/AdminSettings';
const ADMIN_ROUTES = [
'/admin/users',
'/admin/roles',
'/admin/hospitals',
'/admin/requests',
'/admin/audit',
'/admin/health',
'/admin/announcements',
'/admin/tickets',
'/admin/settings'];

function AppRoutes({ canEditBuiltIns }: {canEditBuiltIns: boolean;}) {
  const screenInit = useScreenInit();
  // Simple state-based routing for the prototype
  const [currentRoute, setCurrentRoute] = useState(
    screenInit.currentRoute ?? '/'
  );
  const [focusedReportId, setFocusedReportId] = useState<string | null>(null);
  const { role } = useAuth();
  const isAnalyst = role === 'analyst';
  const isOfficer = role === 'officer';
  const isPolicy = role === 'policymaker';
  const handleNavigate = (route: string, reportId?: string) => {
    setFocusedReportId(reportId ?? null);
    setCurrentRoute(route);
  };
  // Standalone pages without the main layout shell
  if (currentRoute === '/') return <Landing onNavigate={setCurrentRoute} />;
  if (currentRoute === '/login') return <Login onNavigate={setCurrentRoute} />;
  if (currentRoute === '/request-account' || currentRoute === '/register')
  return <RequestAccount onNavigate={setCurrentRoute} />;
  if (currentRoute === '/forgot')
  return <ForgotPassword onNavigate={setCurrentRoute} />;
  if (currentRoute === '/mfa') return <MFA onNavigate={setCurrentRoute} />;
  // Admin Application (admin sees only the admin area)
  if (currentRoute.startsWith('/admin') || role === 'admin') {
    const adminRoute = ADMIN_ROUTES.includes(currentRoute) ?
    currentRoute :
    '/admin/users';
    return (
      <AdminLayout onNavigate={setCurrentRoute} currentRoute={adminRoute}>
        {adminRoute === '/admin/users' && <AdminUserManagement />}
        {adminRoute === '/admin/roles' && <AdminRolesPermissions />}
        {adminRoute === '/admin/hospitals' && <AdminHospitals />}
        {adminRoute === '/admin/requests' && <AdminAccessRequests />}
        {adminRoute === '/admin/audit' && <AdminAuditLogs />}
        {adminRoute === '/admin/health' && <AdminSystemHealth />}
        {adminRoute === '/admin/announcements' && <AdminAnnouncements />}
        {adminRoute === '/admin/tickets' && <AdminSupportTickets />}
        {adminRoute === '/admin/settings' && <AdminSettings />}
      </AdminLayout>);

  }
  // Pages wrapped in the main application layout
  return (
    <Layout
      onNavigate={setCurrentRoute}
      currentRoute={currentRoute === '/population/import' ? '/population' : currentRoute}>
      
      {currentRoute === '/dashboard' && (
      isAnalyst ?
      <AnalystDashboard onNavigate={setCurrentRoute} /> :
      isOfficer ?
      <OfficerDashboard onNavigate={setCurrentRoute} /> :
      isPolicy ?
      <PolicyDashboard onNavigate={setCurrentRoute} /> :

      <Dashboard onNavigate={handleNavigate} />)
      }
      {currentRoute === '/instructions' && <ResponseInstructions />}
      {currentRoute === '/population' && <PopulationData onNavigate={setCurrentRoute} />}
      {currentRoute === '/population/import' && <PopulationImport onNavigate={setCurrentRoute} />}
      {currentRoute === '/presets' &&
      <DiseasePresets onNavigate={setCurrentRoute} canEditBuiltIns={canEditBuiltIns} />
      }
      {currentRoute === '/intervention-library' && <Interventions canEditBuiltIns={false} />}
      {currentRoute === '/simulation' && <Simulations onNavigate={setCurrentRoute} />}
      {currentRoute === '/health-workers' && <HealthWorkerLayer onNavigate={setCurrentRoute} />}
      {currentRoute === '/rt' && <RtTracking onNavigate={setCurrentRoute} />}
      {currentRoute === '/interventions' && (
      isOfficer ?
      <LocalResponsePlans /> :
      isPolicy ?
      <PolicyInterventions /> :

      <Interventions canEditBuiltIns={canEditBuiltIns} />)
      }
      {currentRoute === '/geographic' && <Geographic />}
      {currentRoute === '/healthcare' && isOfficer && <HospitalTracker />}
      {(currentRoute === '/capacity' || currentRoute === '/healthcare' && !isOfficer) && (
      hasAccess(role, 'capacity') ?
      <CapacityProfiles /> :

      <div className="flex flex-col items-center justify-center h-full text-center text-text-secondary">
            <h2 className="text-h2 text-text-primary mb-2">Healthcare capacity is managed by Public Health Officers</h2>
            <p className="text-body max-w-md">Capacity profiles are kept by each hospital’s Public Health Officer and aren’t available to your role.</p>
            <button onClick={() => setCurrentRoute('/dashboard')} className="mt-6 text-primary hover:underline text-[13px] font-semibold">
              Return to Dashboard
            </button>
          </div>)
      }
      {currentRoute === '/scenarios' && <Scenarios onNavigate={setCurrentRoute} />}
      {currentRoute === '/scenario' && (
      isAnalyst ?
      <AnalystScenarios /> :
      isPolicy ?
      <PolicyScenarios /> :

      <ScenarioComparison />)
      }
      {currentRoute === '/reports' && (
      isAnalyst ?
      <AnalystReports /> :
      isOfficer ?
      <OfficerReports /> :
      isPolicy ?
      <PolicyReports /> :

      <Reports focusedReportId={focusedReportId} />)
      }
      {currentRoute === '/settings' && <Settings />}

      {/* Fallback for unhandled routes */}
      {![
      '/dashboard',
      '/instructions',
      '/population',
      '/population/import',
      '/presets',
      '/intervention-library',
      '/simulation',
      '/health-workers',
      '/rt',
      '/interventions',
      '/geographic',
      '/healthcare',
      '/capacity',
      '/scenarios',
      '/scenario',
      '/reports',
      '/settings'].
      includes(currentRoute) &&
      <div className="flex flex-col items-center justify-center h-full text-text-secondary">
          <h2 className="text-h2 mb-2">Under Construction</h2>
          <p className="text-body">This module is currently being built.</p>
          <button
          onClick={() => setCurrentRoute('/dashboard')}
          className="mt-6 text-primary hover:underline text-[13px] font-semibold">
          
            Return to Dashboard
          </button>
        </div>
      }
    </Layout>);

}
interface AppProps {
  /** How a population import ends the first time it runs (retry always succeeds). */
  importOutcome?: 'succeed' | 'fail';
  /** Grants the signed-in Epidemiologist permission to edit built-in disease presets and intervention types. */
  canEditBuiltIns?: boolean;
  /** How the next simulation started on the Simulations page ends ("Try again" always succeeds). */
  simulationOutcome?: 'succeed' | 'fail';
}
export function App({ importOutcome = 'succeed', canEditBuiltIns = false, simulationOutcome = 'succeed' }: AppProps) {
  return (
    <AuthProvider>
      <OfficerProvider>
        <AdminProvider>
          <AccountRequestProvider>
            <ImportJobProvider outcome={importOutcome}>
              <SimulationRunsProvider outcome={simulationOutcome}>
                <AppRoutes canEditBuiltIns={canEditBuiltIns} />
              </SimulationRunsProvider>
            </ImportJobProvider>
          </AccountRequestProvider>
        </AdminProvider>
      </OfficerProvider>
    </AuthProvider>);

}