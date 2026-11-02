import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, MapPin } from 'lucide-react';
import { GeoHeader } from '../components/Geographic/GeoHeader';
import { GeoMapCard } from '../components/Geographic/GeoMapCard';
import { GeoSidePanel } from '../components/Geographic/GeoSidePanel';
import { useGeographicSpread } from '../hooks/useGeographicSpread';
import { exportDistrictCsv, exportMapPng } from '../utils/geoExport';

function Notice({ tone, title, text, action }: {tone: 'error' | 'empty';title: string;text: string;action?: boolean;}) {
  return (
    <section className="bg-surface rounded-2xl border border-border shadow-card p-10 flex flex-col items-center text-center">
      <span className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${tone === 'error' ? 'bg-danger/10 text-danger' : 'bg-hover text-primary'}`}>
        {tone === 'error' ? <AlertTriangle size={22} /> : <MapPin size={22} />}
      </span>
      <h2 className="text-h3 text-text-primary">{title}</h2>
      <p className="text-[13px] text-text-secondary mt-1 max-w-md">{text}</p>
      {action &&
      <Link to="/simulation" className="mt-5 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors">
          Go to Simulations
        </Link>
      }
    </section>);

}

export function Geographic() {
  const g = useGeographicSpread();
  const svgRef = useRef<SVGSVGElement>(null);
  const runName = g.geoRuns.find((r) => r.id === g.runId)?.scenarioName ?? g.runId ?? 'geographic-run';

  const onExport = (f: 'png' | 'csv') => {
    if (f === 'png') exportMapPng(svgRef.current, runName, g.day);else
    if (g.results) exportDistrictCsv(g.results, runName);
  };

  const body = () => {
    if (g.boundariesQ.isError) {
      return (
        <Notice
          tone="error"
          title="District boundaries couldn't be loaded"
          text={`The map needs the district boundary file and is not drawn without it. ${(g.boundariesQ.error as Error).message}`} />);

    }
    if (g.runsQ.isError) return <Notice tone="error" title="Runs couldn't be loaded" text={(g.runsQ.error as Error).message} />;
    if (g.runsQ.isLoading || g.boundariesQ.isLoading) {
      return <div className="bg-surface rounded-2xl border border-border p-6 text-[13px] text-text-secondary">Loading…</div>;
    }
    if (g.geoRuns.length === 0) {
      return (
        <Notice
          tone="empty"
          title="No completed geographic runs yet"
          text="Start a run with the district model (choose a seed district) on the Simulations page. Completed runs appear here."
          action />);

    }
    if (g.resultsQ.isError) return <Notice tone="error" title="Results couldn't be loaded" text={(g.resultsQ.error as Error).message} />;
    if (!g.results || !g.boundariesQ.data) {
      return <div className="bg-surface rounded-2xl border border-border p-6 text-[13px] text-text-secondary">Loading district results…</div>;
    }
    return (
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,62fr)_minmax(0,38fr)] gap-6 items-start">
        <GeoMapCard g={g} boundaries={g.boundariesQ.data} svgRef={svgRef} />
        <GeoSidePanel g={g} onExport={onExport} />
      </div>);

  };

  return (
    <div className="max-w-[1440px] mx-auto space-y-6">
      <GeoHeader g={g} />
      {body()}
    </div>);

}
