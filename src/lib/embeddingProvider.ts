export type EmbeddingProviderKind = "Scientific" | "Multilingual" | "Cloud";
export interface EmbeddingModelMetadata { providerId: string; kind: EmbeddingProviderKind; modelId: string; modelVersion: string; config: Record<string, unknown>; generatedAt: string; chunkHash: string; documentHash: string; indexVersion: number; }
export interface EmbeddingProvider { readonly metadata: Omit<EmbeddingModelMetadata, "generatedAt" | "chunkHash" | "documentHash" | "indexVersion">; embed(texts: readonly string[]): Promise<number[][]>; }
export interface StoredEmbedding { vector: number[]; metadata: EmbeddingModelMetadata; }
export function createEmbeddingRecord(vector: number[], metadata: EmbeddingModelMetadata): StoredEmbedding { return { vector: [...vector], metadata: { ...metadata, config: { ...metadata.config } } }; }
export function nextEmbeddingIndexVersion(previous: readonly StoredEmbedding[], providerId: string, modelId: string): number { return 1 + previous.filter((item) => item.metadata.providerId === providerId && item.metadata.modelId === modelId).reduce((max, item) => Math.max(max, item.metadata.indexVersion), 0); }
