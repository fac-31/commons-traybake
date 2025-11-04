import { OpenAIEmbeddings } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { encoding_for_model } from 'tiktoken';
import type { Debate, Contribution } from '../../types/index.js';
import { ChunkingPipeline, type Chunk, type ChunkingStrategy } from './base-chunker.js';

/**
 * Semantic chunking pipeline with 256 token maximum (aggressive splitting)
 *
 * Strategy:
 * - Preserves speaker boundaries as sacred constraints
 * - Uses aggressive semantic splitting within each speaker's contribution
 * - Maximum 256 tokens per chunk (4x smaller than semantic_1024)
 * - Embeds with OpenAI text-embedding-3-large (3,072 dimensions)
 * - Creates more granular chunks for fine-grained retrieval
 */
export class SemanticPipeline256 extends ChunkingPipeline {
  readonly strategyName: ChunkingStrategy = 'semantic_256';
  readonly maxTokens = 256;

  private embeddings: OpenAIEmbeddings;
  private textSplitter: RecursiveCharacterTextSplitter;
  private tokenizer: ReturnType<typeof encoding_for_model>;

  constructor(openaiApiKey?: string) {
    super();

    // Initialize tiktoken for accurate token counting
    this.tokenizer = encoding_for_model('gpt-3.5-turbo');

    // Initialize OpenAI embeddings with text-embedding-3-large model
    this.embeddings = new OpenAIEmbeddings({
      modelName: 'text-embedding-3-large',
      apiKey: openaiApiKey || process.env.OPENAI_API_KEY,
      dimensions: 3072,
    });

    // Initialize text splitter with semantic separators
    // More aggressive splitting with smaller chunks and less overlap
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: this.maxTokens,
      chunkOverlap: 20, // Smaller overlap for 256-token chunks
      separators: ['\n\n', '\n', '. ', '! ', '? ', '; ', ', ', ' ', ''],
      lengthFunction: (text: string) => this.countTokens(text),
    });
  }

  /**
   * Process a debate into aggressively chunked segments
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
        // Skip empty or whitespace-only chunks
        if (!chunkText.trim()) {
          continue;
        }

        const tokenCount = this.countTokens(chunkText);

        // Skip if chunk still exceeds limit (shouldn't happen, but safety check)
        if (tokenCount > this.maxTokens) {
          console.warn(`Warning: Chunk ${sequenceNumber} has ${tokenCount} tokens, exceeding limit of ${this.maxTokens}`);
          // Truncate the chunk to max tokens
          const truncatedText = this.truncateToTokenLimit(chunkText, this.maxTokens);
          const truncatedTokenCount = this.countTokens(truncatedText);

          const embedding = await this.embeddings.embedQuery(truncatedText);
          const chunk: Chunk = {
            id: this.generateChunkId(debate.id, sequenceNumber),
            text: truncatedText,
            embedding,
            strategy: this.strategyName,
            tokenCount: truncatedTokenCount,
            sequenceNumber,
            createdAt: new Date(),
            ...this.createChunkMetadata(contribution, debate),
          };
          chunks.push(chunk);
          sequenceNumber++;
          continue;
        }

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
    const text = contribution.text.trim();

    // Skip empty contributions
    if (!text) {
      return [];
    }

    const tokenCount = this.countTokens(text);

    // If within token limit, return as-is
    if (tokenCount <= this.maxTokens) {
      return [text];
    }

    // Use semantic splitter for larger contributions
    const documents = await this.textSplitter.createDocuments([text]);
    return documents.map(doc => doc.pageContent);
  }

  /**
   * Count tokens accurately using tiktoken
   * @param text - Text to count tokens for
   * @returns Exact token count
   */
  private countTokens(text: string): number {
    const tokens = this.tokenizer.encode(text);
    return tokens.length;
  }

  /**
   * Truncate text to a specific token limit
   * @param text - Text to truncate
   * @param maxTokens - Maximum number of tokens
   * @returns Truncated text
   */
  private truncateToTokenLimit(text: string, maxTokens: number): string {
    const tokens = this.tokenizer.encode(text);
    if (tokens.length <= maxTokens) {
      return text;
    }

    const truncatedTokens = tokens.slice(0, maxTokens);
    const truncatedText = this.tokenizer.decode(truncatedTokens);
    return truncatedText;
  }
}
