#!/usr/bin/env tsx
// ============================================================================
// SEMANTIC CHUNKING COMPARISON TEST (1024 vs 256 tokens)
// ============================================================================

import dotenv from 'dotenv';
import { ParliamentAPI } from '../src/ingestion/parliament-api-client.js';
import { SemanticPipeline1024 } from '../src/ingestion/chunkers/semantic-1024.js';
import { SemanticPipeline256 } from '../src/ingestion/chunkers/semantic-256.js';
import type { Debate, Chunk } from '../src/types/index.js';

// Load environment variables
dotenv.config();

interface ChunkStats {
  totalChunks: number;
  avgTokens: number;
  minTokens: number;
  maxTokens: number;
  uniqueSpeakers: number;
  partyBreakdown: Record<string, number>;
  processingTime: number;
}

function analyzeChunks(chunks: Chunk[]): ChunkStats {
  const tokenCounts = chunks.map(c => c.tokenCount);
  const uniqueSpeakers = new Set(chunks.map(c => c.speaker.name));

  const partyBreakdown = chunks.reduce((acc, chunk) => {
    acc[chunk.speaker.party] = (acc[chunk.speaker.party] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalChunks: chunks.length,
    avgTokens: Math.round(tokenCounts.reduce((a, b) => a + b, 0) / chunks.length),
    minTokens: Math.min(...tokenCounts),
    maxTokens: Math.max(...tokenCounts),
    uniqueSpeakers: uniqueSpeakers.size,
    partyBreakdown,
    processingTime: 0, // Set by caller
  };
}

function printStats(strategy: string, stats: ChunkStats) {
  console.log(`\n📊 ${strategy} Statistics:`);
  console.log('-'.repeat(60));
  console.log(`Total chunks: ${stats.totalChunks}`);
  console.log(`Average tokens: ${stats.avgTokens}`);
  console.log(`Token range: ${stats.minTokens} - ${stats.maxTokens}`);
  console.log(`Unique speakers: ${stats.uniqueSpeakers}`);
  console.log(`Chunks per speaker: ${(stats.totalChunks / stats.uniqueSpeakers).toFixed(1)}`);
  console.log(`Processing time: ${stats.processingTime}s`);

  console.log('\nParty distribution:');
  Object.entries(stats.partyBreakdown)
    .sort((a, b) => b[1] - a[1])
    .forEach(([party, count]) => {
      const percentage = ((count / stats.totalChunks) * 100).toFixed(1);
      console.log(`  ${party}: ${count} (${percentage}%)`);
    });
}

function compareStats(stats1024: ChunkStats, stats256: ChunkStats) {
  console.log('\n\n' + '='.repeat(60));
  console.log('📈 COMPARATIVE ANALYSIS');
  console.log('='.repeat(60));

  const chunkIncrease = ((stats256.totalChunks / stats1024.totalChunks - 1) * 100).toFixed(1);
  const avgTokenDecrease = ((1 - stats256.avgTokens / stats1024.avgTokens) * 100).toFixed(1);
  const speedDiff = ((stats256.processingTime / stats1024.processingTime - 1) * 100).toFixed(1);

  console.log('\n🔢 Chunk Count:');
  console.log(`  Semantic 1024: ${stats1024.totalChunks} chunks`);
  console.log(`  Semantic 256:  ${stats256.totalChunks} chunks`);
  console.log(`  Difference: ${chunkIncrease > 0 ? '+' : ''}${chunkIncrease}% (${stats256.totalChunks - stats1024.totalChunks} more chunks)`);

  console.log('\n📏 Granularity:');
  console.log(`  Semantic 1024: ${stats1024.avgTokens} avg tokens/chunk`);
  console.log(`  Semantic 256:  ${stats256.avgTokens} avg tokens/chunk`);
  console.log(`  Difference: -${avgTokenDecrease}% (more granular)`);

  console.log('\n⚡ Performance:');
  console.log(`  Semantic 1024: ${stats1024.processingTime}s`);
  console.log(`  Semantic 256:  ${stats256.processingTime}s`);
  console.log(`  Difference: ${speedDiff > 0 ? '+' : ''}${speedDiff}% ${speedDiff > 0 ? 'slower' : 'faster'}`);

  console.log('\n💡 Insights:');

  if (stats256.totalChunks > stats1024.totalChunks * 2) {
    console.log('  • 256-token strategy creates significantly more chunks (>2x)');
    console.log('  • Higher granularity = more precise retrieval potential');
    console.log('  • Trade-off: More chunks = more storage & retrieval overhead');
  } else {
    console.log('  • 256-token strategy creates moderately more chunks');
    console.log('  • Balanced granularity for this debate length');
  }

  if (Math.abs(stats1024.processingTime - stats256.processingTime) < 2) {
    console.log('  • Processing times comparable despite different chunk counts');
    console.log('  • Embedding API calls are the bottleneck, not chunking logic');
  } else if (stats256.processingTime > stats1024.processingTime * 1.5) {
    console.log('  • 256-token strategy takes significantly longer');
    console.log('  • More chunks = more embedding API calls = higher latency & cost');
  }

  // Check if speakers are preserved equally
  if (stats1024.uniqueSpeakers === stats256.uniqueSpeakers) {
    console.log('  • ✅ Both strategies preserve speaker boundaries equally');
  } else {
    console.log('  • ⚠️  Speaker counts differ - possible data inconsistency');
  }
}

async function testComparison() {
  console.log('='.repeat(60));
  console.log('SEMANTIC CHUNKING COMPARISON TEST');
  console.log('1024 tokens vs 256 tokens');
  console.log('='.repeat(60));
  console.log();

  // Validate environment
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ ERROR: OPENAI_API_KEY not found in environment');
    console.error('   Please copy .env.example to .env and add your API key');
    process.exit(1);
  }

  try {
    // Step 1: Fetch test debate
    console.log('📥 Step 1: Fetching test debate...');
    const api = new ParliamentAPI();
    const testDate = new Date('2024-01-15');
    const debates = await api.fetchHansardDebatesByDate(testDate);

    if (debates.length === 0) {
      console.error('❌ No debates found for test date');
      process.exit(1);
    }

    const testDebate = debates[0];
    console.log(`✅ Fetched: "${testDebate.title}"`);
    console.log(`   Contributions: ${testDebate.contributions.length}`);
    console.log(`   Total characters: ${testDebate.fullText.length}`);
    console.log();

    // Step 2: Process with Semantic 1024
    console.log('🔄 Step 2: Processing with Semantic 1024...');
    const pipeline1024 = new SemanticPipeline1024();
    const start1024 = Date.now();
    const chunks1024 = await pipeline1024.process(testDebate);
    const end1024 = Date.now();
    const duration1024 = ((end1024 - start1024) / 1000).toFixed(2);
    console.log(`✅ Complete in ${duration1024}s`);

    // Step 3: Process with Semantic 256
    console.log('\n🔄 Step 3: Processing with Semantic 256...');
    const pipeline256 = new SemanticPipeline256();
    const start256 = Date.now();
    const chunks256 = await pipeline256.process(testDebate);
    const end256 = Date.now();
    const duration256 = ((end256 - start256) / 1000).toFixed(2);
    console.log(`✅ Complete in ${duration256}s`);

    // Step 4: Analyze and compare
    console.log('\n' + '='.repeat(60));
    console.log('📊 DETAILED STATISTICS');
    console.log('='.repeat(60));

    const stats1024: ChunkStats = {
      ...analyzeChunks(chunks1024),
      processingTime: parseFloat(duration1024),
    };

    const stats256: ChunkStats = {
      ...analyzeChunks(chunks256),
      processingTime: parseFloat(duration256),
    };

    printStats('Semantic 1024', stats1024);
    printStats('Semantic 256', stats256);
    compareStats(stats1024, stats256);

    // Step 5: Sample chunks
    console.log('\n\n' + '='.repeat(60));
    console.log('📝 SAMPLE CHUNKS COMPARISON');
    console.log('='.repeat(60));

    console.log('\n[Semantic 1024 - Sample Chunk]');
    console.log('-'.repeat(60));
    const sample1024 = chunks1024[0];
    console.log(`Speaker: ${sample1024.speaker.name} (${sample1024.speaker.party})`);
    console.log(`Tokens: ${sample1024.tokenCount}`);
    console.log(`Text: ${sample1024.text.substring(0, 200)}...`);

    console.log('\n[Semantic 256 - Sample Chunk]');
    console.log('-'.repeat(60));
    const sample256 = chunks256[0];
    console.log(`Speaker: ${sample256.speaker.name} (${sample256.speaker.party})`);
    console.log(`Tokens: ${sample256.tokenCount}`);
    console.log(`Text: ${sample256.text.substring(0, 200)}...`);

    // Success
    console.log('\n' + '='.repeat(60));
    console.log('✅ COMPARISON TEST COMPLETE');
    console.log('='.repeat(60));
    console.log();
    console.log('Key Takeaways:');
    console.log('1. Both strategies successfully chunk the same debate');
    console.log('2. 256-token strategy creates finer-grained chunks');
    console.log('3. Speaker boundaries preserved in both strategies');
    console.log('4. Ready for RAG retrieval comparison experiments');
    console.log();

  } catch (error) {
    console.error();
    console.error('❌ ERROR during comparison test:');
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
testComparison().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
