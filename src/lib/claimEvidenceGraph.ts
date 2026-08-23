import type {
  ClaimEvidenceLink,
  ClaimEvidenceRelationship,
  ClaimItem,
  EvidenceRecord,
  ManuscriptSentenceClaimLink,
  ProjectState,
  SourceRecord,
} from "../types";

export interface CreateClaimEvidenceLinkInput {
  id: string;
  claim: ClaimItem;
  evidence: EvidenceRecord;
  relationship: ClaimEvidenceRelationship;
  confidence: number;
  createdBy: string;
  createdAt?: string;
  manuscriptSentenceIds?: string[];
}

export function createClaimEvidenceLink(input: CreateClaimEvidenceLinkInput): ClaimEvidenceLink {
  if (!input.claim?.id || !input.evidence?.evidenceId) throw new Error("Claim and evidence are required.");
  if (!input.createdBy.trim()) throw new Error("Link creator identity is required.");
  if (!Number.isFinite(input.confidence) || input.confidence < 0 || input.confidence > 1) {
    throw new Error("Link confidence must be between 0 and 1.");
  }
  const timestamp = input.createdAt || new Date().toISOString();
  return {
    id: input.id,
    claimId: input.claim.id,
    evidenceId: input.evidence.evidenceId,
    relationship: input.relationship,
    confidence: input.confidence,
    verificationState: "Unverified",
    approvalState: "Pending Review",
    manuscriptSentenceIds: [...new Set((input.manuscriptSentenceIds || []).filter(Boolean))],
    createdBy: input.createdBy.trim(),
    createdAt: timestamp,
    updatedAt: timestamp,
    isDemo: Boolean(input.claim.isDemo || input.evidence.isDemo),
    isSynthetic: Boolean(input.claim.isSynthetic || input.evidence.isSynthetic),
  };
}

export function upsertClaimEvidenceLink(
  links: ClaimEvidenceLink[],
  link: ClaimEvidenceLink
): ClaimEvidenceLink[] {
  const duplicate = links.find((item) => item.claimId === link.claimId && item.evidenceId === link.evidenceId);
  if (!duplicate) return [...links, link];
  return links.map((item) => item.id === duplicate.id ? { ...link, id: duplicate.id, createdAt: duplicate.createdAt } : item);
}

export function reviewClaimEvidenceLink(
  link: ClaimEvidenceLink,
  decision: "Approved" | "Rejected",
  reviewedBy: string,
  rationale: string,
  reviewedAt = new Date().toISOString()
): ClaimEvidenceLink {
  if (!reviewedBy.trim()) throw new Error("Researcher identity is required to review a claim–evidence link.");
  if (!rationale.trim()) throw new Error("Claim–evidence review rationale is required.");
  return {
    ...link,
    verificationState: decision === "Approved" ? "Verified" : "Rejected",
    approvalState: decision,
    reviewedBy: reviewedBy.trim(),
    reviewedAt,
    reviewRationale: rationale.trim(),
    updatedAt: reviewedAt,
  };
}

export interface GraphIntegrityIssue {
  code: "ORPHAN_CLAIM" | "ORPHAN_EVIDENCE" | "ORPHAN_SOURCE" | "DUPLICATE_EDGE" | "INVALID_CONFIDENCE" | "BROKEN_SENTENCE_LINK" | "BACKLINK_MISMATCH" | "DEMO_CONTAMINATION";
  linkId: string;
  message: string;
}

export function validateClaimEvidenceGraph(project: ProjectState): GraphIntegrityIssue[] {
  const claims = new Set((project.claims || []).map((claim) => claim.id));
  const evidence = new Map((project.evidenceRecords || []).map((record) => [record.evidenceId, record]));
  const sources = new Set((project.sources || []).map((source) => source.id));
  const sentences = new Set((project.manuscriptSentenceClaimLinks || []).map((link) => link.sentenceId));
  const seen = new Set<string>();
  const issues: GraphIntegrityIssue[] = [];

  for (const link of project.claimEvidenceLinks || []) {
    if (!claims.has(link.claimId)) issues.push({ code: "ORPHAN_CLAIM", linkId: link.id, message: `Claim ${link.claimId} is missing.` });
    const record = evidence.get(link.evidenceId);
    if (!record) issues.push({ code: "ORPHAN_EVIDENCE", linkId: link.id, message: `Evidence ${link.evidenceId} is missing.` });
    else {
      if (!sources.has(record.sourceId)) issues.push({ code: "ORPHAN_SOURCE", linkId: link.id, message: `Source ${record.sourceId} is missing.` });
      if (!record.linkedClaimIds.includes(link.claimId)) issues.push({ code: "BACKLINK_MISMATCH", linkId: link.id, message: `Evidence ${record.evidenceId} does not link back to claim ${link.claimId}.` });
    }
    const pair = `${link.claimId}:${link.evidenceId}`;
    if (seen.has(pair)) issues.push({ code: "DUPLICATE_EDGE", linkId: link.id, message: `Duplicate claim–evidence edge ${pair}.` });
    seen.add(pair);
    if (!Number.isFinite(link.confidence) || link.confidence < 0 || link.confidence > 1) {
      issues.push({ code: "INVALID_CONFIDENCE", linkId: link.id, message: "Confidence must be between 0 and 1." });
    }
    for (const sentenceId of link.manuscriptSentenceIds) {
      if (!sentences.has(sentenceId)) issues.push({ code: "BROKEN_SENTENCE_LINK", linkId: link.id, message: `Sentence ${sentenceId} is missing.` });
    }
    if (!project.isDemoProject && (link.isDemo || link.isSynthetic || record?.isDemo || record?.isSynthetic)) {
      issues.push({ code: "DEMO_CONTAMINATION", linkId: link.id, message: "Demo/synthetic evidence cannot enter a real-project graph." });
    }
  }
  return issues;
}

export interface SentenceEvidenceTraversal {
  sentence: ManuscriptSentenceClaimLink;
  claim: ClaimItem;
  link: ClaimEvidenceLink;
  evidence: EvidenceRecord;
  source: SourceRecord;
}

/** Sentence → claim → evidence edge → passage evidence → bibliographic source. */
export function traceSentenceSupport(project: ProjectState, sentenceId: string): SentenceEvidenceTraversal[] {
  const sentenceLinks = (project.manuscriptSentenceClaimLinks || []).filter((item) => item.sentenceId === sentenceId);
  const results: SentenceEvidenceTraversal[] = [];
  for (const sentence of sentenceLinks) {
    const claim = (project.claims || []).find((item) => item.id === sentence.claimId);
    if (!claim) continue;
    for (const link of (project.claimEvidenceLinks || []).filter((item) => item.claimId === claim.id && item.manuscriptSentenceIds.includes(sentenceId))) {
      const evidence = (project.evidenceRecords || []).find((item) => item.evidenceId === link.evidenceId);
      const source = evidence && (project.sources || []).find((item) => item.id === evidence.sourceId);
      if (evidence && source) results.push({ sentence, claim, link, evidence, source });
    }
  }
  return results;
}

export function createManuscriptSentenceClaimLink(input: ManuscriptSentenceClaimLink): ManuscriptSentenceClaimLink {
  if (!input.sentenceId || !input.sectionId || !input.claimId || !input.exactSentence.trim()) {
    throw new Error("Sentence ID, section ID, exact sentence, and claim ID are required.");
  }
  if (!input.createdBy.trim()) throw new Error("Sentence-link creator identity is required.");
  return { ...input, exactSentence: input.exactSentence.trim(), createdBy: input.createdBy.trim() };
}

function legacyRelationship(value: string | undefined): ClaimEvidenceRelationship {
  if (value === "Contradictory evidence" || value === "No support identified") return "Contradicts";
  if (value === "Partial support") return "Partially Supports";
  if (value === "Contextual support") return "Contextual";
  return "Supports";
}

/** Makes legacy inline links traversable without inferring verification or approval. */
export function adaptLegacyClaimEvidenceLinks(project: ProjectState): ClaimEvidenceLink[] {
  const evidenceIds = new Set((project.evidenceRecords || []).map((record) => record.evidenceId));
  const existing = [...(project.claimEvidenceLinks || [])];
  const pairs = new Set(existing.map((link) => `${link.claimId}:${link.evidenceId}`));
  for (const claim of project.claims || []) {
    for (const legacy of claim.linkedEvidence || []) {
      const evidenceId = legacy.evidenceRecordId || legacy.id;
      const pair = `${claim.id}:${evidenceId}`;
      if (!evidenceIds.has(evidenceId) || pairs.has(pair)) continue;
      const timestamp = legacy.createdAt || project.updatedAt || "Not available";
      existing.push({
        id: `edge-${claim.id}-${evidenceId}`,
        claimId: claim.id,
        evidenceId,
        relationship: legacyRelationship(legacy.relationship || claim.evidenceRelationship),
        confidence: 1,
        verificationState: "Unverified",
        approvalState: "Pending Review",
        manuscriptSentenceIds: [],
        createdBy: "Not available",
        createdAt: timestamp,
        updatedAt: timestamp,
        isDemo: Boolean(project.isDemoProject || claim.isDemo),
        isSynthetic: Boolean(project.isDemoProject || claim.isSynthetic),
      });
      pairs.add(pair);
    }
  }
  return existing;
}

export function hydrateProjectClaimEvidenceGraph(project: ProjectState): ProjectState {
  return { ...project, claimEvidenceLinks: adaptLegacyClaimEvidenceLinks(project) };
}
