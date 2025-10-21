# Parliament RAG: A Guiding Document for Surfacing Semantic Chaos

## I. Strategic Overview: What We're Actually Building

You're not building a helpful chatbot. You're building a **diagnostic tool that exposes how information architecture encodes ideological choices**. The product is the difference between the answers, not the answers themselves.

### Core Architecture Pattern

```
Parliament API → Data Ingestion → 4 Parallel Processing Pipelines → 4 Separate Vector Stores → Query Router → Comparative Results Interface
```

Each pipeline produces a distinct vector store. Users query all four simultaneously and see how chunking strategy determines what gets retrieved. The web app becomes a live demonstration of how "neutral" technical decisions shape political discourse.

---

## II. Technical Stack Decisions

### Embedding Model: `text-embedding-3-large`

**Why this one:**
- 3,072 dimensions gives you enough resolution to capture parliamentary nuance
- The "large" variant handles the linguistic complexity better than "small" - parliamentary speech is deliberately ornate
- OpenAI's embedding models have strong performance on subtle semantic differences
- Cost is negligible for your dataset size

**Why not alternatives:**
- Sentence Transformers (e.g., `all-MiniLM-L6-v2`): too lightweight, will miss the performative language dynamics
- `text-embedding-ada-002`: older generation, worse at contextual disambiguation
- Cohere/Voyage: excellent but unnecessary vendor lock-in for an experimental project

### Vector Database: Neo4j with Vector Index

This is the correct choice for the wrong reasons, which means it's actually perfect.

**Graph properties you should track:**
```typescript
Node: Chunk {
  id: string
  text: string
  embedding: float[]
  chunkingStrategy: "semantic_1024" | "semantic_256" | "late_1024" | "late_256"
  
  // Parliamentary metadata (this is where Neo4j earns its keep)
  speaker: string
  speakerParty: string
  speakerRole: string
  debate: string
  date: date
  hansardReference: string
  contributionType: "speech" | "intervention" | "question" | "answer"
  proceduralContext: string
}

Relationship: PRECEDES {
  // Preserve debate thread structure
  temporalDistance: int
  sameSpeaker: boolean
}

Relationship: RESPONDS_TO {
  // Track who's addressing whom
  directResponse: boolean
}

Relationship: MENTIONS_SAME_TOPIC {
  // Connect chunks discussing same bill/policy
  topicId: string
  framingAlignment: float  // do they agree or contradict?
}
```

**Why this matters for your experiment:**
Your late chunking implementation needs the graph structure. When you embed a chunk with contextual awareness, you're saying "this chunk's meaning is influenced by its position in the debate graph." Neo4j lets you query: "retrieve chunks where the speaker was challenged in the next contribution" or "find contradictions from the same minister across different dates."

**Implementation note:**
Use Neo4j's native vector index (available since 5.11) with cosine similarity. Don't bother with Weaviate/Chroma/Qdrant - you'd lose the graph query capabilities and gain nothing material for retrieval quality.

### Semantic Splitter: LangChain's Experimental Semantic Chunker + Custom Parliamentary Tokenizer

**Base implementation:**
```typescript
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

// But you'll immediately replace this with:
import { SemanticChunker } from "@langchain/experimental/splitters";
```

**The semantic chunker:**
- Uses embeddings to determine where semantic breaks naturally occur
- Chunks when embedding distance crosses a threshold
- Respects your token limits as boundaries

**Critical customization needed:**
Parliamentary language requires preprocessing before semantic chunking:

```typescript
class ParliamentaryTextProcessor {
  // Strip procedural noise conditionally
  stripProceduralMarkers(text: string, preserveContext: boolean): string {
    if (preserveContext) {
      // Keep "(Laughter)" etc as semantic signal
      return text;
    }
    // Remove for cleaner embeddings in some pipeline variants
    return text.replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '');
  }
  
  // Preserve attribution markers
  preserveSpeakerBoundaries(text: string): string[] {
    // Split on speaker changes, these are sacred boundaries
    return text.split(/\n(?=[A-Z][a-z]+ [A-Z][a-z]+:)/);
  }
  
  // Handle parliamentary references
  normalizeHansardRefs(text: string): string {
    // Keep "[Official Report, 12 May 2023, Vol. 732, c. 45]" intact
    // These are citation gold
  }
}
```

**Your four pipeline variants:**

1. **Semantic 1024**: Standard semantic chunker, max 1024 tokens, preserve speaker boundaries
2. **Semantic 256**: Same but aggressive - will split mid-speech if needed
3. **Late Chunking 1024**: Embed the full debate first, then chunk semantically, inject contextual embeddings
4. **Late Chunking 256**: Same but watch how cross-speaker context affects tiny chunks

### Late Chunking Implementation

This is the interesting bit. You're not using an off-the-shelf solution because the technique is still relatively niche.

**Approach:**
```typescript
class LateChunkingPipeline {
  async processDebate(debate: Debate) {
    // 1. Embed the entire debate as a single context window
    const debateEmbedding = await embedder.embed(debate.fullText);
    
    // 2. Create chunks using semantic splitter
    const chunks = await semanticChunker.split(debate.fullText, maxTokens);
    
    // 3. For each chunk, create a contextual embedding
    const contextualChunks = await Promise.all(
      chunks.map(async (chunk, idx) => {
        // Embed the chunk with awareness of its position
        const chunkEmbedding = await embedder.embed(chunk.text);
        
        // Blend: chunk embedding + debate embedding (weighted)
        // This is the "late chunking" magic
        const contextualEmbedding = this.blendEmbeddings(
          chunkEmbedding,
          debateEmbedding,
          0.7  // 70% chunk, 30% debate context
        );
        
        return {
          ...chunk,
          embedding: contextualEmbedding,
          debateContext: debate.metadata
        };
      })
    );
  }
  
  blendEmbeddings(chunk: number[], context: number[], alpha: number): number[] {
    return chunk.map((val, i) => alpha * val + (1 - alpha) * context[i]);
  }
}
```

**Why this works:**
The blended embedding means "glass" in a debate about recycling will be closer to environmental chunks, while "glass" in a debate about pub licensing will cluster with hospitality chunks - even if the surrounding text is identical.

### Citations: Forensic Attribution

Your citation system needs to be surgical because parliamentary discourse is all about who said what when.

**Required metadata capture:**
```typescript
interface ParliamentaryCitation {
  // Unique identifiers
  hansardId: string;
  debateId: string;
  contributionId: string;
  
  // Speaker attribution
  speakerName: string;
  speakerConstituency?: string;
  speakerParty: string;
  speakerRole: string;  // "Minister", "Shadow Minister", "Backbencher"
  
  // Temporal context
  date: Date;
  parliamentarySession: string;
  
  // Discourse context
  debateTitle: string;
  debateType: "PMQs" | "General Debate" | "Committee" | "Written Questions";
  questionNumber?: string;  // for written/oral questions
  
  // Structural position
  hansardReference: string;  // "HC Deb 12 May 2023 vol 732 c45"
  columnNumber: string;
  
  // Semantic context
  previousSpeaker?: string;
  addressing?: string;  // who they're responding to
  
  // Your experimental data
  retrievedFromStrategy: ChunkingStrategy;
  retrievalScore: number;
  chunkBoundaries: { start: number; end: number };
}
```

**Citation display in UI:**
```typescript
// Show users exactly where the answer came from
<CitationCard>
  <Speaker>{citation.speakerName} ({citation.speakerParty})</Speaker>
  <Context>{citation.debateTitle} • {citation.date}</Context>
  <Quote>{retrievedChunk.text}</Quote>
  <HansardLink href={buildHansardUrl(citation)}>
    {citation.hansardReference}
  </HansardLink>
  <ExperimentalData>
    Retrieved from: {citation.retrievedFromStrategy}
    Similarity score: {citation.retrievalScore}
  </ExperimentalData>
</CitationCard>
```

---

## III. Implementation Plan: The Actual Work

### Phase 0: Data Ingestion (Day 1)

**Task: Build the Parliament API client**

```typescript
// /src/lib/parliament/api-client.ts
class ParliamentAPI {
  async fetchDebatesByTopic(topic: string, dateRange: DateRange) {
    // Use the Parliament API search endpoint
    // Filter by debate type (PMQs, General Debates)
  }
  
  async fetchBillDebates(billId: string) {
    // Track a bill through all readings and committees
  }
  
  async fetchHansardByReference(ref: string) {
    // Direct lookup for citations
  }
}
```

**Recommended starting dataset:**
- Pick 2-3 controversial topics (e.g., NHS funding, immigration policy, climate policy)
- Pull 6-12 months of debates
- Aim for ~50-100K words total
- This is enough to demonstrate chunk size effects without drowning in data

**Data structure to store:**
```typescript
interface ParliamentaryDebate {
  id: string;
  title: string;
  date: Date;
  type: DebateType;
  contributions: Contribution[];
  metadata: DebateMetadata;
}

interface Contribution {
  speaker: Speaker;
  text: string;
  timestamp: Date;
  hansardRef: string;
  isIntervention: boolean;
  respondsTo?: string;
}
```

### Phase 1: Build Four Processing Pipelines (Days 2-3)

**Task: Parallel pipeline architecture**

```typescript
// /src/lib/processing/pipelines/

abstract class ChunkingPipeline {
  abstract strategyName: ChunkingStrategy;
  abstract process(debate: Debate): Promise<Chunk[]>;
  
  async ingestToVectorStore(chunks: Chunk[]) {
    // Store in Neo4j with strategy label
    await neo4j.createChunks(chunks, this.strategyName);
  }
}

class SemanticPipeline1024 extends ChunkingPipeline {
  strategyName = "semantic_1024";
  
  async process(debate: Debate) {
    const splitter = new SemanticChunker({
      maxTokens: 1024,
      embeddingModel: embedder
    });
    return await splitter.split(debate);
  }
}

// Repeat for Semantic256, LateChunking1024, LateChunking256
```

**Run all four pipelines on your dataset:**
```typescript
async function processCorpus(debates: Debate[]) {
  const pipelines = [
    new SemanticPipeline1024(),
    new SemanticPipeline256(),
    new LateChunkingPipeline1024(),
    new LateChunkingPipeline256()
  ];
  
  for (const pipeline of pipelines) {
    console.log(`Processing with ${pipeline.strategyName}...`);
    for (const debate of debates) {
      const chunks = await pipeline.process(debate);
      await pipeline.ingestToVectorStore(chunks);
    }
  }
}
```

### Phase 2: Build the Query System (Days 4-5)

**Task: Comparative retrieval**

```typescript
// /src/lib/retrieval/comparative-search.ts

class ComparativeRetrieval {
  async queryAllStrategies(
    query: string,
    k: number = 5
  ): Promise<StrategyResults[]> {
    const queryEmbedding = await embedder.embed(query);
    
    const strategies = [
      "semantic_1024",
      "semantic_256", 
      "late_1024",
      "late_256"
    ];
    
    // Query all four vector stores simultaneously
    const results = await Promise.all(
      strategies.map(async (strategy) => {
        const chunks = await neo4j.vectorSearch({
          embedding: queryEmbedding,
          strategy: strategy,
          limit: k
        });
        
        return {
          strategy,
          chunks,
          metadata: this.analyzeResults(chunks)
        };
      })
    );
    
    return results;
  }
  
  analyzeResults(chunks: Chunk[]) {
    // Your experimental metrics
    return {
      averageChunkSize: mean(chunks.map(c => c.tokenCount)),
      speakerDiversity: uniqueCount(chunks.map(c => c.speaker)),
      temporalSpread: max(chunks.map(c => c.date)) - min(chunks.map(c => c.date)),
      partyBreakdown: groupBy(chunks, c => c.speakerParty)
    };
  }
}
```

### Phase 3: RAG Response Generation (Day 5-6)

**Task: Generate answers with attribution**

```typescript
// /src/lib/generation/rag-generator.ts

class ParliamentaryRAG {
  async generateResponse(
    query: string,
    strategy: ChunkingStrategy
  ): Promise<Response> {
    // 1. Retrieve relevant chunks
    const chunks = await retriever.query(query, strategy);
    
    // 2. Build context with clear attribution
    const context = chunks.map(chunk => 
      `[${chunk.speaker} (${chunk.party}), ${chunk.date}]: ${chunk.text}`
    ).join('\n\n---\n\n');
    
    // 3. Generate response with citation instructions
    const prompt = `
You are analysing UK parliamentary debates. Answer the following question using ONLY the provided context.

For each claim, cite the specific speaker and date. If speakers contradict each other, note this explicitly.

Context:
${context}

Question: ${query}

Answer with careful attribution:`;
    
    const response = await llm.generate(prompt);
    
    return {
      answer: response,
      citations: chunks,
      strategy: strategy
    };
  }
}
```

### Phase 4: Build the Svelte Interface (Days 6-8)

**Task: Comparative visualization**

Your UI needs to make the experimental differences visceral. Users should see four answers side-by-side and immediately understand that the chunking strategy shaped what they got.

```svelte
<!-- /src/routes/+page.svelte -->
<script lang="ts">
  import { ComparativeQuery } from '$lib/components/ComparativeQuery.svelte';
  import { ResultsGrid } from '$lib/components/ResultsGrid.svelte';
  
  let query = $state('');
  let results = $state<StrategyResults[]>([]);
  
  async function search() {
    results = await fetch('/api/query', {
      method: 'POST',
      body: JSON.stringify({ query })
    }).then(r => r.json());
  }
</script>

<div class="experiment-interface">
  <QueryInput bind:value={query} on:submit={search} />
  
  {#if results.length > 0}
    <ResultsGrid {results}>
      {#each results as result}
        <StrategyPanel strategy={result.strategy}>
          <Answer text={result.answer} />
          <Citations chunks={result.chunks} />
          <Metrics data={result.metadata} />
          
          <!-- The money shot: highlight differences -->
          <DivergenceIndicator 
            showsConflictWith={otherStrategies(result)} 
          />
        </StrategyPanel>
      {/each}
    </ResultsGrid>
  {/if}
</div>
```

**Key UI components:**

1. **Strategy comparison view**: 2x2 grid showing all four answers
2. **Divergence highlighter**: Colour-code where strategies gave different sources
3. **Citation explorer**: Click a citation to see its full parliamentary context
4. **Chunk boundary visualizer**: Show where each strategy drew its boundaries
5. **Speaker attribution network**: Graph view showing which MPs got quoted by which strategy

### Phase 5: Evaluation Framework (Days 8-9)

**Task: Build metrics to quantify the chaos**

```typescript
// /src/lib/evaluation/metrics.ts

interface EvaluationMetrics {
  // Retrieval diversity
  chunkOverlap: number;  // How many chunks are shared between strategies?
  speakerDiversity: number;  // Do different strategies favour different speakers?
  
  // Attribution accuracy  
  correctAttribution: number;  // Did it cite the right person?
  temporalAccuracy: number;  // Did it get the date right?
  
  // Answer divergence
  semanticSimilarity: number;  // Are the answers saying the same thing?
  citationDivergence: number;  // Are they citing different sources?
  
  // Political bias detection
  partyBalance: Record<Party, number>;  // Which party gets quoted more?
  governmentOppositionRatio: number;
}

class EvaluationSuite {
  async evaluateQuery(query: string, goldStandard?: Answer) {
    const results = await retrieval.queryAllStrategies(query);
    
    return {
      chunkOverlap: this.calculateOverlap(results),
      divergence: this.measureDivergence(results),
      bias: this.detectBias(results),
      accuracy: goldStandard ? this.scoreAgainstGold(results, goldStandard) : null
    };
  }
  
  calculateOverlap(results: StrategyResults[]): number {
    // What percentage of chunks appear in multiple strategies?
    const allChunks = results.flatMap(r => r.chunks.map(c => c.id));
    const uniqueChunks = new Set(allChunks);
    return (allChunks.length - uniqueChunks.size) / allChunks.length;
  }
  
  detectBias(results: StrategyResults[]): BiasMetrics {
    // Do certain strategies systematically favour government vs opposition sources?
    return results.map(result => ({
      strategy: result.strategy,
      partyBreakdown: countBy(result.chunks, c => c.speakerParty),
      roleBreakdown: countBy(result.chunks, c => c.speakerRole)
    }));
  }
}
```

### Phase 6: Create Test Queries (Day 9)

**Task: Adversarial question design**

These questions should deliberately expose chunking weaknesses:

```typescript
const testQueries = [
  // Context-dependent meaning
  {
    query: "What is the government's position on NHS privatization?",
    expectedDivergence: "High - ministers say different things in different contexts",
    tests: ["temporal_consistency", "speaker_attribution", "framing_bias"]
  },
  
  // Cross-boundary synthesis
  {
    query: "How did the opposition respond to the Prime Minister's claims about unemployment?",
    expectedDivergence: "High - requires connecting PM statement to opposition reply",
    tests: ["boundary_spanning", "speaker_relationship", "temporal_ordering"]
  },
  
  // Ambiguous terminology
  {
    query: "What does 'levelling up' mean according to MPs?",
    expectedDivergence: "Medium - same phrase used with different intent by different speakers",
    tests: ["semantic_disambiguation", "party_framing", "policy_specificity"]
  },
  
  // Numerical claims
  {
    query: "How much has NHS funding increased?",
    expectedDivergence: "High - government and opposition cite different baselines/metrics",
    tests: ["numerical_accuracy", "baseline_consistency", "citation_precision"]
  },
  
  // Procedural vs substantive
  {
    query: "Why did the bill fail?",
    expectedDivergence: "Medium - procedural noise vs substantive objections",
    tests: ["procedural_filtering", "causal_reasoning", "attribution_accuracy"]
  }
];
```

---

## IV. Breadcrumb Concept Evaluation

Let's assess what you've heard about:

### ✅ Use These

**RAGAS (Retrieval-Augmented Generation Assessment)**
- Perfect for your use case
- Measures faithfulness (is the answer grounded in retrieved context?), answer relevance, context recall
- Gives you quantitative comparison between your four strategies
- LangChain has RAGAS integration already

**LangSmith**
- Essential for debugging your RAG pipelines
- Traces every step: query → embedding → retrieval → generation
- You'll want this when chunks go missing mysteriously
- Free tier is sufficient for your project

**Hierarchical/RAPTOR indexing**
- Not for MVP, but excellent stretch goal
- Create "summary nodes" above individual chunks representing entire debates
- Let retrieval decide whether to use detailed chunks or thematic summaries
- This would be your fifth and sixth strategies

**Hansard annotation preservation**
- Yes, absolutely
- Those "(Laughter)" markers are semantic gold
- Track them as metadata, experiment with keeping vs removing them in different pipelines

### 🤔 Consider Carefully

**ColBERT/Multi-vector retrieval**
- Technically interesting but probably overkill
- You'd need to implement custom scoring, LangChain support is limited
- Save this for if your semantic chunking results are disappointingly similar

**LangGraph**
- Useful if you want multi-step reasoning ("First find the bill discussion, then find responses to it")
- Not necessary for MVP
- Good stretch goal if you want to build a "debate navigation agent"

### ❌ Skip for Now

**Synthetic Q/A generation for evaluation dataset**
- You don't need this
- Parliamentary debates are already argumentative - the questions are built-in
- Use actual parliamentary questions instead (they're in the API)
- Hand-curate 20-30 real questions that span your test categories

**TruLens**
- Similar to RAGAS but heavier
- RAGAS is sufficient for your scope
- TruLens is better for production monitoring, which you're not doing

**ARES**
- Academic-grade evaluation framework
- Overkill unless you're writing a paper
- Your comparison visualizations will be more convincing than quantitative scores

---

## V. Division of Labour (3-Person Team)

Since you're all working across all areas, parallelization strategy:

### Week 1: MVP
**Everyone Together (Days 1-2)**
- Set up repo, infrastructure, API exploration
- Agree on data schema and first dataset
- Build the Parliament API client together

**Split for Parallel Work (Days 3-6)**

**Person A: Data Pipeline**
- Build all four chunking pipelines
- Neo4j schema and ingestion
- Run initial corpus processing

**Person B: Retrieval + RAG**
- Implement vector search across strategies
- Build RAG generation with citations
- Create comparative query system

**Person C: Frontend**
- Svelte UI for query input
- Results visualization components
- Citation display and formatting

**Everyone Together (Days 7-8)**
- Integration
- Test with adversarial queries
- Fix the inevitable disasters

### Week 2: Stretch Goals
**Add Late Chunking (Days 9-11)**
- Person A: Implement late chunking logic
- Person B: Modify retrieval for contextual embeddings
- Person C: Add UI toggles for strategy comparison

**Evaluation + Demo Prep (Days 12-14)**
- Build metrics dashboard
- Create compelling demo scenarios
- Document the divergences you found

---

## VI. The Uncomfortable Truths

### Things That Will Go Wrong

1. **The Parliament API will be annoying**
   - XML everywhere
   - Inconsistent speaker attribution
   - Missing metadata on older debates
   - Rate limiting you didn't expect
   
   **Mitigation**: Cache aggressively, build retry logic, accept data quality issues

2. **Semantic chunking will be less magical than hoped**
   - Many chunks will be nearly identical across strategies
   - The interesting divergences will be rare
   
   **Mitigation**: This is fine - your project is about making those rare cases visible

3. **Late chunking implementation will be fiddly**
   - No standard library support
   - You'll second-guess the blending weights
   - Might not show dramatic differences from standard semantic chunking
   
   **Mitigation**: Start with simple weighted averaging, iterate if needed

4. **The answers will often be boring**
   - "According to multiple MPs, the NHS received additional funding"
   - Not every query will expose dramatic bias
   
   **Mitigation**: This is the point - you're showing that technical choices *can* skew results, not that they *always* do

### Things You Should Measure But Might Not Want To

- **Which strategies systematically favour government speakers**
  - This might be uncomfortable data
  - It's also exactly what makes your project interesting
  
- **How often chunks lose critical context at boundaries**
  - Quantifying this requires manual review
  - It's tedious but it's your thesis

- **Whether certain parties' language chunks more cleanly**
  - Tory boilerplate vs Labour narrative complexity
  - Linguistic analysis you didn't sign up for

---

## VII. Success Criteria

### MVP is successful if:
- [ ] You can query all four strategies simultaneously
- [ ] Results visibly differ on at least 30% of test queries
- [ ] Citations link back to Hansard correctly
- [ ] The UI makes divergence immediately obvious
- [ ] Someone unfamiliar with RAG can understand what you're demonstrating

### Stretch is successful if:
- [ ] Late chunking produces measurably different retrieval patterns
- [ ] You can articulate *why* those patterns differ
- [ ] The graph structure in Neo4j enables novel queries
- [ ] Your metrics quantify bias in interesting ways

### Project is meaningful if:
- [ ] You can make a non-technical person care about chunking choices
- [ ] You have concrete examples of how strategy X favoured perspective Y
- [ ] Your documentation includes "failure cases" that reveal system assumptions
- [ ] You've learned something uncomfortable about how RAG systems encode political framing

---

## VIII. Implementation Checklist

```typescript
// Your getting-started checklist

const implementation = {
  day1: [
    "Set up SvelteKit project with TypeScript",
    "Install LangChain, Neo4j driver, OpenAI client",
    "Create Parliament API client with basic endpoints",
    "Pull first test dataset (100 debate contributions)",
  ],
  
  day2: [
    "Design Neo4j schema for chunks + metadata",
    "Implement base ChunkingPipeline class",
    "Build semantic chunker with 1024 token limit",
    "Test ingestion of 1 debate through pipeline",
  ],
  
  day3: [
    "Implement remaining three chunking strategies",
    "Process full test dataset through all pipelines",
    "Verify Neo4j contains all four vector stores",
    "Build comparative retrieval function",
  ],
  
  day4: [
    "Implement RAG generation with citations",
    "Create SvelteKit API routes for queries",
    "Test end-to-end: query → retrieval → generation",
    "Fix the embedding dimension mismatches you'll definitely have",
  ],
  
  day5: [
    "Build Svelte query interface",
    "Create 2x2 results grid component",
    "Implement citation display with Hansard links",
    "Add basic metrics visualization",
  ],
  
  day6: [
    "Integration testing with real queries",
    "Identify divergent results manually",
    "Fix attribution bugs",
    "Improve UI based on initial testing",
  ],
  
  day7: [
    "Create 20 test queries spanning categories",
    "Document observed divergences",
    "Build simple evaluation metrics",
    "Prepare demo scenarios",
  ],
  
  day8: [
    "Buffer day for inevitable disasters",
    "Polish UI",
    "Write documentation",
    "Celebrate MVP completion",
  ],
  
  // Stretch goals
  day9_11: [
    "Implement late chunking with context blending",
    "Re-process dataset with new strategies",
    "Update UI to show all six strategies",
    "Compare late vs standard chunking results",
  ],
  
  day12_14: [
    "Build evaluation dashboard",
    "Quantify bias metrics across strategies",
    "Create compelling visualizations",
    "Document most interesting findings",
  ]
};
```

---

## IX. Final Thoughts

You've picked a dataset where the politics are unavoidable, which means the technical choices become political choices. That's rare for a student project and it's worth protecting.

Don't optimize away the messiness. The contradictions, the attribution failures, the chunks that lose critical context - these aren't bugs. They're your findings.

The real deliverable isn't a working chatbot. It's a demonstration that information retrieval systems encode epistemological commitments through their architecture. You're building infrastructure that makes those commitments visible.

Good luck. Make it weird.
