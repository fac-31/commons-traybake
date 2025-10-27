#!/usr/bin/env tsx
// ============================================================================
// TEST PARLIAMENT API CONNECTION
// Run this to verify the API client works
// Usage: npm run test:api or tsx scripts/test-parliament-api.ts
// ============================================================================

import ParliamentAPI from '../src/ingestion/parliament-api-client';
import { logger } from '../src/utils/logger';

async function testConnection() {
  logger.info('='.repeat(60));
  logger.info('TESTING PARLIAMENT API CONNECTION');
  logger.info('='.repeat(60));

  const api = new ParliamentAPI();

  // Test 1: Fetch recent debates by topic
  logger.info('\n[Test 1] Fetching debates about "NHS"...');
  try {
    const debates = await api.fetchDebatesByTopic('NHS', {
      start: new Date('2024-01-01'),
      end: new Date('2024-12-31'),
    });

    logger.info(`✓ Found ${debates.length} debates`);
    
    if (debates.length > 0) {
      logger.info('\nFirst debate:');
      logger.info(`  Title: ${debates[0].title}`);
      logger.info(`  Date: ${debates[0].date.toISOString().split('T')[0]}`);
      logger.info(`  Type: ${debates[0].type}`);
      logger.info(`  Contributions: ${debates[0].contributions.length}`);
    }
  } catch (error) {
    logger.error('✗ Failed to fetch debates:', error);
  }

  // Test 2: Fetch Hansard debates for a specific date
  logger.info('\n[Test 2] Fetching Hansard debates for a specific date...');
  try {
    const date = new Date('2024-10-01');
    const hansardDebates = await api.fetchHansardDebatesByDate(date);

    logger.info(`✓ Found ${hansardDebates.length} Hansard debates`);

    if (hansardDebates.length > 0) {
      logger.info('\nFirst Hansard debate:');
      logger.info(`  Title: ${hansardDebates[0].title}`);
      logger.info(`  Contributions: ${hansardDebates[0].contributions.length}`);
      logger.info(`  Word count: ${hansardDebates[0].fullText.split(/\s+/).length}`);
      
      if (hansardDebates[0].contributions.length > 0) {
        const firstContrib = hansardDebates[0].contributions[0];
        logger.info(`\nFirst speaker: ${firstContrib.speaker.name} (${firstContrib.speaker.party})`);
        logger.info(`  Text preview: ${firstContrib.text.substring(0, 100)}...`);
      }
    }
  } catch (error) {
    logger.error('✗ Failed to fetch Hansard debates:', error);
  }

  // Test 3: Fetch written questions
  logger.info('\n[Test 3] Fetching written questions about "climate"...');
  try {
    const questions = await api.fetchWrittenQuestions('climate', {
      start: new Date('2024-01-01'),
      end: new Date('2024-12-31'),
    });

    logger.info(`✓ Found ${questions.length} written questions`);

    if (questions.length > 0) {
      logger.info('\nFirst question:');
      logger.info(`  From: ${questions[0].speaker.name} (${questions[0].speaker.party})`);
      logger.info(`  Date: ${questions[0].timestamp.toISOString().split('T')[0]}`);
      logger.info(`  Question: ${questions[0].text.substring(0, 150)}...`);
    }
  } catch (error) {
    logger.error('✗ Failed to fetch written questions:', error);
  }

  logger.info('\n' + '='.repeat(60));
  logger.info('API CONNECTION TESTS COMPLETE');
  logger.info('='.repeat(60));
}

// Run tests
testConnection().catch((error) => {
  logger.error('Fatal error during testing:', error);
  process.exit(1);
});