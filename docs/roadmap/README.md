# Project Status
> [!NOTE]
> Since commons-traybake is the aggregate of all submodules, this section summarises roadmaps for all submodules actively in development.

---

## 1. Submodule Roadmaps

### 1.1. Core Modules
- **[Agents & Knowledge Bases](Agents-MVP.md)** - Slash commands, documentation automation, roadmap workflows
- **[Parliament API](Gov-API-MVP.md)** - Hansard data ingestion, API clients, parliamentary data types
- **[Chunking Strategy](Chunking-MVP.md)** - Four RAG chunking pipelines (semantic and late chunking variants)
- **[Neo4j Vector Storage](Neo4j-MVP.md)** - Vector database with hybrid indexing, comparative search, graph relationships
- **[User Interface](Ui-MVP.md)** - SvelteKit frontend, comparative results visualization, citation display

---

## 2. Current State

### Completed Modules
- ✅ **Agents & Knowledge Bases** - All MVP milestones complete
- ✅ **Parliament API** - All MVP milestones complete
- ✅ **Chunking Strategy** - All MVP milestones complete (4 strategies operational with validation)
- ✅ **Neo4j Vector Storage** - All MVP milestones complete (hybrid indexing, comparative search)
- ✅ **User Interface** - All MVP milestones complete (SvelteKit with comparative visualization)

### In Progress
None - all MVP modules complete! 🎉

---

## 3. Next Milestones
> [!NOTE]
> MVP complete! Future enhancements to consider:

1. **Debate Thread Navigation** - Follow PRECEDES relationships to show conversation flow
2. **Speaker Profile Cards** - Integrate Members API for biographical data
3. **Interactive Chunk Boundaries** - Visualize where strategies split text differently
4. **Query History & Comparison** - Save and compare queries over time
5. **Bias Detection Dashboard** - Track party balance and government/opposition ratios across strategies

---

## 4. Recent Wins
> [!NOTE]
> 5 most recent achievements in this codebase

<!-- IMPORTANT: Do not increase this number beyond 5 -->

1. **User Interface (COMPLETE)** - Full SvelteKit frontend with comparative visualization: query interface with examples, 2×2 responsive grid, citation cards with party-colored badges and Hansard references, real-time divergence analysis (unique chunks, overlap %, pairwise comparison), /api/search endpoint integrated with Neo4j. Application running on localhost:5173 ([Ui-MVP.md](Ui-MVP.md#41-completed-milestones))
2. **Neo4j Vector Storage (COMPLETE)** - Full vector database implementation with hybrid indexing strategy (5 indexes: 4 strategy-specific + 1 unified), dual-label node system, object flattening layer, comparative search across all 4 strategies. Test queries show 8-25% overlap between strategies, proving chunking choices significantly impact retrieval ([Neo4j-MVP.md](Neo4j-MVP.md#41-completed-milestones))
3. **Chunk Quality Validation (COMPLETE)** - Comprehensive 6-metric validation system with automatic JSON/Markdown report generation. Discovered: 256-token strategies underrepresent minor parties by 55%, aggressive chunking shows 3x higher gov/opp ratio ([Chunking-MVP.md](Chunking-MVP.md#41-completed-milestones))
4. **Late Chunking Innovation (COMPLETE)** - Both 1024 and 256 token variants with 70/30 contextual embedding blending. Full debate context (30%) blended with local chunk semantics (70%), all 4 chunking strategies now operational ([Chunking-MVP.md](Chunking-MVP.md#41-completed-milestones))
5. **Semantic Chunking Foundation (COMPLETE)** - Both 1024 and 256 token variants operational with tiktoken token counting, OpenAI text-embedding-3-large (3,072 dims), speaker boundary preservation, comparative testing suite ([Chunking-MVP.md](Chunking-MVP.md#41-completed-milestones))
