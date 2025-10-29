import { BaseClient } from './base-client';
import { Debate } from '../../types';
import { DebateParser } from '../parsers/debate-parser';
import { logger } from '../../utils/logger';

export class HansardClient extends BaseClient {
  private parser: DebateParser;

  constructor() {
    super({ baseURL: 'https://hansard.parliament.uk' });
    this.parser = new DebateParser();
  }

  async fetchDebatesByDate(date: Date): Promise<Debate[]> {
    const dateStr = date.toISOString().split('T')[0];
    logger.info(`Fetching Hansard debates for ${dateStr}`);

    const data = await this.safeGet<any>(`/commons/${dateStr}/debates.json`);
    
    if (!data?.debates) {
      logger.debug(`No debates for ${dateStr}`);
      return [];
    }

    return this.parser.parseHansardDebates(data.debates, date);
  }

  async fetchDebateById(date: string, debateId: string): Promise<Debate | null> {
    const data = await this.safeGet<any>(`/commons/${date}/debates/${debateId}.json`);
    
    if (!data) return null;

    return this.parser.parseHansardDebateItem(data, new Date(date));
  }
}