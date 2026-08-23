import { describe, expect, it } from "vitest";
import { createEmptyProject } from "../data/demoProject";
import {
  adaptLegacyClaimEvidenceLinks,
  createClaimEvidenceLink,
  createManuscriptSentenceClaimLink,
  reviewClaimEvidenceLink,
  traceSentenceSupport,
  upsertClaimEvidenceLink,
  validateClaimEvidenceGraph,
} from "../lib/claimEvidenceGraph";
import type { ClaimItem, EvidenceRecord, ProjectState, SourceRecord } from "../types";

const source: SourceRecord = { id: "source-1", title: "Source", authors: [], year: 2025, journalOrVenue: "Journal", documentType: "Article", peerReviewStatus: "Unknown", verificationState: "Verified", relevanceScore: 8, tags: [] };
const evidence = (id: string): EvidenceRecord => ({ evidenceId: id, sourceId: source.id, documentVersion: "v1", documentHash: "hash", exactPassage: `Passage ${id}`, page: "5", extractionMethod: "Researcher Selected", extractedBy: "researcher-1", confidence: 1, verification: "Researcher Verified", researcherReview: { status: "Verified", reviewedBy: "researcher-1", reviewedAt: "2026-01-01", notes: "Checked" }, linkedClaimIds: [], createdAt: "2026-01-01", updatedAt: "2026-01-01" });
const claim = (id: string): ClaimItem => ({ id, claimText: `Claim ${id}`, claimType: "Background fact", manuscriptSection: "Introduction", importance: "High", linkedSourceIds: [], evidenceRelationship: "No support identified", verificationStatus: "Unverified", isResearcherApproved: false });

function project(): ProjectState {
  const value = createEmptyProject();
  value.id = "project-1";
  value.sources = [source];
  value.claims = [claim("claim-1"), claim("claim-2")];
  value.evidenceRecords = [evidence("evidence-1"), evidence("evidence-2")];
  value.claimEvidenceLinks = [];
  value.manuscriptSentenceClaimLinks = [];
  return value;
}

describe("claim–evidence graph", () => {
  it("supports claim-to-many-evidence and evidence-to-many-claims without duplicate edges", () => {
    const value = project();
    const links = [
      createClaimEvidenceLink({ id: "edge-1", claim: value.claims[0], evidence: value.evidenceRecords![0], relationship: "Supports", confidence: 0.9, createdBy: "researcher-1" }),
      createClaimEvidenceLink({ id: "edge-2", claim: value.claims[0], evidence: value.evidenceRecords![1], relationship: "Partially Supports", confidence: 0.7, createdBy: "researcher-1" }),
      createClaimEvidenceLink({ id: "edge-3", claim: value.claims[1], evidence: value.evidenceRecords![0], relationship: "Contextual", confidence: 0.8, createdBy: "researcher-1" }),
    ];
    value.evidenceRecords![0].linkedClaimIds = ["claim-1", "claim-2"];
    value.evidenceRecords![1].linkedClaimIds = ["claim-1"];
    value.claimEvidenceLinks = links;
    expect(links.filter((link) => link.claimId === "claim-1")).toHaveLength(2);
    expect(links.filter((link) => link.evidenceId === "evidence-1")).toHaveLength(2);
    expect(validateClaimEvidenceGraph(value)).toEqual([]);
    expect(upsertClaimEvidenceLink(links, { ...links[0], id: "new-id", confidence: 0.6 })).toHaveLength(3);
  });

  it("detects a missing evidence-to-claim backlink", () => {
    const value = project();
    value.claimEvidenceLinks = [createClaimEvidenceLink({ id: "edge-1", claim: value.claims[0], evidence: value.evidenceRecords![0], relationship: "Supports", confidence: 0.9, createdBy: "researcher-1" })];
    expect(validateClaimEvidenceGraph(value).map((issue) => issue.code)).toContain("BACKLINK_MISMATCH");
  });

  it("represents contradiction as an explicit edge and never auto-verifies it", () => {
    const value = project();
    const link = createClaimEvidenceLink({ id: "edge-c", claim: value.claims[0], evidence: value.evidenceRecords![0], relationship: "Contradicts", confidence: 0.95, createdBy: "researcher-1" });
    expect(link).toMatchObject({ relationship: "Contradicts", verificationState: "Unverified", approvalState: "Pending Review" });
    const reviewed = reviewClaimEvidenceLink(link, "Approved", "researcher-2", "Checked relationship", "2026-01-02");
    expect(reviewed).toMatchObject({ relationship: "Contradicts", verificationState: "Verified", approvalState: "Approved", reviewedBy: "researcher-2" });
  });

  it("traverses sentence to claim to evidence to source and exact page/passage", () => {
    const value = project();
    const sentence = createManuscriptSentenceClaimLink({ sentenceId: "sentence-1", sectionId: "sec-2", exactSentence: "A manuscript sentence.", claimId: "claim-1", createdBy: "researcher-1", createdAt: "2026-01-01" });
    value.manuscriptSentenceClaimLinks = [sentence];
    value.claimEvidenceLinks = [createClaimEvidenceLink({ id: "edge-1", claim: value.claims[0], evidence: value.evidenceRecords![0], relationship: "Supports", confidence: 0.9, createdBy: "researcher-1", manuscriptSentenceIds: [sentence.sentenceId] })];
    const trace = traceSentenceSupport(value, sentence.sentenceId);
    expect(trace).toHaveLength(1);
    expect(trace[0]).toMatchObject({ sentence: { exactSentence: "A manuscript sentence." }, claim: { id: "claim-1" }, evidence: { exactPassage: "Passage evidence-1", page: "5" }, source: { id: "source-1" } });
  });

  it("detects orphan, duplicate, invalid-confidence, broken-sentence and demo-contamination edges", () => {
    const value = project();
    value.claimEvidenceLinks = [
      { id: "bad-1", claimId: "missing", evidenceId: "missing", relationship: "Supports", confidence: 2, verificationState: "Unverified", approvalState: "Pending Review", manuscriptSentenceIds: ["missing-sentence"], createdBy: "x", createdAt: "x", updatedAt: "x", isDemo: true },
      { id: "bad-2", claimId: "missing", evidenceId: "missing", relationship: "Contradicts", confidence: 0.5, verificationState: "Unverified", approvalState: "Pending Review", manuscriptSentenceIds: [], createdBy: "x", createdAt: "x", updatedAt: "x" },
    ];
    expect(new Set(validateClaimEvidenceGraph(value).map((issue) => issue.code))).toEqual(new Set(["ORPHAN_CLAIM", "ORPHAN_EVIDENCE", "DUPLICATE_EDGE", "INVALID_CONFIDENCE", "BROKEN_SENTENCE_LINK", "DEMO_CONTAMINATION"]));
  });

  it("adapts legacy many-to-many links without inferring verification or approval", () => {
    const value = project();
    value.claims[0].linkedEvidence = [{ id: "evidence-1", sourceId: source.id, passageQuote: "Passage evidence-1", pageNumber: "5", createdAt: "2026-01-01", relationship: "Direct support" }];
    value.claims[1].linkedEvidence = [{ id: "evidence-1", sourceId: source.id, passageQuote: "Passage evidence-1", pageNumber: "5", createdAt: "2026-01-01", relationship: "Contradictory evidence" }];
    const links = adaptLegacyClaimEvidenceLinks(value);
    expect(links).toHaveLength(2);
    expect(links.map((link) => link.relationship)).toEqual(["Supports", "Contradicts"]);
    expect(links.every((link) => link.verificationState === "Unverified" && link.approvalState === "Pending Review")).toBe(true);
  });
});
