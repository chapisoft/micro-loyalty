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
    const DEFAULT_GAMES = [
      { id: 1, gameCode: 'LUCKY_WHEEL', gameName: 'Vòng Quay Tri Ân', category: 'LUCKY_DRAW', pricePerTurn: 20, pricePerTurnHtg: 20, freeTurnsDaily: 2, dailyBudgetLimit: 50000, allowPointsSpin: true, gameUrl: '/wheel', status: 'ACTIVE' },
      { id: 2, gameCode: 'SCRATCH_CARD', gameName: 'Vé Cào May Mắn Siêu Tốc', category: 'LUCKY_DRAW', pricePerTurn: 10, pricePerTurnHtg: 10, freeTurnsDaily: 1, dailyBudgetLimit: 30000, allowPointsSpin: true, gameUrl: '/scratch', status: 'ACTIVE' },
      { id: 3, gameCode: 'PENALTY_SHOOTOUT', gameName: 'Sút Phạt Đền Cuồng Nhiệt 11m', category: 'SPORTS', pricePerTurn: 15, pricePerTurnHtg: 15, freeTurnsDaily: 1, dailyBudgetLimit: 25000, allowPointsSpin: true, gameUrl: '/penalty', status: 'ACTIVE' },
      { id: 4, gameCode: 'TREASURE_CHEST', gameName: 'Mở Rương Báu Vùng Biển Caribe', category: 'LUCKY_DRAW', pricePerTurn: 20, pricePerTurnHtg: 20, freeTurnsDaily: 1, dailyBudgetLimit: 40000, allowPointsSpin: true, gameUrl: '/chest', status: 'ACTIVE' },
      { id: 5, gameCode: 'TOWER_CLIMB', gameName: 'Tháp Kho Báu May Mắn', category: 'ADVENTURE', pricePerTurn: 25, pricePerTurnHtg: 25, freeTurnsDaily: 1, dailyBudgetLimit: 50000, allowPointsSpin: true, gameUrl: '/tower', status: 'ACTIVE' },
      { id: 6, gameCode: 'PLINKO_DROP', gameName: 'Thả Bi Ziczac Plinko Bàn Đinh', category: 'LUCKY_DRAW', pricePerTurn: 15, pricePerTurnHtg: 15, freeTurnsDaily: 1, dailyBudgetLimit: 35000, allowPointsSpin: true, gameUrl: '/plinko', status: 'ACTIVE' },
      { id: 7, gameCode: 'GOLDEN_EGG', gameName: 'Đập Trứng Vàng Thần Tài', category: 'LUCKY_DRAW', pricePerTurn: 10, pricePerTurnHtg: 10, freeTurnsDaily: 1, dailyBudgetLimit: 20000, allowPointsSpin: true, gameUrl: '/egg', status: 'ACTIVE' },
      { id: 8, gameCode: 'LUCKY_DICE', gameName: 'Lắc Cốc Xúc Xắc Tài Lộc', category: 'LUCKY_DRAW', pricePerTurn: 20, pricePerTurnHtg: 20, freeTurnsDaily: 1, dailyBudgetLimit: 30000, allowPointsSpin: true, gameUrl: '/dice', status: 'ACTIVE' },
      { id: 9, gameCode: 'TRIVIA_QUIZ', gameName: 'Đố Vui Nhanh Trí Nhận Điểm', category: 'QUIZ', pricePerTurn: 10, pricePerTurnHtg: 10, freeTurnsDaily: 2, dailyBudgetLimit: 15000, allowPointsSpin: true, gameUrl: '/quiz', status: 'ACTIVE' },
    ];

    try {
      const response: any = await apiClient.get('/gamehub/v1/admin/games', {
        headers: { 'X-Tenant-Id': tenantId },
      });
      if (Array.isArray(response) && response.length > 0) return response;
      if (response && Array.isArray(response.data) && response.data.length > 0) return response.data;
      return DEFAULT_GAMES;
    } catch (e) {
      console.error('[getGames] Error:', e);
      return DEFAULT_GAMES;
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

  // 15. Lấy danh sách giải thưởng ma trận động cho bất kỳ game nào
  async getGamePrizes(gameCode: string, tenantId: string = 'TENANT_NATCASH'): Promise<any[]> {
    try {
      const response: any = await apiClient.get(`/gamehub/v1/admin/games/${gameCode}/prizes`, {
        headers: { 'X-Tenant-Id': tenantId },
      });
      if (Array.isArray(response)) return response;
      if (response && Array.isArray(response.data)) return response.data;
      return [];
    } catch (e) {
      console.error('[getGamePrizes] Error:', e);
      return [];
    }
  },

  // 16. Lưu/Cập nhật giải thưởng cho Game
  async saveGamePrize(gameCode: string, data: any, tenantId: string = 'TENANT_NATCASH'): Promise<any> {
    const response: any = await apiClient.post(`/gamehub/v1/admin/games/${gameCode}/prizes`, data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return response?.data || response;
  },

  // 17. Xóa giải thưởng của Game
  async deleteGamePrize(prizeId: number, tenantId: string = 'TENANT_NATCASH'): Promise<any> {
    const response: any = await apiClient.delete(`/gamehub/v1/admin/prizes/${prizeId}`, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return response?.data || response;
  },

  // 18. Tự động cân bằng xác suất giải thưởng cho Game
  async autoBalanceGamePrizes(gameCode: string, tenantId: string = 'TENANT_NATCASH'): Promise<any> {
    const response: any = await apiClient.post(`/gamehub/v1/admin/games/${gameCode}/prizes/auto-balance`, {}, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return response?.data || response;
  },
};

export const loyaltyService = LoyaltyService;

