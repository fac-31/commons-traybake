import { Speaker } from '../../types';
import { TypeInferrer } from '../transformers/type-inferrer';

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
}