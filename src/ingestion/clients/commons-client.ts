import { BaseClient } from './base-client.js';
import { Debate } from '../../types/index.js';
import { DebateParser } from '../parsers/debate-parser.js';

export class CommonsClient extends BaseClient {
  private parser: DebateParser;

  constructor() {
    super({ baseURL: 'https://commonsvotes-api.parliament.uk/data' });
    this.parser = new DebateParser();
  }

  async searchDivisions(query: string, skip: number = 0, take: number = 50): Promise<any[]> {
    const data = await this.safeGet<any>('/CommonsDivisions/search', {
      queryParameters: query,
      skip,
      take,
    });

    return data || [];
  }
}