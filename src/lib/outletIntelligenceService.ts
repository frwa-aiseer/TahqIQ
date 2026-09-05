import type {
  OutletIndexingRecord,
  OutletMetricRecord,
  OutletRequirementField,
  OutletRequirementState,
  TargetOutlet,
  VersionedRequirementRecord,
} from "../types";
import { validateOutletIntegrity } from "../data/baselineOutlets";
import { getVerifiedOutletMetrics } from "./outletMetrics";
import {
  OUTLET_REQUIREMENT_FIELDS,
  getLatestRequirement,
  validateOutletRequirement,
} from "./outletRequirements";

export type OutletIntelligenceSection =
  | "articleTypes"
  | "formatting"
  | "guidelines"
  | "policies"
  | "conference";

export interface OutletIntelligenceFact {
  field: OutletRequirementField;
  value: VersionedRequirementRecord["value"];
  state: OutletRequirementState;
  sourceProvider?: string;
  sourceUrl?: string;
  retrievedAt?: string;
  recordId?: string;
}

export interface OutletIdentityIntelligence {
  id: string;
  title: string;
  type: TargetOutlet["type"];
  issnOrAcronym: string;
  publisherOrSociety: string;
  subjectCategory: string;
  officialUrl: string;
  sourceProvider: string;
  sourceUrl: string;
  retrievedAt: string;
  state: "Verified";
}

export interface OutletIntelligenceReport {
  outletId: string;
  identity?: OutletIdentityIntelligence;
  identityState: "Verified" | "Unverified";
  indexing: OutletIndexingRecord[];
  metrics: OutletMetricRecord[];
  articleTypes: OutletIntelligenceFact[];
  formatting: OutletIntelligenceFact[];
  guidelines: OutletIntelligenceFact[];
  policies: OutletIntelligenceFact[];
  conference: OutletIntelligenceFact[];
  warnings: string[];
}

const SECTION_FIELDS: Record<OutletIntelligenceSection, readonly OutletRequirementField[]> = {
  articleTypes: ["articleType"],
  formatting: ["manuscriptWordLimit", "abstractWordLimit", "abstractStructure", "referenceStyle", "referenceLimit", "figureLimit", "tableLimit"],
  guidelines: ["supplements", "titlePage", "authors"],
  policies: ["aiPolicy", "ethics", "dataSharing", "apc"],
  conference: ["conferenceDeadline", "conferenceTemplate", "conferenceFileRequirements"],
};

function isSourcedHttps(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && !["example.com", "example.org", "example.net", "localhost"].some(
      (host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`),
    );
  } catch {
    return false;
  }
}

export function validateOutletIndexingRecord(record: OutletIndexingRecord): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  if (!record.id?.trim() || !record.indexName?.trim() || !record.provider?.trim()) issues.push("Indexing identity and provider are required.");
  if (!isSourcedHttps(record.sourceUrl)) issues.push("Indexing claim requires a real HTTPS source URL.");
  if (!record.retrievedAt?.trim()) issues.push("Indexing claim requires a retrieval timestamp.");
  if (record.verificationState === "Verified" && (!record.humanConfirmed || !record.confirmedByUid?.trim() || !record.confirmedAt?.trim())) {
    issues.push("Verified indexing requires attributable human confirmation.");
  }
  if (record.verificationState === "AI Extracted—Needs Review" && record.humanConfirmed) {
    issues.push("AI-extracted indexing cannot be human confirmed before review.");
  }
  return { valid: issues.length === 0, issues };
}

function requirementFact(outlet: TargetOutlet, field: OutletRequirementField): OutletIntelligenceFact {
  const record = getLatestRequirement(outlet, field);
  if (!record) return { field, value: null, state: "Unavailable" };
  const validation = validateOutletRequirement(record);
  const hasSource = Boolean(record.sourceProvider?.trim() && isSourcedHttps(record.sourceUrl) && record.retrievedAt?.trim());
  if (!validation.valid || !hasSource) return { field, value: null, state: "Unverified", recordId: record.id };
  return {
    field,
    value: record.value,
    state: record.state,
    sourceProvider: record.sourceProvider,
    sourceUrl: record.sourceUrl,
    retrievedAt: record.retrievedAt,
    recordId: record.id,
  };
}

/**
 * Deterministically combines independently sourced outlet facts. It never reads
 * legacy top-level indexing, formatting, policy, fee, or deadline fields as facts.
 * AI-extracted official text remains visibly in Needs Review state.
 */
export function buildOutletIntelligence(outlet: TargetOutlet): OutletIntelligenceReport {
  const integrity = validateOutletIntegrity(outlet);
  const warnings = [...integrity.issues];
  const indexing = (outlet.indexingRecords || []).filter((record) => {
    const validation = validateOutletIndexingRecord(record);
    if (!validation.valid || !["Verified", "AI Extracted—Needs Review"].includes(record.verificationState)) {
      warnings.push(...validation.issues.map((issue) => `Indexing ${record.id || "record"}: ${issue}`));
      return false;
    }
    return true;
  });

  const report: OutletIntelligenceReport = {
    outletId: outlet.id,
    identityState: integrity.isVerified ? "Verified" : "Unverified",
    indexing,
    metrics: getVerifiedOutletMetrics(outlet),
    articleTypes: [], formatting: [], guidelines: [], policies: [], conference: [],
    warnings,
  };
  if (integrity.isVerified) {
    report.identity = {
      id: outlet.id, title: outlet.title, type: outlet.type, issnOrAcronym: outlet.issnOrAcronym,
      publisherOrSociety: outlet.publisherOrSociety, subjectCategory: outlet.subjectCategory,
      officialUrl: outlet.officialUrl, sourceProvider: outlet.provenanceProvider!,
      sourceUrl: outlet.identitySourceUrl!, retrievedAt: outlet.identityRetrievedAt!, state: "Verified",
    };
  }
  for (const section of Object.keys(SECTION_FIELDS) as OutletIntelligenceSection[]) {
    report[section] = SECTION_FIELDS[section].map((field) => requirementFact(outlet, field));
  }
  return report;
}

export const OUTLET_INTELLIGENCE_FIELDS = OUTLET_REQUIREMENT_FIELDS;
