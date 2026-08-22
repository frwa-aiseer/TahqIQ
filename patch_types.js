const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

const numericEvidenceType = `
export type NumericEvidenceSourceType = "DATASET" | "ANALYSIS_OUTPUT" | "RESEARCHER_PROTOCOL" | "VERIFIED_SOURCE" | "USER_CONFIRMED";

export interface NumericEvidence {
  id: string;
  value: number;
  normalizedValue: number;
  unit?: string;
  sourceType: NumericEvidenceSourceType;
  sourceId: string;
  datasetHash?: string;
  analysisRunId?: string;
  variableName?: string;
  evidencePassageId?: string;
  verificationState: "Verified" | "Unverified" | "Rejected";
  createdAt: string;
}
`;

if (!code.includes('NumericEvidence')) {
  code = code.replace('export interface ProjectState {', numericEvidenceType + '\nexport interface ProjectState {');
  code = code.replace('analysisOutputs?: AnalysisOutput[];', 'analysisOutputs?: AnalysisOutput[];\n  numericEvidenceRecords?: NumericEvidence[];');
  fs.writeFileSync('src/types.ts', code);
  console.log('Patched types.ts');
}
