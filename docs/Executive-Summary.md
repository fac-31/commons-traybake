# Executive Summary

## Project Overview

**Commons Traybake** is an experimental RAG (Retrieval-Augmented Generation) system that demonstrates how information architecture encodes ideological choices. By processing UK Parliamentary debates through four different chunking strategies, the project exposes how technical decisions fundamentally shape what information gets retrieved and presented to users.

This is not a helpful chatbot—it's a diagnostic tool that makes invisible infrastructure choices visible.

---

## The Core Question

**When you ask an AI system to answer questions from documents, whose voice gets amplified?**

Most AI systems that search through documents make critical processing decisions invisibly. They break documents into smaller pieces ("chunks"), search through those pieces, and present answers based on what they find. These chunking decisions are typically hidden from users and treated as neutral technical choices.

**They're not neutral.**

Commons Traybake makes these choices explicit by implementing four different chunking strategies and showing users how the same question produces different answers depending on which strategy is used.

---

## Current Status

### Completed Components

**Data Processing (100%)**
- Parliament API client operational
- Four chunking strategies fully implemented:
  1. Semantic 1024 (large context-preserving chunks)
  2. Semantic 256 (fine-grained focused chunks)
  3. Late Chunking 1024 (contextually-aware large chunks)
  4. Late Chunking 256 (contextually-aware small chunks)
- Comprehensive validation framework with bias detection
- Test suite with real parliamentary debate data

**Key Findings from Validation**
- 256-token strategies underrepresent minor parties by 55%
- Aggressive chunking shows 3x higher government/opposition ratio
- All strategies maintain 100% metadata completeness
- Different chunking approaches systematically favor different speakers

### In Development

**Retrieval Layer (0%)**
- Comparative search across all four strategies
- Neo4j vector database integration
- Query routing and similarity scoring

**User Interface (0%)**
- SvelteKit web application
- Comparative results visualization (2×2 grid showing all four strategies)
- Citation display with full parliamentary context
- Divergence highlighting and analysis tools

---

## Why This Matters

### The Invisible Editorial Layer

Traditional media makes its editorial choices visible—everyone knows newspapers have different perspectives. But AI systems that answer questions from documents feel authoritative and neutral. Commons Traybake demonstrates that these systems make editorial choices at the level of infrastructure, before users ever see a word on screen.

**Technical decisions that shape discourse:**
- How big should chunks be? (affects context preservation)
- Should chunks know where they came from? (affects cross-reference capability)
- Where should boundaries be drawn? (affects whose statements stay intact)

### Parliamentary Language as Test Case

UK Parliamentary debates are ideal for exposing these effects because:

1. **Context-dependent meaning**: "We're committed to protecting the NHS" means different things from a minister vs. a backbencher
2. **Deliberate ambiguity**: Politicians craft language to be interpreted multiple ways
3. **Adversarial discourse**: The same facts produce opposite conclusions depending on framing
4. **Procedural complexity**: Understanding context requires knowing who spoke before/after, what type of debate it is, and parliamentary conventions

### Real-World Implications

The same chunking decisions that affect parliamentary retrieval affect:
- Legal document analysis systems
- Corporate knowledge bases
- Medical literature search
- Educational content recommendation
- News archive retrieval

Any system that breaks documents into pieces and searches them is making these choices, whether the builders realize it or not.

---

## What Makes This Project Different

### Not an Optimization Problem

Most RAG projects aim to find the "best" chunking strategy. Commons Traybake demonstrates there is no neutral best—different strategies encode different assumptions about what information matters and how meaning is preserved.

### Divergence is the Feature

The product is not the answers—it's the difference between the answers. The project succeeds when users see four different results from the same query and understand that the chunking strategy shaped what they received.

### Infrastructure Criticism

This is infrastructure criticism disguised as a web application. It makes visible the choices that typically remain invisible in production systems.

---

## Target Audience

This project is designed for:

- **Students & Researchers** studying information systems, AI ethics, or political discourse
- **Developers** building RAG systems who want to understand the implications of their architecture choices
- **Policy Makers** considering the deployment of AI systems in civic contexts
- **The Generally Suspicious** who think technical systems aren't as neutral as claimed

No technical knowledge required to use the system—the comparative interface makes the point visually.

---

## Success Criteria

### MVP Success
- [x] All four chunking strategies operational
- [x] Validation framework confirms measurable differences
- [ ] Query all strategies simultaneously
- [ ] Results visibly differ on ≥30% of test queries
- [ ] Citations link correctly to official Hansard records
- [ ] UI makes divergence immediately obvious
- [ ] Non-technical users can understand the demonstration

### Project Impact
- Demonstrate that technical architecture encodes political framing
- Provide concrete examples of strategy X favoring perspective Y
- Make non-technical audiences care about chunking choices
- Learn something uncomfortable about how RAG systems work

---

## Technical Architecture (High-Level)

```
Parliament API
    ↓
Data Ingestion & Parsing
    ↓
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ Semantic    │ Semantic    │ Late        │ Late        │
│ 1024        │ 256         │ Chunking    │ Chunking    │
│             │             │ 1024        │ 256         │
└─────────────┴─────────────┴─────────────┴─────────────┘
    ↓               ↓               ↓               ↓
[Vector Store 1][Vector Store 2][Vector Store 3][Vector Store 4]
    ↓               ↓               ↓               ↓
                Query Router
                      ↓
            Comparative Results Interface
```

Each pipeline creates a distinct vector store. Users query all four simultaneously and see how chunking strategy determines retrieval results.

**Key Technologies:**
- OpenAI `text-embedding-3-large` (3,072 dimensions)
- Neo4j with native vector index (enables graph relationships)
- LangChain SemanticChunker for intelligent splitting
- SvelteKit for comparative visualization interface

---

## Timeline & Milestones

### Phase 1: Data Processing (Complete)
- ✅ Parliament API client
- ✅ Four chunking pipelines
- ✅ Validation framework
- ✅ Test suite with real data

### Phase 2: Retrieval Layer (Next)
- Neo4j vector database setup
- Comparative search implementation
- Graph relationship modeling (PRECEDES, RESPONDS_TO, MENTIONS_SAME_TOPIC)

### Phase 3: User Interface (Planned)
- SvelteKit application foundation
- Query interface with suggestions
- 2×2 comparative results grid
- Citation display with full parliamentary context
- Divergence analysis tools

### Phase 4: Evaluation (Planned)
- Adversarial test query design
- Metrics dashboard (speaker diversity, party balance, temporal accuracy)
- Systematic bias quantification
- Documentation of findings

---

## Key Insights

### What We've Learned

**From Validation Testing:**
1. Smaller chunks (256 tokens) systematically underrepresent minor parties
2. Aggressive splitting favors government voices over opposition by 3:1 ratio
3. Late chunking with contextual awareness shows different retrieval patterns
4. Speaker boundary preservation is critical for attribution accuracy

**Design Principles:**
1. Don't optimize away messiness—contradictions and failures are findings, not bugs
2. Speaker boundaries are sacred—never split across speakers in standard chunking
3. Citations must be forensic—every claim traces to exact Hansard reference
4. Make choices visible—show how technical decisions encode political framing

---

## Project Team & Context

This is an experimental/educational project built by a small team to demonstrate how RAG systems encode assumptions through their architecture. The messiness is intentional—this is research infrastructure, not production software.

**Philosophy**: "Make uncomfortable things visible" trumps "make helpful things smooth."

---

## How to Engage

### For Users (When Complete)
1. Visit the web interface
2. Ask questions about UK Parliamentary debates
3. Observe four different answers from the same data
4. Explore which MPs get quoted by which chunking strategy
5. Follow citations back to official Hansard records

### For Developers
1. Clone the repository
2. Run the test scripts to see chunking strategies in action
3. Examine validation reports showing systematic differences
4. Explore the codebase to understand implementation choices
5. Extend with new chunking strategies or metrics

### For Researchers
1. Review the validation framework and bias detection metrics
2. Analyze the findings about party representation and speaker diversity
3. Consider implications for other domains (legal, medical, news)
4. Use as a case study for information architecture and AI ethics

---

## Conclusion

Commons Traybake demonstrates that every RAG system makes editorial choices at the infrastructure level. These choices determine whose voice gets amplified, what context survives, and how contradictions appear or disappear.

The question is not whether your information architecture encodes ideology—it does. The question is whether you're making those choices visible and interrogating their implications.

This project makes them visible.

---

For more information:
- **[Non-Technical Overview](low-tech-project-description.md)** - Understanding the project without code
- **[Technical Implementation Plan](project-plan.md)** - Complete architecture and technical details
- **[Getting Started Guide](Getting-Started.md)** - Setup and first steps
- **[Roadmap Overview](roadmap/README.md)** - Current status and next milestones
