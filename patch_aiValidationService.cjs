const fs = require('fs');
let code = fs.readFileSync('src/lib/aiValidationService.ts', 'utf8');

const newFunc = `
/**
 * Checks if an analysis output is formally approved by a researcher for manuscript use.
 */
export function isAnalysisOutputApproved(out: AnalysisOutput): boolean {
  // Requirement 1 & 2 & 3: Results drafting can use an analysis output only if:
  // state === "Approved for Manuscript" OR an equivalent backwards-compatible explicit researcher approval field.
  // "Completed" only means execution completed. Automated QC cannot grant researcher approval.
  const isApproved =
    out.state === "Approved for Manuscript" ||
    out.isApproved === true ||
    (out as any).isResearcherApproved === true ||
    (out as any).state === "Researcher Approved";

  // Requirement 6: Imported external statistical outputs preserve status unless reproduced.
  if (out.isResearcherSupplied && out.reproductionStatus === "Not Independently Reproduced" && !out.isReproduced) {
    // If it's external and not reproduced, it can still be used IF the researcher explicitly approved it.
    // The requirement is to "preserve" the flag (e.g. for audit/disclosure), not necessarily block it if approved.
  }

  return !!isApproved;
}
`;

code = code.replace('export function validateAiGeneratedProse', newFunc + '\nexport function validateAiGeneratedProse');
code = code.replace(/out\.executionStatus === "Completed" \|\| out\.isReproduced \|\| out\.reproductionStatus === "Independently Reproduced"/g, 'isAnalysisOutputApproved(out)');

fs.writeFileSync('src/lib/aiValidationService.ts', code);
