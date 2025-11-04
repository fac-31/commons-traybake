import { OpenAIEmbeddings } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import type { Debate, Contribution } from '../../types/index.js';
import { ChunkingPipeline, type Chunk, type ChunkingStrategy } from './base-chunker.js';

/**
 * Semantic chunking pipeline with 1024 token maximum
 *
 * Strategy:
 * - Preserves speaker boundaries as sacred constraints
 * - Uses semantic splitting within each speaker's contribution
 * - Maximum 1024 tokens per chunk
 * - Embeds with OpenAI text-embedding-3-large (3,072 dimensions)
 */
export class SemanticPipeline1024 extends ChunkingPipeline {
  readonly strategyName: ChunkingStrategy = 'semantic_1024';
  readonly maxTokens = 1024;

  private embeddings: OpenAIEmbeddings;
  private textSplitter: RecursiveCharacterTextSplitter;

  constructor(openaiApiKey?: string) {
    super();

    // Initialize OpenAI embeddings with text-embedding-3-large model
    this.embeddings = new OpenAIEmbeddings({
      modelName: 'text-embedding-3-large',
      apiKey: openaiApiKey || process.env.OPENAI_API_KEY,
      dimensions: 3072,
    });

    // Initialize text splitter with semantic separators
    // Prioritize paragraph breaks, then sentences, then words
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: this.maxTokens * 4, // Rough character estimate (1 token ≈ 4 chars)
      chunkOverlap: 100, // Small overlap for context
      separators: ['\n\n', '\n', '. ', '! ', '? ', '; ', ', ', ' ', ''],
      lengthFunction: (text: string) => this.estimateTokens(text),
    });
  }

  /**
   * Process a debate into semantically chunked segments
   * @param debate - The parliamentary debate to process
   * @returns Array of chunks with embeddings and metadata
   */
  async process(debate: Debate): Promise<Chunk[]> {
    const chunks: Chunk[] = [];
    let sequenceNumber = 0;

    // Process each contribution separately to preserve speaker boundaries
    for (const contribution of debate.contributions) {
      // Split the contribution text if it exceeds max tokens
      const contributionChunks = await this.splitContribution(contribution, debate);

      // Process each chunk
      for (const chunkText of contributionChunks) {
        const tokenCount = this.estimateTokens(chunkText);

        // Generate embedding for this chunk
        const embedding = await this.embeddings.embedQuery(chunkText);

        // Create chunk with full metadata
        const chunk: Chunk = {
          id: this.generateChunkId(debate.id, sequenceNumber),
          text: chunkText,
          embedding,
          strategy: this.strategyName,
          tokenCount,
          sequenceNumber,
          createdAt: new Date(),
          ...this.createChunkMetadata(contribution, debate),
        };

        chunks.push(chunk);
        sequenceNumber++;
      }
    }

    // Link chunks in sequence
    const linkedChunks = this.linkChunks(chunks);

    // Validate speaker boundaries are maintained
    if (!this.validateSpeakerBoundaries(linkedChunks)) {
      throw new Error('Speaker boundary validation failed');
    }

    return linkedChunks;
  }

  /**
   * Split a single contribution into chunks if needed
   * @param contribution - The contribution to split
   * @param debate - Parent debate for context
   * @returns Array of chunk texts
   */
  private async splitContribution(
    contribution: Contribution,
    debate: Debate
  ): Promise<string[]> {
    const text = contribution.text;
    const tokenCount = this.estimateTokens(text);

    // If within token limit, return as-is
    if (tokenCount <= this.maxTokens) {
      return [text];
    }

    // Use semantic splitter for larger contributions
    const documents = await this.textSplitter.createDocuments([text]);
    return documents.map(doc => doc.pageContent);
  }

  /**
   * Estimate token count for a text string
   * Uses a simple heuristic: ~4 characters per token
   * This is approximate but sufficient for chunking decisions
   *
   * @param text - Text to estimate
   * @returns Estimated token count
   */
  private estimateTokens(text: string): number {
    // Simple approximation: 1 token ≈ 4 characters for English text
    // More accurate would be to use tiktoken, but this is fast and good enough
    return Math.ceil(text.length / 4);
  }
}
