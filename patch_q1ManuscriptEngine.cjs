const fs = require('fs');
let code = fs.readFileSync('src/lib/q1ManuscriptEngine.ts', 'utf8');

if (!code.includes('isAnalysisOutputApproved')) {
  code = code.replace(
    'import { ProjectState, ManuscriptSection } from "../types";',
    'import { ProjectState, ManuscriptSection } from "../types";\nimport { isAnalysisOutputApproved } from "./aiValidationService";'
  );
}

code = code.replace(
  /output\.executionStatus === "Completed" \|\| output\.isReproduced \|\| output\.reproductionStatus === "Independently Reproduced"/g,
  'isAnalysisOutputApproved(output)'
);

fs.writeFileSync('src/lib/q1ManuscriptEngine.ts', code);
