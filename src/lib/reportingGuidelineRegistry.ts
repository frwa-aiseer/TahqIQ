import type { ReportingChecklistItem, ReportingGuideline } from "../types";

export interface ReportingGuidelineDefinition {
  id: string; name: string; version: string; officialUrl: string; studyTypePatterns: RegExp[];
  checklistTemplate: Array<Pick<ReportingChecklistItem, "itemNumber" | "sectionOrTopic" | "description">>;
}
export interface ReportingGuidelineResolution {
  status: "Suggested—Needs Researcher Review" | "Not configured";
  studyType: string; guideline?: ReportingGuideline; reason: string; consideredRegistryIds: string[];
}
const template = (description: string): ReportingGuidelineDefinition["checklistTemplate"] => [
  { itemNumber: "registry", sectionOrTopic: "Official checklist", description },
];

/** Extensible sourced registry. Template items begin Required, never completed. */
export const REPORTING_GUIDELINE_REGISTRY: readonly ReportingGuidelineDefinition[] = [
  { id: "consort", name: "CONSORT", version: "Current official checklist", officialUrl: "https://www.consort-statement.org/", studyTypePatterns: [/randomi[sz]ed controlled trial/i, /randomi[sz]ed trial/i], checklistTemplate: template("Review the current official CONSORT checklist against the manuscript.") },
  { id: "strobe", name: "STROBE", version: "Current official checklist", officialUrl: "https://www.strobe-statement.org/checklists/", studyTypePatterns: [/observational/i, /cohort study/i, /case-control study/i, /cross-sectional study/i], checklistTemplate: template("Review the applicable official STROBE checklist against the manuscript.") },
  { id: "prisma", name: "PRISMA", version: "PRISMA 2020", officialUrl: "https://www.prisma-statement.org/prisma-2020", studyTypePatterns: [/systematic review/i, /meta-analysis/i], checklistTemplate: template("Review the official PRISMA 2020 checklist against the review.") },
  { id: "prisma-scr", name: "PRISMA-ScR", version: "Official extension", officialUrl: "https://www.prisma-statement.org/scoping", studyTypePatterns: [/scoping review/i], checklistTemplate: template("Review the official PRISMA-ScR checklist against the scoping review.") },
  { id: "stard", name: "STARD", version: "Current official checklist", officialUrl: "https://www.equator-network.org/reporting-guidelines/stard/", studyTypePatterns: [/diagnostic(?:-accuracy)? study/i, /diagnostic accuracy/i], checklistTemplate: template("Review the current official STARD checklist against the diagnostic-accuracy study.") },
  { id: "tripod", name: "TRIPOD", version: "Current official guidance", officialUrl: "https://www.tripod-statement.org/", studyTypePatterns: [/clinical prediction model/i, /diagnostic prediction model/i, /prognostic prediction model/i], checklistTemplate: template("Review the applicable official TRIPOD guidance against the prediction-model study.") },
  { id: "coreq", name: "COREQ", version: "Current official checklist", officialUrl: "https://www.equator-network.org/reporting-guidelines/coreq/", studyTypePatterns: [/qualitative research/i, /qualitative study/i, /interview study/i, /focus group study/i], checklistTemplate: template("Review the official COREQ checklist when interviews or focus groups are the applicable qualitative method.") },
  { id: "arrive", name: "ARRIVE", version: "ARRIVE 2.0", officialUrl: "https://arriveguidelines.org/arrive-guidelines", studyTypePatterns: [/animal research/i, /in vivo animal/i], checklistTemplate: template("Review the official ARRIVE 2.0 checklist against the in-vivo animal research.") },
  { id: "care", name: "CARE", version: "Current official checklist", officialUrl: "https://www.care-statement.org/checklist", studyTypePatterns: [/case report/i], checklistTemplate: template("Review the current official CARE checklist against the case report.") },
];
const NON_CLINICAL_WITHOUT_UNIVERSAL_CHECKLIST = /engineering|computational|machine[- ]learning|software|simulation/i;

export function resolveReportingGuideline(studyType: string): ReportingGuidelineResolution {
  const normalized = studyType?.trim();
  if (!normalized || /researcher input required|custom scholarly project/i.test(normalized)) return {
    status: "Not configured", studyType: normalized || "Researcher input required",
    reason: "A sufficiently specific study type is required before suggesting a reporting guideline.", consideredRegistryIds: [],
  };
  const matches = REPORTING_GUIDELINE_REGISTRY.filter((entry) => entry.studyTypePatterns.some((pattern) => pattern.test(normalized)));
  if (matches.length !== 1) return {
    status: "Not configured", studyType: normalized,
    reason: NON_CLINICAL_WITHOUT_UNIVERSAL_CHECKLIST.test(normalized)
      ? "No universal reporting checklist is configured for this non-clinical study type; researcher selection is required."
      : "No unique reporting guideline could be resolved; researcher selection is required.",
    consideredRegistryIds: matches.map((entry) => entry.id),
  };
  const definition = matches[0];
  const guideline: ReportingGuideline = {
    registryId: definition.id, name: definition.name, version: definition.version, officialUrl: definition.officialUrl,
    applicableStudyType: normalized, recommendationStatus: "Suggested—Needs Researcher Review",
    recommendationReason: `Study-type pattern matched ${definition.name}; a researcher must confirm applicability.`,
    checklistItems: definition.checklistTemplate.map((item, index) => ({ id: `${definition.id}-template-${index + 1}`, ...item, status: "Required" })),
  };
  return { status: "Suggested—Needs Researcher Review", studyType: normalized, guideline, reason: guideline.recommendationReason!, consideredRegistryIds: [definition.id] };
}

export function confirmReportingGuideline(guideline: ReportingGuideline, actor: { uid: string; email: string }): ReportingGuideline {
  if (guideline.recommendationStatus !== "Suggested—Needs Researcher Review" || !actor.uid?.trim() || !actor.email?.trim()) throw new Error("A review-required guideline and attributable researcher are required.");
  return { ...guideline, recommendationStatus: "Researcher Confirmed" };
}

export function assessReportingChecklistItem(
  guideline: ReportingGuideline, itemId: string,
  assessment: Pick<ReportingChecklistItem, "status" | "manuscriptLocation" | "researcherComment" | "evidenceArtifactIds">,
  actor: { uid: string }, availableEvidenceArtifactIds: ReadonlySet<string>, now = () => new Date().toISOString(),
): ReportingGuideline {
  if (guideline.recommendationStatus !== "Researcher Confirmed" || !actor.uid?.trim()) throw new Error("Researcher-confirmed guidance and an attributable assessor are required.");
  if (!guideline.checklistItems.some((candidate) => candidate.id === itemId)) throw new Error("Checklist item was not found.");
  const evidenceIds = assessment.evidenceArtifactIds || [];
  if (["Addressed", "Partially addressed"].includes(assessment.status)) {
    if (!assessment.manuscriptLocation?.trim() || evidenceIds.length === 0) throw new Error("Addressed checklist items require a manuscript location and evidence artifact IDs.");
    if (evidenceIds.some((id) => !availableEvidenceArtifactIds.has(id))) throw new Error("Checklist assessment cites an unavailable evidence artifact.");
  }
  if (assessment.status === "Not applicable" && !assessment.researcherComment?.trim()) throw new Error("Not-applicable decisions require a researcher rationale.");
  return { ...guideline, checklistItems: guideline.checklistItems.map((candidate) => candidate.id === itemId ? {
    ...candidate, ...assessment, evidenceArtifactIds: evidenceIds, assessedByUid: actor.uid, assessedAt: now(),
  } : candidate) };
}

export function isEvidenceBackedChecklistItem(item: ReportingChecklistItem): boolean {
  return item.status === "Addressed" && Boolean(item.manuscriptLocation?.trim()) && Boolean(item.evidenceArtifactIds?.length) && Boolean(item.assessedByUid?.trim()) && Boolean(item.assessedAt?.trim());
}
