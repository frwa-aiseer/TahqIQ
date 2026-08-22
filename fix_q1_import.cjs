const fs = require('fs');

let q1 = fs.readFileSync('src/lib/q1ManuscriptEngine.ts', 'utf8');
if (!q1.includes('import { isAnalysisOutputApproved }')) {
  q1 = 'import { isAnalysisOutputApproved } from "./aiValidationService";\n' + q1;
  fs.writeFileSync('src/lib/q1ManuscriptEngine.ts', q1);
}
