# Technical Overview

This document provides a comprehensive technical overview of the Commons Traybake architecture, implementation details, and design patterns.

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Technology Stack](#technology-stack)
3. [Data Pipeline](#data-pipeline)
4. [Chunking Strategies](#chunking-strategies)
5. [Embedding System](#embedding-system)
6. [Data Models](#data-models)
7. [Testing Infrastructure](#testing-infrastructure)
8. [Future Components](#future-components)

---

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Parliament API                           │
│              (Hansard, Members, Bills, Votes)                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  Data Ingestion Layer                        │
│  ┌──────────────┬──────────────┬──────────────────────┐    │
│  │ API Clients  │   Parsers    │   Transformers       │    │
│  └──────────────┴──────────────┴──────────────────────┘    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Chunking Strategy Router                        │
└────┬────────────────┬────────────────┬────────────┬─────────┘
     │                │                │            │
     ▼                ▼                ▼            ▼
┌─────────┐    ┌─────────┐    ┌──────────┐  ┌──────────┐
│Semantic │    │Semantic │    │  Late    │  │  Late    │
│  1024   │    │   256   │    │Chunking  │  │Chunking  │
│         │    │         │    │  1024    │  │   256    │
└────┬────┘    └────┬────┘    └────┬─────┘  └────┬─────┘
     │              │              │             │
     ▼              ▼              ▼             ▼
┌─────────────────────────────────────────────────────────────┐
│              OpenAI Embeddings API                           │
│          (text-embedding-3-large, 3072 dims)                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│           Vector Storage (Future: Neo4j)                     │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐           │
│  │Store 1 │  │Store 2 │  │Store 3 │  │Store 4 │           │
│  └────────┘  └────────┘  └────────┘  └────────┘           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│           Retrieval Layer (Future)                           │
│              Comparative Query Router                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              User Interface (Future)                         │
│         SvelteKit Comparative Results Display                │
└─────────────────────────────────────────────────────────────┘
```

### Current Implementation Status

**Implemented (100%)**
- ✅ Data Ingestion Layer
- ✅ All Four Chunking Strategies
- ✅ Embedding Generation
- ✅ Validation Framework

**In Progress (0%)**
- 🚧 Vector Storage (Neo4j integration)
- 🚧 Retrieval Layer
- 🚧 User Interface

---

## Technology Stack

### Core Dependencies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 18+ | Runtime environment |
| **TypeScript** | 5.9+ | Type-safe development |
| **LangChain** | 1.0+ | RAG framework and chunking |
| **OpenAI SDK** | 4.77+ | Embedding generation |
| **Neo4j Driver** | 5.27+ | Graph database (future) |
| **Tiktoken** | 1.0+ | Token counting (GPT tokenizer) |

### LangChain Components Used

```typescript
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Document } from "@langchain/core/documents";
```

**Why LangChain?**
- Battle-tested text splitting with semantic awareness
- Native integration with OpenAI embeddings
- Document abstraction for metadata preservation
- Community-maintained, well-documented

### OpenAI Embeddings

**Model**: `text-embedding-3-large`

**Specifications**:
- Dimensions: 3,072
- Max input tokens: 8,191
- Cost: ~$0.13 per 1M tokens
- Latency: ~200-500ms per batch

**Why text-embedding-3-large?**
- Higher dimensional space captures nuance better than `small` variant
- Parliamentary language is complex—needs the resolution
- Semantic similarity scoring is more accurate
- Cost is negligible for our dataset size

**Alternative considered**: `text-embedding-ada-002` (older, worse at disambiguation)

---

## Data Pipeline

### Ingestion Architecture

```
src/ingestion/
├── clients/              # API communication layer
│   ├── base-client.ts    # Shared HTTP logic
│   ├── hansard-client.ts # Debate/contribution fetching
│   ├── commons-client.ts # Member information
│   └── bills-client.ts   # Legislation tracking
├── parsers/              # Data extraction
│   ├── debate-parser.ts          # Structure extraction
│   ├── contribution-parser.ts    # Speech parsing
│   ├── speaker-parser.ts         # Attribution logic
│   └── hansard-reference-parser.ts # Citation parsing
├── transformers/         # Data preparation
│   ├── text-cleaner.ts           # HTML/whitespace normalization
│   ├── procedural-extractor.ts   # "(Laughter)" markers
│   └── type-inferrer.ts          # Debate/contribution typing
└── chunkers/             # The core chunking strategies
    ├── base-chunker.ts           # Abstract pipeline
    ├── semantic-1024.ts          # Large semantic chunks
    ├── semantic-256.ts           # Small semantic chunks
    ├── late-chunking-1024.ts     # Large + context
    └── late-chunking-256.ts      # Small + context
```

### Data Flow

1. **Fetch**: Parliament API → Raw JSON/XML
2. **Parse**: Extract debates, contributions, speakers
3. **Transform**: Clean text, extract metadata
4. **Chunk**: Apply strategy-specific splitting
5. **Embed**: Generate OpenAI embeddings
6. **Validate**: Quality metrics and bias detection
7. **Store**: (Future) Persist to Neo4j vector index

---

## Chunking Strategies

### Base Chunking Pipeline

All strategies inherit from `ChunkingPipeline`:

```typescript
// src/ingestion/chunkers/base-chunker.ts
export abstract class ChunkingPipeline {
  abstract readonly strategyName: ChunkingStrategy;
  abstract readonly maxTokens: number;

  abstract chunk(debate: Debate): Promise<Chunk[]>;

  protected async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings = new OpenAIEmbeddings({
      modelName: "text-embedding-3-large",
      dimensions: 3072,
    });
    return await embeddings.embedDocuments(texts);
  }

  protected countTokens(text: string): number {
    const encoding = encoding_for_model("gpt-4");
    const tokens = encoding.encode(text);
    encoding.free();
    return tokens.length;
  }

  protected preserveSpeakerBoundaries(contributions: Contribution[]): Chunk[] {
    // Ensure no chunk spans multiple speakers
  }
}
```

### Strategy 1: Semantic 1024

**Implementation**: `src/ingestion/chunkers/semantic-1024.ts`

```typescript
class SemanticPipeline1024 extends ChunkingPipeline {
  readonly strategyName = "semantic_1024";
  readonly maxTokens = 1024;

  async chunk(debate: Debate): Promise<Chunk[]> {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: this.maxTokens,
      chunkOverlap: 50, // Token overlap between chunks
    });

    const chunks: Chunk[] = [];

    // Process each contribution separately (speaker boundary preservation)
    for (const contribution of debate.contributions) {
      const docs = await splitter.createDocuments(
        [contribution.text],
        [{ contributionId: contribution.id }]
      );

      for (const doc of docs) {
        chunks.push({
          id: this.generateChunkId(debate.id, chunks.length),
          text: doc.pageContent,
          embedding: [], // Generated later in batch
          tokens: this.countTokens(doc.pageContent),
          strategy: this.strategyName,
          speaker: contribution.speaker,
          debate: debate.metadata,
          hansardReference: contribution.hansardRef,
        });
      }
    }

    // Batch embed all chunks
    const embeddings = await this.generateEmbeddings(
      chunks.map(c => c.text)
    );
    chunks.forEach((chunk, i) => chunk.embedding = embeddings[i]);

    return chunks;
  }
}
```

**Characteristics**:
- Max 1,024 tokens per chunk
- 50-token overlap for context continuity
- Speaker boundaries never crossed
- Preserves full context around statements
- Fewer chunks = faster retrieval, more context

**Use case**: When context around each statement is critical

### Strategy 2: Semantic 256

**Implementation**: `src/ingestion/chunkers/semantic-256.ts`

**Key differences from 1024**:
```typescript
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 256,
  chunkOverlap: 20, // Smaller overlap for aggressive splitting
});
```

**Characteristics**:
- Max 256 tokens per chunk
- 20-token overlap
- Still respects speaker boundaries
- More granular retrieval (2-4x more chunks)
- Better for pinpoint matching, less context

**Use case**: When precise matching is more important than context

**Trade-off discovered**: Underrepresents minor parties by 55% (see validation findings)

### Strategy 3: Late Chunking 1024

**Implementation**: `src/ingestion/chunkers/late-chunking-1024.ts`

**The Innovation**: Contextual embedding blending

```typescript
class LateChunkingPipeline1024 extends ChunkingPipeline {
  readonly strategyName = "late_1024";
  readonly maxTokens = 1024;

  async chunk(debate: Debate): Promise<Chunk[]> {
    // Step 1: Embed the full debate (global context)
    const debateEmbedding = await this.generateEmbeddings([
      debate.fullText
    ]);

    // Step 2: Chunk normally (same as semantic strategy)
    const chunks = await this.semanticChunk(debate);

    // Step 3: Embed each chunk individually (local semantics)
    const chunkEmbeddings = await this.generateEmbeddings(
      chunks.map(c => c.text)
    );

    // Step 4: Blend embeddings (THE MAGIC)
    const blendedEmbeddings = chunkEmbeddings.map((chunkEmb, i) =>
      this.blendEmbeddings(
        chunkEmb,           // 70% weight
        debateEmbedding[0], // 30% weight
        0.7                 // Alpha parameter
      )
    );

    // Assign blended embeddings
    chunks.forEach((chunk, i) => {
      chunk.embedding = blendedEmbeddings[i];
      chunk.debateContextEmbedding = debateEmbedding[0]; // Store for analysis
    });

    return chunks;
  }

  private blendEmbeddings(
    chunk: number[],
    context: number[],
    alpha: number
  ): number[] {
    return chunk.map((val, i) =>
      alpha * val + (1 - alpha) * context[i]
    );
  }
}
```

**The Blending Formula**:
```
contextual_embedding[i] = 0.7 * chunk_embedding[i] + 0.3 * debate_embedding[i]
```

**Why this works**:
- "Glass" in a recycling debate gets 30% recycling-debate context
- "Glass" in a pub licensing debate gets 30% licensing-debate context
- Even with identical surrounding text, they cluster differently
- Preserves local semantics (70%) while adding global awareness (30%)

**Characteristics**:
- Same 1,024 token max as Semantic 1024
- Adds debate-level context to every chunk
- More expensive (2x embeddings per chunk)
- Better semantic disambiguation
- Captures cross-reference relationships

**Use case**: When topic context matters as much as local content

### Strategy 4: Late Chunking 256

**Implementation**: `src/ingestion/chunkers/late-chunking-256.ts`

**Combines**:
- Aggressive 256-token splitting
- Contextual embedding blending

**Characteristics**:
- Most granular retrieval
- Still context-aware despite small chunks
- 2-4x more chunks than late 1024
- Most expensive to generate (many small chunks × 2 embeddings each)

**Use case**: Fine-grained retrieval with global awareness

---

## Embedding System

### Batch Processing

To avoid rate limits and optimize latency:

```typescript
async generateEmbeddings(texts: string[]): Promise<number[][]> {
  const batchSize = 100; // OpenAI recommends ≤100 per request
  const batches = chunk(texts, batchSize);

  const results = await Promise.all(
    batches.map(async (batch) => {
      return await this.embeddings.embedDocuments(batch);
    })
  );

  return results.flat();
}
```

### Error Handling

```typescript
async generateEmbeddingsWithRetry(
  texts: string[],
  maxRetries: number = 3
): Promise<number[][]> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await this.generateEmbeddings(texts);
    } catch (error) {
      if (error.code === 'rate_limit_exceeded' && i < maxRetries - 1) {
        await this.exponentialBackoff(i);
        continue;
      }
      throw error;
    }
  }
}

private async exponentialBackoff(attempt: number): Promise<void> {
  const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s, ...
  await new Promise(resolve => setTimeout(resolve, delay));
}
```

### Token Counting

Using `tiktoken` for accurate GPT-4 token counting:

```typescript
import { encoding_for_model } from "tiktoken";

function countTokens(text: string): number {
  const encoding = encoding_for_model("gpt-4");
  const tokens = encoding.encode(text);
  const count = tokens.length;
  encoding.free(); // Important: free memory
  return count;
}
```

**Why tiktoken?**
- Accurate token counts matching OpenAI's tokenizer
- Prevents oversized chunks that would fail embedding
- Used by OpenAI internally
- Fast C++ implementation

---

## Data Models

### Core Types

```typescript
// src/types/index.ts

export interface Debate {
  id: string;
  title: string;
  date: Date;
  type: DebateType;
  parliamentarySession: string;
  fullText: string;
  contributions: Contribution[];
  hansardReference: HansardReference;
}

export interface Contribution {
  id: string;
  debateId: string;
  speaker: Speaker;
  text: string;
  type: ContributionType;
  proceduralContext: string;
  timestamp: Date;
  columnNumber: string;
  previousSpeakerId?: string;
  addressingId?: string;
}

export interface Speaker {
  name: string;
  constituency?: string;
  party: string;
  role: string; // "Minister", "Shadow Minister", "Backbencher"
}

export interface Chunk {
  id: string;
  text: string;
  embedding: number[]; // 3,072 dimensions
  tokens: number;
  strategy: ChunkingStrategy;

  // Parliamentary metadata
  speaker: Speaker;
  debate: DebateMetadata;
  hansardReference: HansardReference;
  contributionType: ContributionType;
  proceduralContext: string;

  // Late chunking specific
  debateContextEmbedding?: number[];
}

export type ChunkingStrategy =
  | "semantic_1024"
  | "semantic_256"
  | "late_1024"
  | "late_256";

export type DebateType =
  | "PMQs"
  | "General Debate"
  | "Committee"
  | "Written Questions";

export type ContributionType =
  | "speech"
  | "intervention"
  | "question"
  | "answer";
```

### Neo4j Schema (Future Implementation)

```cypher
// Node: Chunk
CREATE (c:Chunk {
  id: string,
  text: string,
  embedding: float[],
  strategy: string,
  tokens: integer,

  // Speaker metadata
  speakerName: string,
  speakerParty: string,
  speakerRole: string,
  speakerConstituency: string,

  // Debate metadata
  debateTitle: string,
  debateDate: date,
  debateType: string,
  hansardReference: string,
  columnNumber: string
})

// Relationships
CREATE (c1:Chunk)-[:PRECEDES {temporalDistance: integer}]->(c2:Chunk)
CREATE (c1:Chunk)-[:RESPONDS_TO {directResponse: boolean}]->(c2:Chunk)
CREATE (c1:Chunk)-[:MENTIONS_SAME_TOPIC {
  topicId: string,
  framingAlignment: float
}]->(c2:Chunk)

// Vector index for similarity search
CREATE VECTOR INDEX chunk_embeddings
FOR (c:Chunk) ON (c.embedding)
OPTIONS {
  indexConfig: {
    `vector.dimensions`: 3072,
    `vector.similarity_function`: 'cosine'
  }
}
```

---

## Testing Infrastructure

### Test Scripts

| Script | Purpose | Location |
|--------|---------|----------|
| `test-semantic-chunking.ts` | Single strategy test | `scripts/` |
| `test-semantic-comparison.ts` | Two-strategy comparison | `scripts/` |
| `test-late-chunking.ts` | Late chunking validation | `scripts/` |
| `test-chunk-validation.ts` | Comprehensive metrics | `scripts/` |
| `test-parliament-api.ts` | API integration test | `scripts/` |

### Validation Framework

**Implementation**: `src/ingestion/validation/chunk-quality-validator.ts`

```typescript
export class ChunkQualityValidator {
  validateStrategies(
    strategy1Chunks: Chunk[],
    strategy2Chunks: Chunk[]
  ): ValidationReport {
    return {
      chunkOverlap: this.calculateOverlap(strategy1Chunks, strategy2Chunks),
      speakerDiversity: this.analyzeSpeakerDiversity(strategy1Chunks, strategy2Chunks),
      temporalAccuracy: this.validateTemporal(strategy1Chunks),
      partyBalance: this.analyzePartyBalance(strategy1Chunks, strategy2Chunks),
      metadataIntegrity: this.validateMetadata(strategy1Chunks),
      overallDivergence: this.calculateDivergence(strategy1Chunks, strategy2Chunks),
    };
  }

  private calculateOverlap(chunks1: Chunk[], chunks2: Chunk[]): OverlapMetrics {
    const texts1 = new Set(chunks1.map(c => c.text));
    const texts2 = new Set(chunks2.map(c => c.text));

    const intersection = new Set([...texts1].filter(t => texts2.has(t)));
    const overlap = intersection.size / Math.min(texts1.size, texts2.size);

    return {
      identicalChunks: intersection.size,
      overlapPercentage: overlap,
      interpretation: overlap > 0.7 ? "High agreement" : "Significant divergence"
    };
  }

  private analyzeSpeakerDiversity(chunks1: Chunk[], chunks2: Chunk[]): SpeakerMetrics {
    const speakers1 = this.getSpeakerDistribution(chunks1);
    const speakers2 = this.getSpeakerDistribution(chunks2);

    return {
      uniqueSpeakers1: speakers1.size,
      uniqueSpeakers2: speakers2.size,
      dominantSpeakers: this.findDominantSpeakers(chunks1, chunks2),
      minorPartyRepresentation: this.calculateMinorPartyShare(chunks1, chunks2)
    };
  }

  private analyzePartyBalance(chunks1: Chunk[], chunks2: Chunk[]): PartyMetrics {
    const govChunks1 = chunks1.filter(c => this.isGovernment(c.speaker.party));
    const oppChunks1 = chunks1.filter(c => !this.isGovernment(c.speaker.party));

    return {
      governmentOppositionRatio: govChunks1.length / oppChunks1.length,
      systematicBias: this.detectSystematicBias(chunks1, chunks2),
      recommendation: this.generateBiasRecommendation(chunks1, chunks2)
    };
  }
}
```

### Key Metrics

**Chunk Overlap** (0-1)
- Jaccard similarity of chunk text sets
- High overlap (>0.7) = strategies agree
- Low overlap (<0.3) = significant divergence

**Speaker Diversity** (count + distribution)
- Unique speakers per strategy
- Gini coefficient for speaker concentration
- Minor party representation percentage

**Party Balance** (ratio)
- Government chunks / Opposition chunks
- Expected: ~1.0 (neutral)
- Actual findings: 256 strategies show 3:1 gov bias

**Temporal Accuracy** (0-1)
- Date/time metadata completeness
- Sequence ordering validation
- Should always be 1.0

**Metadata Integrity** (0-1)
- Required field completeness
- Hansard reference validation
- Speaker attribution accuracy

---

## Future Components

### Neo4j Vector Storage

**Status**: Not yet implemented

**Plan**:
```typescript
// src/storage/neo4j-store.ts
export class Neo4jVectorStore {
  async ingestChunks(chunks: Chunk[]): Promise<void> {
    const session = this.driver.session();

    for (const chunk of chunks) {
      await session.run(`
        CREATE (c:Chunk {
          id: $id,
          text: $text,
          embedding: $embedding,
          strategy: $strategy,
          speakerName: $speakerName,
          speakerParty: $speakerParty,
          debateTitle: $debateTitle,
          debateDate: $debateDate,
          hansardReference: $hansardReference
        })
      `, chunk);
    }

    await this.createRelationships(chunks);
    await session.close();
  }

  async vectorSearch(
    queryEmbedding: number[],
    strategy: ChunkingStrategy,
    k: number = 5
  ): Promise<Chunk[]> {
    const session = this.driver.session();

    const result = await session.run(`
      CALL db.index.vector.queryNodes(
        'chunk_embeddings',
        $k,
        $queryEmbedding
      ) YIELD node, score
      WHERE node.strategy = $strategy
      RETURN node, score
      ORDER BY score DESC
    `, { queryEmbedding, strategy, k });

    return result.records.map(r => this.nodeToChunk(r.get('node')));
  }
}
```

### Retrieval Layer

**Status**: Not yet implemented

**Plan**:
```typescript
// src/retrieval/comparative-search.ts
export class ComparativeRetrieval {
  async queryAllStrategies(
    query: string,
    k: number = 5
  ): Promise<StrategyResults[]> {
    const queryEmbedding = await this.embedQuery(query);

    const strategies: ChunkingStrategy[] = [
      "semantic_1024",
      "semantic_256",
      "late_1024",
      "late_256"
    ];

    // Query all four vector stores in parallel
    const results = await Promise.all(
      strategies.map(async (strategy) => {
        const chunks = await this.neo4jStore.vectorSearch(
          queryEmbedding,
          strategy,
          k
        );

        return {
          strategy,
          chunks,
          metadata: this.analyzeResults(chunks)
        };
      })
    );

    return results;
  }

  private analyzeResults(chunks: Chunk[]): ResultMetadata {
    return {
      averageTokens: mean(chunks.map(c => c.tokens)),
      speakerCount: uniqueCount(chunks.map(c => c.speaker.name)),
      partyBreakdown: groupBy(chunks, c => c.speaker.party),
      temporalSpread: this.calculateTemporalSpread(chunks)
    };
  }
}
```

### SvelteKit UI

**Status**: Not yet implemented

**Planned structure**:
```
src/
├── routes/
│   ├── +page.svelte              # Home/query interface
│   ├── +page.server.ts           # API endpoints
│   └── api/
│       └── query/
│           └── +server.ts        # Comparative search endpoint
└── lib/
    └── components/
        ├── QueryInput.svelte         # User query interface
        ├── ResultsGrid.svelte        # 2×2 strategy comparison
        ├── StrategyPanel.svelte      # Single strategy result
        ├── CitationCard.svelte       # Parliamentary citation display
        ├── DivergenceHighlighter.svelte # Visual diff tool
        └── MetricsDashboard.svelte   # Validation metrics
```

---

## Performance Considerations

### Embedding Generation

**Bottleneck**: OpenAI API calls

**Optimizations**:
- Batch requests (100 chunks per call)
- Parallel processing where possible
- Exponential backoff for rate limits
- Caching debate embeddings for late chunking

**Costs** (text-embedding-3-large):
- 10,000 chunks × 500 tokens avg = 5M tokens
- Cost: ~$0.65
- Time: ~5-10 minutes with batching

### Token Counting

**Performance**: ~1ms per document with tiktoken

**Memory**: Release encodings with `encoding.free()`

### Vector Search (Future)

**Neo4j HNSW Index**:
- Query latency: <100ms for top-k=5
- Scales to millions of chunks
- Cosine similarity

---

## Development Workflow

### Adding a New Chunking Strategy

1. Create new class extending `ChunkingPipeline`
2. Implement `chunk()` method
3. Register strategy in `src/ingestion/chunkers/index.ts`
4. Add test script in `scripts/test-new-strategy.ts`
5. Run validation suite
6. Update documentation

### Running Tests

```bash
# Individual strategy
npm run test:chunking

# Comparisons
npm run test:chunking:compare

# Full validation
npm run test:validation
```

### Debugging

Use LangSmith for tracing (optional):
```env
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=your_key
```

---

## Code Quality

### Type Safety

All code is TypeScript with strict mode:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

### Linting

ESLint configuration:
```bash
npm run lint
```

### Formatting

Prettier for consistent style:
```bash
npm run format
```

---

## Resources

- **[Architecture Decisions](Architecture-Decisions.md)** - ADR documentation
- **[Getting Started](../Getting-Started.md)** - Setup guide
- **[Parliament API Guide](../PARLIAMENT_API_GUIDE.md)** - API reference
- **[Project Plan](../project-plan.md)** - Original technical spec

---

**Last Updated**: 2024-11-07
**Status**: All chunking strategies implemented, retrieval layer pending
