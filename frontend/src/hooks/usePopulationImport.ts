import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { checkImport, populationKeys, useDatasets } from '../api/population';
import { useImportJob } from '../context/ImportJobContext';
import {
  DetectedFormat,
  ExistingDataset,
  ImportDetails,
  ImportFormat,
  Mapping,
  UploadedFile,
  ValidationSummary } from
'../types/populationImport';
import {
  DISTRICTS,
  FULL_READ_LIMIT_BYTES,
  MAX_FILE_BYTES,
  PROVINCES,
  SAMPLE_FILE_URL,
  SECTORS,
  autoMap,
  detectFormat,
  fieldsFor,
  formatBytes,
  parseCsvLine } from
'../utils/populationImport';

export const STEPS = ['Upload', 'Check', 'Details', 'Review & Import'] as const;

const PREVIEW_ROWS = 20;

const detailsFor = (file: UploadedFile): ImportDetails => ({
  name: file.isSample ? 'Illustrative district counts (sample)' : file.name.replace(/\.csv$/i, '').replace(/[_-]+/g, ' '),
  provinceCode: '',
  districtCode: '',
  sectorCode: '',
  year: file.isSample ? '2022' : '',
  source: file.isSample ? 'Other' : 'NISR Census'
});

/** Reads the header and first rows in the browser. The server checks every row. */
async function readCsv(file: File, isSample = false): Promise<UploadedFile> {
  const fail = (title: string, detail: string) => Promise.reject({ title, detail });
  if (!/\.csv$/i.test(file.name))
  return fail(`We couldn’t read “${file.name}”`, 'Only CSV files can be imported. If this is an Excel workbook, save it as CSV (comma delimited) first.');
  if (file.size === 0) return fail(`“${file.name}” is empty`, 'The file has no content. Check you exported the right file and try again.');
  if (file.size > MAX_FILE_BYTES)
  return fail(
    `“${file.name}” is too large`,
    `The file is ${formatBytes(file.size)}. This demo accepts files up to ${formatBytes(MAX_FILE_BYTES)}. Split it by province and import each part.`
  );

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
  const sampleRows = data.slice(0, PREVIEW_ROWS).map((l) => {
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
    isSample
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
  const { job, start, reset: resetJob } = useImportJob();
  const datasets = useDatasets();

  const [step, setStep] = useState<number>(job.status !== 'idle' ? 3 : 0);
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [reading, setReading] = useState(false);
  const [uploadError, setUploadError] = useState<{title: string;detail: string;} | null>(null);
  const [detected, setDetected] = useState<DetectedFormat>('unknown');
  const [format, setFormat] = useState<ImportFormat | null>(null);
  const [mapping, setMapping] = useState<Mapping>({});
  const [details, setDetails] = useState<ImportDetails>(() => ({ name: '', provinceCode: '', districtCode: '', sectorCode: '', year: '', source: 'NISR Census' }));
  const [triedDetails, setTriedDetails] = useState(false);

  const accept = (f: UploadedFile, raw: File) => {
    const d = detectFormat(f.columns);
    const fmt = d === 'unknown' ? null : d;
    setFile(f);
    setRawFile(raw);
    setDetected(d);
    setFormat(fmt);
    setMapping(fmt ? autoMap(fmt, f.columns) : {});
    setDetails(detailsFor(f));
    setUploadError(null);
  };

  const upload = async (f: File, isSample = false) => {
    setReading(true);
    setUploadError(null);
    try {
      accept(await readCsv(f, isSample), f);
    } catch (e) {
      setFile(null);
      setRawFile(null);
      setUploadError(e as {title: string;detail: string;});
    } finally {
      setReading(false);
    }
  };

  const loadSample = async () => {
    setReading(true);
    try {
      const res = await fetch(SAMPLE_FILE_URL);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      await upload(new File([blob], SAMPLE_FILE_URL.split('/').pop()!, { type: 'text/csv' }), true);
    } catch {
      setUploadError({ title: 'The sample file couldn’t be loaded', detail: 'Try again, or upload a CSV of your own.' });
      setReading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setRawFile(null);
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

  // Every row is checked on the server with the same rules the import uses.
  const mappingKey = JSON.stringify(mapping);
  const check = useQuery({
    queryKey: [...populationKeys.check, file?.name, file?.sizeBytes, format, mappingKey],
    queryFn: () => checkImport(rawFile!, format!, mapping),
    enabled: !!rawFile && !!format && !missingRequired.length && !duplicateColumns.length,
    staleTime: Infinity
  });
  const validation: ValidationSummary | null = useMemo(() => {
    if (!file || !format || missingRequired.length || !check.data?.summary) return null;
    return check.data.summary;
  }, [file, format, missingRequired.length, check.data]);
  const checkError = check.error instanceof Error ? check.error.message : check.data?.error ?? null;

  const existing: ExistingDataset | undefined = useMemo(() => {
    const match = datasets.data?.find((d) => d.name.trim().toLowerCase() === details.name.trim().toLowerCase());
    return match && { id: match.id, name: match.name, latestVersion: match.version, scenariosUsing: match.scenariosUsing };
  }, [datasets.data, details.name]);
  const version = existing ? existing.latestVersion + 1 : 1;

  const yearNum = Number(details.year);
  const thisYear = new Date().getFullYear();
  const detailErrors = {
    name: !details.name.trim() ? 'Give the dataset a name.' : '',
    year: !/^\d{4}$/.test(details.year) || yearNum < 1978 || yearNum > thisYear ? `Enter a year between 1978 and ${thisYear}.` : '',
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

  const records = validation ? validation.validRows : 0;

  const startImport = () => {
    if (!file || !rawFile || !format) return;
    const label = regionLabel(details);
    start(
      {
        datasetName: existing?.name ?? details.name.trim(),
        fileName: file.name,
        fileSize: file.sizeBytes,
        format,
        records,
        skippedRows: (validation?.totalRows ?? file.rows) - records,
        regionLabel: label,
        year: details.year,
        source: details.source,
        version
      },
      {
        file: rawFile,
        format,
        mapping,
        datasetId: existing?.id ?? null,
        name: details.name.trim(),
        coverage: label,
        source: details.source,
        year: details.year
      }
    );
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
    upload: (f: File) => upload(f),
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
    checking: check.isFetching,
    checkError,
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
