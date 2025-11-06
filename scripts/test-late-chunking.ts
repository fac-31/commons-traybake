/**
 * Test script for Late Chunking pipelines
 *
 * Tests both late chunking strategies (1024 and 256 tokens) with contextual embedding blending
 */

import 'dotenv/config';
import { ParliamentAPI } from '../src/ingestion/parliament-api-client.js';
import { LateChunkingPipeline1024, LateChunkingPipeline256 } from '../src/ingestion/chunkers/index.js';

async function testLateChunking() {
  console.log('='.repeat(80));
  console.log('TESTING LATE CHUNKING PIPELINES');
  console.log('='.repeat(80));
  console.log();

  // Validate environment
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ ERROR: OPENAI_API_KEY not found in environment');
    console.error('   Please copy .env.example to .env and add your API key');
    process.exit(1);
  }

  // Initialize API client
  const api = new ParliamentAPI();

  // Fetch a test debate
  console.log('Fetching test debate from Parliament API...');
  const testDate = new Date('2024-01-15');
  const debates = await api.fetchHansardDebatesByDate(testDate);

  if (debates.length === 0) {
    console.error('❌ No debates found for test date');
    console.log('   Try adjusting the test date');
    process.exit(1);
  }

  const debate = debates[0];
  console.log(`✓ Fetched debate: "${debate.title}"`);
  console.log(`  Date: ${debate.date.toISOString().split('T')[0]}`);
  console.log(`  Contributions: ${debate.contributions.length}`);
  console.log();

  // Test Late Chunking 1024
  console.log('='.repeat(80));
  console.log('LATE CHUNKING 1024 STRATEGY');
  console.log('='.repeat(80));
  console.log();

  const pipeline1024 = new LateChunkingPipeline1024();
  console.log('Processing debate with Late Chunking 1024...');
  const startTime1024 = Date.now();
  const chunks1024 = await pipeline1024.process(debate);
  const endTime1024 = Date.now();

  console.log();
  console.log('Results:');
  console.log(`  Total chunks: ${chunks1024.length}`);
  console.log(`  Processing time: ${((endTime1024 - startTime1024) / 1000).toFixed(2)}s`);
  console.log(`  Avg tokens per chunk: ${(chunks1024.reduce((sum, c) => sum + c.tokenCount, 0) / chunks1024.length).toFixed(1)}`);
  console.log(`  Max tokens: ${Math.max(...chunks1024.map(c => c.tokenCount))}`);
  console.log(`  Min tokens: ${Math.min(...chunks1024.map(c => c.tokenCount))}`);
  console.log();

  // Verify blending
  console.log('Verifying contextual blending:');
  const sampleChunk1024 = chunks1024[0];
  console.log(`  ✓ Chunk has embedding: ${sampleChunk1024.embedding ? 'Yes' : 'No'}`);
  console.log(`  ✓ Chunk has debate context: ${sampleChunk1024.debateContextEmbedding ? 'Yes' : 'No'}`);
  console.log(`  ✓ Embedding dimensions: ${sampleChunk1024.embedding?.length || 0}`);
  console.log(`  ✓ Strategy: ${sampleChunk1024.strategy}`);
  console.log();

  // Show sample chunk
  console.log('Sample chunk (first):');
  console.log(`  Speaker: ${sampleChunk1024.speaker.name} (${sampleChunk1024.speaker.party || 'No party'})`);
  console.log(`  Tokens: ${sampleChunk1024.tokenCount}`);
  console.log(`  Text preview: "${sampleChunk1024.text.substring(0, 150)}..."`);
  console.log();

  // Test Late Chunking 256
  console.log('='.repeat(80));
  console.log('LATE CHUNKING 256 STRATEGY');
  console.log('='.repeat(80));
  console.log();

  const pipeline256 = new LateChunkingPipeline256();
  console.log('Processing debate with Late Chunking 256...');
  const startTime256 = Date.now();
  const chunks256 = await pipeline256.process(debate);
  const endTime256 = Date.now();

  console.log();
  console.log('Results:');
  console.log(`  Total chunks: ${chunks256.length}`);
  console.log(`  Processing time: ${((endTime256 - startTime256) / 1000).toFixed(2)}s`);
  console.log(`  Avg tokens per chunk: ${(chunks256.reduce((sum, c) => sum + c.tokenCount, 0) / chunks256.length).toFixed(1)}`);
  console.log(`  Max tokens: ${Math.max(...chunks256.map(c => c.tokenCount))}`);
  console.log(`  Min tokens: ${Math.min(...chunks256.map(c => c.tokenCount))}`);
  console.log();

  // Verify blending
  console.log('Verifying contextual blending:');
  const sampleChunk256 = chunks256[0];
  console.log(`  ✓ Chunk has embedding: ${sampleChunk256.embedding ? 'Yes' : 'No'}`);
  console.log(`  ✓ Chunk has debate context: ${sampleChunk256.debateContextEmbedding ? 'Yes' : 'No'}`);
  console.log(`  ✓ Embedding dimensions: ${sampleChunk256.embedding?.length || 0}`);
  console.log(`  ✓ Strategy: ${sampleChunk256.strategy}`);
  console.log();

  // Show sample chunk
  console.log('Sample chunk (first):');
  console.log(`  Speaker: ${sampleChunk256.speaker.name} (${sampleChunk256.speaker.party || 'No party'})`);
  console.log(`  Tokens: ${sampleChunk256.tokenCount}`);
  console.log(`  Text preview: "${sampleChunk256.text.substring(0, 150)}..."`);
  console.log();

  // Comparison
  console.log('='.repeat(80));
  console.log('COMPARISON: 1024 vs 256');
  console.log('='.repeat(80));
  console.log();

  console.log('Chunk count difference:');
  console.log(`  Late 1024: ${chunks1024.length} chunks`);
  console.log(`  Late 256:  ${chunks256.length} chunks`);
  console.log(`  Ratio:     ${(chunks256.length / chunks1024.length).toFixed(2)}x more chunks with 256`);
  console.log();

  console.log('Speaker diversity:');
  const uniqueSpeakers1024 = new Set(chunks1024.map(c => c.speaker.name)).size;
  const uniqueSpeakers256 = new Set(chunks256.map(c => c.speaker.name)).size;
  console.log(`  Late 1024: ${uniqueSpeakers1024} unique speakers`);
  console.log(`  Late 256:  ${uniqueSpeakers256} unique speakers`);
  console.log();

  console.log('Party distribution (Late 1024):');
  const partyCount1024 = chunks1024.reduce((acc, chunk) => {
    const party = chunk.speaker.party || 'Unknown';
    acc[party] = (acc[party] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  Object.entries(partyCount1024)
    .sort((a, b) => b[1] - a[1])
    .forEach(([party, count]) => {
      console.log(`  ${party}: ${count} chunks (${((count / chunks1024.length) * 100).toFixed(1)}%)`);
    });
  console.log();

  console.log('Party distribution (Late 256):');
  const partyCount256 = chunks256.reduce((acc, chunk) => {
    const party = chunk.speaker.party || 'Unknown';
    acc[party] = (acc[party] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  Object.entries(partyCount256)
    .sort((a, b) => b[1] - a[1])
    .forEach(([party, count]) => {
      console.log(`  ${party}: ${count} chunks (${((count / chunks256.length) * 100).toFixed(1)}%)`);
    });
  console.log();

  // Verify debate context embeddings are identical for all chunks
  console.log('Verifying debate context consistency:');
  const debateEmbedding1024 = chunks1024[0].debateContextEmbedding;
  const allSame1024 = chunks1024.every(chunk =>
    JSON.stringify(chunk.debateContextEmbedding) === JSON.stringify(debateEmbedding1024)
  );
  console.log(`  Late 1024 - All chunks share same debate embedding: ${allSame1024 ? '✓ Yes' : '✗ No'}`);

  const debateEmbedding256 = chunks256[0].debateContextEmbedding;
  const allSame256 = chunks256.every(chunk =>
    JSON.stringify(chunk.debateContextEmbedding) === JSON.stringify(debateEmbedding256)
  );
  console.log(`  Late 256 - All chunks share same debate embedding: ${allSame256 ? '✓ Yes' : '✗ No'}`);
  console.log();

  console.log('='.repeat(80));
  console.log('LATE CHUNKING TEST COMPLETE');
  console.log('='.repeat(80));
}

// Run the test
testLateChunking().catch(console.error);
