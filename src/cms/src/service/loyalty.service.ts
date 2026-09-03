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
  partnerName?: string;
  partnerId?: number;
  partnerCode?: string;
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

export interface TierDistributionModel {
  tierId: number;
  tierCode: string;
  tierName: string;
  tierLevel: number;
  pointMultiplier: number;
  memberCount: number;
  percentage: number;
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
  tierDistributions?: TierDistributionModel[];
}

export interface SystemComponentHealthModel {
  componentId: string;
  displayName: string;
  status: 'UP' | 'DOWN';
  port: number;
  responseTimeMs: number;
  icon: string;
  color: string;
  details?: string;
}

export interface SystemHealthResponseModel {
  overallStatus: string;
  timestamp: string;
  components: SystemComponentHealthModel[];
}

export interface PointLedgerItem {
  id?: number;
  transactionId: string;
  externalUserId: string;
  actionType: string;
  points: number;
  balanceBefore?: number;
  balanceAfter?: number;
  partnerId?: number;
  partnerCode: string;
  partnerName?: string;
  partnerType?: string;
  referenceId?: string;
  description?: string;
  status?: string;
  createdAt: string;
}

export interface PointLedgerQueryParams {
  page?: number;
  size?: number;
  actionType?: string;
  partnerCode?: string;
  partnerId?: number;
  keyword?: string;
}

export interface PointLedgerResponse {
  items: PointLedgerItem[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface ClearingSummaryModel {
  partnerId: number;
  partnerCode?: string;
  partnerName: string;
  partnerType?: string;
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
  grandTotalPointsIssued?: number;
  grandTotalPointsRedeemed: number;
  grandTotalFiatPayable?: number;
  grandTotalFiatReceivable?: number;
  grandTotalNetSettlement?: number;
  partnerSummaries: ClearingSummaryModel[];
  generatedAt: string;
}

export interface PartnerTransactionItemModel {
  id: number;
  transactionCode: string;
  externalUserId: string;
  pointsRedeemed: number;
  fiatAmount: number;
  exchangeRate: number;
  role: 'REDEEMER' | 'ISSUER';
  status: string;
  settledAt?: string;
  createdAt: string;
}

export interface PartnerTransactionsResponseModel {
  partnerId: number;
  partnerCode: string;
  partnerName: string;
  totalTransactions: number;
  totalPoints: number;
  totalFiat: number;
  transactions: PartnerTransactionItemModel[];
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

  async saveTier(tier: Partial<TierConfigModel>, tenantId: string = 'TENANT_NATCASH'): Promise<any> {
    try {
      const response: any = await apiClient.post('/loyalty/v1/tiers', tier, {
        headers: { 'X-Tenant-Id': tenantId },
      });
      return response?.data || response;
    } catch (err) {
      console.error('Error saving tier:', err);
      throw err;
    }
  },

  // 2. Quản lý Chính sách Tích/Tiêu điểm (CRUD)
  async getPolicies(tenantId: string = 'TENANT_NATCASH'): Promise<PolicyRuleModel[]> {
    try {
      const response: any = await apiClient.get('/loyalty/v1/policies', {
        headers: { 'X-Tenant-Id': tenantId },
      });
      const data = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.data?.data)
        ? response.data.data
        : Array.isArray(response?.content)
        ? response.content
        : [];
      return data.map((p: any) => ({
        id: p.id,
        policyCode: p.code || `POL_${p.id}`,
        partnerId: p.partnerId,
        partnerCode: p.partnerCode || 'DELIMART',
        partnerName: p.partnerName || 'Siêu Thị Delimart',
        type: p.type || 'BURN',
        earnRate: p.earnRatePercent !== undefined ? p.earnRatePercent : 1,
        earnRatePercent: p.earnRatePercent !== undefined ? p.earnRatePercent : 1,
        exchangeRate: p.exchangeRate !== undefined ? p.exchangeRate : 1,
        maxBurnPercent: p.maxBurnPercentage !== undefined ? p.maxBurnPercentage : 50,
        maxBurnPercentage: p.maxBurnPercentage !== undefined ? p.maxBurnPercentage : 50,
        minBillAmount: p.minBillAmount !== undefined ? p.minBillAmount : 10,
        status: p.status || 'ACTIVE',
        effectiveDate: p.updatedAt ? new Date(p.updatedAt).toLocaleString('vi-VN') : new Date().toLocaleDateString('vi-VN'),
        description: p.description || '',
      }));
    } catch {
      return [];
    }
  },

  async getPartners(tenantId: string = 'TENANT_NATCASH'): Promise<any[]> {
    try {
      const response: any = await apiClient.get('/loyalty/v1/partners', {
        headers: { 'X-Tenant-Id': tenantId },
      });
      const data = Array.isArray(response) ? response : (response?.data || []);
      return data.map((p: any) => ({
        id: p.id,
        partnerCode: p.partnerCode,
        partnerName: p.partnerName,
        partnerType: p.partnerType || 'RETAIL',
        status: p.status || 'ACTIVE',
      }));
    } catch (e) {
      console.error('[getPartners] Error:', e);
      return [];
    }
  },

  async createPolicy(data: Partial<PolicyRuleModel>, tenantId: string = 'TENANT_NATCASH'): Promise<PolicyRuleModel> {
    const payload = {
      partnerId: data.partnerId,
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
      partnerId: data.partnerId,
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
      const data = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.data?.data)
        ? response.data.data
        : Array.isArray(response?.content)
        ? response.content
        : [];
      return data.map((m: any) => ({
        id: m.id,
        campaignCode: m.campaignCode,
        campaignName: m.campaignName,
        milestoneStep: m.milestoneStep || 1,
        targetMetric: m.targetMetric || 'BILL_AMOUNT',
        targetValue: m.targetValue || 0,
        rewardPoints: m.rewardPoints || 0,
        rewardVoucherId: m.rewardVoucherId,
        rewardGameTurns: m.rewardGameTurns || 0,
        startDate: m.startDate,
        endDate: m.endDate,
        status: m.status || 'ACTIVE',
      }));
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
  async getClearingReport(tenantId: string = 'TENANT_NATCASH', fromDate?: string, toDate?: string): Promise<ClearingReportModel> {
    const from = fromDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
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
        grandTotalTransactions: 0,
        grandTotalPointsIssued: 0,
        grandTotalPointsRedeemed: 0,
        grandTotalFiatPayable: 0,
        grandTotalFiatReceivable: 0,
        grandTotalNetSettlement: 0,
        partnerSummaries: [],
        generatedAt: new Date().toISOString(),
      };
    }
  },

  async settleClearingPeriod(tenantId: string = 'TENANT_NATCASH', fromDate?: string, toDate?: string, remarks?: string): Promise<any> {
    const from = fromDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const to = toDate || new Date().toISOString();
    const response: any = await apiClient.post(
      '/loyalty/v1/clearinghouse/settle-period',
      { fromDate: from, toDate: to, remarks: remarks || 'Quyết toán bù trừ định kỳ' },
      { headers: { 'X-Tenant-Id': tenantId } }
    );
    return response?.data || response;
  },

  async getPartnerClearingTransactions(tenantId: string = 'TENANT_NATCASH', partnerId: number, fromDate: string, toDate: string): Promise<PartnerTransactionsResponseModel> {
    const response: any = await apiClient.get('/loyalty/v1/clearinghouse/partner-transactions', {
      params: { partnerId, fromDate, toDate },
      headers: { 'X-Tenant-Id': tenantId },
    });
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
        totalMembers: 0,
        activeMembers: 0,
        totalEarnedPoints: 0,
        totalBurnedPoints: 0,
        activeVouchers: 0,
        totalTransactions: 0,
        clearingSettledAmount: 0,
        uptimePercent: 100.0,
        tierDistributions: [],
      };
    }
  },

  // 7. Giám sát sức khỏe hạ tầng hệ thống thời gian thực
  async getSystemHealth(tenantId: string = 'TENANT_NATCASH'): Promise<SystemHealthResponseModel> {
    try {
      const response: any = await apiClient.get('/loyalty/v1/dashboard/health', {
        headers: { 'X-Tenant-Id': tenantId },
      });
      return response?.data || response;
    } catch (e) {
      console.error('[getSystemHealth] Error:', e);
      return {
        overallStatus: 'UP',
        timestamp: new Date().toISOString(),
        components: [],
      };
    }
  },

  // 8. Sổ cái biến động điểm
  async getPointLedger(
    tenantId: string = 'TENANT_NATCASH',
    params?: PointLedgerQueryParams
  ): Promise<PointLedgerItem[] & PointLedgerResponse> {
    try {
      const page = params?.page ?? 0;
      const size = params?.size ?? 15;
      const query = new URLSearchParams();
      query.append('page', String(page));
      query.append('size', String(size));

      if (params?.actionType && params.actionType !== 'ALL') {
        query.append('actionType', params.actionType);
      }
      if (params?.partnerCode && params.partnerCode !== 'ALL') {
        query.append('partnerCode', params.partnerCode);
      }
      if (params?.partnerId) {
        query.append('partnerId', String(params.partnerId));
      }
      if (params?.keyword && params.keyword.trim()) {
        query.append('keyword', params.keyword.trim());
      }

      const response: any = await apiClient.get(`/loyalty/v1/ledger?${query.toString()}`, {
        headers: { 'X-Tenant-Id': tenantId },
      });

      const rawList = Array.isArray(response)
        ? response
        : (response?.items || response?.content || response?.data || []);

      const totalElements = typeof response?.totalElements === 'number'
        ? response.totalElements
        : rawList.length;

      const totalPages = typeof response?.totalPages === 'number'
        ? response.totalPages
        : Math.ceil(totalElements / size);

      const mappedItems: PointLedgerItem[] = rawList.map((item: any) => ({
        id: item.id,
        transactionId: item.referenceCode || item.transactionId || `TX_${item.id}`,
        externalUserId: item.externalUserId || 'Khách hàng',
        actionType: item.changeType || item.actionType || 'EARN',
        points: item.pointChange != null ? Math.abs(Number(item.pointChange)) : (item.points || 0),
        balanceBefore: item.balanceBefore != null ? Number(item.balanceBefore) : undefined,
        balanceAfter: item.balanceAfter != null ? Number(item.balanceAfter) : (item.points || 0),
        partnerId: item.partnerId,
        partnerCode: item.partnerCode || 'NATCASH',
        partnerName: item.partnerName,
        partnerType: item.partnerType,
        referenceId: item.referenceCode,
        description: item.description || '',
        status: item.status || 'COMPLETED',
        createdAt: item.createdAt || new Date().toISOString(),
      }));

      const result: any = mappedItems;
      result.items = mappedItems;
      result.totalElements = totalElements;
      result.totalPages = totalPages;
      result.currentPage = page;
      result.pageSize = size;

      return result;
    } catch (e) {
      console.error('[getPointLedger] Error:', e);
      const emptyArr: any = [];
      emptyArr.items = [];
      emptyArr.totalElements = 0;
      emptyArr.totalPages = 0;
      emptyArr.currentPage = 0;
      emptyArr.pageSize = params?.size || 15;
      return emptyArr;
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
