import { Contribution } from '../../types';
import { SpeakerParser } from './speaker-parser';
import { TextCleaner } from '../transformers/text-cleaner';
import { ProceduralExtractor } from '../transformers/procedural-extractor';
import { TypeInferrer } from '../transformers/type-inferrer';

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