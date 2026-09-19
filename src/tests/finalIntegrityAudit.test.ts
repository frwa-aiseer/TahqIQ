import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { createEmptyProject } from "../data/demoProject";
import { buildTruthfulEthicsDisclosure } from "../components/ManuscriptPreviewPane";
import { evaluateExportGateChecks } from "../lib/complianceEngine";
import { executeRegisteredAnalysisMethod } from "../lib/statsEngine";
import { calculateProjectReadiness } from "../lib/readinessCalculator";
import { adaptProjectResearchArtifacts } from "../lib/researchArtifacts";
import { parseBibTeX, parseReferenceTextToSource, parseRIS } from "../lib/referenceParsers";
import { applyTrustedTransition } from "../server/trustedTransitions";
import type { AnalysisPlan, DatasetRecord } from "../types";

const productionSource = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), "utf8");

describe("TQ-VSC-093 scientific-integrity regression audit", () => {
  it("contains no known fabricated ethics or static-success declarations in production UI", () => {
    const preview = productionSource("src/components/ManuscriptPreviewPane.tsx");
    const dashboard = productionSource("src/components/views/DashboardView.tsx");
    const peerReview = productionSource("src/components/views/PeerReviewView.tsx");
    const stats = productionSource("src/lib/statsEngine.ts");
    const exports = productionSource("src/lib/exportUtils.ts");
    const sourceLibrary = productionSource("src/components/views/SourceLibraryView.tsx");
    expect(preview).not.toMatch(/NISS-REC-2026|Institutional Review Board verified|consent was obtained from all/i);
    expect(dashboard).not.toContain("100% DOI Resolved");
    expect(peerReview).not.toContain("Manuscript prose adheres to structural guidelines.");
    expect(stats).not.toContain("Fallback: extract first two numerical columns");
    expect(exports).not.toContain("approved by ${project.ethicsInfo.committeeName");
    expect(sourceLibrary).not.toContain("Successfully imported & verified DOI");
    expect(sourceLibrary).not.toMatch(/relevanceScore:\s*[0-9]/);
  });

  it("keeps ethics, consent, and AI disclosures explicitly attributable or missing", () => {
    expect(buildTruthfulEthicsDisclosure(undefined)).toEqual({
      approval: "Missing — researcher input required.",
      consent: "Not confirmed — researcher input required.",
    });
    expect(buildTruthfulEthicsDisclosure({ approvalRequired: true, approvalNumber: "IRB-RESEARCHER", consentObtained: true }).approval)
      .toMatch(/Researcher-supplied approval reference/);
    expect(buildTruthfulEthicsDisclosure({ approvalRequired: true, approvalNumber: "IRB-RESEARCHER", consentObtained: true }).consent)
      .toMatch(/Researcher recorded consent/);
  });

  it("does not treat anonymization alone as dataset approval or Completed as plan approval", () => {
    const project = createEmptyProject({ datasets: [{
      id: "dataset-pending", filename: "researcher-upload.csv", fileHash: "a".repeat(64), uploadDate: "2026-09-19T00:00:00.000Z",
      recordCount: 2, variableCount: 1, variables: [{ name: "score", type: "Numeric", missingCount: 0, uniqueValues: 2 }],
      missingnessPercent: 0, isAnonymizedConfirmed: true, state: "Requires Review", rawPreview: [{ score: 1 }, { score: 2 }],
    }] });
    expect(calculateProjectReadiness(project).dataQuality).toBe(0);

    const plan: AnalysisPlan = {
      id: "plan-completed-only", title: "Completed but not approved", researchQuestionId: "question-1", outcomeVariable: "score",
      predictorVariables: ["group"], statisticalMethod: "independent-t", assumptions: [], effectSizeMeasure: "Cohen's d",
      significanceThreshold: 0.05, missingDataStrategy: "Complete cases", status: "Draft", state: "Completed", isPreregistered: false,
    };
    const dataset: DatasetRecord = {
      id: "dataset-approved", filename: "researcher-upload.csv", fileHash: "b".repeat(64), uploadDate: "2026-09-19T00:00:00.000Z",
      recordCount: 4, variableCount: 2, variables: [
        { name: "group", type: "Categorical", missingCount: 0, uniqueValues: 2 },
        { name: "score", type: "Numeric", missingCount: 0, uniqueValues: 4 },
      ], missingnessPercent: 0, isAnonymizedConfirmed: true, state: "Approved for Analysis",
      rawPreview: [{ group: "A", score: 1 }, { group: "A", score: 2 }, { group: "B", score: 3 }, { group: "B", score: 4 }],
    };
    const output = executeRegisteredAnalysisMethod("independent-t", { dataset, plan, outcomeVariable: "score", conditionVariable: "group" });
    expect(output.executionStatus).toBe("Failed");
    expect(output.summaryText).toMatch(/requires researcher approval/i);
  });

  it("does not project an Executed plan as an approved research artifact", () => {
    const project = createEmptyProject({ analysisPlans: [{
      id: "plan-executed", title: "Executed legacy plan", researchQuestionId: "question-1", outcomeVariable: "score",
      predictorVariables: ["group"], statisticalMethod: "independent-t", assumptions: [], effectSizeMeasure: "Cohen's d",
      significanceThreshold: 0.05, missingDataStrategy: "Complete cases", status: "Executed", isPreregistered: false,
    }] });
    const artifact = adaptProjectResearchArtifacts(project).find((item) => item.id === "plan-executed");
    expect(artifact).toMatchObject({ verificationState: "Needs Review", approvalState: "Not Approved" });
  });

  it("keeps imported DOI/reference metadata unverified until an independent transition", () => {
    const bibtex = parseBibTeX("@article{key, author={Researcher, A}, title={Observed work}, journal={Observed Journal}, year={2024}, doi={10.1234/supplied}}")[0];
    const ris = parseRIS("TY  - JOUR\nTI  - Observed work\nDO  - 10.1234/supplied\nER  -")[0];
    const text = parseReferenceTextToSource("Researcher A. (2024). Observed work. https://doi.org/10.1234/supplied");
    expect([bibtex, ris, text].map((source) => source.verificationState)).toEqual(["Unverified", "Unverified", "Unverified"]);
    expect([bibtex, ris, text].map((source) => source.peerReviewStatus)).toEqual(["Unknown", "Unknown", "Unknown"]);
    expect(text.relevanceScore).toBeUndefined();
    expect(() => parseReferenceTextToSource("Researcher A. Observed work. https://doi.org/10.1234/supplied")).toThrow(/publication year is missing/i);
  });

  it("requires attributable author sign-off and trusted ethics approval for submission gates", () => {
    const project = createEmptyProject({ authors: [{
      id: "author-1", fullName: "Researcher", publicationName: "Researcher", email: "researcher@example.org", department: "",
      institution: "", city: "", country: "", isCorresponding: true, order: 1, creditRoles: [], conflictDeclaration: "",
      finalApproval: true,
    }] });
    expect(evaluateExportGateChecks(project).find((gate) => gate.checkId === "gate-author-signoff")?.status).toBe("Blocker");
    expect(evaluateExportGateChecks(project).find((gate) => gate.checkId === "gate-author-signoff")?.affectedItemIds).toEqual(["author-1"]);
    expect(evaluateExportGateChecks(project).find((gate) => gate.checkId === "gate-ethics-mandate")?.status).toBe("Pass");
  });

  it("does not let client-authored provenance bootstrap source verification", () => {
    const project = createEmptyProject({ sources: [{
      id: "source-untrusted", title: "Researcher supplied record", authors: [], year: 2024, journalOrVenue: "Not available — researcher input required",
      documentType: "Journal Article", peerReviewStatus: "Unknown", verificationState: "Unverified", relevanceScore: undefined,
      tags: [], provenance: { provider: "Crossref", retrievedAt: "2026-09-19" },
    }] });
    expect(() => applyTrustedTransition(project, { transitionType: "SOURCE_VERIFIED", entityId: "source-untrusted", rationale: "Researcher reviewed this source record.", evidenceIds: [], expectedRevision: 0 }, { uid: "researcher-1", email: "researcher@example.org", role: "Owner" })).toThrow(/trusted server\/provider retrieval provenance/i);
  });
});
