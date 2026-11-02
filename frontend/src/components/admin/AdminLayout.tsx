import React, { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DemoRibbon } from '../common/DemoRibbon';
import { useDemoMode } from '../../api/meta';
import {
  Users,
  ShieldCheck,
  Building,
  Key,
  ClipboardList,
  Activity,
  Megaphone,
  LifeBuoy,
  Settings,
  LogOut,
  Bell,
  ChevronDown,
  ChevronRight,
  User,
  UserCog,
  MonitorCheck,
  MessagesSquare,
  Info } from
'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAccountRequests } from '../../context/AccountRequestContext';
import { timeAgo } from '../../utils/accountRequests';
import { ROLES, ROLE_LABELS, Role } from '../../lib/rbac';
import { AdminScopeNote } from './AdminScopeNote';
interface AdminLayoutProps {
  children: React.ReactNode;
  currentRoute: string;
  onNavigate: (route: string) => void;
}
interface NavChild {
  id: string;
  label: string;
  icon: LucideIcon;
}
interface NavGroup {
  id: string;
  label: string;
  icon: LucideIcon;
  children?: NavChild[];
}
export function AdminLayout({
  children,
  currentRoute,
  onNavigate
}: AdminLayoutProps) {
  const { userName, role, demoLogin, logout } = useAuth();
  const demoMode = useDemoMode();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { requests, unseenCount, pendingCount } = useAccountRequests();
  const pendingRequests = requests.filter((r) => r.status === 'Pending');
  const switchRole = (next: Role) => {
    setShowRoleMenu(false);
    if (next === role) return;
    // Demo only: signs in as that role's seeded demo user (a real token swap).
    demoLogin(next).
    then(() => {
      if (next !== 'admin') onNavigate('/dashboard');
    }).
    catch(() => undefined);
  };
  const signOut = async () => {
    await logout();
    navigate('/login');
  };
  const navItems: NavGroup[] = [
  {
    id: 'group:access',
    label: 'Access & Identity',
    icon: UserCog,
    children: [
    {
      id: '/admin/users',
      label: 'User Management',
      icon: Users
    },
    {
      id: '/admin/roles',
      label: 'Roles & Permissions',
      icon: ShieldCheck
    },
    {
      id: '/admin/requests',
      label: 'Account Requests',
      icon: Key
    }]

  },
  {
    id: '/admin/hospitals',
    label: 'Hospitals',
    icon: Building
  },
  {
    id: 'group:monitoring',
    label: 'Monitoring',
    icon: MonitorCheck,
    children: [
    {
      id: '/admin/audit',
      label: 'Audit Logs',
      icon: ClipboardList
    },
    {
      id: '/admin/health',
      label: 'System Health',
      icon: Activity
    }]

  },
  {
    id: 'group:engagement',
    label: 'Engagement',
    icon: MessagesSquare,
    children: [
    {
      id: '/admin/announcements',
      label: 'Announcements',
      icon: Megaphone
    },
    {
      id: '/admin/tickets',
      label: 'Support Tickets',
      icon: LifeBuoy
    }]

  },
  {
    id: '/admin/settings',
    label: 'Settings',
    icon: Settings
  }];

  // Auto-open the group containing the current route
  const initialOpen = navItems.reduce<Record<string, boolean>>((acc, item) => {
    if (item.children?.some((c) => c.id === currentRoute)) {
      acc[item.id] = true;
    }
    return acc;
  }, {});
  const [openGroups, setOpenGroups] =
  useState<Record<string, boolean>>(initialOpen);
  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden font-sans text-text-primary">
      {/* Sidebar */}
      <aside className="w-[240px] bg-sidebar-bg text-dark-text flex flex-col flex-shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-white/10">
          <div className="w-9 h-9 bg-primary-light rounded-xl flex items-center justify-center mr-3">
            <Activity size={18} className="text-sidebar-bg" strokeWidth={2.5} />
          </div>
          <div>
            <div className="font-bold text-[15px] leading-tight text-white">
              EpiSim Admin
            </div>
            <div className="text-[11px] text-dark-text-secondary">
              System Operations
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            // Leaf item (no children)
            if (!item.children) {
              const isActive = currentRoute === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center px-3 py-2.5 rounded-lg border transition-colors text-[13px] ${isActive ? 'bg-sidebar-hover border-primary-light/30 text-primary-light font-medium' : 'border-transparent text-dark-text-secondary hover:bg-white/5 hover:text-white'}`}>
                  
                  <item.icon
                    size={16}
                    className={`mr-3 ${isActive ? 'text-primary-light' : 'text-dark-text-secondary'}`} />
                  
                  {item.label}
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
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md transition-colors text-[13px] ${hasActiveChild ? 'text-white font-medium' : 'text-dark-text-secondary hover:bg-white/5 hover:text-white'}`}>
                  
                  <div className="flex items-center">
                    <item.icon
                      size={16}
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
                        className={`w-full flex items-center px-3 py-2 rounded-lg border transition-colors text-[12.5px] ${isActive ? 'bg-sidebar-hover border-primary-light/30 text-primary-light font-medium' : 'border-transparent text-dark-text-secondary hover:bg-white/5 hover:text-white'}`}>
                        
                          <child.icon
                          size={15}
                          className={`mr-2.5 ${isActive ? 'text-primary-light' : 'text-dark-text-secondary'}`} />
                        
                          <span className="flex-1 text-left">{child.label}</span>
                          {child.id === '/admin/requests' && pendingCount > 0 &&
                        <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-primary-light text-sidebar-bg text-[10px] font-bold flex items-center justify-center">
                              {pendingCount}
                            </span>
                        }
                        </button>);

                  })}
                  </div>
                }
              </div>);

          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => onNavigate('/about')}
            className="w-full flex items-center px-3 py-2 rounded-md text-dark-text-secondary hover:bg-white/5 hover:text-white text-[13px] transition-colors">
            
            <Info size={16} className="mr-3 text-dark-text-secondary" />
            About this demo
          </button>
          <button
            onClick={signOut}
            className="w-full flex items-center px-3 py-2 rounded-md text-dark-text-secondary hover:bg-white/5 hover:text-white text-[13px] transition-colors">
            
            <LogOut size={16} className="mr-3 text-dark-text-secondary" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <DemoRibbon />
        {/* Top Navigation */}
        <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-8 flex-shrink-0 z-10">
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-primary mr-2"></div>
            <span className="text-[13px] font-medium text-text-primary">
              All Systems Operational
            </span>
          </div>

          <div className="flex items-center space-x-5">
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowRoleMenu(false);
                  setShowProfileMenu(false);
                }}
                aria-label={`Notifications${unseenCount ? `, ${unseenCount} new` : ''}`}
                aria-expanded={showNotifications}
                className="relative p-1 text-text-secondary hover:text-text-primary transition-colors">
                
                <Bell size={18} />
                {unseenCount > 0 &&
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-primary rounded-full border-2 border-surface text-[9px] font-bold text-white flex items-center justify-center">
                    {unseenCount}
                  </span>
                }
              </button>
              {showNotifications &&
              <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
                  <div className="absolute right-0 top-full mt-2 w-80 bg-surface rounded-xl border border-border shadow-lg z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                      <h3 className="text-[14px] font-semibold text-text-primary">Notifications</h3>
                      <span className="text-[11px] text-text-secondary">{pendingCount} pending</span>
                    </div>
                    {pendingRequests.length === 0 ?
                  <p className="p-6 text-center text-[13px] text-text-secondary">No account requests waiting.</p> :

                  <ul className="max-h-[320px] overflow-y-auto divide-y divide-border">
                        {pendingRequests.map((r) =>
                    <li key={r.id}>
                            <button
                        onClick={() => {
                          setShowNotifications(false);
                          onNavigate('/admin/requests');
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-background transition-colors ${!r.seenByAdmin ? 'bg-primary/5' : ''}`}>
                        
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-[13px] font-medium text-text-primary">New account request</p>
                                {!r.seenByAdmin && <span className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />}
                              </div>
                              <p className="text-[12px] text-text-secondary mt-0.5">
                                {r.name} · {r.position}, {r.institution}
                              </p>
                              <p className="text-[11px] text-text-secondary mt-1">{timeAgo(r.submittedAt)}</p>
                            </button>
                          </li>
                    )}
                      </ul>
                  }
                    <button
                    onClick={() => {
                      setShowNotifications(false);
                      onNavigate('/admin/requests');
                    }}
                    className="w-full px-4 py-2.5 border-t border-border text-[12px] font-semibold text-primary hover:bg-background transition-colors">
                    
                      Review account requests
                    </button>
                  </div>
                </>
              }
            </div>

            <div className="h-6 w-px bg-border"></div>

            <div className="relative">
              <button
                onClick={() => demoMode && setShowRoleMenu(!showRoleMenu)}
                aria-haspopup="menu"
                aria-expanded={showRoleMenu}
                className="flex items-center px-3 py-1.5 rounded-full border border-border bg-background text-[12px] font-medium text-text-primary hover:border-primary/40 transition-colors">
                
                {ROLE_LABELS[role]}
                {demoMode && <ChevronDown size={13} className="ml-1.5 text-text-secondary" />}
              </button>
              {demoMode && showRoleMenu &&
              <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowRoleMenu(false)}></div>
                  <div role="menu" className="absolute right-0 top-full mt-1 w-52 bg-surface rounded-lg border border-border shadow-lg z-50 py-1">
                    <div className="px-4 py-1.5 text-[11px] text-text-secondary">Switch demo role</div>
                    {ROLES.map((r) =>
                  <button
                    key={r}
                    role="menuitem"
                    onClick={() => switchRole(r)}
                    className={`w-full text-left px-4 py-2 text-[13px] hover:bg-background transition-colors ${r === role ? 'text-primary font-medium' : 'text-text-primary'}`}>
                    
                        {ROLE_LABELS[r]}
                      </button>
                  )}
                  </div>
                </>
              }
            </div>

            <div className="relative">
              <div
                className="flex items-center cursor-pointer hover:bg-background p-1 pr-2 rounded-full transition-colors"
                onClick={() => setShowProfileMenu(!showProfileMenu)}>
                
                <div className="w-8 h-8 rounded-full bg-hover text-primary flex items-center justify-center text-[13px] font-bold mr-2 border border-primary/20">
                  {userName.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex flex-col mr-2">
                  <span className="text-[13px] font-medium text-text-primary leading-tight">
                    {userName}
                  </span>
                  <span className="text-[11px] text-text-secondary leading-tight">
                    System Admin
                  </span>
                </div>
                <ChevronDown size={14} className="text-text-secondary" />
              </div>

              {showProfileMenu &&
              <>
                  <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowProfileMenu(false)}>
                </div>
                  <div className="absolute right-0 top-full mt-1 w-48 bg-surface rounded-lg border border-border shadow-lg z-50 py-1">
                    <button className="w-full text-left px-4 py-2 text-[13px] text-text-primary hover:bg-background flex items-center">
                      <User size={14} className="mr-2 text-text-secondary" />{' '}
                      Profile
                    </button>
                    <div className="h-px bg-border my-1"></div>
                    <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      signOut();
                    }}
                    className="w-full text-left px-4 py-2 text-[13px] text-accent hover:bg-accent/10 flex items-center">
                    
                      <LogOut size={14} className="mr-2" /> Sign Out
                    </button>
                  </div>
                </>
              }
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            <AdminScopeNote />
          </div>
          {children}
        </div>
      </main>
    </div>);

}