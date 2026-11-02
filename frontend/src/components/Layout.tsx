import React, { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  LayoutDashboard,
  Database,
  Cpu,
  ShieldAlert,
  Map,
  Building2,
  GitCompare,
  FileText,
  Settings,
  LogOut,
  Bell,
  ChevronDown,
  ChevronRight,
  Shield,
  Network,
  Users,
  FolderKanban,
  PlayCircle,
  Stethoscope,
  UserCog,
  Check,
  X,
  User,
  HardHat,
  TrendingUp,
  ListChecks,
  Dna,
  Layers,
  Info } from
'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDemoMode, useMeta } from '../api/meta';
import { DemoRibbon } from './common/DemoRibbon';
import { useRunList } from '../api/simulations';

function timeAgo(iso?: string | null) {
  if (!iso) return '';
  const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (min < 60) return `${min}m ago`;
  if (min < 60 * 24) return `${Math.round(min / 60)}h ago`;
  return `${Math.round(min / 1440)}d ago`;
}
import {
  hasAccess,
  ROLE_LABELS,
  ROLES,
  ROUTE_MODULES,
  ModuleId,
  Role } from
'../lib/rbac';
interface LayoutProps {
  children: React.ReactNode;
  currentRoute: string;
  onNavigate: (route: string) => void;
}
interface NavChild {
  id: string;
  label: string;
  icon: LucideIcon;
  moduleId: ModuleId;
}
interface NavGroup {
  id: string;
  label: string;
  icon: LucideIcon;
  moduleId?: ModuleId;
  children?: NavChild[];
}
export function Layout({ children, currentRoute, onNavigate }: LayoutProps) {
  const { role, user, demoLogin, logout, userName, setUserName } = useAuth();
  const demoMode = useDemoMode();
  const { data: meta } = useMeta();
  const navigate = useNavigate();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);
  // Demo only: switching role signs in as that role's seeded demo user (a real token swap).
  const switchRole = async (next: Role) => {
    setShowRoleMenu(false);
    if (next === role) return;
    setSwitchError(null);
    try {
      await demoLogin(next);
    } catch (e) {
      setSwitchError(e instanceof Error ? e.message : 'Could not switch role.');
      return;
    }
    if (next === 'admin') {
      onNavigate('/admin/users');
      return;
    }
    const moduleId = ROUTE_MODULES[currentRoute];
    if (moduleId && !hasAccess(next, moduleId)) onNavigate('/dashboard');
  };
  const signOut = async () => {
    await logout();
    navigate('/login');
  };
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: userName,
    email: user?.email ?? '',
    organization: user?.institutionName ?? ''
  });
  const openProfile = () => {
    setProfileForm((prev) => ({
      ...prev,
      name: userName
    }));
    setShowProfileMenu(false);
    setShowProfileModal(true);
  };
  const saveProfile = () => {
    setUserName(profileForm.name.trim() || userName);
    setShowProfileModal(false);
  };
  // Notifications are the user's real recent simulation runs (finished, failed or cancelled).
  // Read state is kept in memory for this session only.
  const runsQ = useRunList(hasAccess(role, 'simulation'));
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set());
  const notifications = (runsQ.data ?? []).
  filter((r) => r.status === 'completed' || r.status === 'failed' || r.status === 'cancelled').
  sort((a, b) => (b.completedAt ?? b.queuedAt ?? '').localeCompare(a.completedAt ?? a.queuedAt ?? '')).
  slice(0, 5).
  map((r) => ({
    id: r.id,
    title: `Simulation ${r.id} ${r.status}`,
    description: `${r.scenarioName}${r.status === 'completed' ? ' · scenario estimates, not forecasts' : ''}`,
    time: timeAgo(r.completedAt ?? r.queuedAt),
    read: readIds.has(r.id)
  }));
  const unreadCount = notifications.filter((n) => !n.read).length;
  const markAllAsRead = () => setReadIds(new Set(notifications.map((n) => n.id)));
  const markAsRead = (id: string) => setReadIds((prev) => new Set(prev).add(id));
  const navItems: NavGroup[] = [
  {
    id: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    moduleId: 'dashboard'
  },
  {
    id: 'group:data',
    label: 'Data Management',
    icon: FolderKanban,
    children: [
    {
      id: '/population',
      label: 'Population Data',
      icon: Database,
      moduleId: 'population'
    }]

  },
  {
    id: 'group:simulations',
    label: 'Simulations',
    icon: PlayCircle,
    children: [
    {
      id: '/simulation',
      label: 'Simulation Engine',
      icon: Cpu,
      moduleId: 'simulation'
    },
    {
      id: '/health-workers',
      label: 'Health-Worker Layer',
      icon: HardHat,
      moduleId: 'hcw'
    },
    {
      id: '/rt',
      label: 'Rt Tracking',
      icon: TrendingUp,
      moduleId: 'rt'
    }]

  },
  {
    id: 'group:interventions',
    label: 'Interventions & Analysis',
    icon: Stethoscope,
    children: [
    {
      id: '/interventions',
      label: 'Intervention Scenarios',
      icon: ShieldAlert,
      moduleId: 'interventions'
    },
    {
      id: '/geographic',
      label: 'Geographic Spread',
      icon: Map,
      moduleId: 'geographic'
    },
    {
      id: '/healthcare',
      label: 'Healthcare Capacity',
      icon: Building2,
      moduleId: 'healthcare'
    },
    {
      id: '/scenario',
      label: 'Scenario Comparison',
      icon: GitCompare,
      moduleId: 'scenario'
    }]

  },
  {
    id: '/reports',
    label: 'Reports',
    icon: FileText,
    moduleId: 'reports'
  },
  {
    id: 'group:admin',
    label: 'Administration',
    icon: UserCog,
    children: [
    {
      id: '/users',
      label: 'User Management',
      icon: Users,
      moduleId: 'users'
    }]

  }];

  // Analyst menu (includes everything the former Epidemiologist role had)
  const analystNav: NavGroup[] = [
  { id: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, moduleId: 'dashboard' },
  {
    id: 'group:analyst-data',
    label: 'Data Management',
    icon: Database,
    children: [
    { id: '/population', label: 'Population Data', icon: Users, moduleId: 'population' },
    { id: '/presets', label: 'Disease Presets', icon: Dna, moduleId: 'presets' },
    { id: '/interventions', label: 'Interventions', icon: ShieldAlert, moduleId: 'interventions' }]

  },
  {
    id: 'group:analyst-sim',
    label: 'Simulations',
    icon: PlayCircle,
    children: [
    { id: '/scenarios', label: 'Scenario Library', icon: FolderKanban, moduleId: 'scenarios' },
    { id: '/simulation', label: 'Simulations', icon: Cpu, moduleId: 'simulation' },
    { id: '/health-workers', label: 'Health-Worker Layer', icon: HardHat, moduleId: 'hcw' },
    { id: '/rt', label: 'Rt Tracking', icon: TrendingUp, moduleId: 'rt' }]

  },
  {
    id: 'group:analyst-analysis',
    label: 'Response & Analysis',
    icon: FolderKanban,
    children: [
    { id: '/scenario', label: 'Scenario Comparison', icon: GitCompare, moduleId: 'scenario' },
    { id: '/geographic', label: 'Geographic Spread', icon: Map, moduleId: 'geographic' }]

  },
  { id: '/reports', label: 'Reports', icon: FileText, moduleId: 'reports' }];

  // Public Health Officer menu: own hospital only
  const officerNav: NavGroup[] = [
  { id: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, moduleId: 'dashboard' },
  {
    id: 'group:officer-data',
    label: 'Hospital Data',
    icon: Building2,
    children: [
    { id: '/rt', label: 'Rt Tracking', icon: TrendingUp, moduleId: 'rt' },
    { id: '/healthcare', label: 'Hospital Tracker', icon: Stethoscope, moduleId: 'healthcare' }]

  },
  {
    id: 'group:officer-response',
    label: 'Response',
    icon: ShieldAlert,
    children: [
    { id: '/health-workers', label: 'Health-Worker Layer', icon: HardHat, moduleId: 'hcw' },
    { id: '/interventions', label: 'Interventions', icon: Network, moduleId: 'interventions' },
    { id: '/instructions', label: 'Response Instructions', icon: ListChecks, moduleId: 'instructions' }]

  },
  {
    id: 'group:officer-data-mgmt',
    label: 'Data Management',
    icon: Database,
    children: [
    { id: '/presets', label: 'Disease Presets', icon: Dna, moduleId: 'presets' },
    { id: '/intervention-library', label: 'Intervention Library', icon: Layers, moduleId: 'presets' },
    { id: '/capacity', label: 'Healthcare Capacity', icon: Building2, moduleId: 'capacity' }]

  },
  {
    id: 'group:officer-sim',
    label: 'Simulations',
    icon: PlayCircle,
    children: [
    { id: '/scenarios', label: 'Scenario Library', icon: FolderKanban, moduleId: 'scenarios' },
    { id: '/simulation', label: 'Simulations', icon: Cpu, moduleId: 'simulation' }]

  },
  { id: '/reports', label: 'Reports', icon: FileText, moduleId: 'reports' }];

  // Policy Maker menu: read-only pages
  const policyNav: NavGroup[] = [
  { id: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, moduleId: 'dashboard' },
  { id: '/scenario', label: 'Scenario Comparison', icon: GitCompare, moduleId: 'scenario' },
  {
    id: 'group:policy-sim',
    label: 'Simulations',
    icon: PlayCircle,
    children: [
    { id: '/scenarios', label: 'Shared Scenarios', icon: FolderKanban, moduleId: 'scenarios' },
    { id: '/simulation', label: 'Simulation Runs', icon: Cpu, moduleId: 'simulation' }]

  },
  { id: '/interventions', label: 'Interventions', icon: ShieldAlert, moduleId: 'interventions' },
  { id: '/presets', label: 'Disease Presets', icon: Dna, moduleId: 'presets' },
  { id: '/intervention-library', label: 'Intervention Library', icon: Layers, moduleId: 'presets' },
  { id: '/capacity', label: 'Healthcare Capacity', icon: Building2, moduleId: 'capacity' },
  { id: '/reports', label: 'Reports', icon: FileText, moduleId: 'reports' }];

  // Filter nav items based on role access
  const filteredNavItems =
  role === 'analyst' ?
  analystNav :
  role === 'officer' ?
  officerNav :
  role === 'policymaker' ?
  policyNav :
  navItems.
  map((group) => {
    if (group.children) {
      const filteredChildren = group.children.filter((child) =>
      hasAccess(role, child.moduleId)
      );
      return {
        ...group,
        children: filteredChildren
      };
    }
    return group;
  }).
  filter((group) => {
    if (group.children) return group.children.length > 0;
    if (group.moduleId) return hasAccess(role, group.moduleId);
    return true;
  });
  // Auto-open the group containing the current route
  const initialOpen = filteredNavItems.reduce<Record<string, boolean>>(
    (acc, item) => {
      if (item.children?.some((c) => c.id === currentRoute)) {
        acc[item.id] = true;
      }
      return acc;
    },
    {}
  );
  const [openGroups, setOpenGroups] =
  useState<Record<string, boolean>>(initialOpen);
  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[260px] bg-sidebar-bg text-dark-text flex flex-col flex-shrink-0">
        {/* Logo Area */}
        <div
          className="h-16 flex items-center px-6 border-b border-white/10 cursor-pointer"
          onClick={() => onNavigate('/')}>
          
          <div className="w-9 h-9 bg-primary-light rounded-xl flex items-center justify-center mr-3">
            <Activity size={18} className="text-sidebar-bg" strokeWidth={2.5} />
          </div>
          <div>
            <div className="font-bold text-[16px] leading-tight text-white">
              EpiSim
            </div>
            <div className="text-[11px] text-dark-text-secondary">
              Simulation System
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {filteredNavItems.map((item) => {
            // Leaf item (no children)
            if (!item.children) {
              const isActive = currentRoute === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition-colors ${isActive ? 'bg-sidebar-hover border-primary-light/30 text-primary-light font-semibold' : 'border-transparent text-dark-text-secondary hover:bg-white/5 hover:text-white font-normal'} text-[13px]`}>
                  
                  <div className="flex items-center">
                    <item.icon
                      size={18}
                      className={`mr-3 ${isActive ? 'text-primary-light' : 'text-dark-text-secondary'}`} />
                    
                    {item.label}
                  </div>
                </button>);

            }
            // Group with children
            const isOpen = !!openGroups[item.id];
            const hasActiveChild = item.children.some(
              (c) => c.id === currentRoute
            );
            return (
              <div key={item.id}>
                <button
                  onClick={() => toggleGroup(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors text-[13px] ${hasActiveChild ? 'text-white font-semibold' : 'text-dark-text-secondary hover:bg-white/5 hover:text-white font-normal'}`}>
                  
                  <div className="flex items-center">
                    <item.icon
                      size={18}
                      className={`mr-3 ${hasActiveChild ? 'text-primary-light' : 'text-dark-text-secondary'}`} />
                    
                    {item.label}
                  </div>
                  <ChevronRight
                    size={14}
                    className={`text-dark-text-secondary transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                  
                </button>

                {isOpen &&
                <div className="mt-1 ml-3 pl-3 border-l border-white/10 space-y-1">
                    {item.children.map((child) => {
                    const isActive = currentRoute === child.id;
                    return (
                      <button
                        key={child.id}
                        onClick={() => onNavigate(child.id)}
                        className={`w-full flex items-center px-3 py-2 rounded-lg border transition-colors text-[12.5px] ${isActive ? 'bg-sidebar-hover border-primary-light/30 text-primary-light font-semibold' : 'border-transparent text-dark-text-secondary hover:bg-white/5 hover:text-white font-normal'}`}>
                        
                          <child.icon
                          size={15}
                          className={`mr-2.5 ${isActive ? 'text-primary-light' : 'text-dark-text-secondary'}`} />
                        
                          {child.label}
                        </button>);

                  })}
                  </div>
                }
              </div>);

          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-white/10 space-y-1">
          <button
            onClick={() => onNavigate('/settings')}
            className={`w-full flex items-center px-3 py-2.5 rounded-lg border transition-colors text-[13px] ${currentRoute === '/settings' ? 'bg-sidebar-hover border-primary-light/30 text-primary-light font-semibold' : 'border-transparent text-dark-text-secondary hover:bg-white/5 hover:text-white font-normal'}`}>
            
            <Settings
              size={18}
              className={`mr-3 ${currentRoute === '/settings' ? 'text-primary-light' : ''}`} />
            
            Settings
          </button>
          <button
            onClick={() => onNavigate('/about')}
            className="w-full flex items-center px-3 py-2.5 rounded-lg border border-transparent text-dark-text-secondary hover:bg-white/5 hover:text-white text-[13px] transition-colors">
            
            <Info size={18} className="mr-3" />
            About this demo
          </button>
          <button
            onClick={signOut}
            className="w-full flex items-center px-3 py-2.5 rounded-lg text-dark-text-secondary hover:bg-white/5 hover:text-white text-[13px] transition-colors">
            
            <LogOut size={18} className="mr-3" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <DemoRibbon />
        {/* Top Navigation */}
        <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-8 flex-shrink-0 relative z-40">
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full mr-2 ${meta ? 'bg-success' : 'bg-danger'}`}></div>
            <span className="text-secondary text-text-primary font-medium mr-2">
              {meta ? 'System Online' : 'Server Offline'}
            </span>
            <span className="text-secondary text-text-secondary font-code">
              {meta ? `| v${meta.appVersion} · engine ${meta.engineVersion}` : ''}
            </span>
          </div>

          <div className="flex items-center space-x-6">
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowProfileMenu(false);
                }}
                className="relative text-text-secondary hover:text-text-primary transition-colors p-1">
                
                <Bell size={20} />
                {unreadCount > 0 &&
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-primary rounded-full border-2 border-surface text-[9px] font-bold text-white flex items-center justify-center">
                    {unreadCount}
                  </span>
                }
              </button>

              {showNotifications &&
              <>
                  <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}>
                </div>
                  <div className="absolute right-0 mt-2 w-80 bg-surface rounded-xl border border-border shadow-lg z-50 overflow-hidden flex flex-col max-h-[400px]">
                    <div className="p-4 border-b border-border flex justify-between items-center bg-background/50">
                      <h3 className="text-[14px] font-semibold text-text-primary">
                        Notifications
                      </h3>
                      {unreadCount > 0 &&
                    <button
                      onClick={markAllAsRead}
                      className="text-[11px] font-medium text-primary hover:underline">
                      
                          Mark all as read
                        </button>
                    }
                    </div>
                    <div className="overflow-y-auto flex-1">
                      {notifications.length === 0 ?
                    <div className="p-6 text-center text-[13px] text-text-secondary">
                          No notifications
                        </div> :

                    <div className="divide-y divide-border">
                          {notifications.map((notification) =>
                      <div
                        key={notification.id}
                        className={`p-4 hover:bg-background transition-colors cursor-pointer ${!notification.read ? 'bg-primary/5' : ''}`}
                        onClick={() => {
                          markAsRead(notification.id);
                          setShowNotifications(false);
                          navigate(`/simulation/runs/${notification.id}`);
                        }}>
                        
                              <div className="flex justify-between items-start mb-1">
                                <h4
                            className={`text-[13px] font-medium ${!notification.read ? 'text-text-primary' : 'text-text-secondary'}`}>
                            
                                  {notification.title}
                                </h4>
                                {!notification.read &&
                          <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                          }
                              </div>
                              <p className="text-[12px] text-text-secondary line-clamp-2 mb-2">
                                {notification.description}
                              </p>
                              <span className="text-[10px] font-medium text-text-secondary uppercase tracking-wider">
                                {notification.time}
                              </span>
                            </div>
                      )}
                        </div>
                    }
                    </div>
                  </div>
                </>
              }
            </div>

            <div className="flex items-center space-x-3 border-l border-border pl-6 relative">
              <div className="relative">
                <button
                  onClick={() => {
                    if (!demoMode) return;
                    setShowRoleMenu(!showRoleMenu);
                    setShowProfileMenu(false);
                    setShowNotifications(false);
                  }}
                  aria-haspopup="menu"
                  aria-expanded={showRoleMenu}
                  className="flex items-center bg-secondary/50 text-primary-dark px-3 py-1.5 rounded-full border border-primary/30 hover:border-primary/60 transition-colors">
                  
                  <Shield size={14} className="mr-1.5" />
                  <span className="text-[12px] font-medium whitespace-nowrap">
                    {ROLE_LABELS[role]}
                  </span>
                  {demoMode && <ChevronDown size={12} className="ml-1.5" />}
                </button>
                {switchError &&
                <div role="alert" className="absolute right-0 top-full mt-2 w-64 bg-surface rounded-xl border border-danger/30 shadow-lg z-50 p-3 text-[12px] text-danger">
                    {switchError}
                  </div>
                }
                {demoMode && showRoleMenu &&
                <>
                    <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowRoleMenu(false)}>
                  </div>
                    <div
                    role="menu"
                    className="absolute right-0 top-full mt-2 w-56 bg-surface rounded-xl border border-border shadow-lg z-50 overflow-hidden py-1">
                    
                      <div className="px-4 pt-2 pb-1.5 text-[10px] font-semibold text-text-secondary uppercase tracking-wider">
                        Switch role (demo)
                      </div>
                      {ROLES.map((r) =>
                    <button
                      key={r}
                      role="menuitemradio"
                      aria-checked={r === role}
                      onClick={() => switchRole(r)}
                      className={`w-full text-left px-4 py-2 text-[13px] flex items-center justify-between hover:bg-background transition-colors ${r === role ? 'text-primary font-semibold' : 'text-text-primary'}`}>
                      
                          {ROLE_LABELS[r]}
                          {r === role && <Check size={14} />}
                        </button>
                    )}
                    </div>
                  </>
                }
              </div>

              <div
                className="flex items-center cursor-pointer hover:bg-background p-1 pr-2 rounded-full transition-colors"
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                  setShowNotifications(false);
                }}>
                
                <div className="w-8 h-8 rounded-full bg-primary-dark text-white flex items-center justify-center text-secondary font-bold mr-2">
                  {userName.substring(0, 2).toUpperCase()}
                </div>
                <span className="text-[13px] font-medium mr-2">{userName}</span>
                <ChevronDown size={16} className="text-text-secondary" />
              </div>

              {showProfileMenu &&
              <>
                  <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowProfileMenu(false)}>
                </div>
                  <div className="absolute right-0 top-full mt-2 w-48 bg-surface rounded-xl border border-border shadow-lg z-50 overflow-hidden py-1">
                    <button
                    onClick={openProfile}
                    className="w-full text-left px-4 py-2.5 text-[13px] text-text-primary hover:bg-background flex items-center transition-colors">
                    
                      <User size={16} className="mr-2 text-text-secondary" />
                      View Profile
                    </button>
                    <div className="h-px bg-border my-1"></div>
                    <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      signOut();
                    }}
                    className="w-full text-left px-4 py-2.5 text-[13px] text-accent hover:bg-accent/10 flex items-center transition-colors">
                    
                      <LogOut size={16} className="mr-2" />
                      Sign Out
                    </button>
                  </div>
                </>
              }
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto bg-background p-8 relative z-0">
          {children}
        </div>
      </main>

      {/* Profile Modal */}
      {showProfileModal &&
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={() => setShowProfileModal(false)}>
        
          <div
          className="bg-surface rounded-xl border border-border w-full max-w-md shadow-2xl flex flex-col"
          onClick={(e) => e.stopPropagation()}>
          
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="text-h3 text-text-primary">User Profile</h3>
              <button
              onClick={() => setShowProfileModal(false)}
              className="text-text-secondary hover:text-text-primary p-1">
              
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-center mb-2">
                <div className="w-20 h-20 rounded-full bg-primary-dark text-white flex items-center justify-center text-2xl font-bold">
                  {(profileForm.name || userName).substring(0, 2).toUpperCase()}
                </div>
              </div>

              <div>
                <label
                htmlFor="profile-name"
                className="block text-micro text-text-secondary mb-2">
                
                  FULL NAME
                </label>
                <input
                id="profile-name"
                type="text"
                value={profileForm.name}
                onChange={(e) =>
                setProfileForm((prev) => ({
                  ...prev,
                  name: e.target.value
                }))
                }
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-[13px] text-text-primary focus:outline-none focus:border-primary" />
              
              </div>

              <div>
                <label
                htmlFor="profile-email"
                className="block text-micro text-text-secondary mb-2">
                
                  EMAIL
                </label>
                <input
                id="profile-email"
                type="email"
                value={profileForm.email}
                onChange={(e) =>
                setProfileForm((prev) => ({
                  ...prev,
                  email: e.target.value
                }))
                }
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-[13px] text-text-primary focus:outline-none focus:border-primary" />
              
              </div>

              <div>
                <label
                htmlFor="profile-org"
                className="block text-micro text-text-secondary mb-2">
                
                  ORGANIZATION
                </label>
                <input
                id="profile-org"
                type="text"
                value={profileForm.organization}
                onChange={(e) =>
                setProfileForm((prev) => ({
                  ...prev,
                  organization: e.target.value
                }))
                }
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-[13px] text-text-primary focus:outline-none focus:border-primary" />
              
              </div>

              <div>
                <label className="block text-micro text-text-secondary mb-2">
                  ROLE
                </label>
                <div className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-[13px] text-text-primary flex items-center">
                  <Shield size={14} className="mr-2 text-primary" />
                  {ROLE_LABELS[role]}
                </div>
                <p className="text-[11px] text-text-secondary mt-2">
                  Roles are managed by system administrators.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-border bg-background/50 rounded-b-xl">
              <button
              onClick={() => setShowProfileModal(false)}
              className="px-4 py-2 text-[13px] font-semibold text-text-secondary hover:bg-hover rounded-lg transition-colors">
              
                Cancel
              </button>
              <button
              onClick={saveProfile}
              className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors">
              
                Save Changes
              </button>
            </div>
          </div>
        </div>
      }
    </div>);

}