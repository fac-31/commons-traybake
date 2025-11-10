# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an experimental RAG (Retrieval-Augmented Generation) system that demonstrates how information architecture encodes ideological choices. The project processes UK Parliamentary debates through four different chunking strategies to expose how technical decisions shape what information gets retrieved and presented.

**Key Insight**: This is NOT a helpful chatbot. It's a diagnostic tool that makes invisible information architecture choices visible by showing how the same query produces different answers depending on chunking strategy.

## Architecture

```
Parliament API → Data Ingestion → 4 Parallel Processing Pipelines → 4 Separate Vector Stores → Query Router → Comparative Results Interface
```

### Four Chunking Strategies

1. **Semantic 1024** (displayed as "Early Chunking 1024"): Standard semantic chunking, max 1024 tokens, preserves speaker boundaries
2. **Semantic 256** (displayed as "Early Chunking 256"): Aggressive semantic chunking, max 256 tokens, may split mid-speech
3. **Late Chunking 1024**: Embeds full debate first, then chunks, injects contextual embeddings (70% chunk + 30% debate context)
4. **Late Chunking 256**: Same late chunking approach with 256 token chunks

**Note on Terminology**: In the UI, "Semantic" strategies are labeled as "Early Chunking" to better convey that chunking happens before embedding. Internal code, types, and database labels retain "semantic" for consistency.

## Technology Stack

- **Frontend**: SvelteKit with TypeScript
- **Vector Database**: Neo4j with native vector index (5.11+)
- **Embeddings**: OpenAI `text-embedding-3-large` (3,072 dimensions)
- **Semantic Chunker**: LangChain's experimental SemanticChunker
- **Evaluation**: RAGAS framework for RAG assessment
- **Monitoring**: LangSmith for pipeline debugging

## Development Commands

*Note: Commands to be added as project develops*

### Setup
```bash
# Install dependencies
npm install

# Set up Neo4j
# Configure connection in .env

# Set up OpenAI API key
# Add to .env: OPENAI_API_KEY=your_key_here
```

### Data Pipeline
```bash
# Test chunking strategies locally
npm run test:chunking              # Test single strategy
npm run test:chunking:compare      # Compare semantic strategies

# Neo4j setup and population
npm run test:neo4j:setup          # Initialize schema and indexes
npm run test:neo4j:populate       # Load all 4 chunking strategies
npm run test:neo4j:search         # Test comparative vector search
npm run test:neo4j:reset          # Clear database for fresh start
```

### API Testing
```bash
# Run Bruno API tests
npm run api:test

# Validate dataset for chunking
npm run api:validate

# Analyze API responses
npm run api:analyze
```

### Development
```bash
# Run development server
npm run dev

# Run tests
npm run test

# Check types
npm run type-check
```

## Neo4j Schema

### Node: Chunk (Dual Label System)

**All chunks have TWO labels:**
- Base label: `:Chunk` (for unified cross-strategy queries)
- Strategy label: `:Semantic1024`, `:Semantic256`, `:Late1024`, or `:Late256`

**Example node creation:**
```cypher
CREATE (c:Chunk:Semantic1024 {
  id: string,
  text: string,
  embedding: float[3072],
  chunkingStrategy: "semantic_1024",

  // Parliamentary metadata (flattened)
  speaker: string,
  speakerParty: string,
  speakerRole: string,
  debate: string,
  date: date,
  hansardReference: string,
  contributionType: "speech" | "intervention" | "question" | "answer",
  proceduralContext: string,
  sequence: int,
  tokenCount: int,
  debateContext: float[] | null
})
```

**Vector Indexes (5 total):**
- 4 strategy-specific: `semantic_1024_vector_index`, `semantic_256_vector_index`, `late_1024_vector_index`, `late_256_vector_index`
- 1 unified: `chunk_unified_vector_index` (on `:Chunk` label)

**Why Different Embeddings?**
- Semantic strategies: Standard embeddings from text
- Late chunking strategies: Blended embeddings (70% chunk + 30% debate context)
- Neo4j constraint: ONE vector index per label+property
- Solution: Strategy-specific labels allow different embeddings on same property

**Multi-Label Indexing:**
A node with `:Chunk:Semantic1024` is automatically indexed by:
- `semantic_1024_vector_index` (via `:Semantic1024`)
- `chunk_unified_vector_index` (via `:Chunk`)

### Relationships
- `PRECEDES`: Preserves debate thread structure (implemented)
- `RESPONDS_TO`: Tracks who's addressing whom (future)
- `MENTIONS_SAME_TOPIC`: Connects chunks discussing same bill/policy (future)

### Data Flattening
Complex TypeScript objects are serialized to Neo4j primitives:
- `Speaker {name, party, role}` → `speaker`, `speakerParty`, `speakerRole` strings
- `HansardReference {reference, volume, url}` → `hansardReference` string
- `Date` object → ISO date string
- `proceduralMarkers` object → JSON string in `proceduralContext`

## Parliamentary Data Handling

### Speaker Boundaries
Speaker changes are sacred boundaries. Never chunk across speaker boundaries in standard semantic chunking.

### Hansard References
Preserve all Hansard references intact (e.g., "HC Deb 12 May 2023 vol 732 c45"). These are citation gold.

### Procedural Markers
Handle "(Laughter)", "[Interruption]" etc. contextually:
- Keep in context-aware pipelines (they're semantic signals)
- Optionally strip in some variants for cleaner embeddings

### Parliamentary Terminology
Terms like "right honourable friend", "glass ceiling", "levelling up" have context-dependent meanings based on speaker, party, and debate type.

## Citation Requirements

Every retrieved chunk must include:
- Speaker name, constituency, party, role
- Debate title, type, date, parliamentary session
- Hansard reference with column number
- Temporal context (who spoke before/after)
- Chunking strategy that retrieved it
- Similarity score

Display format:
```
[Speaker Name (Party)] - Debate Title • Date
"Quoted text..."
HC Deb [reference]
Retrieved from: [strategy] (score: 0.XX)
```

## Late Chunking Implementation

```typescript
// Blend chunk embedding with debate context
const contextualEmbedding = chunk.map((val, i) =>
  0.7 * val + 0.3 * debateEmbedding[i]
);
```

This makes "glass" in recycling debates cluster differently than "glass" in pub licensing debates, even with identical surrounding text.

## Evaluation Framework

### Metrics to Track
- **Chunk Overlap**: Percentage of chunks shared between strategies
- **Speaker Diversity**: Do different strategies favor different speakers?
- **Temporal Accuracy**: Are dates/context preserved correctly?
- **Semantic Similarity**: Are answers saying the same thing?
- **Party Balance**: Which party gets quoted more by each strategy?
- **Government/Opposition Ratio**: Systematic bias detection

### Test Queries
Design adversarial queries that expose chunking weaknesses:
- Context-dependent meaning ("What is the government's position on NHS privatization?")
- Cross-boundary synthesis ("How did the opposition respond to the PM's claims?")
- Ambiguous terminology ("What does 'levelling up' mean?")
- Numerical claims with different baselines
- Procedural vs substantive content

## Important Constraints

### What This Project IS
- A diagnostic instrument making invisible choices visible
- A demonstration that technical architecture encodes ideology
- An experiment surfacing how information systems shape discourse

### What This Project IS NOT
- A helpful chatbot for understanding parliament
- An attempt to build an "unbiased" system
- A production-ready tool for important decisions
- Optimized for "best" results

## API Testing Workflow

### Tools
- **Bruno**: Primary API testing tool (git-friendly, offline-first)
- **HTTPie**: Quick command-line requests
- **jq**: JSON parsing and analysis

### Parliament API Endpoints
```
Base URLs:
- https://hansard-api.parliament.uk/api/v1
- https://members-api.parliament.uk/api/v1
- https://bills-api.parliament.uk/api/v1

Key endpoints:
GET /debates
GET /debates/{id}
GET /debates/{id}/contributions
GET /search/debates?query={term}
```

### Data Quality Checks
Before processing, validate:
- Total words ≥ 50,000
- Unique speakers ≥ 10
- Missing data < 10% of contributions
- Party diversity present
- Hansard references intact

## Common Issues

### Parliament API
- XML responses everywhere
- Inconsistent speaker attribution in older debates
- Rate limiting (be polite, cache aggressively)
- Missing metadata on historical debates

### Chunking
- Semantic chunking may produce similar chunks across strategies (this is expected)
- Interesting divergences are rare but meaningful
- Late chunking weight blending (0.7/0.3) may need iteration

### Citations
- Speaker attribution can fail at chunk boundaries
- Procedural noise can muddy context
- Temporal ordering critical for debate flow

## Success Criteria

### MVP Success
- Query all four strategies simultaneously
- Results visibly differ on ≥30% of test queries
- Citations link correctly to Hansard
- UI makes divergence immediately obvious
- Non-technical users can understand the demonstration

### Meaningful Project
- Can make non-technical person care about chunking choices
- Have concrete examples of strategy X favoring perspective Y
- Documentation includes "failure cases" revealing system assumptions
- Learn something uncomfortable about how RAG systems encode political framing

## File Organization

```
/
├── src/
│   ├── lib/
│   │   ├── parliament/
│   │   │   └── api-client.ts          # Parliament API integration
│   │   ├── processing/
│   │   │   ├── pipelines/             # Four chunking strategies
│   │   │   └── parliamentary-text.ts  # Text preprocessing
│   │   ├── retrieval/
│   │   │   └── comparative-search.ts  # Multi-strategy query
│   │   └── generation/
│   │       └── rag-generator.ts       # Citation-aware generation
│   ├── routes/
│   │   └── +page.svelte              # Comparative UI
│   └── components/
│       ├── ResultsGrid.svelte
│       └── CitationCard.svelte
├── api-testing/
│   └── parliament/
│       ├── environments/
│       ├── collections/
│       └── scripts/
└── docs/                              # Project documentation
```

## Key Principles

1. **Don't optimize away messiness**: Contradictions and failures are findings, not bugs
2. **Speaker boundaries are sacred**: Never split across speakers in standard chunking
3. **Citations are forensic**: Every claim must trace to exact Hansard reference
4. **Divergence is the feature**: The product is the difference between answers
5. **Make choices visible**: Show how technical decisions encode political framing

## Parliamentary Context Awareness

Questions in Parliament mean different things based on context:
- "I thank my right honourable friend" = prepared statement
- "The honourable member is mistaken" = rebuttal incoming
- Minister vs backbencher saying same words = different implications
- Committee hearing vs Question Time = different discourse modes

Your chunking strategy determines which of these contextual signals survive.
