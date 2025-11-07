/**
 * Neo4j Setup and Verification Script
 *
 * Tests Neo4j connection, initializes schema, and verifies indexes
 */

import 'dotenv/config';

import { Neo4jClient, Neo4jSchema } from '../src/storage/index.js';

async function testNeo4jSetup() {
  console.log('='.repeat(60));
  console.log('Neo4j Setup and Verification');
  console.log('='.repeat(60));
  console.log();

  // Reset singleton to ensure fresh connection
  await Neo4jClient.reset();

  const client = Neo4jClient.getInstance();
  const schema = new Neo4jSchema();

  try {
    // Step 1: Verify connection
    console.log('Step 1: Verifying connection...');
    const connected = await client.verifyConnection();

    if (!connected) {
      console.error('❌ Failed to connect to Neo4j');
      console.log('\nPlease check:');
      console.log('1. Neo4j Aura instance is running');
      console.log('2. .env file has correct credentials:');
      console.log('   - NEO4J_URI (should start with neo4j+s://)');
      console.log('   - NEO4J_USER');
      console.log('   - NEO4J_PASSWORD');
      process.exit(1);
    }

    console.log('✅ Connected to Neo4j successfully\n');

    // Step 2: Initialize schema
    console.log('Step 2: Initializing schema...');
    await schema.initialize();
    console.log();

    // Step 3: Verify indexes
    console.log('Step 3: Verifying indexes...');
    await schema.verifyIndexes();
    console.log();

    // Step 4: Show database info
    console.log('Step 4: Database information...');
    const dbInfo = await client.run(`
      CALL dbms.components()
      YIELD name, versions, edition
      RETURN name, versions[0] as version, edition
    `);

    console.log('Database:', dbInfo[0]);
    console.log();

    console.log('='.repeat(60));
    console.log('✅ Neo4j setup complete and verified!');
    console.log('='.repeat(60));
    console.log();
    console.log('Next steps:');
    console.log('1. Run: npm run test:neo4j:populate');
    console.log('2. This will load all 4 chunking strategies into Neo4j');
    console.log();

  } catch (error) {
    console.error('❌ Error during setup:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

testNeo4jSetup();
