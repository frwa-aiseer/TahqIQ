import { describe, expect, it } from "vitest";
import { findUnsafeFallbackViolations } from "./helpers/scientificIntegrityInvariants";
describe("scientific-integrity regression matrix", () => {
  it("blocks unsafe fallbacks and false provenance claims", () => {
    const violations = findUnsafeFallbackViolations({ resultsContent: "Results n=10", outputs: [], sampleSize: undefined, pValue: undefined, effectSize: undefined, ethicsApproval: "invented", outlet: { verificationStatus: "Verified", title: "Q1 Journal" }, objectUrl: "blob:temporary", ledger: [] });
    expect(violations.length).toBe(6);
  });
});
