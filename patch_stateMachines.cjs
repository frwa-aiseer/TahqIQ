const fs = require('fs');
let code = fs.readFileSync('src/lib/stateMachines.ts', 'utf8');

code = code.replace(
`export const ANALYSIS_TRANSITIONS: Record<AnalysisState, AnalysisState[]> = {
  "Draft Plan": ["Awaiting Approval"],
  "Awaiting Approval": ["Approved", "Draft Plan"],
  "Approved": ["Queued"],
  "Queued": ["Running"],
  "Running": ["Failed", "Completed"],
  "Failed": ["Draft Plan", "Queued"],
  "Completed": ["Interpreted"],
  "Interpreted": ["Researcher Approved", "Draft Plan"],
  "Researcher Approved": ["Interpreted"],
};`,
`export const ANALYSIS_TRANSITIONS: Record<AnalysisState, AnalysisState[]> = {
  "Draft Plan": ["Awaiting Approval"],
  "Awaiting Approval": ["Approved", "Draft Plan"],
  "Approved": ["Queued"],
  "Queued": ["Running"],
  "Running": ["Failed", "Completed"],
  "Failed": ["Draft Plan", "Queued"],
  "Completed": ["QC Passed", "Failed"],
  "QC Passed": ["Researcher Reviewed"],
  "Researcher Reviewed": ["Approved for Manuscript", "Draft Plan"],
  "Approved for Manuscript": ["Locked", "Researcher Reviewed"],
  "Locked": ["Approved for Manuscript"]
};`
);

fs.writeFileSync('src/lib/stateMachines.ts', code);
