# Architecture Decision Records (ADR)

This document captures significant architectural decisions made during the development of Commons Traybake, following the ADR format: Context, Decision, Rationale, Consequences, and Alternatives Considered.

---

## Table of Contents

1. [ADR-001: Use Four Parallel Chunking Strategies](#adr-001-use-four-parallel-chunking-strategies)
2. [ADR-002: Choose OpenAI text-embedding-3-large](#adr-002-choose-openai-text-embedding-3-large)
3. [ADR-003: Select Neo4j as Vector Database](#adr-003-select-neo4j-as-vector-database)
4. [ADR-004: Preserve Speaker Boundaries in Semantic Chunking](#adr-004-preserve-speaker-boundaries-in-semantic-chunking)
5. [ADR-005: Implement Late Chunking with 70/30 Blending](#adr-005-implement-late-chunking-with-7030-blending)
6. [ADR-006: Use LangChain for Text Splitting](#adr-006-use-langchain-for-text-splitting)
7. [ADR-007: Build Validation Framework Before Retrieval](#adr-007-build-validation-framework-before-retrieval)
8. [ADR-008: Choose TypeScript Over Python](#adr-008-choose-typescript-over-python)
9. [ADR-009: Use Tiktoken for Token Counting](#adr-009-use-tiktoken-for-token-counting)
10. [ADR-010: Defer User Interface Until After Chunking Complete](#adr-010-defer-user-interface-until-after-chunking-complete)

---

## ADR-001: Use Four Parallel Chunking Strategies

**Date**: 2024-10-15
**Status**: Accepted
**Deciders**: Project team

### Context

The project aims to demonstrate that chunking decisions encode ideological choices. We need to decide how many strategies to implement and what dimensions of variation to explore.

### Decision

Implement exactly four chunking strategies:
1. Semantic 1024 (large, context-preserving)
2. Semantic 256 (small, precise)
3. Late Chunking 1024 (large + contextual awareness)
4. Late Chunking 256 (small + contextual awareness)

### Rationale

- **Two dimensions of variation**: chunk size (1024 vs 256) and context awareness (standard vs late chunking)
- **Manageable complexity**: Four is enough to demonstrate divergence without overwhelming users
- **Clear comparisons**: 2×2 grid makes visual comparison intuitive
- **Testable hypotheses**:
  - Does chunk size affect speaker diversity?
  - Does contextual awareness change retrieval patterns?
  - Do these effects compound or counteract?

### Consequences

**Positive**:
- Clear experimental design with controlled variables
- UI naturally fits 2×2 grid layout
- Validation metrics can compare across both dimensions
- Manageable compute cost (4 vector stores instead of 6+)

**Negative**:
- May miss other interesting chunking approaches (hierarchical, hybrid, etc.)
- Fixed chunk sizes don't adapt to content complexity
- More strategies would provide richer comparison data

**Neutral**:
- System architecture supports adding more strategies later

### Alternatives Considered

**Six strategies (add hierarchical + hybrid)**:
- Rejected: Too complex for MVP, harder to explain
- Could be added as stretch goal

**Two strategies (just 1024 vs 256)**:
- Rejected: Doesn't demonstrate enough variety
- Wouldn't show late chunking innovation

**Dynamic chunk sizing**:
- Rejected: Makes comparison harder (no controlled variable)
- Interesting for production, wrong for experimental design

---

## ADR-002: Choose OpenAI text-embedding-3-large

**Date**: 2024-10-15
**Status**: Accepted
**Deciders**: Project team

### Context

Need to select an embedding model for converting text chunks into vectors. Options include OpenAI's models, open-source alternatives (Sentence Transformers), and other commercial providers (Cohere, Voyage).

### Decision

Use OpenAI's `text-embedding-3-large` (3,072 dimensions) for all embeddings.

### Rationale

**Parliamentary language complexity**:
- Formal, ornate language with subtle meanings
- Context-dependent phrases ("right honourable friend")
- Requires high-dimensional space to capture nuance

**Model capabilities**:
- 3,072 dimensions provide better resolution than smaller models
- Strong performance on semantic similarity tasks
- Handles domain-specific language well

**Practical considerations**:
- Negligible cost (~$0.13 per 1M tokens)
- Fast inference (~200-500ms per batch)
- Well-documented, stable API
- Native LangChain integration

### Consequences

**Positive**:
- High-quality embeddings capture parliamentary nuance
- Cost is minimal for experimental project
- Good developer experience with OpenAI SDK

**Negative**:
- Dependency on external API (requires internet, API key)
- Vendor lock-in (would need re-embedding to switch)
- Not reproducible offline
- Costs scale with production use

**Neutral**:
- Could swap out for other models later (would need re-indexing)

### Alternatives Considered

**text-embedding-3-small (1,536 dims)**:
- Rejected: Less resolution for complex language
- Would miss subtle semantic differences

**text-embedding-ada-002 (1,536 dims)**:
- Rejected: Older generation, worse disambiguation
- Being phased out by OpenAI

**Sentence Transformers (all-MiniLM-L6-v2)**:
- Rejected: Too lightweight for parliamentary language
- Open-source benefit not worth quality loss

**Cohere embed-english-v3.0**:
- Considered: Excellent quality, similar pricing
- Rejected: Unnecessary vendor diversity for MVP
- Could explore for comparison in future

**Voyage AI**:
- Considered: Optimized for RAG
- Rejected: Premium pricing, marginal benefit

---

## ADR-003: Select Neo4j as Vector Database

**Date**: 2024-10-20
**Status**: Accepted
**Deciders**: Project team

### Context

Need a vector database to store embeddings and enable similarity search. Must support:
- 3,072-dimensional vectors
- Metadata filtering
- Multiple separate indexes (one per strategy)

Additionally, parliamentary data has rich relationship structure (who responds to whom, temporal ordering, topic connections) that could be valuable.

### Decision

Use Neo4j 5.11+ with native vector index support.

### Rationale

**Graph capabilities**:
- Neo4j is primarily a graph database—perfect for parliamentary relationships
- Can model PRECEDES, RESPONDS_TO, MENTIONS_SAME_TOPIC relationships
- Enables queries like "find contradictions from same MP across dates"

**Vector support**:
- Native vector index added in 5.11 (HNSW algorithm)
- Cosine similarity built-in
- Good performance (<100ms queries)

**Experimental value**:
- Graph structure might reveal interesting patterns
- Late chunking benefits from relationship context
- Can query: "chunks where speaker was challenged in next contribution"

**Unified storage**:
- One database for vectors + metadata + relationships
- No need to sync separate systems

### Consequences

**Positive**:
- Rich graph queries enable advanced analysis
- Single database simplifies architecture
- Graph visualization could enhance UI

**Negative**:
- Heavier than pure vector stores (Pinecone, Weaviate)
- Requires Neo4j installation and management
- Steeper learning curve (Cypher query language)
- May be overkill if graph features unused

**Neutral**:
- Not yet implemented (future work)
- Could swap for simpler vector store if graph features prove unnecessary

### Alternatives Considered

**Pinecone**:
- Pro: Specialized for vectors, very fast
- Con: No graph relationships, separate metadata store needed
- Con: Commercial only, ongoing costs

**Weaviate**:
- Pro: Open-source, good performance
- Con: No graph capabilities
- Con: Requires separate relationship management

**Chroma**:
- Pro: Simple, lightweight, good for prototyping
- Con: No graph features
- Con: Less mature than others

**Qdrant**:
- Pro: Fast, modern, good filters
- Con: No graph relationships
- Neutral: Could work, but no advantage over Weaviate

**Conclusion**: Neo4j's graph features justify the added complexity for this specific use case (parliamentary debates with rich relationships).

---

## ADR-004: Preserve Speaker Boundaries in Semantic Chunking

**Date**: 2024-10-18
**Status**: Accepted
**Deciders**: Project team

### Context

When chunking parliamentary debates, we must decide: should chunks be allowed to span multiple speakers, or should speaker changes always be chunk boundaries?

Example scenario:
```
[Speaker A]: "The NHS needs more funding because..."
[Speaker B]: "I disagree completely, the real issue is..."
```

Should this become:
- Option 1: Two chunks (boundary at speaker change)
- Option 2: One chunk if semantically related and under token limit

### Decision

**Speaker boundaries are sacred.** Never create chunks that span multiple speakers in semantic chunking strategies (1024 and 256).

Process each contribution separately, then chunk within that contribution.

### Rationale

**Attribution accuracy**:
- Parliamentary discourse is all about who said what
- Mixed-speaker chunks lose attribution clarity
- "The minister said X" must be unambiguous

**Context preservation**:
- A statement's meaning depends on who's speaking
- Minister vs backbencher saying same words = different implications
- Party affiliation matters for interpretation

**Citation requirements**:
- Must link chunks back to exact Hansard reference
- Multi-speaker chunks complicate citation
- Forensic attribution is a project goal

**Validation simplicity**:
- Easy to verify: count unique speakers per chunk (should always be 1)
- Helps detect chunking bugs

### Consequences

**Positive**:
- Crystal-clear attribution (one speaker per chunk always)
- Simpler citation display in UI
- Easier validation testing
- Respects parliamentary discourse structure

**Negative**:
- May create very small chunks for brief interventions
- Potentially loses semantic connections across speaker boundaries
- "(Laughter)" and procedural noise might get isolated

**Neutral**:
- Different from some RAG implementations that prioritize semantic flow over attribution

### Alternatives Considered

**Allow cross-speaker chunks**:
- Rejected: Sacrifices attribution accuracy
- Could muddy whose position is being represented
- Against project principle: "Citations are forensic"

**Hierarchical chunking with speaker as top level**:
- Interesting: Could have speaker-level and utterance-level chunks
- Rejected for MVP: Too complex
- Could be future strategy #5

**Dynamic boundary rules**:
- Example: Allow cross-speaker only for procedural noise
- Rejected: Inconsistent, hard to validate
- Better to handle procedural markers separately

---

## ADR-005: Implement Late Chunking with 70/30 Blending

**Date**: 2024-10-22
**Status**: Accepted
**Deciders**: Project team

### Context

Late chunking is a technique where you embed the full document first, then blend that contextual embedding with individual chunk embeddings. This makes chunks "aware" of their source document's global context.

Need to decide:
1. Should we implement late chunking?
2. If yes, what blending ratio to use?

### Decision

Implement late chunking for strategies 3 and 4 with **70% chunk embedding + 30% debate embedding**.

```
contextual_embedding[i] = 0.7 * chunk_embedding[i] + 0.3 * debate_embedding[i]
```

### Rationale

**Why late chunking?**:
- Demonstrates that embedding strategy matters as much as chunk size
- Shows how same text can have different semantic position based on context
- "Glass" in recycling debate vs pub licensing debate example

**Why 70/30 ratio?**:
- Preserves local semantics (70%) while adding global context (30%)
- 50/50 would dilute local meaning too much
- 90/10 wouldn't show enough contextual effect
- 70/30 is common in literature (Matryoshka embeddings research)

**Experimental value**:
- Creates measurable difference from standard chunking
- Validation can detect if late chunking changes retrieval patterns
- Makes visible how context-awareness affects results

### Consequences

**Positive**:
- Demonstrates innovative embedding technique
- Chunks become context-aware without changing text splitting
- Shows that embedding strategy is an architectural choice

**Negative**:
- Doubles embedding cost (full debate + each chunk)
- More complex to implement
- Harder to explain to non-technical users
- May not show dramatic differences in practice

**Neutral**:
- Blending ratio could be tuned based on evaluation results
- Stores debate embedding separately for analysis

### Alternatives Considered

**50/50 blending**:
- Rejected: Too diluted, loses local semantics
- Chunk might not even match its own content well

**90/10 blending**:
- Considered: More conservative
- Rejected: Might not show measurable difference from standard chunking

**No late chunking (only 2 strategies)**:
- Rejected: Misses opportunity to demonstrate embedding strategy importance
- Would only show chunk size effects, not context effects

**Hierarchical embeddings**:
- Example: Debate → Section → Chunk hierarchy
- Rejected for MVP: Too complex
- Interesting for future work

**Learned blending weights**:
- Example: Train model to predict optimal alpha per chunk type
- Rejected: Overengineering for experimental project
- Would obscure what the system is doing

---

## ADR-006: Use LangChain for Text Splitting

**Date**: 2024-10-16
**Status**: Accepted
**Deciders**: Project team

### Context

Need a library for intelligent text splitting that respects:
- Token limits (1024 or 256)
- Natural break points (sentences, paragraphs)
- Overlap between chunks

Options: build custom splitter, use LangChain, use LlamaIndex, or simple character splitting.

### Decision

Use LangChain's `RecursiveCharacterTextSplitter` for semantic chunking.

### Rationale

**Battle-tested**:
- Used in production by many RAG systems
- Well-documented, actively maintained
- Handles edge cases (very long sentences, etc.)

**Semantic awareness**:
- Tries to break at natural boundaries (paragraphs, sentences)
- Recursive strategy: tries paragraph first, then sentence, then word
- Better than naive character splitting

**Integration**:
- Works seamlessly with LangChain Document abstraction
- Built-in support for metadata preservation
- Compatible with OpenAI embeddings integration

**Token counting**:
- Can use tiktoken for accurate GPT token counting
- Respects max token limits precisely

### Consequences

**Positive**:
- Reliable, proven splitting logic
- Good developer experience
- Saves implementation time
- Community support available

**Negative**:
- Dependency on LangChain (large library)
- Some "magic" behavior in recursive splitting
- Might make different choices than we would custom-building

**Neutral**:
- Could implement custom splitter later if needed
- LangChain architecture allows swapping splitters

### Alternatives Considered

**Custom splitter**:
- Pro: Full control over logic
- Con: Reinventing wheel, likely to have bugs
- Con: Would take significant development time

**LlamaIndex splitters**:
- Pro: Similar capabilities to LangChain
- Con: Less familiar to team
- Con: Smaller community

**Simple character/token splitting**:
- Pro: Simple, predictable
- Con: Breaks at arbitrary points, loses semantic coherence
- Con: Poor user experience with mid-sentence cuts

**spaCy sentence splitter**:
- Pro: Linguistic sophistication
- Con: Overkill for this use case
- Con: Adds heavy dependency

---

## ADR-007: Build Validation Framework Before Retrieval

**Date**: 2024-10-28
**Status**: Accepted
**Deciders**: Project team

### Context

With four chunking strategies implemented, we could proceed immediately to building the retrieval layer and UI. However, we don't yet have systematic evidence that the strategies produce meaningfully different results.

Should we build validation first, or proceed to retrieval/UI?

### Decision

Build comprehensive validation framework before implementing retrieval layer.

Validation includes:
- Chunk overlap analysis
- Speaker diversity metrics
- Party balance detection
- Temporal accuracy checks
- Metadata integrity validation

### Rationale

**Validate the hypothesis**:
- Project claim: "Chunking decisions encode ideological choices"
- Need evidence before building UI around this claim
- What if strategies don't actually differ much?

**Inform UI design**:
- Validation reveals what differences to highlight in UI
- Finding (256 strategies underrepresent minor parties) suggests UI should show party distribution
- Can design UI around actual divergences, not hypothetical ones

**Course correction opportunity**:
- If strategies are too similar, could adjust parameters before implementing retrieval
- If validation shows no interesting differences, might need new strategies

**Documentation value**:
- Validation reports serve as project documentation
- Can include findings in papers, presentations, demos
- Makes the project's claims concrete and testable

### Consequences

**Positive**:
- Validated that strategies DO differ significantly
- Discovered concrete findings:
  - 256 strategies underrepresent minor parties 55%
  - Aggressive chunking shows 3x gov/opp ratio
- UI can be designed around actual differences
- Strong evidence for project's core claim

**Negative**:
- Delayed retrieval/UI implementation
- Validation framework took additional development time
- Risk that validation could have shown no differences (would require strategy redesign)

**Neutral**:
- Validation framework will be useful for evaluating future strategies
- Can monitor production system with same metrics

### Alternatives Considered

**Skip validation, build UI directly**:
- Rejected: Would be building on unvalidated assumptions
- Risk of discovering strategies are too similar after UI is built

**Manual validation only**:
- Example: Eyeball a few queries, note differences
- Rejected: Not systematic, hard to quantify
- Wouldn't discover subtle biases (party representation)

**Validation after UI complete**:
- Rejected: Wrong order, validation should inform UI design
- Harder to adjust if validation reveals issues

---

## ADR-008: Choose TypeScript Over Python

**Date**: 2024-10-15
**Status**: Accepted
**Deciders**: Project team

### Context

RAG systems are typically built in Python (LangChain's primary language). However, the planned UI is SvelteKit (JavaScript/TypeScript). Need to choose primary language for the project.

### Decision

Build entire project in TypeScript (Node.js backend, SvelteKit frontend).

### Rationale

**Full-stack consistency**:
- Same language for backend and frontend
- Type system shared across entire codebase
- Single package manager (npm)

**Developer experience**:
- Team more comfortable with TypeScript
- Better IDE support for full-stack TypeScript
- Easier to share types between layers

**Deployment simplicity**:
- Single runtime (Node.js)
- No polyglot deployment complexity
- Can use serverless easily (Vercel, Netlify)

**LangChain support**:
- LangChain.js is mature and feature-complete
- All needed functionality available (text splitting, embeddings, documents)
- Good documentation and community

### Consequences

**Positive**:
- Unified codebase with shared types
- Smooth developer experience
- Simpler deployment pipeline
- Easier for web developers to contribute

**Negative**:
- Python ecosystem is larger for ML/AI tooling
- Some LangChain features Python-first
- Type annotations less ergonomic than Python for data processing
- Smaller community for RAG in TypeScript

**Neutral**:
- Could have hybrid approach (Python backend, TS frontend)
- Most core libraries (OpenAI, Neo4j) have good TS support

### Alternatives Considered

**Python backend + TypeScript frontend**:
- Pro: Python is natural choice for ML/RAG
- Con: Polyglot complexity
- Con: Need API layer between languages
- Con: Deploy and manage two runtimes

**Full Python (including UI)**:
- Example: Streamlit or FastAPI + React
- Con: Team less familiar with Python web frameworks
- Con: Harder to build sophisticated UI

**Full JavaScript (no TypeScript)**:
- Con: Lose type safety
- Con: Harder to maintain as project grows

---

## ADR-009: Use Tiktoken for Token Counting

**Date**: 2024-10-17
**Status**: Accepted
**Deciders**: Project team

### Context

Need accurate token counting to:
- Respect chunk size limits (1024 or 256 tokens)
- Avoid oversized chunks that fail embedding
- Validate chunk sizes in testing

Options: character count approximation, word count approximation, or accurate tokenizer.

### Decision

Use `tiktoken` library with GPT-4 tokenizer for all token counting.

### Rationale

**Accuracy**:
- Tiktoken is OpenAI's official tokenizer (C++ implementation)
- Exact same tokenization as used by embedding model
- Prevents mismatches between counted tokens and actual tokens

**Prevention of errors**:
- Approximations (chars/4 or word count * 1.3) can be off by 20-30%
- Oversized chunks would fail at embedding time
- Better to measure correctly upfront

**Validation**:
- Can assert: all chunks ≤ max tokens
- Validation caught bug where chunks were 1022/1024 (within limit)

**Performance**:
- C++ implementation is fast (~1ms per document)
- Negligible overhead for chunking pipeline

### Consequences

**Positive**:
- 100% accurate token counts
- No runtime surprises from oversized chunks
- Clean validation (max tokens exactly enforced)
- Discovered chunks stay within 1022/1024 limit reliably

**Negative**:
- Additional dependency (tiktoken)
- Need to remember to call `encoding.free()` (memory management)
- Slightly more complex than approximation

**Neutral**:
- Could use different tokenizer for different embedding models

### Alternatives Considered

**Character count approximation (chars / 4)**:
- Rejected: 20-30% error rate
- Would cause runtime failures on large chunks

**Word count approximation (words * 1.3)**:
- Rejected: Still inaccurate
- Varies by language complexity

**LangChain's token counter**:
- Actually uses tiktoken internally
- Accepted: That's what we're using (via LangChain)

**No token counting (just character limit)**:
- Rejected: Embedding API works in tokens, not characters
- Would cause mysterious failures

---

## ADR-010: Defer User Interface Until After Chunking Complete

**Date**: 2024-10-25
**Status**: Accepted
**Deciders**: Project team

### Context

Need to sequence development: should we build UI alongside chunking pipelines, or finish chunking first?

Trade-off between:
- Parallel development (UI + chunking at same time)
- Sequential development (chunking → validation → retrieval → UI)

### Decision

Complete chunking and validation before starting UI development.

Sequence:
1. ✅ All four chunking strategies
2. ✅ Validation framework
3. 🚧 Neo4j vector storage + retrieval
4. 🚧 SvelteKit UI

### Rationale

**Requirements clarity**:
- Don't know what UI should show until we know what differences exist
- Validation findings (party bias, speaker diversity) inform UI design
- Can't design comparative view without understanding what to compare

**Avoid rework**:
- If UI built first, validation findings might require redesign
- Better to have stable data layer before UI

**Testing without UI**:
- Can test chunking thoroughly via CLI scripts
- Validation reports provide concrete evidence
- Don't need UI to validate core hypothesis

**Clean separation**:
- Chunking is complex enough to warrant full focus
- UI is complex enough to warrant full focus
- Mixing them would slow both down

### Consequences

**Positive**:
- Chunking is solid, well-tested, complete
- Validation findings inform UI design decisions
- Can demo chunking differences via CLI while UI in progress
- Clear milestones and progress tracking

**Negative**:
- Can't show interactive demo until later
- Harder to communicate project visually (no screenshots yet)
- Stakeholders might not understand without UI

**Neutral**:
- Common pattern in data-intensive projects
- Could have done parallel dev with larger team

### Alternatives Considered

**UI first (mock data)**:
- Pro: Visual progress, easier to demo
- Con: Would need to rebuild when real data available
- Con: Might design UI around wrong assumptions

**Parallel development**:
- Pro: Faster to complete MVP
- Con: Requires tight coordination
- Con: Risk of mismatches requiring rework
- Note: Would work with larger team

**Minimal UI earlier**:
- Example: Simple query interface showing JSON results
- Considered: Could be helpful for testing
- Rejected: Test scripts serve same purpose

---

## Future ADRs

As the project continues, we expect to document:

- **ADR-011**: Neo4j vector index configuration decisions
- **ADR-012**: SvelteKit routing and state management approach
- **ADR-013**: Comparative results visualization design
- **ADR-014**: Citation display and Hansard linking strategy
- **ADR-015**: Query suggestion and autocomplete implementation

---

## ADR Template

For future decisions, use this format:

```markdown
## ADR-XXX: [Decision Title]

**Date**: YYYY-MM-DD
**Status**: [Proposed | Accepted | Deprecated | Superseded]
**Deciders**: [Names/roles]

### Context
What is the issue that we're seeing that is motivating this decision?

### Decision
What is the change that we're proposing/doing?

### Rationale
Why are we making this decision? What factors led to this choice?

### Consequences
What becomes easier or harder as a result of this decision?

**Positive**:
- Benefits

**Negative**:
- Drawbacks

**Neutral**:
- Other impacts

### Alternatives Considered
What other options did we consider? Why did we reject them?
```

---

**Last Updated**: 2024-11-07
**Document Status**: Active (10 ADRs documented)
