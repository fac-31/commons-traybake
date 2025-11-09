/**
 * Vector Similarity Search Service for Commons Traybake
 *
 * Performs similarity search using Neo4j's native vector indexes.
 * Supports querying single or multiple chunking strategies for comparison.
 */

import { Neo4jClient } from './neo4j-client.js';
import type { Chunk } from '../types/index.js';
import { OpenAI } from 'openai';
import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';

dotenv.config();

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

export class VectorSearch {
  private client: Neo4jClient;
  private openai: OpenAI;

  constructor() {
    this.client = Neo4jClient.getInstance();
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Generate embedding for a query string
   */
  private async embedQuery(query: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: query,
      dimensions: 3072,
    });

    return response.data[0].embedding;
  }

  /**
   * Search a single chunking strategy using its dedicated vector index
   *
   * Each strategy has its own label and vector index:
   * - semantic_1024 → :Semantic1024 → semantic_1024_vector_index
   * - late_1024 → :Late1024 → late_1024_vector_index
   * etc.
   */
  public async searchStrategy(
    query: string,
    strategy: string,
    limit: number = 5
  ): Promise<SearchResult[]> {
    const embedding = await this.embedQuery(query);
    const indexName = `${strategy}_vector_index`;

    const cypherQuery = `
      CALL db.index.vector.queryNodes(
        $indexName,
        $limit,
        $embedding
      )
      YIELD node, score
      RETURN
        node.id as id,
        node.text as text,
        node.embedding as embedding,
        node.chunkingStrategy as chunkingStrategy,
        node.speaker as speaker,
        node.speakerParty as speakerParty,
        node.speakerRole as speakerRole,
        node.debate as debate,
        toString(node.date) as date,
        node.hansardReference as hansardReference,
        node.contributionType as contributionType,
        node.proceduralContext as proceduralContext,
        node.sequence as sequence,
        node.tokenCount as tokenCount,
        node.debateContext as debateContext,
        score
      ORDER BY score DESC
      LIMIT $limit
    `;

    const params = {
      indexName,
      embedding,
      limit: neo4j.int(limit),
    };

    const results = await this.client.run(cypherQuery, params);

    return results.map((row, idx) => ({
      chunk: {
        id: row.id,
        text: row.text,
        embedding: row.embedding,
        chunkingStrategy: row.chunkingStrategy,
        speaker: row.speaker,
        speakerParty: row.speakerParty,
        speakerRole: row.speakerRole,
        debate: row.debate,
        date: row.date,
        hansardReference: row.hansardReference,
        contributionType: row.contributionType,
        proceduralContext: row.proceduralContext,
        sequence: row.sequence,
        tokenCount: row.tokenCount,
        debateContext: row.debateContext,
      },
      score: row.score,
      rank: idx + 1,
    }));
  }

  /**
   * Search all 4 chunking strategies simultaneously for comparison
   */
  public async comparativeSearch(
    query: string,
    limit: number = 5
  ): Promise<ComparativeSearchResults> {
    const startTime = Date.now();
    console.log(`[Search] Running comparative search: "${query}"`);

    const strategies = [
      'semantic_1024',
      'semantic_256',
      'late_1024',
      'late_256',
    ] as const;

    const results = await Promise.all(
      strategies.map(strategy => this.searchStrategy(query, strategy, limit))
    );

    const executionTime = Date.now() - startTime;

    console.log(`[Search] Completed in ${executionTime}ms`);

    return {
      query,
      semantic_1024: results[0],
      semantic_256: results[1],
      late_1024: results[2],
      late_256: results[3],
      executionTime,
    };
  }

  /**
   * Get chunks by speaker (for speaker-specific analysis)
   */
  public async getChunksBySpeaker(
    speaker: string,
    strategy?: string,
    limit: number = 10
  ): Promise<Chunk[]> {
    const query = strategy
      ? `
        MATCH (c:Chunk {speaker: $speaker, chunkingStrategy: $strategy})
        RETURN c
        ORDER BY c.sequence
        LIMIT $limit
      `
      : `
        MATCH (c:Chunk {speaker: $speaker})
        RETURN c
        ORDER BY c.sequence
        LIMIT $limit
      `;

    const results = await this.client.run(query, { speaker, strategy, limit });

    return results.map(row => this.nodeToChunk(row.c));
  }

  /**
   * Get chunks by debate (for debate-specific analysis)
   */
  public async getChunksByDebate(
    debate: string,
    strategy?: string
  ): Promise<Chunk[]> {
    const query = strategy
      ? `
        MATCH (c:Chunk {debate: $debate, chunkingStrategy: $strategy})
        RETURN c
        ORDER BY c.sequence
      `
      : `
        MATCH (c:Chunk {debate: $debate})
        RETURN c
        ORDER BY c.sequence
      `;

    const results = await this.client.run(query, { debate, strategy });

    return results.map(row => this.nodeToChunk(row.c));
  }

  /**
   * Find chunks that mention the same topic across strategies
   *
   * Uses the unified vector index to search across all chunks regardless of strategy.
   * This allows finding similar content that was chunked differently by various strategies.
   */
  public async findSimilarTopicChunks(
    chunkId: string,
    similarityThreshold: number = 0.8
  ): Promise<SearchResult[]> {
    const query = `
      MATCH (source:Chunk {id: $chunkId})
      CALL db.index.vector.queryNodes(
        'chunk_unified_vector_index',
        100,
        source.embedding
      )
      YIELD node, score
      WHERE node.id <> source.id
        AND score >= $threshold
        AND node.chunkingStrategy <> source.chunkingStrategy
      RETURN node, score
      ORDER BY score DESC
      LIMIT 10
    `;

    const results = await this.client.run(query, {
      chunkId,
      threshold: similarityThreshold,
    });

    return results.map((row, idx) => ({
      chunk: this.nodeToChunk(row.node),
      score: row.score,
      rank: idx + 1,
    }));
  }

  /**
   * Convert Neo4j node to Chunk object
   */
  private nodeToChunk(node: any): Chunk {
    return {
      id: node.properties.id,
      text: node.properties.text,
      embedding: node.properties.embedding,
      chunkingStrategy: node.properties.chunkingStrategy,
      speaker: node.properties.speaker,
      speakerParty: node.properties.speakerParty,
      speakerRole: node.properties.speakerRole,
      debate: node.properties.debate,
      date: node.properties.date?.toString(),
      hansardReference: node.properties.hansardReference,
      contributionType: node.properties.contributionType,
      proceduralContext: node.properties.proceduralContext,
      sequence: node.properties.sequence,
      tokenCount: node.properties.tokenCount,
      debateContext: node.properties.debateContext,
    };
  }
}
