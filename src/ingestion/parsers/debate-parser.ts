import { Debate, DebateType } from '../../types/index.js';
import { ContributionParser } from './contribution-parser.js';
import { TypeInferrer } from '../transformers/type-inferrer.js';
import { HansardReferenceParser } from './hansard-reference-parser.js';
import { logger } from '../../utils/logger.js';

export class DebateParser {
  private contributionParser: ContributionParser;
  private typeInferrer: TypeInferrer;
  private hansardParser: HansardReferenceParser;

  constructor() {
    this.contributionParser = new ContributionParser();
    this.typeInferrer = new TypeInferrer();
    this.hansardParser = new HansardReferenceParser();
  }

  parseHansardDebates(data: any, date: Date): Debate[] {
    const debates: Debate[] = [];

    if (Array.isArray(data)) {
      for (const item of data) {
        const debate = this.parseHansardDebateItem(item, date);
        if (debate) debates.push(debate);
      }
    } else if (data.debateItem) {
      const debate = this.parseHansardDebateItem(data.debateItem, date);
      if (debate) debates.push(debate);
    }

    return debates;
  }

  parseHansardDebateItem(data: any, date: Date): Debate | null {
    try {
      // New Hansard API format
      if (data.Overview && data.Items) {
        const overview = data.Overview;
        const debateId = overview.ExtId || overview.Id?.toString() || this.generateId();
        const debateDate = new Date(overview.Date || date);

        const contributions = this.contributionParser.parseHansardApiItems(
          data.Items,
          debateId,
          debateDate
        );

        const fullText = contributions
          .map((c) => `${c.speaker.name}: ${c.text}`)
          .join('\n\n');

        return {
          id: debateId,
          title: overview.Title || 'Untitled Debate',
          date: debateDate,
          type: this.typeInferrer.inferDebateType(overview.Title || ''),
          parliamentarySession: overview.VolumeNo?.toString() || '',
          fullText,
          contributions,
          hansardReference: this.hansardParser.buildHansardApiReference(overview),
        };
      }

      // Legacy format fallback
      const contributions = this.contributionParser.extractFromNode(data);
      const fullText = contributions
        .map((c) => `${c.speaker.name}: ${c.text}`)
        .join('\n\n');

      return {
        id: data.id || this.generateId(),
        title: data.title || data.heading || 'Untitled Debate',
        date,
        type: this.typeInferrer.inferDebateType(data.title || ''),
        parliamentarySession: data.session || '',
        fullText,
        contributions,
        hansardReference: this.hansardParser.buildReference(date, data),
      };
    } catch (error) {
      logger.warn('Failed to parse debate:', error);
      return null;
    }
  }

  private generateId(): string {
    return `debate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}