import { apiClient } from './config';

export interface TierConfigModel {
  id: number;
  code: string;
  name: string;
  tierLevel: number;
  minPoints?: number;
  requiredPoints?: number;
  maintainPoints?: number;
  keepTierPoints?: number;
  upgradePoints?: number;
  cycleMonths?: number;
  downgradeMaxSteps?: number;
  pointMultiplier: number;
  freeDailyTurns: number;
  status: string;
  description: string;
}

export interface PartnerItemModel {
  id: number;
  partnerCode: string;
  partnerName: string;
  partnerType?: string;
  status?: string;
}

export interface GameDashboardStats {
  totalGames: number;
  activeGames: number;
  todaySpins: number;
  yesterdaySpins: number;
  spinGrowthPercent: number;
  todaySpentAmount: number;
  dailyBudgetLimit: number;
  budgetUsagePercent: number;
  uniquePlayersToday: number;
  lockMechanism: string;
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
  commissionRatePercent?: number;
  fixedFeePerTx?: number;
  maxBurnPointsPerTx?: number;
  settlementCreditLimit?: number;
  settlementCycle?: string;
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
  partnerId?: number | null;
  partnerCode?: string;
  partnerName?: string;
  campaignCode: string;
  campaignName: string;
  milestoneStep: number;
  targetMetric: string;
  targetValue: number;
  rewardPoints?: number;
  rewardVoucherId?: number | null;
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
  totalCommissionFee?: number;
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
  grandTotalFiatAmount: number;
  grandTotalCommissionFee?: number;
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

export interface DisputeItemModel {
  id: number;
  disputeCode: string;
  batchCode: string;
  partnerId: number;
  partnerName: string;
  disputeType: string;
  partnerAmount: number;
  loyaltyAmount: number;
  resolvedAmount: number;
  status: string;
  resolutionNote?: string;
  createdAt: string;
  resolvedAt?: string;
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

  async deleteTier(id: number, tenantId: string = 'TENANT_NATCASH'): Promise<any> {
    try {
      const response: any = await apiClient.delete(`/loyalty/v1/tiers/${id}`, {
        headers: { 'X-Tenant-Id': tenantId },
      });
      return response?.data || response;
    } catch (err) {
      console.error('Error deleting tier:', err);
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
        partnerCode: p.partnerCode || '',
        partnerName: p.partnerName || '',
        type: p.type || '',
        earnRate: p.earnRatePercent,
        earnRatePercent: p.earnRatePercent,
        exchangeRate: p.exchangeRate,
        maxBurnPercent: p.maxBurnPercentage,
        maxBurnPercentage: p.maxBurnPercentage,
        minBillAmount: p.minBillAmount,
        status: p.status || '',
        effectiveDate: p.updatedAt ? new Date(p.updatedAt).toLocaleString() : '',
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
      earnRatePercent: data.earnRate ?? data.earnRatePercent,
      exchangeRate: data.exchangeRate,
      minBillAmount: data.minBillAmount,
      maxBurnPercentage: data.maxBurnPercent ?? data.maxBurnPercentage,
      status: data.status,
      description: data.description,
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
        partnerId: m.partnerId ?? null,
        partnerCode: m.partnerCode,
        partnerName: m.partnerName,
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
        grandTotalFiatAmount: 0,
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
      { fromDate: from, toDate: to, remarks: remarks || '' },
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

  async getDisputes(tenantId: string = 'TENANT_NATCASH'): Promise<DisputeItemModel[]> {
    try {
      const response: any = await apiClient.get('/loyalty/v1/clearinghouse/disputes', {
        headers: { 'X-Tenant-Id': tenantId },
      });
      if (Array.isArray(response)) return response;
      if (response && Array.isArray(response.data)) return response.data;
      return [];
    } catch (e) {
      console.error('[getDisputes] Error:', e);
      return [];
    }
  },

  async resolveDispute(disputeCode: string, status: string, resolvedAmount?: number, note?: string, tenantId: string = 'TENANT_NATCASH'): Promise<any> {
    const response: any = await apiClient.post(
      `/loyalty/v1/clearinghouse/disputes/${disputeCode}/resolve`,
      { status, resolvedAmount, note },
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
        externalUserId: item.externalUserId || '',
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

  async deleteGame(gameId: number | string, tenantId: string = 'TENANT_NATCASH'): Promise<any> {
    const response: any = await apiClient.delete(`/gamehub/v1/admin/games/${gameId}`, {
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
      return null;
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

  async getGameDashboardStats(tenantId: string = 'TENANT_NATCASH'): Promise<GameDashboardStats> {
    try {
      const response: any = await apiClient.get('/gamehub/v1/admin/dashboard-stats', {
        headers: { 'X-Tenant-Id': tenantId },
      });
      return response?.data || response;
    } catch (e) {
      console.error('[getGameDashboardStats] Error:', e);
      return {
        totalGames: 0,
        activeGames: 0,
        todaySpins: 0,
        yesterdaySpins: 0,
        spinGrowthPercent: 0,
        todaySpentAmount: 0,
        dailyBudgetLimit: 0,
        budgetUsagePercent: 0,
        uniquePlayersToday: 0,
        lockMechanism: '',
      };
    }
  },

  // 10. Hàng đợi Phê duyệt Hai cấp (Maker-Checker Approvals)
  async getApprovals(
    params?: { targetType?: string; status?: string; page?: number; size?: number },
    tenantId: string = 'TENANT_NATCASH'
  ): Promise<ApprovalRequestModel[]> {
    try {
      const response: any = await apiClient.get('/loyalty/v1/approvals', {
        params,
        headers: { 'X-Tenant-Id': tenantId },
      });
      return unwrapList<ApprovalRequestModel>(response);
    } catch (e) {
      console.error('[getApprovals] Error:', e);
      return [];
    }
  },

  async createApprovalRequest(
    data: Partial<ApprovalRequestModel>,
    tenantId: string = 'TENANT_NATCASH'
  ): Promise<ApprovalRequestModel> {
    const response: any = await apiClient.post('/loyalty/v1/approvals', data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return unwrapObject<ApprovalRequestModel>(response);
  },

  async approveRequest(
    requestId: number | string,
    reason?: string,
    tenantId: string = 'TENANT_NATCASH'
  ): Promise<ApprovalRequestModel> {
    const response: any = await apiClient.post(
      `/loyalty/v1/approvals/${requestId}/approve`,
      { reason: reason || '' },
      { headers: { 'X-Tenant-Id': tenantId } }
    );
    return unwrapObject<ApprovalRequestModel>(response);
  },

  async rejectRequest(
    requestId: number | string,
    reason: string,
    tenantId: string = 'TENANT_NATCASH'
  ): Promise<ApprovalRequestModel> {
    const response: any = await apiClient.post(
      `/loyalty/v1/approvals/${requestId}/reject`,
      { reason },
      { headers: { 'X-Tenant-Id': tenantId } }
    );
    return unwrapObject<ApprovalRequestModel>(response);
  },

  // 11. FIFO Buckets, Điều chỉnh điểm thủ công & Hồ sơ Hội viên 360
  async getExpiringBuckets(
    externalUserId: string,
    tenantId: string = 'TENANT_NATCASH'
  ): Promise<PointExpirationBucketModel[]> {
    try {
      const response: any = await apiClient.get('/loyalty/v1/ledger/expiring-buckets', {
        params: { externalUserId },
        headers: { 'X-Tenant-Id': tenantId },
      });
      return unwrapList<PointExpirationBucketModel>(response);
    } catch (e) {
      console.error('[getExpiringBuckets] Error:', e);
      return [];
    }
  },

  async getPointAdjustments(
    params?: { status?: string; page?: number; size?: number },
    tenantId: string = 'TENANT_NATCASH'
  ): Promise<PointAdjustmentModel[]> {
    try {
      const response: any = await apiClient.get('/loyalty/v1/ledger/adjustments', {
        params,
        headers: { 'X-Tenant-Id': tenantId },
      });
      return unwrapList<PointAdjustmentModel>(response);
    } catch (e) {
      console.error('[getPointAdjustments] Error:', e);
      return [];
    }
  },

  async createPointAdjustment(
    data: PointAdjustmentPayload,
    tenantId: string = 'TENANT_NATCASH'
  ): Promise<PointAdjustmentModel> {
    const response: any = await apiClient.post('/loyalty/v1/ledger/adjustments', data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return unwrapObject<PointAdjustmentModel>(response);
  },

  async getMemberProfile360(
    externalUserId: string,
    tenantId: string = 'TENANT_NATCASH'
  ): Promise<MemberProfile360Model | null> {
    try {
      const response: any = await apiClient.get(
        `/loyalty/v1/accounts/${encodeURIComponent(externalUserId)}/profile-360`,
        { headers: { 'X-Tenant-Id': tenantId } }
      );
      return unwrapObject<MemberProfile360Model>(response);
    } catch (e) {
      console.error('[getMemberProfile360] Error:', e);
      return null;
    }
  },

  async submitMemberLockRequest(
    externalUserId: string,
    data: { action: 'LOCK' | 'UNLOCK'; reason: string; ticketRef?: string },
    tenantId: string = 'TENANT_NATCASH'
  ): Promise<ApprovalRequestModel> {
    const response: any = await apiClient.post(
      `/loyalty/v1/accounts/${encodeURIComponent(externalUserId)}/lock-request`,
      data,
      { headers: { 'X-Tenant-Id': tenantId } }
    );
    return unwrapObject<ApprovalRequestModel>(response);
  },

  async getTierDistribution(tenantId: string = 'TENANT_NATCASH'): Promise<TierDistributionModel[]> {
    try {
      const response: any = await apiClient.get('/loyalty/v1/tiers/distribution', {
        headers: { 'X-Tenant-Id': tenantId },
      });
      return unwrapList<TierDistributionModel>(response);
    } catch (e) {
      console.error('[getTierDistribution] Error:', e);
      return [];
    }
  },

  // 12. Điểm chấp nhận thanh toán Natcash (LM-02) & Tổng quan 6 kết nối (QT-06)
  async getPaymentPoints(
    params?: { keyword?: string; province?: string; status?: string },
    tenantId: string = 'TENANT_NATCASH'
  ): Promise<NatcashPaymentPointModel[]> {
    try {
      const response: any = await apiClient.get('/loyalty/v1/payment-points', {
        params,
        headers: { 'X-Tenant-Id': tenantId },
      });
      return unwrapList<NatcashPaymentPointModel>(response);
    } catch (e) {
      console.error('[getPaymentPoints] Error:', e);
      return [];
    }
  },

  async createPaymentPoint(
    data: Partial<NatcashPaymentPointModel>,
    tenantId: string = 'TENANT_NATCASH'
  ): Promise<NatcashPaymentPointModel> {
    const response: any = await apiClient.post('/loyalty/v1/payment-points', data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return unwrapObject<NatcashPaymentPointModel>(response);
  },

  async updatePaymentPoint(
    id: number,
    data: Partial<NatcashPaymentPointModel>,
    tenantId: string = 'TENANT_NATCASH'
  ): Promise<NatcashPaymentPointModel> {
    const response: any = await apiClient.put(`/loyalty/v1/payment-points/${id}`, data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return unwrapObject<NatcashPaymentPointModel>(response);
  },

  async deletePaymentPoint(id: number, tenantId: string = 'TENANT_NATCASH'): Promise<void> {
    await apiClient.delete(`/loyalty/v1/payment-points/${id}`, {
      headers: { 'X-Tenant-Id': tenantId },
    });
  },

  async getIntegrationsOverview(tenantId: string = 'TENANT_NATCASH'): Promise<SystemIntegrationItemModel[]> {
    try {
      const response: any = await apiClient.get('/loyalty/v1/integrations/overview', {
        headers: { 'X-Tenant-Id': tenantId },
      });
      return unwrapList<SystemIntegrationItemModel>(response);
    } catch (e) {
      console.error('[getIntegrationsOverview] Error:', e);
      return [];
    }
  },

  // 13. Lô thanh toán bù trừ (Clearing Batches LM-07)
  async getClearingBatches(tenantId: string = 'TENANT_NATCASH'): Promise<ClearingPaymentBatchModel[]> {
    try {
      const response: any = await apiClient.get('/loyalty/v1/clearinghouse/batches', {
        headers: { 'X-Tenant-Id': tenantId },
      });
      return unwrapList<ClearingPaymentBatchModel>(response);
    } catch (e) {
      console.error('[getClearingBatches] Error:', e);
      return [];
    }
  },

  async createClearingBatch(
    data: Partial<ClearingPaymentBatchModel>,
    tenantId: string = 'TENANT_NATCASH'
  ): Promise<ClearingPaymentBatchModel> {
    const response: any = await apiClient.post('/loyalty/v1/clearinghouse/batches', data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return unwrapObject<ClearingPaymentBatchModel>(response);
  },

  async confirmClearingBatch(
    batchCode: string,
    tenantId: string = 'TENANT_NATCASH'
  ): Promise<ClearingPaymentBatchModel> {
    const response: any = await apiClient.post(
      `/loyalty/v1/partner-portal/settlements/${encodeURIComponent(batchCode)}/confirm`,
      { confirmedBy: 'cms_admin' },
      { headers: { 'X-Tenant-Id': tenantId } }
    );
    return unwrapObject<ClearingPaymentBatchModel>(response);
  },

  // 14. Bộ dựng luật chiến dịch (NV-05), Theo dõi (NV-06), AI Copilot (AI-01) & Ngân sách (NS-01)
  async getCampaignRules(tenantId: string = 'TENANT_NATCASH'): Promise<CampaignRuleModel[]> {
    try {
      const response: any = await apiClient.get('/loyalty/v1/campaigns/rules', {
        headers: { 'X-Tenant-Id': tenantId },
      });
      return unwrapList<CampaignRuleModel>(response);
    } catch (e) {
      console.error('[getCampaignRules] Error:', e);
      return [];
    }
  },

  async saveCampaignRule(
    data: Partial<CampaignRuleModel>,
    tenantId: string = 'TENANT_NATCASH'
  ): Promise<CampaignRuleModel> {
    const response: any = await apiClient.post('/loyalty/v1/campaigns/rules', data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return unwrapObject<CampaignRuleModel>(response);
  },

  async deleteCampaignRule(id: number, tenantId: string = 'TENANT_NATCASH'): Promise<void> {
    await apiClient.delete(`/loyalty/v1/campaigns/rules/${id}`, {
      headers: { 'X-Tenant-Id': tenantId },
    });
  },

  async getCampaignTracking(tenantId: string = 'TENANT_NATCASH'): Promise<CampaignTrackingItemModel[]> {
    try {
      const response: any = await apiClient.get('/loyalty/v1/campaigns/rules', {
        headers: { 'X-Tenant-Id': tenantId },
      });
      return unwrapList<CampaignTrackingItemModel>(response);
    } catch (e) {
      console.error('[getCampaignTracking] Error:', e);
      return [];
    }
  },

  async suggestCampaignCopilot(
    data: AiCopilotSuggestRequest,
    tenantId: string = 'TENANT_NATCASH'
  ): Promise<AiCopilotSuggestResponse> {
    const response: any = await apiClient.post('/loyalty/v1/ai-copilot/suggest', data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return unwrapObject<AiCopilotSuggestResponse>(response);
  },

  async getBudgets(
    params?: { budgetMonth?: string },
    tenantId: string = 'TENANT_NATCASH'
  ): Promise<MonthlyBudgetModel[]> {
    try {
      const response: any = await apiClient.get('/loyalty/v1/budgets', {
        params,
        headers: { 'X-Tenant-Id': tenantId },
      });
      return unwrapList<MonthlyBudgetModel>(response);
    } catch (e) {
      console.error('[getBudgets] Error:', e);
      return [];
    }
  },

  async saveBudget(
    data: Partial<MonthlyBudgetModel>,
    tenantId: string = 'TENANT_NATCASH'
  ): Promise<MonthlyBudgetModel> {
    const response: any = await apiClient.post('/loyalty/v1/budgets', data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return unwrapObject<MonthlyBudgetModel>(response);
  },

  // 15. Phân khúc (CN-03), Kịch bản nhắc nhở (CN-04) & Trung tâm cảnh báo (CN-05)
  async getSegments(tenantId: string = 'TENANT_NATCASH'): Promise<CustomerSegmentModel[]> {
    try {
      const response: any = await apiClient.get('/loyalty/v1/segments', {
        headers: { 'X-Tenant-Id': tenantId },
      });
      return unwrapList<CustomerSegmentModel>(response);
    } catch (e) {
      console.error('[getSegments] Error:', e);
      return [];
    }
  },

  async recalculateSegment(_segmentId: number, tenantId: string = 'TENANT_NATCASH'): Promise<any> {
    const response: any = await apiClient.post(
      '/loyalty/v1/segments/recalculate',
      {},
      { headers: { 'X-Tenant-Id': tenantId } }
    );
    return unwrapObject<any>(response);
  },

  async getSegmentMembers(
    segmentCode: string,
    tenantId: string = 'TENANT_NATCASH'
  ): Promise<SegmentMemberModel[]> {
    try {
      const response: any = await apiClient.get(
        `/loyalty/v1/segments/${encodeURIComponent(segmentCode)}/members`,
        {
          headers: { 'X-Tenant-Id': tenantId },
        }
      );
      return unwrapList<SegmentMemberModel>(response);
    } catch (e) {
      console.error('[getSegmentMembers] Error:', e);
      return [];
    }
  },

  async getReminderScenarios(tenantId: string = 'TENANT_NATCASH'): Promise<ReminderScenarioModel[]> {
    try {
      const response: any = await apiClient.get('/loyalty/v1/engagement/scenarios', {
        headers: { 'X-Tenant-Id': tenantId },
      });
      return unwrapList<ReminderScenarioModel>(response);
    } catch (e) {
      console.error('[getReminderScenarios] Error:', e);
      return [];
    }
  },

  async saveReminderScenario(
    data: Partial<ReminderScenarioModel>,
    tenantId: string = 'TENANT_NATCASH'
  ): Promise<ReminderScenarioModel> {
    const response: any = await apiClient.post('/loyalty/v1/engagement/scenarios', data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return unwrapObject<ReminderScenarioModel>(response);
  },

  async getReminderSendLogs(tenantId: string = 'TENANT_NATCASH'): Promise<ReminderSendLogModel[]> {
    try {
      const response: any = await apiClient.get('/loyalty/v1/engagement/scenarios', {
        headers: { 'X-Tenant-Id': tenantId },
      });
      return unwrapList<ReminderSendLogModel>(response);
    } catch (e) {
      console.error('[getReminderSendLogs] Error:', e);
      return [];
    }
  },

  async getAlerts(
    params?: { severity?: string; status?: string },
    tenantId: string = 'TENANT_NATCASH'
  ): Promise<SystemAlertModel[]> {
    try {
      const response: any = await apiClient.get('/loyalty/v1/alerts', {
        params,
        headers: { 'X-Tenant-Id': tenantId },
      });
      return unwrapList<SystemAlertModel>(response);
    } catch (e) {
      console.error('[getAlerts] Error:', e);
      return [];
    }
  },

  async acknowledgeAlert(id: number, tenantId: string = 'TENANT_NATCASH'): Promise<SystemAlertModel> {
    const response: any = await apiClient.post(
      `/loyalty/v1/alerts/${id}/acknowledge`,
      {},
      { headers: { 'X-Tenant-Id': tenantId } }
    );
    return unwrapObject<SystemAlertModel>(response);
  },

  async resolveAlert(id: number, _note?: string, tenantId: string = 'TENANT_NATCASH'): Promise<SystemAlertModel> {
    const response: any = await apiClient.post(
      `/loyalty/v1/alerts/${id}/acknowledge`,
      {},
      { headers: { 'X-Tenant-Id': tenantId } }
    );
    return unwrapObject<SystemAlertModel>(response);
  },

  // 16. Báo cáo Hiệu quả, Bán chéo, Nghĩa vụ điểm & Lập lịch (NS-03, NS-05..07)
  async getProgramEffectiveness(
    params?: { campaignCode?: string; fromDate?: string; toDate?: string },
    tenantId: string = 'TENANT_NATCASH'
  ): Promise<ProgramEffectivenessModel[]> {
    try {
      const response: any = await apiClient.get('/loyalty/v1/reports/effectiveness', {
        params,
        headers: { 'X-Tenant-Id': tenantId },
      });
      return unwrapList<ProgramEffectivenessModel>(response);
    } catch (e) {
      console.error('[getProgramEffectiveness] Error:', e);
      return [];
    }
  },

  async getCrossSellReport(
    params?: { fromDate?: string; toDate?: string },
    tenantId: string = 'TENANT_NATCASH'
  ): Promise<CrossSellReportModel[]> {
    try {
      const response: any = await apiClient.get('/loyalty/v1/reports/cross-sell', {
        params,
        headers: { 'X-Tenant-Id': tenantId },
      });
      return unwrapList<CrossSellReportModel>(response);
    } catch (e) {
      console.error('[getCrossSellReport] Error:', e);
      return [];
    }
  },

  async getPointsLiabilityReport(
    tenantId: string = 'TENANT_NATCASH'
  ): Promise<PointsLiabilityReportModel | null> {
    try {
      const response: any = await apiClient.get('/loyalty/v1/reports/points-liability', {
        headers: { 'X-Tenant-Id': tenantId },
      });
      return unwrapObject<PointsLiabilityReportModel>(response);
    } catch (e) {
      console.error('[getPointsLiabilityReport] Error:', e);
      return null;
    }
  },

  async getReportSchedules(tenantId: string = 'TENANT_NATCASH'): Promise<ScheduledReportModel[]> {
    try {
      const response: any = await apiClient.get('/loyalty/v1/reports/schedules', {
        headers: { 'X-Tenant-Id': tenantId },
      });
      return unwrapList<ScheduledReportModel>(response);
    } catch (e) {
      console.error('[getReportSchedules] Error:', e);
      return [];
    }
  },

  async saveReportSchedule(
    data: Partial<ScheduledReportModel>,
    tenantId: string = 'TENANT_NATCASH'
  ): Promise<ScheduledReportModel> {
    const response: any = await apiClient.post('/loyalty/v1/reports/schedules', data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return unwrapObject<ScheduledReportModel>(response);
  },

  async deleteReportSchedule(id: number, tenantId: string = 'TENANT_NATCASH'): Promise<void> {
    await apiClient.delete(`/loyalty/v1/reports/schedules/${id}`, {
      headers: { 'X-Tenant-Id': tenantId },
    });
  },

  // 17. Ngân hàng câu hỏi Học tập (GM-09) & Thống kê Game (GM-07)
  async getLearningQuestions(
    params?: { courseCode?: string },
    tenantId: string = 'TENANT_NATCASH'
  ): Promise<LearningQuestionModel[]> {
    try {
      const response: any = await apiClient.get('/loyalty/v1/admin/learning/questions', {
        params,
        headers: { 'X-Tenant-Id': tenantId },
      });
      return unwrapList<LearningQuestionModel>(response);
    } catch (e) {
      console.error('[getLearningQuestions] Error:', e);
      return [];
    }
  },

  async saveLearningQuestion(
    data: Partial<LearningQuestionModel>,
    tenantId: string = 'TENANT_NATCASH'
  ): Promise<LearningQuestionModel> {
    const response: any = await apiClient.post('/loyalty/v1/admin/learning/questions', data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return unwrapObject<LearningQuestionModel>(response);
  },

  async deleteLearningQuestion(id: number, tenantId: string = 'TENANT_NATCASH'): Promise<void> {
    await apiClient.delete(`/loyalty/v1/admin/learning/questions/${id}`, {
      headers: { 'X-Tenant-Id': tenantId },
    });
  },

  async importLearningQuestions(
    questions: Partial<LearningQuestionModel>[],
    tenantId: string = 'TENANT_NATCASH'
  ): Promise<any> {
    const response: any = await apiClient.post(
      '/loyalty/v1/admin/learning/questions/import',
      questions,
      { headers: { 'X-Tenant-Id': tenantId } }
    );
    return unwrapObject<any>(response);
  },

  async getGameStatistics(
    params?: { gameCode?: string; fromDate?: string; toDate?: string },
    tenantId: string = 'TENANT_NATCASH'
  ): Promise<GameStatisticsResponseModel | null> {
    try {
      const response: any = await apiClient.get('/loyalty/v1/admin/games/statistics', {
        params,
        headers: { 'X-Tenant-Id': tenantId },
      });
      return unwrapObject<GameStatisticsResponseModel>(response);
    } catch (e) {
      console.error('[getGameStatistics] Error:', e);
      return null;
    }
  },

  // 18. Quản trị Đại lý & Tổng Đại lý (AG-03)
  async getAdminAgents(
    params?: { roleType?: string; month?: string },
    tenantId: string = 'TENANT_NATCASH'
  ): Promise<AgentLoyaltyItemModel[]> {
    try {
      const response: any = await apiClient.get('/loyalty/v1/admin/agents', {
        params,
        headers: { 'X-Tenant-Id': tenantId },
      });
      return unwrapList<AgentLoyaltyItemModel>(response);
    } catch (e) {
      console.error('[getAdminAgents] Error:', e);
      return [];
    }
  },

  async saveAgentTarget(
    data: Partial<AgentTargetConfigModel>,
    tenantId: string = 'TENANT_NATCASH'
  ): Promise<AgentTargetConfigModel> {
    const response: any = await apiClient.post('/loyalty/v1/admin/agents/targets', data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return unwrapObject<AgentTargetConfigModel>(response);
  },

  async approveAgentReward(
    agentId: string | number,
    month: string,
    tenantId: string = 'TENANT_NATCASH'
  ): Promise<any> {
    const response: any = await apiClient.post(
      `/loyalty/v1/admin/agents/${encodeURIComponent(String(agentId))}/approve-reward`,
      { month },
      { headers: { 'X-Tenant-Id': tenantId } }
    );
    return unwrapObject<any>(response);
  },

  async getAgentPlaybooks(tenantId: string = 'TENANT_NATCASH'): Promise<SupportPlaybookModel[]> {
    try {
      const response: any = await apiClient.get('/loyalty/v1/admin/agents/playbooks', {
        headers: { 'X-Tenant-Id': tenantId },
      });
      return unwrapList<SupportPlaybookModel>(response);
    } catch (e) {
      console.error('[getAgentPlaybooks] Error:', e);
      return [];
    }
  },

  async saveAgentPlaybook(
    data: Partial<SupportPlaybookModel>,
    tenantId: string = 'TENANT_NATCASH'
  ): Promise<SupportPlaybookModel> {
    const response: any = await apiClient.post('/loyalty/v1/admin/agents/playbooks', data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return unwrapObject<SupportPlaybookModel>(response);
  },

  // 19. Merchant Partner Portal (/loyalty/v1/partner-portal/*)
  async getPartnerPortalDashboard(
    partnerId?: number,
    tenantId: string = 'TENANT_NATCASH'
  ): Promise<PartnerPortalDashboardModel | null> {
    try {
      const response: any = await apiClient.get('/loyalty/v1/partner-portal/dashboard', {
        params: partnerId ? { partnerId } : undefined,
        headers: { 'X-Tenant-Id': tenantId },
      });
      return unwrapObject<PartnerPortalDashboardModel>(response);
    } catch (e) {
      console.error('[getPartnerPortalDashboard] Error:', e);
      return null;
    }
  },

  async getPartnerBranches(tenantId: string = 'TENANT_NATCASH'): Promise<PartnerBranchModel[]> {
    try {
      const response: any = await apiClient.get('/loyalty/v1/partner-portal/branches', {
        headers: { 'X-Tenant-Id': tenantId },
      });
      return unwrapList<PartnerBranchModel>(response);
    } catch (e) {
      console.error('[getPartnerBranches] Error:', e);
      return [];
    }
  },

  async savePartnerBranch(
    data: Partial<PartnerBranchModel>,
    tenantId: string = 'TENANT_NATCASH'
  ): Promise<PartnerBranchModel> {
    const response: any = await apiClient.post('/loyalty/v1/partner-portal/branches', data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return unwrapObject<PartnerBranchModel>(response);
  },

  async getPartnerProductGroups(tenantId: string = 'TENANT_NATCASH'): Promise<PartnerProductGroupModel[]> {
    try {
      const response: any = await apiClient.get('/loyalty/v1/partner-portal/product-groups', {
        headers: { 'X-Tenant-Id': tenantId },
      });
      return unwrapList<PartnerProductGroupModel>(response);
    } catch (e) {
      console.error('[getPartnerProductGroups] Error:', e);
      return [];
    }
  },

  async savePartnerProductGroup(
    data: Partial<PartnerProductGroupModel>,
    tenantId: string = 'TENANT_NATCASH'
  ): Promise<PartnerProductGroupModel> {
    const response: any = await apiClient.post('/loyalty/v1/partner-portal/product-groups', data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return unwrapObject<PartnerProductGroupModel>(response);
  },

  async getPartnerStaff(tenantId: string = 'TENANT_NATCASH'): Promise<PartnerStaffAccountModel[]> {
    try {
      const response: any = await apiClient.get('/loyalty/v1/partner-portal/staff', {
        headers: { 'X-Tenant-Id': tenantId },
      });
      return unwrapList<PartnerStaffAccountModel>(response);
    } catch (e) {
      console.error('[getPartnerStaff] Error:', e);
      return [];
    }
  },

  async savePartnerStaff(
    data: Partial<PartnerStaffAccountModel>,
    tenantId: string = 'TENANT_NATCASH'
  ): Promise<PartnerStaffAccountModel> {
    const response: any = await apiClient.post('/loyalty/v1/partner-portal/staff', data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return unwrapObject<PartnerStaffAccountModel>(response);
  },

  async getPartnerProposals(tenantId: string = 'TENANT_NATCASH'): Promise<PartnerProgramProposalModel[]> {
    try {
      const response: any = await apiClient.get('/loyalty/v1/approvals', {
        headers: { 'X-Tenant-Id': tenantId },
      });
      return unwrapList<PartnerProgramProposalModel>(response);
    } catch (e) {
      console.error('[getPartnerProposals] Error:', e);
      return [];
    }
  },

  async createPartnerProposal(
    data: Partial<PartnerProgramProposalModel>,
    tenantId: string = 'TENANT_NATCASH'
  ): Promise<PartnerProgramProposalModel> {
    const response: any = await apiClient.post('/loyalty/v1/partner-portal/proposals', data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return unwrapObject<PartnerProgramProposalModel>(response);
  },

  async getPartnerPortalVouchers(tenantId: string = 'TENANT_NATCASH'): Promise<VoucherItemModel[]> {
    try {
      const response: any = await apiClient.get('/loyalty/v1/partner-portal/vouchers', {
        headers: { 'X-Tenant-Id': tenantId },
      });
      return unwrapList<VoucherItemModel>(response);
    } catch (e) {
      console.error('[getPartnerPortalVouchers] Error:', e);
      return [];
    }
  },

  async redeemPartnerVoucherAtCounter(
    data: { voucherCode: string; branchCode?: string; billAmount?: number; customerPhone?: string },
    tenantId: string = 'TENANT_NATCASH'
  ): Promise<any> {
    const response: any = await apiClient.post(
      '/loyalty/v1/partner-portal/vouchers/redeem-counter',
      data,
      { headers: { 'X-Tenant-Id': tenantId } }
    );
    return unwrapObject<any>(response);
  },

  async getPartnerPortalTransactions(
    params?: { branchCode?: string; fromDate?: string; toDate?: string; actionType?: string; keyword?: string },
    tenantId: string = 'TENANT_NATCASH'
  ): Promise<PointLedgerItem[]> {
    try {
      const response: any = await apiClient.get('/loyalty/v1/partner-portal/transactions', {
        params,
        headers: { 'X-Tenant-Id': tenantId },
      });
      return unwrapList<PointLedgerItem>(response);
    } catch (e) {
      console.error('[getPartnerPortalTransactions] Error:', e);
      return [];
    }
  },

  async getPartnerPortalSettlements(tenantId: string = 'TENANT_NATCASH'): Promise<PartnerSettlementBatchModel[]> {
    try {
      const response: any = await apiClient.get('/loyalty/v1/partner-portal/settlements', {
        headers: { 'X-Tenant-Id': tenantId },
      });
      return unwrapList<PartnerSettlementBatchModel>(response);
    } catch (e) {
      console.error('[getPartnerPortalSettlements] Error:', e);
      return [];
    }
  },

  async confirmPartnerSettlement(
    batchCode: string,
    tenantId: string = 'TENANT_NATCASH'
  ): Promise<any> {
    const response: any = await apiClient.post(
      `/loyalty/v1/partner-portal/settlements/${encodeURIComponent(batchCode)}/confirm`,
      { confirmedBy: 'partner_portal' },
      { headers: { 'X-Tenant-Id': tenantId } }
    );
    return unwrapObject<any>(response);
  },

  async raisePartnerSettlementClaim(
    data: { batchCode: string; claimedAmount: number; reason: string; attachmentUrl?: string },
    tenantId: string = 'TENANT_NATCASH'
  ): Promise<any> {
    const response: any = await apiClient.post(
      `/loyalty/v1/partner-portal/settlements/${encodeURIComponent(data.batchCode)}/claim`,
      {
        disputeType: 'SETTLEMENT_DISPUTE',
        partnerAmount: data.claimedAmount,
        resolutionNote: data.reason,
      },
      { headers: { 'X-Tenant-Id': tenantId } }
    );
    return unwrapObject<any>(response);
  },

  async getPartnerNotifications(tenantId: string = 'TENANT_NATCASH'): Promise<PartnerNotificationModel[]> {
    try {
      const response: any = await apiClient.get('/loyalty/v1/partner-portal/notifications', {
        headers: { 'X-Tenant-Id': tenantId },
      });
      return unwrapList<PartnerNotificationModel>(response);
    } catch (e) {
      console.error('[getPartnerNotifications] Error:', e);
      return [];
    }
  },

  async markPartnerNotificationRead(id: number, tenantId: string = 'TENANT_NATCASH'): Promise<void> {
    await apiClient.post(
      `/loyalty/v1/partner-portal/notifications/${id}/read`,
      {},
      { headers: { 'X-Tenant-Id': tenantId } }
    );
  },

  async getPartnerApiKeys(tenantId: string = 'TENANT_NATCASH'): Promise<PartnerApiKeyConfigModel> {
    try {
      const response: any = await apiClient.get('/loyalty/v1/partner-portal/api-keys', {
        headers: { 'X-Tenant-Id': tenantId },
      });
      return unwrapObject<PartnerApiKeyConfigModel>(response);
    } catch (e) {
      console.error('[getPartnerApiKeys] Error:', e);
      return { keys: [], webhookUrl: '', ipWhitelist: '' };
    }
  },

  async rotatePartnerApiKey(
    data?: { label?: string },
    tenantId: string = 'TENANT_NATCASH'
  ): Promise<RotateApiKeyResultModel> {
    const response: any = await apiClient.post('/loyalty/v1/partner-portal/api-keys/rotate', data || {}, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return unwrapObject<RotateApiKeyResultModel>(response);
  },

  async revokePartnerApiKey(id: number, tenantId: string = 'TENANT_NATCASH'): Promise<void> {
    await apiClient.post(
      `/loyalty/v1/partner-portal/api-keys/${id}/revoke`,
      {},
      { headers: { 'X-Tenant-Id': tenantId } }
    );
  },

  async updatePartnerWebhookConfig(
    data: { webhookUrl: string; ipWhitelist: string; webhookSecret?: string },
    tenantId: string = 'TENANT_NATCASH'
  ): Promise<any> {
    const response: any = await apiClient.put('/loyalty/v1/partner-portal/webhook-config', data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return unwrapObject<any>(response);
  },
};

function unwrapList<T>(response: any): T[] {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.content)) return response.content;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.items)) return response.data.items;
  if (Array.isArray(response?.data?.content)) return response.data.content;
  return [];
}

function unwrapObject<T>(response: any): T {
  return (response?.data ?? response) as T;
}

export interface ApprovalRequestModel {
  id: number;
  requestCode?: string;
  targetType: string;
  targetId: string;
  actionType: string;
  title?: string;
  payloadBefore?: any;
  payloadAfter?: any;
  makerId?: string;
  makerUsername?: string;
  checkerId?: string;
  checkerUsername?: string;
  status: string;
  reason?: string;
  rejectReason?: string;
  reviewNote?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface PointExpirationBucketModel {
  bucketId: number | string;
  assetType: string;
  initialPoints: number;
  remainingPoints: number;
  earnedAt: string;
  expiredAt: string;
  sourceRef: string;
  status: string;
}

export interface PointAdjustmentPayload {
  externalUserId: string;
  direction: string;
  assetType: string;
  points: number;
  reason: string;
  referenceDoc?: string;
}

export interface PointAdjustmentModel extends PointAdjustmentPayload {
  id: number;
  requestCode?: string;
  status: string;
  makerId?: string;
  checkerId?: string;
  createdAt: string;
}

export interface MemberProfile360Model {
  accountId: number;
  externalUserId: string;
  phoneNumber: string;
  fullName: string;
  email?: string;
  currentPoints: number;
  tierPoints: number;
  keepTierPoints?: number;
  nextTierTargetPoints?: number;
  tierCode: string;
  tierName: string;
  pointMultiplier: number;
  cycleEndAt?: string;
  tierLockedUntil?: string;
  status: string;
  segmentCode?: string;
  segmentName?: string;
  ekycVerified?: boolean;
  recentTransactions?: PointLedgerItem[];
  recentVouchers?: VoucherItemModel[];
  expiringBuckets?: PointExpirationBucketModel[];
}

export interface NatcashPaymentPointModel {
  id: number;
  branchCode: string;
  branchName: string;
  paymentPointCode: string;
  province: string;
  address: string;
  latitude?: number;
  longitude?: number;
  managerPhone?: string;
  status: string;
  createdAt?: string;
}

export interface SystemIntegrationItemModel {
  systemCode: string;
  systemName: string;
  protocol: string;
  endpointUrl: string;
  status: 'UP' | 'DEGRADED' | 'DOWN';
  latencyMs: number;
  uptimePercent: number;
  lastHeartbeatAt: string;
  notes?: string;
}

export interface ClearingPaymentBatchModel {
  id?: number;
  batchCode: string;
  partnerId: number;
  partnerCode?: string;
  partnerName: string;
  periodFrom: string;
  periodTo: string;
  grossAmount: number;
  discountAmount: number;
  mdrFeeAmount: number;
  netPayableAmount: number;
  excludedDisputeCodes?: string[];
  confirmDeadlineAt?: string;
  status: string;
  createdAt?: string;
  confirmedAt?: string;
  paidAt?: string;
}

export interface CampaignRuleModel {
  id?: number;
  ruleCode: string;
  campaignCode: string;
  campaignName: string;
  missionCategory: string;
  whenEvent: string;
  ifMinBillAmount?: number;
  ifPartnerId?: number | null;
  ifSegmentCode?: string;
  ifMinTierCode?: string;
  thenRewardPoints: number;
  thenRewardTurns: number;
  thenVoucherId?: number | null;
  limitMaxPerUser: number;
  limitMaxTotal: number;
  limitDailyBudgetCap?: number;
  claimExpiryDays: number;
  startDate: string;
  endDate: string;
  status: string;
}

export interface CampaignTrackingItemModel {
  campaignCode: string;
  campaignName: string;
  missionCategory: string;
  participantsCount: number;
  completedCount: number;
  claimedCount: number;
  unclaimedCount: number;
  pointsDistributed: number;
  budgetCap: number;
  budgetUsed: number;
  status: string;
}

export interface AiCopilotSuggestRequest {
  objective: string;
  targetSegment: string;
  budgetCap: number;
  startDate: string;
  endDate: string;
  preferredCategory?: string;
}

export interface AiCopilotConflictItem {
  conflictCampaignCode: string;
  conflictCampaignName: string;
  severity: string;
  reason: string;
}

export interface AiCopilotSuggestResponse {
  suggestedRule: Partial<CampaignRuleModel>;
  rationale: string;
  estimatedParticipants: number;
  estimatedLiftPercent: number;
  conflicts: AiCopilotConflictItem[];
}

export interface MonthlyBudgetModel {
  id?: number;
  budgetMonth: string;
  sponsorType: string;
  partnerCode?: string;
  partnerName?: string;
  budgetCap: number;
  consumedAmount: number;
  usagePercent?: number;
  alert80Sent?: boolean;
  autoPausedAt100?: boolean;
  status: string;
  updatedAt?: string;
}

export interface CustomerSegmentModel {
  id: number;
  segmentCode: string;
  segmentName: string;
  description: string;
  ruleSummary: string;
  memberCount: number;
  lastCalculatedAt?: string;
  status: string;
}

export interface SegmentMemberModel {
  externalUserId: string;
  fullName: string;
  tierCode: string;
  currentPoints: number;
  lastActiveAt?: string;
}

export interface ReminderScenarioModel {
  id?: number;
  scenarioCode: string;
  scenarioName: string;
  triggerType: string;
  targetSegment: string;
  channel: string;
  titleVi?: string;
  titleEn?: string;
  titleFr?: string;
  titleHt?: string;
  bodyVi?: string;
  bodyEn?: string;
  bodyFr?: string;
  bodyHt?: string;
  quietHoursRespect: boolean;
  maxPerWeek: number;
  status: string;
}

export interface ReminderSendLogModel {
  id: number;
  scenarioCode: string;
  externalUserId: string;
  channel: string;
  locale: string;
  status: string;
  blockedReason?: string;
  sentAt: string;
}

export interface SystemAlertModel {
  id: number;
  alertCode: string;
  category: string;
  severity: string;
  title: string;
  message: string;
  sourceRef?: string;
  status: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface ProgramEffectivenessModel {
  campaignCode: string;
  campaignName: string;
  testGroupSize: number;
  controlGroupSize: number;
  testConversionRate: number;
  controlConversionRate: number;
  liftPercent: number;
  incrementalRevenue: number;
  roiPercent: number;
}

export interface CrossSellReportModel {
  sourcePartnerCode: string;
  sourcePartnerName: string;
  targetPartnerCode: string;
  targetPartnerName: string;
  crossUsersCount: number;
  crossTransactionsCount: number;
  crossGmvAmount: number;
  conversionRatePercent: number;
}

export interface PointsLiabilityReportModel {
  asOfDate: string;
  totalOutstandingCoins: number;
  estimatedLiabilityFiat: number;
  expiringWithin30Days: number;
  expiringWithin90Days: number;
  breakageRatePercent: number;
  byTier: Array<{
    tierCode: string;
    tierName: string;
    memberCount: number;
    outstandingCoins: number;
    liabilityFiat: number;
  }>;
}

export interface ScheduledReportModel {
  id?: number;
  reportName: string;
  reportType: string;
  frequency: string;
  recipients: string;
  format: string;
  nextRunAt?: string;
  lastSentAt?: string;
  status: string;
}

export interface LearningQuestionModel {
  id?: number;
  courseCode: string;
  courseName?: string;
  questionTextVi?: string;
  questionTextEn?: string;
  questionTextFr?: string;
  questionTextHt?: string;
  options: string[];
  correctOptionIndex: number;
  audioUrl?: string;
  rewardPoints: number;
  status: string;
}

export interface GameStatisticsResponseModel {
  totalSessions: number;
  uniquePlayers: number;
  totalPointsAwarded: number;
  totalTurnsConsumed: number;
  byGame: Array<{
    gameCode: string;
    gameName: string;
    category: string;
    sessionsCount: number;
    winRatePercent: number;
    pointsAwarded: number;
  }>;
  recentSessions: Array<{
    sessionId: string;
    externalUserId: string;
    gameCode: string;
    prizeName: string;
    pointsWon: number;
    playedAt: string;
  }>;
}

export interface AgentLoyaltyItemModel {
  id: number;
  agentCode: string;
  agentName: string;
  phoneNumber: string;
  roleType: string;
  parentSuperAgentCode?: string;
  month: string;
  ekycNewCustomers: number;
  targetCustomers: number;
  subAgentsQualifiedPercent?: number;
  rewardAmount: number;
  rewardCurrency: string;
  rewardStatus: string;
}

export interface AgentTargetConfigModel {
  roleType: string;
  month: string;
  targetCustomers?: number;
  rewardAmount?: number;
  minQualifiedNetworkPercent?: number;
}

export interface SupportPlaybookModel {
  id?: number;
  playbookCode: string;
  title: string;
  category: string;
  summary: string;
  stepsMarkdown: string;
  updatedAt?: string;
}

export interface PartnerPortalDashboardModel {
  partnerCode: string;
  partnerName: string;
  payingCustomersCount: number;
  burnTransactionsCount: number;
  newMembersAcquired: number;
  coFundedBudgetCap: number;
  coFundedBudgetUsed: number;
  allianceCrossSellRatePercent: number;
  pendingSettlementAmount: number;
  recentTransactions?: PointLedgerItem[];
}

export interface PartnerBranchModel {
  id?: number;
  branchCode: string;
  branchName: string;
  paymentPointCode: string;
  province: string;
  address: string;
  status: string;
}

export interface PartnerProductGroupModel {
  id?: number;
  groupCode: string;
  groupName: string;
  earnMultiplier: number;
  allowBurn: boolean;
  productCount: number;
  status: string;
}

export interface PartnerStaffAccountModel {
  id?: number;
  username: string;
  fullName: string;
  phoneNumber: string;
  branchId: number;
  branchName?: string;
  roleCode: string;
  status: string;
  createdAt?: string;
}

export interface PartnerProgramProposalModel {
  id?: number;
  proposalCode?: string;
  programName: string;
  fundingType: string;
  proposedBudget: number;
  natcashCoFundPercent: number;
  earnRateBoostPercent: number;
  startDate: string;
  endDate: string;
  description: string;
  status: string;
  createdAt?: string;
}

export interface PartnerSettlementBatchModel {
  batchCode: string;
  periodFrom: string;
  periodTo: string;
  totalTransactions: number;
  grossAmount: number;
  discountAmount: number;
  mdrFeeAmount: number;
  netPayableAmount: number;
  confirmDeadlineAt: string;
  status: string;
}

export interface PartnerNotificationModel {
  id: number;
  title: string;
  category: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface PartnerApiKeyItemModel {
  id: number;
  keyPrefix: string;
  label?: string;
  status: string;
  expiresAt?: string;
  graceExpiresAt?: string;
  createdAt: string;
}

export interface PartnerApiKeyConfigModel {
  keys: PartnerApiKeyItemModel[];
  webhookUrl: string;
  webhookSecretPrefix?: string;
  ipWhitelist: string;
}

export interface RotateApiKeyResultModel {
  id: number;
  plainTextKey: string;
  keyPrefix: string;
  graceExpiresAt?: string;
  previousKeyId?: number;
}

export const loyaltyService = LoyaltyService;
