import { OpenAIEmbeddings } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { encoding_for_model } from 'tiktoken';
import type { Debate, Contribution } from '../../types/index.js';
import { ChunkingPipeline, type Chunk, type ChunkingStrategy } from './base-chunker.js';

/**
 * Late chunking pipeline with 256 token maximum
 *
 * Strategy:
 * - Embeds the FULL DEBATE first to capture global context
 * - Then chunks the debate into smaller pieces (aggressive splitting)
 * - Embeds each chunk individually
 * - Blends chunk embedding (70%) with debate embedding (30%)
 * - May split mid-speech for aggressive granularity
 * - Maximum 256 tokens per chunk
 */
export class LateChunkingPipeline256 extends ChunkingPipeline {
  readonly strategyName: ChunkingStrategy = 'late_chunking_256';
  readonly maxTokens = 256;

  private embeddings: OpenAIEmbeddings;
  private textSplitter: RecursiveCharacterTextSplitter;
  private tokenizer: ReturnType<typeof encoding_for_model>;

  // Blending weights for contextual embeddings
  private readonly CHUNK_WEIGHT = 0.7;
  private readonly DEBATE_WEIGHT = 0.3;

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
    // More aggressive splitting than 1024 variant
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: this.maxTokens,
      chunkOverlap: 20, // Smaller overlap for aggressive chunking
      separators: ['\n\n', '\n', '. ', '! ', '? ', '; ', ', ', ' ', ''],
      lengthFunction: (text: string) => this.countTokens(text),
    });
  }

  /**
   * Process a debate using late chunking strategy with aggressive splitting
   * @param debate - The parliamentary debate to process
   * @returns Array of chunks with contextually blended embeddings
   */
  async process(debate: Debate): Promise<Chunk[]> {
    // STEP 1: Embed the full debate to capture global context
    console.log(`[Late Chunking 256] Embedding full debate: ${debate.title}`);
    const fullDebateText = this.constructFullDebateText(debate);
    const debateEmbedding = await this.embeddings.embedQuery(fullDebateText);
    console.log(`[Late Chunking 256] Debate embedding complete (${debateEmbedding.length} dimensions)`);

    // STEP 2: Process contributions and create chunks
    const chunks: Chunk[] = [];
    let sequenceNumber = 0;

    // Process each contribution separately to preserve speaker boundaries
    for (const contribution of debate.contributions) {
      const contributionChunks = await this.splitContribution(contribution, debate);

      for (const chunkText of contributionChunks) {
        if (!chunkText.trim()) {
          continue;
        }

        const tokenCount = this.countTokens(chunkText);

        // Safety check for token limit
        if (tokenCount > this.maxTokens) {
          console.warn(`Warning: Chunk ${sequenceNumber} has ${tokenCount} tokens, truncating to ${this.maxTokens}`);
          const truncatedText = this.truncateToTokenLimit(chunkText, this.maxTokens);
          const truncatedTokenCount = this.countTokens(truncatedText);

          // STEP 3: Embed the chunk
          const chunkEmbedding = await this.embeddings.embedQuery(truncatedText);

          // STEP 4: Blend chunk embedding with debate embedding
          const blendedEmbedding = this.blendEmbeddings(chunkEmbedding, debateEmbedding);

          const chunk: Chunk = {
            id: this.generateChunkId(debate.id, sequenceNumber),
            text: truncatedText,
            embedding: blendedEmbedding,
            strategy: this.strategyName,
            tokenCount: truncatedTokenCount,
            sequenceNumber,
            createdAt: new Date(),
            debateContextEmbedding: debateEmbedding, // Store debate embedding for analysis
            ...this.createChunkMetadata(contribution, debate),
          };
          chunks.push(chunk);
          sequenceNumber++;
          continue;
        }

        // STEP 3: Embed the chunk
        const chunkEmbedding = await this.embeddings.embedQuery(chunkText);

        // STEP 4: Blend chunk embedding (70%) with debate embedding (30%)
        const blendedEmbedding = this.blendEmbeddings(chunkEmbedding, debateEmbedding);

        const chunk: Chunk = {
          id: this.generateChunkId(debate.id, sequenceNumber),
          text: chunkText,
          embedding: blendedEmbedding,
          strategy: this.strategyName,
          tokenCount,
          sequenceNumber,
          createdAt: new Date(),
          debateContextEmbedding: debateEmbedding, // Store for analysis
          ...this.createChunkMetadata(contribution, debate),
        };

        chunks.push(chunk);
        sequenceNumber++;
      }
    }

    console.log(`[Late Chunking 256] Created ${chunks.length} chunks with contextual blending`);

    // Link chunks in sequence
    const linkedChunks = this.linkChunks(chunks);

    // Validate speaker boundaries
    if (!this.validateSpeakerBoundaries(linkedChunks)) {
      throw new Error('Speaker boundary validation failed');
    }

    return linkedChunks;
  }

  /**
   * Construct full debate text from all contributions
   * @param debate - The debate to process
   * @returns Full debate text as a single string
   */
  private constructFullDebateText(debate: Debate): string {
    // Concatenate all contributions with speaker attribution
    // This preserves debate flow and speaker context
    const debateText = debate.contributions
      .map(contribution => {
        const speakerName = contribution.speaker.name || 'Unknown Speaker';
        const speakerParty = contribution.speaker.party || '';
        const attribution = speakerParty
          ? `${speakerName} (${speakerParty})`
          : speakerName;
        return `${attribution}: ${contribution.text}`;
      })
      .join('\n\n');

    return debateText;
  }

  /**
   * Blend chunk embedding with debate embedding using weighted combination
   * @param chunkEmbedding - The chunk-specific embedding (local semantics)
   * @param debateEmbedding - The debate-level embedding (global context)
   * @returns Blended embedding vector
   */
  private blendEmbeddings(chunkEmbedding: number[], debateEmbedding: number[]): number[] {
    if (chunkEmbedding.length !== debateEmbedding.length) {
      throw new Error(
        `Embedding dimension mismatch: chunk (${chunkEmbedding.length}) vs debate (${debateEmbedding.length})`
      );
    }

    // Blend: 70% chunk + 30% debate
    const blendedEmbedding = chunkEmbedding.map((chunkVal, index) => {
      const debateVal = debateEmbedding[index];
      return this.CHUNK_WEIGHT * chunkVal + this.DEBATE_WEIGHT * debateVal;
    });

    return blendedEmbedding;
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
