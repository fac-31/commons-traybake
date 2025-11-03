import { BaseClient } from './base-client.js';
import { Debate } from '../../types/index.js';
import { DebateParser } from '../parsers/debate-parser.js';
import { logger } from '../../utils/logger.js';

export class HansardClient extends BaseClient {
  private parser: DebateParser;

  constructor() {
    super({ baseURL: 'https://hansard-api.parliament.uk' });
    this.parser = new DebateParser();
  }

  async fetchDebatesByDate(date: Date, house: 'Commons' | 'Lords' = 'Commons'): Promise<Debate[]> {
    const dateStr = date.toISOString().split('T')[0];
    logger.info(`Fetching Hansard debates for ${dateStr} (${house})`);

    // Search for debates on the specified date
    const data = await this.safeGet<any>('/search/debates.json', {
      'queryParameters.house': house,
      'queryParameters.startDate': dateStr,
      'queryParameters.endDate': dateStr,
      'queryParameters.take': 100
    });

    if (!data?.Results || data.Results.length === 0) {
      logger.debug(`No debates for ${dateStr}`);
      return [];
    }

    // Fetch full debate details for each result
    const debates: Debate[] = [];
    for (const result of data.Results) {
      const debate = await this.fetchDebateById(result.DebateSectionExtId, date);
      if (debate) debates.push(debate);
    }

    return debates;
  }

  async fetchDebateById(debateSectionExtId: string, date: Date): Promise<Debate | null> {
    const data = await this.safeGet<any>(`/debates/debate/${debateSectionExtId}.json`);

    if (!data) return null;

    return this.parser.parseHansardDebateItem(data, date);
  }

  async searchDebates(searchTerm: string, startDate: Date, endDate: Date, house?: 'Commons' | 'Lords'): Promise<Debate[]> {
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    logger.info(`Searching debates: "${searchTerm}" from ${startStr} to ${endStr}`);

    const params: any = {
      'queryParameters.searchTerm': searchTerm,
      'queryParameters.startDate': startStr,
      'queryParameters.endDate': endStr,
      'queryParameters.take': 50
    };

    if (house) {
      params['queryParameters.house'] = house;
    }

    const data = await this.safeGet<any>('/search/debates.json', params);

    if (!data?.Results || data.Results.length === 0) {
      logger.debug(`No debates found for "${searchTerm}"`);
      return [];
    }

    logger.info(`Found ${data.TotalResultCount} total results, fetching first ${data.Results.length}`);

    // Fetch full debate details for each result
    const debates: Debate[] = [];
    for (const result of data.Results) {
      const debate = await this.fetchDebateById(result.DebateSectionExtId, new Date(result.SittingDate));
      if (debate) debates.push(debate);
    }

    return debates;
  }
}