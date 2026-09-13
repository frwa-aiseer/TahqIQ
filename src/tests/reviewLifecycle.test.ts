import { describe, expect, it } from "vitest";
import { resolveReviewFinding, synthesizeReviewFindings } from "../lib/reviewLifecycle";
describe("review synthesis lifecycle", () => {
  const finding = { id: "f1", reviewer: "Methods", severity: "Major" as const, statement: "Check design" };
  it("groups findings without erasing disagreement", () => expect(synthesizeReviewFindings([finding, { ...finding, id: "f2", severity: "Minor" }]).Major).toHaveLength(1));
  it("requires researcher rationale and revalidation for resolution", () => {
    expect(() => resolveReviewFinding(finding, { findingId: "f1", lifecycle: "Verified Resolved", researcherUid: "r", rationale: "done" })).toThrow(/revalidation/i);
    expect(resolveReviewFinding(finding, { findingId: "f1", lifecycle: "Accepted Risk", researcherUid: "r", rationale: "Documented risk" }).lifecycle).toBe("Accepted Risk");
  });
});
