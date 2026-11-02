import React, { useRef } from 'react';
import { GeoHeader } from '../components/Geographic/GeoHeader';
import { GeoMapCard } from '../components/Geographic/GeoMapCard';
import { GeoSidePanel } from '../components/Geographic/GeoSidePanel';
import { useGeographicSpread } from '../hooks/useGeographicSpread';
import { GeoMetric } from '../types/geographic';
import { exportDistrictCsv, exportMapPng } from '../utils/geoExport';
import { useScreenInit } from '../useScreenInit.js';

interface GeoScreenInit {
  geoScenarioId?: string;
  geoMetric?: GeoMetric;
  geoSelectedId?: string;
  geoShowLinks?: boolean;
}

export function Geographic() {
  const init = useScreenInit() as GeoScreenInit;
  const g = useGeographicSpread({
    scenarioId: init.geoScenarioId,
    metric: init.geoMetric,
    selectedId: init.geoSelectedId,
    showLinks: init.geoShowLinks
  });
  const svgRef = useRef<SVGSVGElement>(null);

  const onExport = (f: 'png' | 'csv') => {
    if (f === 'png') exportMapPng(svgRef.current, g.scenario, g.day);else
    exportDistrictCsv(g.projections, g.scenario);
  };

  return (
    <div className="max-w-[1440px] mx-auto space-y-6">
      <GeoHeader
        scenarioId={g.scenarioId}
        onScenario={g.setScenarioId}
        capacityId={g.capacityId}
        onCapacity={g.setCapacityId}
        illustrative={g.scenario.illustrative} />
      
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,62fr)_minmax(0,38fr)] gap-6 items-start">
        <GeoMapCard g={g} svgRef={svgRef} />
        <GeoSidePanel g={g} onExport={onExport} />
      </div>
    </div>);

}