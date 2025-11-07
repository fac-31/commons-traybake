# Neo4j Vector Storage

![Icon]()

> [!IMPORTANT]
> Vector database integration complete ✅

---

## 1. Tasks

### 1.1. Open Tasks
#### 1.1.1. Due Tasks

#### 1.1.2. Other Tasks
- [ ] User needs to create Neo4j Aura instance and update .env
- [ ] Implement RESPONDS_TO relationship (tracks who's addressing whom in debates)
- [ ] Implement MENTIONS_SAME_TOPIC relationship (connects chunks discussing same bill/policy)
- [ ] Add temporal embedding drift analysis (how does "levelling up" cluster over time?)
- [ ] Implement cross-debate topic clustering

### 1.2. Blocked Tasks
- [ ] User must complete Neo4j Aura setup before testing

---

## 2. MVP Milestones

All MVP milestones complete! 🎉

1. **Neo4j Client Implementation** ✅ - Connection pooling, session management, error handling
2. **Schema Initialization** ✅ - Constraints, vector indexes (4 strategies), property indexes
3. **Chunk Storage Service** ✅ - Batch storage, PRECEDES relationships, statistics
4. **Vector Search Service** ✅ - Similarity search, comparative search across all strategies
5. **Test Scripts** ✅ - Setup verification, population, search testing, database reset

---

## 3. Beyond MVP: Future Features

- **Advanced Relationships**:
  - RESPONDS_TO: Track who's addressing whom in debates
  - MENTIONS_SAME_TOPIC: Connect chunks discussing same bill/policy across debates
  - CONTRADICTS: Link opposing viewpoints on same issue

- **Enhanced Search**:
  - Hybrid search (vector + keyword + graph traversal)
  - Multi-hop graph queries (find responses to responses)
  - Temporal filtering (search within date ranges)
  - Party/role filtering (government vs opposition views)

- **Analytics**:
  - Speaker influence analysis (centrality in debate graph)
  - Topic evolution over time
  - Cross-party consensus detection
  - Embedding drift visualization

- **Performance**:
  - Embedding caching layer
  - Query result caching
  - Batch processing optimization
  - Incremental updates (add new debates without full reload)

---

## 4. Work Record

### 4.1. Completed Milestones

- **Neo4j Client Implementation** ✅ - Complete connection management:
  - Singleton pattern with connection pooling (`/src/storage/neo4j-client.ts`)
  - Session management for query isolation
  - Transaction support for batch operations
  - Connection verification and health checks
  - Proper error handling and cleanup

- **Schema Initialization** ✅ - Full database schema with constraints and indexes:
  - Node constraints: unique chunk IDs, required chunking strategy (`/src/storage/schema.ts`)
  - Vector indexes: 4 indexes (one per strategy), 3072 dimensions, cosine similarity
  - Property indexes: speaker, party, debate, date, strategy, Hansard reference
  - Schema verification and status checking
  - Reset functionality for development

- **Chunk Storage Service** ✅ - Efficient chunk storage and retrieval:
  - Single chunk storage (`/src/storage/chunk-storage.ts`)
  - Batch storage with 100-chunk batches for performance
  - PRECEDES relationship creation to maintain debate flow
  - Storage statistics and analytics
  - Strategy-specific and full database deletion
  - Metadata completeness tracking

- **Vector Search Service** ✅ - Comparative similarity search:
  - Query embedding generation using OpenAI text-embedding-3-large (`/src/storage/vector-search.ts`)
  - Single strategy search with configurable result limit
  - Comparative search across all 4 strategies simultaneously
  - Speaker-specific chunk retrieval
  - Debate-specific chunk retrieval
  - Cross-strategy topic similarity detection
  - Search result ranking and scoring

- **Test Scripts** ✅ - Complete testing infrastructure:
  - Setup verification script (`/scripts/test-neo4j-setup.ts`)
  - Database population script with all 4 strategies (`/scripts/populate-neo4j.ts`)
  - Comparative vector search testing (`/scripts/test-vector-search.ts`)
  - Database reset utility (`/scripts/reset-neo4j.ts`)
  - Comprehensive documentation (`/docs/neo4j-setup-guide.md`)

### 4.2. Completed Tasks

#### 4.2.1. Record of Past Deadlines

#### 4.2.2. Record of Other Completed Tasks

- Created Docker Compose configuration for local Neo4j (optional, Aura recommended)
- Updated .env template with Neo4j connection variables
- Built Neo4j client with singleton pattern and connection pooling
- Implemented schema initialization with constraints and indexes
- Created 4 vector indexes (one per chunking strategy, 3072 dimensions each)
- Built chunk storage service with batch operations
- Implemented PRECEDES relationships to maintain debate flow
- Created vector search service with OpenAI embedding integration
- Built comparative search across all 4 strategies
- Added storage statistics and analytics
- Created test script for Neo4j setup verification
- Built population script to load all 4 chunking strategies
- Created vector search test script with divergence analysis
- Implemented database reset utility
- Added npm scripts: test:neo4j:setup, test:neo4j:populate, test:neo4j:search, test:neo4j:reset
- Wrote comprehensive Neo4j setup guide with troubleshooting
- Updated main README with Neo4j setup instructions
- Exported storage module with clean index file

---

## 5. Implementation Notes

### Vector Index Strategy

Each chunking strategy has its own vector index:
```
semantic_1024_vector_index  - Standard semantic, max 1024 tokens
semantic_256_vector_index   - Aggressive semantic, max 256 tokens
late_1024_vector_index      - Late chunking with context, max 1024 tokens
late_256_vector_index       - Late chunking with context, max 256 tokens
```

This allows comparative search without data duplication.

### Graph Schema

```cypher
(:Chunk {
  id, text, embedding[3072],
  chunkingStrategy, speaker, speakerParty, speakerRole,
  debate, date, hansardReference, contributionType,
  sequence, tokenCount, debateContext
})

(:Chunk)-[:PRECEDES {temporalDistance, sameSpeaker}]->(:Chunk)
```

### Performance Characteristics

- Batch size: 100 chunks per transaction (optimal for Neo4j)
- Vector dimensions: 3072 (OpenAI text-embedding-3-large)
- Similarity function: Cosine
- Connection pool: 50 max connections
- Query timeout: 60 seconds
- Transaction retry: 30 seconds

### Key Design Decisions

1. **Separate vector indexes per strategy**: Enables parallel comparative search
2. **PRECEDES relationships**: Maintains debate flow for context retrieval
3. **Batch storage**: Improves write performance by 10-20x vs single inserts
4. **Singleton client**: Prevents connection pool exhaustion
5. **Property indexes**: Fast metadata filtering (speaker, party, date)

---

## 6. User Action Required

To complete Neo4j setup, user must:

1. **Create Neo4j Aura instance**:
   - Go to [console.neo4j.io](https://console.neo4j.io)
   - Create free AuraDB instance
   - Save credentials (password shown once!)

2. **Update .env file**:
   ```
   NEO4J_URI=neo4j+s://xxxxx.databases.neo4j.io
   NEO4J_USER=neo4j
   NEO4J_PASSWORD=your_generated_password
   ```

3. **Run setup commands**:
   ```bash
   npm run test:neo4j:setup      # Verify and initialize
   npm run test:neo4j:populate   # Load all 4 strategies
   npm run test:neo4j:search     # Test comparative search
   ```

See [Neo4j Setup Guide](../neo4j-setup-guide.md) for detailed instructions.
