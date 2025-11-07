# Getting Started with Commons Traybake

This guide will help you set up Commons Traybake on your local machine and run your first chunking experiments with UK Parliamentary debates.

---

## Prerequisites

Before you begin, ensure you have the following installed:

### Required
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **npm** or **yarn** - Comes with Node.js
- **OpenAI API key** - [Get one here](https://platform.openai.com/api-keys)
  - Used for text-embedding-3-large embeddings (3,072 dimensions)
  - Cost is minimal for experimentation (~$0.13 per 1M tokens)

### Optional (For Future Features)
- **Neo4j 5.11+** - [Download here](https://neo4j.com/download/)
  - Required for vector storage and retrieval features
  - Not needed for current chunking pipeline testing

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/fac-31/commons-traybake.git
cd commons-traybake
```

### 2. Install Dependencies

```bash
npm install
```

This will install:
- LangChain (document chunking and RAG framework)
- OpenAI client (embeddings)
- Neo4j driver (database, for future use)
- TypeScript and build tools
- Testing utilities

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:

```env
# OpenAI API Configuration
OPENAI_API_KEY=your_actual_openai_key_here

# Neo4j Configuration (optional, for future features)
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_password_here

# LangSmith Configuration (optional, for debugging)
LANGCHAIN_TRACING_V2=false
LANGCHAIN_API_KEY=your_langsmith_key_here
```

**Important**: Never commit your `.env` file to version control. It's already in `.gitignore`.

### 4. Verify Installation

Check that TypeScript compiles correctly:

```bash
npm run test
```

---

## Your First Chunking Experiment

### Understanding the Test Scripts

Commons Traybake includes several test scripts that demonstrate the chunking pipelines:

| Script | Purpose | What It Shows |
|--------|---------|---------------|
| `test:chunking` | Single strategy test | Basic semantic chunking with 1024 tokens |
| `test:chunking:compare` | Two-strategy comparison | Semantic 1024 vs 256 token differences |
| `test:late-chunking` | Contextual embedding | Late chunking with debate context blending |
| `test:validation` | Comprehensive analysis | Validation metrics across all 4 strategies |

### Run Your First Test

Let's start with a simple semantic chunking test:

```bash
npm run test:chunking
```

**What you'll see:**
```
🏛️  Commons Traybake - Semantic Chunking Test
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Processing debate with Semantic 1024 strategy...
✓ Loaded sample debate
✓ Generated 15 chunks
✓ Created embeddings (3,072 dimensions)

📊 Chunking Analysis:
   • Total chunks: 15
   • Average tokens per chunk: 847
   • Max tokens: 1,022 / 1,024 limit
   • Unique speakers: 8
   • Party distribution:
     - Conservative: 7 chunks
     - Labour: 5 chunks
     - Liberal Democrat: 2 chunks
     - SNP: 1 chunk

📝 Sample Chunk #1:
   Speaker: Rachel Reeves (Labour)
   Tokens: 923
   Text: "Mr Speaker, I am grateful for the opportunity to..."
   [Full text displayed]
```

### Compare Chunking Strategies

Now let's see how different strategies produce different results:

```bash
npm run test:chunking:compare
```

**What this shows:**
- Chunk count differences (1024-token creates fewer, larger chunks)
- Token distribution patterns
- How speaker representation changes between strategies
- Processing time and efficiency metrics

**Example output:**
```
📊 Comparative Analysis:

   Strategy: Semantic 1024
   • Chunks: 15
   • Avg tokens: 847
   • Unique speakers: 8

   Strategy: Semantic 256
   • Chunks: 58
   • Avg tokens: 201
   • Unique speakers: 8

   🔍 Key Differences:
   • 286% more chunks with aggressive splitting
   • Both preserve all speakers (boundary protection working)
   • Smaller chunks enable finer-grained retrieval
   • Larger chunks preserve more context
```

### Test Late Chunking (Contextual Embeddings)

Late chunking blends each chunk's embedding with the full debate's embedding:

```bash
npm run test:late-chunking
```

**What this demonstrates:**
- How context-aware embeddings differ from standard embeddings
- The 70/30 blending algorithm (70% chunk + 30% debate context)
- How "glass" in a recycling debate clusters differently than "glass" in a pub licensing debate

### Run Comprehensive Validation

This is where it gets interesting—systematic bias detection:

```bash
npm run test:validation
```

**What you'll discover:**
- Chunk overlap between strategies (how much they agree)
- Speaker diversity metrics (who gets quoted more/less)
- Party balance analysis (government vs. opposition representation)
- Temporal accuracy validation
- Metadata integrity checks

**Key finding**: The 256-token strategies underrepresent minor parties by 55%!

---

## Understanding the Output

### Chunk Structure

Each chunk contains:

```typescript
{
  id: "unique-chunk-id",
  text: "The actual parliamentary speech text...",
  embedding: [0.123, -0.456, ...], // 3,072 dimensions
  tokens: 847,
  strategy: "semantic_1024",

  // Parliamentary metadata
  speaker: {
    name: "Rachel Reeves",
    party: "Labour",
    constituency: "Leeds West",
    role: "Shadow Chancellor"
  },

  debate: {
    title: "Budget 2024",
    date: "2024-03-06",
    type: "General Debate"
  },

  hansardReference: {
    reference: "HC Deb 06 Mar 2024 vol 745 c123",
    url: "https://hansard.parliament.uk/..."
  }
}
```

### Validation Metrics Explained

**Chunk Overlap** (0-1)
- Measures how many chunks are shared between strategies
- High overlap = strategies agree on what's important
- Low overlap = strategies segment text very differently

**Speaker Diversity** (0-1)
- Measures distribution of unique speakers
- Lower scores indicate dominant speakers monopolizing chunks
- Helps detect if strategy favors certain speakers

**Party Balance** (ratio)
- Government chunks / Opposition chunks
- Neutral = ~1.0
- > 1.0 = favors government voices
- < 1.0 = favors opposition voices

**Temporal Accuracy** (0-1)
- Verifies date/time metadata integrity
- Should always be 1.0 (perfect)

---

## Exploring the Codebase

### Key Directories

```
commons-traybake/
├── src/
│   ├── ingestion/
│   │   ├── chunkers/           # The four chunking strategies
│   │   │   ├── semantic-1024.ts
│   │   │   ├── semantic-256.ts
│   │   │   ├── late-chunking-1024.ts
│   │   │   └── late-chunking-256.ts
│   │   ├── clients/            # Parliament API clients
│   │   ├── parsers/            # Data parsing (debates, speakers, etc.)
│   │   ├── transformers/       # Text cleaning and preparation
│   │   └── validation/         # Quality validation framework
│   ├── types/                  # TypeScript type definitions
│   └── utils/                  # Logger and utilities
├── scripts/                    # Test scripts
├── docs/                       # Documentation
└── .claude/                    # Claude Code configuration
```

### Reading the Code

**Start here if you want to understand:**

1. **How chunking works**: `src/ingestion/chunkers/semantic-1024.ts`
   - See how LangChain's RecursiveCharacterTextSplitter works
   - Understand tiktoken-based token counting
   - Learn how speaker boundaries are preserved

2. **How embeddings are generated**: `src/ingestion/chunkers/base-chunker.ts`
   - OpenAI API integration
   - Batch processing logic
   - Error handling

3. **How late chunking differs**: `src/ingestion/chunkers/late-chunking-1024.ts`
   - Context blending algorithm
   - Full debate embedding generation
   - Weighted averaging (0.7 * chunk + 0.3 * context)

4. **How validation works**: `src/ingestion/validation/chunk-quality-validator.ts`
   - Six-metric validation system
   - Bias detection algorithms
   - Report generation

---

## Common Issues & Solutions

### Issue: "OpenAI API key not found"

**Solution**: Ensure your `.env` file exists and contains:
```env
OPENAI_API_KEY=sk-...your-key-here
```

Verify the file is in the project root (same directory as `package.json`).

### Issue: "Module not found" errors

**Solution**: Reinstall dependencies:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: Rate limit errors from OpenAI

**Solution**: The scripts include retry logic, but if you hit hard limits:
1. Wait a few minutes between runs
2. Consider using a paid OpenAI account (higher limits)
3. Reduce the sample debate size in test scripts

### Issue: TypeScript compilation errors

**Solution**: Ensure you're using Node.js 18+:
```bash
node --version  # Should be v18.0.0 or higher
```

Update if needed: [nodejs.org](https://nodejs.org/)

---

## Next Steps

### Experiment with Your Own Data

The test scripts use sample parliamentary debates. To use your own:

1. Fetch debates from Parliament API:
   ```bash
   npm run test:api
   ```

2. Modify test scripts to use your fetched data
3. See `docs/PARLIAMENT_API_GUIDE.md` for API details

### Explore Validation Reports

After running `npm run test:validation`, check the generated reports:
- `validation-report.json` - Machine-readable metrics
- `validation-report.md` - Human-readable analysis with recommendations

### Dive Deeper into Chunking

Read the technical documentation:
- **[Technical Overview](dev/Technical-Overview.md)** - Architecture and implementation
- **[Architecture Decisions](dev/Architecture-Decisions.md)** - Why we made key choices
- **[Chunking Roadmap](roadmap/Chunking-MVP.md)** - Implementation status and future plans

### Contribute

Found a bug? Have an idea for a new chunking strategy? Want to improve the validation metrics?

1. Check existing issues: [GitHub Issues](https://github.com/fac-31/commons-traybake/issues)
2. Create a new issue or pull request
3. Join discussions about information architecture and RAG systems

---

## Quick Reference

### Essential Commands

```bash
# Install dependencies
npm install

# Run tests
npm run test:chunking              # Single strategy
npm run test:chunking:compare      # Compare two strategies
npm run test:late-chunking         # Test contextual embeddings
npm run test:validation            # Full validation suite

# Parliament API
npm run test:api                   # Fetch real debate data

# Development
npm run type-check                 # Check TypeScript types
```

### Key Configuration

| Variable | Purpose | Required |
|----------|---------|----------|
| `OPENAI_API_KEY` | Embeddings generation | Yes |
| `NEO4J_URI` | Vector database | Future |
| `NEO4J_USERNAME` | Database auth | Future |
| `NEO4J_PASSWORD` | Database auth | Future |

---

## Getting Help

### Documentation

- **[Executive Summary](Executive-Summary.md)** - High-level project overview
- **[Low-Tech Description](low-tech-project-description.md)** - Non-technical explanation
- **[Technical Plan](project-plan.md)** - Complete architecture details
- **[Parliament API Guide](PARLIAMENT_API_GUIDE.md)** - UK Parliament API reference

### Concepts

- **RAG**: Retrieval-Augmented Generation (AI that searches documents)
- **Chunking**: Breaking documents into smaller searchable pieces
- **Embeddings**: Numerical representations of text meaning (vectors)
- **Vector Store**: Database optimized for similarity search
- **Late Chunking**: Embedding strategy that preserves global context

### Community

- GitHub Issues: Report bugs or request features
- Discussions: Ask questions and share findings
- Pull Requests: Contribute code improvements

---

## Welcome!

You're now ready to explore how chunking choices shape information retrieval. Remember:

1. The messiness is intentional—contradictions are findings
2. Different strategies favor different perspectives
3. There is no "best" chunking—only tradeoffs
4. Your job is to make those tradeoffs visible

Have fun making invisible choices visible!
