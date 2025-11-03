import { BaseClient } from './base-client.js';
import { Debate } from '../../types/index.js';

export class BillsClient extends BaseClient {
  constructor() {
    super({ baseURL: 'https://bills-api.parliament.uk' });
  }

  async fetchBillById(billId: string): Promise<any | null> {
    return this.safeGet<any>(`/api/v1/Bills/${billId}`);
  }

  async fetchBillStages(billId: string): Promise<any[]> {
    const data = await this.safeGet<any>(`/api/v1/Bills/${billId}/Stages`);
    return data || [];
  }
}