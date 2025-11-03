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
- 🚧 **Chunking Strategy** - 0/5 milestones complete
- 🚧 **User Interface** - 0/5 milestones complete

---

## 3. Next Milestones
> [!NOTE]
> The 5 most significant or important tasks to tackle next.

1. **[Semantic Chunking Foundation](Chunking-MVP.md#2-mvp-milestones)** - Integrate LangChain SemanticChunker with OpenAI embeddings to implement both 1024 and 256 token chunking variants
2. **[Neo4j Vector Storage](Chunking-MVP.md#2-mvp-milestones)** - Set up Neo4j 5.11+ instance and implement chunk storage with graph relationships (PRECEDES, RESPONDS_TO, MENTIONS_SAME_TOPIC)
3. **[SvelteKit Foundation](Ui-MVP.md#2-mvp-milestones)** - Initialize SvelteKit project structure with TypeScript configuration and basic routing
4. **[Late Chunking Innovation](Chunking-MVP.md#2-mvp-milestones)** - Implement contextual embedding blending (70% chunk + 30% debate context) for both token sizes
5. **[Comparative Results Grid](Ui-MVP.md#2-mvp-milestones)** - Build 2×2 UI layout showing all 4 chunking strategies side-by-side with divergence visualization

---

## 4. Recent Wins
> [!NOTE]
> 5 most recent achievements in this codebase

<!-- IMPORTANT: Do not increase this number beyond 5 -->

1. **Parliament API MVP Complete** - All milestones achieved: client architecture, type system, data fetching, and testing documentation ([Gov-API-MVP.md](Gov-API-MVP.md#41-completed-milestones))
2. **Agents & Automation MVP Complete** - All milestones achieved: slash command infrastructure and documentation automation workflows ([Agents-MVP.md](Agents-MVP.md#41-completed-milestones))
3. **API Testing Infrastructure** - Bruno test collection, validation schemas, and integration testing with debate datasets ([Gov-API-MVP.md](Gov-API-MVP.md#42-completed-tasks))
4. **Text Processing Infrastructure** - HTML entity decoding, procedural marker extraction, and type inference ready for chunking pipelines ([Chunking-MVP.md](Chunking-MVP.md#41-completed-milestones))
5. **Parliament API Developer Guide** - Comprehensive documentation covering all endpoints, authentication, rate limiting, and best practices
