import { useEffect, useMemo, useState } from 'react';
import { geoCapacityProfiles, geoScenarios } from '../data/geographic';
import { GeoMetric } from '../types/geographic';
import { projectDistrict, projectSpread, topRiskDistricts } from '../utils/geographicSpread';

interface Options {
  scenarioId?: string;
  metric?: GeoMetric;
  selectedId?: string;
  showLinks?: boolean;
}

export function useGeographicSpread(init: Options) {
  const [scenarioId, setScenarioId] = useState(init.scenarioId ?? geoScenarios[0].id);
  const [capacityId, setCapacityId] = useState(geoCapacityProfiles[0].id);
  const [metric, setMetric] = useState<GeoMetric>(init.metric ?? 'cases');
  const [day, setDay] = useState(34);
  const [playing, setPlaying] = useState(false);
  const [selectedId, setSelectedId] = useState(init.selectedId ?? 'gasabo');
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [showLinks, setShowLinks] = useState(!!init.showLinks);

  const scenario = geoScenarios.find((s) => s.id === scenarioId) ?? geoScenarios[0];
  const capacity = geoCapacityProfiles.find((c) => c.id === capacityId) ?? geoCapacityProfiles[0];
  const H = scenario.horizon;

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setDay((d) => {
        if (d >= H) {
          setPlaying(false);
          return d;
        }
        return d + 1;
      });
    }, 180);
    return () => window.clearInterval(id);
  }, [playing, H]);

  const togglePlay = () => {
    if (!playing && day >= H) setDay(0);
    setPlaying((p) => !p);
  };

  const projections = useMemo(() => projectSpread(scenario, capacity, responses), [scenario, capacity, responses]);
  const maxCases = useMemo(() => Math.max(10, ...projections.map((p) => p.totalCases)), [projections]);
  const topRisk = useMemo(() => topRiskDistricts(projections), [projections]);
  const selected = projections.find((p) => p.district.id === selectedId) ?? projections[0];
  const baseline = useMemo(() => projectDistrict(selected.district, scenario, capacity), [selected.district, scenario, capacity]);

  const setResponseDay = (id: string, value: number) =>
  setResponses((r) => {
    const next = { ...r };
    if (value >= H) delete next[id];else
    next[id] = value;
    return next;
  });

  return {
    scenario,
    capacity,
    scenarioId,
    setScenarioId,
    capacityId,
    setCapacityId,
    metric,
    setMetric,
    day,
    setDay,
    playing,
    togglePlay,
    projections,
    maxCases,
    topRisk,
    selected,
    baseline,
    selectDistrict: setSelectedId,
    responseDay: responses[selected.district.id] ?? H,
    setResponseDay,
    showLinks,
    setShowLinks
  };
}

export type GeoState = ReturnType<typeof useGeographicSpread>;