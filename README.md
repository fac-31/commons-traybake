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

---

## 4. Testimonials

<details>
  <summary>Anthropic</summary>
  <img src="./static/claude-worry.jpg" alt="Claude is worried about this project" />
</details>
