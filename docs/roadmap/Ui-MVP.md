# User Interface

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
- [ ] Initialize SvelteKit project structure
- [ ] Configure TypeScript for SvelteKit
- [ ] Create main query interface route (`src/routes/+page.svelte`)
- [ ] Build comparative results grid component (2×2 layout for 4 strategies)
- [ ] Design citation card component with Hansard reference formatting
- [ ] Implement query input with parliamentary context helpers
- [ ] Build strategy divergence highlighting (show where answers differ)
- [ ] Create chunk metadata display (speaker, party, date, Hansard ref)
- [ ] Add similarity score visualization
- [ ] Implement "why did this diverge?" explanation tooltips
- [ ] Design temporal context display (who spoke before/after)
- [ ] Build party balance indicator per strategy
- [ ] Create government/opposition ratio visualization

### 1.2. Blocked Tasks
- [ ] Wire up comparative search backend (blocked: needs RAG retrieval implementation)
- [ ] Display real chunk results (blocked: needs all 4 chunking strategies + Neo4j)
- [ ] Show cross-strategy analysis (blocked: needs evaluation metrics)

---

## 2. MVP Milestones
1. **SvelteKit Foundation** - Initialize project, configure TypeScript, set up routing
2. **Query Interface** - User input for parliamentary queries with context-aware suggestions
3. **Comparative Results Grid** - 2×2 display showing all 4 chunking strategies side-by-side
4. **Citation Cards** - Rich display of retrieved chunks with full parliamentary metadata and Hansard links
5. **Divergence Visualization** - Make technical chunking differences immediately obvious to non-technical users

---

## 3. Beyond MVP: Future Features
- Interactive chunk boundary visualization (show where text was split)
- Speaker profile cards with biographical data from Members API
- Debate thread navigation (follow conversation flow)
- Query history and comparison
- Export comparative results to PDF/markdown
- Embedding similarity heatmap between strategies
- "Adversarial query" suggestions that expose chunking weaknesses
- A/B testing interface for query refinement
- Annotation tools for documenting interesting divergences
- Bias detection dashboard (party representation, government/opposition balance)

---

## 4. Work Record
### 4.1. Completed Milestones

### 4.2. Completed Tasks
#### 4.2.1. Record of Past Deadlines

#### 4.2.2. Record of Other Completed Tasks
- Documented citation display format in `.claude/CLAUDE.md`
- Defined UI success criteria: ≥30% query divergence visible, non-technical comprehension
- Specified Hansard citation format: `[Speaker (Party)] - Debate • Date / HC Deb [ref] / Strategy (score)`
- Identified key UI principle: "Divergence is the feature" - show differences, not optimize them away
