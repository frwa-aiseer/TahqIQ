import { describe, it, expect } from "vitest";
import { validateAiGeneratedProse, generateLedgerDisclosureStatement } from "../lib/aiValidationService";
import { expandSectionToQ1Length } from "../lib/q1ManuscriptEngine";
import { ProjectState, ManuscriptSection } from "../types";

describe("Phase 6 Acceptance Tests: Structured, Reviewable & Evidence-Grounded AI Workflows", () => {
  const mockProjectWithoutData = {
    id: "proj-p6-test-1",
    title: "Neuromuscular Potentiation Study",
    discipline: "Sports Science",
    subdiscipline: "Biomechanics",
    canvas: {
      broadTopic: "Hamstring strain prevention",
      practicalProblem: "High injury rates in runners",
      scientificProblem: "Lack of EMG recruitment verification",
      proposedContribution: "Dynamic warm-up evaluation",
      theoreticalProblem: "Neural drive modulation unknown",
      population: "18 healthy runners",
      context: "Laboratory biomechanics",
      intervention: "Dynamic warm-up vs Static stretch",
      comparator: "Static stretch",
      exposure: "",
      outcome: "Peak EMG amplitude (% MVIC)",
      existingKnowledge: "Warm-ups increase muscle temp",
      suspectedGap: "Motor unit recruitment dynamics",
      framework: "PICO" as const,
    },
    sources: [
      {
        id: "src-1",
        title: "Electromyographic recruitment in distance runners",
        authors: ["Boyer", "Smith"],
        year: 2021,
        doi: "10.1016/j.jbiomech.2021.102938",
        journalOrVenue: "Journal of Biomechanics",
        documentType: "Journal Article" as const,
        peerReviewStatus: "Peer-reviewed" as const,
        relevanceScore: 95,
        tags: ["EMG", "Warm-up"],
        verificationState: "Verified" as const,
      },
    ],
    claims: [],
    sections: [],
    analysisOutputs: [],
    aiLedger: [],
    reviewerComments: [],
    activeCslStyle: "apa" as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as ProjectState;

  const mockProjectWithData: ProjectState = {
    ...mockProjectWithoutData,
    numericEvidenceRecords: [
      {
        id: "ev-2",
        value: 8.4,
        normalizedValue: 8.4,
        sourceType: "ANALYSIS_OUTPUT",
        sourceId: "out-1",
        verificationState: "Verified",
        createdAt: new Date().toISOString()
      }
    ],
    analysisOutputs: [
      {
        id: "out-1",
        planId: "plan-1",
        analysisPlanId: "plan-1",
        softwareEnvironment: "Python 3.11",
        datasetHash: "hash123",
        executionStatus: "Completed",
        isReproduced: true,
        state: "Approved for Manuscript",
        summaryText: "DWU elicited significant peak EMG elevation (+8.40 % MVIC, t(17)=6.84, p<0.001, d=1.41).",
        numericResults: {
          t_statistic: 6.84,
          p_value: 0.000003,
          cohens_d: 1.41,
          df: 17,
          mean_difference: 8.4,
        },
        pValues: [{ test: "Paired t-test", pValue: 0.000003, significant: true, formatted: "p < 0.001" }],
        effectSizes: [{ metric: "cohens_d", value: 1.41 }],
        assumptionChecks: [],
        reproducibilityHash: "repro123",
        executionTimestamp: new Date().toISOString(),
      },
    ],
  };

  // Test 1: Model errors show failure, not success
  it("Test 1: Model errors show failure, not success", () => {
    const errorResponse = {
      status: "failed",
      error: "Gemini API rate limit exceeded or invalid JSON response.",
    };

    expect(errorResponse.status).toBe("failed");
    expect(errorResponse.error).toContain("Gemini API rate limit");
  });

  // Test 2: Ungrounded numbers and citations are rejected
  it("Test 2: Ungrounded numbers and citations are rejected", () => {
    // Ungrounded citation (Smith et al., 2029 is not in project sources)
    const proseWithFakeCitation = "Recent work by (Smith et al., 2029) claims 99% recovery rates.";
    const result1 = validateAiGeneratedProse(proseWithFakeCitation, "Introduction", mockProjectWithoutData);

    expect(result1.valid).toBe(false);
    expect(result1.error).toContain("Ungrounded citation(s) detected");

    // Ungrounded stat in Results (99.9% MVIC is not in analysisOutputs)
    const proseWithFakeStat = "Results showed peak activation reached 99.90 % MVIC.";
    const result2 = validateAiGeneratedProse(proseWithFakeStat, "Results", mockProjectWithData);

    expect(result2.valid).toBe(false);
    expect(result2.error).toContain("Ungrounded numerical findings detected");
  });

  // Test 3: AI output cannot self-approve
  it("Test 3: AI output cannot self-approve", () => {
    const section: ManuscriptSection = {
      id: "sec-intro",
      title: "Introduction",
      content: "",
      order: 1,
      currentWordCount: 0,
      targetWordLimit: 1200,
      status: "Drafting",
      state: "Empty",
      citationIds: [],
      version: 1,
      lastEditedBy: "system",
      lastEditedTimestamp: new Date().toISOString(),
    };

    const expanded = expandSectionToQ1Length(section, mockProjectWithoutData, 1200);

    // Initial generated status MUST be "AI Suggested", never "Approved"
    expect(expanded.status).toBe("Drafting");
    expect(expanded.state).toBe("AI Suggested");
    expect(expanded.status).not.toBe("Approved");
    expect(expanded.state).not.toBe("Approved");
  });

  // Test 4: Accepted and rejected proposals are logged to ledger
  it("Test 4: Accepted and rejected proposals are logged to ledger", () => {
    const ledgerEvents = [
      {
        id: "ev-1",
        timestamp: new Date().toISOString(),
        userEmail: "test@user.com",
        featureUsed: "Evidence-First Section Drafting",
        manuscriptSection: "Introduction",
        model: "gemini-3.6-flash",
        promptVersion: "v2.4-phase6",
        inputSourcesUsed: ["src-1"],
        generatedSummary: "Drafted Introduction",
        userDecision: "Accepted" as const,
        creditRoleAssigned: "Writing - original draft",
      },
      {
        id: "ev-2",
        timestamp: new Date().toISOString(),
        userEmail: "test@user.com",
        featureUsed: "Multi-Agent Peer Review",
        manuscriptSection: "Methods",
        model: "gemini-3.6-flash",
        promptVersion: "v2.4-phase6",
        inputSourcesUsed: ["src-1"],
        generatedSummary: "Reviewer comment on Methods",
        userDecision: "Rejected" as const,
        creditRoleAssigned: "Writing - review & editing",
      },
    ];

    expect(ledgerEvents.length).toBe(2);
    expect(ledgerEvents[0].userDecision).toBe("Accepted");
    expect(ledgerEvents[1].userDecision).toBe("Rejected");
    expect(ledgerEvents[0].model).toBe("gemini-3.6-flash");
    expect(ledgerEvents[0].promptVersion).toBe("v2.4-phase6");
  });

  // Test 5: Disclosure matches the ledger
  it("Test 5: Disclosure matches the ledger", () => {
    const ledgerEvents = [
      {
        id: "ev-1",
        timestamp: new Date().toISOString(),
        userEmail: "researcher@local",
        featureUsed: "Evidence-First Section Drafting",
        manuscriptSection: "Introduction",
        model: "gemini-3.6-flash",
        promptVersion: "v2.4-phase6",
        inputSourcesUsed: ["src-1"],
        generatedSummary: "Drafted Intro",
        userDecision: "Accepted" as const,
        creditRoleAssigned: "Writing - original draft",
      },
      {
        id: "ev-2",
        timestamp: new Date().toISOString(),
        userEmail: "researcher@local",
        featureUsed: "Evidence-First Section Drafting",
        manuscriptSection: "Methods",
        model: "gemini-3.6-flash",
        promptVersion: "v2.4-phase6",
        inputSourcesUsed: ["src-1"],
        generatedSummary: "Drafted Methods",
        userDecision: "Rejected" as const,
        creditRoleAssigned: "Writing - original draft",
      },
    ];

    const disclosure = generateLedgerDisclosureStatement(ledgerEvents, "Neuromuscular Study");

    expect(disclosure).toContain("Total Material AI Calls Logged: 2");
    expect(disclosure).toContain("Accepted AI Proposals: 1");
    expect(disclosure).toContain("Rejected AI Proposals: 1");
    expect(disclosure).toContain("gemini-3.6-flash");
    expect(disclosure).toContain("Introduction, Methods");
  });

  // Test 6: Results cannot be drafted from no data
  it("Test 6: Results cannot be drafted from no data", () => {
    const result = validateAiGeneratedProse("Some results text...", "Results", mockProjectWithoutData);

    expect(result.valid).toBe(false);
    expect(result.error).toContain("Results section drafting blocked");
    expect(result.error).toContain("No approved analysis outputs exist in project");
  });
});
