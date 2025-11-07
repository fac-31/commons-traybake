/**
 * Neo4j Schema Initialization for Commons Traybake
 *
 * Creates:
 * 1. Chunk node constraints (unique IDs)
 * 2. Vector indexes for all 4 chunking strategies
 * 3. Node indexes for speaker, party, debate metadata
 */

import { Neo4jClient } from './neo4j-client.js';

export class Neo4jSchema {
  private client: Neo4jClient;

  constructor() {
    this.client = Neo4jClient.getInstance();
  }

  /**
   * Initialize complete database schema
   */
  public async initialize(): Promise<void> {
    console.log('[Schema] Initializing Neo4j schema...');

    await this.createConstraints();
    await this.createVectorIndexes();
    await this.createPropertyIndexes();

    console.log('[Schema] Schema initialization complete ✅');
  }

  /**
   * Create constraints for data integrity
   */
  private async createConstraints(): Promise<void> {
    console.log('[Schema] Creating constraints...');

    const constraints = [
      // Unique constraint on chunk ID
      `CREATE CONSTRAINT chunk_id_unique IF NOT EXISTS
       FOR (c:Chunk) REQUIRE c.id IS UNIQUE`,

      // Ensure chunking strategy is always present
      `CREATE CONSTRAINT chunk_strategy_exists IF NOT EXISTS
       FOR (c:Chunk) REQUIRE c.chunkingStrategy IS NOT NULL`,
    ];

    for (const constraint of constraints) {
      try {
        await this.client.run(constraint);
      } catch (error: any) {
        if (!error.message.includes('already exists')) {
          throw error;
        }
      }
    }

    console.log('[Schema] Constraints created');
  }

  /**
   * Create vector indexes for similarity search - hybrid approach
   *
   * Creates 5 vector indexes total:
   * 1. Four strategy-specific indexes (one per chunking strategy)
   *    - Each strategy has its own label and embedding space
   *    - Used for within-strategy vector search
   * 2. One unified index on base :Chunk label
   *    - Indexes all chunks regardless of strategy
   *    - Used for cross-strategy similarity search
   *
   * Since nodes have multiple labels (e.g., :Chunk:Semantic1024), they are
   * automatically indexed by both the strategy-specific and unified indexes.
   */
  private async createVectorIndexes(): Promise<void> {
    console.log('[Schema] Creating vector indexes...');

    // Strategy-specific indexes
    const strategies = [
      { name: 'semantic_1024', label: 'Semantic1024' },
      { name: 'semantic_256', label: 'Semantic256' },
      { name: 'late_1024', label: 'Late1024' },
      { name: 'late_256', label: 'Late256' },
    ];

    for (const { name, label } of strategies) {
      const indexName = `${name}_vector_index`;
      const query = `
        CREATE VECTOR INDEX ${indexName} IF NOT EXISTS
        FOR (c:${label})
        ON c.embedding
        OPTIONS {
          indexConfig: {
            \`vector.dimensions\`: 3072,
            \`vector.similarity_function\`: 'cosine'
          }
        }
      `;

      try {
        await this.client.run(query);
        console.log(`[Schema] Created vector index: ${indexName} for label :${label}`);
      } catch (error: any) {
        if (!error.message.includes('already exists')) {
          console.error(`[Schema] Failed to create ${indexName}:`, error);
          throw error;
        }
      }
    }

    // Unified index for cross-strategy search
    const unifiedQuery = `
      CREATE VECTOR INDEX chunk_unified_vector_index IF NOT EXISTS
      FOR (c:Chunk)
      ON c.embedding
      OPTIONS {
        indexConfig: {
          \`vector.dimensions\`: 3072,
          \`vector.similarity_function\`: 'cosine'
        }
      }
    `;

    try {
      await this.client.run(unifiedQuery);
      console.log('[Schema] Created unified vector index: chunk_unified_vector_index for label :Chunk');
    } catch (error: any) {
      if (!error.message.includes('already exists')) {
        console.error('[Schema] Failed to create unified vector index:', error);
        throw error;
      }
    }

    console.log('[Schema] Vector indexes created (5 total: 4 strategy-specific + 1 unified)');
  }

  /**
   * Create property indexes for metadata queries
   */
  private async createPropertyIndexes(): Promise<void> {
    console.log('[Schema] Creating property indexes...');

    const indexes = [
      // Speaker name index (for filtering by MP)
      `CREATE INDEX chunk_speaker_index IF NOT EXISTS
       FOR (c:Chunk) ON (c.speaker)`,

      // Party index (for balance analysis)
      `CREATE INDEX chunk_party_index IF NOT EXISTS
       FOR (c:Chunk) ON (c.speakerParty)`,

      // Debate index (for retrieving debate context)
      `CREATE INDEX chunk_debate_index IF NOT EXISTS
       FOR (c:Chunk) ON (c.debate)`,

      // Date index (for temporal queries)
      `CREATE INDEX chunk_date_index IF NOT EXISTS
       FOR (c:Chunk) ON (c.date)`,

      // Chunking strategy index (for comparative queries)
      `CREATE INDEX chunk_strategy_index IF NOT EXISTS
       FOR (c:Chunk) ON (c.chunkingStrategy)`,

      // Hansard reference index (for citation lookup)
      `CREATE INDEX chunk_hansard_index IF NOT EXISTS
       FOR (c:Chunk) ON (c.hansardReference)`,
    ];

    for (const index of indexes) {
      try {
        await this.client.run(index);
      } catch (error: any) {
        if (!error.message.includes('already exists')) {
          throw error;
        }
      }
    }

    console.log('[Schema] Property indexes created');
  }

  /**
   * Drop all indexes and constraints (for reset)
   */
  public async reset(): Promise<void> {
    console.log('[Schema] Resetting schema...');

    // Get all indexes
    const indexes = await this.client.run('SHOW INDEXES');
    for (const index of indexes) {
      const name = index.name;
      await this.client.run(`DROP INDEX ${name} IF EXISTS`);
    }

    // Get all constraints
    const constraints = await this.client.run('SHOW CONSTRAINTS');
    for (const constraint of constraints) {
      const name = constraint.name;
      await this.client.run(`DROP CONSTRAINT ${name} IF EXISTS`);
    }

    console.log('[Schema] Schema reset complete');
  }

  /**
   * Verify all indexes are online and ready
   */
  public async verifyIndexes(): Promise<void> {
    console.log('[Schema] Verifying indexes...');

    const result = await this.client.run(`
      SHOW INDEXES
      YIELD name, type, state, populationPercent
      RETURN name, type, state, populationPercent
    `);

    console.table(result);

    const notOnline = result.filter(idx => idx.state !== 'ONLINE');
    if (notOnline.length > 0) {
      console.warn('[Schema] Warning: Some indexes not online:', notOnline);
    } else {
      console.log('[Schema] All indexes online ✅');
    }
  }
}
