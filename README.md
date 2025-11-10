# Commons Traybake

> [!TIP]
> Come for information; stay for the searing social critique

---

## 1. What is This?

Exploring how ethics-neutral data processing decisions are not ethics-neutral by applying different document chunking strategies to data available through the [UK Parliament API](https://developer.parliament.uk/)

---

## 2. Project Docs

### 2.1. Project Overview

- **[What We're Building (Non-Technical)](docs/low-tech-project-description.md)** - Understanding the project without code: why chunking decisions matter, how they shape political discourse, and what makes this uncomfortable
- **[Technical Implementation Plan](docs/project-plan.md)** - Complete technical architecture: stack decisions, chunking strategies, Neo4j schema, RAG pipeline design, and phase-by-phase implementation guide

### 2.2. Implementation & Roadmap

- **[Roadmap Overview](docs/roadmap/README.md)** - Current status across all modules, next milestones, and recent wins
- **[Chunking Strategy Roadmap](docs/roadmap/Chunking-MVP.md)** - Progress on the four chunking pipelines (2/4 complete), MVP milestones, and future features
- **[Neo4j Vector Storage Roadmap](docs/roadmap/Neo4j-MVP.md)** - Vector database implementation (complete), hybrid indexing strategy, and storage architecture
- **[User Interface Roadmap](docs/roadmap/Ui-MVP.md)** - SvelteKit frontend plans, comparative visualization, and citation display
- **[Parliament API Roadmap](docs/roadmap/Gov-API-MVP.md)** - API client implementation (complete), data ingestion, and testing
- **[Agents & Automation Roadmap](docs/roadmap/Agents-MVP.md)** - Slash commands and documentation workflows (complete)

### 2.3. API & Testing

- **[Parliament API Developer Guide](docs/PARLIAMENT_API_GUIDE.md)** - Complete reference for all UK Parliament API endpoints: Hansard, Members, Votes, Committees, and Bills
- **[API Testing Guide](docs/api-testing-guide.md)** - Comprehensive testing workflows using Bruno and HTTPie, validation patterns, and integration strategies

---

## 3. Setup

### 3.1. Prerequisites
- Node.js 18+ 
- OpenAI API key (for text-embedding-3-large embeddings)
- Neo4j 5.11+ (for vector storage, required in later phases)

### 3.2. Installation

1. Clone the repository and install dependencies:
```bash
npm install
```

2. Copy the environment template and configure your API keys:
```bash
cp .env.example .env
```

3. Edit `.env` and add your OpenAI API key:
```
OPENAI_API_KEY=your_actual_openai_key_here
```

### 3.3. Running the Chunking Pipeline

Test a single semantic chunking strategy (1024 tokens):
```bash
npm run test:chunking
```

Compare both semantic strategies side-by-side (1024 vs 256 tokens):
```bash
npm run test:chunking:compare
```

This will show:
- Chunk count differences between strategies
- Token granularity analysis
- Processing time comparisons
- Speaker and party distribution
- Sample chunks from each strategy

### 3.4. Setting up Neo4j Vector Database

The Neo4j vector database stores chunks from all 4 chunking strategies using a hybrid indexing approach:
- **Dual-label system**: Each chunk has `:Chunk` + strategy label (`:Semantic1024`, `:Semantic256`, `:Late1024`, `:Late256`)
- **5 vector indexes**: 4 strategy-specific + 1 unified for cross-strategy similarity
- **Different embeddings per strategy**: Semantic uses standard embeddings, late chunking uses blended embeddings (70% chunk + 30% debate context)

**Step 1:** Set up Neo4j Aura instance (see [Neo4j Setup Guide](docs/neo4j-setup-guide.md))

**Step 2:** Verify connection and initialize schema (creates 5 vector indexes):
```bash
npm run test:neo4j:setup
```

**Step 3:** Populate with all 4 chunking strategies (~154 chunks from test data):
```bash
npm run test:neo4j:populate
```

**Step 4:** Test comparative vector search (queries all 4 strategies simultaneously):
```bash
npm run test:neo4j:search
```

This demonstrates the core experiment: how different chunking strategies retrieve different results for the same query. Test queries show 8-25% overlap between strategies, proving that chunking choices significantly impact retrieval.

### 3.5. Running the User Interface

The SvelteKit frontend provides an interactive comparative search interface:

**Start the development server:**
```bash
npm run dev
```

**Access the UI:** Open http://localhost:5173

**Features:**
- **Comparative search**: Query all 4 chunking strategies simultaneously
- **Configurable results**: Choose how many chunks (n) to retrieve per strategy (1-20)
- **Divergence analysis**: See mathematical breakdown of overlapping vs unique results
- **Collapsible strategy views**: Expand/collapse each strategy's results independently
- **Rich citations**: Party-colored speaker badges, Hansard references, similarity scores with tooltips
- **Visual frames**: Clear 2×2 grid showing "Early Chunking 1024/256" and "Late Chunking 1024/256"

**Example queries:**
- "What is the government's position on NHS funding?"
- "How did the opposition respond to the Prime Minister?"
- "What are the concerns about education policy?"

---

## 4. Testimonials

<details>
  <summary>Anthropic</summary>
  <img src="./static/claude-worry.jpg" alt="Claude is worried about this project" />
</details>
