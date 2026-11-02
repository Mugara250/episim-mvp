import { useMemo, useState } from 'react';
import { useScreenInit } from '../useScreenInit.js';
import { useImportJob } from '../context/ImportJobContext';
import {
  DISTRICTS,
  EXISTING_DATASETS,
  FULL_READ_LIMIT_BYTES,
  MAX_FILE_BYTES,
  PROVINCES,
  SAMPLE_CHECK,
  SAMPLE_FILE,
  SAMPLE_ROWS,
  SECTORS } from
'../data/populationImport';
import {
  DetectedFormat,
  ImportDetails,
  ImportFormat,
  Mapping,
  UploadedFile,
  ValidationSummary } from
'../types/populationImport';
import { autoMap, checkRows, detectFormat, fieldsFor, formatBytes, hasError, hasWarningOnly, parseCsvLine } from '../utils/populationImport';

export const STEPS = ['Upload', 'Check', 'Details', 'Review & Import'] as const;

const SAMPLE_UPLOAD: UploadedFile = {
  name: SAMPLE_FILE.name,
  sizeBytes: SAMPLE_FILE.sizeBytes,
  rows: SAMPLE_FILE.rows,
  rowsEstimated: false,
  columns: SAMPLE_FILE.columns,
  sampleRows: SAMPLE_ROWS,
  fullyRead: false,
  isSample: true
};

const UNREADABLE_DEMO = {
  title: 'We couldn’t read “district_totals_2022.xlsx”',
  detail: 'This looks like an Excel workbook. Open it in Excel and choose File › Save As › CSV (comma delimited), then upload the CSV.'
};

const detailsFor = (file: UploadedFile): ImportDetails => ({
  name: file.isSample ? 'RPHC5 2022 (10% sample)' : file.name.replace(/\.csv$/i, '').replace(/[_-]+/g, ' '),
  provinceCode: '',
  districtCode: '',
  sectorCode: '',
  year: file.isSample ? '2022' : '',
  source: 'NISR Census'
});

async function readCsv(file: File): Promise<UploadedFile> {
  const fail = (title: string, detail: string) => Promise.reject({ title, detail });
  if (!/\.csv$/i.test(file.name))
  return fail(`We couldn’t read “${file.name}”`, 'Only CSV files can be imported. If this is an Excel workbook, save it as CSV (comma delimited) first.');
  if (file.size === 0) return fail(`“${file.name}” is empty`, 'The file has no content. Check you exported the right file and try again.');
  if (file.size > MAX_FILE_BYTES)
  return fail(`“${file.name}” is too large`, `The file is ${formatBytes(file.size)}. The limit is 2 GB. Split it by province and import each part.`);

  const fullyRead = file.size <= FULL_READ_LIMIT_BYTES;
  const text = fullyRead ? await file.text() : await file.slice(0, 256 * 1024).text();
  if (text.includes('\u0000'))
  return fail(`We couldn’t read “${file.name}”`, 'The file contains binary data, so it may not be a real CSV. Re-export it as CSV (UTF-8) and try again.');

  const lines = text.split(/\r?\n/);
  if (!fullyRead) lines.pop(); // last line is cut off
  const nonEmpty = lines.filter((l) => l.trim());
  const header = parseCsvLine(nonEmpty[0] ?? '');
  if (header.length < 2 || nonEmpty.length < 2)
  return fail(`We couldn’t find any columns in “${file.name}”`, 'The first row should hold column names separated by commas, followed by at least one row of data.');

  const data = nonEmpty.slice(1);
  const sampleRows = data.map((l) => {
    const v = parseCsvLine(l);
    return Object.fromEntries(header.map((h, i) => [h, v[i] ?? '']));
  });
  const avgLine = text.length / Math.max(1, nonEmpty.length);
  return {
    name: file.name,
    sizeBytes: file.size,
    rows: fullyRead ? data.length : Math.round((file.size - nonEmpty[0].length) / avgLine),
    rowsEstimated: !fullyRead,
    columns: header,
    sampleRows,
    fullyRead,
    isSample: false
  };
}

function regionLabel(d: ImportDetails) {
  if (!d.provinceCode) return 'All of Rwanda';
  const prov = PROVINCES.find((p) => p.code === d.provinceCode);
  const dist = DISTRICTS[d.provinceCode]?.find((x) => x.code === d.districtCode);
  const sect = SECTORS[d.districtCode]?.find((x) => x.code === d.sectorCode);
  return [prov && `${prov.name} (${prov.code})`, dist && `${dist.name} (${dist.code})`, sect && `${sect.name} (${sect.code})`].
  filter(Boolean).
  join(' › ');
}

export function usePopulationImport() {
  const init = useScreenInit() as {importStep?: number;importFile?: string;};
  const { job, start, reset: resetJob } = useImportJob();

  const seededFile = init.importFile === 'sample' || job.status !== 'idle' ? SAMPLE_UPLOAD : null;
  const [step, setStep] = useState<number>(job.status !== 'idle' ? 3 : init.importStep ?? 0);
  const [file, setFile] = useState<UploadedFile | null>(seededFile);
  const [reading, setReading] = useState(false);
  const [uploadError, setUploadError] = useState<{title: string;detail: string;} | null>(
    init.importFile === 'error' ? UNREADABLE_DEMO : null
  );
  const [detected, setDetected] = useState<DetectedFormat>(seededFile ? 'microdata' : 'unknown');
  const [format, setFormat] = useState<ImportFormat | null>(seededFile ? 'microdata' : null);
  const [mapping, setMapping] = useState<Mapping>(seededFile ? autoMap('microdata', seededFile.columns) : {});
  const [details, setDetails] = useState<ImportDetails>(seededFile ? detailsFor(seededFile) : detailsFor(SAMPLE_UPLOAD));
  const [triedDetails, setTriedDetails] = useState(false);

  const accept = (f: UploadedFile) => {
    const d = detectFormat(f.columns);
    const fmt = d === 'unknown' ? null : d;
    setFile(f);
    setDetected(d);
    setFormat(fmt);
    setMapping(fmt ? autoMap(fmt, f.columns) : {});
    setDetails(detailsFor(f));
    setUploadError(null);
  };

  const upload = async (f: File) => {
    setReading(true);
    setUploadError(null);
    try {
      accept(await readCsv(f));
    } catch (e) {
      setFile(null);
      setUploadError(e as {title: string;detail: string;});
    } finally {
      setReading(false);
    }
  };

  const loadSample = () => {
    setReading(true);
    window.setTimeout(() => {
      accept(SAMPLE_UPLOAD);
      setReading(false);
    }, 600);
  };

  const removeFile = () => {
    setFile(null);
    setUploadError(null);
    setFormat(null);
    setMapping({});
    setDetected('unknown');
  };

  const chooseFormat = (f: ImportFormat) => {
    setFormat(f);
    if (file) setMapping(autoMap(f, file.columns));
  };

  const fields = format ? fieldsFor(format) : [];
  const missingRequired = fields.filter((f) => f.required && !mapping[f.key]);
  const usedColumns = Object.values(mapping).filter(Boolean);
  const duplicateColumns = usedColumns.filter((c, i) => usedColumns.indexOf(c) !== i);

  const validation: ValidationSummary | null = useMemo(() => {
    if (!file || !format || missingRequired.length) return null;
    const checked = checkRows(file.sampleRows, format, mapping);
    const flagged = checked.filter((r) => r.issues.length);
    const preview = checked.slice(0, 8);
    const isDefaultSample =
    file.isSample && format === 'microdata' && JSON.stringify(mapping) === JSON.stringify(autoMap('microdata', file.columns));
    if (isDefaultSample) {
      return {
        totalRows: file.rows,
        checkedRows: file.rows,
        validRows: file.rows - SAMPLE_CHECK.errorRows,
        errorRows: SAMPLE_CHECK.errorRows,
        warningRows: SAMPLE_CHECK.warningRows,
        breakdown: SAMPLE_CHECK.breakdown,
        partial: false,
        preview,
        flagged
      };
    }
    const errorRows = checked.filter(hasError).length;
    const counts: Record<string, number> = {};
    checked.forEach((r) => {
      const kinds = new Set(r.issues.filter((i) => i.level === 'error').map((i) => i.kind));
      kinds.forEach((k) => counts[k] = (counts[k] ?? 0) + 1);
    });
    return {
      totalRows: file.rows,
      checkedRows: checked.length,
      validRows: checked.length - errorRows,
      errorRows,
      warningRows: checked.filter(hasWarningOnly).length,
      breakdown: Object.entries(counts).
      map(([kind, count]) => ({ kind, count })).
      sort((a, b) => b.count - a.count),
      partial: !file.fullyRead,
      preview,
      flagged
    };
  }, [file, format, JSON.stringify(mapping), missingRequired.length]);

  const existing = EXISTING_DATASETS.find((d) => d.name.trim().toLowerCase() === details.name.trim().toLowerCase());
  const version = existing ? existing.latestVersion + 1 : 1;

  const yearNum = Number(details.year);
  const detailErrors = {
    name: !details.name.trim() ? 'Give the dataset a name.' : '',
    year: !/^\d{4}$/.test(details.year) || yearNum < 1978 || yearNum > 2026 ? 'Enter a year between 1978 and 2026.' : '',
    source: !details.source.trim() ? 'Choose where the data comes from.' : ''
  };
  const detailsValid = !detailErrors.name && !detailErrors.year && !detailErrors.source;

  const canContinue = [
  !!file && !reading,
  !!format && !missingRequired.length && !duplicateColumns.length && !!validation && validation.validRows > 0,
  detailsValid,
  false][
  step];

  const next = () => {
    if (step === 2 && !detailsValid) {
      setTriedDetails(true);
      return;
    }
    if (canContinue) setStep((s) => Math.min(3, s + 1));
  };
  const back = () => setStep((s) => Math.max(0, s - 1));

  const records = validation ?
  validation.partial ?
  Math.round(file!.rows * (validation.validRows / Math.max(1, validation.checkedRows))) :
  validation.validRows :
  0;

  const startImport = () => {
    if (!file || !format) return;
    start({
      datasetName: details.name.trim(),
      fileName: file.name,
      fileSize: file.sizeBytes,
      format,
      records,
      skippedRows: file.rows - records,
      regionLabel: regionLabel(details),
      year: details.year,
      source: details.source,
      version
    });
  };

  const startOver = () => {
    resetJob();
    removeFile();
    setTriedDetails(false);
    setStep(0);
  };

  return {
    step,
    setStep,
    file,
    reading,
    uploadError,
    upload,
    loadSample,
    removeFile,
    detected,
    format,
    chooseFormat,
    fields,
    mapping,
    setMapping,
    missingRequired,
    duplicateColumns,
    validation,
    details,
    setDetails,
    detailErrors: triedDetails ? detailErrors : { name: '', year: '', source: '' },
    existing,
    version,
    regionLabel: regionLabel(details),
    records,
    canContinue,
    next,
    back,
    startImport,
    startOver,
    job
  };
}

export type PopulationImportState = ReturnType<typeof usePopulationImport>;