import type { OutletMetricRecord, OutletRequirementField, TargetOutlet } from "../types";
import { validateOutletIntegrity } from "../data/baselineOutlets";
import { buildOutletIntelligence, type OutletIntelligenceFact } from "./outletIntelligenceService";

export interface OutletMatchingConstraints {
  outletType?: TargetOutlet["type"];
  requiredIndexing?: string[];
  requireOpenAccess?: boolean;
}

export interface OutletMatchingInput {
  field: string;
  manuscriptType: string;
  abstract: string;
  keywords: string[];
  methodology: string;
  constraints?: OutletMatchingConstraints;
  limit?: number;
}

export interface OutletMatchReason {
  dimension: "field" | "manuscriptType" | "keywords" | "outletType" | "indexing";
  outcome: "Fit" | "Mismatch";
  explanation: string;
  sourceRecordId?: string;
  sourceUrl: string;
}

export interface OutletMatchMetric {
  id: string;
  provider: string;
  metricName: string;
  year: number;
  subjectCategory: string;
  value?: number | string;
  percentile?: number;
  quartile?: OutletMetricRecord["quartile"];
  sourceUrl: string;
  retrievedAt: string;
}

export interface OutletMatchRecommendation {
  outletId: string;
  outletTitle: string;
  fitScore: number;
  assessedWeight: number;
  fit: OutletMatchReason[];
  mismatch: OutletMatchReason[];
  provenance: {
    provider: string;
    sourceUrl: string;
    retrievedAt: string;
    verificationStatus: "Verified";
  };
  metrics: OutletMatchMetric[];
  missingOrUnverifiedFacts: string[];
}

export interface OutletMatchingResult {
  status: "Recommendations Generated" | "No Trusted Outlets Available";
  recommendations: OutletMatchRecommendation[];
  trustedOutletIds: string[];
  excludedOutletIds: string[];
  notice: string;
}

const tokenize = (value: string): string[] => [...new Set(value.toLowerCase().match(/[\p{L}\p{N}]+/gu) || [])]
  .filter((token) => token.length > 2);
const overlap = (left: string[], right: string[]) => left.filter((token) => right.includes(token));
const textValues = (fact: OutletIntelligenceFact | undefined): string[] => {
  if (!fact || fact.state !== "Verified") return [];
  return Array.isArray(fact.value) ? fact.value.map(String) : fact.value === null ? [] : [String(fact.value)];
};
const label = (field: OutletRequirementField): string => field.replace(/([A-Z])/g, " $1").toLowerCase();

function validateInput(input: OutletMatchingInput): void {
  if (!input || !input.field?.trim() || !input.manuscriptType?.trim() || !input.abstract?.trim() || !input.methodology?.trim()) {
    throw new Error("Field, manuscript type, abstract, and methodology are required.");
  }
  if (!Array.isArray(input.keywords) || input.keywords.length === 0 || input.keywords.some((item) => typeof item !== "string" || !item.trim())) {
    throw new Error("At least one non-empty keyword is required.");
  }
  if (input.limit !== undefined && (!Number.isInteger(input.limit) || input.limit < 1 || input.limit > 50)) {
    throw new Error("Recommendation limit must be an integer from 1 to 50.");
  }
  if (input.constraints?.requiredIndexing && (!Array.isArray(input.constraints.requiredIndexing) || input.constraints.requiredIndexing.some((item) => !item.trim()))) {
    throw new Error("Required indexing constraints must be non-empty strings.");
  }
}

function assessOutlet(outlet: TargetOutlet, input: OutletMatchingInput): OutletMatchRecommendation {
  const intelligence = buildOutletIntelligence(outlet);
  const identity = intelligence.identity!;
  const fit: OutletMatchReason[] = [];
  const mismatch: OutletMatchReason[] = [];
  const missing = new Set<string>();
  let earned = 0;
  let assessedWeight = 0;
  const add = (weight: number, matched: boolean, reason: Omit<OutletMatchReason, "outcome">) => {
    assessedWeight += weight;
    if (matched) earned += weight;
    (matched ? fit : mismatch).push({ ...reason, outcome: matched ? "Fit" : "Mismatch" });
  };

  const identityTokens = tokenize(`${identity.subjectCategory} ${identity.title}`);
  const fieldMatches = overlap(tokenize(input.field), identityTokens);
  add(35, fieldMatches.length > 0, {
    dimension: "field",
    explanation: fieldMatches.length ? `Field terms matched verified outlet identity: ${fieldMatches.join(", ")}.` : "No field-term overlap was found in the verified outlet identity.",
    sourceUrl: identity.sourceUrl,
  });

  const contentMatches = overlap(tokenize(`${input.abstract} ${input.keywords.join(" ")}`), identityTokens);
  add(20, contentMatches.length > 0, {
    dimension: "keywords",
    explanation: contentMatches.length ? `Abstract/keyword terms matched verified outlet identity: ${contentMatches.join(", ")}.` : "No abstract/keyword overlap was found in the verified outlet identity.",
    sourceUrl: identity.sourceUrl,
  });

  const articleType = intelligence.articleTypes.find((fact) => fact.field === "articleType");
  const supportedTypes = textValues(articleType);
  if (supportedTypes.length && articleType?.sourceUrl) {
    const requested = tokenize(input.manuscriptType);
    const matched = supportedTypes.some((item) => overlap(requested, tokenize(item)).length > 0);
    add(25, matched, {
      dimension: "manuscriptType",
      explanation: matched ? "Requested manuscript type overlaps a verified supported article type." : "Requested manuscript type does not overlap the verified supported article types.",
      sourceRecordId: articleType.recordId, sourceUrl: articleType.sourceUrl,
    });
  } else missing.add("Article types: Missing or Unverified");

  if (input.constraints?.outletType) {
    add(10, outlet.type === input.constraints.outletType, {
      dimension: "outletType", explanation: outlet.type === input.constraints.outletType ? "Verified outlet type meets the user constraint." : "Verified outlet type does not meet the user constraint.",
      sourceUrl: identity.sourceUrl,
    });
  }

  const requiredIndexing = input.constraints?.requiredIndexing || [];
  if (requiredIndexing.length) {
    const verifiedIndexing = intelligence.indexing.filter((item) => item.verificationState === "Verified");
    if (!verifiedIndexing.length) missing.add("Indexing: Missing or Unverified");
    else {
      const indexedNames = verifiedIndexing.map((item) => item.indexName.toLowerCase());
      const absent = requiredIndexing.filter((required) => !indexedNames.includes(required.toLowerCase()));
      add(10, absent.length === 0, {
        dimension: "indexing", explanation: absent.length ? `Verified indexing does not establish: ${absent.join(", ")}.` : "All required indexes have verified records.",
        sourceRecordId: verifiedIndexing[0].id, sourceUrl: verifiedIndexing[0].sourceUrl,
      });
    }
  }

  if (input.constraints?.requireOpenAccess) missing.add("Open-access model: Missing or Unverified");
  missing.add("Methodology scope: Missing or Unverified");
  if (!intelligence.metrics.length) missing.add("Metrics with provider/year/category: Missing or Unverified");
  for (const section of [intelligence.formatting, intelligence.guidelines, intelligence.policies, intelligence.conference]) {
    section.filter((fact) => fact.state !== "Verified").forEach((fact) => missing.add(`${label(fact.field)}: ${fact.state}`));
  }

  return {
    outletId: outlet.id, outletTitle: outlet.title,
    fitScore: assessedWeight ? Math.round((earned / assessedWeight) * 100) : 0,
    assessedWeight, fit, mismatch,
    provenance: { provider: identity.sourceProvider, sourceUrl: identity.sourceUrl, retrievedAt: identity.retrievedAt, verificationStatus: "Verified" },
    metrics: intelligence.metrics.map(({ id, provider, metricName, year, subjectCategory, value, percentile, quartile, sourceUrl, retrievedAt }) => ({ id, provider, metricName, year, subjectCategory, value, percentile, quartile, sourceUrl, retrievedAt })),
    missingOrUnverifiedFacts: [...missing].sort(),
  };
}

/** Deterministic trusted-catalogue matcher; it never creates or upgrades outlet records. */
export function matchOutlets(input: OutletMatchingInput, catalogue: readonly TargetOutlet[]): OutletMatchingResult {
  validateInput(input);
  const seen = new Set<string>();
  const trusted: TargetOutlet[] = [];
  const excludedOutletIds: string[] = [];
  for (const outlet of catalogue) {
    if (!outlet?.id?.trim() || seen.has(outlet.id)) {
      if (outlet?.id) excludedOutletIds.push(outlet.id);
      continue;
    }
    seen.add(outlet.id);
    if (validateOutletIntegrity(outlet).isVerified) trusted.push(outlet);
    else excludedOutletIds.push(outlet.id);
  }
  const recommendations = trusted.map((outlet) => assessOutlet(outlet, input))
    .sort((left, right) => right.fitScore - left.fitScore || left.outletId.localeCompare(right.outletId))
    .slice(0, input.limit || 10);
  return {
    status: trusted.length ? "Recommendations Generated" : "No Trusted Outlets Available",
    recommendations, trustedOutletIds: trusted.map((outlet) => outlet.id), excludedOutletIds,
    notice: "Recommendations are deterministic comparisons against verified catalogue facts, not acceptance predictions or outlet endorsements.",
  };
}
