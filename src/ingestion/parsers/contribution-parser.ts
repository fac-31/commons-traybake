import { Contribution } from '../../types/index.js';
import { SpeakerParser } from './speaker-parser.js';
import { TextCleaner } from '../transformers/text-cleaner.js';
import { ProceduralExtractor } from '../transformers/procedural-extractor.js';
import { TypeInferrer } from '../transformers/type-inferrer.js';

export class ContributionParser {
  private speakerParser: SpeakerParser;
  private textCleaner: TextCleaner;
  private proceduralExtractor: ProceduralExtractor;
  private typeInferrer: TypeInferrer;

  constructor() {
    this.speakerParser = new SpeakerParser();
    this.textCleaner = new TextCleaner();
    this.proceduralExtractor = new ProceduralExtractor();
    this.typeInferrer = new TypeInferrer();
  }

  extractFromNode(node: any): Contribution[] {
    const contributions: Contribution[] = [];

    const extract = (n: any, depth: number = 0) => {
      if (!n) return;

      if (n.member && n.content) {
        contributions.push(this.parseContribution(n));
      }

      if (n.children) {
        n.children.forEach((child: any) => extract(child, depth + 1));
      }

      if (n.contributions) {
        n.contributions.forEach((contrib: any) => extract(contrib, depth + 1));
      }
    };

    extract(node);
    return contributions;
  }

  // Parse new Hansard API format (Items array from /debates/debate endpoint)
  parseHansardApiItems(items: any[], debateId: string, date: Date): Contribution[] {
    if (!Array.isArray(items)) return [];

    return items
      .filter(item => item.ItemType === 'Contribution')
      .map(item => this.parseHansardApiContribution(item, debateId, date));
  }

  parseHansardApiContribution(item: any, debateId: string, date: Date): Contribution {
    const rawText = item.Value || '';
    const cleanedText = this.textCleaner.clean(rawText);

    return {
      id: item.ExternalId || item.ItemId?.toString() || this.generateId(),
      debateId,
      speaker: this.speakerParser.parseAttributedTo(item.AttributedTo, item.MemberId),
      text: cleanedText,
      type: this.typeInferrer.inferFromHansardTag(item.HRSTag),
      proceduralContext: this.proceduralExtractor.extract(rawText),
      timestamp: item.Timecode ? new Date(item.Timecode) : date,
      columnNumber: item.HansardSection || '',
      previousSpeakerId: undefined,
      addressingId: undefined,
      questionNumber: item.UIN || undefined,
    };
  }

  parseContribution(data: any): Contribution {
    const rawText = data.content || data.text || '';

    return {
      id: data.id || this.generateId(),
      debateId: data.debateId || '',
      speaker: this.speakerParser.parse(data.member || data.speaker),
      text: this.textCleaner.clean(rawText),
      type: this.typeInferrer.inferContributionType(data),
      proceduralContext: this.proceduralExtractor.extract(rawText),
      timestamp: new Date(data.date || Date.now()),
      columnNumber: data.column || '',
      previousSpeakerId: data.previousSpeaker,
      addressingId: data.addressing,
      questionNumber: data.questionNumber,
    };
  }

  private generateId(): string {
    return `contrib_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}