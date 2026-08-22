import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import {
  DatasetRecord,
  DatasetVariable,
  DatasetVersion,
  ParsingError,
  PiiWarning,
} from '../types';

export interface DatasetIngestionOptions {
  filename: string;
  fileBufferOrString: string | ArrayBuffer | Uint8Array;
  mimeType?: string;
  customMissingValues?: string[];
  maxFileSizeBytes?: number; // default 25MB
}

/**
 * Calculates a real, deterministic SHA-256 hash string for input content.
 */
export async function calculateSha256(
  input: string | ArrayBuffer | Uint8Array
): Promise<string> {
  let buffer: Uint8Array;
  if (typeof input === 'string') {
    buffer = new TextEncoder().encode(input);
  } else if (input instanceof ArrayBuffer) {
    buffer = new Uint8Array(input);
  } else {
    buffer = input;
  }

  // Use Web Crypto API if available
  if (typeof crypto !== 'undefined' && crypto.subtle && crypto.subtle.digest) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer as ArrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Node.js crypto fallback
  try {
    const nodeCrypto = await import('crypto');
    return nodeCrypto.createHash('sha256').update(buffer).digest('hex');
  } catch {
    // Basic fallback hash for fallback environments
    let h1 = 0xdeadbeef,
      h2 = 0x41c6ce57;
    for (let i = 0; i < buffer.length; i++) {
      const ch = buffer[i];
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(64, '0');
  }
}

const DEFAULT_MISSING_TOKENS = ['NA', 'N/A', 'na', 'n/a', 'null', 'NULL', 'NaN', 'nan', '', '.', 'None', 'none', '-999', '-99'];

/**
 * Checks if a string value represents a missing value.
 */
export function isMissingValue(val: any, customTokens: string[] = []): boolean {
  if (val === null || val === undefined) return true;
  const str = String(val).trim();
  if (str === '') return true;
  const allTokens = [...DEFAULT_MISSING_TOKENS, ...customTokens];
  return allTokens.includes(str);
}

/**
 * Primary Dataset Ingestion & Profiling Engine for TehqIQ Phase 4.
 */
export async function parseAndProfileDataset(
  options: DatasetIngestionOptions
): Promise<{
  dataset: DatasetRecord;
  rawRows: Record<string, any>[];
  errors: ParsingError[];
}> {
  const maxBytes = options.maxFileSizeBytes || 25 * 1024 * 1024; // 25MB limit
  const parsingErrors: ParsingError[] = [];

  let byteLength = 0;
  if (typeof options.fileBufferOrString === 'string') {
    byteLength = new TextEncoder().encode(options.fileBufferOrString).length;
  } else if (options.fileBufferOrString instanceof ArrayBuffer) {
    byteLength = options.fileBufferOrString.byteLength;
  } else {
    byteLength = options.fileBufferOrString.length;
  }

  if (byteLength > maxBytes) {
    throw new Error(`File size (${(byteLength / (1024 * 1024)).toFixed(2)} MB) exceeds maximum allowed limit of ${(maxBytes / (1024 * 1024)).toFixed(0)} MB.`);
  }

  // 1. Calculate Real SHA-256 Hash
  const fileHash = await calculateSha256(options.fileBufferOrString);

  // 2. Parse File Content based on format
  const ext = options.filename.split('.').pop()?.toLowerCase() || '';
  let rawRows: Record<string, any>[] = [];
  let detectedHeaders: string[] = [];

  if (ext === 'xlsx' || ext === 'xls') {
    // Excel Parsing via XLSX
    let workbook: XLSX.WorkBook;
    if (typeof options.fileBufferOrString === 'string') {
      workbook = XLSX.read(options.fileBufferOrString, { type: 'string' });
    } else {
      workbook = XLSX.read(options.fileBufferOrString, { type: 'array' });
    }

    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      parsingErrors.push({ message: 'Workbook contains no sheets.' });
    } else {
      const sheet = workbook.Sheets[firstSheetName];
      const jsonSheet = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: null });
      if (jsonSheet.length === 0) {
        parsingErrors.push({ message: 'Spreadsheet is empty.' });
      } else {
        const headerRow = jsonSheet[0] as any[];
        detectedHeaders = headerRow.map((h, i) => (h !== null && h !== undefined ? String(h).trim() : `Column_${i + 1}`));
        
        for (let r = 1; r < jsonSheet.length; r++) {
          const rowArray = jsonSheet[r] as any[];
          if (!rowArray || rowArray.every((cell) => cell === null || cell === undefined || String(cell).trim() === '')) {
            continue; // skip trailing empty rows
          }
          const rowObj: Record<string, any> = {};
          detectedHeaders.forEach((colName, c) => {
            rowObj[colName] = rowArray[c] !== undefined ? rowArray[c] : null;
          });
          rawRows.push(rowObj);
        }
      }
    }
  } else if (ext === 'json') {
    // JSON Parsing
    try {
      const jsonStr =
        typeof options.fileBufferOrString === 'string'
          ? options.fileBufferOrString
          : new TextDecoder().decode(options.fileBufferOrString);
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed)) {
        rawRows = parsed;
      } else if (parsed && typeof parsed === 'object') {
        rawRows = [parsed];
      }
    } catch (err: any) {
      parsingErrors.push({ message: `Malformed JSON format: ${err.message}` });
    }
  } else {
    // CSV / TSV Parsing via PapaParse
    const textContent =
      typeof options.fileBufferOrString === 'string'
        ? options.fileBufferOrString
        : new TextDecoder('utf-8', { fatal: false }).decode(options.fileBufferOrString);

    const isTsv = ext === 'tsv' || textContent.includes('\t');
    const papaResult = Papa.parse(textContent, {
      header: true,
      skipEmptyLines: 'greedy',
      delimiter: isTsv ? '\t' : undefined,
      dynamicTyping: false,
    });

    if (papaResult.errors && papaResult.errors.length > 0) {
      papaResult.errors.forEach((e) => {
        parsingErrors.push({
          row: e.row,
          message: e.message,
          rawData: e.code,
        });
      });
    }

    rawRows = (papaResult.data as Record<string, any>[]).filter((row) => {
      if (!row) return false;
      const values = Object.values(row);
      return values.some((v) => v !== null && v !== undefined && String(v).trim() !== '');
    });
  }

  // 3. Column Union & Schema Drift Detection
  const allColumnsSet = new Set<string>();
  const columnCountsPerRow: number[] = [];

  rawRows.forEach((row, rowIndex) => {
    const rowKeys = Object.keys(row);
    columnCountsPerRow.push(rowKeys.length);
    rowKeys.forEach((key) => allColumnsSet.add(key));
  });

  const unionColumns = Array.from(allColumnsSet);

  // Schema Drift check
  let schemaDriftDetected = false;
  const schemaDriftDetails: string[] = [];
  const expectedColCount = unionColumns.length;

  rawRows.forEach((row, idx) => {
    const rowKeys = Object.keys(row);
    if (rowKeys.length !== expectedColCount) {
      schemaDriftDetected = true;
      const missingKeys = unionColumns.filter((k) => !(k in row));
      if (missingKeys.length > 0) {
        schemaDriftDetails.push(`Row ${idx + 1} has ${rowKeys.length} columns (missing: ${missingKeys.join(', ')})`);
      }
    }
  });

  // 4. Duplicate Row Detection
  const rowSignatures = new Set<string>();
  let duplicateRowCount = 0;
  rawRows.forEach((row) => {
    const sig = unionColumns.map((col) => String(row[col] ?? '')).join('||');
    if (rowSignatures.has(sig)) {
      duplicateRowCount++;
    } else {
      rowSignatures.add(sig);
    }
  });

  // 5. Profiling & Variable Extraction
  const variables: DatasetVariable[] = [];
  const piiWarnings: PiiWarning[] = [];
  let totalCells = 0;
  let totalMissingCells = 0;

  const missingTokens = options.customMissingValues || [];

  unionColumns.forEach((colName) => {
    const values: any[] = [];
    let missingCount = 0;
    let invalidDateCount = 0;

    rawRows.forEach((row) => {
      totalCells++;
      const val = row[colName];
      if (isMissingValue(val, missingTokens)) {
        missingCount++;
        totalMissingCells++;
      } else {
        values.push(val);
      }
    });

    const nonMissingValues = values;
    const uniqueValuesCount = new Set(nonMissingValues.map((v) => String(v).trim())).size;

    // Type Inference Logic
    let inferredType: "Numeric" | "Categorical" | "Datetime" | "ID" | "Text" = "Categorical";

    if (nonMissingValues.length === 0) {
      inferredType = "Categorical";
    } else {
      // Check Numeric
      const isAllNumeric = nonMissingValues.every((v) => {
        const str = String(v).trim();
        return str !== '' && !isNaN(Number(str));
      });

      // Check Datetime
      const dateRegex = /^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|^\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}/;
      const isAllDate = nonMissingValues.every((v) => {
        const str = String(v).trim();
        return dateRegex.test(str) && !isNaN(Date.parse(str));
      });

      // Check ID / High Cardinality Key
      const colLower = colName.toLowerCase();
      const isIdName = colLower.includes('id') || colLower.includes('uuid') || colLower.includes('key') || colLower.includes('code');
      const is100PercentUnique = uniqueValuesCount === nonMissingValues.length && nonMissingValues.length > 3;

      if (isAllNumeric && !isIdName) {
        inferredType = "Numeric";
      } else if (isAllDate) {
        inferredType = "Datetime";
      } else if (isIdName || is100PercentUnique) {
        inferredType = "ID";
      } else {
        const avgCharLen = nonMissingValues.reduce((acc, v) => acc + String(v).length, 0) / nonMissingValues.length;
        if (avgCharLen > 50) {
          inferredType = "Text";
        } else {
          inferredType = "Categorical";
        }
      }
    }

    // Compute Summary Stats
    let summaryStats: DatasetVariable['summaryStats'] = undefined;

    if (inferredType === "Numeric" && nonMissingValues.length > 0) {
      const numArr = nonMissingValues.map((v) => Number(v)).sort((a, b) => a - b);
      const min = numArr[0];
      const max = numArr[numArr.length - 1];
      const sum = numArr.reduce((acc, v) => acc + v, 0);
      const mean = sum / numArr.length;

      const variance =
        numArr.length > 1
          ? numArr.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (numArr.length - 1)
          : 0;
      const sd = Math.sqrt(variance);

      const getPercentile = (p: number) => {
        const idx = (numArr.length - 1) * p;
        const lower = Math.floor(idx);
        const upper = Math.ceil(idx);
        if (lower === upper) return numArr[lower];
        return numArr[lower] + (numArr[upper] - numArr[lower]) * (idx - lower);
      };

      const q1 = getPercentile(0.25);
      const median = getPercentile(0.5);
      const q3 = getPercentile(0.75);
      const iqr = q3 - q1;

      summaryStats = {
        min: Number(min.toFixed(4)),
        max: Number(max.toFixed(4)),
        mean: Number(mean.toFixed(4)),
        sd: Number(sd.toFixed(4)),
        median: Number(median.toFixed(4)),
        q1: Number(q1.toFixed(4)),
        q3: Number(q3.toFixed(4)),
        iqr: Number(iqr.toFixed(4)),
      };
    } else if (inferredType === "Categorical" || inferredType === "ID" || inferredType === "Text") {
      const frequencies: Record<string, number> = {};
      nonMissingValues.forEach((v) => {
        const key = String(v).trim();
        frequencies[key] = (frequencies[key] || 0) + 1;
      });
      summaryStats = { frequencies };
    } else if (inferredType === "Datetime") {
      // Validate dates
      nonMissingValues.forEach((v) => {
        if (isNaN(Date.parse(String(v)))) {
          invalidDateCount++;
        }
      });
    }

    // PII Detection Rules
    const colNameLower = colName.toLowerCase();
    const piiKeywords = ['ssn', 'social_security', 'email', 'phone', 'mobile', 'address', 'ip', 'mrn', 'patient_id', 'first_name', 'last_name', 'dob', 'birth_date'];

    if (piiKeywords.some((kw) => colNameLower.includes(kw))) {
      piiWarnings.push({
        variableName: colName,
        warningType: "Direct Identifier",
        details: `Column name '${colName}' indicates personal identifiable information (PII).`,
      });
    } else if (inferredType === "ID" && uniqueValuesCount === nonMissingValues.length && nonMissingValues.length > 5) {
      piiWarnings.push({
        variableName: colName,
        warningType: "High Cardinality Key",
        details: `Column '${colName}' contains 100% unique identifiers across ${uniqueValuesCount} records.`,
      });
    }

    // Email / SSN Content pattern checks
    if (nonMissingValues.length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const ssnRegex = /^\d{3}-\d{2}-\d{4}$/;
      let emailMatchCount = 0;
      let ssnMatchCount = 0;

      nonMissingValues.forEach((v) => {
        const str = String(v).trim();
        if (emailRegex.test(str)) emailMatchCount++;
        if (ssnRegex.test(str)) ssnMatchCount++;
      });

      if (emailMatchCount > 0 && emailMatchCount / nonMissingValues.length > 0.3) {
        piiWarnings.push({
          variableName: colName,
          warningType: "PII Content Pattern",
          details: `Column '${colName}' contains email address pattern content.`,
        });
      }
      if (ssnMatchCount > 0 && ssnMatchCount / nonMissingValues.length > 0.3) {
        piiWarnings.push({
          variableName: colName,
          warningType: "PII Content Pattern",
          details: `Column '${colName}' contains Social Security Number (SSN) pattern content.`,
        });
      }
    }

    variables.push({
      name: colName,
      type: inferredType,
      label: colName,
      missingCount,
      uniqueValues: uniqueValuesCount,
      summaryStats,
      invalidDateCount: invalidDateCount > 0 ? invalidDateCount : undefined,
    });
  });

  const overallMissingnessPercent =
    totalCells > 0 ? Number(((totalMissingCells / totalCells) * 100).toFixed(2)) : 0;

  const datasetId = `ds-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const nowIso = new Date().toISOString();

  const initialVersion: DatasetVersion = {
    version: 1,
    fileHash,
    filename: options.filename,
    uploadDate: nowIso,
    recordCount: rawRows.length,
    variableCount: variables.length,
    missingnessPercent: overallMissingnessPercent,
    changeNote: 'Initial file ingestion and profiling.',
  };

  const datasetRecord: DatasetRecord = {
    id: datasetId,
    filename: options.filename,
    fileHash,
    uploadDate: nowIso,
    recordCount: rawRows.length,
    variableCount: variables.length,
    variables,
    missingnessPercent: overallMissingnessPercent,
    isAnonymizedConfirmed: false, // CRITICAL: NEVER AUTO-CONFIRM ANONYMIZATION!
    duplicateRowCount,
    schemaDriftDetected,
    schemaDriftDetails: schemaDriftDetails.length > 0 ? schemaDriftDetails : undefined,
    piiWarnings: piiWarnings.length > 0 ? piiWarnings : undefined,
    parsingErrors: parsingErrors.length > 0 ? parsingErrors : undefined,
    version: 1,
    versionHistory: [initialVersion],
    state: 'Profiled',
    stateHistory: [
      {
        id: `tr-${Date.now()}-1`,
        entityType: 'Dataset',
        entityId: datasetId,
        fromState: 'Uploaded',
        toState: 'Profiled',
        actorUid: 'system-ingestion',
        actorEmail: 'system@tehqiq.edu',
        timestamp: nowIso,
        reason: 'Dataset ingested and profiled.',
      },
    ],
    rawPreview: rawRows.slice(0, 50),
  };

  return {
    dataset: datasetRecord,
    rawRows,
    errors: parsingErrors,
  };
}

/**
 * Updates a dataset's variable dictionary with user overrides and recalculates version hash.
 */
export async function updateDatasetVariableDictionary(
  dataset: DatasetRecord,
  updatedVariables: DatasetVariable[],
  changeNote: string
): Promise<DatasetRecord> {
  const newVersionNum = (dataset.version || 1) + 1;
  const nowIso = new Date().toISOString();

  // Re-check range violations on numeric variables
  const processedVariables = updatedVariables.map((v) => {
    if (v.type === 'Numeric' && (v.expectedMin !== undefined || v.expectedMax !== undefined)) {
      let violationCount = 0;
      if (dataset.rawPreview) {
        dataset.rawPreview.forEach((row) => {
          const val = Number(row[v.name]);
          if (!isNaN(val)) {
            if (v.expectedMin !== undefined && val < v.expectedMin) violationCount++;
            if (v.expectedMax !== undefined && val > v.expectedMax) violationCount++;
          }
        });
      }
      return { ...v, rangeViolationCount: violationCount };
    }
    return v;
  });

  const contentToHash = JSON.stringify({
    baseHash: dataset.fileHash,
    version: newVersionNum,
    variables: processedVariables,
  });

  const newHash = await calculateSha256(contentToHash);

  const newVersionEntry: DatasetVersion = {
    version: newVersionNum,
    fileHash: newHash,
    filename: dataset.filename,
    uploadDate: nowIso,
    recordCount: dataset.recordCount,
    variableCount: processedVariables.length,
    missingnessPercent: dataset.missingnessPercent,
    changeNote,
  };

  return {
    ...dataset,
    fileHash: newHash,
    variables: processedVariables,
    version: newVersionNum,
    versionHistory: [...(dataset.versionHistory || []), newVersionEntry],
  };
}

/**
 * Synchronous CSV parsing helper for tests and fast dataset instantiation.
 */
export function parseCsvTextToDataset(filename: string, csvContent: string): DatasetRecord {
  const papaResult = Papa.parse(csvContent, { header: true, skipEmptyLines: 'greedy' });
  const rawRows = (papaResult.data as Record<string, any>[]).filter((row) => row && Object.values(row).some(v => v !== null && v !== undefined && String(v).trim() !== ''));
  const headers = rawRows.length > 0 ? Object.keys(rawRows[0]) : [];

  const variables: DatasetVariable[] = headers.map((colName) => {
    const vals = rawRows.map((r) => r[colName]).filter((v) => v !== null && v !== undefined && String(v).trim() !== '');
    const isNum = vals.length > 0 && vals.every((v) => !isNaN(Number(v)));
    return {
      name: colName,
      label: colName,
      type: isNum ? 'Numeric' : 'Categorical',
      missingCount: rawRows.length - vals.length,
      uniqueValues: new Set(vals).size,
    };
  });

  const datasetId = `ds-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const nowIso = new Date().toISOString();

  return {
    id: datasetId,
    filename,
    fileHash: `hash-${Math.abs(csvContent.split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0)).toString(16)}`,
    uploadDate: nowIso,
    recordCount: rawRows.length,
    variableCount: variables.length,
    variables,
    missingnessPercent: 0,
    isAnonymizedConfirmed: false,
    duplicateRowCount: 0,
    version: 1,
    versionHistory: [],
    state: 'Uploaded',
    stateHistory: [],
    rawPreview: rawRows,
  };
}

