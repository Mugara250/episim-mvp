import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS, Role } from '../lib/rbac';
import { ViewMode, DashboardContext } from '../components/Dashboard/types';
import { horizonLabel } from '../components/Dashboard/forecast';
import { ContextTopBar } from '../components/Dashboard/ContextTopBar';
import { HeroSection } from '../components/Dashboard/HeroSection';
import {
  QuickActionsPanel,
  IntelligenceFeedPanel,
  CriticalAlertsPanel,
  DataFreshnessIndicator } from
'../components/Dashboard/SidebarPanels';
import {
  DiseaseSpecificView,
  DistrictFocusView,
  StrategicPriorityView,
  AdminOverviewView } from
'../components/Dashboard/ViewModules';
import { ScenarioComparisonView } from '../components/Dashboard/ScenarioComparisonView';
const getDefaultView = (role: Role): ViewMode => {
  switch (role) {
    case 'admin':
      return 'admin_overview';
    case 'officer':
      return 'district_focus';
    case 'policymaker':
      return 'strategic_priority';
    case 'analyst':
    default:
      return 'disease_specific';
  }
};
export function Dashboard({
  onNavigate


}: {onNavigate?: (route: string, reportId?: string) => void;}) {
  const { role, userName } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>(getDefaultView(role));
  const [context, setContext] = useState<DashboardContext>({
    disease: 'Ebola',
    location: 'National',
    timeRange: '90d'
  });
  useEffect(() => {
    setViewMode(getDefaultView(role));
  }, [role]);
  return (
    <div className="max-w-[1600px] mx-auto space-y-5 pb-12">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-h1 text-text-primary mb-1">
            Epidemic Intelligence Dashboard
          </h1>
          <p className="text-body text-text-secondary">
            Showing projected epidemic dynamics for{' '}
            <span className="text-text-primary font-medium">
              {context.disease === 'all' ?
              'All Active Diseases' :
              context.disease}
            </span>{' '}
            in{' '}
            <span className="text-text-primary font-medium">
              {context.location}
            </span>{' '}
            over the next {horizonLabel(context.timeRange).toLowerCase()}.
          </p>
        </div>
      </div>

      {/* TOP BAR: Persistent Context Layer */}
      <ContextTopBar
        context={context}
        setContext={setContext}
        viewMode={viewMode}
        setViewMode={setViewMode}
        role={role} />
      

      {/* HERO INTELLIGENCE SECTION */}
      <div className="space-y-3">
        <HeroSection viewMode={viewMode} context={context} />
        <DataFreshnessIndicator />
      </div>

      {/* MAIN LAYOUT: Analysis Area + Right Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* LEFT: Main Analysis Area */}
        <div className="space-y-6">
          {viewMode === 'disease_specific' &&
          <DiseaseSpecificView context={context} onNavigate={onNavigate} />
          }
          {viewMode === 'district_focus' &&
          <DistrictFocusView context={context} />
          }
          {viewMode === 'strategic_priority' &&
          <StrategicPriorityView context={context} />
          }
          {viewMode === 'admin_overview' && <AdminOverviewView />}
          {viewMode === 'scenario_comparison' && <ScenarioComparisonView />}
        </div>

        {/* RIGHT SIDEBAR: Critical Alerts → Intelligence Feed → Quick Actions */}
        <div className="space-y-5">
          <CriticalAlertsPanel />
          <IntelligenceFeedPanel />
          <QuickActionsPanel role={role} onNavigate={onNavigate} />
        </div>
      </div>
    </div>);

}