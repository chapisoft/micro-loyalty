import { apiClient } from './config';

export interface TierConfigModel {
  id: number;
  code: string;
  name: string;
  tierLevel: number;
  minPoints?: number;
  requiredPoints?: number;
  maintainPoints?: number;
  pointMultiplier: number;
  freeDailyTurns: number;
  status: string;
  description: string;
}

export interface PolicyRuleModel {
  id: number;
  policyCode: string;
  partnerCode: string;
  partnerName: string;
  earnRate: number;
  maxBurnPercent: number;
  minBillAmount: number;
  status: string;
  effectiveDate: string;
}

export interface VoucherItemModel {
  id: number;
  voucherCode: string;
  title: string;
  partnerName: string;
  discountType: string;
  discountValue: number;
  minBillAmount: number;
  totalQuantity: number;
  availableQuantity: number;
  pointCost: number;
  status: string;
  startDate: string;
  endDate: string;
}

export interface DashboardStatsModel {
  totalMembers: number;
  activeMembers: number;
  totalEarnedPoints: number;
  totalBurnedPoints: number;
  activeVouchers: number;
  totalTransactions: number;
  clearingSettledAmount: number;
  uptimePercent: number;
}

export interface PointLedgerItem {
  id?: number;
  transactionId: string;
  externalUserId: string;
  actionType: string;
  points: number;
  balanceBefore?: number;
  balanceAfter?: number;
  partnerCode: string;
  referenceId?: string;
  description?: string;
  createdAt: string;
}

export const LoyaltyService = {
  // 1. Quản lý Hạng hội viên
  async getTiers(tenantId: string = 'TENANT_NATCASH'): Promise<TierConfigModel[]> {
    try {
      const response: any = await apiClient.get('/loyalty/v1/tiers', {
        headers: { 'X-Tenant-Id': tenantId },
      });
      if (Array.isArray(response)) return response;
      if (response && Array.isArray(response.data)) return response.data;
      return [];
    } catch {
      return [];
    }
  },

  // 2. Quản lý Chính sách Tích/Tiêu điểm
  async getPolicies(tenantId: string = 'TENANT_NATCASH'): Promise<PolicyRuleModel[]> {
    try {
      const response: any = await apiClient.get('/loyalty/v1/policies', {
        headers: { 'X-Tenant-Id': tenantId },
      });
      if (Array.isArray(response)) return response;
      if (response && Array.isArray(response.data)) return response.data;
      return [];
    } catch {
      return [];
    }
  },

  // 3. Quản lý Kho Voucher Khuyến Mãi
  async getVouchers(tenantId: string = 'TENANT_NATCASH'): Promise<VoucherItemModel[]> {
    try {
      const response: any = await apiClient.get('/loyalty/v1/vouchers', {
        headers: { 'X-Tenant-Id': tenantId },
      });
      if (Array.isArray(response)) return response;
      if (response && Array.isArray(response.data)) return response.data;
      return [];
    } catch {
      return [];
    }
  },

  // 4. Tạo Voucher mới
  async createVoucher(data: Partial<VoucherItemModel>, tenantId: string = 'TENANT_NATCASH'): Promise<VoucherItemModel> {
    const response: any = await apiClient.post('/loyalty/v1/vouchers', data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return response?.data || response;
  },

  // 5. Số liệu thống kê Dashboard
  async getDashboardStats(tenantId: string = 'TENANT_NATCASH'): Promise<DashboardStatsModel> {
    try {
      const response: any = await apiClient.get('/loyalty/v1/dashboard/stats', {
        headers: { 'X-Tenant-Id': tenantId },
      });
      return response?.data || response;
    } catch (e) {
      console.error('[getDashboardStats] Error:', e);
      return {
        totalMembers: 0,
        activeMembers: 0,
        totalEarnedPoints: 0,
        totalBurnedPoints: 0,
        activeVouchers: 0,
        totalTransactions: 0,
        clearingSettledAmount: 0,
        uptimePercent: 100.0,
      };
    }
  },

  // 6. Danh sách đối tác liên minh
  async getPartners(tenantId: string = 'TENANT_NATCASH'): Promise<any[]> {
    try {
      const response: any = await apiClient.get('/loyalty/v1/partners', {
        headers: { 'X-Tenant-Id': tenantId },
      });
      if (Array.isArray(response)) return response;
      if (response && Array.isArray(response.data)) return response.data;
      return [];
    } catch {
      return [];
    }
  },

  // 7. Sổ cái biến động điểm
  async getPointLedger(tenantId: string = 'TENANT_NATCASH'): Promise<PointLedgerItem[]> {
    try {
      const response: any = await apiClient.get('/loyalty/v1/ledger?page=0&size=50', {
        headers: { 'X-Tenant-Id': tenantId },
      });
      if (response && response.content && Array.isArray(response.content)) {
        return response.content;
      }
      if (Array.isArray(response)) return response;
      if (response && Array.isArray(response.data)) return response.data;
      return [];
    } catch (e) {
      console.error('[getPointLedger] Error:', e);
      return [];
    }
  },

  // 8. Quản lý Danh mục Game (Minigames)
  async getGames(tenantId: string = 'TENANT_NATCASH'): Promise<any[]> {
    try {
      const response: any = await apiClient.get('/gamehub/v1/admin/games', {
        headers: { 'X-Tenant-Id': tenantId },
      });
      if (Array.isArray(response)) return response;
      if (response && Array.isArray(response.data)) return response.data;
      return [];
    } catch (e) {
      console.error('[getGames] Error:', e);
      return [];
    }
  },

  // 9. Lưu/Sửa thông tin Game & Tham số chi tiết
  async saveGame(data: any, tenantId: string = 'TENANT_NATCASH'): Promise<any> {
    const response: any = await apiClient.post('/gamehub/v1/admin/games', data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return response?.data || response;
  },

  // 10. Cấu hình Chung Cổng Game
  async getGlobalGameConfig(tenantId: string = 'TENANT_NATCASH'): Promise<any> {
    try {
      const response: any = await apiClient.get('/gamehub/v1/admin/config', {
        headers: { 'X-Tenant-Id': tenantId },
      });
      return response?.data || response;
    } catch (e) {
      console.error('[getGlobalGameConfig] Error:', e);
      return {
        pointsPerTurnExchange: 50,
        goldenHourEnabled: true,
        maintenanceMode: false,
        maxDailyTurnsPerUser: 10,
        welcomeBannerText: 'Tham gia minigame mỗi ngày nhận quà siêu khủng từ Natcash!',
      };
    }
  },

  // 11. Lưu Cấu hình Chung Cổng Game
  async saveGlobalGameConfig(data: any, tenantId: string = 'TENANT_NATCASH'): Promise<any> {
    const response: any = await apiClient.post('/gamehub/v1/admin/config', data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return response?.data || response;
  },

  // 12. Danh sách Ma trận Ô Thưởng Vòng Quay May Mắn
  async getWheelPrizes(tenantId: string = 'TENANT_NATCASH', wheelCode: string = 'LUCKY_WHEEL'): Promise<any[]> {
    try {
      const response: any = await apiClient.get(`/loyalty/v1/luckydraw/admin/prizes?wheelCode=${wheelCode}`, {
        headers: { 'X-Tenant-Id': tenantId },
      });
      if (Array.isArray(response)) return response;
      if (response && Array.isArray(response.data)) return response.data;
      return [];
    } catch (e) {
      console.error('[getWheelPrizes] Error:', e);
      return [];
    }
  },

  // 13. Lưu Ô Thưởng Vòng Quay
  async saveWheelPrize(data: any, tenantId: string = 'TENANT_NATCASH', wheelCode: string = 'LUCKY_WHEEL'): Promise<any> {
    const response: any = await apiClient.post(`/loyalty/v1/luckydraw/admin/prizes?wheelCode=${wheelCode}`, data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return response?.data || response;
  },

  // 14. Tự động cân bằng xác suất 100%
  async autoBalanceWheelPrizes(tenantId: string = 'TENANT_NATCASH', wheelCode: string = 'LUCKY_WHEEL'): Promise<any> {
    const response: any = await apiClient.post(`/loyalty/v1/luckydraw/admin/prizes/auto-balance?wheelCode=${wheelCode}`, {}, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return response?.data || response;
  },
};

export const loyaltyService = LoyaltyService;

