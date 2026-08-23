import { cmsApiClient } from './config';

export interface SystemParameter {
  id?: number;
  paramKey: string;
  paramValue: string;
  description?: string;
  status?: number;
  createdAt?: string;
  updatedAt?: string;
}

class SystemParameterService {
  async getAllParameters(): Promise<SystemParameter[]> {
    try {
      const response: any = await cmsApiClient.get('/api/v1/system-parameters');
      if (Array.isArray(response)) return response;
      if (response && Array.isArray(response.data)) return response.data;
      return [];
    } catch (e) {
      console.error('[SystemParameterService.getAllParameters] Error:', e);
      return [];
    }
  }

  async getParameter(paramKey: string): Promise<SystemParameter> {
    const response: any = await cmsApiClient.get(`/api/v1/system-parameters/${paramKey}`);
    return response?.data || response;
  }

  async createParameter(data: SystemParameter): Promise<SystemParameter> {
    const response: any = await cmsApiClient.post('/api/v1/system-parameters', data);
    return response?.data || response;
  }

  async updateParameter(paramKey: string, data: SystemParameter): Promise<SystemParameter> {
    const response: any = await cmsApiClient.put(`/api/v1/system-parameters/${paramKey}`, data);
    return response?.data || response;
  }

  async deleteParameter(paramKey: string): Promise<void> {
    await cmsApiClient.delete(`/api/v1/system-parameters/${paramKey}`);
  }
}

export const systemParameterService = new SystemParameterService();
