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

### In Progress
- 🚧 **User Interface** - 0/5 milestones complete (next up)

---

## 3. Next Milestones
> [!NOTE]
> The 5 most significant or important tasks to tackle next.

1. **[SvelteKit Foundation](Ui-MVP.md#2-mvp-milestones)** - Initialize SvelteKit project structure with TypeScript configuration and basic routing
2. **[Query Interface](Ui-MVP.md#2-mvp-milestones)** - User input for parliamentary queries with context-aware suggestions
3. **[Comparative Results Grid](Ui-MVP.md#2-mvp-milestones)** - 2×2 display showing all 4 chunking strategies side-by-side with divergence analysis
4. **[Citation Display](Ui-MVP.md#2-mvp-milestones)** - Rich citation cards with speaker, party, Hansard reference, strategy metadata
5. **[Divergence Visualization](Ui-MVP.md#2-mvp-milestones)** - Visual indicators showing overlap/uniqueness across strategies

---

## 4. Recent Wins
> [!NOTE]
> 5 most recent achievements in this codebase

<!-- IMPORTANT: Do not increase this number beyond 5 -->

1. **Neo4j Vector Storage (COMPLETE)** - Full vector database implementation with hybrid indexing strategy (5 indexes: 4 strategy-specific + 1 unified), dual-label node system, object flattening layer, comparative search across all 4 strategies. Test queries show 8-25% overlap between strategies, proving chunking choices significantly impact retrieval ([Neo4j-MVP.md](Neo4j-MVP.md#41-completed-milestones))
2. **Chunk Quality Validation (COMPLETE)** - Comprehensive 6-metric validation system with automatic JSON/Markdown report generation. Discovered: 256-token strategies underrepresent minor parties by 55%, aggressive chunking shows 3x higher gov/opp ratio ([Chunking-MVP.md](Chunking-MVP.md#41-completed-milestones))
3. **Late Chunking Innovation (COMPLETE)** - Both 1024 and 256 token variants with 70/30 contextual embedding blending. Full debate context (30%) blended with local chunk semantics (70%), all 4 chunking strategies now operational ([Chunking-MVP.md](Chunking-MVP.md#41-completed-milestones))
4. **Semantic Chunking Foundation (COMPLETE)** - Both 1024 and 256 token variants operational with tiktoken token counting, OpenAI text-embedding-3-large (3,072 dims), speaker boundary preservation, comparative testing suite ([Chunking-MVP.md](Chunking-MVP.md#41-completed-milestones))
5. **Parliament API MVP Complete** - All milestones achieved: client architecture, type system, data fetching, and testing documentation ([Gov-API-MVP.md](Gov-API-MVP.md#41-completed-milestones))
