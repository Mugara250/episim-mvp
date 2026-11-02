import React, { useState } from 'react';
import { User, Building, Bell, Moon, Shield, Key, Save } from 'lucide-react';
export function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
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
                  Update your personal details and public profile.
                </p>
              </div>

              <div className="flex items-center space-x-6">
                <div className="w-20 h-20 rounded-full bg-slate-700 text-white flex items-center justify-center text-[24px] font-bold">
                  IV
                </div>
                <div>
                  <button className="bg-background border border-border hover:bg-white/5 text-text-primary px-4 py-2 rounded-lg text-[12px] font-semibold transition-colors mb-2">
                    Change Avatar
                  </button>
                  <p className="text-[11px] text-text-secondary">
                    JPG, GIF or PNG. Max size of 800K
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-micro text-text-secondary mb-2">
                    FIRST NAME
                  </label>
                  <input
                  type="text"
                  defaultValue="Sarah"
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-[13px] focus:outline-none focus:border-primary" />
                
                </div>
                <div>
                  <label className="block text-micro text-text-secondary mb-2">
                    LAST NAME
                  </label>
                  <input
                  type="text"
                  defaultValue="Icyeza"
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-[13px] focus:outline-none focus:border-primary" />
                
                </div>
                <div className="col-span-2">
                  <label className="block text-micro text-text-secondary mb-2">
                    EMAIL ADDRESS
                  </label>
                  <input
                  type="email"
                  defaultValue="s.icyeza@rbc.gov.rw"
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-[13px] focus:outline-none focus:border-primary" />
                
                </div>
                <div className="col-span-2">
                  <label className="block text-micro text-text-secondary mb-2">
                    ROLE / TITLE
                  </label>
                  <input
                  type="text"
                  defaultValue="Senior Epidemiologist"
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-[13px] focus:outline-none focus:border-primary" />
                
                </div>
              </div>

              <div className="pt-6 border-t border-border flex justify-end">
                <button className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-lg text-[13px] font-semibold flex items-center transition-colors shadow-sm">
                  <Save size={16} className="mr-2" />
                  Save Changes
                </button>
              </div>
            </div>
          }

          {activeTab === 'appearance' &&
          <div className="max-w-2xl space-y-8">
              <div>
                <h3 className="text-h3 text-text-primary mb-1">Appearance</h3>
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
                      <Settings size={24} className="text-slate-400" />
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
              <Settings size={32} className="mb-4 opacity-20" />
              <p className="text-[14px]">
                This settings panel is available in the full version.
              </p>
            </div>
          }
        </div>
      </div>
    </div>);

}