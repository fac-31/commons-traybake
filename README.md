# Commons Traybake

> Come for information; stay for the searing social critique

## What is This?

Exploring how ethics-neutral data processing decisions are not ethics-neutral by applying different document chunking strategies to data available through the [UK Parliament API](https://developer.parliament.uk/)

## Setup

### Prerequisites
- Node.js 18+ 
- OpenAI API key (for text-embedding-3-large embeddings)
- Neo4j 5.11+ (for vector storage, required in later phases)

### Installation

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

### Running the Chunking Pipeline

Test the semantic chunking implementation:
```bash
npm run test:chunking
```

## Testimonials

<details>
  <summary>Anthropic</summary>
  <img src="./static/claude-worry.jpg" alt="Claude is worried about this project" />
</details>
