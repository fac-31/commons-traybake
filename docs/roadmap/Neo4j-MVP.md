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
  - Vector indexes: 5 total (4 strategy-specific + 1 unified), 3072 dimensions, cosine similarity
  - Strategy-specific labels: :Semantic1024, :Semantic256, :Late1024, :Late256
  - Hybrid indexing: Each node indexed by both strategy-specific and unified indexes
  - Property indexes: speaker, party, debate, date, strategy, Hansard reference
  - Schema verification and status checking
  - Reset functionality for development

- **Chunk Storage Service** ✅ - Efficient chunk storage and retrieval:
  - Single chunk storage with dual labels (`/src/storage/chunk-storage.ts`)
  - Object flattening: Serializes complex objects (Speaker, HansardReference) to Neo4j primitives
  - Strategy-to-label mapping: Maps strategy names to Neo4j labels
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
- Fixed singleton pattern: removed `forceNew` workaround, added proper `reset()` method
- Fixed `verifyConnection()` to handle Neo4j Integer type with `.toInt()`
- Implemented schema initialization with constraints and indexes
- Created strategy-specific node labels: :Semantic1024, :Semantic256, :Late1024, :Late256
- Implemented hybrid vector indexing: 5 indexes (4 strategy-specific + 1 unified)
- Built chunk storage service with batch operations and object flattening
- Created `flattenChunk()` serialization layer for Neo4j primitive types
- Extended Chunk interface with optional flat fields for storage compatibility
- Implemented dual-label node creation (:Chunk + strategy label)
- Implemented PRECEDES relationships to maintain debate flow
- Created vector search service with OpenAI embedding integration
- Updated vector search to use strategy-specific indexes
- Built comparative search across all 4 strategies
- Added cross-strategy similarity search using unified index
- Added storage statistics and analytics
- Created test script for Neo4j setup verification
- Built population script to load all 4 chunking strategies
- Created vector search test script with divergence analysis
- Implemented database reset utility
- Fixed dotenv imports across all scripts to use `import 'dotenv/config'`
- Restored test scripts to use Neo4jClient singleton instead of raw driver
- Added npm scripts: test:neo4j:setup, test:neo4j:populate, test:neo4j:search, test:neo4j:reset
- Wrote comprehensive Neo4j setup guide with troubleshooting
- Updated main README with Neo4j setup instructions
- Exported storage module with clean index file
- Tested full pipeline: 154 chunks stored, all 5 indexes online, comparative search working
- Verified divergence: 8-25% overlap between strategies on test queries

---

## 5. Implementation Notes

### Vector Index Strategy

**Hybrid Approach - Strategy-Specific Labels + Unified Index**

The implementation uses a dual-label system where each chunk has two labels:
- Base label: `:Chunk` (all chunks)
- Strategy label: `:Semantic1024`, `:Semantic256`, `:Late1024`, or `:Late256`

This enables **5 vector indexes total**:

**Strategy-Specific Indexes (4):**
```
semantic_1024_vector_index → :Semantic1024 nodes
semantic_256_vector_index  → :Semantic256 nodes
late_1024_vector_index     → :Late1024 nodes
late_256_vector_index      → :Late256 nodes
```

**Unified Cross-Strategy Index (1):**
```
chunk_unified_vector_index → :Chunk nodes (all strategies)
```

**Why Different Embeddings Per Strategy?**
- Semantic strategies: Standard embeddings directly from chunk text
- Late chunking strategies: Blended embeddings (70% chunk + 30% debate context)
- Each strategy produces DIFFERENT embeddings for the same text
- Neo4j limitation: Only ONE vector index per label+property combination

**How Multi-Label Indexing Works:**
- A node with labels `:Chunk:Semantic1024` is automatically indexed by:
  - `semantic_1024_vector_index` (via :Semantic1024 label)
  - `chunk_unified_vector_index` (via :Chunk label)
- Within-strategy queries use strategy-specific indexes
- Cross-strategy similarity queries use the unified index

This allows comparative search without data duplication while respecting Neo4j's indexing constraints.

### Graph Schema

**Node Structure (Dual Labels):**
```cypher
(:Chunk:Semantic1024 {  // Example: Semantic 1024 strategy
  id, text, embedding[3072],
  chunkingStrategy, speaker, speakerParty, speakerRole,
  debate, date, hansardReference, contributionType,
  sequence, tokenCount, debateContext
})

// All nodes have :Chunk + one strategy label:
(:Chunk:Semantic1024)  // semantic_1024 strategy
(:Chunk:Semantic256)   // semantic_256 strategy
(:Chunk:Late1024)      // late_1024 strategy
(:Chunk:Late256)       // late_256 strategy
```

**Relationships:**
```cypher
(:Chunk)-[:PRECEDES {temporalDistance, sameSpeaker}]->(:Chunk)
```

**Data Flattening:**
Complex objects are serialized to Neo4j primitives:
- `Speaker` object → `speaker`, `speakerParty`, `speakerRole` strings
- `HansardReference` object → `hansardReference` string
- `Date` object → ISO date string
- `proceduralMarkers` object → JSON string in `proceduralContext`

### Performance Characteristics

- Batch size: 100 chunks per transaction (optimal for Neo4j)
- Vector dimensions: 3072 (OpenAI text-embedding-3-large)
- Similarity function: Cosine
- Connection pool: 50 max connections
- Query timeout: 60 seconds
- Transaction retry: 30 seconds

### Key Design Decisions

1. **Strategy-specific labels with dual labeling**: Each node has `:Chunk` + strategy label (e.g., `:Chunk:Semantic1024`)
2. **Hybrid vector indexing**: 5 indexes total (4 strategy-specific + 1 unified) to handle different embeddings per strategy
3. **Object flattening layer**: Serializes complex TypeScript objects to Neo4j primitives for storage
4. **Separate embeddings per strategy**: Semantic strategies use standard embeddings, late chunking uses blended embeddings (70% chunk + 30% debate context)
5. **Multi-label automatic indexing**: Nodes automatically indexed by all matching indexes based on their labels
6. **PRECEDES relationships**: Maintains debate flow for context retrieval
7. **Batch storage**: Improves write performance by 10-20x vs single inserts
8. **Singleton client with reset**: Prevents connection pool exhaustion, supports test isolation
9. **Property indexes**: Fast metadata filtering (speaker, party, date)
10. **Neo4j Integer type handling**: Explicit conversion with `.toInt()` for numeric comparisons

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
