import React from 'react';
import {
  Play,
  Settings2,
  FileText,
  Activity,
  Users,
  Database,
  ShieldAlert,
  Clock,
  AlertCircle,
  Bell,
  TrendingUp } from
'lucide-react';
import { Role } from '../../lib/rbac';
export function CriticalAlertsPanel() {
  const alerts = [
  {
    severity: 'critical',
    icon: '🔴',
    message: 'New outbreak cluster detected in Kigali City',
    time: '5 mins ago'
  },
  {
    severity: 'important',
    icon: '🟡',
    message: 'WHO advisory update: Marburg cases reported in a neighbouring country',
    time: '1 hour ago'
  },
  {
    severity: 'info',
    icon: '🔵',
    message: 'Data source interruption: Western Province',
    time: '3 hours ago'
  }];

  return (
    <div className="bg-surface p-5 rounded-xl border border-border shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] font-bold text-text-primary flex items-center">
          <AlertCircle size={16} className="mr-2 text-danger" />
          Critical Alerts
        </h3>
        <div className="w-2 h-2 rounded-full bg-danger animate-pulse"></div>
      </div>
      <div className="space-y-3">
        {alerts.map((alert, idx) =>
        <div
          key={idx}
          className={`p-3 rounded-lg border ${alert.severity === 'critical' ? 'bg-danger/5 border-danger/20' : alert.severity === 'important' ? 'bg-warning/5 border-warning/20' : 'bg-primary/5 border-primary/20'}`}>
          
            <div className="flex items-start">
              <span className="text-[14px] mr-2 flex-shrink-0">
                {alert.icon}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-text-primary font-medium leading-snug mb-1">
                  {alert.message}
                </p>
                <p className="text-[10px] text-text-secondary">{alert.time}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>);

}
export function IntelligenceFeedPanel() {
  const updates = [
  {
    icon: TrendingUp,
    iconColor: 'text-primary',
    message: 'Simulation SIM-0042 completed successfully',
    time: '10 mins ago'
  },
  {
    icon: Database,
    iconColor: 'text-success',
    message: 'Data refresh completed for all provinces',
    time: '25 mins ago'
  },
  {
    icon: Bell,
    iconColor: 'text-warning',
    message: 'Marburg parameters updated from Rwanda 2024 data',
    time: '2 hours ago'
  },
  {
    icon: FileText,
    iconColor: 'text-text-secondary',
    message: 'Ministry guidance updated: Contact tracing protocols',
    time: '5 hours ago'
  },
  {
    icon: Settings2,
    iconColor: 'text-text-secondary',
    message: 'Scheduled maintenance this weekend',
    time: '1 day ago'
  }];

  return (
    <div className="bg-surface p-5 rounded-xl border border-border shadow-card">
      <h3 className="text-[13px] font-bold text-text-primary mb-4">
        Intelligence Feed
      </h3>
      <div className="space-y-3 max-h-[300px] overflow-y-auto">
        {updates.map((update, idx) =>
        <div
          key={idx}
          className="flex items-start pb-3 border-b border-border last:border-0 last:pb-0">
          
            <update.icon
            size={14}
            className={`${update.iconColor} mt-0.5 mr-3 flex-shrink-0`} />
          
            <div className="flex-1 min-w-0">
              <p className="text-[12px] text-text-primary leading-snug mb-1">
                {update.message}
              </p>
              <p className="text-[10px] text-text-secondary">{update.time}</p>
            </div>
          </div>
        )}
      </div>
    </div>);

}
interface QuickAction {
  icon: typeof Users;
  label: string;
  route: string;
}
export function QuickActionsPanel({
  role,
  onNavigate



}: {role: Role;onNavigate?: (route: string, reportId?: string) => void;}) {
  const getActions = (): QuickAction[] => {
    switch (role) {
      case 'admin':
        return [
        {
          icon: Users,
          label: 'Manage Users',
          route: '/users'
        },
        {
          icon: Settings2,
          label: 'System Config',
          route: '/settings'
        },
        {
          icon: Database,
          label: 'View Logs',
          route: '/population'
        },
        {
          icon: FileText,
          label: 'Generate Report',
          route: '/reports'
        }];

      case 'officer':
        return [
        {
          icon: Activity,
          label: 'View Hotspots',
          route: '/geographic'
        },
        {
          icon: ShieldAlert,
          label: 'Resource Requests',
          route: '/healthcare'
        },
        {
          icon: FileText,
          label: 'Generate Report',
          route: '/reports'
        },
        {
          icon: Database,
          label: 'View Library',
          route: '/scenario'
        }];

      case 'policymaker':
        return [
        {
          icon: FileText,
          label: 'Generate Briefing',
          route: '/reports'
        },
        {
          icon: Activity,
          label: 'Compare Scenarios',
          route: '/scenario'
        },
        {
          icon: Database,
          label: 'View Library',
          route: '/scenario'
        },
        {
          icon: TrendingUp,
          label: 'View Trends',
          route: '/rt'
        }];

      case 'analyst':
      default:
        return [
        {
          icon: Play,
          label: 'New Simulation',
          route: '/simulation'
        },
        {
          icon: Settings2,
          label: 'Load Scenario',
          route: '/scenario'
        },
        {
          icon: Activity,
          label: 'Compare Scenarios',
          route: '/scenario'
        },
        {
          icon: FileText,
          label: 'Generate Report',
          route: '/reports'
        }];

    }
  };
  const actions = getActions();
  return (
    <div className="bg-surface p-5 rounded-xl border border-border shadow-card">
      <h3 className="text-[13px] font-bold text-text-primary mb-4">
        Quick Actions
      </h3>
      <div className="space-y-2">
        {actions.map((action, idx) =>
        <button
          key={idx}
          onClick={() => onNavigate?.(action.route)}
          className="w-full flex items-center px-3 py-2.5 rounded-lg border border-border hover:border-primary/40 hover:bg-hover transition-colors text-[12px] font-medium text-text-primary">
          
            <action.icon
            size={15}
            className="text-text-secondary mr-2.5 flex-shrink-0" />
          
            <span className="truncate">{action.label}</span>
          </button>
        )}
      </div>
    </div>);

}
export function DataFreshnessIndicator() {
  return (
    <div className="bg-surface px-4 py-3 rounded-lg border border-border shadow-sm flex items-center justify-between">
      <div className="flex items-center text-[11px] text-text-secondary">
        <Clock size={13} className="mr-2" />
        Last Updated: 2 minutes ago
      </div>
      <div className="flex items-center text-[10px] font-bold text-success bg-success/10 px-2 py-1 rounded-full">
        <div className="w-1.5 h-1.5 rounded-full bg-success mr-1.5 animate-pulse"></div>
        FRESH
      </div>
    </div>);

}