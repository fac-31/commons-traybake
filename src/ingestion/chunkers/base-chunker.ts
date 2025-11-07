import type { Debate, Contribution, Speaker, HansardReference } from '../../types/index.js';

/**
 * Supported chunking strategies for parliamentary debate processing
 */
export type ChunkingStrategy =
  | 'semantic_1024'
  | 'semantic_256'
  | 'late_chunking_1024'
  | 'late_chunking_256';

/**
 * A chunk of parliamentary text with full metadata for RAG retrieval
 */
export interface Chunk {
  /** Unique identifier for this chunk */
  id: string;

  /** The chunked text content */
  text: string;

  /** Vector embedding of the chunk (generated during processing) */
  embedding?: number[];

  /** Which chunking strategy produced this chunk */
  strategy: ChunkingStrategy;

  /** Alternative name for storage compatibility */
  chunkingStrategy?: string;

  /** Source debate information */
  debateId: string;
  debateTitle: string;
  debateDate: Date;
  debateType: string;

  /** Flat string versions for Neo4j storage */
  debate?: string;  // debateTitle
  date?: string;    // debateDate as ISO string

  /** Speaker information */
  speaker: Speaker;

  /** Flat string versions for Neo4j storage */
  speakerName?: string;
  speakerParty?: string;
  speakerRole?: string;

  /** Hansard reference for citation */
  hansardReference: HansardReference;

  /** Flat string version for Neo4j storage */
  hansardReferenceText?: string;

  /** Position in the debate */
  sequenceNumber: number;
  sequence?: number;  // Alternative name for storage
  previousChunkId?: string;
  nextChunkId?: string;

  /** Metadata for analysis */
  tokenCount: number;
  contributionIds: string[]; // Which contributions this chunk spans
  contributionType?: string;  // For storage

  /** Procedural context (for late chunking strategies) */
  proceduralMarkers?: string[];
  proceduralContext?: string;  // For storage (serialized)

  /** For late chunking: the debate-level context embedding */
  debateContextEmbedding?: number[];
  debateContext?: number[];  // Alternative name for storage

  /** Timestamp for when this chunk was created */
  createdAt: Date;
}

/**
 * Abstract base class for all chunking pipeline implementations
 *
 * Each strategy (semantic, late chunking, different token sizes) extends this
 * and implements the core processing logic while maintaining consistent interfaces
 */
export abstract class ChunkingPipeline {
  /** Name of this chunking strategy */
  abstract readonly strategyName: ChunkingStrategy;

  /** Maximum tokens per chunk */
  abstract readonly maxTokens: number;

  /**
   * Process a debate into chunks using this strategy
   * @param debate - The parliamentary debate to chunk
   * @returns Array of chunks with embeddings and metadata
   */
  abstract process(debate: Debate): Promise<Chunk[]>;

  /**
   * Generate a unique chunk ID
   * @param debateId - Source debate identifier
   * @param sequenceNumber - Position in the debate
   * @returns Unique chunk identifier
   */
  protected generateChunkId(debateId: string, sequenceNumber: number): string {
    return `${this.strategyName}-${debateId}-${sequenceNumber.toString().padStart(4, '0')}`;
  }

  /**
   * Create chunk metadata from a contribution
   * @param contribution - Source contribution
   * @param debate - Parent debate
   * @returns Partial chunk metadata
   */
  protected createChunkMetadata(
    contribution: Contribution,
    debate: Debate
  ): Omit<Chunk, 'id' | 'text' | 'embedding' | 'strategy' | 'tokenCount' | 'sequenceNumber' | 'createdAt'> {
    return {
      debateId: debate.id,
      debateTitle: debate.title,
      debateDate: debate.date,
      debateType: debate.type,
      speaker: contribution.speaker,
      hansardReference: debate.hansardReference,
      contributionIds: [contribution.id],
    };
  }

  /**
   * Validate that chunks respect speaker boundaries
   * @param chunks - Chunks to validate
   * @returns true if all chunks maintain speaker boundaries
   */
  protected validateSpeakerBoundaries(chunks: Chunk[]): boolean {
    // Each chunk should only contain contributions from a single speaker
    return chunks.every(chunk => {
      // For now, we assume single speaker per chunk
      // More complex validation can be added as needed
      return chunk.speaker !== undefined;
    });
  }

  /**
   * Link chunks in sequence
   * @param chunks - Chunks to link
   * @returns Chunks with previousChunkId and nextChunkId populated
   */
  protected linkChunks(chunks: Chunk[]): Chunk[] {
    return chunks.map((chunk, index) => ({
      ...chunk,
      previousChunkId: index > 0 ? chunks[index - 1].id : undefined,
      nextChunkId: index < chunks.length - 1 ? chunks[index + 1].id : undefined,
    }));
  }
}
