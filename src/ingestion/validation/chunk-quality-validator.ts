import type { Chunk } from '../chunkers/base-chunker.js';

/**
 * Results from chunk quality validation across strategies
 */
export interface ValidationResults {
  // Chunk overlap metrics
  chunkOverlap: ChunkOverlapMetrics;

  // Speaker diversity metrics
  speakerDiversity: SpeakerDiversityMetrics;

  // Temporal accuracy metrics
  temporalAccuracy: TemporalAccuracyMetrics;

  // Party balance metrics
  partyBalance: PartyBalanceMetrics;

  // Metadata integrity metrics
  metadataIntegrity: MetadataIntegrityMetrics;

  // Overall summary
  summary: ValidationSummary;
}

export interface ChunkOverlapMetrics {
  // Percentage of text content shared between strategies
  textOverlapPercentages: {
    semantic1024_vs_semantic256: number;
    semantic1024_vs_late1024: number;
    semantic1024_vs_late256: number;
    semantic256_vs_late1024: number;
    semantic256_vs_late256: number;
    late1024_vs_late256: number;
  };

  // Number of chunks with identical text
  identicalChunks: {
    [comparison: string]: number;
  };

  // Average similarity score between chunk sets
  averageSimilarity: {
    [comparison: string]: number;
  };
}

export interface SpeakerDiversityMetrics {
  // Per-strategy speaker statistics
  byStrategy: {
    [strategy: string]: {
      uniqueSpeakers: number;
      chunksPerSpeaker: { [speaker: string]: number };
      dominantSpeaker: { name: string; percentage: number };
    };
  };

  // Cross-strategy comparison
  speakerFavoritism: {
    [speaker: string]: {
      [strategy: string]: number; // chunk count per strategy
    };
  };
}

export interface TemporalAccuracyMetrics {
  // Per-strategy temporal validation
  byStrategy: {
    [strategy: string]: {
      chunksWithDates: number;
      chunksWithInvalidDates: number;
      dateConsistency: number; // percentage
    };
  };

  // Sequence validation
  sequenceIntegrity: {
    [strategy: string]: {
      totalSequenceBreaks: number;
      averageSequenceGap: number;
    };
  };
}

export interface PartyBalanceMetrics {
  // Per-strategy party representation
  byStrategy: {
    [strategy: string]: {
      partyDistribution: { [party: string]: number };
      governmentOppositionRatio: number;
      dominantParty: { name: string; percentage: number };
    };
  };

  // Cross-strategy bias detection
  systematicBias: {
    [party: string]: {
      overrepresentedIn: string[]; // strategies
      underrepresentedIn: string[];
    };
  };
}

export interface MetadataIntegrityMetrics {
  // Per-strategy metadata validation
  byStrategy: {
    [strategy: string]: {
      totalChunks: number;
      chunksWithMissingMetadata: number;
      metadataCompleteness: number; // percentage
      invalidHansardReferences: number;
    };
  };

  // Field-level validation
  fieldValidation: {
    speaker: { valid: number; invalid: number };
    hansardReference: { valid: number; invalid: number };
    debateInfo: { valid: number; invalid: number };
    embedding: { valid: number; invalid: number };
  };
}

export interface ValidationSummary {
  totalChunksAnalyzed: number;
  strategiesCompared: string[];
  overallDivergence: number; // 0-100 percentage
  significantDifferences: string[];
  recommendations: string[];
}

/**
 * Validator for analyzing chunk quality across different chunking strategies
 */
export class ChunkQualityValidator {
  /**
   * Validate chunks from all strategies
   */
  validate(chunksByStrategy: Map<string, Chunk[]>): ValidationResults {
    const strategies = Array.from(chunksByStrategy.keys());

    return {
      chunkOverlap: this.analyzeChunkOverlap(chunksByStrategy),
      speakerDiversity: this.analyzeSpeakerDiversity(chunksByStrategy),
      temporalAccuracy: this.analyzeTemporalAccuracy(chunksByStrategy),
      partyBalance: this.analyzePartyBalance(chunksByStrategy),
      metadataIntegrity: this.analyzeMetadataIntegrity(chunksByStrategy),
      summary: this.generateSummary(chunksByStrategy),
    };
  }

  /**
   * Analyze text overlap between different chunking strategies
   */
  private analyzeChunkOverlap(chunksByStrategy: Map<string, Chunk[]>): ChunkOverlapMetrics {
    const strategies = Array.from(chunksByStrategy.keys());
    const textOverlapPercentages: any = {};
    const identicalChunks: any = {};
    const averageSimilarity: any = {};

    // Compare each pair of strategies
    for (let i = 0; i < strategies.length; i++) {
      for (let j = i + 1; j < strategies.length; j++) {
        const strategy1 = strategies[i];
        const strategy2 = strategies[j];
        const comparisonKey = `${strategy1}_vs_${strategy2}`;

        const chunks1 = chunksByStrategy.get(strategy1)!;
        const chunks2 = chunksByStrategy.get(strategy2)!;

        // Calculate text overlap
        const overlap = this.calculateTextOverlap(chunks1, chunks2);
        textOverlapPercentages[comparisonKey] = overlap.percentage;
        identicalChunks[comparisonKey] = overlap.identicalCount;
        averageSimilarity[comparisonKey] = overlap.averageSimilarity;
      }
    }

    return {
      textOverlapPercentages,
      identicalChunks,
      averageSimilarity,
    };
  }

  /**
   * Calculate overlap between two chunk sets
   */
  private calculateTextOverlap(
    chunks1: Chunk[],
    chunks2: Chunk[]
  ): { percentage: number; identicalCount: number; averageSimilarity: number } {
    const texts1 = new Set(chunks1.map(c => c.text.trim().toLowerCase()));
    const texts2 = new Set(chunks2.map(c => c.text.trim().toLowerCase()));

    // Count identical chunks
    let identicalCount = 0;
    for (const text of texts1) {
      if (texts2.has(text)) {
        identicalCount++;
      }
    }

    // Calculate overlap percentage
    const totalUnique = new Set([...texts1, ...texts2]).size;
    const percentage = totalUnique > 0 ? (identicalCount / totalUnique) * 100 : 0;

    // Calculate average similarity (simple word overlap metric)
    let totalSimilarity = 0;
    let comparisonCount = 0;

    for (const chunk1 of chunks1) {
      for (const chunk2 of chunks2) {
        // Only compare chunks with similar sequence positions
        if (Math.abs(chunk1.sequenceNumber - chunk2.sequenceNumber) <= 2) {
          const similarity = this.calculateWordOverlapSimilarity(chunk1.text, chunk2.text);
          totalSimilarity += similarity;
          comparisonCount++;
        }
      }
    }

    const averageSimilarity = comparisonCount > 0 ? totalSimilarity / comparisonCount : 0;

    return { percentage, identicalCount, averageSimilarity };
  }

  /**
   * Calculate word overlap similarity between two texts
   */
  private calculateWordOverlapSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Analyze speaker diversity across strategies
   */
  private analyzeSpeakerDiversity(chunksByStrategy: Map<string, Chunk[]>): SpeakerDiversityMetrics {
    const byStrategy: any = {};
    const speakerFavoritism: any = {};

    for (const [strategy, chunks] of chunksByStrategy) {
      const chunksPerSpeaker: { [speaker: string]: number } = {};
      const uniqueSpeakers = new Set<string>();

      for (const chunk of chunks) {
        const speakerName = chunk.speaker.name || 'Unknown';
        uniqueSpeakers.add(speakerName);
        chunksPerSpeaker[speakerName] = (chunksPerSpeaker[speakerName] || 0) + 1;

        // Track cross-strategy favoritism
        if (!speakerFavoritism[speakerName]) {
          speakerFavoritism[speakerName] = {};
        }
        speakerFavoritism[speakerName][strategy] = chunksPerSpeaker[speakerName];
      }

      // Find dominant speaker
      const sortedSpeakers = Object.entries(chunksPerSpeaker).sort((a, b) => b[1] - a[1]);
      const [dominantSpeakerName, dominantCount] = sortedSpeakers[0] || ['None', 0];
      const dominantPercentage = chunks.length > 0 ? (dominantCount / chunks.length) * 100 : 0;

      byStrategy[strategy] = {
        uniqueSpeakers: uniqueSpeakers.size,
        chunksPerSpeaker,
        dominantSpeaker: {
          name: dominantSpeakerName,
          percentage: dominantPercentage,
        },
      };
    }

    return { byStrategy, speakerFavoritism };
  }

  /**
   * Analyze temporal accuracy (dates, sequences)
   */
  private analyzeTemporalAccuracy(chunksByStrategy: Map<string, Chunk[]>): TemporalAccuracyMetrics {
    const byStrategy: any = {};
    const sequenceIntegrity: any = {};

    for (const [strategy, chunks] of chunksByStrategy) {
      let chunksWithDates = 0;
      let chunksWithInvalidDates = 0;

      for (const chunk of chunks) {
        if (chunk.debateDate) {
          chunksWithDates++;
          if (isNaN(chunk.debateDate.getTime())) {
            chunksWithInvalidDates++;
          }
        }
      }

      const dateConsistency =
        chunksWithDates > 0 ? ((chunksWithDates - chunksWithInvalidDates) / chunksWithDates) * 100 : 0;

      // Check sequence integrity
      let totalSequenceBreaks = 0;
      let totalGap = 0;

      for (let i = 1; i < chunks.length; i++) {
        const gap = chunks[i].sequenceNumber - chunks[i - 1].sequenceNumber;
        if (gap !== 1) {
          totalSequenceBreaks++;
          totalGap += gap - 1;
        }
      }

      const averageSequenceGap = totalSequenceBreaks > 0 ? totalGap / totalSequenceBreaks : 0;

      byStrategy[strategy] = {
        chunksWithDates,
        chunksWithInvalidDates,
        dateConsistency,
      };

      sequenceIntegrity[strategy] = {
        totalSequenceBreaks,
        averageSequenceGap,
      };
    }

    return { byStrategy, sequenceIntegrity };
  }

  /**
   * Analyze party balance and potential bias
   */
  private analyzePartyBalance(chunksByStrategy: Map<string, Chunk[]>): PartyBalanceMetrics {
    const byStrategy: any = {};
    const systematicBias: any = {};

    // Government parties (approximate - would need proper mapping)
    const governmentParties = new Set(['Con', 'Conservative']);
    const oppositionParties = new Set(['Lab', 'Labour', 'LD', 'Liberal Democrat', 'SNP', 'Green', 'DUP']);

    for (const [strategy, chunks] of chunksByStrategy) {
      const partyDistribution: { [party: string]: number } = {};
      let governmentChunks = 0;
      let oppositionChunks = 0;

      for (const chunk of chunks) {
        const party = chunk.speaker.party || 'Unknown';
        partyDistribution[party] = (partyDistribution[party] || 0) + 1;

        if (governmentParties.has(party)) {
          governmentChunks++;
        } else if (oppositionParties.has(party)) {
          oppositionChunks++;
        }
      }

      const governmentOppositionRatio =
        oppositionChunks > 0 ? governmentChunks / oppositionChunks : governmentChunks;

      // Find dominant party
      const sortedParties = Object.entries(partyDistribution).sort((a, b) => b[1] - a[1]);
      const [dominantPartyName, dominantCount] = sortedParties[0] || ['None', 0];
      const dominantPercentage = chunks.length > 0 ? (dominantCount / chunks.length) * 100 : 0;

      byStrategy[strategy] = {
        partyDistribution,
        governmentOppositionRatio,
        dominantParty: {
          name: dominantPartyName,
          percentage: dominantPercentage,
        },
      };
    }

    // Detect systematic bias
    const allParties = new Set<string>();
    for (const [_, metrics] of Object.entries(byStrategy)) {
      Object.keys((metrics as any).partyDistribution).forEach(party => allParties.add(party));
    }

    for (const party of allParties) {
      const representations: { [strategy: string]: number } = {};
      for (const [strategy, metrics] of Object.entries(byStrategy)) {
        const count = (metrics as any).partyDistribution[party] || 0;
        const total = chunksByStrategy.get(strategy)!.length;
        representations[strategy] = total > 0 ? (count / total) * 100 : 0;
      }

      const avgRepresentation = Object.values(representations).reduce((a, b) => a + b, 0) / Object.keys(representations).length;
      const overrepresentedIn: string[] = [];
      const underrepresentedIn: string[] = [];

      for (const [strategy, percentage] of Object.entries(representations)) {
        if (percentage > avgRepresentation * 1.2) {
          overrepresentedIn.push(strategy);
        } else if (percentage < avgRepresentation * 0.8) {
          underrepresentedIn.push(strategy);
        }
      }

      systematicBias[party] = { overrepresentedIn, underrepresentedIn };
    }

    return { byStrategy, systematicBias };
  }

  /**
   * Analyze metadata integrity
   */
  private analyzeMetadataIntegrity(chunksByStrategy: Map<string, Chunk[]>): MetadataIntegrityMetrics {
    const byStrategy: any = {};
    const fieldValidation = {
      speaker: { valid: 0, invalid: 0 },
      hansardReference: { valid: 0, invalid: 0 },
      debateInfo: { valid: 0, invalid: 0 },
      embedding: { valid: 0, invalid: 0 },
    };

    for (const [strategy, chunks] of chunksByStrategy) {
      let chunksWithMissingMetadata = 0;
      let invalidHansardReferences = 0;

      for (const chunk of chunks) {
        let missingFields = 0;

        // Validate speaker
        if (!chunk.speaker || !chunk.speaker.name) {
          missingFields++;
          fieldValidation.speaker.invalid++;
        } else {
          fieldValidation.speaker.valid++;
        }

        // Validate Hansard reference
        if (!chunk.hansardReference || !chunk.hansardReference.reference) {
          missingFields++;
          invalidHansardReferences++;
          fieldValidation.hansardReference.invalid++;
        } else {
          fieldValidation.hansardReference.valid++;
        }

        // Validate debate info
        if (!chunk.debateId || !chunk.debateTitle || !chunk.debateDate) {
          missingFields++;
          fieldValidation.debateInfo.invalid++;
        } else {
          fieldValidation.debateInfo.valid++;
        }

        // Validate embedding
        if (!chunk.embedding || chunk.embedding.length === 0) {
          missingFields++;
          fieldValidation.embedding.invalid++;
        } else {
          fieldValidation.embedding.valid++;
        }

        if (missingFields > 0) {
          chunksWithMissingMetadata++;
        }
      }

      const metadataCompleteness =
        chunks.length > 0 ? ((chunks.length - chunksWithMissingMetadata) / chunks.length) * 100 : 0;

      byStrategy[strategy] = {
        totalChunks: chunks.length,
        chunksWithMissingMetadata,
        metadataCompleteness,
        invalidHansardReferences,
      };
    }

    return { byStrategy, fieldValidation };
  }

  /**
   * Generate overall validation summary
   */
  private generateSummary(chunksByStrategy: Map<string, Chunk[]>): ValidationSummary {
    const totalChunksAnalyzed = Array.from(chunksByStrategy.values()).reduce(
      (sum, chunks) => sum + chunks.length,
      0
    );
    const strategiesCompared = Array.from(chunksByStrategy.keys());

    // Calculate overall divergence (simplified metric)
    const chunkCounts = Array.from(chunksByStrategy.values()).map(chunks => chunks.length);
    const avgChunkCount = chunkCounts.reduce((a, b) => a + b, 0) / chunkCounts.length;
    const variance = chunkCounts.reduce((sum, count) => sum + Math.pow(count - avgChunkCount, 2), 0) / chunkCounts.length;
    const overallDivergence = Math.min(100, (variance / avgChunkCount) * 100);

    const significantDifferences: string[] = [];
    const recommendations: string[] = [];

    // Detect significant differences
    if (overallDivergence > 50) {
      significantDifferences.push('High variance in chunk counts between strategies');
      recommendations.push('Review chunking parameters to understand why strategies diverge significantly');
    }

    return {
      totalChunksAnalyzed,
      strategiesCompared,
      overallDivergence,
      significantDifferences,
      recommendations,
    };
  }
}
