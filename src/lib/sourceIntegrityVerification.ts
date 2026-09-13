import type { SourceIntegrityVerification, SourceRecord } from "../types";
import { fetchCrossrefIntegrityMetadata, type IntegrityMetadataResult } from "./metadataProviders";

export interface SourceIntegrityProvider { id: string; name: string; configured: boolean; lookup: (source: SourceRecord) => Promise<IntegrityMetadataResult> }
export interface SourceIntegrityVerificationResult { source: SourceRecord; verification: SourceIntegrityVerification; providerResults: IntegrityMetadataResult[] }

export async function verifySourceIntegrity(source: SourceRecord, providers: readonly SourceIntegrityProvider[] = [{ id: "crossref-integrity", name: "Crossref Official Registry", configured: true, lookup: (candidate) => fetchCrossrefIntegrityMetadata(candidate.doi || "") }], now = () => new Date().toISOString()): Promise<SourceIntegrityVerificationResult> {
  const configured = providers.filter((provider) => provider.configured && source.doi);
  if (!configured.length) {
    const verification: SourceIntegrityVerification = { status: "Unverified", provider: "Not available", retrievedAt: now(), relatedIds: [], message: source.doi ? "No configured integrity provider returned a result; retraction status remains Unverified." : "No identifier-backed integrity check is available." };
    return { source: { ...source, integrityVerification: verification }, verification, providerResults: [] };
  }
  const results: IntegrityMetadataResult[] = [];
  for (const provider of configured) {
    const result = await provider.lookup(source); results.push(result);
    if (["Retracted", "Corrected", "Expression of Concern", "Updated"].includes(result.status)) {
      const verification: SourceIntegrityVerification = { status: result.status, provider: result.provider, retrievedAt: result.retrievedAt, relatedIds: [...result.relatedIds], message: result.message };
      return { source: { ...source, integrityVerification: verification, retractionWarning: result.status === "Retracted" || result.status === "Expression of Concern", correctionNotice: result.status === "Corrected" || result.status === "Updated" ? result.message : source.correctionNotice }, verification, providerResults: results };
    }
  }
  const first = results[0];
  const verification: SourceIntegrityVerification = { status: results.some((result) => result.status === "Clear") ? "Clear" : results.every((result) => result.status === "Unavailable") ? "Unavailable" : "Unverified", provider: first.provider, retrievedAt: first.retrievedAt, relatedIds: [...new Set(results.flatMap((result) => result.relatedIds))], message: results.some((result) => result.status === "Clear") ? "Configured provider returned no integrity relation; this does not prove universal retraction clearance." : "No configured provider established integrity status; status remains Unverified." };
  return { source: { ...source, integrityVerification: verification }, verification, providerResults: results };
}
