import { Debate, DebateType } from '../../types/index.js';
import { ContributionParser } from './contribution-parser.js';
import { TypeInferrer } from '../transformers/type-inferrer';
import { HansardReferenceParser } from './hansard-reference-parser';
import { logger } from '../../utils/logger';

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

  parseHansardDebateItem(item: any, date: Date): Debate | null {
    try {
      const contributions = this.contributionParser.extractFromNode(item);
      const fullText = contributions
        .map((c) => `${c.speaker.name}: ${c.text}`)
        .join('\n\n');

      return {
        id: item.id || this.generateId(),
        title: item.title || item.heading || 'Untitled Debate',
        date,
        type: this.typeInferrer.inferDebateType(item.title || ''),
        parliamentarySession: item.session || '',
        fullText,
        contributions,
        hansardReference: this.hansardParser.buildReference(date, item),
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