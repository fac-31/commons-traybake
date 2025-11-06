# Project Status
> [!NOTE]
> Since commons-traybake is the aggregate of all submodules, this section summarises roadmaps for all submodules actively in development.

---

## 1. Submodule Roadmaps

### 1.1. Core Modules
- **[Agents & Knowledge Bases](Agents-MVP.md)** - Slash commands, documentation automation, roadmap workflows
- **[Parliament API](Gov-API-MVP.md)** - Hansard data ingestion, API clients, parliamentary data types
- **[Chunking Strategy](Chunking-MVP.md)** - Four RAG chunking pipelines, Neo4j vector storage, semantic processing
- **[User Interface](Ui-MVP.md)** - SvelteKit frontend, comparative results visualization, citation display

---

## 2. Current State

### Completed Modules
- ✅ **Agents & Knowledge Bases** - All MVP milestones complete
- ✅ **Parliament API** - All MVP milestones complete

### In Progress
- 🚧 **Chunking Strategy** - 4/5 milestones complete
- 🚧 **User Interface** - 0/5 milestones complete

---

## 3. Next Milestones
> [!NOTE]
> The 5 most significant or important tasks to tackle next.

1. **[Neo4j Vector Storage](Chunking-MVP.md#2-mvp-milestones)** - Set up Neo4j 5.11+ instance and implement chunk storage with graph relationships (PRECEDES, RESPONDS_TO, MENTIONS_SAME_TOPIC)
2. **[SvelteKit Foundation](Ui-MVP.md#2-mvp-milestones)** - Initialize SvelteKit project structure with TypeScript configuration and basic routing
3. **[Query Interface](Ui-MVP.md#2-mvp-milestones)** - User input for parliamentary queries with context-aware suggestions
4. **[Comparative Results Grid](Ui-MVP.md#2-mvp-milestones)** - 2×2 display showing all 4 chunking strategies side-by-side
5. **[Retrieval Layer]** - Build comparative search that queries all 4 strategies and compares results

---

## 4. Recent Wins
> [!NOTE]
> 5 most recent achievements in this codebase

<!-- IMPORTANT: Do not increase this number beyond 5 -->

1. **Chunk Quality Validation (COMPLETE)** - Comprehensive 6-metric validation system with automatic JSON/Markdown report generation. Discovered: 256-token strategies underrepresent minor parties by 55%, aggressive chunking shows 3x higher gov/opp ratio ([Chunking-MVP.md](Chunking-MVP.md#41-completed-milestones))
2. **Late Chunking Innovation (COMPLETE)** - Both 1024 and 256 token variants with 70/30 contextual embedding blending. Full debate context (30%) blended with local chunk semantics (70%), all 4 chunking strategies now operational ([Chunking-MVP.md](Chunking-MVP.md#41-completed-milestones))
3. **Semantic Chunking Foundation (COMPLETE)** - Both 1024 and 256 token variants operational with tiktoken token counting, OpenAI text-embedding-3-large (3,072 dims), speaker boundary preservation, comparative testing suite ([Chunking-MVP.md](Chunking-MVP.md#41-completed-milestones))
4. **Parliament API MVP Complete** - All milestones achieved: client architecture, type system, data fetching, and testing documentation ([Gov-API-MVP.md](Gov-API-MVP.md#41-completed-milestones))
5. **Agents & Automation MVP Complete** - All milestones achieved: slash command infrastructure and documentation automation workflows ([Agents-MVP.md](Agents-MVP.md#41-completed-milestones))
