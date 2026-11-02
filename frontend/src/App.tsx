import { ReactNode, useCallback } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { queryClient } from './api/queryClient';
import { Layout } from './components/Layout';
import { DemoRibbon } from './components/common/DemoRibbon';
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
import { hasAccess, ModuleId, ROUTE_MODULES } from './lib/rbac';
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
import { About } from './pages/About';
import { RunResults } from './pages/RunResults';

// Editing built-in presets and intervention types needs an elevated permission the
// server does not grant to the demo users, so the UI keeps those read-only.
const CAN_EDIT_BUILT_INS = false;

const ADMIN_PAGES: Record<string, () => JSX.Element> = {
  '/admin/users': AdminUserManagement,
  '/admin/roles': AdminRolesPermissions,
  '/admin/hospitals': AdminHospitals,
  '/admin/requests': AdminAccessRequests,
  '/admin/audit': AdminAuditLogs,
  '/admin/health': AdminSystemHealth,
  '/admin/announcements': AdminAnnouncements,
  '/admin/tickets': AdminSupportTickets,
  '/admin/settings': AdminSettings
};

/**
 * Pages still take the prototype's `onNavigate(route, reportId?)` prop. This shim maps it onto
 * React Router so page files keep working unchanged; new code should use useNavigate or <Link>.
 */
export function useAppNavigate() {
  const navigate = useNavigate();
  return useCallback(
    (route: string, reportId?: string) => navigate(route === '/reports' && reportId ? `/reports/${encodeURIComponent(reportId)}` : route),
    [navigate]
  );
}

/** The sidebar entry a URL belongs to (detail pages highlight their parent). */
function navRouteFor(pathname: string) {
  if (pathname === '/population/import') return '/population';
  if (pathname.startsWith('/simulation/')) return '/simulation';
  if (pathname.startsWith('/reports/')) return '/reports';
  return pathname;
}

function moduleFor(pathname: string): ModuleId | undefined {
  return ROUTE_MODULES[navRouteFor(pathname)];
}

function FullPageMessage({ children }: {children: ReactNode;}) {
  return <div className="min-h-screen flex items-center justify-center bg-background text-body text-text-secondary">{children}</div>;
}

function Standalone({ children }: {children: ReactNode;}) {
  return (
    <>
      <DemoRibbon />
      {children}
    </>);

}

function RequireAuth({ children }: {children: ReactNode;}) {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <FullPageMessage>Signing you in…</FullPageMessage>;
  if (status === 'anonymous') return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <>{children}</>;
}

function NoAccess({ title, text }: {title: string;text: string;}) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center h-full text-center text-text-secondary">
      <h2 className="text-h2 text-text-primary mb-2">{title}</h2>
      <p className="text-body max-w-md">{text}</p>
      <button onClick={() => navigate('/dashboard')} className="mt-6 text-primary hover:underline text-[13px] font-semibold">
        Return to Dashboard
      </button>
    </div>);

}

function UnderConstruction() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center h-full text-text-secondary">
      <h2 className="text-h2 mb-2">Under Construction</h2>
      <p className="text-body">This module is currently being built.</p>
      <button onClick={() => navigate('/dashboard')} className="mt-6 text-primary hover:underline text-[13px] font-semibold">
        Return to Dashboard
      </button>
    </div>);

}

function ReportsPage() {
  const { role } = useAuth();
  const { reportId } = useParams();
  if (role === 'analyst') return <AnalystReports />;
  if (role === 'officer') return <OfficerReports />;
  if (role === 'policymaker') return <PolicyReports />;
  return <Reports focusedReportId={reportId ?? null} />;
}

function AdminArea() {
  const { role } = useAuth();
  const { pathname } = useLocation();
  const onNavigate = useAppNavigate();
  if (role !== 'admin') return <Navigate to="/dashboard" replace />;
  const Page = ADMIN_PAGES[pathname];
  if (!Page) return <Navigate to="/admin/users" replace />;
  return (
    <AdminLayout onNavigate={onNavigate} currentRoute={pathname}>
      <Page />
    </AdminLayout>);

}

function MainArea() {
  const { role } = useAuth();
  const { pathname } = useLocation();
  const onNavigate = useAppNavigate();
  // The administrator works only in the admin area.
  if (role === 'admin') return <Navigate to="/admin/users" replace />;
  const isAnalyst = role === 'analyst';
  const isOfficer = role === 'officer';
  const isPolicy = role === 'policymaker';
  const moduleId = moduleFor(pathname);
  // /healthcare picks its page by role below, so it is not blocked here.
  const blocked = moduleId && pathname !== '/healthcare' && !hasAccess(role, moduleId);

  return (
    <Layout onNavigate={onNavigate} currentRoute={navRouteFor(pathname)}>
      {blocked ?
      <NoAccess title="This page isn’t available to your role" text="Your role doesn’t include access to this module. Ask an administrator if you think you need it." /> :

      <Routes>
          <Route
          path="dashboard"
          element={
          isAnalyst ?
          <AnalystDashboard onNavigate={onNavigate} /> :
          isOfficer ?
          <OfficerDashboard onNavigate={onNavigate} /> :
          isPolicy ?
          <PolicyDashboard onNavigate={onNavigate} /> :

          <Dashboard onNavigate={onNavigate} />

          } />

          <Route path="instructions" element={<ResponseInstructions />} />
          <Route path="population" element={<PopulationData onNavigate={onNavigate} />} />
          <Route path="population/import" element={<PopulationImport onNavigate={onNavigate} />} />
          <Route path="presets" element={<DiseasePresets onNavigate={onNavigate} canEditBuiltIns={CAN_EDIT_BUILT_INS} />} />
          <Route path="intervention-library" element={<Interventions canEditBuiltIns={false} />} />
          <Route path="simulation" element={<Simulations onNavigate={onNavigate} />} />
          <Route path="simulation/runs/:runId" element={<RunResults />} />
          <Route path="health-workers" element={<HealthWorkerLayer onNavigate={onNavigate} />} />
          <Route path="rt" element={<RtTracking onNavigate={onNavigate} />} />
          <Route
          path="interventions"
          element={isOfficer ? <LocalResponsePlans /> : isPolicy ? <PolicyInterventions /> : <Interventions canEditBuiltIns={CAN_EDIT_BUILT_INS} />} />

          <Route path="geographic" element={<Geographic />} />
          <Route
          path="healthcare"
          element={
          isOfficer ?
          <HospitalTracker /> :
          hasAccess(role, 'capacity') ?
          <CapacityProfiles /> :

          <NoAccess
            title="Healthcare capacity is managed by Public Health Officers"
            text="Capacity profiles are kept by each hospital’s Public Health Officer and aren’t available to your role." />


          } />

          <Route path="capacity" element={<CapacityProfiles />} />
          <Route path="scenarios" element={<Scenarios onNavigate={onNavigate} />} />
          <Route path="scenario" element={isAnalyst ? <AnalystScenarios /> : isPolicy ? <PolicyScenarios /> : <ScenarioComparison />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="reports/:reportId" element={<ReportsPage />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<UnderConstruction />} />
        </Routes>
      }
    </Layout>);

}

function AppRoutes() {
  const onNavigate = useAppNavigate();
  return (
    <Routes>
      <Route path="/" element={<Standalone><Landing onNavigate={onNavigate} /></Standalone>} />
      <Route path="/login" element={<Standalone><Login onNavigate={onNavigate} /></Standalone>} />
      <Route path="/request-account" element={<Standalone><RequestAccount onNavigate={onNavigate} /></Standalone>} />
      <Route path="/register" element={<Standalone><RequestAccount onNavigate={onNavigate} /></Standalone>} />
      <Route path="/forgot" element={<Standalone><ForgotPassword onNavigate={onNavigate} /></Standalone>} />
      <Route path="/mfa" element={<Standalone><MFA onNavigate={onNavigate} /></Standalone>} />
      <Route path="/about" element={<Standalone><About /></Standalone>} />
      <Route path="/admin/*" element={<RequireAuth><AdminArea /></RequireAuth>} />
      <Route path="/*" element={<RequireAuth><MainArea /></RequireAuth>} />
    </Routes>);

}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <OfficerProvider>
            <AdminProvider>
              <AccountRequestProvider>
                <ImportJobProvider>
                  <SimulationRunsProvider>
                    <AppRoutes />
                  </SimulationRunsProvider>
                </ImportJobProvider>
              </AccountRequestProvider>
            </AdminProvider>
          </OfficerProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>);

}
