import { cmsApiClient } from './config';

export interface Partner {
  id?: number;
  partnerCode: string;
  partnerName: string;
  partnerType?: string; // RETAIL, TELECOM, BANKING, F_AND_B, FUEL, UTILITIES, ENTERTAINMENT, HEALTHCARE, HOTEL, OTHER
  apiKey?: string;
  secretKey?: string;
  webhookUrl?: string;
  webhookSecret?: string;
  ipWhitelist?: string;
  status: number | string; // 1 | 0 or ACTIVE | INACTIVE
  createdAt?: string;
  updatedAt?: string;
}

class PartnerService {
  async getAll(tenantId: string = 'TENANT_NATCASH'): Promise<Partner[]> {
    try {
      const response: any = await cmsApiClient.get('/api/v1/partners', {
        headers: { 'X-Tenant-Id': tenantId },
      });
      if (Array.isArray(response)) return response;
      if (response && Array.isArray(response.data)) return response.data;
      return [];
    } catch (e) {
      console.error('[PartnerService.getAll] Error:', e);
      return [];
    }
  }

  async getById(id: number, tenantId: string = 'TENANT_NATCASH'): Promise<Partner | null> {
    try {
      const response: any = await cmsApiClient.get(`/api/v1/partners/${id}`, {
        headers: { 'X-Tenant-Id': tenantId },
      });
      return response?.data || response;
    } catch (e) {
      console.error('[PartnerService.getById] Error:', e);
      return null;
    }
  }

  async create(data: Partial<Partner>, tenantId: string = 'TENANT_NATCASH'): Promise<Partner> {
    const response: any = await cmsApiClient.post('/api/v1/partners', data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return response?.data || response;
  }

  async update(id: number, data: Partial<Partner>, tenantId: string = 'TENANT_NATCASH'): Promise<Partner> {
    const response: any = await cmsApiClient.put(`/api/v1/partners/${id}`, data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return response?.data || response;
  }

  async delete(id: number, tenantId: string = 'TENANT_NATCASH'): Promise<void> {
    await cmsApiClient.delete(`/api/v1/partners/${id}`, {
      headers: { 'X-Tenant-Id': tenantId },
    });
  }
}

export const partnerService = new PartnerService();
