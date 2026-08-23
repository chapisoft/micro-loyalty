import { cmsApiClient } from './config';

export interface Transaction {
  id?: number;
  transactionId: string;
  partnerCode: string;
  phoneNumber: string;
  amount?: number;
  currency?: string;
  status: number;
  challengeCode?: string;
  otpCode?: string;
  verifyDurationMs?: number;
  createdAt?: string;
  updatedAt?: string;
}

class TransactionService {
  async getAll(): Promise<Transaction[]> {
    try {
      const response: any = await cmsApiClient.get('/api/v1/transactions');
      if (Array.isArray(response)) return response;
      if (response && Array.isArray(response.data)) return response.data;
      return [];
    } catch (e) {
      console.error('[TransactionService.getAll] Error:', e);
      return [];
    }
  }
}

export const transactionService = new TransactionService();
