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
- 🚧 **Chunking Strategy** - 2/5 milestones complete
- 🚧 **User Interface** - 0/5 milestones complete

---

## 3. Next Milestones
> [!NOTE]
> The 5 most significant or important tasks to tackle next.

1. **[Late Chunking Innovation](Chunking-MVP.md#2-mvp-milestones)** - Implement contextual embedding blending (70% chunk + 30% debate context) for both token sizes (1024 and 256)
2. **[Chunk Quality Validation](Chunking-MVP.md#2-mvp-milestones)** - Verify chunk overlap, speaker diversity, and metadata integrity across all 4 strategies
3. **[Neo4j Vector Storage](Chunking-MVP.md#2-mvp-milestones)** - Set up Neo4j 5.11+ instance and implement chunk storage with graph relationships (PRECEDES, RESPONDS_TO, MENTIONS_SAME_TOPIC)
4. **[SvelteKit Foundation](Ui-MVP.md#2-mvp-milestones)** - Initialize SvelteKit project structure with TypeScript configuration and basic routing
5. **[Query Interface](Ui-MVP.md#2-mvp-milestones)** - User input for parliamentary queries with context-aware suggestions

---

## 4. Recent Wins
> [!NOTE]
> 5 most recent achievements in this codebase

<!-- IMPORTANT: Do not increase this number beyond 5 -->

1. **Semantic Chunking Foundation (COMPLETE)** - Both 1024 and 256 token variants operational with tiktoken token counting, OpenAI text-embedding-3-large (3,072 dims), speaker boundary preservation, comparative testing suite ([Chunking-MVP.md](Chunking-MVP.md#41-completed-milestones))
2. **Parliament API MVP Complete** - All milestones achieved: client architecture, type system, data fetching, and testing documentation ([Gov-API-MVP.md](Gov-API-MVP.md#41-completed-milestones))
3. **Agents & Automation MVP Complete** - All milestones achieved: slash command infrastructure and documentation automation workflows ([Agents-MVP.md](Agents-MVP.md#41-completed-milestones))
4. **API Testing Infrastructure** - Bruno test collection, validation schemas, and integration testing with debate datasets ([Gov-API-MVP.md](Gov-API-MVP.md#42-completed-tasks))
5. **Text Processing Infrastructure** - HTML entity decoding, procedural marker extraction, and type inference ready for chunking pipelines ([Chunking-MVP.md](Chunking-MVP.md#41-completed-milestones))
