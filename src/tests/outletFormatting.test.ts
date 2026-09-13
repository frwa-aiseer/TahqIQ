import { describe, expect, it } from "vitest";
import { getVerifiedRequirement } from "../lib/outletRequirements";
import { BASELINE_JOURNALS } from "../data/baselineOutlets";
describe("outlet formatting provenance", () => {
  it("does not treat unverified reference style as a formatting rule", () => {
    const outlet = { ...BASELINE_JOURNALS[0], requirementsList: [{ id: "r", field: "referenceStyle" as const, value: "IEEE", state: "Unverified" as const, confidence: "Low" as const, humanConfirmed: false, version: 1, history: [] }] };
    expect(getVerifiedRequirement(outlet, "referenceStyle")).toBeUndefined();
  });
});
