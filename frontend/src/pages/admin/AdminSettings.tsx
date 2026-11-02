import { useEffect, useState } from 'react';
import { useAdminSettings, useSaveSetting } from '../../api/admin';
import { DemoDataBadge, QueryState } from '../../components/officer/DataState';
import {
  Save,
  Shield,
  Mail,
  Database,
  Link as LinkIcon,
  Settings as SettingsIcon } from
'lucide-react';
interface GeneralSettings {
  systemName: string;
  language: string;
  timezone: string;
  dateFormat: string;
}

const GENERAL_DEFAULTS: GeneralSettings = {
  systemName: 'EpiSim Simulation System',
  language: 'English (US)',
  timezone: 'Africa/Kigali (CAT)',
  dateFormat: 'YYYY-MM-DD'
};

export function AdminSettings() {
  const [activeTab, setActiveTab] = useState('General');
  // Only the General tab is stored by the server (settings key "general"); the session timeout
  // and other runtime values come from environment variables and are shown read-only.
  const settingsQ = useAdminSettings();
  const saveM = useSaveSetting();
  const [general, setGeneral] = useState<GeneralSettings>(GENERAL_DEFAULTS);
  const [notice, setNotice] = useState<{tone: 'success' | 'error';text: string;} | null>(null);
  const stored = settingsQ.data?.stored.general as Partial<GeneralSettings> | undefined;
  const runtime = settingsQ.data?.runtime;
  useEffect(() => {
    if (stored) setGeneral({ ...GENERAL_DEFAULTS, ...stored });
  }, [settingsQ.data]);
  const setField = (k: keyof GeneralSettings) => (e: {target: {value: string;};}) =>
  setGeneral((g) => ({ ...g, [k]: e.target.value }));

  const saveAll = async () => {
    setNotice(null);
    try {
      await saveM.mutateAsync({ key: 'general', value: { ...general } });
      setNotice({ tone: 'success', text: 'General settings saved. The change is recorded in the audit log.' });
    } catch (e) {
      setNotice({ tone: 'error', text: e instanceof Error ? e.message : 'Settings could not be saved.' });
    }
  };
  const tabs = [
  {
    id: 'General',
    icon: SettingsIcon
  },
  {
    id: 'Security',
    icon: Shield
  },
  {
    id: 'Email & Notifications',
    icon: Mail
  },
  {
    id: 'Data & Storage',
    icon: Database
  },
  {
    id: 'Integration',
    icon: LinkIcon
  }];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-text-primary">
          System Settings
        </h1>
        <button
          onClick={saveAll}
          disabled={saveM.isPending || settingsQ.isLoading}
          className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-[13px] font-medium flex items-center transition-colors disabled:opacity-60">
          <Save size={16} className="mr-2" /> Save General Settings
        </button>
      </div>

      {notice &&
      <div
        role={notice.tone === 'error' ? 'alert' : 'status'}
        className={`text-[13px] rounded-xl px-4 py-3 border ${notice.tone === 'error' ? 'text-danger bg-danger/10 border-danger/20' : 'text-success bg-success/10 border-success/20'}`}>
          {notice.text}
        </div>
      }

      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Nav */}
        <div className="w-full md:w-64 flex-shrink-0 space-y-1">
          {tabs.map((tab) =>
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full flex items-center px-4 py-3 rounded-lg text-[13px] font-medium transition-colors ${activeTab === tab.id ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-background'}`}>
            
              <tab.icon
              size={18}
              className={`mr-3 ${activeTab === tab.id ? 'text-primary' : 'text-text-secondary'}`} />
            
              {tab.id}
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-surface rounded-xl border border-border shadow-sm p-6">
          {activeTab === 'General' &&
          <div className="space-y-6">
              <h2 className="text-[16px] font-semibold text-text-primary border-b border-border pb-3">
                General Configuration
              </h2>
              <QueryState isLoading={settingsQ.isLoading} error={settingsQ.error}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[13px] font-medium text-text-secondary mb-1">
                    System Name
                  </label>
                  <input
                  type="text"
                  value={general.systemName}
                  onChange={setField('systemName')}
                  className="w-full border border-border bg-background rounded-lg px-3 py-2 text-[13px] text-text-primary focus:outline-none focus:border-primary" />
                
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-text-secondary mb-1">
                    Default Language
                  </label>
                  <select value={general.language} onChange={setField('language')} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-[13px] text-text-primary focus:outline-none focus:border-primary">
                    <option>English (US)</option>
                    <option>French</option>
                    <option>Kinyarwanda</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-text-secondary mb-1">
                    System Timezone
                  </label>
                  <select value={general.timezone} onChange={setField('timezone')} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-[13px] text-text-primary focus:outline-none focus:border-primary">
                    <option>Africa/Kigali (CAT)</option>
                    <option>UTC</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-text-secondary mb-1">
                    Date Format
                  </label>
                  <select value={general.dateFormat} onChange={setField('dateFormat')} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-[13px] text-text-primary focus:outline-none focus:border-primary">
                    <option>YYYY-MM-DD</option>
                    <option>DD/MM/YYYY</option>
                    <option>MM/DD/YYYY</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-text-secondary mb-1">
                    Session length (minutes, set by JWT_EXPIRE_MINUTES)
                  </label>
                  <input
                  type="number"
                  value={runtime?.jwtExpireMinutes ?? ''}
                  readOnly
                  disabled
                  className="w-full border border-border bg-background rounded-lg px-3 py-2 text-[13px] text-text-secondary cursor-not-allowed" />
                
                </div>
              </div>
              {runtime &&
            <div className="rounded-lg border border-border bg-background p-4">
                  <h3 className="text-[13px] font-semibold text-text-primary mb-2">Server runtime (read-only)</h3>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-[12px]">
                    <div className="flex justify-between"><dt className="text-text-secondary">Demo mode</dt><dd className="font-medium text-text-primary">{runtime.demoMode ? 'On' : 'Off'}</dd></div>
                    <div className="flex justify-between"><dt className="text-text-secondary">Simulation worker threads</dt><dd className="font-medium text-text-primary">{runtime.workerThreads}</dd></div>
                    <div className="flex justify-between"><dt className="text-text-secondary">Report approver must differ from author</dt><dd className="font-medium text-text-primary">{runtime.requireDistinctApprover ? 'Yes' : 'No'}</dd></div>
                    <div className="flex justify-between"><dt className="text-text-secondary">What-if preview runs</dt><dd className="font-medium text-text-primary">{runtime.whatIfRuns}</dd></div>
                  </dl>
                  <p className="text-[11px] text-text-secondary mt-2">{settingsQ.data?.note}</p>
                </div>
            }
              </QueryState>
            </div>
          }

          {activeTab === 'Security' &&
          <div className="space-y-6">
              <h2 className="text-[16px] font-semibold text-text-primary border-b border-border pb-3 flex items-center justify-between gap-3">
                Password & Authentication Policy
                <DemoDataBadge title="Not stored by the server in the MVP; these controls do nothing" />
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[13px] font-medium text-text-secondary mb-1">
                    Minimum Password Length
                  </label>
                  <input
                  type="number"
                  defaultValue="12"
                  className="w-full border border-border bg-background rounded-lg px-3 py-2 text-[13px] text-text-primary focus:outline-none focus:border-primary" />
                
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-text-secondary mb-1">
                    Password Expiry (Days)
                  </label>
                  <input
                  type="number"
                  defaultValue="90"
                  className="w-full border border-border bg-background rounded-lg px-3 py-2 text-[13px] text-text-primary focus:outline-none focus:border-primary" />
                
                </div>
                <div className="col-span-2">
                  <label className="flex items-center text-[13px] text-text-secondary mb-2">
                    <input
                    type="checkbox"
                    defaultChecked
                    className="mr-2 rounded text-primary focus:ring-primary" />
                  {' '}
                    Require uppercase, lowercase, numbers, and symbols
                  </label>
                </div>
              </div>

              <h3 className="text-[14px] font-semibold text-text-primary mt-6 mb-3">
                Multi-Factor Authentication (MFA) Enforcement
              </h3>
              <div className="space-y-2">
                <label className="flex items-center justify-between p-3 border border-border rounded-lg bg-background">
                  <span className="text-[13px] font-medium text-text-primary">
                    Administrators
                  </span>
                  <input
                  type="checkbox"
                  defaultChecked
                  disabled
                  className="rounded text-primary focus:ring-primary" />
                
                </label>
                <label className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <span className="text-[13px] font-medium text-text-primary">
                    Epidemiologists
                  </span>
                  <input
                  type="checkbox"
                  defaultChecked
                  className="rounded text-primary focus:ring-primary" />
                
                </label>
                <label className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <span className="text-[13px] font-medium text-text-primary">
                    Health Officers
                  </span>
                  <input
                  type="checkbox"
                  className="rounded text-primary focus:ring-primary" />
                
                </label>
              </div>

              <h3 className="text-[14px] font-semibold text-text-primary mt-6 mb-3">
                Account Lockout
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[13px] font-medium text-text-secondary mb-1">
                    Max Failed Login Attempts
                  </label>
                  <input
                  type="number"
                  defaultValue="5"
                  className="w-full border border-border bg-background rounded-lg px-3 py-2 text-[13px] text-text-primary focus:outline-none focus:border-primary" />
                
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-text-secondary mb-1">
                    Lockout Duration (minutes)
                  </label>
                  <input
                  type="number"
                  defaultValue="15"
                  className="w-full border border-border bg-background rounded-lg px-3 py-2 text-[13px] text-text-primary focus:outline-none focus:border-primary" />
                
                </div>
              </div>
            </div>
          }

          {activeTab === 'Email & Notifications' &&
          <div className="space-y-6">
              <h2 className="text-[16px] font-semibold text-text-primary border-b border-border pb-3 flex items-center justify-between gap-3">
                SMTP Configuration
                <DemoDataBadge title="Not stored by the server in the MVP; these controls do nothing" />
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[13px] font-medium text-text-secondary mb-1">
                    SMTP Host
                  </label>
                  <input
                  type="text"
                  defaultValue="smtp.mailgun.org"
                  className="w-full border border-border bg-background rounded-lg px-3 py-2 text-[13px] text-text-primary focus:outline-none focus:border-primary" />
                
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-text-secondary mb-1">
                    SMTP Port
                  </label>
                  <input
                  type="text"
                  defaultValue="587"
                  className="w-full border border-border bg-background rounded-lg px-3 py-2 text-[13px] text-text-primary focus:outline-none focus:border-primary" />
                
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-text-secondary mb-1">
                    Username
                  </label>
                  <input
                  type="text"
                  defaultValue="postmaster@episim.gov.rw"
                  className="w-full border border-border bg-background rounded-lg px-3 py-2 text-[13px] text-text-primary focus:outline-none focus:border-primary" />
                
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-text-secondary mb-1">
                    Password
                  </label>
                  <input
                  type="password"
                  defaultValue="********"
                  className="w-full border border-border bg-background rounded-lg px-3 py-2 text-[13px] text-text-primary focus:outline-none focus:border-primary" />
                
                </div>
                <div className="col-span-2">
                  <label className="block text-[13px] font-medium text-text-secondary mb-1">
                    Default From Address
                  </label>
                  <input
                  type="email"
                  defaultValue="noreply@episim.gov.rw"
                  className="w-full border border-border bg-background rounded-lg px-3 py-2 text-[13px] text-text-primary focus:outline-none focus:border-primary" />
                
                </div>
                <div className="col-span-2">
                  <button className="bg-background hover:bg-hover text-text-primary px-4 py-2 rounded-lg text-[13px] font-medium transition-colors border border-border">
                    Test Connection
                  </button>
                </div>
              </div>

              <h3 className="text-[14px] font-semibold text-text-primary mt-6 mb-3">
                System Notification Triggers
              </h3>
              <div className="space-y-3">
                <label className="flex items-center text-[13px] text-text-secondary">
                  <input
                  type="checkbox"
                  defaultChecked
                  className="mr-3 rounded text-primary focus:ring-primary w-4 h-4" />
                {' '}
                  Notify admins on new user registration
                </label>
                <label className="flex items-center text-[13px] text-text-secondary">
                  <input
                  type="checkbox"
                  defaultChecked
                  className="mr-3 rounded text-primary focus:ring-primary w-4 h-4" />
                {' '}
                  Notify admins on repeated failed logins
                </label>
                <label className="flex items-center text-[13px] text-text-secondary">
                  <input
                  type="checkbox"
                  defaultChecked
                  className="mr-3 rounded text-primary focus:ring-primary w-4 h-4" />
                {' '}
                  Send email when long-running simulation completes
                </label>
                <label className="flex items-center text-[13px] text-text-secondary">
                  <input
                  type="checkbox"
                  defaultChecked
                  className="mr-3 rounded text-primary focus:ring-primary w-4 h-4" />
                {' '}
                  Send alerts on healthcare capacity breach forecasts
                </label>
              </div>
            </div>
          }

          {activeTab === 'Data & Storage' &&
          <div className="space-y-6">
              <h2 className="text-[16px] font-semibold text-text-primary border-b border-border pb-3 flex items-center justify-between gap-3">
                Storage Usage
                <DemoDataBadge title="Not stored by the server in the MVP; these controls do nothing" />
              </h2>
              <div>
                <div className="flex justify-between text-[13px] mb-1">
                  <span className="font-medium text-text-primary">
                    Primary Database
                  </span>
                  <span className="text-text-secondary">
                    670 GB / 1 TB (67%)
                  </span>
                </div>
                <div className="w-full bg-background rounded-full h-2.5 mb-4 border border-border">
                  <div
                  className="bg-primary h-2.5 rounded-full"
                  style={{
                    width: '67%'
                  }}>
                </div>
                </div>
              </div>

              <h3 className="text-[14px] font-semibold text-text-primary mt-6 mb-3">
                Backup Configuration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[13px] font-medium text-text-secondary mb-1">
                    Backup Frequency
                  </label>
                  <select className="w-full px-3 py-2 rounded-lg border border-border bg-background text-[13px] text-text-primary focus:outline-none focus:border-primary">
                    <option>Daily</option>
                    <option>Weekly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-text-secondary mb-1">
                    Backup Time (CAT)
                  </label>
                  <input
                  type="time"
                  defaultValue="02:00"
                  className="w-full border border-border bg-background rounded-lg px-3 py-2 text-[13px] text-text-primary focus:outline-none focus:border-primary" />
                
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-text-secondary mb-1">
                    Retention Period (Days)
                  </label>
                  <input
                  type="number"
                  defaultValue="30"
                  className="w-full border border-border bg-background rounded-lg px-3 py-2 text-[13px] text-text-primary focus:outline-none focus:border-primary" />
                
                </div>
                <div className="flex items-end">
                  <button className="bg-background hover:bg-hover text-text-primary px-4 py-2 rounded-lg text-[13px] font-medium transition-colors border border-border w-full">
                    Trigger Manual Backup Now
                  </button>
                </div>
              </div>

              <h3 className="text-[14px] font-semibold text-text-primary mt-6 mb-3">
                Data Retention Policy
              </h3>
              <div>
                <label className="block text-[13px] font-medium text-text-secondary mb-1">
                  Auto-delete simulation results older than (Months)
                </label>
                <input
                type="number"
                defaultValue="12"
                className="w-full md:w-1/2 border border-border bg-background rounded-lg px-3 py-2 text-[13px] text-text-primary focus:outline-none focus:border-primary" />
              
                <p className="text-[11px] text-text-secondary mt-1">
                  Set to 0 to keep indefinitely.
                </p>
              </div>
            </div>
          }

          {activeTab === 'Integration' &&
          <div className="space-y-6">
              <h2 className="text-[16px] font-semibold text-text-primary border-b border-border pb-3 flex items-center justify-between gap-3">
                External Integrations
                <DemoDataBadge title="Not stored by the server in the MVP; these controls do nothing" />
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <h4 className="text-[14px] font-semibold text-text-primary">
                      National Health Data Warehouse
                    </h4>
                    <p className="text-[12px] text-text-secondary">
                      Syncs daily case counts and hospital capacity
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium bg-primary/10 text-primary">
                      Connected
                    </span>
                    <button className="text-[12px] font-medium text-accent hover:text-accent border border-accent/20 px-3 py-1 rounded bg-background">
                      Disconnect
                    </button>
                  </div>
                </div>
              </div>

              <h3 className="text-[14px] font-semibold text-text-primary mt-6 mb-3">
                API Keys
              </h3>
              <div className="overflow-x-auto border border-border rounded-lg mb-4">
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-background text-text-secondary border-b border-border">
                    <tr>
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium">Prefix</th>
                      <th className="px-4 py-3 font-medium">Created</th>
                      <th className="px-4 py-3 font-medium">Last Used</th>
                      <th className="px-4 py-3 font-medium text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr>
                      <td className="px-4 py-3 font-medium text-text-primary">
                        Mobile App Sync
                      </td>
                      <td className="px-4 py-3 font-mono text-text-secondary">
                        epk_live_8f2a...
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        Jan 10, 2026
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        2 hours ago
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button className="text-accent hover:text-accent font-medium">
                          Revoke
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <button className="bg-surface border border-border hover:bg-background text-text-primary px-4 py-2 rounded-lg text-[13px] font-medium transition-colors">
                Generate New API Key
              </button>
            </div>
          }
        </div>
      </div>
    </div>);

}