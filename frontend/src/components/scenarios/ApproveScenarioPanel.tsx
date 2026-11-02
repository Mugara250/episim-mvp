import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { client, unwrap } from '../../api/client';
import { useApprovedScenarios } from '../../api/policy';

/** Epidemiologist approval of a saved scenario for policy makers (docs Module 13). The server
 * links the approval to the scenario's latest completed run and refuses if there is none. */
export function ApproveScenarioPanel({ scenarioId }: {scenarioId: string;}) {
  const qc = useQueryClient();
  const approved = useApprovedScenarios();
  const [plan, setPlan] = useState('');
  const approve = useMutation({
    mutationFn: async () =>
    unwrap(
      await client.POST('/api/scenarios/{scenario_id}/approve', {
        params: { path: { scenario_id: scenarioId } },
        body: { planSummary: plan.trim() }
      })
    ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['policy'] })
  });
  const existing = approved.data?.find((a) => a.scenarioId === scenarioId);

  if (existing) {
    return (
      <div className="flex items-center gap-2 text-[13px] text-text-secondary">
        <CheckCircle2 size={15} className="text-success" />
        Approved for policy makers by {existing.approvedBy}
        {existing.runId ? ` (results from ${existing.runId})` : ''}
      </div>);

  }
  return (
    <div className="w-full rounded-lg border border-border bg-bg/50 p-4 space-y-3">
      <div className="flex items-center gap-2 text-[13px] font-semibold text-text-primary">
        <ShieldCheck size={15} className="text-primary" /> Approve for policy makers
      </div>
      <p className="text-[12px] text-text-secondary">
        Policy makers will see this scenario with the results of its latest completed run, labelled as scenario
        estimates, not forecasts.
      </p>
      <textarea
        value={plan}
        onChange={(e) => setPlan(e.target.value)}
        rows={2}
        placeholder="One-sentence plan, e.g. Start contact tracing and isolation within 3 days of the first case."
        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-[13px] text-text-primary focus:outline-none focus:border-primary" />

      {approve.isError && <p className="text-[12px] text-danger">{(approve.error as Error).message}</p>}
      <button
        onClick={() => approve.mutate()}
        disabled={!plan.trim() || approve.isPending}
        className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-[13px] font-semibold flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">

        {approve.isPending ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
        Approve scenario
      </button>
    </div>);

}
