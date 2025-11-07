/**
 * Test Vector Search Across All Strategies
 *
 * Demonstrates comparative search showing how different chunking
 * strategies retrieve different results for the same query.
 */

import 'dotenv/config';
import { VectorSearch, Neo4jClient } from '../src/storage/index.js';
import type { ComparativeSearchResults } from '../src/storage/index.js';

async function testVectorSearch() {
  console.log('='.repeat(60));
  console.log('Comparative Vector Search Test');
  console.log('='.repeat(60));
  console.log();

  // Reset singleton to ensure fresh connection
  await Neo4jClient.reset();

  const client = Neo4jClient.getInstance();
  const search = new VectorSearch();

  try {
    // Verify connection
    const connected = await client.verifyConnection();
    if (!connected) {
      console.error('❌ Failed to connect to Neo4j');
      process.exit(1);
    }

    // Test queries designed to expose chunking differences
    const testQueries = [
      'What is the government\'s position on NHS funding?',
      'How did the opposition respond to the Prime Minister?',
      'What are the concerns about education policy?',
      'What was said about climate change and net zero?',
    ];

    console.log('Running comparative searches on test queries...');
    console.log();

    for (const query of testQueries) {
      console.log('='.repeat(60));
      console.log(`Query: "${query}"`);
      console.log('='.repeat(60));
      console.log();

      const results = await search.comparativeSearch(query, 3);

      printComparativeResults(results);
      console.log();
    }

    console.log('='.repeat(60));
    console.log('✅ Vector search test complete!');
    console.log('='.repeat(60));
    console.log();
    console.log('Key observations to look for:');
    console.log('1. Do different strategies retrieve different chunks?');
    console.log('2. Are 256-token strategies more granular?');
    console.log('3. Does late chunking capture more contextual meaning?');
    console.log('4. Which speakers/parties are favored by each strategy?');
    console.log();

  } catch (error) {
    console.error('❌ Error during search:', error);
    throw error;
  } finally {
    await client.close();
  }
}

function printComparativeResults(results: ComparativeSearchResults) {
  const strategies = [
    'semantic_1024',
    'semantic_256',
    'late_1024',
    'late_256',
  ] as const;

  for (const strategy of strategies) {
    console.log(`\n${strategy.toUpperCase().replace('_', ' ')}`);
    console.log('-'.repeat(60));

    const strategyResults = results[strategy];

    if (strategyResults.length === 0) {
      console.log('  (No results found)');
      continue;
    }

    for (const result of strategyResults) {
      console.log(`  Rank ${result.rank} | Score: ${result.score.toFixed(4)}`);
      console.log(`  Speaker: ${result.chunk.speaker} (${result.chunk.speakerParty})`);
      console.log(`  Debate: ${result.chunk.debate}`);
      console.log(`  Text: ${truncate(result.chunk.text, 150)}`);
      console.log();
    }
  }

  // Analysis: Show divergence
  console.log('\nDIVERGENCE ANALYSIS');
  console.log('-'.repeat(60));

  const uniqueChunkIds = new Set<string>();
  const chunksByStrategy: Record<string, Set<string>> = {
    semantic_1024: new Set(),
    semantic_256: new Set(),
    late_1024: new Set(),
    late_256: new Set(),
  };

  for (const strategy of strategies) {
    for (const result of results[strategy]) {
      uniqueChunkIds.add(result.chunk.id);
      chunksByStrategy[strategy].add(result.chunk.id);
    }
  }

  console.log(`Total unique chunks retrieved: ${uniqueChunkIds.size}`);
  console.log(`Chunks per strategy: 3`);
  console.log(
    `Overlap percentage: ${((12 - uniqueChunkIds.size) / 12 * 100).toFixed(1)}%`
  );
  console.log();

  // Check which strategies retrieved identical results
  const overlaps: string[] = [];
  for (let i = 0; i < strategies.length; i++) {
    for (let j = i + 1; j < strategies.length; j++) {
      const s1 = strategies[i];
      const s2 = strategies[j];
      const intersection = [...chunksByStrategy[s1]].filter(id =>
        chunksByStrategy[s2].has(id)
      );

      if (intersection.length > 0) {
        overlaps.push(
          `  ${s1} ↔ ${s2}: ${intersection.length} shared chunks`
        );
      }
    }
  }

  if (overlaps.length > 0) {
    console.log('Strategy overlaps:');
    overlaps.forEach(o => console.log(o));
  } else {
    console.log('✨ Complete divergence! All strategies retrieved different chunks.');
  }

  console.log();
  console.log(`Execution time: ${results.executionTime}ms`);
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

testVectorSearch();
