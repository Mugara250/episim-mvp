import { DetectedFormat, FieldSpec, ImportFormat, Mapping, RegionOption } from '../types/populationImport';

// Row checks run on the server (POST /api/population/imports/check), so the screen and the
// import always agree. This file only holds the field specs used for column matching, the
// NISR region reference lists and small formatting helpers.

/** Uploads above this are refused by the MVP backend. */
export const MAX_FILE_BYTES = 50 * 1024 ** 2;
/** Files up to this size are read completely in the browser to show columns and a preview. */
export const FULL_READ_LIMIT_BYTES = 5 * 1024 ** 2;

export const MICRODATA_FIELDS: FieldSpec[] = [
{ key: 'household_id', label: 'Household ID', help: 'Same value for everyone in one household', required: true, synonyms: ['household_id', 'hh_id', 'hhid', 'household'] },
{ key: 'person_id', label: 'Person ID', help: 'Number of the person within the household', required: true, synonyms: ['person_id', 'pid', 'pers_id', 'person'] },
{ key: 'province_code', label: 'Province code', help: '1 to 5', required: true, synonyms: ['province_code', 'prov', 'province', 'prov_code'] },
{ key: 'district_code', label: 'District code', help: '2 digits, e.g. 12 = Gasabo', required: true, synonyms: ['district_code', 'dist', 'district', 'dist_code'] },
{ key: 'sector_code', label: 'Sector code', help: '4 digits, e.g. 1209 = Kimironko', required: true, synonyms: ['sector_code', 'sect', 'sector', 'sect_code'] },
{ key: 'area_type', label: 'Urban or rural', help: 'urban / rural (or 1 / 2)', required: true, synonyms: ['area_type', 'urban_rural', 'ur', 'residence'] },
{ key: 'sex', label: 'Sex', help: 'male / female (or 1 / 2)', required: true, synonyms: ['sex', 'gender'] },
{ key: 'age', label: 'Age', help: 'Whole years, 0 to 122', required: true, synonyms: ['age', 'age_years', 'p_age'] },
{ key: 'relationship_to_head', label: 'Relationship to head', help: 'e.g. head, spouse, child', required: true, synonyms: ['relationship_to_head', 'rel_head', 'relationship'] },
{ key: 'marital_status', label: 'Marital status', help: 'Optional', required: false, synonyms: ['marital_status', 'marital', 'mstatus'] }];


export const AGGREGATE_FIELDS: FieldSpec[] = [
{ key: 'sub_region_id', label: 'Region code', help: 'District (2 digits) or sector (4 digits)', required: true, synonyms: ['sub_region_id', 'region_id', 'region_code', 'sector_code', 'sect'] },
{ key: 'age_band', label: 'Age band', help: 'e.g. 0-4, 5-17, 65+', required: true, synonyms: ['age_band', 'age_group', 'ageband'] },
{ key: 'population_count', label: 'Population count', help: 'Number of people', required: true, synonyms: ['population_count', 'population', 'count', 'pop'] },
{ key: 'density_per_km2', label: 'Density per km²', help: 'Optional', required: false, synonyms: ['density_per_km2', 'density', 'pop_density'] },
{ key: 'urban_rural', label: 'Urban or rural', help: 'urban / rural (or 1 / 2)', required: true, synonyms: ['urban_rural', 'area_type', 'ur'] }];


export const PROVINCES: RegionOption[] = [
{ code: '1', name: 'City of Kigali' },
{ code: '2', name: 'Southern Province' },
{ code: '3', name: 'Western Province' },
{ code: '4', name: 'Northern Province' },
{ code: '5', name: 'Eastern Province' }];


/** NISR-style district codes (province digit first), matching the boundary file. */
export const DISTRICTS: Record<string, RegionOption[]> = {
  '1': [
  { code: '11', name: 'Nyarugenge' },
  { code: '12', name: 'Gasabo' },
  { code: '13', name: 'Kicukiro' }],

  '2': [
  { code: '21', name: 'Nyanza' },
  { code: '22', name: 'Gisagara' },
  { code: '23', name: 'Nyaruguru' },
  { code: '24', name: 'Huye' },
  { code: '25', name: 'Nyamagabe' },
  { code: '26', name: 'Ruhango' },
  { code: '27', name: 'Muhanga' },
  { code: '28', name: 'Kamonyi' }],

  '3': [
  { code: '31', name: 'Karongi' },
  { code: '32', name: 'Rutsiro' },
  { code: '33', name: 'Rubavu' },
  { code: '34', name: 'Nyabihu' },
  { code: '35', name: 'Ngororero' },
  { code: '36', name: 'Rusizi' },
  { code: '37', name: 'Nyamasheke' }],

  '4': [
  { code: '41', name: 'Rulindo' },
  { code: '42', name: 'Gakenke' },
  { code: '43', name: 'Musanze' },
  { code: '44', name: 'Burera' },
  { code: '45', name: 'Gicumbi' }],

  '5': [
  { code: '51', name: 'Rwamagana' },
  { code: '52', name: 'Nyagatare' },
  { code: '53', name: 'Gatsibo' },
  { code: '54', name: 'Kayonza' },
  { code: '55', name: 'Kirehe' },
  { code: '56', name: 'Ngoma' },
  { code: '57', name: 'Bugesera' }]

};

// Sector lists are loaded only for the districts the prototype models in detail. Sector numbering is
// alphabetical within the district and has not been checked against NISR codes.
export const SECTORS: Record<string, RegionOption[]> = {
  '11': ['Gitega', 'Kanyinya', 'Kigali', 'Kimisagara', 'Mageragere', 'Muhima', 'Nyakabanda', 'Nyamirambo', 'Nyarugenge', 'Rwezamenyo'].map((n, i) => ({ code: `11${String(i + 1).padStart(2, '0')}`, name: n })),
  '12': ['Bumbogo', 'Gatsata', 'Gikomero', 'Gisozi', 'Jabana', 'Jali', 'Kacyiru', 'Kimihurura', 'Kimironko', 'Kinyinya', 'Ndera', 'Nduba', 'Remera', 'Rusororo', 'Rutunga'].map((n, i) => ({ code: `12${String(i + 1).padStart(2, '0')}`, name: n })),
  '13': ['Gahanga', 'Gatenga', 'Gikondo', 'Kagarama', 'Kanombe', 'Kicukiro', 'Kigarama', 'Masaka', 'Niboye', 'Nyarugunga'].map((n, i) => ({ code: `13${String(i + 1).padStart(2, '0')}`, name: n })),
  '33': ['Bugeshi', 'Busasamana', 'Cyanzarwe', 'Gisenyi', 'Kanama', 'Kanzenze', 'Mudende', 'Nyakiriba', 'Nyamyumba', 'Nyundo', 'Rubavu', 'Rugerero'].map((n, i) => ({ code: `33${String(i + 1).padStart(2, '0')}`, name: n }))
};

export const SOURCES = ['NISR Census', 'NISR Survey (DHS / EICV)', 'Ministry of Health', 'District records', 'Other'];

/** Illustrative rows for the downloadable template (invented, not census records). */
export const TEMPLATE_HEADERS = MICRODATA_FIELDS.map((f) => f.key);
export const TEMPLATE_ROWS = [
['1209000141', '1', '1', '12', '1209', 'urban', 'female', '38', 'head', 'married'],
['1209000141', '2', '1', '12', '1209', 'urban', 'male', '41', 'spouse', 'married'],
['5701001203', '1', '5', '57', '5703', 'rural', 'female', '9', 'child', '']];


/** An illustrative district-totals file shipped with the app (public/samples), for trying the import. */
export const SAMPLE_FILE_URL = '/samples/episim_illustrative_district_counts.csv';

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
