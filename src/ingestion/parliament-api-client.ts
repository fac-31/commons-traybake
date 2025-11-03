import { HansardClient } from './clients/hansard-client.js';
import { CommonsClient } from './clients/commons-client.js';
import { BillsClient } from './clients/bills-clients.js';
import { Debate, Contribution } from '../types/index.js';
import { logger } from '../utils/logger.js';

export interface DateRange {
  start: Date;
  end: Date;
}

export class ParliamentAPI {
  private hansard: HansardClient;
  private commons: CommonsClient;
  private bills: BillsClient;

  constructor() {
    this.hansard = new HansardClient();
    this.commons = new CommonsClient();
    this.bills = new BillsClient();
  }

  async fetchHansardDebatesByDate(date: Date): Promise<Debate[]> {
    return this.hansard.fetchDebatesByDate(date);
  }

  async fetchDebatesByTopic(topic: string, dateRange: DateRange): Promise<Debate[]> {
    logger.info(`Searching for debates about: "${topic}"`);

    // Use the new search API endpoint
    const debates = await this.hansard.searchDebates(topic, dateRange.start, dateRange.end);

    logger.info(`Total found: ${debates.length} debates`);
    return debates;
  }

  async fetchWrittenQuestions(topic: string, dateRange: DateRange): Promise<Contribution[]> {
    logger.info(`Searching for written questions about: "${topic}"`);

    // Search for debates, then filter for question/answer contributions
    const debates = await this.hansard.searchDebates(topic, dateRange.start, dateRange.end);

    const questions: Contribution[] = [];
    for (const debate of debates) {
      const questionContribs = debate.contributions.filter(
        c => c.type === 'question' || c.type === 'answer'
      );
      questions.push(...questionContribs);
    }

    logger.info(`Total found: ${questions.length} questions/answers`);
    return questions;
  }

  async fetchBillDebates(billId: string): Promise<Debate[]> {
    logger.info(`Fetching bill debates for: ${billId}`);

    const bill = await this.bills.fetchBillById(billId);
    if (!bill) return [];

    const stages = await this.bills.fetchBillStages(billId);

    // Process each stage...
    // Implementation depends on bills API structure

    return [];
  }
}

export default ParliamentAPI;