/**
 * Chunk Storage Service for Commons Traybake
 *
 * Handles storing chunks with embeddings and metadata in Neo4j.
 * Creates graph relationships to preserve debate structure.
 */

import { Neo4jClient } from './neo4j-client.js';
import type { Chunk } from '../ingestion/chunkers/base-chunker.js';

export interface StorageStats {
  chunksStored: number;
  relationshipsCreated: number;
  strategy: string;
  duration: number;
}

export class ChunkStorage {
  private client: Neo4jClient;

  constructor() {
    this.client = Neo4jClient.getInstance();
  }

  /**
   * Get the Neo4j label for a chunking strategy
   */
  private getStrategyLabel(strategy: string): string {
    const labelMap: Record<string, string> = {
      'semantic_1024': 'Semantic1024',
      'semantic_256': 'Semantic256',
      'late_1024': 'Late1024',
      'late_256': 'Late256',
    };
    return labelMap[strategy] || 'Chunk';
  }

  /**
   * Flatten a chunk for Neo4j storage by converting complex objects to primitives
   */
  private flattenChunk(chunk: Chunk): Record<string, any> {
    return {
      id: chunk.id,
      text: chunk.text,
      embedding: chunk.embedding || [],
      chunkingStrategy: chunk.chunkingStrategy || chunk.strategy,

      // Debate info (flattened)
      debate: chunk.debate || chunk.debateTitle,
      date: chunk.date || (chunk.debateDate ? chunk.debateDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
      debateType: chunk.debateType,

      // Speaker info (flattened)
      speaker: chunk.speakerName || (typeof chunk.speaker === 'object' ? chunk.speaker.name : String(chunk.speaker || '')),
      speakerParty: chunk.speakerParty || (typeof chunk.speaker === 'object' ? chunk.speaker.party : ''),
      speakerRole: chunk.speakerRole || (typeof chunk.speaker === 'object' ? chunk.speaker.role : ''),

      // Hansard reference (flattened)
      hansardReference: chunk.hansardReferenceText ||
        (typeof chunk.hansardReference === 'object' ? chunk.hansardReference.reference : String(chunk.hansardReference || '')),

      // Position and metadata
      sequence: chunk.sequence || chunk.sequenceNumber,
      tokenCount: chunk.tokenCount,
      contributionType: chunk.contributionType || 'speech',

      // Procedural context (serialized)
      proceduralContext: chunk.proceduralContext ||
        (chunk.proceduralMarkers ? JSON.stringify(chunk.proceduralMarkers) : ''),

      // Debate context (for late chunking)
      debateContext: chunk.debateContext || chunk.debateContextEmbedding || null,
    };
  }

  /**
   * Store a single chunk in Neo4j with strategy-specific label
   */
  public async storeChunk(chunk: Chunk): Promise<void> {
    const flat = this.flattenChunk(chunk);
    const strategy = flat.chunkingStrategy;
    const label = this.getStrategyLabel(strategy);

    const query = `
      CREATE (c:Chunk:${label} {
        id: $id,
        text: $text,
        embedding: $embedding,
        chunkingStrategy: $chunkingStrategy,
        speaker: $speaker,
        speakerParty: $speakerParty,
        speakerRole: $speakerRole,
        debate: $debate,
        date: date($date),
        hansardReference: $hansardReference,
        contributionType: $contributionType,
        proceduralContext: $proceduralContext,
        sequence: $sequence,
        tokenCount: $tokenCount,
        debateContext: $debateContext
      })
      RETURN c.id as id
    `;

    await this.client.run(query, flat);
  }

  /**
   * Store multiple chunks in a transaction (more efficient)
   */
  public async storeChunks(chunks: Chunk[]): Promise<StorageStats> {
    const startTime = Date.now();
    console.log(`[Storage] Storing ${chunks.length} chunks...`);

    if (chunks.length === 0) {
      return {
        chunksStored: 0,
        relationshipsCreated: 0,
        strategy: 'none',
        duration: 0,
      };
    }

    const strategy = chunks[0].chunkingStrategy || chunks[0].strategy;
    const label = this.getStrategyLabel(strategy);

    // Store chunks in batches of 100 for better performance
    const batchSize = 100;
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);

      // Use strategy-specific label for vector index
      const query = `
        UNWIND $chunks AS chunk
        CREATE (c:Chunk:${label} {
          id: chunk.id,
          text: chunk.text,
          embedding: chunk.embedding,
          chunkingStrategy: chunk.chunkingStrategy,
          speaker: chunk.speaker,
          speakerParty: chunk.speakerParty,
          speakerRole: chunk.speakerRole,
          debate: chunk.debate,
          date: date(chunk.date),
          hansardReference: chunk.hansardReference,
          contributionType: chunk.contributionType,
          proceduralContext: chunk.proceduralContext,
          sequence: chunk.sequence,
          tokenCount: chunk.tokenCount,
          debateContext: chunk.debateContext
        })
      `;

      const params = {
        chunks: batch.map(chunk => this.flattenChunk(chunk)),
      };

      await this.client.run(query, params);

      console.log(
        `[Storage] Stored batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}`
      );
    }

    console.log(`[Storage] All chunks stored. Creating relationships...`);

    // Create PRECEDES relationships based on sequence
    const relationshipsCreated = await this.createPrecedesRelationships(
      chunks
    );

    const duration = Date.now() - startTime;

    console.log(
      `[Storage] Stored ${chunks.length} chunks with ${relationshipsCreated} relationships in ${duration}ms`
    );

    return {
      chunksStored: chunks.length,
      relationshipsCreated,
      strategy,
      duration,
    };
  }

  /**
   * Create PRECEDES relationships to maintain debate flow
   */
  private async createPrecedesRelationships(
    chunks: Chunk[]
  ): Promise<number> {
    // Sort chunks by sequence
    const sortedChunks = [...chunks].sort(
      (a, b) => (a.sequence || a.sequenceNumber || 0) - (b.sequence || b.sequenceNumber || 0)
    );

    let relationshipsCreated = 0;

    // Create relationships in batches
    const batchSize = 100;
    for (let i = 0; i < sortedChunks.length - 1; i += batchSize) {
      const batch = sortedChunks.slice(i, Math.min(i + batchSize, sortedChunks.length - 1));

      const pairs = batch.map((chunk, idx) => {
        const nextChunk = sortedChunks[i + idx + 1];
        if (!nextChunk) return null;

        const speaker1 = typeof chunk.speaker === 'object' ? chunk.speaker.name : chunk.speaker;
        const speaker2 = typeof nextChunk.speaker === 'object' ? nextChunk.speaker.name : nextChunk.speaker;

        return {
          fromId: chunk.id,
          toId: nextChunk.id,
          temporalDistance: (nextChunk.sequence || nextChunk.sequenceNumber || 0) - (chunk.sequence || chunk.sequenceNumber || 0),
          sameSpeaker: speaker1 === speaker2,
        };
      }).filter(Boolean);

      if (pairs.length === 0) continue;

      const query = `
        UNWIND $pairs AS pair
        MATCH (c1:Chunk {id: pair.fromId})
        MATCH (c2:Chunk {id: pair.toId})
        CREATE (c1)-[r:PRECEDES {
          temporalDistance: pair.temporalDistance,
          sameSpeaker: pair.sameSpeaker
        }]->(c2)
      `;

      await this.client.run(query, { pairs });
      relationshipsCreated += pairs.length;
    }

    return relationshipsCreated;
  }

  /**
   * Get chunk count by strategy
   */
  public async getChunkCount(strategy?: string): Promise<number> {
    const query = strategy
      ? `MATCH (c:Chunk {chunkingStrategy: $strategy}) RETURN count(c) as count`
      : `MATCH (c:Chunk) RETURN count(c) as count`;

    const result = await this.client.run(query, { strategy });
    return result[0]?.count || 0;
  }

  /**
   * Delete all chunks for a strategy (for re-processing)
   */
  public async deleteChunksByStrategy(strategy: string): Promise<number> {
    console.log(`[Storage] Deleting chunks for strategy: ${strategy}...`);

    const query = `
      MATCH (c:Chunk {chunkingStrategy: $strategy})
      DETACH DELETE c
      RETURN count(c) as deleted
    `;

    const result = await this.client.run(query, { strategy });
    const deleted = result[0]?.deleted || 0;

    console.log(`[Storage] Deleted ${deleted} chunks`);
    return deleted;
  }

  /**
   * Delete all chunks (for complete reset)
   */
  public async deleteAllChunks(): Promise<number> {
    console.log('[Storage] Deleting all chunks...');

    const query = `
      MATCH (c:Chunk)
      DETACH DELETE c
      RETURN count(c) as deleted
    `;

    const result = await this.client.run(query);
    const deleted = result[0]?.deleted || 0;

    console.log(`[Storage] Deleted ${deleted} chunks`);
    return deleted;
  }

  /**
   * Get storage statistics
   */
  public async getStats(): Promise<{
    totalChunks: number;
    byStrategy: Record<string, number>;
    totalRelationships: number;
  }> {
    const totalQuery = `MATCH (c:Chunk) RETURN count(c) as count`;
    const totalResult = await this.client.run(totalQuery);
    const totalChunks = totalResult[0]?.count || 0;

    const strategyQuery = `
      MATCH (c:Chunk)
      RETURN c.chunkingStrategy as strategy, count(c) as count
    `;
    const strategyResult = await this.client.run(strategyQuery);
    const byStrategy: Record<string, number> = {};
    for (const row of strategyResult) {
      byStrategy[row.strategy] = row.count;
    }

    const relQuery = `MATCH ()-[r:PRECEDES]->() RETURN count(r) as count`;
    const relResult = await this.client.run(relQuery);
    const totalRelationships = relResult[0]?.count || 0;

    return {
      totalChunks,
      byStrategy,
      totalRelationships,
    };
  }
}
