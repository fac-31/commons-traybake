import { Speaker } from '../../types/index.js';
import { TypeInferrer } from '../transformers/type-inferrer.js';

export class SpeakerParser {
  private typeInferrer: TypeInferrer;

  constructor() {
    this.typeInferrer = new TypeInferrer();
  }

  parse(data: any): Speaker {
    return {
      name: data.name || data.displayName || 'Unknown Speaker',
      constituency: data.constituency,
      party: data.party || data.partyAbbreviation || 'Independent',
      role: this.typeInferrer.inferRole(data),
    };
  }

  // Parse the "AttributedTo" field from Hansard API
  // Format: "Name (Constituency) (Party)" or "The Secretary of State for Wales (Jo Stevens)"
  parseAttributedTo(attributedTo: string, memberId?: number): Speaker {
    if (!attributedTo) {
      return {
        name: 'Unknown Speaker',
        constituency: undefined,
        party: 'Unknown',
        role: undefined,
      };
    }

    // Regex to extract: Name (Constituency) (Party) or Role (Name)
    const roleMatch = attributedTo.match(/^The ([^(]+) \(([^)]+)\)$/);
    if (roleMatch) {
      // Format: "The Secretary of State for Wales (Jo Stevens)"
      return {
        name: roleMatch[2].trim(),
        constituency: undefined,
        party: 'Unknown',
        role: `The ${roleMatch[1].trim()}`,
      };
    }

    // Format: "Name (Constituency) (Party)"
    const fullMatch = attributedTo.match(/^([^(]+)\(([^)]+)\)\s*\(([^)]+)\)$/);
    if (fullMatch) {
      return {
        name: fullMatch[1].trim(),
        constituency: fullMatch[2].trim(),
        party: fullMatch[3].trim(),
        role: undefined,
      };
    }

    // Fallback: just use the whole string as name
    return {
      name: attributedTo.trim(),
      constituency: undefined,
      party: 'Unknown',
      role: undefined,
    };
  }
}