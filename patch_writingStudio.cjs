const fs = require('fs');
let code = fs.readFileSync('src/components/views/WritingStudioView.tsx', 'utf8');

if (!code.includes('isAnalysisOutputApproved')) {
  code = code.replace(
    'import { validateAiGeneratedProse, AIValidationResult } from "../../lib/aiValidationService";',
    'import { validateAiGeneratedProse, AIValidationResult, isAnalysisOutputApproved } from "../../lib/aiValidationService";'
  );
}

code = code.replace(
  /out\.executionStatus === "Completed" \|\| out\.isReproduced \|\| out\.reproductionStatus === "Independently Reproduced"/g,
  'isAnalysisOutputApproved(out)'
);

code = code.replace(
  /const isApproved =\s*out\.executionStatus === "Completed" \|\|\s*out\.isReproduced \|\|\s*\(out as any\)\.isApproved \|\|\s*\(out as any\)\.isResearcherApproved \|\|\s*\(out as any\)\.state === "Researcher Approved" \|\|\s*out\.reproductionStatus === "Independently Reproduced";/gm,
  'const isApproved = isAnalysisOutputApproved(out);'
);

fs.writeFileSync('src/components/views/WritingStudioView.tsx', code);
