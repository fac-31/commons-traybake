/**
 * Reset Neo4j Database
 *
 * Deletes all chunks and relationships.
 * Useful for re-processing with different data or strategies.
 */

import 'dotenv/config';
import { ChunkStorage, Neo4jClient } from '../src/storage/index.js';

async function resetNeo4j() {
  console.log('='.repeat(60));
  console.log('Reset Neo4j Database');
  console.log('='.repeat(60));
  console.log();

  // Reset singleton to ensure fresh connection
  await Neo4jClient.reset();

  const client = Neo4jClient.getInstance();
  const storage = new ChunkStorage();

  try {
    const connected = await client.verifyConnection();
    if (!connected) {
      console.error('❌ Failed to connect to Neo4j');
      process.exit(1);
    }

    // Check current state
    const stats = await storage.getStats();
    console.log('Current database state:');
    console.table({
      'Total Chunks': stats.totalChunks,
      'Total Relationships': stats.totalRelationships,
    });

    if (stats.totalChunks === 0) {
      console.log('\n✅ Database is already empty');
      return;
    }

    console.log('\nChunks by strategy:');
    console.table(stats.byStrategy);
    console.log();

    console.log('⚠️  WARNING: This will delete all data!');
    console.log('Continue with deletion...');
    console.log();

    // Delete all chunks
    const deleted = await storage.deleteAllChunks();

    console.log(`✅ Deleted ${deleted} chunks and all relationships`);
    console.log();

    // Verify deletion
    const finalStats = await storage.getStats();
    console.log('Final state:');
    console.table({
      'Total Chunks': finalStats.totalChunks,
      'Total Relationships': finalStats.totalRelationships,
    });

    console.log();
    console.log('='.repeat(60));
    console.log('✅ Database reset complete!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error during reset:', error);
    throw error;
  } finally {
    await client.close();
  }
}

resetNeo4j();
