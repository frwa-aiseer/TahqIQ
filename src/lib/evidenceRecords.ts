import type { EvidenceRecord, ProjectState, SourceRecord } from "../types";

export interface CreateEvidenceRecordInput {
  evidenceId: string;
  source: SourceRecord;
  exactPassage: string;
  page?: string;
  section?: string;
  paragraphOrChunkRef?: string;
  extractionMethod: EvidenceRecord["extractionMethod"];
  extractedBy: string;
  confidence: number;
  linkedClaimIds: string[];
  createdAt?: string;
}

function normalized(value?: string): string | undefined {
  const result = value?.trim();
  return result ? result : undefined;
}

export function hasConcreteEvidenceLocation(record: Pick<EvidenceRecord, "page" | "section" | "paragraphOrChunkRef">): boolean {
  return Boolean(normalized(record.page) || normalized(record.section) || normalized(record.paragraphOrChunkRef));
}

export function createEvidenceRecord(input: CreateEvidenceRecordInput): EvidenceRecord {
  const exactPassage = normalized(input.exactPassage);
  const extractedBy = normalized(input.extractedBy);
  if (!exactPassage) throw new Error("Exact passage text is required.");
  if (!extractedBy) throw new Error("Evidence extractor identity is required.");
  if (!hasConcreteEvidenceLocation(input)) throw new Error("A page, section, or paragraph/chunk reference is required.");
  if (!Number.isFinite(input.confidence) || input.confidence < 0 || input.confidence > 1) {
    throw new Error("Evidence confidence must be between 0 and 1.");
  }

  const timestamp = input.createdAt || new Date().toISOString();
  return {
    evidenceId: input.evidenceId,
    sourceId: input.source.id,
    documentVersion: normalized(input.source.documentVersion) || "Not available",
    documentHash: normalized(input.source.documentHash) || "Not available",
    exactPassage,
    ...(normalized(input.page) ? { page: normalized(input.page) } : {}),
    ...(normalized(input.section) ? { section: normalized(input.section) } : {}),
    ...(normalized(input.paragraphOrChunkRef) ? { paragraphOrChunkRef: normalized(input.paragraphOrChunkRef) } : {}),
    extractionMethod: input.extractionMethod,
    extractedBy,
    confidence: input.confidence,
    verification: "Needs Review",
    researcherReview: { status: "Pending" },
    linkedClaimIds: [...new Set(input.linkedClaimIds.filter(Boolean))],
    createdAt: timestamp,
    updatedAt: timestamp,
    isDemo: Boolean(input.source.isDemo),
    isSynthetic: Boolean(input.source.isSynthetic),
  };
}

export function reviewEvidenceRecord(
  record: EvidenceRecord,
  decision: "Verified" | "Rejected",
  reviewedBy: string,
  notes: string,
  reviewedAt = new Date().toISOString()
): EvidenceRecord {
  if (!normalized(reviewedBy)) throw new Error("Researcher identity is required to review evidence.");
  if (!normalized(notes)) throw new Error("Researcher review notes are required.");
  return {
    ...record,
    verification: decision === "Verified" ? "Researcher Verified" : "Rejected",
    researcherReview: { status: decision, reviewedBy: reviewedBy.trim(), reviewedAt, notes: notes.trim() },
    updatedAt: reviewedAt,
  };
}

function isTraceableLegacyLocation(page?: string | number, section?: string, chunk?: string): boolean {
  return Boolean(String(page || "").trim() || normalized(section) || normalized(chunk));
}

/** Non-destructively projects traceable legacy passage fields into the canonical collection. */
export function adaptLegacyEvidenceRecords(project: ProjectState): EvidenceRecord[] {
  const existing = new Map((project.evidenceRecords || []).map((record) => [record.evidenceId, record]));

  for (const source of project.sources || []) {
    for (const passage of source.extractedPassages || []) {
      if (existing.has(passage.id) || !normalized(passage.text) || !isTraceableLegacyLocation(passage.pageNumber, passage.section)) continue;
      const timestamp = source.verificationDate || source.provenance?.retrievedAt || project.updatedAt || "Not available";
      existing.set(passage.id, {
        evidenceId: passage.id,
        sourceId: source.id,
        documentVersion: source.documentVersion || "Not available",
        documentHash: source.documentHash || "Not available",
        exactPassage: passage.text.trim(),
        ...(passage.pageNumber ? { page: String(passage.pageNumber) } : {}),
        ...(passage.section ? { section: passage.section } : {}),
        extractionMethod: "Imported",
        extractedBy: "Not available",
        confidence: Math.min(1, Math.max(0, passage.confidence)),
        verification: passage.isVerifiedByHuman ? "Researcher Verified" : "Needs Review",
        researcherReview: { status: passage.isVerifiedByHuman ? "Verified" : "Pending" },
        linkedClaimIds: [],
        createdAt: timestamp,
        updatedAt: timestamp,
        isDemo: Boolean(project.isDemoProject || source.isDemo),
        isSynthetic: Boolean(project.isDemoProject || source.isSynthetic),
      });
    }
  }

  for (const claim of project.claims || []) {
    for (const evidence of claim.linkedEvidence || []) {
      const evidenceId = evidence.evidenceRecordId || evidence.id;
      if (existing.has(evidenceId) || !normalized(evidence.passageQuote) || !isTraceableLegacyLocation(evidence.pageNumber, evidence.sectionName, evidence.paragraphNumber)) continue;
      const source = (project.sources || []).find((item) => item.id === evidence.sourceId);
      existing.set(evidenceId, {
        evidenceId,
        sourceId: evidence.sourceId,
        documentVersion: source?.documentVersion || "Not available",
        documentHash: source?.documentHash || "Not available",
        exactPassage: evidence.passageQuote.trim(),
        ...(evidence.pageNumber ? { page: evidence.pageNumber } : {}),
        ...(evidence.sectionName ? { section: evidence.sectionName } : {}),
        ...(evidence.paragraphNumber ? { paragraphOrChunkRef: evidence.paragraphNumber } : {}),
        extractionMethod: "Researcher Selected",
        extractedBy: "Not available",
        confidence: 1,
        verification: claim.isResearcherApproved ? "Researcher Verified" : "Needs Review",
        researcherReview: { status: claim.isResearcherApproved ? "Verified" : "Pending" },
        linkedClaimIds: [claim.id],
        createdAt: evidence.createdAt || project.updatedAt || "Not available",
        updatedAt: evidence.createdAt || project.updatedAt || "Not available",
        isDemo: Boolean(project.isDemoProject || source?.isDemo || claim.isDemo),
        isSynthetic: Boolean(project.isDemoProject || source?.isSynthetic || claim.isSynthetic),
      });
    }
  }
  return [...existing.values()];
}

export function hydrateProjectEvidenceRecords(project: ProjectState): ProjectState {
  return { ...project, evidenceRecords: adaptLegacyEvidenceRecords(project) };
}
