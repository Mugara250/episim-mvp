import type { ApiInterventionType, ApiPackage } from '../api/interventions';
import { EffectMechanism, InterventionPackage, InterventionType, PackageItem, TypeDraft } from '../types/interventions';

export const MECHANISM_LABELS: Record<EffectMechanism, string> = {
  rate: 'Rate multiplier',
  shift: 'Compartment shift'
};

export const MECHANISM_HELP: Record<EffectMechanism, string> = {
  rate: 'Lowers how easily the disease spreads while the intervention is active. Example: lockdown, masking, testing, contact tracing.',
  shift: 'Moves people straight from “can catch it” (Susceptible) to “protected” (Recovered). Example: vaccination.'
};

/** Short names for the model levers (the API supplies the long descriptions). */
export const LEVER_LABELS: Record<string, string> = {
  contact_tracing: 'Contact tracing',
  isolation: 'Isolation',
  safe_burial: 'Safe burial',
  detection: 'Detection delay',
  community: 'Community spread',
  hospital: 'Hospital spread',
  masking: 'Community and hospital spread',
  vaccination: 'Vaccination (S → R)'
};

export const leverLabel = (lever: string | undefined) => lever ? LEVER_LABELS[lever] ?? lever : '—';

export const fromApiType = (t: ApiInterventionType): InterventionType => ({
  id: t.id,
  key: t.key,
  name: t.name,
  description: t.description ?? '',
  builtIn: t.builtIn,
  placeholder: t.placeholder,
  mechanism: t.mechanism as EffectMechanism,
  defaultEffect: t.defaultEffect,
  source: t.source ?? '',
  engineLever: t.engineLever,
  leverDescription: t.leverDescription ?? ''
});

export const fromApiPackage = (p: ApiPackage): InterventionPackage => ({
  id: p.id,
  name: p.name,
  description: p.description,
  items: p.items.map((i) => ({
    id: i.id,
    typeId: i.typeId,
    startDay: i.startDay,
    endDay: i.endDay ?? null,
    coverage: i.coverage,
    customEffect: i.customEffect ?? null
  })),
  updated: new Date(p.updated).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
  illustrative: p.illustrative,
  scenariosUsing: p.scenariosUsing
});

export const toTypeDraft = (t: InterventionType): TypeDraft => ({
  name: t.name,
  key: t.key,
  mechanism: t.mechanism,
  engineLever: t.engineLever ?? '',
  defaultEffect: String(Math.round(t.defaultEffect * 100)),
  source: t.source
});

export const BLANK_TYPE_DRAFT: TypeDraft = { name: '', key: '', mechanism: 'rate', engineLever: 'contact_tracing', defaultEffect: '30', source: '' };

export const sameTypeDraft = (a: TypeDraft, b: TypeDraft) =>
(Object.keys(a) as (keyof TypeDraft)[]).every((k) => String(a[k]).trim() === String(b[k]).trim());

export const toKey = (name: string) =>
name.
toLowerCase().
replace(/[^a-z0-9]+/g, '_').
replace(/^_+|_+$/g, '');

export function validateTypeDraft(d: TypeDraft, types: InterventionType[], selfId: string | null) {
  const errors: Partial<Record<keyof TypeDraft, string>> = {};
  const name = d.name.trim();
  if (!name) errors.name = 'Give the type a name.';else
  if (types.some((t) => t.id !== selfId && t.name.toLowerCase() === name.toLowerCase())) errors.name = 'Another type already has this name.';
  const key = d.key.trim();
  if (!key) errors.key = 'Enter a key, e.g. case_isolation.';else
  if (!/^[a-z][a-z0-9_]*$/.test(key)) errors.key = 'Use lowercase letters, numbers and underscores only, starting with a letter.';else
  if (types.some((t) => t.id !== selfId && t.key === key)) errors.key = 'Another type already uses this key.';
  const v = d.defaultEffect.trim();
  const n = Number(v);
  if (!v) errors.defaultEffect = 'Enter the default effect size.';else
  if (!Number.isFinite(n)) errors.defaultEffect = 'Effect size must be a number.';else
  if (n < 0 || n > 100) errors.defaultEffect = 'Effect size must be between 0% and 100%.';
  if (!d.engineLever) errors.engineLever = 'Choose the part of the model this acts on.';else
  if ((d.mechanism === 'shift') !== (d.engineLever === 'vaccination'))
  errors.engineLever = d.mechanism === 'shift' ? 'A compartment shift acts on the vaccination lever.' : 'Only a compartment shift can use the vaccination lever.';
  return errors;
}

export const effectOf = (item: PackageItem, type: InterventionType | undefined) => item.customEffect ?? type?.defaultEffect ?? 0;

export const pct = (v: number) => `${Math.round(v * 1000) / 10}%`;

export function uniqueName(base: string, names: string[]) {
  const taken = new Set(names.map((n) => n.toLowerCase()));
  if (!taken.has(base.toLowerCase())) return base;
  let i = 2;
  while (taken.has(`${base} ${i}`.toLowerCase())) i++;
  return `${base} ${i}`;
}

export const samePackage = (a: InterventionPackage, b: InterventionPackage) =>
a.name.trim() === b.name.trim() && a.description.trim() === b.description.trim() && JSON.stringify(a.items) === JSON.stringify(b.items);

/** Axis length for the timeline: at least 60 days, rounded up to the next 10 past the latest day used. */
export function timelineLength(items: PackageItem[]) {
  const last = items.reduce((m, i) => Math.max(m, i.endDay ?? i.startDay + 14, i.startDay), 0);
  return Math.max(60, Math.ceil((last + 10) / 10) * 10);
}

export const todayLabel = () => new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });