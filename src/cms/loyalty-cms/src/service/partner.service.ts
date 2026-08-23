import { cmsApiClient } from './config';

export interface Partner {
  id?: number;
  partnerCode: string;
  partnerName: string;
  apiKey?: string;
  secretKey?: string;
  status: number;
  createdAt?: string;
  updatedAt?: string;
}

class PartnerService {
  async getAll(): Promise<Partner[]> {
    try {
      const response: any = await cmsApiClient.get('/api/v1/partners');
      if (Array.isArray(response)) return response;
      if (response && Array.isArray(response.data)) return response.data;
      return [];
    } catch (e) {
      console.error('[PartnerService.getAll] Error:', e);
      return [];
    }
  }

  async create(data: Partner): Promise<Partner> {
    const response: any = await cmsApiClient.post('/api/v1/partners', data);
    return response?.data || response;
  }

  async update(id: number, data: Partner): Promise<Partner> {
    const response: any = await cmsApiClient.put(`/api/v1/partners/${id}`, data);
    return response?.data || response;
  }

  async delete(id: number): Promise<void> {
    await cmsApiClient.delete(`/api/v1/partners/${id}`);
  }
}

export const partnerService = new PartnerService();
