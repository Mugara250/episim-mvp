import React, { memo } from 'react';
import {
  Server,
  Database,
  Cpu,
  HardDrive,
  Mail,
  Shield,
  RefreshCw,
  Download,
  AlertTriangle } from
'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer } from
'recharts';
export function AdminSystemHealth() {
  const services = [
  {
    name: 'Web Server',
    icon: Server,
    status: 'Operational',
    uptime: '99.9%',
    last: 'Just now'
  },
  {
    name: 'Database',
    icon: Database,
    status: 'Operational',
    uptime: '99.9%',
    last: 'Just now'
  },
  {
    name: 'Simulation Engine',
    icon: Cpu,
    status: 'Degraded',
    uptime: '98.5%',
    last: '2m ago'
  },
  {
    name: 'File Storage',
    icon: HardDrive,
    status: 'Operational',
    uptime: '100%',
    last: 'Just now'
  },
  {
    name: 'Email Service',
    icon: Mail,
    status: 'Operational',
    uptime: '99.9%',
    last: '5m ago'
  },
  {
    name: 'Auth Service',
    icon: Shield,
    status: 'Operational',
    uptime: '100%',
    last: 'Just now'
  }];

  const chartData = Array.from({
    length: 24
  }).map((_, i) => ({
    time: `${i}:00`,
    api: 30 + Math.random() * 20 + (i === 14 ? 80 : 0),
    sessions: 10 + Math.random() * 15
  }));
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-text-primary">
          System Health & Monitoring
        </h1>
      </div>

      {/* Overall Status Banner */}
      <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center">
        <div className="w-3 h-3 rounded-full bg-primary mr-3 animate-pulse"></div>
        <span className="text-[15px] font-semibold text-primary">
          All Core Systems Operational
        </span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface p-5 rounded-xl border border-border shadow-sm">
          <p className="text-[12px] font-medium text-text-secondary uppercase tracking-wider mb-1">
            API Response Time
          </p>
          <div className="flex items-end gap-2">
            <p className="text-2xl font-bold text-text-primary">
              42
              <span className="text-[14px] text-text-secondary font-normal">
                ms
              </span>
            </p>
            <span className="text-[11px] font-medium text-primary mb-1">
              avg
            </span>
          </div>
        </div>
        <div className="bg-surface p-5 rounded-xl border border-border shadow-sm">
          <p className="text-[12px] font-medium text-text-secondary uppercase tracking-wider mb-1">
            DB Query Time
          </p>
          <div className="flex items-end gap-2">
            <p className="text-2xl font-bold text-text-primary">
              18
              <span className="text-[14px] text-text-secondary font-normal">
                ms
              </span>
            </p>
            <span className="text-[11px] font-medium text-primary mb-1">
              avg
            </span>
          </div>
        </div>
        <div className="bg-surface p-5 rounded-xl border border-border shadow-sm">
          <p className="text-[12px] font-medium text-text-secondary uppercase tracking-wider mb-1">
            Storage Used
          </p>
          <div className="flex items-end gap-2">
            <p className="text-2xl font-bold text-text-primary">
              67
              <span className="text-[14px] text-text-secondary font-normal">
                %
              </span>
            </p>
            <span className="text-[11px] font-medium text-text-secondary mb-1">
              of 1TB
            </span>
          </div>
        </div>
        <div className="bg-surface p-5 rounded-xl border border-border shadow-sm">
          <p className="text-[12px] font-medium text-text-secondary uppercase tracking-wider mb-1">
            Active Sessions
          </p>
          <div className="flex items-end gap-2">
            <p className="text-2xl font-bold text-text-primary">23</p>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <h2 className="text-[16px] font-semibold text-text-primary pt-2">
        Service Status
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {services.map((svc, i) =>
        <div
          key={i}
          className="bg-surface rounded-xl border border-border shadow-sm p-4 flex flex-col">
          
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center">
                <svc.icon size={18} className="text-text-secondary mr-2" />
                <h3 className="text-[14px] font-semibold text-text-primary">
                  {svc.name}
                </h3>
              </div>
              <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${svc.status === 'Operational' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-hover text-text-secondary border border-border'}`}>
              
                {svc.status}
              </span>
            </div>
            <div className="flex justify-between items-end mt-auto pt-4 border-t border-border">
              <div>
                <p className="text-[11px] text-text-secondary">
                  Uptime:{' '}
                  <span className="font-medium text-text-primary">
                    {svc.uptime}
                  </span>
                </p>
                <p className="text-[11px] text-text-secondary">
                  Checked: {svc.last}
                </p>
              </div>
              <button className="text-[11px] font-medium text-text-secondary hover:text-primary flex items-center transition-colors">
                <RefreshCw size={12} className="mr-1" /> Restart
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface rounded-xl border border-border shadow-sm p-5">
          <h3 className="text-[14px] font-semibold text-text-primary mb-4">
            API Response Time (24h)
          </h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--border)" />
                
                <XAxis
                  dataKey="time"
                  tick={{
                    fontSize: 10,
                    fill: 'var(--text-secondary)'
                  }}
                  axisLine={false}
                  tickLine={false} />
                
                <YAxis
                  tick={{
                    fontSize: 10,
                    fill: 'var(--text-secondary)'
                  }}
                  axisLine={false}
                  tickLine={false} />
                
                <RechartsTooltip
                  contentStyle={{
                    borderRadius: '8px',
                    fontSize: '12px',
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)'
                  }} />
                
                <Line
                  type="monotone"
                  dataKey="api"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  dot={false} />
                
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-surface rounded-xl border border-border shadow-sm p-5">
          <h3 className="text-[14px] font-semibold text-text-primary mb-4">
            Active Sessions (24h)
          </h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--border)" />
                
                <XAxis
                  dataKey="time"
                  tick={{
                    fontSize: 10,
                    fill: 'var(--text-secondary)'
                  }}
                  axisLine={false}
                  tickLine={false} />
                
                <YAxis
                  tick={{
                    fontSize: 10,
                    fill: 'var(--text-secondary)'
                  }}
                  axisLine={false}
                  tickLine={false} />
                
                <RechartsTooltip
                  contentStyle={{
                    borderRadius: '8px',
                    fontSize: '12px',
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)'
                  }} />
                
                <Line
                  type="stepAfter"
                  dataKey="sessions"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  dot={false} />
                
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* System Logs & Maintenance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-sidebar-bg rounded-xl border border-white/10 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-3 border-b border-white/10 flex justify-between items-center bg-sidebar-bg">
            <h3 className="text-[14px] font-semibold text-white">
              System Logs
            </h3>
            <div className="flex gap-3">
              <select className="bg-white/5 border border-white/10 text-dark-text-secondary text-[11px] rounded px-2 py-1 outline-none">
                <option>All Levels</option>
                <option>Error</option>
                <option>Warning</option>
                <option>Info</option>
              </select>
              <button className="text-[11px] text-dark-text-secondary hover:text-white flex items-center">
                <Download size={12} className="mr-1" /> Download
              </button>
            </div>
          </div>
          <div className="p-4 font-mono text-[11px] text-dark-text-secondary h-[200px] overflow-y-auto space-y-1">
            <div className="flex">
              <span className="text-dark-text-secondary w-32 shrink-0">
                2026-06-17 10:45:01
              </span>
              <span className="text-primary w-12 shrink-0">INFO</span>
              <span>[AuthService] Token refreshed for user 8921</span>
            </div>
            <div className="flex">
              <span className="text-dark-text-secondary w-32 shrink-0">
                2026-06-17 10:45:12
              </span>
              <span className="text-primary w-12 shrink-0">INFO</span>
              <span>[API] GET /api/v1/simulations 200 OK 42ms</span>
            </div>
            <div className="flex">
              <span className="text-dark-text-secondary w-32 shrink-0">
                2026-06-17 10:46:05
              </span>
              <span className="text-text-secondary w-12 shrink-0">WARN</span>
              <span>
                [SimEngine] High memory usage detected (85%) on node-3
              </span>
            </div>
            <div className="flex">
              <span className="text-dark-text-secondary w-32 shrink-0">
                2026-06-17 10:46:10
              </span>
              <span className="text-primary w-12 shrink-0">INFO</span>
              <span>[DB] Connection pool scaled up to 20</span>
            </div>
            <div className="flex">
              <span className="text-dark-text-secondary w-32 shrink-0">
                2026-06-17 10:47:22
              </span>
              <span className="text-accent w-12 shrink-0">ERROR</span>
              <span>[MailService] SMTP connection timeout</span>
            </div>
            <div className="flex">
              <span className="text-dark-text-secondary w-32 shrink-0">
                2026-06-17 10:47:25
              </span>
              <span className="text-primary w-12 shrink-0">INFO</span>
              <span>[MailService] Reconnected successfully</span>
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border shadow-sm p-5 flex flex-col">
          <div className="flex items-center mb-4">
            <AlertTriangle size={18} className="text-text-secondary mr-2" />
            <h3 className="text-[14px] font-semibold text-text-primary">
              Maintenance Mode
            </h3>
          </div>
          <p className="text-[12px] text-text-secondary mb-4">
            Enable maintenance mode to lock out non-admin users during system
            updates.
          </p>

          <div className="space-y-3 mb-4 flex-1">
            <div>
              <label className="block text-[11px] font-medium text-text-secondary mb-1">
                Scheduled Window
              </label>
              <input
                type="datetime-local"
                className="w-full border border-border bg-background rounded px-2 py-1.5 text-[12px] text-text-primary outline-none focus:border-primary" />
              
            </div>
            <div>
              <label className="block text-[11px] font-medium text-text-secondary mb-1">
                Announcement Message
              </label>
              <textarea
                rows={2}
                className="w-full border border-border bg-background rounded px-2 py-1.5 text-[12px] text-text-primary outline-none focus:border-primary resize-none"
                defaultValue="System is undergoing scheduled maintenance.">
              </textarea>
            </div>
          </div>

          <button className="w-full bg-hover hover:bg-background text-text-primary font-medium py-2 rounded-lg text-[13px] transition-colors border border-border">
            Enable Maintenance Mode
          </button>
        </div>
      </div>
    </div>);

}