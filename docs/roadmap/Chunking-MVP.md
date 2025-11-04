# Chunking Strategy

![Icon]()

> [!IMPORTANT]
> Work with user to define requirements

---

## 1. Tasks
> [!NOTE]
> This tasklist does not include upcoming [MVP Milestones](docs/dev/roadmap/Chunking-MVP.md#2-mvp-milestones)

### 1.1. Open Tasks
#### 1.1.1. Due Tasks

#### 1.1.2. Other Tasks
- [ ] Implement **Semantic 256** chunking pipeline (max 256 tokens, aggressive splitting)
- [ ] Implement **Late Chunking 1024** pipeline (embed full debate first, then chunk with 70/30 context blending)
- [ ] Implement **Late Chunking 256** pipeline (same late chunking, 256 token chunks)
- [ ] Build chunk storage layer for Neo4j vector index
- [ ] Create procedural marker handling strategy (keep vs. strip based on chunking variant)
- [ ] Build context blending algorithm for late chunking (0.7 * chunk + 0.3 * debate)

### 1.2. Blocked Tasks
- [ ] Neo4j vector index creation (blocked: needs Neo4j 5.11+ instance)
- [ ] Chunking quality evaluation (blocked: needs RAGAS framework setup)
- [ ] Cross-strategy comparison analysis (blocked: needs all 4 pipelines implemented)

---

## 2. MVP Milestones
1. **Semantic Chunking Foundation** ✅ (1024 variant complete) - Integrate LangChain SemanticChunker with OpenAI embeddings, implement both 1024 and 256 token variants
2. **Late Chunking Innovation** - Implement contextual embedding blending (70% chunk + 30% debate context) for both token sizes
3. **Parliamentary Boundary Handling** ✅ - Ensure speaker changes are preserved as sacred boundaries in standard semantic chunking
4. **Neo4j Vector Storage** - Store chunks with embeddings, metadata, and graph relationships (PRECEDES, RESPONDS_TO, MENTIONS_SAME_TOPIC)
5. **Chunk Quality Validation** - Verify chunk overlap, speaker diversity, and metadata integrity across all 4 strategies

---

## 3. Beyond MVP: Future Features
- Hybrid chunking strategies (e.g., semantic + fixed-size fallback)
- Dynamic chunk size based on debate complexity
- Cross-debate topic clustering (connect "NHS privatization" mentions across years)
- Temporal embedding drift analysis (how does "levelling up" cluster over time?)
- Party-specific chunking optimizations
- Procedural vs. substantive content separation
- Question-Answer pair chunking for PMQs
- Intervention threading (preserve back-and-forth exchanges)

---

## 4. Work Record
### 4.1. Completed Milestones
- **Text Processing Infrastructure** ✅ - Foundation ready for chunking pipelines:
  - HTML entity decoding and whitespace normalization (`/src/ingestion/transformers/text-cleaner.ts`)
  - Procedural marker extraction for `(Laughter)`, `[Interruption]` (`/src/ingestion/transformers/procedural-extractor.ts`)
  - Type inference for debates, contributions, speaker roles (`/src/ingestion/transformers/type-inferrer.ts`)
  - Full parser suite for parliamentary data structures

- **Semantic Chunking Foundation (1024 variant)** ✅ - First chunking pipeline operational:
  - Base chunking architecture with abstract `ChunkingPipeline` class (`/src/ingestion/chunkers/base-chunker.ts`)
  - `Chunk` interface with full parliamentary metadata (speaker, party, Hansard reference, embeddings)
  - `SemanticPipeline1024` implementation with tiktoken-based token counting (`/src/ingestion/chunkers/semantic-1024.ts`)
  - OpenAI text-embedding-3-large integration (3,072 dimensions)
  - Speaker boundary preservation (each chunk contains single speaker)
  - Token limit enforcement (validated max 1022/1024 tokens in testing)
  - Test script with comprehensive analytics (`scripts/test-semantic-chunking.ts`)

- **Parliamentary Boundary Handling** ✅ - Speaker boundaries preserved:
  - Each contribution processed separately to prevent cross-speaker chunks
  - Sequence linking maintains debate flow
  - Validation checks confirm single-speaker-per-chunk constraint

### 4.2. Completed Tasks
#### 4.2.1. Record of Past Deadlines

#### 4.2.2. Record of Other Completed Tasks
- Documented all 4 chunking strategies in `/docs/project-plan.md` and `.claude/CLAUDE.md`
- Defined Neo4j chunk schema with full parliamentary metadata
- Specified late chunking context blending formula (0.7/0.3 weight ratio)
- Identified speaker boundary preservation as critical constraint
- Created text cleaning utilities for HTML and whitespace
- Built procedural marker extractor for contextual signal handling
- Integrated tiktoken for accurate token counting
- Connected OpenAI `text-embedding-3-large` model (3,072 dimensions)
- Implemented **Semantic 1024** chunking pipeline (max 1024 tokens, preserves speaker boundaries)
- Added Hansard reference preservation in chunk metadata
- Built speaker boundary preservation logic for semantic chunking
- Improved speaker party data extraction and normalization
- Created comprehensive test suite with chunk analysis (size, speaker diversity, party distribution)
