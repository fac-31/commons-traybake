# Neo4j Setup Guide for Commons Traybake

## Overview

This guide walks you through setting up Neo4j Aura (cloud) for the Commons Traybake vector database.

## Prerequisites

- OpenAI API key (already configured in `.env`)
- Neo4j Aura account (free tier available)

## Step 1: Create Neo4j Aura Instance

1. **Sign up for Neo4j Aura**
   - Go to [console.neo4j.io](https://console.neo4j.io)
   - Create a free account or sign in

2. **Create a new instance**
   - Click "New Instance" button
   - Select **AuraDB Free**
     - 200,000 nodes
     - 400,000 relationships
     - 2GB storage
     - Perfect for testing and development
   - Choose a region close to you (reduces latency)
   - Name: `commons-traybake` (or your preference)

3. **Save credentials**
   - **IMPORTANT**: You only see the password once!
   - Download the `.txt` file with credentials
   - Note down:
     - Connection URI (looks like: `neo4j+s://xxxxx.databases.neo4j.io`)
     - Username (usually `neo4j`)
     - Password (auto-generated)

4. **Wait for instance to start**
   - Takes 1-2 minutes
   - Status will change from "Creating" to "Running"

## Step 2: Update Environment Variables

Edit your `.env` file with the Aura credentials:

```bash
# Neo4j Configuration
NEO4J_URI=neo4j+s://xxxxx.databases.neo4j.io  # Replace with your URI
NEO4J_USER=neo4j                               # Usually 'neo4j'
NEO4J_PASSWORD=your_generated_password_here    # Replace with your password
```

**Note**: The URI for Aura uses `neo4j+s://` (secure connection), not `neo4j://` (local connection).

## Step 3: Verify Connection and Initialize Schema

Run the setup script to verify connection and create indexes:

```bash
npm run test:neo4j:setup
```

This will:
- ✅ Verify connection to Neo4j Aura
- ✅ Create node constraints for data integrity
- ✅ Create 4 vector indexes (one per chunking strategy)
- ✅ Create property indexes for metadata queries
- ✅ Display database info and index status

**Expected output:**
```
============================================================
Neo4j Setup and Verification
============================================================

Step 1: Verifying connection...
[Neo4j] Connected to neo4j+s://xxxxx.databases.neo4j.io
[Neo4j] Connection verified: true
✅ Connected to Neo4j successfully

Step 2: Initializing schema...
[Schema] Creating constraints...
[Schema] Constraints created
[Schema] Creating vector indexes...
[Schema] Created vector index: semantic_1024_vector_index
[Schema] Created vector index: semantic_256_vector_index
[Schema] Created vector index: late_1024_vector_index
[Schema] Created vector index: late_256_vector_index
[Schema] Vector indexes created
...
```

## Step 4: Populate with Test Data

Load all 4 chunking strategies into Neo4j:

```bash
npm run test:neo4j:populate
```

This will:
1. Fetch a test debate from Parliament API
2. Process through all 4 chunking pipelines:
   - Semantic 1024 (standard semantic, max 1024 tokens)
   - Semantic 256 (aggressive semantic, max 256 tokens)
   - Late 1024 (contextual blending, max 1024 tokens)
   - Late 256 (contextual blending, max 256 tokens)
3. Store chunks with embeddings in Neo4j
4. Create PRECEDES relationships to maintain debate flow
5. Display storage statistics

**Expected output:**
```
============================================================
Populating Neo4j with All Chunking Strategies
============================================================

Step 1: Fetching test debate from Parliament API...
✅ Fetched debate: "..."
   Contributions: 42

Step 2.1: Processing semantic_1024...
✅ Generated 38 chunks
   Avg tokens: 847

...

Storage Summary:
┌─────────────────────────┬────────┐
│ Total Chunks            │ 156    │
│ Total Relationships     │ 152    │
└─────────────────────────┴────────┘
```

## Step 5: Test Vector Search

Run comparative search across all strategies:

```bash
npm run test:neo4j:search
```

This demonstrates the core experiment: **how different chunking strategies retrieve different results for the same query**.

**Expected output:**
```
============================================================
Comparative Vector Search Test
============================================================

Query: "What is the government's position on NHS funding?"
============================================================

SEMANTIC 1024
------------------------------------------------------------
  Rank 1 | Score: 0.8732
  Speaker: Rishi Sunak (Conservative)
  Text: ...

SEMANTIC 256
------------------------------------------------------------
  Rank 1 | Score: 0.8654
  Speaker: Keir Starmer (Labour)
  Text: ...

LATE 1024
------------------------------------------------------------
  Rank 1 | Score: 0.8891
  Speaker: Rishi Sunak (Conservative)
  Text: ...

LATE 256
------------------------------------------------------------
  Rank 1 | Score: 0.8701
  Speaker: Wes Streeting (Labour)
  Text: ...

DIVERGENCE ANALYSIS
------------------------------------------------------------
Total unique chunks retrieved: 11
Overlap percentage: 8.3%
✨ High divergence! Different strategies retrieved different chunks.
```

## Maintenance Commands

### Reset database (delete all chunks)
```bash
npm run test:neo4j:reset
```

Use this when:
- You want to re-process with different data
- Testing schema changes
- Starting fresh

### Explore in Neo4j Browser

1. Open your Aura instance in browser (click "Open" in console)
2. Login with your credentials
3. Try these Cypher queries:

```cypher
// See all chunks (limit 25)
MATCH (c:Chunk) RETURN c LIMIT 25

// Count chunks by strategy
MATCH (c:Chunk)
RETURN c.chunkingStrategy as strategy, count(c) as count

// See debate flow (PRECEDES relationships)
MATCH (c1:Chunk)-[r:PRECEDES]->(c2:Chunk)
WHERE c1.chunkingStrategy = 'semantic_1024'
RETURN c1, r, c2
LIMIT 10

// Find chunks by speaker
MATCH (c:Chunk {speaker: 'Rishi Sunak'})
RETURN c
ORDER BY c.sequence

// Party distribution
MATCH (c:Chunk)
RETURN c.speakerParty as party, count(c) as chunks
ORDER BY chunks DESC
```

## Troubleshooting

### Connection Issues

**Error: Failed to connect to Neo4j**

Check:
1. Aura instance is "Running" (not stopped/paused)
2. `.env` has correct URI (must start with `neo4j+s://` for Aura)
3. Password is correct (if forgotten, reset in Aura console)
4. No firewall blocking connection

### Index Issues

**Error: Index already exists**

This is normal if you run setup multiple times. The script handles this gracefully.

**Indexes not ONLINE**

Wait a few minutes after creation. Large indexes can take time to build. Check status:

```bash
npm run test:neo4j:setup
```

Look for index state in output.

### Memory/Quota Issues

**Free tier limits:**
- 200k nodes
- 400k relationships
- 2GB storage

If you hit limits:
1. Run `npm run test:neo4j:reset` to clear data
2. Process smaller debates
3. Upgrade to paid tier (if needed for production)

## Architecture Notes

### Vector Indexes

Each chunking strategy has its own vector index:
- `semantic_1024_vector_index` - 3072 dimensions, cosine similarity
- `semantic_256_vector_index` - 3072 dimensions, cosine similarity
- `late_1024_vector_index` - 3072 dimensions, cosine similarity
- `late_256_vector_index` - 3072 dimensions, cosine similarity

This allows comparative search across strategies without data duplication.

### Graph Structure

```
(Chunk)-[:PRECEDES]->(Chunk)   // Maintains debate flow
(Chunk)-[:RESPONDS_TO]->(Chunk) // (Future) Tracks responses
(Chunk)-[:MENTIONS_SAME_TOPIC]->(Chunk) // (Future) Topic clustering
```

### Chunk Properties

All chunks store:
- `text` - The actual text content
- `embedding` - 3072-dimension vector
- `chunkingStrategy` - Which pipeline created it
- `speaker` - MP name
- `speakerParty` - Political party
- `speakerRole` - Role in debate
- `debate` - Debate title
- `date` - Debate date
- `hansardReference` - Citation reference
- `contributionType` - speech/intervention/question/answer
- `sequence` - Position in debate flow
- `tokenCount` - Chunk size in tokens
- `debateContext` - (Late chunking only) Full debate embedding

## Next Steps

Once Neo4j is populated:

1. **UI Development** - Build SvelteKit comparative interface
2. **RAG Pipeline** - Implement citation-aware generation
3. **Evaluation** - Run RAGAS metrics on retrieval quality
4. **More Data** - Ingest more debates for diversity
5. **Graph Relationships** - Implement RESPONDS_TO and MENTIONS_SAME_TOPIC

## Additional Resources

- [Neo4j Aura Documentation](https://neo4j.com/docs/aura/)
- [Neo4j Vector Search Guide](https://neo4j.com/docs/cypher-manual/current/indexes-for-vector-search/)
- [Cypher Query Language](https://neo4j.com/docs/cypher-manual/current/)
