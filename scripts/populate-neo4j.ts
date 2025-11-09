/**
 * Populate Neo4j with All Chunking Strategies
 *
 * Processes test debate through all 4 chunking pipelines and stores
 * results in Neo4j for comparative vector search.
 */

import 'dotenv/config';

import { ParliamentAPI } from '../src/ingestion/parliament-api-client.js';
import { SemanticPipeline1024 } from '../src/ingestion/chunkers/semantic-1024.js';
import { SemanticPipeline256 } from '../src/ingestion/chunkers/semantic-256.js';
import { LateChunkingPipeline1024 } from '../src/ingestion/chunkers/late-chunking-1024.js';
import { LateChunkingPipeline256 } from '../src/ingestion/chunkers/late-chunking-256.js';
import { ChunkStorage, Neo4jClient } from '../src/storage/index.js';
import type { Chunk } from '../src/types/index.js';

async function populateNeo4j() {
  console.log('='.repeat(60));
  console.log('Populating Neo4j with All Chunking Strategies');
  console.log('='.repeat(60));
  console.log();

  // Reset singleton to ensure fresh connection
  await Neo4jClient.reset();

  const client = Neo4jClient.getInstance();
  const storage = new ChunkStorage();
  const api = new ParliamentAPI();

  try {
    // Verify connection
    const connected = await client.verifyConnection();
    if (!connected) {
      console.error('❌ Failed to connect to Neo4j');
      console.log('Run: npm run test:neo4j:setup first');
      process.exit(1);
    }
    console.log('✅ Connected to Neo4j\n');

    // Step 1: Fetch test debate
    console.log('Step 1: Fetching test debate from Parliament API...');
    const debates = await api.fetchHansardDebatesByDate(new Date('2024-01-10'));

    if (debates.length === 0) {
      console.error('❌ No debates found for test date');
      process.exit(1);
    }

    const testDebate = debates[0];
    console.log(`✅ Fetched debate: "${testDebate.title}"`);
    console.log(`   Contributions: ${testDebate.contributions.length}`);
    console.log();

    // Step 2: Process through all 4 chunking strategies
    const pipelines = [
      { name: 'semantic_1024', pipeline: new SemanticPipeline1024() },
      { name: 'semantic_256', pipeline: new SemanticPipeline256() },
      { name: 'late_1024', pipeline: new LateChunkingPipeline1024() },
      { name: 'late_256', pipeline: new LateChunkingPipeline256() },
    ];

    const allChunks: Chunk[] = [];

    for (const { name, pipeline } of pipelines) {
      console.log(`Step 2.${pipelines.indexOf({ name, pipeline }) + 1}: Processing ${name}...`);

      const chunks = await pipeline.process(testDebate);

      // Ensure each chunk has the correct strategy name
      chunks.forEach(chunk => {
        chunk.chunkingStrategy = name;
      });

      console.log(`✅ Generated ${chunks.length} chunks`);
      console.log(
        `   Avg tokens: ${Math.round(chunks.reduce((sum, c) => sum + (c.tokenCount || 0), 0) / chunks.length)}`
      );

      allChunks.push(...chunks);
      console.log();
    }

    // Step 3: Check for existing data
    console.log('Step 3: Checking for existing data...');
    const existingStats = await storage.getStats();

    if (existingStats.totalChunks > 0) {
      console.log(`⚠️  Found ${existingStats.totalChunks} existing chunks:`);
      console.table(existingStats.byStrategy);
      console.log();
      console.log('Delete existing data? (y/n)');

      // For non-interactive scripts, we'll skip deletion
      // You can manually delete with: npm run test:neo4j:reset
      console.log('Skipping deletion. Proceeding with storage...');
      console.log('(Use npm run test:neo4j:reset to clear database)');
      console.log();
    }

    // Step 4: Store all chunks
    console.log('Step 4: Storing chunks in Neo4j...');
    console.log(`Total chunks to store: ${allChunks.length}`);

    // Debug: Check chunk strategies
    if (allChunks.length > 0) {
      console.log('Sample chunk strategies:', allChunks.slice(0, 5).map(c => c.chunkingStrategy));
    }
    console.log();

    const storageResults = [];

    for (const { name } of pipelines) {
      const strategyChunks = allChunks.filter(c => c.chunkingStrategy === name);
      console.log(`Storing ${strategyChunks.length} chunks for ${name}...`);

      const stats = await storage.storeChunks(strategyChunks);
      storageResults.push({ strategy: name, ...stats });

      console.log(`✅ Stored ${stats.chunksStored} chunks with ${stats.relationshipsCreated} relationships`);
      console.log();
    }

    // Step 5: Verify storage
    console.log('Step 5: Verifying storage...');
    const finalStats = await storage.getStats();

    console.log('Storage Summary:');
    console.table({
      'Total Chunks': finalStats.totalChunks,
      'Total Relationships': finalStats.totalRelationships,
    });

    console.log('\nChunks by Strategy:');
    console.table(finalStats.byStrategy);

    console.log();
    console.log('='.repeat(60));
    console.log('✅ Neo4j population complete!');
    console.log('='.repeat(60));
    console.log();
    console.log('Next steps:');
    console.log('1. Run: npm run test:neo4j:search');
    console.log('2. This will test comparative vector search');
    console.log();
    console.log('Or explore in Neo4j Browser:');
    console.log('- Open your Aura instance in browser');
    console.log('- Try: MATCH (c:Chunk) RETURN c LIMIT 25');
    console.log();

  } catch (error) {
    console.error('❌ Error during population:', error);
    throw error;
  } finally {
    await client.close();
  }
}

populateNeo4j();
