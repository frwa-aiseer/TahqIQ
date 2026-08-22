const fs = require('fs');

let q1 = fs.readFileSync('src/lib/q1ManuscriptEngine.ts', 'utf8');
if (!q1.includes('isAnalysisOutputApproved')) {
  q1 = q1.replace(
    'import { ProjectState, ManuscriptSection, ResearchCanvas } from "../types";',
    'import { ProjectState, ManuscriptSection, ResearchCanvas } from "../types";\nimport { isAnalysisOutputApproved } from "./aiValidationService";'
  );
  fs.writeFileSync('src/lib/q1ManuscriptEngine.ts', q1);
}
