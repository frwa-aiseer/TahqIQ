import { describe, expect, it } from "vitest";
import { createEmptyProject } from "../data/demoProject";
import type { NumericEvidence, SourceRecord, TargetOutlet } from "../types";
import {
  expectNoScientificIntegrityViolations,
  findAiOutputSelfApprovalViolations,
  findAutomaticHumanApprovalViolations,
  findDemoArtifactsInRealSubmissionViolations,
  findEmpiricalNumberFallbackViolations,
  findFabricatedSourceOrDoiViolations,
  findUnverifiedOutletShownAsVerifiedViolations,
} from "./helpers/scientificIntegrityInvariants";

function source(overrides: Partial<SourceRecord> = {}): SourceRecord {
  return {
    id: "source-1",
    title: "Researcher supplied source",
    authors: ["Researcher, A."],
    year: 2024,
    journalOrVenue: "Verified venue",
    documentType: "Journal Article",
    peerReviewStatus: "Unknown",
    verificationState: "Unverified",
    relevanceScore: 1,
    tags: [],
    ...overrides,
  };
}

function outlet(overrides: Partial<TargetOutlet> = {}): TargetOutlet {
  return {
    id: "outlet-1",
    title: "Researcher selected outlet",
    type: "Journal",
    issnOrAcronym: "Unverified",
    publisherOrSociety: "Unverified",
    subjectCategory: "Unverified",
    officialUrl: "",
    indexing: [],
    openAccessModel: "Subscription",
    citationStyle: "APA 7th",
    lastVerifiedDate: "2026-08-22",
    aiPolicySummary: "Researcher input required",
    ...overrides,
  };
}

describe("TQ-VSC-001 scientific-integrity invariant harness", () => {
  it("rejects malformed/placeholder DOIs and Verified sources without provider provenance", () => {
    const violations = findFabricatedSourceOrDoiViolations([
      source({ doi: "10.0000/example", verificationState: "Verified" }),
    ]);

    expect(violations.map((violation) => violation.code)).toEqual([
      "SOURCE_DOI_INVALID",
      "SOURCE_VERIFICATION_UNGROUNDED",
    ]);
  });

  it("accepts a syntactically valid DOI only when a Verified source has retrieval provenance", () => {
    const violations = findFabricatedSourceOrDoiViolations([
      source({
        doi: "10.1234/research-record",
        verificationState: "Verified",
        metadataProvider: "Crossref",
        provenance: { provider: "Crossref", retrievedAt: "2026-08-22T00:00:00.000Z" },
      }),
    ]);

    expectNoScientificIntegrityViolations(violations);
  });

  it("exposes empirical-number fallback when no matching Verified evidence record exists", () => {
    const violations = findEmpiricalNumberFallbackViolations(
      [{ value: 42, analysisRunId: "analysis-1", path: "sections[3].content" }],
      []
    );

    expect(violations).toHaveLength(1);
    expect(violations[0].code).toBe("EMPIRICAL_NUMBER_UNGROUNDED");
  });

  it("accepts an empirical number linked to matching Verified numeric evidence", () => {
    const evidence: NumericEvidence = {
      id: "number-1",
      value: 42,
      normalizedValue: 42,
      sourceType: "ANALYSIS_OUTPUT",
      sourceId: "analysis-1",
      analysisRunId: "analysis-1",
      verificationState: "Verified",
      createdAt: "2026-08-22T00:00:00.000Z",
    };

    expectNoScientificIntegrityViolations(
      findEmpiricalNumberFallbackViolations(
        [{ value: 42, analysisRunId: "analysis-1" }],
        [evidence]
      )
    );
  });

  it("exposes approval flags that lack an attributable, timestamped human decision", () => {
    const violations = findAutomaticHumanApprovalViolations([
      { id: "section-1", approved: true, approvalActorType: "system" },
    ]);

    expect(violations).toHaveLength(1);
    expect(violations[0].code).toBe("HUMAN_APPROVAL_AUTOMATIC");
  });

  it("accepts an attributable, timestamped human approval audit record", () => {
    expectNoScientificIntegrityViolations(
      findAutomaticHumanApprovalViolations([
        {
          id: "section-1",
          approved: true,
          approvalActorType: "human",
          approvedByUid: "researcher-1",
          approvalTimestamp: "2026-08-22T00:00:00.000Z",
        },
      ])
    );
  });

  it("exposes user-added or provenance-free outlets shown as Verified", () => {
    const violations = findUnverifiedOutletShownAsVerifiedViolations([
      outlet({
        verificationStatus: "Verified",
        outletProvenanceType: "USER_ADDED_UNVERIFIED",
        isUserAdded: true,
      }),
    ]);

    expect(violations).toHaveLength(1);
    expect(violations[0].code).toBe("OUTLET_VERIFICATION_UNGROUNDED");
  });

  it("accepts a provider-attributed verified outlet record", () => {
    expectNoScientificIntegrityViolations(
      findUnverifiedOutletShownAsVerifiedViolations([
        outlet({
          verificationStatus: "Verified",
          outletProvenanceType: "LIVE_RETRIEVED_RECORD",
          provenanceProvider: "Publisher API",
        }),
      ])
    );
  });

  it("exposes demo artifacts entering real-project submission readiness", () => {
    const realProject = createEmptyProject({
      id: "real-project",
      isDemoProject: false,
      sources: [source({ id: "demo-source", isDemo: true, isSynthetic: true })],
    });

    const violations = findDemoArtifactsInRealSubmissionViolations(realProject, "Submission-Ready");
    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatchObject({
      code: "DEMO_ARTIFACT_IN_REAL_SUBMISSION",
      path: "sources[0]",
    });
  });

  it("does not treat explicitly marked demo projects or Draft Review as real submission readiness", () => {
    const demoProject = createEmptyProject({ id: "demo-project", isDemoProject: true });
    const realDraft = createEmptyProject({
      id: "real-draft",
      isDemoProject: false,
      sources: [source({ isSynthetic: true })],
    });

    expectNoScientificIntegrityViolations(
      findDemoArtifactsInRealSubmissionViolations(demoProject, "Submission-Ready")
    );
    expectNoScientificIntegrityViolations(
      findDemoArtifactsInRealSubmissionViolations(realDraft, "Draft Review")
    );
  });

  it("exposes AI-generated output that is self/system approved", () => {
    const violations = findAiOutputSelfApprovalViolations([
      { id: "ai-draft-1", generatedByAi: true, approved: true, approvalActorType: "ai" },
    ]);

    expect(violations).toHaveLength(1);
    expect(violations[0].code).toBe("AI_OUTPUT_SELF_APPROVED");
  });

  it("accepts AI output only after an attributable human approval", () => {
    expectNoScientificIntegrityViolations(
      findAiOutputSelfApprovalViolations([
        {
          id: "ai-draft-1",
          generatedByAi: true,
          approved: true,
          approvalActorType: "human",
          approvedByUid: "researcher-1",
        },
      ])
    );
  });

  it("throws a readable aggregate error so violations cannot be silently ignored", () => {
    const violations = findAiOutputSelfApprovalViolations([
      { id: "ai-draft-1", generatedByAi: true, approved: true },
    ]);

    expect(() => expectNoScientificIntegrityViolations(violations)).toThrow(
      /AI_OUTPUT_SELF_APPROVED at aiOutputs\[0\]/
    );
  });
});
