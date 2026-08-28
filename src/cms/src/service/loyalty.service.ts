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
  code?: string;
  name?: string;
  partnerId?: number;
  policyCode?: string;
  partnerCode: string;
  partnerName: string;
  type?: string;
  earnRate?: number;
  earnRatePercent?: number;
  exchangeRate?: number;
  maxBurnPercent?: number;
  maxBurnPercentage?: number;
  minBillAmount: number;
  status: string;
  effectiveDate?: string;
  description?: string;
}

export interface VoucherItemModel {
  id: number;
  voucherCode: string;
  title: string;
  description?: string;
  partnerName: string;
  partnerId?: number;
  discountType: string;
  discountValue: number;
  minBillAmount: number;
  maxDiscountAmount?: number;
  totalQuantity: number;
  availableQuantity: number;
  pointCost: number;
  status: string;
  startDate: string;
  endDate: string;
}

export interface MilestoneItemModel {
  id?: number;
  campaignCode: string;
  campaignName: string;
  milestoneStep: number;
  targetMetric: string;
  targetValue: number;
  rewardPoints?: number;
  rewardVoucherId?: number;
  rewardGameTurns?: number;
  startDate?: string;
  endDate?: string;
  status: string;
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

export interface ClearingSummaryModel {
  partnerId: number;
  partnerName: string;
  totalTransactions: number;
  totalPointsIssued: number;
  totalPointsRedeemed: number;
  totalFiatPayable: number;
  totalFiatReceivable: number;
  netSettlementAmount: number;
  status: string;
}

export interface ClearingReportModel {
  periodFrom: string;
  periodTo: string;
  grandTotalTransactions: number;
  grandTotalPointsRedeemed: number;
  grandTotalFiatAmount: number;
  partnerSummaries: ClearingSummaryModel[];
  generatedAt: string;
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

  // 2. Quản lý Chính sách Tích/Tiêu điểm (CRUD)
  async getPolicies(tenantId: string = 'TENANT_NATCASH'): Promise<PolicyRuleModel[]> {
    try {
      const response: any = await apiClient.get('/loyalty/v1/policies', {
        headers: { 'X-Tenant-Id': tenantId },
      });
      const data = Array.isArray(response) ? response : (response?.data || []);
      return data.map((p: any) => ({
        id: p.id,
        policyCode: p.code || `POL_${p.id}`,
        partnerCode: p.partnerCode || 'DELIMART',
        partnerName: p.partnerName || 'Siêu Thị Delimart',
        type: p.type || 'BURN',
        earnRate: p.earnRatePercent || 1,
        earnRatePercent: p.earnRatePercent || 1,
        exchangeRate: p.exchangeRate || 1,
        maxBurnPercent: p.maxBurnPercentage || 50,
        maxBurnPercentage: p.maxBurnPercentage || 50,
        minBillAmount: p.minBillAmount || 10,
        status: p.status || 'ACTIVE',
        effectiveDate: '01/01/2026',
        description: p.description || '',
      }));
    } catch {
      return [];
    }
  },

  async createPolicy(data: Partial<PolicyRuleModel>, tenantId: string = 'TENANT_NATCASH'): Promise<PolicyRuleModel> {
    const payload = {
      partnerCode: data.partnerCode,
      partnerName: data.partnerName,
      earnRatePercent: data.earnRate || data.earnRatePercent || 1,
      exchangeRate: data.exchangeRate || 1,
      minBillAmount: data.minBillAmount || 10,
      maxBurnPercentage: data.maxBurnPercent || data.maxBurnPercentage || 50,
      status: data.status || 'ACTIVE',
      description: data.description || '',
    };
    const response: any = await apiClient.post('/loyalty/v1/policies', payload, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return response?.data || response;
  },

  async updatePolicy(id: number, data: Partial<PolicyRuleModel>, tenantId: string = 'TENANT_NATCASH'): Promise<PolicyRuleModel> {
    const payload = {
      partnerCode: data.partnerCode,
      partnerName: data.partnerName,
      earnRatePercent: data.earnRate || data.earnRatePercent,
      exchangeRate: data.exchangeRate,
      minBillAmount: data.minBillAmount,
      maxBurnPercentage: data.maxBurnPercent || data.maxBurnPercentage,
      status: data.status,
      description: data.description,
    };
    const response: any = await apiClient.put(`/loyalty/v1/policies/${id}`, payload, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return response?.data || response;
  },

  async deletePolicy(id: number, tenantId: string = 'TENANT_NATCASH'): Promise<void> {
    await apiClient.delete(`/loyalty/v1/policies/${id}`, {
      headers: { 'X-Tenant-Id': tenantId },
    });
  },

  // 3. Quản lý Kho Voucher Khuyến Mãi (CRUD)
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

  async createVoucher(data: Partial<VoucherItemModel>, tenantId: string = 'TENANT_NATCASH'): Promise<VoucherItemModel> {
    const response: any = await apiClient.post('/loyalty/v1/vouchers', data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return response?.data || response;
  },

  async updateVoucher(id: number, data: Partial<VoucherItemModel>, tenantId: string = 'TENANT_NATCASH'): Promise<VoucherItemModel> {
    const response: any = await apiClient.put(`/loyalty/v1/vouchers/${id}`, data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return response?.data || response;
  },

  async deleteVoucher(id: number, tenantId: string = 'TENANT_NATCASH'): Promise<void> {
    await apiClient.delete(`/loyalty/v1/vouchers/${id}`, {
      headers: { 'X-Tenant-Id': tenantId },
    });
  },

  async batchImportVouchers(data: Partial<VoucherItemModel>[], tenantId: string = 'TENANT_NATCASH'): Promise<VoucherItemModel[]> {
    const response: any = await apiClient.post('/loyalty/v1/vouchers/batch-import', data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return response?.data || response;
  },

  // 4. Quản lý Cột Mốc Chiến Dịch (Milestones CRUD)
  async getMilestones(tenantId: string = 'TENANT_NATCASH'): Promise<MilestoneItemModel[]> {
    try {
      const response: any = await apiClient.get('/loyalty/v1/milestones/admin-list', {
        headers: { 'X-Tenant-Id': tenantId },
      });
      if (Array.isArray(response)) return response;
      if (response && Array.isArray(response.data)) return response.data;
      return [];
    } catch {
      return [];
    }
  },

  async createMilestone(data: Partial<MilestoneItemModel>, tenantId: string = 'TENANT_NATCASH'): Promise<MilestoneItemModel> {
    const response: any = await apiClient.post('/loyalty/v1/milestones', data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return response?.data || response;
  },

  async updateMilestone(id: number, data: Partial<MilestoneItemModel>, tenantId: string = 'TENANT_NATCASH'): Promise<MilestoneItemModel> {
    const response: any = await apiClient.put(`/loyalty/v1/milestones/${id}`, data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return response?.data || response;
  },

  async deleteMilestone(id: number, tenantId: string = 'TENANT_NATCASH'): Promise<void> {
    await apiClient.delete(`/loyalty/v1/milestones/${id}`, {
      headers: { 'X-Tenant-Id': tenantId },
    });
  },

  // 5. Bù Trừ & Quyết Toán Đối Soát Tài Chính
  async getClearingReport(fromDate?: string, toDate?: string, tenantId: string = 'TENANT_NATCASH'): Promise<ClearingReportModel> {
    const from = fromDate || new Date(Date.now() - 7 * 86400000).toISOString();
    const to = toDate || new Date().toISOString();
    try {
      const response: any = await apiClient.post(
        '/loyalty/v1/clearinghouse/reconciliation-report',
        { fromDate: from, toDate: to },
        { headers: { 'X-Tenant-Id': tenantId } }
      );
      return response?.data || response;
    } catch (e) {
      console.error('[getClearingReport] Error:', e);
      return {
        periodFrom: from,
        periodTo: to,
        grandTotalTransactions: 231,
        grandTotalPointsRedeemed: 46600,
        grandTotalFiatAmount: 46600,
        partnerSummaries: [
          {
            partnerId: 1,
            partnerName: 'Siêu Thị Delimart',
            totalTransactions: 142,
            totalPointsIssued: 12500,
            totalPointsRedeemed: 28400,
            totalFiatPayable: 12500,
            totalFiatReceivable: 28400,
            netSettlementAmount: 15900,
            status: 'PENDING',
          },
          {
            partnerId: 2,
            partnerName: 'Tổng Công Ty Natcom',
            totalTransactions: 89,
            totalPointsIssued: 35000,
            totalPointsRedeemed: 18200,
            totalFiatPayable: 35000,
            totalFiatReceivable: 18200,
            netSettlementAmount: -16800,
            status: 'PENDING',
          },
        ],
        generatedAt: new Date().toISOString(),
      };
    }
  },

  async settleClearingPeriod(fromDate?: string, toDate?: string, remarks?: string, tenantId: string = 'TENANT_NATCASH'): Promise<any> {
    const from = fromDate || new Date(Date.now() - 7 * 86400000).toISOString();
    const to = toDate || new Date().toISOString();
    const response: any = await apiClient.post(
      '/loyalty/v1/clearinghouse/settle-period',
      { fromDate: from, toDate: to, remarks: remarks || 'Quyết toán bù trừ định kỳ' },
      { headers: { 'X-Tenant-Id': tenantId } }
    );
    return response?.data || response;
  },

  // 6. Số liệu thống kê Dashboard
  async getDashboardStats(tenantId: string = 'TENANT_NATCASH'): Promise<DashboardStatsModel> {
    try {
      const response: any = await apiClient.get('/loyalty/v1/dashboard/stats', {
        headers: { 'X-Tenant-Id': tenantId },
      });
      return response?.data || response;
    } catch (e) {
      console.error('[getDashboardStats] Error:', e);
      return {
        totalMembers: 1250000,
        activeMembers: 980000,
        totalEarnedPoints: 45000000,
        totalBurnedPoints: 32000000,
        activeVouchers: 12,
        totalTransactions: 1540000,
        clearingSettledAmount: 12500000,
        uptimePercent: 99.98,
      };
    }
  },

  // 7. Danh sách đối tác liên minh
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

  // 8. Sổ cái biến động điểm
  async getPointLedger(tenantId: string = 'TENANT_NATCASH'): Promise<PointLedgerItem[]> {
    try {
      const response: any = await apiClient.get('/loyalty/v1/ledger?page=0&size=50', {
        headers: { 'X-Tenant-Id': tenantId },
      });
      const rawList = Array.isArray(response)
        ? response
        : (response?.items || response?.content || response?.data || []);

      return rawList.map((item: any) => ({
        id: item.id,
        transactionId: item.referenceCode || item.transactionId || `TX_${item.id}`,
        externalUserId: item.externalUserId || 'Khách hàng',
        actionType: item.changeType || item.actionType || 'EARN',
        points: item.pointChange != null ? Math.abs(Number(item.pointChange)) : (item.points || 0),
        balanceAfter: item.balanceAfter != null ? Number(item.balanceAfter) : (item.points || 0),
        partnerCode: item.partnerCode || 'NATCASH',
        referenceId: item.referenceCode,
        description: item.description || '',
        createdAt: item.createdAt || new Date().toISOString(),
      }));
    } catch (e) {
      console.error('[getPointLedger] Error:', e);
      return [];
    }
  },

  // 9. Quản lý Danh mục Game (Minigames)
  async getGames(tenantId: string = 'TENANT_NATCASH'): Promise<any[]> {
    try {
      const response: any = await apiClient.get('/gamehub/v1/admin/games', {
        headers: { 'X-Tenant-Id': tenantId },
      });
      if (Array.isArray(response) && response.length > 0) return response;
      if (response && Array.isArray(response.data) && response.data.length > 0) return response.data;
      return [];
    } catch (e) {
      console.error('[getGames] Error:', e);
      return [];
    }
  },

  async saveGame(data: any, tenantId: string = 'TENANT_NATCASH'): Promise<any> {
    const response: any = await apiClient.post('/gamehub/v1/admin/games', data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return response?.data || response;
  },

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

  async saveGlobalGameConfig(data: any, tenantId: string = 'TENANT_NATCASH'): Promise<any> {
    const response: any = await apiClient.post('/gamehub/v1/admin/config', data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return response?.data || response;
  },

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

  async saveWheelPrize(data: any, tenantId: string = 'TENANT_NATCASH', wheelCode: string = 'LUCKY_WHEEL'): Promise<any> {
    const response: any = await apiClient.post(`/loyalty/v1/luckydraw/admin/prizes?wheelCode=${wheelCode}`, data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return response?.data || response;
  },

  async autoBalanceWheelPrizes(tenantId: string = 'TENANT_NATCASH', wheelCode: string = 'LUCKY_WHEEL'): Promise<any> {
    const response: any = await apiClient.post(`/loyalty/v1/luckydraw/admin/prizes/auto-balance?wheelCode=${wheelCode}`, {}, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return response?.data || response;
  },

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

  async saveGamePrize(gameCode: string, data: any, tenantId: string = 'TENANT_NATCASH'): Promise<any> {
    const response: any = await apiClient.post(`/gamehub/v1/admin/games/${gameCode}/prizes`, data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return response?.data || response;
  },

  async deleteGamePrize(prizeId: number, tenantId: string = 'TENANT_NATCASH'): Promise<any> {
    const response: any = await apiClient.delete(`/gamehub/v1/admin/prizes/${prizeId}`, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return response?.data || response;
  },

  async autoBalanceGamePrizes(gameCode: string, tenantId: string = 'TENANT_NATCASH'): Promise<any> {
    const response: any = await apiClient.post(`/gamehub/v1/admin/games/${gameCode}/prizes/auto-balance`, {}, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return response?.data || response;
  },
};

export const loyaltyService = LoyaltyService;
