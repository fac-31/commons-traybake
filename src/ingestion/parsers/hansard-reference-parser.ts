import { HansardReference } from '../../types';

export class HansardReferenceParser {
  buildReference(date: Date, item: any): HansardReference {
    const dateStr = date.toISOString().split('T')[0];
    
    return {
      reference: `HC Deb ${dateStr} vol ${item.volume || '?'} c${item.column || '?'}`,
      volume: item.volume || '',
      columnNumber: item.column || '',
      url: this.buildURL(dateStr, item.id),
    };
  }

  parse(ref: string): { date: Date; volume: string; columnNumber: string } {
    const match = ref.match(/HC Deb (\d+-\d+-\d+) vol (\d+) c(\d+)/);
    
    if (!match) {
      throw new Error(`Invalid Hansard reference: ${ref}`);
    }

    return {
      date: new Date(match[1]),
      volume: match[2],
      columnNumber: match[3],
    };
  }

  private buildURL(date: string, id?: string): string {
    const base = `https://hansard.parliament.uk/commons/${date}/debates`;
    return id ? `${base}/${id}` : base;
  }
}