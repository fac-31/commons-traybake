import { Speaker } from '../../types/index.js';
import { TypeInferrer } from '../transformers/type-inferrer.js';

export class SpeakerParser {
  private typeInferrer: TypeInferrer;

  constructor() {
    this.typeInferrer = new TypeInferrer();
  }

  parse(data: any): Speaker {
    const party = data.party || data.partyAbbreviation || data.partyName || 'Unknown';

    return {
      name: data.name || data.displayName || 'Unknown Speaker',
      constituency: data.constituency,
      party: this.normalizeParty(party),
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
        role: 'Unknown',
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
        party: this.normalizeParty(fullMatch[3].trim()),
        role: 'Backbencher',
      };
    }

    // Try format: "Name (Party)"
    const simpleMatch = attributedTo.match(/^([^(]+)\(([^)]+)\)$/);
    if (simpleMatch) {
      const name = simpleMatch[1].trim();
      const secondPart = simpleMatch[2].trim();

      // Check if second part looks like a party (short abbreviation or party name)
      if (this.looksLikeParty(secondPart)) {
        return {
          name,
          constituency: undefined,
          party: this.normalizeParty(secondPart),
          role: 'Backbencher',
        };
      }

      // Otherwise it's probably a constituency
      return {
        name,
        constituency: secondPart,
        party: 'Unknown',
        role: 'Backbencher',
      };
    }

    // Fallback: just use the whole string as name
    return {
      name: attributedTo.trim(),
      constituency: undefined,
      party: 'Unknown',
      role: 'Backbencher',
    };
  }

  /**
   * Check if a string looks like a party name or abbreviation
   */
  private looksLikeParty(text: string): boolean {
    const knownParties = ['con', 'lab', 'ld', 'snp', 'dup', 'sf', 'pc', 'green', 'ukip', 'brexit', 'alba', 'sdlp', 'uup', 'alliance'];
    const lower = text.toLowerCase();

    // Check if it's a known abbreviation (typically 2-5 chars)
    if (text.length <= 5 && knownParties.some(p => lower.includes(p))) {
      return true;
    }

    // Check if it contains party-like words
    return lower.includes('party') || lower.includes('conservative') ||
           lower.includes('labour') || lower.includes('democrat') ||
           lower.includes('nationalist') || lower.includes('unionist');
  }

  /**
   * Normalize party names to standard abbreviations
   */
  private normalizeParty(party: string): string {
    const lower = party.toLowerCase().trim();

    // Map common variations to standard abbreviations
    if (lower.includes('conserv')) return 'Con';
    if (lower.includes('labour') || lower === 'lab') return 'Lab';
    if (lower.includes('liberal') || lower === 'ld') return 'LD';
    if (lower.includes('scottish national') || lower === 'snp') return 'SNP';
    if (lower.includes('democratic unionist') || lower === 'dup') return 'DUP';
    if (lower.includes('sinn') || lower === 'sf') return 'SF';
    if (lower.includes('plaid') || lower === 'pc') return 'PC';
    if (lower.includes('green')) return 'Green';
    if (lower.includes('ukip')) return 'UKIP';
    if (lower.includes('brexit')) return 'Brexit';
    if (lower.includes('alba')) return 'Alba';
    if (lower.includes('sdlp')) return 'SDLP';
    if (lower.includes('ulster unionist') || lower === 'uup') return 'UUP';
    if (lower.includes('alliance')) return 'Alliance';
    if (lower === 'independent' || lower === 'ind') return 'Independent';

    // If we can't recognize it, return as-is but capitalized
    return party.trim() || 'Unknown';
  }
}
