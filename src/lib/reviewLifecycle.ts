export type ReviewIssueLifecycle = "Open" | "Addressed—Needs Recheck" | "Verified Resolved" | "Accepted Risk" | "Rejected Suggestion";

export interface ReviewFinding { id: string; reviewer: string; severity: "P0" | "Major" | "Moderate" | "Minor"; statement: string; }
export interface ReviewResolution { findingId: string; lifecycle: ReviewIssueLifecycle; researcherUid: string; rationale: string; revalidatedAt?: string; }

export function synthesizeReviewFindings(findings: readonly ReviewFinding[]): Record<ReviewFinding["severity"], ReviewFinding[]> {
  return { P0: findings.filter((f) => f.severity === "P0"), Major: findings.filter((f) => f.severity === "Major"), Moderate: findings.filter((f) => f.severity === "Moderate"), Minor: findings.filter((f) => f.severity === "Minor") };
}

export function resolveReviewFinding(finding: ReviewFinding, resolution: ReviewResolution): ReviewResolution {
  if (resolution.findingId !== finding.id) throw new Error("Resolution does not match the review finding.");
  if (!resolution.researcherUid.trim() || !resolution.rationale.trim()) throw new Error("Researcher action and rationale are required.");
  if (resolution.lifecycle === "Verified Resolved" && !resolution.revalidatedAt?.trim()) throw new Error("Revalidation timestamp is required before marking resolved.");
  return { ...resolution, rationale: resolution.rationale.trim() };
}
