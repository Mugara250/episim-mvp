import { useState } from 'react';
import { User, Building, Bell, Moon, Shield, Key, Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS } from '../lib/rbac';
import { DemoDataBadge } from '../components/officer/DataState';

export function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const { user, role } = useAuth();
  const initials = (user?.name ?? '').replace(/^(Dr\.|Hon\.)\s*/, '').split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const [first, ...rest] = (user?.name ?? '').split(' ');
  const tabs = [
  {
    id: 'profile',
    label: 'My Profile',
    icon: User
  },
  {
    id: 'institution',
    label: 'Institution',
    icon: Building
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell
  },
  {
    id: 'appearance',
    label: 'Appearance',
    icon: Moon
  },
  {
    id: 'security',
    label: 'Security',
    icon: Shield
  },
  {
    id: 'api',
    label: 'API & Integrations',
    icon: Key
  }];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-h1 text-text-primary mb-1">Settings</h1>
        <p className="text-body text-text-secondary">
          Manage your account and system preferences
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center px-4 py-3 rounded-lg text-[13px] font-medium transition-colors ${isActive ? 'bg-hover text-primary' : 'text-text-secondary hover:bg-background hover:text-text-primary'}`}>
                
                <Icon
                  size={18}
                  className={`mr-3 ${isActive ? 'text-primary' : 'text-text-secondary'}`} />
                
                {tab.label}
              </button>);

          })}
        </div>

        {/* Content */}
        <div className="flex-1 bg-surface rounded-xl border border-border p-8">
          {activeTab === 'profile' &&
          <div className="max-w-2xl space-y-8">
              <div>
                <h3 className="text-h3 text-text-primary mb-1">
                  Profile Information
                </h3>
                <p className="text-[13px] text-text-secondary">
                  Your account details as held by EpiSim. Ask a system administrator to change them.
                </p>
              </div>

              <div className="flex items-center space-x-6">
                <div className="w-20 h-20 rounded-full bg-slate-700 text-white flex items-center justify-center text-[24px] font-bold">
                  {initials || '—'}
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-text-primary">{ROLE_LABELS[role]}</p>
                  <p className="text-[12px] text-text-secondary">{user?.institutionName ?? 'No institution set'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-micro text-text-secondary mb-2">
                    FIRST NAME
                  </label>
                  <input
                  type="text"
                  value={first ?? ''}
                  readOnly
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-[13px] focus:outline-none focus:border-primary" />
                
                </div>
                <div>
                  <label className="block text-micro text-text-secondary mb-2">
                    LAST NAME
                  </label>
                  <input
                  type="text"
                  value={rest.join(' ')}
                  readOnly
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-[13px] focus:outline-none focus:border-primary" />
                
                </div>
                <div className="col-span-2">
                  <label className="block text-micro text-text-secondary mb-2">
                    EMAIL ADDRESS
                  </label>
                  <input
                  type="email"
                  value={user?.email ?? ''}
                  readOnly
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-[13px] focus:outline-none focus:border-primary" />
                
                </div>
                <div className="col-span-2">
                  <label className="block text-micro text-text-secondary mb-2">
                    ROLE / TITLE
                  </label>
                  <input
                  type="text"
                  value={user?.title ?? ROLE_LABELS[role]}
                  readOnly
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-[13px] focus:outline-none focus:border-primary" />
                
                </div>
              </div>

              <p className="pt-6 border-t border-border text-[12px] text-text-secondary">
                Profile changes are made by a system administrator in User Management, and are recorded in the audit log.
              </p>
            </div>
          }

          {activeTab === 'appearance' &&
          <div className="max-w-2xl space-y-8">
              <div>
                <h3 className="text-h3 text-text-primary mb-1 flex items-center gap-3">Appearance <DemoDataBadge title="Theme choice is not saved in the MVP" /></h3>
                <p className="text-[13px] text-text-secondary">
                  Customize how EpiSim looks on your device.
                </p>
              </div>

              <div>
                <label className="block text-micro text-text-secondary mb-4">
                  THEME PREFERENCE
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="border-2 border-transparent hover:border-border rounded-xl p-1 cursor-pointer transition-colors">
                    <div className="bg-slate-50 h-24 rounded-lg border border-border flex flex-col p-2">
                      <div className="w-full h-3 bg-white rounded shadow-sm mb-2"></div>
                      <div className="flex-1 bg-white rounded shadow-sm"></div>
                    </div>
                    <div className="text-center text-[12px] font-medium mt-2 text-text-secondary">
                      Light
                    </div>
                  </div>
                  <div className="border-2 border-primary rounded-xl p-1 cursor-pointer">
                    <div className="bg-slate-900 h-24 rounded-lg border border-slate-800 flex flex-col p-2">
                      <div className="w-full h-3 bg-slate-800 rounded shadow-sm mb-2"></div>
                      <div className="flex-1 bg-slate-800 rounded shadow-sm"></div>
                    </div>
                    <div className="text-center text-[12px] font-semibold mt-2 text-primary">
                      Dark
                    </div>
                  </div>
                  <div className="border-2 border-transparent hover:border-border rounded-xl p-1 cursor-pointer transition-colors">
                    <div className="bg-gradient-to-br from-slate-50 to-slate-900 h-24 rounded-lg border border-border flex items-center justify-center">
                      <SettingsIcon size={24} className="text-slate-400" />
                    </div>
                    <div className="text-center text-[12px] font-medium mt-2 text-text-secondary">
                      System
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-text-secondary mt-4">
                  Note: The system is currently locked to Dark mode for
                  consistency.
                </p>
              </div>
            </div>
          }

          {/* Other tabs would go here, keeping it brief for the prototype */}
          {['institution', 'notifications', 'security', 'api'].includes(
            activeTab
          ) &&
          <div className="flex flex-col items-center justify-center h-64 text-text-secondary">
              <SettingsIcon size={32} className="mb-4 opacity-20" />
              <p className="text-[14px]">
                This settings panel is available in the full version.
              </p>
            </div>
          }
        </div>
      </div>
    </div>);

}