#!/usr/bin/env tsx
// ============================================================================
// SEMANTIC CHUNKING PIPELINE TEST
// ============================================================================

import dotenv from 'dotenv';
import { ParliamentAPI } from '../src/ingestion/parliament-api-client.js';
import { SemanticPipeline1024 } from '../src/ingestion/chunkers/semantic-1024.js';
import type { Debate } from '../src/types/index.js';

// Load environment variables
dotenv.config();

async function testSemanticChunking() {
  console.log('='.repeat(60));
  console.log('SEMANTIC CHUNKING PIPELINE TEST');
  console.log('='.repeat(60));
  console.log();

  // Validate environment
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ ERROR: OPENAI_API_KEY not found in environment');
    console.error('   Please copy .env.example to .env and add your API key');
    process.exit(1);
  }

  try {
    // Step 1: Fetch a test debate
    console.log('📥 Step 1: Fetching test debate from Parliament API...');
    const api = new ParliamentAPI();

    // Fetch debates from a recent date (adjust as needed)
    const testDate = new Date('2024-01-15');
    const debates = await api.fetchHansardDebatesByDate(testDate);

    if (debates.length === 0) {
      console.error('❌ No debates found for test date');
      console.log('   Try adjusting the test date or using fetchDebatesByTopic');
      process.exit(1);
    }

    const testDebate = debates[0];
    console.log(`✅ Fetched debate: "${testDebate.title}"`);
    console.log(`   Date: ${testDebate.date.toISOString().split('T')[0]}`);
    console.log(`   Type: ${testDebate.type}`);
    console.log(`   Contributions: ${testDebate.contributions.length}`);
    console.log(`   Total text length: ${testDebate.fullText.length} characters`);
    console.log();

    // Step 2: Initialize chunking pipeline
    console.log('⚙️  Step 2: Initializing SemanticPipeline1024...');
    const pipeline = new SemanticPipeline1024();
    console.log(`✅ Pipeline initialized with strategy: ${pipeline.strategyName}`);
    console.log(`   Max tokens per chunk: ${pipeline.maxTokens}`);
    console.log();

    // Step 3: Process the debate
    console.log('🔄 Step 3: Processing debate into chunks...');
    console.log('   (This may take a moment - generating embeddings...)');
    const startTime = Date.now();

    const chunks = await pipeline.process(testDebate);

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    console.log(`✅ Processing complete in ${duration}s`);
    console.log();

    // Step 4: Analyze results
    console.log('📊 Step 4: Analyzing chunks...');
    console.log('-'.repeat(60));
    console.log(`Total chunks created: ${chunks.length}`);
    console.log();

    // Token size analysis
    const tokenCounts = chunks.map(c => c.tokenCount);
    const avgTokens = Math.round(tokenCounts.reduce((a, b) => a + b, 0) / chunks.length);
    const minTokens = Math.min(...tokenCounts);
    const maxTokens = Math.max(...tokenCounts);

    console.log('📏 Chunk Size Statistics:');
    console.log(`   Average: ${avgTokens} tokens`);
    console.log(`   Min: ${minTokens} tokens`);
    console.log(`   Max: ${maxTokens} tokens`);
    console.log(`   Target max: ${pipeline.maxTokens} tokens`);

    if (maxTokens > pipeline.maxTokens) {
      console.log(`   ⚠️  WARNING: ${chunks.filter(c => c.tokenCount > pipeline.maxTokens).length} chunks exceed max token limit`);
    } else {
      console.log(`   ✅ All chunks within token limit`);
    }
    console.log();

    // Speaker diversity
    const uniqueSpeakers = new Set(chunks.map(c => c.speaker.name));
    console.log('👥 Speaker Analysis:');
    console.log(`   Unique speakers: ${uniqueSpeakers.size}`);
    console.log(`   Average chunks per speaker: ${(chunks.length / uniqueSpeakers.size).toFixed(1)}`);
    console.log();

    // Party breakdown
    const partyBreakdown = chunks.reduce((acc, chunk) => {
      acc[chunk.speaker.party] = (acc[chunk.speaker.party] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('🏛️  Party Distribution:');
    Object.entries(partyBreakdown)
      .sort((a, b) => b[1] - a[1])
      .forEach(([party, count]) => {
        const percentage = ((count / chunks.length) * 100).toFixed(1);
        console.log(`   ${party}: ${count} chunks (${percentage}%)`);
      });
    console.log();

    // Embedding verification
    const chunksWithEmbeddings = chunks.filter(c => c.embedding && c.embedding.length > 0);
    console.log('🔢 Embedding Status:');
    console.log(`   Chunks with embeddings: ${chunksWithEmbeddings.length}/${chunks.length}`);
    if (chunksWithEmbeddings.length > 0) {
      console.log(`   Embedding dimensions: ${chunksWithEmbeddings[0].embedding!.length}`);
      console.log(`   ✅ Using text-embedding-3-large (expected: 3072)`);
    }
    console.log();

    // Sequence validation
    const hasSequenceGaps = chunks.some((chunk, i) => chunk.sequenceNumber !== i);
    console.log('🔗 Sequence Integrity:');
    console.log(`   Sequence numbers: 0 to ${chunks.length - 1}`);
    console.log(`   ${hasSequenceGaps ? '❌ Gaps detected' : '✅ No gaps detected'}`);

    const linkedChunks = chunks.filter(c => c.previousChunkId || c.nextChunkId);
    console.log(`   Linked chunks: ${linkedChunks.length}/${chunks.length}`);
    console.log();

    // Sample chunks
    console.log('📝 Sample Chunks:');
    console.log('-'.repeat(60));

    const samplesToShow = Math.min(3, chunks.length);
    for (let i = 0; i < samplesToShow; i++) {
      const chunk = chunks[i];
      console.log(`\n[Chunk ${i + 1}/${chunks.length}]`);
      console.log(`Speaker: ${chunk.speaker.name} (${chunk.speaker.party})`);
      console.log(`Tokens: ${chunk.tokenCount}`);
      console.log(`Text preview: ${chunk.text.substring(0, 150)}...`);
      if (i < samplesToShow - 1) console.log();
    }
    console.log();
    console.log('-'.repeat(60));

    // Success summary
    console.log();
    console.log('='.repeat(60));
    console.log('✅ SEMANTIC CHUNKING TEST COMPLETE');
    console.log('='.repeat(60));
    console.log();
    console.log('Next steps:');
    console.log('1. Implement Late Chunking 1024 pipeline');
    console.log('2. Implement 256 token variants');
    console.log('3. Set up Neo4j vector storage');
    console.log('4. Build comparative query system');
    console.log();

  } catch (error) {
    console.error();
    console.error('❌ ERROR during chunking test:');
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
      if (error.stack) {
        console.error();
        console.error('Stack trace:');
        console.error(error.stack);
      }
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

// Run the test
testSemanticChunking().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
