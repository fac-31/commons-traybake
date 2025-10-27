import { BaseClient } from './base-client';
import { Debate } from '../../types';
import { DebateParser } from '../parsers/debate-parser';

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