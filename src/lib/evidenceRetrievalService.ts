import type { EvidenceRecord, FullTextChunk } from "../types";
export interface EvidenceRetrievalFilters { projectId?: string; sourceIds?: readonly string[]; dateFrom?: string; studyType?: string; verificationState?: string; }
export interface RetrievedEvidence { chunkId: string; sourceId: string; evidenceId?: string; score: number; text: string; page?: number | string; section?: string; documentHash: string; documentVersion: string; }
const terms = (value: string) => new Set(value.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length > 2));
export function retrieveEvidence(questionOrClaim: string, chunks: readonly FullTextChunk[], evidenceRecords: readonly EvidenceRecord[] = [], filters: EvidenceRetrievalFilters = {}, limit = 10): RetrievedEvidence[] {
  const query = terms(questionOrClaim); if (!query.size) return [];
  const allowedSources = filters.sourceIds && new Set(filters.sourceIds);
  return chunks.filter((chunk) => (!filters.projectId || chunk.projectId === filters.projectId) && (!allowedSources || allowedSources.has(chunk.sourceId)) && (!filters.dateFrom || chunk.createdAt >= filters.dateFrom)).map((chunk) => {
    const overlap = [...query].filter((term) => terms(chunk.text).has(term)).length; const score = overlap / query.size;
    const evidence = evidenceRecords.find((record) => record.sourceId === chunk.sourceId && record.documentHash === chunk.documentHash && record.documentVersion === chunk.documentVersion && record.paragraphOrChunkRef === chunk.chunkId);
    return { chunkId: chunk.chunkId, sourceId: chunk.sourceId, evidenceId: evidence?.evidenceId, score, text: chunk.text, page: chunk.page, section: chunk.section, documentHash: chunk.documentHash, documentVersion: chunk.documentVersion };
  }).filter((result) => result.score > 0).sort((a, b) => b.score - a.score || a.chunkId.localeCompare(b.chunkId)).slice(0, Math.max(1, limit));
}

export interface RetrievalBenchmarkCase { id: string; query: string; relevantChunkIds: string[]; }
export interface RetrievalBenchmarkResult { cases: number; k: number; recallAtK: number; precisionAtK: number; provenanceRetentionRate: number; wrongSourceRate: number; }
export function benchmarkEvidenceRetrieval(cases: readonly RetrievalBenchmarkCase[], chunks: readonly FullTextChunk[], k = 3): RetrievalBenchmarkResult {
  let recall = 0, precision = 0, provenance = 0, wrong = 0, retrieved = 0;
  for (const test of cases) { const results = retrieveEvidence(test.query, chunks, [], {}, k); const ids = new Set(test.relevantChunkIds); const hits = results.filter((item) => ids.has(item.chunkId)).length; recall += ids.size ? hits / ids.size : 1; precision += results.length ? hits / results.length : 0; provenance += results.filter((item) => item.documentHash && item.documentVersion && item.sourceId).length; wrong += results.filter((item) => !ids.has(item.chunkId)).length; retrieved += results.length; }
  return { cases: cases.length, k, recallAtK: cases.length ? recall / cases.length : 0, precisionAtK: cases.length ? precision / cases.length : 0, provenanceRetentionRate: retrieved ? provenance / retrieved : 1, wrongSourceRate: retrieved ? wrong / retrieved : 0 };
}
