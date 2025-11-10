# User Interface

![Icon]()

> [!IMPORTANT]
> User Interface MVP complete ✅

---

## 1. Tasks

### 1.1. Open Tasks
#### 1.1.1. Due Tasks

#### 1.1.2. Other Tasks
- [ ] Design temporal context display (who spoke before/after) - Future feature
- [ ] Build party balance indicator per strategy - Future feature
- [ ] Create government/opposition ratio visualization - Future feature
- [ ] Interactive chunk boundary visualization - Future feature
- [ ] Speaker profile cards with biographical data - Future feature
- [ ] Debate thread navigation via PRECEDES relationships - Future feature
- [ ] Query history and comparison - Future feature
- [ ] Export results to PDF/Markdown - Future feature

### 1.2. Blocked Tasks
None - all MVP milestones complete!

---

## 2. MVP Milestones

All MVP milestones complete! 🎉

1. **SvelteKit Foundation** ✅ - Initialized SvelteKit 2.48.4 with TypeScript, Vite build tooling, routing structure
2. **Query Interface** ✅ - Query input with 4 example queries, loading states, Enter-to-search
3. **Comparative Results Grid** ✅ - Responsive 2×2 grid showing all 4 strategies with strategy descriptions and result counts
4. **Citation Cards** ✅ - Rich cards with rank, similarity score, speaker (party-colored), chunk text, Hansard reference, metadata
5. **Divergence Visualization** ✅ - Real-time divergence analysis with overlap percentage, pairwise comparison, visual warnings

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

- **SvelteKit Foundation** ✅ - Complete project setup:
  - SvelteKit 2.48.4 + Svelte 5.43.4 installation
  - TypeScript configuration with strict mode
  - Vite 7.2.1 build configuration
  - Project structure: routes, components, lib
  - App layout with header and footer ([+layout.svelte](../../../src/routes/+layout.svelte))
  - Global CSS styling ([app.css](../../../src/app.css))

- **Query Interface** ✅ - Interactive search component:
  - QueryInput component with textarea ([QueryInput.svelte](../../../src/components/QueryInput.svelte))
  - 4 example queries as quick-start buttons
  - Enter-to-search keyboard shortcut
  - Loading and disabled states
  - Clean, accessible design

- **Comparative Results Grid** ✅ - 2×2 responsive layout:
  - ComparativeGrid component ([ComparativeGrid.svelte](../../../src/components/ComparativeGrid.svelte))
  - Displays all 4 strategies side-by-side
  - Strategy headers with descriptions
  - Result counts per strategy
  - Responsive design (collapses to 1 column on mobile)
  - Empty state handling

- **Citation Cards** ✅ - Rich parliamentary metadata display:
  - CitationCard component ([CitationCard.svelte](../../../src/components/CitationCard.svelte))
  - Rank and similarity score with visual progress bar
  - Speaker name, party (color-coded), and role
  - Chunk text with intelligent truncation
  - Debate title and formatted date
  - Hansard reference in monospace font
  - Strategy badge and token count
  - Hover effects and card elevation

- **Divergence Visualization** ✅ - Real-time comparative analysis:
  - Integrated into ComparativeGrid component
  - Divergence summary panel with statistics
  - Total unique chunks calculation
  - Overlap percentage (showing how much strategies agree)
  - Divergence rate (100% - overlap)
  - Pairwise strategy overlap analysis
  - Visual warning system (orange theme when divergence >25%)
  - Explanatory text for non-technical users
  - Complete divergence detection (all strategies retrieved different chunks)

### 4.2. Completed Tasks

#### 4.2.1. Record of Past Deadlines

#### 4.2.2. Record of Other Completed Tasks

**Planning & Design:**
- Documented citation display format in `.claude/CLAUDE.md`
- Defined UI success criteria: ≥30% query divergence visible, non-technical comprehension
- Specified Hansard citation format: `[Speaker (Party)] - Debate • Date / HC Deb [ref] / Strategy (score)`
- Identified key UI principle: "Divergence is the feature" - show differences, not optimize them away

**Implementation:**
- Installed SvelteKit and Svelte with Vite plugin
- Created svelte.config.js with adapter-auto and path aliases
- Created vite.config.ts with SvelteKit plugin
- Updated tsconfig.json for SvelteKit compatibility
- Created src/app.html root template
- Built responsive layout with header/footer
- Created TypeScript interfaces in src/lib/types.ts
- Implemented QueryInput with example queries
- Built CitationCard with party color coding
- Developed ComparativeGrid with divergence analysis
- Created main page with search state management
- Built backend API route: /api/search (POST)
- Integrated VectorSearch service from Neo4j storage
- Added npm scripts: dev, build, preview, check
- Tested development server (running on localhost:5173)
- Verified UI can display comparative results
- Confirmed divergence visualization works correctly

**UI Enhancements (2025-01-10):**
- ✅ Added cosine similarity tooltip on score bars explaining semantic distance
- ✅ Implemented configurable results limit (n parameter, default 3, max 20)
- ✅ Updated terminology: "Semantic" → "Early Chunking" throughout UI (internal code unchanged)
- ✅ Added visual frames around strategy columns in 2×2 grid for clarity
- ✅ Implemented collapsible strategy columns (all start collapsed for clean initial view)
- ✅ Added smooth slide animations for expand/collapse transitions
- ✅ Enhanced divergence explanation with mathematical breakdown (n, total, identical, unique chunks)
- ✅ Improved accessibility with keyboard navigation and aria-expanded attributes
- ✅ Added hover effects on strategy frames and clickable headers
- ✅ Updated TypeScript types: DivergenceAnalysis now includes totalResults and identicalChunks
