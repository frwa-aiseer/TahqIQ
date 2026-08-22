import { describe, it, expect } from 'vitest';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import {
  parseAndProfileDataset,
  calculateSha256,
  isMissingValue,
  updateDatasetVariableDictionary,
} from '../lib/datasetIngestion';
import { performStateTransition } from '../lib/stateMachines';
import { DatasetRecord } from '../types';

describe('TehqIQ Phase 4: Dataset Ingestion and Profiling Engine', () => {
  it('1. Robust CSV parsing with quoted delimiters and commas', async () => {
    const csvData = `id,name,city,score
1,"Smith, John","New York, NY",95.5
2,"Doe, Jane","Boston, MA",88.0
3,"Taylor, Alex","Chicago, IL",92.3`;

    const result = await parseAndProfileDataset({
      filename: 'quoted_commas.csv',
      fileBufferOrString: csvData,
    });

    expect(result.dataset.recordCount).toBe(3);
    expect(result.dataset.variableCount).toBe(4);
    expect(result.dataset.variables.map((v) => v.name)).toEqual(['id', 'name', 'city', 'score']);

    // Ensure quoted names were preserved intact
    const nameVar = result.dataset.variables.find((v) => v.name === 'name');
    expect(nameVar).toBeDefined();
    expect(result.rawRows[0]['name']).toBe('Smith, John');
    expect(result.rawRows[0]['city']).toBe('New York, NY');
  });

  it('2. Robust CSV parsing with embedded newlines in quoted fields', async () => {
    const csvData = `id,notes,value
101,"First line
Second line
Third line",42.5
102,"Normal note",18.2`;

    const result = await parseAndProfileDataset({
      filename: 'embedded_newlines.csv',
      fileBufferOrString: csvData,
    });

    expect(result.dataset.recordCount).toBe(2);
    expect(result.rawRows[0]['notes']).toContain('First line');
    expect(result.rawRows[0]['notes']).toContain('Second line');
    expect(result.rawRows[0]['notes']).toContain('Third line');
    expect(result.rawRows[0]['value']).toBe('42.5');
  });

  it('3. Column Union and Schema Drift Detection across records', async () => {
    // Json array with varying schema per object
    const jsonRecords = [
      { id: '1', age: 25, treatment: 'A' },
      { id: '2', age: 30, treatment: 'B', biomarker_x: 14.2 },
      { id: '3', age: 28, extra_notes: 'observed' },
    ];

    const result = await parseAndProfileDataset({
      filename: 'schema_drift.json',
      fileBufferOrString: JSON.stringify(jsonRecords),
    });

    // Union of columns: id, age, treatment, biomarker_x, extra_notes
    expect(result.dataset.variableCount).toBe(5);
    expect(result.dataset.schemaDriftDetected).toBe(true);
    expect(result.dataset.schemaDriftDetails).toBeDefined();
    expect(result.dataset.schemaDriftDetails!.length).toBeGreaterThan(0);
  });

  it('4. Missingness, unique values, and numeric summary stats calculation', async () => {
    const csvData = `patient_id,bp_systolic,bp_diastolic,group
P01,120,80,Control
P02,130,NA,Control
P03,140,90,Treatment
P04,110,70,Treatment
P05,NA,85,Control`;

    const result = await parseAndProfileDataset({
      filename: 'patient_bp.csv',
      fileBufferOrString: csvData,
    });

    const dataset = result.dataset;
    expect(dataset.recordCount).toBe(5);

    // Check bp_systolic variable
    const bpSys = dataset.variables.find((v) => v.name === 'bp_systolic');
    expect(bpSys).toBeDefined();
    expect(bpSys?.missingCount).toBe(1); // P05 is NA
    expect(bpSys?.type).toBe('Numeric');

    // Numbers: 120, 130, 140, 110. Sorted: [110, 120, 130, 140]
    // min = 110, max = 140, mean = 125, median = 125
    expect(bpSys?.summaryStats?.min).toBe(110);
    expect(bpSys?.summaryStats?.max).toBe(140);
    expect(bpSys?.summaryStats?.mean).toBe(125);

    // Check group variable
    const groupVar = dataset.variables.find((v) => v.name === 'group');
    expect(groupVar?.type).toBe('Categorical');
    expect(groupVar?.summaryStats?.frequencies).toEqual({ Control: 3, Treatment: 2 });
  });

  it('5. Duplicate row detection', async () => {
    const csvData = `col1,col2
alpha,100
beta,200
alpha,100
gamma,300
beta,200`;

    const result = await parseAndProfileDataset({
      filename: 'duplicates.csv',
      fileBufferOrString: csvData,
    });

    expect(result.dataset.duplicateRowCount).toBe(2);
  });

  it('6. XLSX worksheet parsing', async () => {
    // Create an in-memory XLSX workbook using xlsx library
    const sheetData = [
      ['Participant', 'Age', 'Score'],
      ['P-01', 34, 88.5],
      ['P-02', 29, 91.0],
      ['P-03', 41, 79.2],
    ];
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'TrialData');
    const xlsxBuffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

    const result = await parseAndProfileDataset({
      filename: 'trial_data.xlsx',
      fileBufferOrString: xlsxBuffer,
    });

    expect(result.dataset.recordCount).toBe(3);
    expect(result.dataset.variableCount).toBe(3);
    expect(result.dataset.variables.map((v) => v.name)).toEqual(['Participant', 'Age', 'Score']);
    expect(result.rawRows[0]['Participant']).toBe('P-01');
    expect(result.rawRows[0]['Age']).toBe(34);
  });

  it('7. SHA-256 Hash stability and reproducibility', async () => {
    const fileContent = 'sample,measurement\nA,12.34\nB,56.78\n';
    const hash1 = await calculateSha256(fileContent);
    const hash2 = await calculateSha256(fileContent);

    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64); // hex sha256 string
  });

  it('8. Explicit researcher confirmation required (isAnonymizedConfirmed = false by default)', async () => {
    const csvData = `id,value\n1,10\n2,20\n`;
    const result = await parseAndProfileDataset({
      filename: 'test_anon.csv',
      fileBufferOrString: csvData,
    });

    // Ingested dataset MUST have isAnonymizedConfirmed = false!
    expect(result.dataset.isAnonymizedConfirmed).toBe(false);

    // Set dataset state to 'Requires Review' (valid preceding state for 'Approved for Analysis')
    const datasetInReview = { ...result.dataset, state: 'Requires Review' as const };

    // Attempting state transition to 'Approved for Analysis' MUST fail if unconfirmed!
    const transitionResult = performStateTransition(
      'Dataset',
      datasetInReview,
      'Approved for Analysis',
      { uid: 'u1', email: 'test@tehqiq.edu' },
      'Researcher approval attempt'
    );

    expect(transitionResult.success).toBe(false);
    expect(transitionResult.error).toContain('isAnonymizedConfirmed = true');
  });

  it('9. Editable Variable Dictionary and Dataset Versioning', async () => {
    const csvData = `weight_kg,group\n72.5,1\n68.1,0\n`;
    const result = await parseAndProfileDataset({
      filename: 'weights.csv',
      fileBufferOrString: csvData,
    });

    const dataset = result.dataset;
    expect(dataset.version).toBe(1);
    expect(dataset.versionHistory?.length).toBe(1);

    // Researcher edits variable dictionary
    const updatedVars = dataset.variables.map((v) =>
      v.name === 'weight_kg'
        ? { ...v, label: 'Patient Body Weight', unit: 'kg', expectedMin: 30, expectedMax: 200 }
        : v
    );

    const v2Dataset = await updateDatasetVariableDictionary(
      dataset,
      updatedVars,
      'Added human label and physical units.'
    );

    expect(v2Dataset.version).toBe(2);
    expect(v2Dataset.versionHistory?.length).toBe(2);
    expect(v2Dataset.fileHash).not.toBe(dataset.fileHash); // Immutable hash updated for new version!
    expect(v2Dataset.variables[0].label).toBe('Patient Body Weight');
    expect(v2Dataset.variables[0].unit).toBe('kg');
  });
});
