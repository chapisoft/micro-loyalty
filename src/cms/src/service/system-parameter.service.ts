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

const DEFAULT_LOYALTY_PARAMS: SystemParameter[] = [
  {
    id: 1,
    paramKey: 'LOYALTY_POINT_EXCHANGE_RATE_HTG',
    paramValue: '1.0',
    description: 'Tỷ giá quy đổi điểm thưởng sang tiền tệ thanh toán (1 Điểm = 1 HTG)',
    status: 1,
  },
  {
    id: 2,
    paramKey: 'REWARD_WALLET_DYNAMIC_QR_TTL_SECONDS',
    paramValue: '60',
    description: 'Thời gian sống (TTL) của mã QR động thanh toán Ví Phần Thưởng tại POS',
    status: 1,
  },
  {
    id: 3,
    paramKey: 'REDISSON_LOCK_BURN_TIMEOUT_MS',
    paramValue: '3000',
    description: 'Thời gian chờ khóa phân tán Redisson RLock chống tiêu điểm kép',
    status: 1,
  },
  {
    id: 4,
    paramKey: 'HMAC_DRIFT_TOLERANCE_SECONDS',
    paramValue: '300',
    description: 'Dung sai lệch thời gian chữ ký số bảo mật HMAC-SHA256 (±300 giây)',
    status: 1,
  },
  {
    id: 5,
    paramKey: 'TIER_EVALUATION_CYCLE_MONTHS',
    paramValue: '12',
    description: 'Chu kỳ tự động đánh giá thăng hạng và hạ hạng hội viên (12 tháng)',
    status: 1,
  },
  {
    id: 6,
    paramKey: 'GAME_LUCKY_DRAW_FREE_DAILY_TURNS',
    paramValue: '2',
    description: 'Số lượt quay thưởng GameHub miễn phí mỗi ngày cho hội viên',
    status: 1,
  },
];

class SystemParameterService {
  async getAllParameters(): Promise<SystemParameter[]> {
    try {
      const response: any = await cmsApiClient.get('/api/v1/system-parameters');
      if (Array.isArray(response) && response.length > 0) return response;
      if (response && Array.isArray(response.data) && response.data.length > 0) return response.data;
      return DEFAULT_LOYALTY_PARAMS;
    } catch {
      return DEFAULT_LOYALTY_PARAMS;
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
