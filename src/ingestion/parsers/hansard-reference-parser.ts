import { HansardReference } from '../../types/index.js';

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

  // Build reference from new Hansard API overview data
  buildHansardApiReference(overview: any): HansardReference {
    const date = new Date(overview.Date);
    const dateStr = this.formatDate(date);
    const house = overview.House === 'Commons' ? 'HC' : 'HL';
    const volume = overview.VolumeNo || '?';
    const column = overview.HansardSection || '?';

    return {
      reference: `${house} Deb ${dateStr} vol ${volume} c${column}`,
      volume: volume.toString(),
      columnNumber: column.toString(),
      url: `https://hansard.parliament.uk/${overview.Location?.toLowerCase() || 'commons'}/${date.toISOString().split('T')[0]}/debates/${overview.ExtId}`,
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

  private formatDate(date: Date): string {
    const day = date.getDate();
    const month = date.toLocaleString('en-GB', { month: 'short' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  }

  private buildURL(date: string, id?: string): string {
    const base = `https://hansard.parliament.uk/commons/${date}/debates`;
    return id ? `${base}/${id}` : base;
  }
}