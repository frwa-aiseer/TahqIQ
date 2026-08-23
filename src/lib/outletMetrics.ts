import type { OutletMetricRecord, OutletMetricProviderKind, TargetOutlet } from "../types";

const PROVIDER_HOSTS: Partial<Record<OutletMetricProviderKind, string[]>> = {
  JCR: ["clarivate.com"],
  SCOPUS: ["scopus.com", "elsevier.com"],
  SCIMAGO: ["scimagojr.com"],
};

export interface OutletMetricValidation {
  valid: boolean;
  issues: string[];
}

export function validateOutletMetricRecord(record: OutletMetricRecord): OutletMetricValidation {
  const issues: string[] = [];
  if (!record.id?.trim() || !record.provider?.trim() || !record.metricName?.trim()) issues.push("Metric identity/provider/name is incomplete.");
  if (!Number.isInteger(record.year) || record.year < 1900 || record.year > new Date().getFullYear()) issues.push("Metric year is missing or invalid.");
  if (!record.subjectCategory?.trim()) issues.push("Metric subject category is required.");
  if (!record.retrievedAt?.trim()) issues.push("Metric retrieval timestamp is required.");

  let hostname = "";
  try {
    const url = new URL(record.sourceUrl);
    if (url.protocol !== "https:") issues.push("Metric source must use HTTPS.");
    hostname = url.hostname.toLowerCase();
  } catch {
    issues.push("Metric source URL is invalid.");
  }

  const allowedHosts = PROVIDER_HOSTS[record.providerKind];
  if (allowedHosts && !allowedHosts.some((host) => hostname === host || hostname.endsWith(`.${host}`))) {
    issues.push(`${record.providerKind} metrics must cite that provider's official domain.`);
  }
  const claimsJcr = /\b(?:JCR|Journal Citation Reports)\b/i.test(record.metricName);
  const claimsScopus = /\b(?:CiteScore|Scopus)\b/i.test(record.metricName);
  if ((claimsJcr && record.providerKind !== "JCR") || (claimsScopus && record.providerKind !== "SCOPUS")) {
    issues.push("Third-party metrics cannot be labeled as JCR, CiteScore, or Scopus metrics.");
  }
  if (record.providerKind === "JCR" && !/\b(?:Clarivate|JCR|Journal Citation Reports)\b/i.test(record.provider)) {
    issues.push("JCR provider name must identify Clarivate Journal Citation Reports.");
  }
  if (record.providerKind === "SCOPUS" && !/\b(?:Scopus|Elsevier)\b/i.test(record.provider)) {
    issues.push("Scopus provider name must identify Scopus or Elsevier.");
  }
  if (record.quartile && !record.subjectCategory.trim()) issues.push("Quartile requires its category.");
  if (record.percentile !== undefined && (!Number.isFinite(record.percentile) || record.percentile < 0 || record.percentile > 100)) {
    issues.push("Percentile must be between 0 and 100.");
  }
  return { valid: issues.length === 0, issues };
}

export function getOutletMetricRecords(outlet: TargetOutlet): OutletMetricRecord[] {
  return Array.isArray(outlet.metrics) ? outlet.metrics : [];
}

export function getVerifiedOutletMetrics(outlet: TargetOutlet): OutletMetricRecord[] {
  return getOutletMetricRecords(outlet).filter((record) =>
    record.verificationState === "Verified" && validateOutletMetricRecord(record).valid
  );
}

export function normalizeOutletMetricRecords(value: unknown, forceUnverified = false): OutletMetricRecord[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((candidate) => {
    if (!candidate || typeof candidate !== "object") return [];
    const record = candidate as OutletMetricRecord;
    const validation = validateOutletMetricRecord(record);
    return [{
      ...record,
      verificationState: forceUnverified || !validation.valid ? "Unverified" as const : record.verificationState,
    }];
  });
}
