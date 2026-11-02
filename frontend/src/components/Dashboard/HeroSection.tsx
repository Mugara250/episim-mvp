import React from 'react';
import { DashboardContext, ViewMode } from './types';
import {
  TrendingUp,
  Users,
  AlertTriangle,
  Activity,
  Clock,
  ShieldAlert,
  Server,
  ActivitySquare } from
'lucide-react';
import {
  horizonShort,
  horizonPhrase,
  projectedInfections,
  compactNumber } from
'./forecast';
interface HeroSectionProps {
  viewMode: ViewMode;
  context: DashboardContext;
}
export function HeroSection({ viewMode, context }: HeroSectionProps) {
  if (viewMode === 'disease_specific') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-surface p-4 rounded-xl border border-border shadow-sm">
          <div className="text-micro text-text-secondary mb-1 flex items-center">
            <Activity size={12} className="mr-1" /> EFFECTIVE R₀
          </div>
          <div className="text-h2 text-text-primary">1.42</div>
          <div className="text-[11px] text-danger font-medium mt-1 flex items-center">
            <TrendingUp size={10} className="mr-1" /> +0.12 this week
          </div>
        </div>
        <div className="bg-surface p-4 rounded-xl border border-border shadow-sm">
          <div className="text-micro text-text-secondary mb-1 flex items-center">
            <Clock size={12} className="mr-1" /> DOUBLING TIME
          </div>
          <div className="text-h2 text-text-primary">8.4d</div>
          <div className="text-[11px] text-warning font-medium mt-1">
            Accelerating
          </div>
        </div>
        <div className="bg-surface p-4 rounded-xl border border-border shadow-sm">
          <div className="text-micro text-text-secondary mb-1 flex items-center">
            <Users size={12} className="mr-1" /> ACTIVE CASES
          </div>
          <div className="text-h2 text-text-primary">12,450</div>
          <div className="text-[11px] text-text-secondary mt-1">
            In {context.location}
          </div>
        </div>
        <div className="bg-surface p-4 rounded-xl border border-border shadow-sm">
          <div className="text-micro text-text-secondary mb-1 flex items-center">
            <TrendingUp size={12} className="mr-1" />{' '}
            {horizonShort(context.timeRange).toUpperCase()} FORECAST
          </div>
          <div className="text-h2 text-text-primary">
            {compactNumber(projectedInfections(context))}
          </div>
          <div className="text-[11px] text-text-secondary mt-1">
            Projected cumulative cases during {horizonPhrase(context.timeRange)}
          </div>
        </div>
        <div className="bg-surface p-4 rounded-xl border border-border shadow-sm">
          <div className="text-micro text-text-secondary mb-1 flex items-center">
            <AlertTriangle size={12} className="mr-1" /> RISK LEVEL
          </div>
          <div className="text-h2 text-danger">HIGH</div>
          <div className="text-[11px] text-text-secondary mt-1">
            Expected risk over {horizonPhrase(context.timeRange)}
          </div>
        </div>
        <div className="bg-surface p-4 rounded-xl border border-border shadow-sm">
          <div className="text-micro text-text-secondary mb-1 flex items-center">
            <ActivitySquare size={12} className="mr-1" /> TREND DIRECTION
          </div>
          <div className="text-h2 text-warning">Rising</div>
          <div className="text-[11px] text-text-secondary mt-1">
            Projected trend over {horizonPhrase(context.timeRange)}
          </div>
        </div>
      </div>);

  }
  if (viewMode === 'district_focus') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface p-5 rounded-xl border border-border shadow-sm flex items-center justify-between">
          <div>
            <div className="text-micro text-text-secondary mb-1">
              OUTBREAK SEVERITY ({context.location})
            </div>
            <div className="text-h2 text-danger">Critical</div>
            <div className="text-[12px] text-text-secondary mt-1">
              Multiple active clusters detected
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center text-danger">
            <AlertTriangle size={24} />
          </div>
        </div>
        <div className="bg-surface p-5 rounded-xl border border-border shadow-sm flex items-center justify-between">
          <div>
            <div className="text-micro text-text-secondary mb-1">
              HEALTHCARE PRESSURE
            </div>
            <div className="text-h2 text-warning">85% Cap</div>
            <div className="text-[12px] text-text-secondary mt-1">
              ICU beds nearing saturation
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center text-warning">
            <Activity size={24} />
          </div>
        </div>
        <div className="bg-surface p-5 rounded-xl border border-border shadow-sm flex items-center justify-between">
          <div>
            <div className="text-micro text-text-secondary mb-1">
              GEOGRAPHIC SPREAD
            </div>
            <div className="text-h2 text-text-primary">Expanding</div>
            <div className="text-[12px] text-text-secondary mt-1">
              Spreading to neighboring sectors
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <TrendingUp size={24} />
          </div>
        </div>
      </div>);

  }
  if (viewMode === 'strategic_priority') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface p-5 rounded-xl border border-border shadow-sm">
          <div className="text-micro text-text-secondary mb-1">
            PRIORITY THREAT
          </div>
          <div className="text-h2 text-text-primary">Marburg</div>
          <div className="text-[12px] text-danger font-medium mt-1 flex items-center">
            <TrendingUp size={12} className="mr-1" /> Highest immediate
            mortality risk
          </div>
        </div>
        <div className="bg-surface p-5 rounded-xl border border-border shadow-sm">
          <div className="text-micro text-text-secondary mb-1">
            RESOURCE ALLOCATION
          </div>
          <div className="text-h2 text-warning">Strained</div>
          <div className="text-[12px] text-text-secondary mt-1">
            Vaccine stockpiles depleted in West
          </div>
        </div>
        <div className="bg-surface p-5 rounded-xl border border-border shadow-sm">
          <div className="text-micro text-text-secondary mb-1">
            INTERVENTION ROI
          </div>
          <div className="text-h2 text-success">High</div>
          <div className="text-[12px] text-text-secondary mt-1">
            WASH campaigns showing 40% efficacy
          </div>
        </div>
      </div>);

  }
  if (viewMode === 'admin_overview') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface p-4 rounded-xl border border-border shadow-sm">
          <div className="text-micro text-text-secondary mb-1">
            SYSTEM HEALTH
          </div>
          <div className="text-h2 text-success">Optimal</div>
          <div className="text-[11px] text-text-secondary mt-1">
            All services running
          </div>
        </div>
        <div className="bg-surface p-4 rounded-xl border border-border shadow-sm">
          <div className="text-micro text-text-secondary mb-1">
            ACTIVE USERS
          </div>
          <div className="text-h2 text-text-primary">142</div>
          <div className="text-[11px] text-text-secondary mt-1">
            Across 12 districts
          </div>
        </div>
        <div className="bg-surface p-4 rounded-xl border border-border shadow-sm">
          <div className="text-micro text-text-secondary mb-1">
            SIMULATION PIPELINE
          </div>
          <div className="text-h2 text-text-primary">8</div>
          <div className="text-[11px] text-text-secondary mt-1">
            Jobs currently queued
          </div>
        </div>
        <div className="bg-surface p-4 rounded-xl border border-border shadow-sm">
          <div className="text-micro text-text-secondary mb-1">
            DATA INGESTION
          </div>
          <div className="text-h2 text-success">Synced</div>
          <div className="text-[11px] text-text-secondary mt-1">
            Last sync: 2 mins ago
          </div>
        </div>
      </div>);

  }
  return null;
}