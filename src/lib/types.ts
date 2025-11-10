/**
 * UI Types for Commons Traybake
 *
 * Types for the frontend interface, aligned with backend storage types
 * but focused on display and interaction.
 */

export interface Chunk {
  id: string;
  text: string;
  chunkingStrategy: string;
  speaker: string;
  speakerParty: string;
  speakerRole: string;
  debate: string;
  date: string;
  hansardReference: string;
  contributionType?: string;
  sequence?: number;
  tokenCount?: number;
}

export interface SearchResult {
  chunk: Chunk;
  score: number;
  rank: number;
}

export interface ComparativeSearchResults {
  query: string;
  semantic_1024: SearchResult[];
  semantic_256: SearchResult[];
  late_1024: SearchResult[];
  late_256: SearchResult[];
  executionTime: number;
}

export interface DivergenceAnalysis {
  totalUniqueChunks: number;
  totalResults: number;
  identicalChunks: number;
  overlapPercentage: number;
  strategyOverlaps: {
    strategies: [string, string];
    sharedChunks: number;
  }[];
}
