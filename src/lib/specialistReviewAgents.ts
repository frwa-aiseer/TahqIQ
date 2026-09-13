export const SPECIALIST_REVIEWERS = [
  "MethodologicalReviewAgent", "StatisticalReviewAgent", "DomainReviewAgent",
  "CitationAuditAgent", "JournalEditorReviewAgent", "LanguageClarityReviewAgent",
] as const;

export type SpecialistReviewer = typeof SPECIALIST_REVIEWERS[number];
export type ReviewIssueSeverity = "Critical" | "Major" | "Minor" | "Recommendation";

export interface StructuredReviewIssue {
  severity: ReviewIssueSeverity;
  manuscriptLocation: string;
  problem: string;
  rationale: string;
  evidenceOrResultIds: string[];
  suggestedCorrection: string;
  confidence: "High" | "Medium" | "Low";
}

export interface SpecialistReviewResult {
  reviewer: SpecialistReviewer;
  status: "Reviewer Unavailable" | "AI Suggested—Needs Researcher Review";
  issues: StructuredReviewIssue[];
}

/** No provider means unavailable; this boundary never fabricates completed peer review. */
export function runSpecialistReview(reviewer: SpecialistReviewer, providerAvailable: boolean, issues: StructuredReviewIssue[] = []): SpecialistReviewResult {
  if (!SPECIALIST_REVIEWERS.includes(reviewer)) throw new Error("Unsupported specialist reviewer.");
  if (!providerAvailable) return { reviewer, status: "Reviewer Unavailable", issues: [] };
  return { reviewer, status: "AI Suggested—Needs Researcher Review", issues: issues.map((issue) => ({ ...issue, evidenceOrResultIds: [...issue.evidenceOrResultIds] })) };
}
