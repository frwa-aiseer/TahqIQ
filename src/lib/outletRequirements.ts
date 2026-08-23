import type { OutletRequirementField, OutletRequirementState, TargetOutlet, VersionedRequirementRecord } from "../types";

export const OUTLET_REQUIREMENT_FIELDS: readonly OutletRequirementField[] = [
  "articleType", "manuscriptWordLimit", "abstractWordLimit", "abstractStructure",
  "referenceStyle", "referenceLimit", "figureLimit", "tableLimit", "supplements",
  "titlePage", "authors", "aiPolicy", "ethics", "dataSharing", "apc",
  "conferenceDeadline", "conferenceTemplate", "conferenceFileRequirements",
];

export const OUTLET_REQUIREMENT_LABELS: Record<OutletRequirementField, string> = {
  articleType: "Article type", manuscriptWordLimit: "Manuscript limit", abstractWordLimit: "Abstract limit",
  abstractStructure: "Abstract structure", referenceStyle: "Reference style", referenceLimit: "Reference limit",
  figureLimit: "Figure limit", tableLimit: "Table limit", supplements: "Supplements", titlePage: "Title page",
  authors: "Author requirements", aiPolicy: "AI policy", ethics: "Ethics", dataSharing: "Data sharing",
  apc: "Article processing charge", conferenceDeadline: "Conference deadline",
  conferenceTemplate: "Conference template", conferenceFileRequirements: "Conference file requirements",
};

function isRealHttpsUrl(value: string | undefined): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    const blockedHosts = ["example.com", "example.org", "example.net", "localhost"];
    return url.protocol === "https:" && !blockedHosts.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
}

export function validateOutletRequirement(record: VersionedRequirementRecord): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  if (!OUTLET_REQUIREMENT_FIELDS.includes(record.field)) issues.push("Unsupported requirement field.");
  if (!["Verified", "AI Extracted—Needs Review", "Unverified", "Unavailable"].includes(record.state)) {
    issues.push("Unsupported requirement state.");
  }
  if (!["High", "Medium", "Low"].includes(record.confidence)) issues.push("Unsupported confidence value.");
  if (!Number.isInteger(record.version) || record.version < 1) issues.push("Requirement version must be a positive integer.");
  if (!Array.isArray(record.history)) issues.push("Requirement history is required.");
  if (record.state === "Verified") {
    if (!record.sourceProvider?.trim()) issues.push("Verified requirement requires a source provider.");
    if (!isRealHttpsUrl(record.sourceUrl)) issues.push("Verified requirement requires a real HTTPS source URL.");
    if (!record.retrievedAt?.trim()) issues.push("Verified requirement requires a retrieval date.");
    if (!record.humanConfirmed) issues.push("Verified requirement requires human confirmation.");
  }
  if (record.state === "AI Extracted—Needs Review" && record.humanConfirmed) {
    issues.push("AI-extracted requirement cannot be human confirmed before review.");
  }
  return { valid: issues.length === 0, issues };
}

export function getRequirementRecords(outlet: TargetOutlet): VersionedRequirementRecord[] {
  return Array.isArray(outlet.requirementsList) ? outlet.requirementsList : [];
}

export function getLatestRequirement(outlet: TargetOutlet, field: OutletRequirementField): VersionedRequirementRecord | undefined {
  return getRequirementRecords(outlet)
    .filter((record) => record.field === field)
    .sort((left, right) => right.version - left.version)[0];
}

export function getVerifiedRequirement(outlet: TargetOutlet, field: OutletRequirementField): VersionedRequirementRecord | undefined {
  const record = getLatestRequirement(outlet, field);
  return record?.state === "Verified" && validateOutletRequirement(record).valid ? record : undefined;
}

export function getRequirementDisplayState(outlet: TargetOutlet, field: OutletRequirementField): OutletRequirementState {
  const record = getLatestRequirement(outlet, field);
  if (!record) return "Unavailable";
  return validateOutletRequirement(record).valid ? record.state : "Unverified";
}

export function createRequirementVersion(
  previous: VersionedRequirementRecord | undefined,
  next: Omit<VersionedRequirementRecord, "id" | "version" | "history">
): VersionedRequirementRecord {
  const version = (previous?.version || 0) + 1;
  const recordedAt = new Date().toISOString();
  const history = [
    ...(previous?.history || []),
    ...(previous ? [{ version: previous.version, value: previous.value, state: previous.state, sourceProvider: previous.sourceProvider, sourceUrl: previous.sourceUrl, retrievedAt: previous.retrievedAt, recordedAt }] : []),
  ];
  return { ...next, id: previous?.id || `outlet-req-${next.field}-${Date.now()}`, version, history };
}

const LEGACY_FIELD_MAP: Record<string, OutletRequirementField | undefined> = {
  wordLimit: "manuscriptWordLimit", abstractWordLimit: "abstractWordLimit", citationStyle: "referenceStyle",
  figureTableLimit: "figureLimit", aiPolicySummary: "aiPolicy", apcFee: "apc", submissionDeadline: "conferenceDeadline",
};

export function normalizeOutletRequirements(value: unknown, forceUnverified = false): VersionedRequirementRecord[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((candidate, index) => {
    if (!candidate || typeof candidate !== "object") return [];
    const raw = candidate as Partial<VersionedRequirementRecord> & { field?: string };
    const field = OUTLET_REQUIREMENT_FIELDS.includes(raw.field as OutletRequirementField)
      ? raw.field as OutletRequirementField
      : LEGACY_FIELD_MAP[raw.field || ""];
    if (!field) return [];
    const record: VersionedRequirementRecord = {
      id: raw.id || `normalized-requirement-${index}`,
      field,
      value: raw.value ?? raw.extractedValue ?? null,
      state: forceUnverified ? "Unverified" : raw.state || "Unverified",
      sourceProvider: raw.sourceProvider,
      sourceUrl: raw.sourceUrl,
      retrievedAt: raw.retrievedAt,
      confidence: raw.confidence || "Low",
      humanConfirmed: forceUnverified ? false : raw.humanConfirmed === true,
      confirmedByUid: forceUnverified ? undefined : raw.confirmedByUid,
      confirmedByEmail: forceUnverified ? undefined : raw.confirmedByEmail,
      confirmedAt: forceUnverified ? undefined : raw.confirmedAt,
      version: raw.version && raw.version > 0 ? raw.version : 1,
      history: Array.isArray(raw.history) ? raw.history : [],
    };
    if (!validateOutletRequirement(record).valid && record.state === "Verified") {
      record.state = "Unverified";
      record.humanConfirmed = false;
    }
    return [record];
  });
}
