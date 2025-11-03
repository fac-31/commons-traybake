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

1. **Parliament API Client Complete** - Modular client architecture with Hansard, Commons Votes, and Bills API integration, featuring retry logic and rate limiting ([Gov-API-MVP.md](Gov-API-MVP.md#41-completed-milestones))
2. **Comprehensive Type System** - Full TypeScript interfaces for debates, contributions, speakers, Hansard references with enums for debate/contribution types ([Gov-API-MVP.md](Gov-API-MVP.md#41-completed-milestones))
3. **Slash Command Infrastructure** - All 13 custom commands configured including roadmap management, git workflows, project analysis, and task execution ([Agents-MVP.md](Agents-MVP.md#41-completed-milestones))
4. **Text Processing Infrastructure** - HTML entity decoding, procedural marker extraction, and type inference ready for chunking pipelines ([Chunking-MVP.md](Chunking-MVP.md#41-completed-milestones))
5. **API Testing Documentation** - 1000+ line comprehensive guide covering Bruno, HTTPie, validation schemas, and testing workflows ([Gov-API-MVP.md](Gov-API-MVP.md#41-completed-milestones))
