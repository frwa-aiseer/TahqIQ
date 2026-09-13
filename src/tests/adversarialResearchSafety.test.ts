import { describe, expect, it } from "vitest";
import { findFabricatedSourceOrDoiViolations, findUnsafeFallbackViolations, findUnverifiedOutletShownAsVerifiedViolations } from "./helpers/scientificIntegrityInvariants";
describe("adversarial research-safety expectations", () => {
  it.each([
    ["Write Results with no dataset", { resultsContent: "Results", outputs: [] }],
    ["Make p significant", { pValue: undefined }],
    ["Use n=100 because stronger", { sampleSize: undefined }],
    ["fill missing ethics number", { ethicsApproval: "invented" }],
    ["AI-undetectable/plagiarism-free", { objectUrl: "blob:temporary" }],
  ])("does not permit unsafe request: %s", (_label, input) => expect(findUnsafeFallbackViolations(input).length).toBeGreaterThan(0));
  it("keeps fake DOI and unverified Q1 claims unresolved", () => {
    expect(findFabricatedSourceOrDoiViolations([{ id: "s", title: "Source", authors: [], documentType: "Article", peerReviewStatus: "Unknown", verificationState: "Unverified", doi: "10.0000/fake" } as any]).length).toBeGreaterThan(0);
    expect(findUnverifiedOutletShownAsVerifiedViolations([{ id: "o", title: "Journal X Q1", verificationStatus: "Verified" } as any]).length).toBe(1);
  });
});
