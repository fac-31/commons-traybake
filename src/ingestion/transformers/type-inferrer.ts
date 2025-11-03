import { DebateType, ContributionType } from '../../types/index.js';

export class TypeInferrer {
  inferDebateType(title: string): DebateType {
    const lower = title.toLowerCase();

    if (lower.includes('prime minister') || lower.includes('pmq')) {
      return 'PMQs';
    }
    if (lower.includes('committee') || lower.includes('select committee')) {
      return 'Committee';
    }
    if (lower.includes('written question')) {
      return 'Written Questions';
    }

    return 'General Debate';
  }

  inferContributionType(contrib: any): ContributionType {
    if (contrib.isQuestion || contrib.type === 'question') return 'question';
    if (contrib.isAnswer || contrib.type === 'answer') return 'answer';

    const textLength = contrib.text?.length || contrib.content?.length || 0;
    if (contrib.isIntervention || textLength < 200) {
      return 'intervention';
    }

    return 'speech';
  }

  // Infer contribution type from Hansard API HRSTag
  inferFromHansardTag(hrsTag: string | undefined): ContributionType {
    if (!hrsTag) return 'speech';

    const tag = hrsTag.toLowerCase();

    if (tag.includes('question')) return 'question';
    if (tag.includes('answer')) return 'answer';
    if (tag.includes('intervention')) return 'intervention';

    return 'speech';
  }

  inferRole(speaker: any): string {
    if (speaker.ministerialRole || speaker.governmentPosts) {
      return 'Minister';
    }
    if (speaker.oppositionPosts || speaker.shadowPost) {
      return 'Shadow Minister';
    }
    return 'Backbencher';
  }
}
