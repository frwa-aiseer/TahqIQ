const fs = require('fs');

let q1 = fs.readFileSync('src/lib/q1ManuscriptEngine.ts', 'utf8');
if (!q1.includes('isAnalysisOutputApproved')) {
  q1 = q1.replace(
    'import { ProjectState, ManuscriptSection } from "../types";',
    'import { ProjectState, ManuscriptSection } from "../types";\nimport { isAnalysisOutputApproved } from "./aiValidationService";'
  );
  fs.writeFileSync('src/lib/q1ManuscriptEngine.ts', q1);
}

let rc = fs.readFileSync('src/lib/readinessCalculator.ts', 'utf8');
rc = rc.replace('a.state === "Researcher Approved"', 'a.state === "Approved for Manuscript" || (a.state as any) === "Researcher Approved"');
fs.writeFileSync('src/lib/readinessCalculator.ts', rc);

