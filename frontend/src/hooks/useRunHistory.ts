import { useMemo, useState } from 'react';
import { RunStatus, SimulationRun } from '../types/simulationRuns';

export type StatusFilter = 'all' | RunStatus;

/** Filters and selection for the History tab. */
export function useRunHistory(runs: SimulationRun[], userId: string) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [disease, setDisease] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [onlyMine, setOnlyMine] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return runs.filter((r) => {
      const day = r.startedAt.slice(0, 10);
      return (
        (status === 'all' || r.status === status) && (
        disease === 'all' || r.disease === disease) && (
        !from || day >= from) && (
        !to || day <= to) && (
        !onlyMine || r.requestedById === userId) && (
        !q || r.scenarioName.toLowerCase().includes(q) || r.id.toLowerCase().includes(q)));

    });
  }, [runs, query, status, disease, from, to, onlyMine, userId]);

  const diseaseIds = useMemo(
    () => Array.from(new Set(runs.map((r) => r.disease).filter((x): x is string => !!x))),
    [runs]
  );

  const filtersActive = !!query.trim() || status !== 'all' || disease !== 'all' || !!from || !!to || onlyMine;
  const clear = () => {
    setQuery('');
    setStatus('all');
    setDisease('all');
    setFrom('');
    setTo('');
    setOnlyMine(false);
  };

  const completedIds = new Set(runs.filter((r) => r.status === 'completed').map((r) => r.id));
  const validSelection = selected.filter((id) => completedIds.has(id));
  const toggle = (id: string) => setSelected((list) => list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  return {
    query,
    setQuery,
    status,
    setStatus,
    disease,
    setDisease,
    from,
    setFrom,
    to,
    setTo,
    onlyMine,
    setOnlyMine,
    rows,
    diseaseIds,
    filtersActive,
    clear,
    selected: validSelection,
    toggle,
    select: (id: string) => setSelected((list) => list.includes(id) ? list : [...list, id]),
    clearSelection: () => setSelected([])
  };
}

export type RunHistoryState = ReturnType<typeof useRunHistory>;