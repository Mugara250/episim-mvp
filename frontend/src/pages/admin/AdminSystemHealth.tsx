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
import { useSystemHealth } from '../../api/admin';
import { DemoDataBadge, QueryState } from '../../components/officer/DataState';

const GB = 1024 ** 3;
const fmtBytes = (b: number | null | undefined) =>
b == null ? '—' : b >= GB ? `${(b / GB).toFixed(1)} GB` : `${(b / 1024 ** 2).toFixed(1)} MB`;

// Sample curves for the charts below. There is no request-timing or session telemetry in the MVP,
// so these are labelled "Demo data". Generated once so they don't jump on every refresh.
const chartData = Array.from({ length: 24 }).map((_, i) => ({
  time: `${i}:00`,
  api: 30 + (i * 7 % 20) + (i === 14 ? 80 : 0),
  sessions: 10 + (i * 5 % 15)
}));

type ServiceStatus = 'Operational' | 'Degraded' | 'Down' | 'Not configured';

export function AdminSystemHealth() {
  const healthQ = useSystemHealth();
  const h = healthQ.data;
  const checked = h ? new Date(h.checkedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—';
  const diskUsed = h ? 1 - h.disk.freeBytes / h.disk.totalBytes : 0;
  const services: {name: string;icon: typeof Server;status: ServiceStatus;detail: string;}[] = h ?
  [
  { name: 'API server', icon: Server, status: 'Operational', detail: `EpiSim ${h.appVersion}` },
  {
    name: 'Database',
    icon: Database,
    status: h.database.ok ? 'Operational' : 'Down',
    detail: `${h.database.driver} · ${fmtBytes(h.database.sizeBytes)}`
  },
  {
    name: 'Simulation engine',
    icon: Cpu,
    status: h.runs.running + h.runs.queued > h.worker.threads * 4 ? 'Degraded' : 'Operational',
    detail: `${h.engineVersion} · ${h.worker.threads} worker threads · ${h.worker.queueDepth} waiting`
  },
  {
    name: 'File storage',
    icon: HardDrive,
    status: diskUsed > 0.95 ? 'Degraded' : 'Operational',
    detail: `${fmtBytes(h.disk.freeBytes)} free of ${fmtBytes(h.disk.totalBytes)}`
  },
  { name: 'Email service', icon: Mail, status: 'Not configured', detail: 'No email is sent in the MVP' },
  { name: 'Auth service', icon: Shield, status: 'Operational', detail: `JWT sessions · ${h.users.active} active accounts` }] :

  [];
  const down = services.filter((s) => s.status === 'Down' || s.status === 'Degraded');

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-text-primary">
          System Health & Monitoring
        </h1>
        <button
          onClick={() => healthQ.refetch()}
          className="text-[12px] font-medium text-text-secondary hover:text-primary flex items-center transition-colors">
          
          <RefreshCw size={13} className={`mr-1.5 ${healthQ.isFetching ? 'animate-spin' : ''}`} /> Checked {checked}
        </button>
      </div>

      <QueryState isLoading={healthQ.isLoading} error={healthQ.error}>
      {/* Overall Status Banner */}
      <div className={`${down.length ? 'bg-warning/10 border-warning/30' : 'bg-primary/10 border-primary/20'} border rounded-xl p-4 flex items-center`}>
        <div className={`w-3 h-3 rounded-full ${down.length ? 'bg-warning' : 'bg-primary'} mr-3 animate-pulse`}></div>
        <span className={`text-[15px] font-semibold ${down.length ? 'text-warning' : 'text-primary'}`}>
          {down.length ? `${down.map((d) => d.name).join(', ')} need${down.length === 1 ? 's' : ''} attention` : 'All Core Systems Operational'}
        </span>
      </div>

      {/* KPIs (all measured by the server) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface p-5 rounded-xl border border-border shadow-sm">
          <p className="text-[12px] font-medium text-text-secondary uppercase tracking-wider mb-1">
            Simulation runs
          </p>
          <div className="flex items-end gap-2">
            <p className="text-2xl font-bold text-text-primary">{h?.runs.completed ?? 0}</p>
            <span className="text-[11px] font-medium text-text-secondary mb-1">
              completed · {h?.runs.failed ?? 0} failed · {(h?.runs.running ?? 0) + (h?.runs.queued ?? 0)} active
            </span>
          </div>
        </div>
        <div className="bg-surface p-5 rounded-xl border border-border shadow-sm">
          <p className="text-[12px] font-medium text-text-secondary uppercase tracking-wider mb-1">
            Run time (last 20)
          </p>
          <div className="flex items-end gap-2">
            <p className="text-2xl font-bold text-text-primary">
              {h?.recentRunSeconds.mean != null ? h.recentRunSeconds.mean.toFixed(1) : '—'}
              <span className="text-[14px] text-text-secondary font-normal">
                s
              </span>
            </p>
            <span className="text-[11px] font-medium text-primary mb-1">
              avg{h?.recentRunSeconds.max != null ? ` · max ${h.recentRunSeconds.max.toFixed(1)}s` : ''}
            </span>
          </div>
        </div>
        <div className="bg-surface p-5 rounded-xl border border-border shadow-sm">
          <p className="text-[12px] font-medium text-text-secondary uppercase tracking-wider mb-1">
            Storage Used
          </p>
          <div className="flex items-end gap-2">
            <p className="text-2xl font-bold text-text-primary">
              {Math.round(diskUsed * 100)}
              <span className="text-[14px] text-text-secondary font-normal">
                %
              </span>
            </p>
            <span className="text-[11px] font-medium text-text-secondary mb-1">
              of {fmtBytes(h?.disk.totalBytes)}
            </span>
          </div>
        </div>
        <div className="bg-surface p-5 rounded-xl border border-border shadow-sm">
          <p className="text-[12px] font-medium text-text-secondary uppercase tracking-wider mb-1">
            Active accounts
          </p>
          <div className="flex items-end gap-2">
            <p className="text-2xl font-bold text-text-primary">{h?.users.active ?? 0}</p>
            <span className="text-[11px] font-medium text-text-secondary mb-1">
              {Object.entries(h?.reports ?? {}).map(([k, v]) => `${v} ${k.replace('_', ' ')}`).join(' · ') || 'no reports'}
            </span>
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
              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${svc.status === 'Operational' ? 'bg-primary/10 text-primary border border-primary/20' : svc.status === 'Down' ? 'bg-danger/10 text-danger border border-danger/20' : 'bg-hover text-text-secondary border border-border'}`}>
              
                {svc.status}
              </span>
            </div>
            <div className="mt-auto pt-4 border-t border-border">
              <p className="text-[11px] text-text-secondary">{svc.detail}</p>
              <p className="text-[11px] text-text-secondary">Checked: {checked}</p>
            </div>
          </div>
        )}
      </div>
      </QueryState>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface rounded-xl border border-border shadow-sm p-5">
          <h3 className="text-[14px] font-semibold text-text-primary mb-4 flex items-center justify-between gap-2">
            API Response Time (24h) <DemoDataBadge title="No request-timing telemetry in the MVP; sample curve" />
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
          <h3 className="text-[14px] font-semibold text-text-primary mb-4 flex items-center justify-between gap-2">
            Active Sessions (24h) <DemoDataBadge title="No session telemetry in the MVP; sample curve" />
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
            <h3 className="text-[14px] font-semibold text-white flex items-center gap-2">
              System Logs <DemoDataBadge title="Sample log lines; server logs go to the console in the MVP" />
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
            <h3 className="text-[14px] font-semibold text-text-primary flex-1">
              Maintenance Mode
            </h3>
            <DemoDataBadge title="Not implemented in the MVP; the button does nothing" />
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

          <button disabled title="Not available in the MVP" className="w-full bg-hover text-text-secondary font-medium py-2 rounded-lg text-[13px] border border-border cursor-not-allowed opacity-70">
            Enable Maintenance Mode
          </button>
        </div>
      </div>
    </div>);

}