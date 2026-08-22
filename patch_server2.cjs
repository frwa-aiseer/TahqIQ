const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  'Approved Analysis Outputs: ${JSON.stringify(analysisOutputs || [])}',
  'Approved Analysis Outputs: ${JSON.stringify((analysisOutputs || []).filter((out: any) => out.state === "Approved for Manuscript" || out.isApproved === true || out.isResearcherApproved === true || out.state === "Researcher Approved"))}'
);

fs.writeFileSync('server.ts', code);
