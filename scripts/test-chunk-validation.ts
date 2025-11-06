/**
 * Chunk Quality Validation Test
 *
 * Validates and compares chunks from all four chunking strategies:
 * - Semantic 1024
 * - Semantic 256
 * - Late Chunking 1024
 * - Late Chunking 256
 */

import 'dotenv/config';
import { mkdirSync } from 'fs';
import { ParliamentAPI } from '../src/ingestion/parliament-api-client.js';
import {
  SemanticPipeline1024,
  SemanticPipeline256,
  LateChunkingPipeline1024,
  LateChunkingPipeline256,
  type Chunk,
} from '../src/ingestion/chunkers/index.js';
import { ChunkQualityValidator } from '../src/ingestion/validation/chunk-quality-validator.js';
import { ValidationReportExporter } from '../src/ingestion/validation/report-exporter.js';

async function testChunkValidation() {
  console.log('='.repeat(80));
  console.log('CHUNK QUALITY VALIDATION TEST');
  console.log('='.repeat(80));
  console.log();

  // Validate environment
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ ERROR: OPENAI_API_KEY not found in environment');
    process.exit(1);
  }

  try {
    // Step 1: Fetch test debate
    console.log('📥 Step 1: Fetching test debate from Parliament API...');
    const api = new ParliamentAPI();
    const testDate = new Date('2024-01-15');
    const debates = await api.fetchHansardDebatesByDate(testDate);

    if (debates.length === 0) {
      console.error('❌ No debates found for test date');
      process.exit(1);
    }

    const debate = debates[0];
    console.log(`✅ Fetched debate: "${debate.title}"`);
    console.log(`   Date: ${debate.date.toISOString().split('T')[0]}`);
    console.log(`   Contributions: ${debate.contributions.length}`);
    console.log();

    // Step 2: Process debate with all four strategies
    console.log('🔄 Step 2: Processing debate with all four chunking strategies...');
    console.log();

    const chunksByStrategy = new Map<string, Chunk[]>();

    // Process with Semantic 1024
    console.log('   Processing: Semantic 1024...');
    const semantic1024 = new SemanticPipeline1024();
    const chunks1024 = await semantic1024.process(debate);
    chunksByStrategy.set('semantic_1024', chunks1024);
    console.log(`   ✓ Created ${chunks1024.length} chunks`);

    // Process with Semantic 256
    console.log('   Processing: Semantic 256...');
    const semantic256 = new SemanticPipeline256();
    const chunks256 = await semantic256.process(debate);
    chunksByStrategy.set('semantic_256', chunks256);
    console.log(`   ✓ Created ${chunks256.length} chunks`);

    // Process with Late Chunking 1024
    console.log('   Processing: Late Chunking 1024...');
    const late1024 = new LateChunkingPipeline1024();
    const lateChunks1024 = await late1024.process(debate);
    chunksByStrategy.set('late_chunking_1024', lateChunks1024);
    console.log(`   ✓ Created ${lateChunks1024.length} chunks`);

    // Process with Late Chunking 256
    console.log('   Processing: Late Chunking 256...');
    const late256 = new LateChunkingPipeline256();
    const lateChunks256 = await late256.process(debate);
    chunksByStrategy.set('late_chunking_256', lateChunks256);
    console.log(`   ✓ Created ${lateChunks256.length} chunks`);
    console.log();

    // Step 3: Run validation
    console.log('🔍 Step 3: Running chunk quality validation...');
    console.log();

    const validator = new ChunkQualityValidator();
    const results = validator.validate(chunksByStrategy);

    // Display results
    console.log('='.repeat(80));
    console.log('VALIDATION RESULTS');
    console.log('='.repeat(80));
    console.log();

    // 1. Chunk Overlap
    console.log('📊 1. CHUNK OVERLAP ANALYSIS');
    console.log('-'.repeat(80));
    console.log('Text overlap between strategies:');
    for (const [comparison, percentage] of Object.entries(results.chunkOverlap.textOverlapPercentages)) {
      console.log(`   ${comparison.padEnd(40)} ${percentage.toFixed(2)}%`);
    }
    console.log();
    console.log('Identical chunks:');
    for (const [comparison, count] of Object.entries(results.chunkOverlap.identicalChunks)) {
      console.log(`   ${comparison.padEnd(40)} ${count} chunks`);
    }
    console.log();
    console.log('Average similarity (word overlap):');
    for (const [comparison, similarity] of Object.entries(results.chunkOverlap.averageSimilarity)) {
      console.log(`   ${comparison.padEnd(40)} ${(similarity * 100).toFixed(2)}%`);
    }
    console.log();

    // 2. Speaker Diversity
    console.log('👥 2. SPEAKER DIVERSITY ANALYSIS');
    console.log('-'.repeat(80));
    for (const [strategy, metrics] of Object.entries(results.speakerDiversity.byStrategy)) {
      console.log(`Strategy: ${strategy}`);
      console.log(`   Unique speakers: ${metrics.uniqueSpeakers}`);
      console.log(`   Dominant speaker: ${metrics.dominantSpeaker.name} (${metrics.dominantSpeaker.percentage.toFixed(1)}%)`);
      console.log(`   Top 3 speakers by chunk count:`);
      const sortedSpeakers = Object.entries(metrics.chunksPerSpeaker)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
      for (const [speaker, count] of sortedSpeakers) {
        console.log(`      - ${speaker}: ${count} chunks`);
      }
      console.log();
    }

    // 3. Temporal Accuracy
    console.log('⏰ 3. TEMPORAL ACCURACY ANALYSIS');
    console.log('-'.repeat(80));
    for (const [strategy, metrics] of Object.entries(results.temporalAccuracy.byStrategy)) {
      console.log(`Strategy: ${strategy}`);
      console.log(`   Chunks with dates: ${metrics.chunksWithDates}`);
      console.log(`   Invalid dates: ${metrics.chunksWithInvalidDates}`);
      console.log(`   Date consistency: ${metrics.dateConsistency.toFixed(2)}%`);
      const seqMetrics = results.temporalAccuracy.sequenceIntegrity[strategy];
      console.log(`   Sequence breaks: ${seqMetrics.totalSequenceBreaks}`);
      console.log(`   Avg sequence gap: ${seqMetrics.averageSequenceGap.toFixed(2)}`);
      console.log();
    }

    // 4. Party Balance
    console.log('🏛️  4. PARTY BALANCE ANALYSIS');
    console.log('-'.repeat(80));
    for (const [strategy, metrics] of Object.entries(results.partyBalance.byStrategy)) {
      console.log(`Strategy: ${strategy}`);
      console.log(`   Gov/Opp ratio: ${metrics.governmentOppositionRatio.toFixed(2)}`);
      console.log(`   Dominant party: ${metrics.dominantParty.name} (${metrics.dominantParty.percentage.toFixed(1)}%)`);
      console.log(`   Party distribution:`);
      const sortedParties = Object.entries(metrics.partyDistribution)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      for (const [party, count] of sortedParties) {
        const percentage = (count / chunksByStrategy.get(strategy.replace(/Strategy: /, ''))!.length) * 100;
        console.log(`      ${party.padEnd(20)} ${count} chunks (${percentage.toFixed(1)}%)`);
      }
      console.log();
    }

    console.log('Systematic bias detection:');
    for (const [party, bias] of Object.entries(results.partyBalance.systematicBias)) {
      if (bias.overrepresentedIn.length > 0 || bias.underrepresentedIn.length > 0) {
        console.log(`   ${party}:`);
        if (bias.overrepresentedIn.length > 0) {
          console.log(`      Overrepresented in: ${bias.overrepresentedIn.join(', ')}`);
        }
        if (bias.underrepresentedIn.length > 0) {
          console.log(`      Underrepresented in: ${bias.underrepresentedIn.join(', ')}`);
        }
      }
    }
    console.log();

    // 5. Metadata Integrity
    console.log('✅ 5. METADATA INTEGRITY ANALYSIS');
    console.log('-'.repeat(80));
    for (const [strategy, metrics] of Object.entries(results.metadataIntegrity.byStrategy)) {
      console.log(`Strategy: ${strategy}`);
      console.log(`   Total chunks: ${metrics.totalChunks}`);
      console.log(`   Missing metadata: ${metrics.chunksWithMissingMetadata}`);
      console.log(`   Completeness: ${metrics.metadataCompleteness.toFixed(2)}%`);
      console.log(`   Invalid Hansard refs: ${metrics.invalidHansardReferences}`);
      console.log();
    }

    console.log('Field-level validation (all strategies):');
    console.log(`   Speaker:           ${results.metadataIntegrity.fieldValidation.speaker.valid} valid, ${results.metadataIntegrity.fieldValidation.speaker.invalid} invalid`);
    console.log(`   Hansard Reference: ${results.metadataIntegrity.fieldValidation.hansardReference.valid} valid, ${results.metadataIntegrity.fieldValidation.hansardReference.invalid} invalid`);
    console.log(`   Debate Info:       ${results.metadataIntegrity.fieldValidation.debateInfo.valid} valid, ${results.metadataIntegrity.fieldValidation.debateInfo.invalid} invalid`);
    console.log(`   Embedding:         ${results.metadataIntegrity.fieldValidation.embedding.valid} valid, ${results.metadataIntegrity.fieldValidation.embedding.invalid} invalid`);
    console.log();

    // 6. Overall Summary
    console.log('📋 6. OVERALL SUMMARY');
    console.log('-'.repeat(80));
    console.log(`Total chunks analyzed: ${results.summary.totalChunksAnalyzed}`);
    console.log(`Strategies compared: ${results.summary.strategiesCompared.join(', ')}`);
    console.log(`Overall divergence: ${results.summary.overallDivergence.toFixed(2)}%`);
    console.log();

    if (results.summary.significantDifferences.length > 0) {
      console.log('⚠️  Significant differences detected:');
      for (const diff of results.summary.significantDifferences) {
        console.log(`   - ${diff}`);
      }
      console.log();
    }

    if (results.summary.recommendations.length > 0) {
      console.log('💡 Recommendations:');
      for (const rec of results.summary.recommendations) {
        console.log(`   - ${rec}`);
      }
      console.log();
    }

    console.log('='.repeat(80));
    console.log('VALIDATION COMPLETE');
    console.log('='.repeat(80));
    console.log();

    // Step 4: Export reports
    console.log('📄 Step 4: Exporting validation reports...');
    console.log();

    // Create output directory if it doesn't exist
    const outputDir = './validation-reports';
    try {
      mkdirSync(outputDir, { recursive: true });
    } catch (err) {
      // Directory might already exist, ignore
    }

    const exporter = new ValidationReportExporter();
    const { jsonPath, markdownPath } = exporter.export(results, outputDir, debate.title);

    console.log(`✅ Reports exported successfully:`);
    console.log(`   JSON:     ${jsonPath}`);
    console.log(`   Markdown: ${markdownPath}`);
    console.log();
    console.log('='.repeat(80));
    console.log('ALL TASKS COMPLETE');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error during validation:', error);
    throw error;
  }
}

// Run the test
testChunkValidation().catch(console.error);
