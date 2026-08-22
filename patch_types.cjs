const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

code = code.replace(
`export type AnalysisState =
  | "Draft Plan"
  | "Awaiting Approval"
  | "Approved"
  | "Queued"
  | "Running"
  | "Failed"
  | "Completed"
  | "Interpreted"
  | "Researcher Approved";`,
`export type AnalysisState =
  | "Draft Plan"
  | "Awaiting Approval"
  | "Approved"
  | "Queued"
  | "Running"
  | "Failed"
  | "Completed"
  | "QC Passed"
  | "Researcher Reviewed"
  | "Approved for Manuscript"
  | "Locked";`
);

const additionalFields = `
  state?: AnalysisState;
  isApproved?: boolean;
  researcherApproval?: {
    actor: string;
    timestamp: string;
    rationale: string;
    outputId: string;
    datasetHash: string;
    analysisPlanId: string;
  };
`;

code = code.replace(/  \}\[\];\n\}/, '  }[];' + additionalFields + '}');

fs.writeFileSync('src/types.ts', code);
