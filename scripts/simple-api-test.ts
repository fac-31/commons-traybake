#!/usr/bin/env tsx
// ============================================================================
// SIMPLE PARLIAMENT API TEST (with Treaty endpoint and Historic Hansard)
// ============================================================================

import axios from 'axios';

// Helper to safely extract error messages
function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.message;
  } else if (error instanceof Error) {
    return error.message;
  } else {
    return String(error);
  }
}

async function simpleTest() {
  console.log('Testing Parliament API endpoints...\n');

  // Test 1: Treaty API
  console.log('[Test 1] Checking Treaty API...');
  try {
    const response = await axios.get('http://your-api-server/api/Treaty', {
      responseType: 'text', // media type is text/plain
      timeout: 10000,
    });
    console.log(`✓ Treaty API working (status ${response.status})`);
    console.log('Response:');
    console.log(response.data);
  } catch (error: unknown) {
    console.error('✗ Treaty API failed:', getErrorMessage(error));
  }

  // Test 2: Members API
  console.log('\n[Test 2] Checking Members API...');
  try {
    const response = await axios.get(
      'https://members-api.parliament.uk/api/Members/Search?skip=0&take=5',
      { timeout: 10000 }
    );
    console.log(`✓ Members API working - got ${response.data.totalResults} total members`);
  } catch (error: unknown) {
    console.error('✗ Members API failed:', getErrorMessage(error));
  }

  // Test 3: Fetch historic debate content (using Historic Hansard API)
  console.log('\n[Test 3] Fetching historic debate content...');
  try {
    // Known sitting date with debates
    const historicDate = '2002/mar/15';
    const url = `https://api.parliament.uk/historic-hansard/sittings/${historicDate}.js`;

    const response = await axios.get(url, { timeout: 10000 });
    const data = response.data;

    if (data?.debates?.length > 0) {
      const debate = data.debates[0];
      console.log(`✓ Found historic debate for ${historicDate}`);
      console.log(`  First debate title: ${debate.title || debate.heading || 'Untitled'}`);
    } else {
      console.log(`No debates found for ${historicDate}`);
    }
  } catch (error: unknown) {
    console.error('✗ Could not fetch historic debate:', getErrorMessage(error));
  }

  console.log('\n' + '='.repeat(60));
  console.log('Simple API tests complete!');
  console.log('='.repeat(60));
  console.log('\nIf all tests passed, you can now:');
  console.log('1. Save the ParliamentAPI client to: src/ingestion/parliament-api-client.ts');
  console.log('2. Run the full test: npm run test:api');
  console.log('3. Start fetching data for your project!');
}

simpleTest().catch((error: unknown) => console.error(getErrorMessage(error)));
