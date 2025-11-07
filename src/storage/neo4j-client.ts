/**
 * Neo4j Client for Commons Traybake
 *
 * Manages connection pooling and query execution for Neo4j vector database.
 * Supports Neo4j 5.11+ with native vector index capabilities.
 */

import neo4j, { Driver, Session } from 'neo4j-driver';
import dotenv from 'dotenv';

dotenv.config();

export class Neo4jClient {
  private driver: Driver;
  private static instance: Neo4jClient;

  private constructor() {
    const uri = process.env.NEO4J_URI;
    const user = process.env.NEO4J_USER;
    const password = process.env.NEO4J_PASSWORD;

    if (!uri || !user || !password) {
      throw new Error(
        'Neo4j connection details missing. Check NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD in .env'
      );
    }

    this.driver = neo4j.driver(
      uri,
      neo4j.auth.basic(user, password),
      {
        maxConnectionPoolSize: 50,
        connectionAcquisitionTimeout: 60000,
        maxTransactionRetryTime: 30000,
      }
    );

    console.log(`[Neo4j] Connected to ${uri}`);
  }

  /**
   * Get singleton instance of Neo4j client
   */
  public static getInstance(): Neo4jClient {
    if (!Neo4jClient.instance) {
      Neo4jClient.instance = new Neo4jClient();
    }
    return Neo4jClient.instance;
  }

  /**
   * Reset the singleton instance (for testing or reconnecting)
   */
  public static async reset(): Promise<void> {
    if (Neo4jClient.instance) {
      await Neo4jClient.instance.close();
      Neo4jClient.instance = null as any;
    }
  }

  /**
   * Get a new session for running queries
   */
  public getSession(database?: string): Session {
    return database ? this.driver.session({ database }) : this.driver.session();
  }

  /**
   * Verify connection to Neo4j
   */
  public async verifyConnection(): Promise<boolean> {
    const session = this.getSession();
    try {
      const result = await session.run('RETURN 1 AS connected');
      const connected = result.records[0]?.get('connected').toInt() === 1;
      console.log('[Neo4j] Connection verified:', connected);
      return connected;
    } catch (error: any) {
      console.error('[Neo4j] Connection failed:');
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      if (error.code === 'Neo.ClientError.Security.Unauthorized') {
        console.error('\n⚠️  Authentication failed - check username and password');
      }
      return false;
    } finally {
      await session.close();
    }
  }

  /**
   * Execute a Cypher query with parameters
   */
  public async run(
    query: string,
    params: Record<string, any> = {}
  ): Promise<any[]> {
    const session = this.getSession();
    try {
      const result = await session.run(query, params);
      return result.records.map(record => record.toObject());
    } catch (error) {
      console.error('[Neo4j] Query failed:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Execute multiple queries in a transaction
   */
  public async runInTransaction(
    queries: Array<{ query: string; params?: Record<string, any> }>
  ): Promise<void> {
    const session = this.getSession();
    const tx = session.beginTransaction();

    try {
      for (const { query, params = {} } of queries) {
        await tx.run(query, params);
      }
      await tx.commit();
    } catch (error) {
      await tx.rollback();
      console.error('[Neo4j] Transaction failed:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Close all connections and cleanup
   */
  public async close(): Promise<void> {
    await this.driver.close();
    console.log('[Neo4j] Connection closed');
  }
}
