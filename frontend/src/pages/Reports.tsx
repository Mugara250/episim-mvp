import React, { useEffect, useState, createElement } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Presentation,
  File,
  Plus,
  Clock,
  CheckCircle2,
  X,
  Calendar,
  Layers,
  Users,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Activity,
  HeartPulse,
  Skull } from
'lucide-react';
import { ExportButton } from '../components/common/ExportButton';
import { SIMULATIONS, getSimulation } from '../lib/simulations';
const templates = [
{
  name: 'Executive Summary',
  desc: 'High-level KPIs and policy recommendations',
  icon: FileText,
  color: 'text-blue-400',
  bg: 'bg-blue-500/15'
},
{
  name: 'Data Export',
  desc: 'Raw simulation data and parameters',
  icon: FileSpreadsheet,
  color: 'text-success',
  bg: 'bg-success/15'
},
{
  name: 'Briefing Deck',
  desc: 'Presentation slides for stakeholders',
  icon: Presentation,
  color: 'text-warning',
  bg: 'bg-warning/15'
},
{
  name: 'Full Technical Report',
  desc: 'Comprehensive methodology and results',
  icon: File,
  color: 'text-primary',
  bg: 'bg-hover'
}];

// Recent reports correspond 1:1 with the dashboard's recent simulations.
const recentReports = SIMULATIONS.map((sim) => ({
  id: sim.id,
  name: `${sim.id}: ${sim.name}`,
  type: sim.format,
  date: sim.date,
  status: 'ready'
}));
export function Reports({
  focusedReportId


}: {focusedReportId?: string | null;}) {
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [viewingReportId, setViewingReportId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<
    (typeof templates)[0] | null>(
    null);
  useEffect(() => {
    if (focusedReportId) setViewingReportId(focusedReportId);
  }, [focusedReportId]);
  const viewingReport = getSimulation(viewingReportId);
  const SECTION_OPTIONS = [
  'Executive Summary',
  'Epidemic Curves',
  'Geographic Heatmaps',
  'Healthcare Capacity Forecast',
  'Intervention Analysis',
  'Scenario Comparison',
  'Cost-Effectiveness',
  'Parameter Configuration',
  'Methodology & Assumptions'];

  const [customForm, setCustomForm] = useState({
    title: 'Custom Epidemic Report',
    format: 'PDF',
    dataSource: 'SIM-0042 (SEIHFR - Ebola)',
    disease: 'Ebola',
    region: 'National',
    from: '',
    to: '',
    audience: 'Policy Makers',
    detail: 'Standard',
    description: '',
    sections: ['Executive Summary', 'Epidemic Curves', 'Geographic Heatmaps']
  });
  const updateCustom = (field: string, value: any) =>
  setCustomForm((prev) => ({
    ...prev,
    [field]: value
  }));
  const toggleSection = (section: string) =>
  setCustomForm((prev) => ({
    ...prev,
    sections: prev.sections.includes(section) ?
    prev.sections.filter((s) => s !== section) :
    [...prev.sections, section]
  }));
  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    setShowCustomModal(false);
    alert(
      `Generating "${customForm.title}" (${customForm.format}) with ${customForm.sections.length} sections…`
    );
  };
  const renderTemplatePreview = (templateName: string) => {
    switch (templateName) {
      case 'Executive Summary':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-background p-4 rounded-lg border border-border">
                <div className="text-text-secondary text-micro mb-1">
                  PEAK INFECTIONS
                </div>
                <div className="text-h2 text-text-primary">12,450</div>
                <div className="text-[11px] text-warning flex items-center mt-1">
                  <TrendingUp size={12} className="mr-1" /> +15% vs baseline
                </div>
              </div>
              <div className="bg-background p-4 rounded-lg border border-border">
                <div className="text-text-secondary text-micro mb-1">
                  TOTAL FATALITIES
                </div>
                <div className="text-h2 text-text-primary">342</div>
                <div className="text-[11px] text-success flex items-center mt-1">
                  <TrendingUp size={12} className="mr-1" /> -5% vs baseline
                </div>
              </div>
              <div className="bg-background p-4 rounded-lg border border-border">
                <div className="text-text-secondary text-micro mb-1">
                  PEAK ICU DEMAND
                </div>
                <div className="text-h2 text-text-primary">850</div>
                <div className="text-[11px] text-warning flex items-center mt-1">
                  <AlertTriangle size={12} className="mr-1" /> Exceeds capacity
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-[14px] font-semibold text-text-primary mb-2">
                Key Findings
              </h4>
              <p className="text-[13px] text-text-secondary leading-relaxed mb-4">
                The current simulation indicates that without additional
                interventions, peak ICU demand will exceed national capacity by
                day 45. The R0 remains above 1.2 in urban centers.
              </p>
              <h4 className="text-[14px] font-semibold text-text-primary mb-2">
                Policy Recommendations
              </h4>
              <ul className="list-disc pl-5 text-[13px] text-text-secondary space-y-1">
                <li>
                  Implement targeted lockdowns in high-density urban areas.
                </li>
                <li>
                  Increase ICU bed capacity by 20% within the next 30 days.
                </li>
                <li>
                  Accelerate vaccination rollout for vulnerable populations.
                </li>
              </ul>
            </div>
          </div>);

      case 'Data Export':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-[14px] font-semibold text-text-primary">
                Raw Simulation Data Preview
              </h4>
              <span className="text-[12px] text-text-secondary">
                Showing 5 of 10,000 rows
              </span>
            </div>
            <div className="overflow-x-auto border border-border rounded-lg">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-hover border-b border-border text-[11px] text-text-secondary uppercase tracking-wider">
                    <th className="p-3 font-medium">Day</th>
                    <th className="p-3 font-medium">Susceptible</th>
                    <th className="p-3 font-medium">Exposed</th>
                    <th className="p-3 font-medium">Infected</th>
                    <th className="p-3 font-medium">Recovered</th>
                    <th className="p-3 font-medium">Fatalities</th>
                  </tr>
                </thead>
                <tbody className="text-[13px] text-text-primary divide-y divide-border">
                  {[
                  [1, 12000000, 500, 100, 0, 0],
                  [2, 11999000, 1200, 250, 50, 0],
                  [3, 11997000, 2500, 600, 150, 2],
                  [4, 11993000, 5000, 1400, 400, 5],
                  [5, 11985000, 9500, 3200, 1000, 12]].
                  map((row, i) =>
                  <tr key={i} className="hover:bg-background">
                      {row.map((cell, j) =>
                    <td key={j} className="p-3">
                          {cell.toLocaleString()}
                        </td>
                    )}
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>);

      case 'Briefing Deck':
        return (
          <div className="space-y-4">
            <div className="aspect-video bg-background border border-border rounded-lg flex flex-col p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-primary"></div>
              <h2 className="text-h2 text-text-primary mt-4 mb-2">
                Epidemic Status Update
              </h2>
              <p className="text-[13px] text-text-secondary mb-8">
                National Task Force Briefing - {new Date().toLocaleDateString()}
              </p>

              <div className="grid grid-cols-2 gap-6 flex-1">
                <div className="space-y-3">
                  <div className="flex items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 mr-2 flex-shrink-0"></div>
                    <p className="text-[13px] text-text-primary">
                      Current trajectory shows stabilization in Northern
                      Province.
                    </p>
                  </div>
                  <div className="flex items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 mr-2 flex-shrink-0"></div>
                    <p className="text-[13px] text-text-primary">
                      Vaccination targets met for Phase 1 demographics.
                    </p>
                  </div>
                  <div className="flex items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-warning mt-1.5 mr-2 flex-shrink-0"></div>
                    <p className="text-[13px] text-text-primary">
                      Supply chain bottlenecks observed for PPE distribution.
                    </p>
                  </div>
                </div>
                <div className="bg-surface border border-border rounded flex items-center justify-center">
                  <BarChart3
                    className="text-text-secondary opacity-50"
                    size={48} />
                  
                </div>
              </div>

              <div className="flex justify-between items-center mt-auto pt-4 border-t border-border">
                <span className="text-[10px] text-text-secondary">
                  CONFIDENTIAL
                </span>
                <span className="text-[10px] text-text-secondary">
                  Slide 1 of 12
                </span>
              </div>
            </div>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4].map((i) =>
              <div
                key={i}
                className={`w-16 h-9 rounded border ${i === 1 ? 'border-primary bg-primary/10' : 'border-border bg-background'} cursor-pointer`}>
              </div>
              )}
            </div>
          </div>);

      case 'Full Technical Report':
        return (
          <div className="space-y-6">
            <div className="border-b border-border pb-4">
              <h1 className="text-h2 text-text-primary mb-2">
                Comprehensive Simulation Methodology and Results
              </h1>
              <p className="text-[13px] text-text-secondary">
                Document ID: TR-2026-042 • Version 1.2
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-[14px] font-semibold text-text-primary mb-2">
                  1. Methodology
                </h3>
                <p className="text-[13px] text-text-secondary leading-relaxed">
                  The simulation uses a stochastic SEIHFR model
                  (Susceptible-Exposed-Infectious-Hospitalised-Funeral-Removed)
                  for Ebola and Marburg. A branching process handles the first
                  cases, a health-worker layer tracks infection among hospital
                  staff, and Rt is estimated from Health Officers’ daily case
                  counts.
                </p>
              </div>

              <div>
                <h3 className="text-[14px] font-semibold text-text-primary mb-2">
                  2. Key Assumptions
                </h3>
                <ul className="list-disc pl-5 text-[13px] text-text-secondary space-y-1">
                  <li>
                    Basic reproduction number (R0) sampled from a normal
                    distribution N(2.4, 0.3).
                  </li>
                  <li>
                    Incubation period averages 5.2 days (95% CI: 4.1 - 7.0).
                  </li>
                  <li>
                    Asymptomatic transmission accounts for approximately 30% of
                    all secondary infections.
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-[14px] font-semibold text-text-primary mb-2">
                  3. Detailed Results
                </h3>
                <p className="text-[13px] text-text-secondary leading-relaxed">
                  Under the baseline scenario, the epidemic peaks at day 68 with
                  45,000 concurrent active cases. The implementation of Scenario
                  B (moderate NPIs) delays the peak to day 92 and reduces peak
                  incidence by 42%.
                </p>
              </div>
            </div>
          </div>);

      default:
        return null;
    }
  };
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-h1 text-text-primary mb-1">Reporting Center</h1>
          <p className="text-body text-text-secondary">
            Generate and export simulation insights
          </p>
        </div>
        <button
          onClick={() => setShowCustomModal(true)}
          className="bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-lg text-[13px] font-semibold flex items-center transition-colors shadow-sm">
          
          <Plus size={16} className="mr-2" />
          Custom Report
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Templates */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-h3 text-text-primary">Report Templates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((tpl, idx) => {
              const Icon = tpl.icon;
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedTemplate(tpl)}
                  className="bg-surface p-5 rounded-xl border border-border hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer group">
                  
                  <div className="flex items-start">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center mr-4 ${tpl.bg} ${tpl.color}`}>
                      
                      <Icon size={20} />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-[14px] font-semibold text-text-primary mb-1 group-hover:text-primary transition-colors">
                        {tpl.name}
                      </h4>
                      <p className="text-[12px] text-text-secondary leading-relaxed">
                        {tpl.desc}
                      </p>
                    </div>
                  </div>
                </div>);

            })}
          </div>

          <div className="bg-surface rounded-xl border border-border overflow-hidden mt-8">
            <div className="p-6 border-b border-border">
              <h3 className="text-h3 text-text-primary">Recent Reports</h3>
            </div>
            <div className="divide-y divide-border">
              {recentReports.map((report) =>
              <div
                key={report.id}
                onClick={() => setViewingReportId(report.id)}
                className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${report.id === focusedReportId ? 'bg-primary/5 border-l-2 border-primary' : 'hover:bg-background'}`}>
                
                  <div className="flex items-center">
                    <FileText size={18} className="text-text-secondary mr-4" />
                    <div>
                      <div className="text-[13px] font-medium text-text-primary">
                        {report.name}
                      </div>
                      <div className="text-[11px] text-text-secondary flex items-center mt-0.5">
                        <span className="font-semibold mr-2">
                          {report.type}
                        </span>
                        <Clock size={10} className="mr-1" /> {report.date}
                      </div>
                    </div>
                  </div>
                  <div
                  className="flex items-center gap-3"
                  onClick={(e) => e.stopPropagation()}>
                  
                    <button
                    onClick={() => setViewingReportId(report.id)}
                    className="text-[12px] font-medium text-primary hover:underline">
                    
                      View
                    </button>
                    <ExportButton
                    variant="icon"
                    onExport={(fmt) => {
                      const blob = new Blob(
                        [
                        JSON.stringify(
                          {
                            report: report.name,
                            format: fmt,
                            exportedAt: new Date().toISOString()
                          },
                          null,
                          2
                        )],

                        {
                          type: 'application/json'
                        }
                      );
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${report.name}.${fmt}`;
                      a.click();
                    }} />
                  
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Report Builder */}
        <div className="bg-surface p-6 rounded-xl border border-border flex flex-col h-[600px]">
          <h3 className="text-h3 text-text-primary mb-6">Quick Builder</h3>

          <div className="space-y-4 flex-1 overflow-y-auto pr-2">
            <div>
              <label className="block text-micro text-text-secondary mb-2">
                REPORT TITLE
              </label>
              <input
                type="text"
                defaultValue="Simulation Summary Report"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-[13px] focus:outline-none focus:border-primary" />
              
            </div>

            <div>
              <label className="block text-micro text-text-secondary mb-2">
                DATA SOURCE
              </label>
              <select className="w-full px-3 py-2 rounded-lg border border-border bg-background text-[13px] focus:outline-none focus:border-primary">
                <option>SIM-0042 (SEIHFR - Ebola)</option>
                <option>SIM-0041 (Health-worker layer - Marburg)</option>
              </select>
            </div>

            <div className="pt-4 border-t border-border">
              <label className="block text-micro text-text-secondary mb-3">
                INCLUDE SECTIONS
              </label>
              <div className="space-y-2">
                {[
                'Executive Summary',
                'Epidemic Curves',
                'Geographic Heatmaps',
                'Healthcare Capacity Forecast',
                'Parameter Configuration'].
                map((section, i) =>
                <label key={i} className="flex items-center cursor-pointer">
                    <input
                    type="checkbox"
                    defaultChecked={i < 3}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20" />
                  
                    <span className="ml-2 text-[13px] text-text-primary">
                      {section}
                    </span>
                  </label>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border mt-4">
            <button className="w-full bg-primary hover:bg-primary-dark text-white py-2.5 rounded-lg text-[13px] font-semibold transition-colors shadow-sm flex items-center justify-center">
              <FileText size={16} className="mr-2" />
              Generate PDF
            </button>
          </div>
        </div>
      </div>

      {/* Custom Report Modal */}
      {showCustomModal &&
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={() => setShowCustomModal(false)}>
        
          <div
          className="bg-surface rounded-xl border border-border w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}>
          
            {/* Modal header */}
            <div className="flex items-center justify-between p-5 border-b border-border flex-shrink-0">
              <div className="flex items-center">
                <div className="w-9 h-9 rounded-lg bg-hover text-primary flex items-center justify-center mr-3">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="text-h3 text-text-primary">
                    Create Custom Report
                  </h3>
                  <p className="text-[12px] text-text-secondary">
                    Configure a tailored report for your stakeholders
                  </p>
                </div>
              </div>
              <button
              onClick={() => setShowCustomModal(false)}
              className="text-text-secondary hover:text-text-primary p-1"
              aria-label="Close">
              
                <X size={18} />
              </button>
            </div>

            {/* Modal body */}
            <form
            onSubmit={handleGenerate}
            className="flex flex-col flex-1 overflow-hidden">
            
              <div className="p-5 space-y-5 overflow-y-auto">
                {/* Title + format */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-micro text-text-secondary mb-2">
                      REPORT TITLE
                    </label>
                    <input
                    type="text"
                    required
                    autoFocus
                    value={customForm.title}
                    onChange={(e) => updateCustom('title', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-[13px] text-text-primary focus:outline-none focus:border-primary" />
                  
                  </div>
                  <div>
                    <label className="block text-micro text-text-secondary mb-2">
                      FORMAT
                    </label>
                    <select
                    value={customForm.format}
                    onChange={(e) => updateCustom('format', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-[13px] text-text-primary focus:outline-none focus:border-primary">
                    
                      <option>PDF</option>
                      <option>Excel</option>
                      <option>PPTX</option>
                      <option>CSV</option>
                    </select>
                  </div>
                </div>

                {/* Data source + disease + region */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-micro text-text-secondary mb-2">
                      DATA SOURCE
                    </label>
                    <select
                    value={customForm.dataSource}
                    onChange={(e) =>
                    updateCustom('dataSource', e.target.value)
                    }
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-[13px] text-text-primary focus:outline-none focus:border-primary">
                    
                      <option>SIM-0042 (SEIHFR - Ebola)</option>
                      <option>SIM-0041 (Health-worker layer - Marburg)</option>
                      <option>SIM-0040 (SEIHFR - Ebola bed stress test)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-micro text-text-secondary mb-2">
                      DISEASE
                    </label>
                    <select
                    value={customForm.disease}
                    onChange={(e) => updateCustom('disease', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-[13px] text-text-primary focus:outline-none focus:border-primary">
                    
                      <option>Ebola</option>
                      <option>Marburg</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-micro text-text-secondary mb-2">
                      REGION
                    </label>
                    <select
                    value={customForm.region}
                    onChange={(e) => updateCustom('region', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-[13px] text-text-primary focus:outline-none focus:border-primary">
                    
                      <option>National</option>
                      <option>Kigali City</option>
                      <option>Western Province</option>
                      <option>Eastern Province</option>
                      <option>Southern Province</option>
                      <option>Northern Province</option>
                    </select>
                  </div>
                </div>

                {/* Date range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-micro text-text-secondary mb-2 flex items-center">
                      <Calendar size={11} className="mr-1.5" /> FROM
                    </label>
                    <input
                    type="date"
                    value={customForm.from}
                    onChange={(e) => updateCustom('from', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-[13px] text-text-primary focus:outline-none focus:border-primary" />
                  
                  </div>
                  <div>
                    <label className="block text-micro text-text-secondary mb-2 flex items-center">
                      <Calendar size={11} className="mr-1.5" /> TO
                    </label>
                    <input
                    type="date"
                    value={customForm.to}
                    onChange={(e) => updateCustom('to', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-[13px] text-text-primary focus:outline-none focus:border-primary" />
                  
                  </div>
                </div>

                {/* Audience + detail */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-micro text-text-secondary mb-2 flex items-center">
                      <Users size={11} className="mr-1.5" /> AUDIENCE
                    </label>
                    <select
                    value={customForm.audience}
                    onChange={(e) => updateCustom('audience', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-[13px] text-text-primary focus:outline-none focus:border-primary">
                    
                      <option>Policy Makers</option>
                      <option>Epidemiologists</option>
                      <option>Public Health Officers</option>
                      <option>General Public</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-micro text-text-secondary mb-2">
                      DETAIL LEVEL
                    </label>
                    <select
                    value={customForm.detail}
                    onChange={(e) => updateCustom('detail', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-[13px] text-text-primary focus:outline-none focus:border-primary">
                    
                      <option>Summary</option>
                      <option>Standard</option>
                      <option>Comprehensive</option>
                    </select>
                  </div>
                </div>

                {/* Sections */}
                <div className="pt-4 border-t border-border">
                  <label className="block text-micro text-text-secondary mb-3 flex items-center">
                    <Layers size={11} className="mr-1.5" /> INCLUDE SECTIONS (
                    {customForm.sections.length})
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {SECTION_OPTIONS.map((section) =>
                  <label
                    key={section}
                    className="flex items-center cursor-pointer p-2 rounded-lg border border-border bg-background hover:border-primary/40 transition-colors">
                    
                        <input
                      type="checkbox"
                      checked={customForm.sections.includes(section)}
                      onChange={() => toggleSection(section)}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20" />
                    
                        <span className="ml-2 text-[13px] text-text-primary">
                          {section}
                        </span>
                      </label>
                  )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-micro text-text-secondary mb-2">
                    NOTES / DESCRIPTION
                  </label>
                  <textarea
                  rows={2}
                  value={customForm.description}
                  onChange={(e) =>
                  updateCustom('description', e.target.value)
                  }
                  placeholder="Optional context or instructions for this report…"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-[13px] text-text-primary resize-none focus:outline-none focus:border-primary" />
                
                </div>
              </div>

              {/* Modal footer */}
              <div className="flex justify-end gap-3 p-5 border-t border-border flex-shrink-0">
                <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="px-4 py-2 text-[13px] font-semibold text-text-secondary hover:bg-hover rounded-lg transition-colors">
                
                  Cancel
                </button>
                <button
                type="submit"
                disabled={customForm.sections.length === 0}
                className="bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors flex items-center">
                
                  <FileText size={15} className="mr-1.5" />
                  Generate Report
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      {/* Report Detail Modal (opened from dashboard "Open Full Report" or list) */}
      {viewingReport &&
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        role="dialog"
        aria-modal="true"
        aria-label={`Report ${viewingReport.id}`}
        onClick={() => setViewingReportId(null)}>
        
          <div
          className="bg-surface rounded-xl border border-border w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}>
          
            <div className="flex items-start justify-between p-5 border-b border-border flex-shrink-0">
              <div className="flex items-center">
                <div className="w-9 h-9 rounded-lg bg-hover text-primary flex items-center justify-center mr-3">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="text-h3 text-text-primary">
                    {viewingReport.id}: {viewingReport.name}
                  </h3>
                  <div className="flex items-center gap-3 text-[12px] text-text-secondary mt-0.5">
                    <span>{viewingReport.model} Model</span>
                    <span>·</span>
                    <span>{viewingReport.disease}</span>
                    <span>·</span>
                    <span>{viewingReport.region}</span>
                    <span>·</span>
                    <span className="flex items-center">
                      <Clock size={11} className="mr-1" />
                      {viewingReport.duration}
                    </span>
                  </div>
                </div>
              </div>
              <button
              onClick={() => setViewingReportId(null)}
              className="text-text-secondary hover:text-text-primary p-1"
              aria-label="Close">
              
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
              {
                icon: TrendingUp,
                label: 'Peak Infections',
                value: viewingReport.peakInfections,
                color: 'text-primary'
              },
              {
                icon: Activity,
                label: 'Total Cases',
                value: viewingReport.totalCases,
                color: 'text-text-primary'
              },
              {
                icon: HeartPulse,
                label: 'Recoveries',
                value: viewingReport.recoveries,
                color: 'text-success'
              },
              {
                icon: Skull,
                label: 'Fatalities',
                value: viewingReport.fatalities,
                color: 'text-danger'
              }].
              map((m) =>
              <div
                key={m.label}
                className="bg-background border border-border rounded-lg p-4">
                
                    <div className="text-micro text-text-secondary mb-1 flex items-center">
                      {createElement(m.icon, {
                    size: 12,
                    className: 'mr-1.5'
                  })}
                      {m.label.toUpperCase()}
                    </div>
                    <div className={`text-h2 ${m.color}`}>
                      {m.value.toLocaleString()}
                    </div>
                  </div>
              )}
              </div>

              <div className="mt-4 bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="text-micro text-text-secondary mb-1">
                  KEY FINDING
                </div>
                <p className="text-[14px] font-medium text-primary">
                  {viewingReport.result}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-5 border-t border-border flex-shrink-0">
              <button
              onClick={() => setViewingReportId(null)}
              className="px-4 py-2 text-[13px] font-semibold text-text-secondary hover:bg-hover rounded-lg transition-colors">
              
                Close
              </button>
              <ExportButton
              onExport={(fmt) => {
                alert(`Exporting ${viewingReport.id} report as ${fmt}...`);
                setViewingReportId(null);
              }} />
            
            </div>
          </div>
        </div>
      }

      {/* Template Preview Modal */}
      {selectedTemplate &&
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={() => setSelectedTemplate(null)}>
        
          <div
          className="bg-surface rounded-xl border border-border w-full max-w-3xl shadow-2xl max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}>
          
            {/* Modal header */}
            <div className="flex items-center justify-between p-5 border-b border-border flex-shrink-0">
              <div className="flex items-center">
                <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center mr-3 ${selectedTemplate.bg} ${selectedTemplate.color}`}>
                
                  <selectedTemplate.icon size={18} />
                </div>
                <div>
                  <h3 className="text-h3 text-text-primary">
                    {selectedTemplate.name} Preview
                  </h3>
                  <p className="text-[12px] text-text-secondary">
                    {selectedTemplate.desc}
                  </p>
                </div>
              </div>
              <button
              onClick={() => setSelectedTemplate(null)}
              className="text-text-secondary hover:text-text-primary p-1"
              aria-label="Close">
              
                <X size={18} />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6 overflow-y-auto flex-1 bg-background/50">
              {renderTemplatePreview(selectedTemplate.name)}
            </div>

            {/* Modal footer */}
            <div className="flex justify-between items-center p-5 border-t border-border flex-shrink-0 bg-surface">
              <div className="text-[13px] text-text-secondary">
                Preview data is based on SIM-0042 (SEIHFR - Ebola)
              </div>
              <div className="flex gap-3">
                <button
                type="button"
                onClick={() => setSelectedTemplate(null)}
                className="px-4 py-2 text-[13px] font-semibold text-text-secondary hover:bg-hover rounded-lg transition-colors">
                
                  Close
                </button>
                <ExportButton
                onExport={(fmt) => {
                  alert(`Exporting ${selectedTemplate.name} as ${fmt}...`);
                  setSelectedTemplate(null);
                }} />
              
              </div>
            </div>
          </div>
        </div>
      }
    </div>);

}