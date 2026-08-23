import { describe, expect, it } from "vitest";
import { createEmptyProject } from "../data/demoProject";
import { BASELINE_JOURNALS } from "../data/baselineOutlets";
import { calculateComplianceRules } from "../lib/complianceEngine";
import {
  OUTLET_REQUIREMENT_FIELDS,
  createRequirementVersion,
  getLatestRequirement,
  getRequirementDisplayState,
  getVerifiedRequirement,
  normalizeOutletRequirements,
  validateOutletRequirement,
} from "../lib/outletRequirements";
import type { TargetOutlet, VersionedRequirementRecord } from "../types";

const verifiedRequirement = (overrides: Partial<VersionedRequirementRecord> = {}): VersionedRequirementRecord => ({
  id: "req-word-limit",
  field: "manuscriptWordLimit",
  value: 5000,
  state: "Verified",
  sourceProvider: "PLOS ONE",
  sourceUrl: "https://journals.plos.org/plosone/s/submission-guidelines",
  retrievedAt: "2026-08-23",
  confidence: "High",
  humanConfirmed: true,
  confirmedByUid: "researcher-1",
  confirmedAt: "2026-08-23T10:00:00.000Z",
  version: 1,
  history: [],
  ...overrides,
});

const outletWith = (requirementsList: VersionedRequirementRecord[]): TargetOutlet => ({
  ...BASELINE_JOURNALS[0],
  requirementsList,
});

describe("versioned outlet requirement provenance", () => {
  it("covers every required journal and conference requirement field", () => {
    expect(OUTLET_REQUIREMENT_FIELDS).toHaveLength(18);
    expect(OUTLET_REQUIREMENT_FIELDS).toEqual(expect.arrayContaining([
      "articleType", "manuscriptWordLimit", "abstractWordLimit", "abstractStructure", "referenceStyle",
      "referenceLimit", "figureLimit", "tableLimit", "supplements", "titlePage", "authors", "aiPolicy",
      "ethics", "dataSharing", "apc", "conferenceDeadline", "conferenceTemplate", "conferenceFileRequirements",
    ]));
  });

  it("accepts a verified requirement only with field-level provenance and human confirmation", () => {
    const record = verifiedRequirement();
    expect(validateOutletRequirement(record)).toEqual({ valid: true, issues: [] });
    expect(getVerifiedRequirement(outletWith([record]), "manuscriptWordLimit")).toEqual(record);
    expect(getRequirementDisplayState(outletWith([record]), "manuscriptWordLimit")).toBe("Verified");
  });

  it("downgrades an invalid Verified record and never substitutes the outlet homepage", () => {
    const normalized = normalizeOutletRequirements([{ ...verifiedRequirement(), sourceUrl: undefined }]);
    expect(normalized[0].state).toBe("Unverified");
    expect(normalized[0].sourceUrl).toBeUndefined();
    expect(getVerifiedRequirement(outletWith(normalized), "manuscriptWordLimit")).toBeUndefined();
  });

  it("keeps AI extraction visibly pending review", () => {
    const record = verifiedRequirement({ state: "AI Extracted—Needs Review", humanConfirmed: false, confidence: "Medium" });
    expect(validateOutletRequirement(record).valid).toBe(true);
    expect(getRequirementDisplayState(outletWith([record]), "manuscriptWordLimit")).toBe("AI Extracted—Needs Review");
    expect(getVerifiedRequirement(outletWith([record]), "manuscriptWordLimit")).toBeUndefined();
  });

  it("represents a missing requirement as Unavailable", () => {
    expect(getRequirementDisplayState(outletWith([]), "conferenceTemplate")).toBe("Unavailable");
  });

  it("normalizes legacy requirement names as Unverified", () => {
    const records = normalizeOutletRequirements([{ id: "legacy", field: "wordLimit", extractedValue: 4000 }]);
    expect(records[0]).toMatchObject({ field: "manuscriptWordLimit", value: 4000, state: "Unverified", version: 1, history: [] });
  });

  it("increments versions and preserves the prior record in history", () => {
    const previous = verifiedRequirement();
    const next = createRequirementVersion(previous, {
      field: "manuscriptWordLimit", value: 4500, state: "Unverified", confidence: "Medium", humanConfirmed: false,
    });
    expect(next.version).toBe(2);
    expect(next.history).toHaveLength(1);
    expect(next.history[0]).toMatchObject({ version: 1, value: 5000, state: "Verified" });
  });

  it("selects the latest version for display", () => {
    const older = verifiedRequirement();
    const newer = verifiedRequirement({ id: "req-word-limit-v2", value: 4500, version: 2, state: "Unverified", humanConfirmed: false });
    expect(getLatestRequirement(outletWith([older, newer]), "manuscriptWordLimit")).toEqual(newer);
    expect(getRequirementDisplayState(outletWith([older, newer]), "manuscriptWordLimit")).toBe("Unverified");
  });

  it("does not turn unsourced top-level outlet limits into compliance facts", () => {
    const outlet = { ...outletWith([]), wordLimit: 1, abstractWordLimit: 1, citationStyle: "APA 7th" };
    const project = { ...createEmptyProject(), selectedTargetOutlet: outlet };
    const rules = calculateComplianceRules(project, outlet);
    expect(rules.find((rule) => rule.id === "rule-word-limit")).toBeUndefined();
    expect(rules.find((rule) => rule.id === "rule-abstract-limit")).toBeUndefined();
    expect(rules.find((rule) => rule.id === "rule-citation-style")).toBeUndefined();
  });

  it("uses a verified requirement and preserves its exact provenance in compliance", () => {
    const requirement = verifiedRequirement({ value: 1 });
    const outlet = outletWith([requirement]);
    const project = { ...createEmptyProject(), selectedTargetOutlet: outlet };
    const rule = calculateComplianceRules(project, outlet).find((item) => item.id === "rule-word-limit");
    expect(rule).toMatchObject({
      sourceRecordId: requirement.id,
      officialSourceUrl: requirement.sourceUrl,
      retrievalDate: requirement.retrievedAt,
      humanConfirmed: true,
    });
  });
});
