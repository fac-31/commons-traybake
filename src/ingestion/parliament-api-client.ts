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
    
    // Strategy: Use Hansard day-by-day, filter by topic
    const debates: Debate[] = [];
    const currentDate = new Date(dateRange.start);

    while (currentDate <= dateRange.end) {
      const dayDebates = await this.hansard.fetchDebatesByDate(currentDate);
      
      const relevant = dayDebates.filter(d =>
        this.matchesTopic(d, topic)
      );

      debates.push(...relevant);
      
      if (relevant.length > 0) {
        logger.info(`  ${currentDate.toISOString().split('T')[0]}: Found ${relevant.length}`);
      }

      currentDate.setDate(currentDate.getDate() + 1);
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    logger.info(`Total found: ${debates.length} debates`);
    return debates;
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

  private matchesTopic(debate: Debate, topic: string): boolean {
    const searchText = `${debate.title} ${debate.fullText}`.toLowerCase();
    return searchText.includes(topic.toLowerCase());
  }
}

export default ParliamentAPI;