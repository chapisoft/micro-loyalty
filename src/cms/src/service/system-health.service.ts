import { cmsApiClient } from '@/service/config';

export interface ServiceHealthItem {
  serviceId: string;
  serviceName: string;
  displayName: string;
  port: number;
  status: 'UP' | 'DOWN';
  icon: string;
  color: string;
  responseTimeMs: number;
  lastChecked: string;
  error?: string;
}

export interface SystemHealthResponse {
  succeeded: boolean;
  status: 'UP' | 'DEGRADED';
  services: ServiceHealthItem[];
  totalServices: number;
  upCount: number;
  checkedAt: string;
  totalCheckTimeMs: number;
}

export const systemHealthService = {
  getSystemHealth: async (): Promise<SystemHealthResponse> => {
    const res: any = await cmsApiClient.get('/api/v1/system-status');
    return res?.data || res;
  },
};
