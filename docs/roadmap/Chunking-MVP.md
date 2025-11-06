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

- [ ] Build chunk storage layer for Neo4j vector index
- [ ] Create procedural marker handling strategy (keep vs. strip based on chunking variant)

### 1.2. Blocked Tasks
- [ ] Neo4j vector index creation (blocked: needs Neo4j 5.11+ instance)
- [ ] Chunking quality evaluation with RAGAS (blocked: needs RAGAS framework setup)

---

## 2. MVP Milestones
1. **Semantic Chunking Foundation** ✅ - Integrate LangChain SemanticChunker with OpenAI embeddings, implement both 1024 and 256 token variants
2. **Late Chunking Innovation** ✅ - Implement contextual embedding blending (70% chunk + 30% debate context) for both token sizes
3. **Parliamentary Boundary Handling** ✅ - Ensure speaker changes are preserved as sacred boundaries in standard semantic chunking
4. **Neo4j Vector Storage** - Store chunks with embeddings, metadata, and graph relationships (PRECEDES, RESPONDS_TO, MENTIONS_SAME_TOPIC)
5. **Chunk Quality Validation** ✅ - Verify chunk overlap, speaker diversity, and metadata integrity across all 4 strategies

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

- **Semantic Chunking Foundation** ✅ - Both 1024 and 256 token variants operational:
  - Base chunking architecture with abstract `ChunkingPipeline` class (`/src/ingestion/chunkers/base-chunker.ts`)
  - `Chunk` interface with full parliamentary metadata (speaker, party, Hansard reference, embeddings)
  - `SemanticPipeline1024` implementation with tiktoken-based token counting (`/src/ingestion/chunkers/semantic-1024.ts`)
  - `SemanticPipeline256` implementation for aggressive splitting (`/src/ingestion/chunkers/semantic-256.ts`)
  - OpenAI text-embedding-3-large integration (3,072 dimensions)
  - Speaker boundary preservation (each chunk contains single speaker)
  - Token limit enforcement (validated max 1022/1024 and 256 tokens in testing)
  - Test script with comprehensive analytics (`scripts/test-semantic-chunking.ts`)
  - Comparative test script for side-by-side analysis (`scripts/test-semantic-comparison.ts`)

- **Parliamentary Boundary Handling** ✅ - Speaker boundaries preserved:
  - Each contribution processed separately to prevent cross-speaker chunks
  - Sequence linking maintains debate flow
  - Validation checks confirm single-speaker-per-chunk constraint

- **Late Chunking Innovation** ✅ - Both 1024 and 256 token variants with contextual blending:
  - `LateChunkingPipeline1024` implementation with debate-level context embedding (`/src/ingestion/chunkers/late-chunking-1024.ts`)
  - `LateChunkingPipeline256` implementation for aggressive splitting with context (`/src/ingestion/chunkers/late-chunking-256.ts`)
  - Full debate embedding generated first (captures global context)
  - Individual chunk embeddings generated second (captures local semantics)
  - 70/30 weighted blending algorithm (70% chunk + 30% debate context)
  - Debate context embedding stored separately for analysis
  - Test script validates contextual blending (`scripts/test-late-chunking.ts`)
  - All 4 chunking strategies now operational

- **Chunk Quality Validation** ✅ - Comprehensive validation framework operational:
  - `ChunkQualityValidator` with 6 key metrics (`/src/ingestion/validation/chunk-quality-validator.ts`)
  - Chunk overlap analysis (text overlap, identical chunks, word similarity)
  - Speaker diversity metrics (unique speakers, dominant speakers, cross-strategy favoritism)
  - Temporal accuracy validation (date consistency, sequence integrity)
  - Party balance analysis (gov/opp ratio, systematic bias detection)
  - Metadata integrity validation (field-level checks, completeness scoring)
  - Overall divergence calculation and recommendations
  - `ValidationReportExporter` for JSON and Markdown reports (`/src/ingestion/validation/report-exporter.ts`)
  - Comprehensive test script with auto-report generation (`scripts/test-chunk-validation.ts`)
  - Key finding: 256-token strategies underrepresent LD/DUP parties by 55%
  - Key finding: Aggressive chunking shows 3x higher gov/opp ratio

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
- Implemented **Semantic 256** chunking pipeline (max 256 tokens, aggressive splitting)
- Built comparative test script for 1024 vs 256 strategy analysis
- Created chunkers index for easier imports and pipeline management
- Implemented **Late Chunking 1024** pipeline with contextual embedding blending
- Implemented **Late Chunking 256** pipeline with aggressive splitting and context
- Built context blending algorithm (0.7 * chunk + 0.3 * debate)
- Added test script for late chunking validation
- Fixed LangChain dependency conflicts (upgraded to v1.0.0)
- Built comprehensive chunk quality validation framework
- Implemented 6-metric validation system (overlap, diversity, accuracy, balance, integrity, summary)
- Created automatic report generation (JSON + Markdown formats)
- Added systematic bias detection for party representation
- Validated all 4 strategies show 100% metadata completeness
- Discovered 256-token strategies underrepresent minor parties
- Documented key finding: aggressive chunking favors government voices (3x higher ratio)
