import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCapacityOptions, useRuns } from '../api/comparison';
import { useDistrictBoundaries, useGeoResults } from '../api/geographic';
import { GeoMetric } from '../types/geographic';

/** State for the Geographic Spread page. Run and capacity live in the URL (?run=&capacity=) so links can be shared. */
export function useGeographicSpread() {
  const [params, setParams] = useSearchParams();
  const runsQ = useRuns();
  const optionsQ = useCapacityOptions();
  const boundariesQ = useDistrictBoundaries();

  const geoRuns = useMemo(
    () => (runsQ.data ?? []).filter((r) => r.modelType === 'seihfr_geo' && r.status === 'completed'),
    [runsQ.data]
  );
  const runParam = params.get('run');
  const runId = runParam ?? geoRuns[0]?.id ?? null;
  const capacityParam = params.get('capacity');

  const resultsQ = useGeoResults(runId, capacityParam);
  const g = resultsQ.data;
  const H = g?.days ?? 0;

  const [metric, setMetric] = useState<GeoMetric>('cases');
  const [day, setDay] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [showLinks, setShowLinks] = useState(false);

  const setParam = (key: string, value: string | null) => {
    const p = new URLSearchParams(params);
    if (value) p.set(key, value);else
    p.delete(key);
    setParams(p, { replace: true });
  };

  // New run: start the timeline at the end of the horizon (the whole picture), select the seed district.
  useEffect(() => {
    if (!g) return;
    setDay(g.days);
    setPlaying(false);
    setSelectedCode((c) => c && g.districts.some((d) => d.code === c) ? c : g.seedDistrictCode ?? g.districts[0]?.code ?? null);
  }, [g?.runId]); // eslint-disable-line react-hooks/exhaustive-deps

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
    }, 120);
    return () => window.clearInterval(id);
  }, [playing, H]);

  const togglePlay = () => {
    if (!playing && day >= H) setDay(0);
    setPlaying((p) => !p);
  };

  const selected = g?.districts.find((d) => d.code === selectedCode) ?? null;
  const watch = useMemo(
    () => (g?.watchList ?? []).map((code) => g?.districts.find((d) => d.code === code)).filter((d) => !!d),
    [g]
  );

  return {
    runsQ,
    geoRuns,
    runId,
    setRunId: (id: string) => setParam('run', id),
    // Profiles with real per-district beds first; others are spread across districts by population.
    capacityOptions: [...(optionsQ.data ?? [])].sort((a, b) => Number(b.hasDistrictBeds) - Number(a.hasDistrictBeds)),
    capacityId: capacityParam ?? g?.capacity?.profileId ?? null,
    setCapacityId: (id: string | null) => setParam('capacity', id),
    boundariesQ,
    resultsQ,
    results: g,
    horizon: H,
    metric,
    setMetric,
    day,
    setDay,
    playing,
    togglePlay,
    selected,
    selectDistrict: setSelectedCode,
    watch,
    showLinks,
    setShowLinks
  };
}

export type GeoState = ReturnType<typeof useGeographicSpread>;
