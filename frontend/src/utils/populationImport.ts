import { AGGREGATE_FIELDS, DISTRICTS, MICRODATA_FIELDS, SECTORS } from '../data/populationImport';
import {
  CellIssue,
  CheckedRow,
  DetectedFormat,
  FieldSpec,
  ImportFormat,
  Mapping } from
'../types/populationImport';

export const fieldsFor = (format: ImportFormat): FieldSpec[] =>
format === 'microdata' ? MICRODATA_FIELDS : AGGREGATE_FIELDS;

export function formatBytes(bytes: number) {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

export const formatCount = (n: number) => n.toLocaleString('en-US');

/** Splits one CSV line, honouring double-quoted values. */
export function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') quoted = false;else
      cur += ch;
    } else if (ch === '"') quoted = true;else
    if (ch === ',') {
      out.push(cur.trim());
      cur = '';
    } else cur += ch;
  }
  out.push(cur.trim());
  return out;
}

const norm = (s: string) => s.trim().toLowerCase().replace(/[\s-]+/g, '_');

export function autoMap(format: ImportFormat, columns: string[]): Mapping {
  const used = new Set<string>();
  const mapping: Mapping = {};
  for (const f of fieldsFor(format)) {
    const match = columns.find((c) => !used.has(c) && f.synonyms.includes(norm(c)));
    mapping[f.key] = match ?? '';
    if (match) used.add(match);
  }
  return mapping;
}

export function detectFormat(columns: string[]): DetectedFormat {
  const has = (f: FieldSpec) => columns.some((c) => f.synonyms.includes(norm(c)));
  const micro = MICRODATA_FIELDS.filter((f) => ['person_id', 'household_id', 'age', 'sex'].includes(f.key)).filter(has).length;
  const agg = AGGREGATE_FIELDS.filter((f) => ['population_count', 'age_band'].includes(f.key)).filter(has).length;
  if (micro >= 3 && agg === 0) return 'microdata';
  if (agg >= 1 && micro <= 1) return 'aggregate';
  return 'unknown';
}

const URBAN_RURAL = ['urban', 'rural', '1', '2'];
const SEXES = ['male', 'female', 'm', 'f', '1', '2'];
const RELATIONS = ['head', 'spouse', 'child', 'stepchild', 'grandchild', 'parent', 'sibling', 'other relative', 'domestic worker', 'not related', 'other'];

function validDistrict(code: string) {
  return Object.values(DISTRICTS).some((list) => list.some((d) => d.code === code));
}

function validSector(code: string) {
  if (!/^\d{4}$/.test(code) || !validDistrict(code.slice(0, 2))) return false;
  const known = SECTORS[code.slice(0, 2)];
  return known ? known.some((s) => s.code === code) : Number(code.slice(2)) >= 1;
}

function checkMicro(v: Record<string, string>): CellIssue[] {
  const issues: CellIssue[] = [];
  const region = (field: string, message: string) => issues.push({ field, level: 'error', kind: 'Invalid region code', message });
  for (const f of MICRODATA_FIELDS) {
    if (f.required && !v[f.key]) issues.push({ field: f.key, level: 'error', kind: 'Missing required value', message: `${f.label} is empty` });
  }
  const prov = v.province_code;
  const dist = v.district_code;
  const sect = v.sector_code;
  if (prov && !/^[1-5]$/.test(prov)) region('province_code', `Province must be 1 to 5, found “${prov}”`);
  if (dist && (!validDistrict(dist) || prov && dist[0] !== prov)) region('district_code', `“${dist}” is not a district in province ${prov}`);
  if (sect && (!validSector(sect) || dist && sect.slice(0, 2) !== dist)) region('sector_code', `“${sect}” is not a sector in district ${dist}`);
  if (v.area_type && !URBAN_RURAL.includes(v.area_type.toLowerCase()))
  issues.push({ field: 'area_type', level: 'error', kind: 'Unrecognised value', message: `Expected urban or rural, found “${v.area_type}”` });
  if (v.sex && !SEXES.includes(v.sex.toLowerCase()))
  issues.push({ field: 'sex', level: 'error', kind: 'Unrecognised value', message: `Expected male or female, found “${v.sex}”` });
  if (v.age) {
    const age = Number(v.age);
    if (!Number.isInteger(age) || age < 0 || age > 122)
    issues.push({ field: 'age', level: 'error', kind: 'Age out of range', message: `Age must be a whole number from 0 to 122, found “${v.age}”` });else
    if (age >= 100) issues.push({ field: 'age', level: 'warning', kind: 'Check value', message: `Age ${age} is unusual. Please confirm it is correct.` });
  }
  if (v.relationship_to_head && !RELATIONS.includes(v.relationship_to_head.toLowerCase()))
  issues.push({ field: 'relationship_to_head', level: 'warning', kind: 'Check value', message: `“${v.relationship_to_head}” will be imported as “other”` });
  return issues;
}

function checkAggregate(v: Record<string, string>): CellIssue[] {
  const issues: CellIssue[] = [];
  for (const f of AGGREGATE_FIELDS) {
    if (f.required && !v[f.key]) issues.push({ field: f.key, level: 'error', kind: 'Missing required value', message: `${f.label} is empty` });
  }
  const r = v.sub_region_id;
  if (r && !(r.length === 2 ? validDistrict(r) : validSector(r)))
  issues.push({ field: 'sub_region_id', level: 'error', kind: 'Invalid region code', message: `“${r}” is not a district or sector code` });
  if (v.age_band && !/^\d{1,3}(-\d{1,3}|\+)$/.test(v.age_band))
  issues.push({ field: 'age_band', level: 'error', kind: 'Unrecognised value', message: `Use a band like 0-4 or 65+, found “${v.age_band}”` });
  if (v.population_count && !(Number.isInteger(Number(v.population_count)) && Number(v.population_count) >= 0))
  issues.push({ field: 'population_count', level: 'error', kind: 'Unrecognised value', message: `Count must be a whole number, found “${v.population_count}”` });
  if (v.density_per_km2 && !(Number(v.density_per_km2) >= 0))
  issues.push({ field: 'density_per_km2', level: 'warning', kind: 'Check value', message: `Density “${v.density_per_km2}” is not a number and will be left blank` });
  if (v.urban_rural && !URBAN_RURAL.includes(v.urban_rural.toLowerCase()))
  issues.push({ field: 'urban_rural', level: 'error', kind: 'Unrecognised value', message: `Expected urban or rural, found “${v.urban_rural}”` });
  return issues;
}

/** Maps raw file rows to EpiSim fields and checks each one. */
export function checkRows(rows: Record<string, string>[], format: ImportFormat, mapping: Mapping): CheckedRow[] {
  return rows.map((raw, i) => {
    const values: Record<string, string> = {};
    for (const f of fieldsFor(format)) values[f.key] = mapping[f.key] ? raw[mapping[f.key]] ?? '' : '';
    return { line: i + 2, values, issues: format === 'microdata' ? checkMicro(values) : checkAggregate(values) };
  });
}

export const hasError = (r: CheckedRow) => r.issues.some((i) => i.level === 'error');
export const hasWarningOnly = (r: CheckedRow) => !hasError(r) && r.issues.length > 0;