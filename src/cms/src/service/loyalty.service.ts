import { getStoredTenantId } from '@/utils/tenant';
import { RAW_TENANTS } from '@/components/TenantSelector';
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
  /** VQ-04 "How customers get it" / "How customers use it" (Figma 18/11) */
  acquireType?: 'COINS' | 'FREE_COLLECT' | 'GIVEN';
  usageType?: 'NATCASH_STORE' | 'PARTNER_CODE' | 'ONLINE';
  categoryCode?: string;
  audienceRole?: 'CUSTOMER' | 'AGENT' | 'SUPER_AGENT';
  eligibleTiers?: string[];
  perCustomerLimit?: number;
  batchQuantity?: number;
  batchPeriod?: 'NONE' | 'DAILY' | 'WEEKLY';
  validDaysAfterCollect?: number;
  requireEkyc?: boolean;
  showInFreeStrip?: boolean;
  stripOrder?: number;
  serviceLink?: string;
  branchScope?: string;
  imageUrl?: string;
  i18nJson?: string;
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
  audienceRole?: 'CUSTOMER' | 'AGENT' | 'SUPER_AGENT' | string;
  startDate?: string;
  endDate?: string;
  status: string;
}

export interface TierDistributionModel {
  tierId?: number;
  tierCode?: string;
  code?: string;
  tierName?: string;
  name?: string;
  tierLevel: number;
  pointMultiplier?: number;
  minPoints?: number;
  keepTierPoints?: number;
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
  async getTiers(tenantId: string = 'ALL'): Promise<TierConfigModel[]> {
    try {
      if (!tenantId || tenantId === 'ALL') {
        const results = await Promise.all(
          RAW_TENANTS.map(async (t) => {
            try {
              const res: any = await apiClient.get('/loyalty/v1/tiers', {
                headers: { 'X-Tenant-Id': t.id },
              });
              if (Array.isArray(res)) return res;
              if (res && Array.isArray(res.data)) return res.data;
              return [];
            } catch {
              return [];
            }
          })
        );
        const map = new Map<number, TierConfigModel>();
        results.flat().forEach((tier) => {
          if (tier && tier.tierLevel && !map.has(tier.tierLevel)) {
            map.set(tier.tierLevel, tier);
          }
        });
        const list = Array.from(map.values()).sort((a, b) => (a.tierLevel || 0) - (b.tierLevel || 0));
        if (list.length > 0) return list;
      }
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

  async saveTier(tier: Partial<TierConfigModel>, tenantId: string = getStoredTenantId()): Promise<any> {
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

  async deleteTier(id: number, tenantId: string = getStoredTenantId()): Promise<any> {
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
  async getPolicies(tenantId: string = getStoredTenantId()): Promise<PolicyRuleModel[]> {
    try {
      if (!tenantId || tenantId === 'ALL') {
        const results = await Promise.all(
          RAW_TENANTS.map(async (t) => {
            try {
              const res: any = await apiClient.get('/loyalty/v1/policies', {
                headers: { 'X-Tenant-Id': t.id },
              });
              const d = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
              return d;
            } catch {
              return [];
            }
          })
        );
        const map = new Map<number, any>();
        results.flat().forEach((p) => {
          if (p && p.id) map.set(p.id, p);
        });
        const data = Array.from(map.values());
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
      }
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

  async getPartners(tenantId: string = getStoredTenantId()): Promise<any[]> {
    try {
      if (!tenantId || tenantId === 'ALL') {
        const results = await Promise.all(
          RAW_TENANTS.map(async (t) => {
            try {
              const res: any = await apiClient.get('/loyalty/v1/partners', {
                headers: { 'X-Tenant-Id': t.id },
              });
              const d = Array.isArray(res) ? res : (res?.data || []);
              return d;
            } catch {
              return [];
            }
          })
        );
        const map = new Map<number, any>();
        results.flat().forEach((p) => {
          if (p && p.id) map.set(p.id, p);
        });
        const data = Array.from(map.values());
        return data.map((p: any) => ({
          id: p.id,
          partnerCode: p.partnerCode,
          partnerName: p.partnerName,
          partnerType: p.partnerType || 'RETAIL',
          status: p.status || 'ACTIVE',
        }));
      }
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

  async createPolicy(data: Partial<PolicyRuleModel>, tenantId: string = getStoredTenantId()): Promise<PolicyRuleModel> {
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

  async updatePolicy(id: number, data: Partial<PolicyRuleModel>, tenantId: string = getStoredTenantId()): Promise<PolicyRuleModel> {
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

  async deletePolicy(id: number, tenantId: string = getStoredTenantId()): Promise<void> {
    await apiClient.delete(`/loyalty/v1/policies/${id}`, {
      headers: { 'X-Tenant-Id': tenantId },
    });
  },

  // 3. Quản lý Kho Voucher Khuyến Mãi (CRUD)
  async getVouchers(tenantId: string = getStoredTenantId()): Promise<VoucherItemModel[]> {
    try {
      if (!tenantId || tenantId === 'ALL') {
        const results = await Promise.all(
          RAW_TENANTS.map(async (t) => {
            try {
              const res: any = await apiClient.get('/loyalty/v1/vouchers', {
                headers: { 'X-Tenant-Id': t.id },
              });
              if (Array.isArray(res)) return res;
              if (res && Array.isArray(res.data)) return res.data;
              return [];
            } catch {
              return [];
            }
          })
        );
        const map = new Map<number, VoucherItemModel>();
        results.flat().forEach((v) => {
          if (v && v.id) map.set(v.id, v);
        });
        return Array.from(map.values());
      }
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

  async createVoucher(data: Partial<VoucherItemModel>, tenantId: string = getStoredTenantId()): Promise<VoucherItemModel> {
    const response: any = await apiClient.post('/loyalty/v1/vouchers', data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return response?.data || response;
  },

  async updateVoucher(id: number, data: Partial<VoucherItemModel>, tenantId: string = getStoredTenantId()): Promise<VoucherItemModel> {
    const response: any = await apiClient.put(`/loyalty/v1/vouchers/${id}`, data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return response?.data || response;
  },

  async deleteVoucher(id: number, tenantId: string = getStoredTenantId()): Promise<void> {
    await apiClient.delete(`/loyalty/v1/vouchers/${id}`, {
      headers: { 'X-Tenant-Id': tenantId },
    });
  },

  async batchImportVouchers(data: Partial<VoucherItemModel>[], tenantId: string = getStoredTenantId()): Promise<VoucherItemModel[]> {
    const response: any = await apiClient.post('/loyalty/v1/vouchers/batch-import', data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return response?.data || response;
  },

  // 4. Quản lý Cột Mốc Chiến Dịch (Milestones CRUD)
  async getMilestones(tenantId: string = getStoredTenantId()): Promise<MilestoneItemModel[]> {
    try {
      if (!tenantId || tenantId === 'ALL') {
        const results = await Promise.all(
          RAW_TENANTS.map(async (t) => {
            try {
              const res: any = await apiClient.get('/loyalty/v1/milestones/admin-list', {
                headers: { 'X-Tenant-Id': t.id },
              });
              const d = Array.isArray(res)
                ? res
                : Array.isArray(res?.data)
                ? res.data
                : Array.isArray(res?.data?.data)
                ? res.data.data
                : Array.isArray(res?.content)
                ? res.content
                : [];
              return d;
            } catch {
              return [];
            }
          })
        );
        const map = new Map<number, any>();
        results.flat().forEach((m) => {
          if (m && m.id) map.set(m.id, m);
        });
        const data = Array.from(map.values());
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
      }
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

  async createMilestone(data: Partial<MilestoneItemModel>, tenantId: string = getStoredTenantId()): Promise<MilestoneItemModel> {
    const response: any = await apiClient.post('/loyalty/v1/milestones', data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return response?.data || response;
  },

  async updateMilestone(id: number, data: Partial<MilestoneItemModel>, tenantId: string = getStoredTenantId()): Promise<MilestoneItemModel> {
    const response: any = await apiClient.put(`/loyalty/v1/milestones/${id}`, data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return response?.data || response;
  },

  async deleteMilestone(id: number, tenantId: string = getStoredTenantId()): Promise<void> {
    await apiClient.delete(`/loyalty/v1/milestones/${id}`, {
      headers: { 'X-Tenant-Id': tenantId },
    });
  },

  // 5. Bù Trừ & Quyết Toán Đối Soát Tài Chính
  async getClearingReport(tenantId: string = getStoredTenantId(), fromDate?: string, toDate?: string): Promise<ClearingReportModel> {
    const from = fromDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const to = toDate || new Date().toISOString();
    try {
      if (!tenantId || tenantId === 'ALL') {
        const results = await Promise.all(
          RAW_TENANTS.map(async (t) => {
            try {
              const res: any = await apiClient.post(
                '/loyalty/v1/clearinghouse/reconciliation-report',
                { fromDate: from, toDate: to },
                { headers: { 'X-Tenant-Id': t.id } }
              );
              return res?.data || res;
            } catch {
              return null;
            }
          })
        );
        const valid = results.filter(Boolean);
        if (valid.length > 0) {
          const pMap = new Map<number, any>();
          let grandTx = 0, grandIssued = 0, grandRedeemed = 0, grandPayable = 0, grandReceivable = 0, grandFiat = 0, grandNet = 0;
          valid.forEach((r) => {
            grandTx += r.grandTotalTransactions || 0;
            grandIssued += r.grandTotalPointsIssued || 0;
            grandRedeemed += r.grandTotalPointsRedeemed || 0;
            grandPayable += r.grandTotalFiatPayable || 0;
            grandReceivable += r.grandTotalFiatReceivable || 0;
            grandFiat += r.grandTotalFiatAmount || 0;
            grandNet += r.grandTotalNetSettlement || 0;
            if (Array.isArray(r.partnerSummaries)) {
              r.partnerSummaries.forEach((p: any) => {
                if (p && p.partnerId) {
                  if (pMap.has(p.partnerId)) {
                    const ex = pMap.get(p.partnerId);
                    ex.transactionsCount = (ex.transactionsCount || 0) + (p.transactionsCount || 0);
                    ex.pointsIssued = (ex.pointsIssued || 0) + (p.pointsIssued || 0);
                    ex.pointsRedeemed = (ex.pointsRedeemed || 0) + (p.pointsRedeemed || 0);
                    ex.netClearingBalance = (ex.netClearingBalance || 0) + (p.netClearingBalance || 0);
                  } else {
                    pMap.set(p.partnerId, { ...p });
                  }
                }
              });
            }
          });
          return {
            periodFrom: from,
            periodTo: to,
            grandTotalTransactions: grandTx,
            grandTotalPointsIssued: grandIssued,
            grandTotalPointsRedeemed: grandRedeemed,
            grandTotalFiatPayable: grandPayable,
            grandTotalFiatReceivable: grandReceivable,
            grandTotalFiatAmount: grandFiat,
            grandTotalNetSettlement: grandNet,
            partnerSummaries: Array.from(pMap.values()),
            generatedAt: new Date().toISOString(),
          };
        }
      }
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

  async settleClearingPeriod(tenantId: string = getStoredTenantId(), fromDate?: string, toDate?: string, remarks?: string): Promise<any> {
    const from = fromDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const to = toDate || new Date().toISOString();
    const response: any = await apiClient.post(
      '/loyalty/v1/clearinghouse/settle-period',
      { fromDate: from, toDate: to, remarks: remarks || '' },
      { headers: { 'X-Tenant-Id': tenantId } }
    );
    return response?.data || response;
  },

  async getPartnerClearingTransactions(tenantId: string = getStoredTenantId(), partnerId: number, fromDate: string, toDate: string): Promise<PartnerTransactionsResponseModel> {
    const response: any = await apiClient.get('/loyalty/v1/clearinghouse/partner-transactions', {
      params: { partnerId, fromDate, toDate },
      headers: { 'X-Tenant-Id': tenantId },
    });
    return response?.data || response;
  },

  async getDisputes(tenantId: string = getStoredTenantId()): Promise<DisputeItemModel[]> {
    try {
      if (!tenantId || tenantId === 'ALL') {
        const results = await Promise.all(
          RAW_TENANTS.map(async (t) => {
            try {
              const res: any = await apiClient.get('/loyalty/v1/clearinghouse/disputes', {
                headers: { 'X-Tenant-Id': t.id },
              });
              if (Array.isArray(res)) return res;
              if (res && Array.isArray(res.data)) return res.data;
              return [];
            } catch {
              return [];
            }
          })
        );
        const map = new Map<string, any>();
        results.flat().forEach((d) => {
          if (d && d.disputeCode && !map.has(d.disputeCode)) {
            map.set(d.disputeCode, d);
          }
        });
        return Array.from(map.values());
      }
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

  async resolveDispute(disputeCode: string, status: string, resolvedAmount?: number, note?: string, tenantId: string = getStoredTenantId()): Promise<any> {
    const response: any = await apiClient.post(
      `/loyalty/v1/clearinghouse/disputes/${disputeCode}/resolve`,
      { status, resolvedAmount, note },
      { headers: { 'X-Tenant-Id': tenantId } }
    );
    return response?.data || response;
  },

  // 6. Số liệu thống kê Dashboard
  async getDashboardStats(tenantId: string = getStoredTenantId()): Promise<DashboardStatsModel> {
    try {
      if (!tenantId || tenantId === 'ALL') {
        const results = await Promise.all(
          RAW_TENANTS.map(async (t) => {
            try {
              const res: any = await apiClient.get('/loyalty/v1/dashboard/stats', {
                headers: { 'X-Tenant-Id': t.id },
              });
              return res?.data || res;
            } catch {
              return null;
            }
          })
        );
        const valid = results.filter(Boolean);
        if (valid.length > 0) {
          let totalMembers = 0, activeMembers = 0, totalEarned = 0, totalBurned = 0, activeVouchers = 0, totalTx = 0, clearingAmt = 0;
          const tierMap = new Map<number, any>();
          valid.forEach((s) => {
            totalMembers += s.totalMembers || 0;
            activeMembers += s.activeMembers || 0;
            totalEarned += s.totalEarnedPoints || 0;
            totalBurned += s.totalBurnedPoints || 0;
            activeVouchers += s.activeVouchers || 0;
            totalTx += s.totalTransactions || 0;
            clearingAmt += s.clearingSettledAmount || 0;
            if (Array.isArray(s.tierDistributions)) {
              s.tierDistributions.forEach((td: any) => {
                if (td && td.tierLevel != null) {
                  const ex = tierMap.get(td.tierLevel) || { ...td, memberCount: 0 };
                  ex.memberCount += td.memberCount || 0;
                  tierMap.set(td.tierLevel, ex);
                }
              });
            }
          });
          const tierDistributions = Array.from(tierMap.values()).map((td) => ({
            ...td,
            percentage: totalMembers > 0 ? Math.round((td.memberCount / totalMembers) * 100) : 0,
          }));
          return {
            totalMembers,
            activeMembers,
            totalEarnedPoints: totalEarned,
            totalBurnedPoints: totalBurned,
            activeVouchers,
            totalTransactions: totalTx,
            clearingSettledAmount: clearingAmt,
            uptimePercent: 100.0,
            tierDistributions,
          };
        }
      }
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
  async getSystemHealth(tenantId: string = getStoredTenantId()): Promise<SystemHealthResponseModel> {
    try {
      const response: any = await apiClient.get('/loyalty/v1/dashboard/health', {
        headers: { 'X-Tenant-Id': tenantId === 'ALL' ? 'TENANT_NATCASH' : tenantId },
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
    tenantId: string = getStoredTenantId(),
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
  async getGames(tenantId: string = 'ALL'): Promise<any[]> {
    try {
      if (!tenantId || tenantId === 'ALL') {
        const results = await Promise.all(
          RAW_TENANTS.map(async (t) => {
            try {
              const res: any = await apiClient.get('/gamehub/v1/admin/games', {
                headers: { 'X-Tenant-Id': t.id },
              });
              if (Array.isArray(res) && res.length > 0) return res;
              if (res && Array.isArray(res.data) && res.data.length > 0) return res.data;
              return [];
            } catch {
              return [];
            }
          })
        );
        const map = new Map<string, any>();
        results.flat().forEach((g) => {
          if (g && g.gameCode && !map.has(g.gameCode)) {
            map.set(g.gameCode, g);
          }
        });
        const list = Array.from(map.values());
        if (list.length > 0) return list;
      }
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

  async saveGame(data: any, tenantId: string = getStoredTenantId()): Promise<any> {
    const response: any = await apiClient.post('/gamehub/v1/admin/games', data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return response?.data || response;
  },

  async deleteGame(gameId: number | string, tenantId: string = getStoredTenantId()): Promise<any> {
    const response: any = await apiClient.delete(`/gamehub/v1/admin/games/${gameId}`, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return response?.data || response;
  },

  async getGlobalGameConfig(tenantId: string = getStoredTenantId()): Promise<any> {
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

  async saveGlobalGameConfig(data: any, tenantId: string = getStoredTenantId()): Promise<any> {
    const response: any = await apiClient.post('/gamehub/v1/admin/config', data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return response?.data || response;
  },

  async getWheelPrizes(tenantId: string = getStoredTenantId(), wheelCode: string = 'LUCKY_WHEEL'): Promise<any[]> {
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

  async saveWheelPrize(data: any, tenantId: string = getStoredTenantId(), wheelCode: string = 'LUCKY_WHEEL'): Promise<any> {
    const response: any = await apiClient.post(`/loyalty/v1/luckydraw/admin/prizes?wheelCode=${wheelCode}`, data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return response?.data || response;
  },

  async autoBalanceWheelPrizes(tenantId: string = getStoredTenantId(), wheelCode: string = 'LUCKY_WHEEL'): Promise<any> {
    const response: any = await apiClient.post(`/loyalty/v1/luckydraw/admin/prizes/auto-balance?wheelCode=${wheelCode}`, {}, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return response?.data || response;
  },

  async getGamePrizes(gameCode: string, tenantId: string = getStoredTenantId()): Promise<any[]> {
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

  async saveGamePrize(gameCode: string, data: any, tenantId: string = getStoredTenantId()): Promise<any> {
    const response: any = await apiClient.post(`/gamehub/v1/admin/games/${gameCode}/prizes`, data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return response?.data || response;
  },

  async deleteGamePrize(prizeId: number, tenantId: string = getStoredTenantId()): Promise<any> {
    const response: any = await apiClient.delete(`/gamehub/v1/admin/prizes/${prizeId}`, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return response?.data || response;
  },

  async autoBalanceGamePrizes(gameCode: string, tenantId: string = getStoredTenantId()): Promise<any> {
    const response: any = await apiClient.post(`/gamehub/v1/admin/games/${gameCode}/prizes/auto-balance`, {}, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return response?.data || response;
  },

  async getGameDashboardStats(tenantId: string = getStoredTenantId()): Promise<GameDashboardStats> {
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
    tenantId: string = getStoredTenantId()
  ): Promise<ApprovalRequestModel[]> {
    try {
      if (!tenantId || tenantId === 'ALL') {
        const results = await Promise.all(
          RAW_TENANTS.map(async (t) => {
            try {
              const res: any = await apiClient.get('/loyalty/v1/approvals', {
                params,
                headers: { 'X-Tenant-Id': t.id },
              });
              return unwrapList<ApprovalRequestModel>(res);
            } catch {
              return [];
            }
          })
        );
        const map = new Map<number, ApprovalRequestModel>();
        results.flat().forEach((item) => {
          if (item && item.id) map.set(item.id, item);
        });
        return Array.from(map.values());
      }
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
    tenantId: string = getStoredTenantId()
  ): Promise<ApprovalRequestModel> {
    const response: any = await apiClient.post('/loyalty/v1/approvals', data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return unwrapObject<ApprovalRequestModel>(response);
  },

  async approveRequest(
    requestId: number | string,
    reason?: string,
    tenantId: string = getStoredTenantId()
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
    tenantId: string = getStoredTenantId()
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
    tenantId: string = getStoredTenantId()
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
    tenantId: string = getStoredTenantId()
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
    tenantId: string = getStoredTenantId()
  ): Promise<PointAdjustmentModel> {
    const response: any = await apiClient.post('/loyalty/v1/ledger/adjustments', data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return unwrapObject<PointAdjustmentModel>(response);
  },

  async getMemberProfile360(
    externalUserId: string,
    tenantId: string = getStoredTenantId()
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
    tenantId: string = getStoredTenantId()
  ): Promise<ApprovalRequestModel> {
    const response: any = await apiClient.post(
      `/loyalty/v1/accounts/${encodeURIComponent(externalUserId)}/lock-request`,
      data,
      { headers: { 'X-Tenant-Id': tenantId } }
    );
    return unwrapObject<ApprovalRequestModel>(response);
  },

  async getTierDistribution(tenantId: string = 'ALL'): Promise<TierDistributionModel[]> {
    try {
      if (!tenantId || tenantId === 'ALL') {
        const results = await Promise.all(
          RAW_TENANTS.map(async (t) => {
            try {
              const res: any = await apiClient.get('/loyalty/v1/tiers/distribution', {
                headers: { 'X-Tenant-Id': t.id },
              });
              return unwrapList<TierDistributionModel>(res);
            } catch {
              return [];
            }
          })
        );
        const map = new Map<number, TierDistributionModel>();
        results.flat().forEach((d) => {
          if (d && d.tierLevel) {
            const existing = map.get(d.tierLevel);
            if (existing) {
              map.set(d.tierLevel, {
                ...existing,
                memberCount: (existing.memberCount || 0) + (d.memberCount || 0),
              });
            } else {
              map.set(d.tierLevel, { ...d });
            }
          }
        });
        return Array.from(map.values()).sort((a, b) => (a.tierLevel || 0) - (b.tierLevel || 0));
      }
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
    tenantId: string = getStoredTenantId()
  ): Promise<NatcashPaymentPointModel[]> {
    try {
      if (!tenantId || tenantId === 'ALL') {
        const results = await Promise.all(
          RAW_TENANTS.map(async (t) => {
            try {
              const res: any = await apiClient.get('/loyalty/v1/payment-points', {
                params,
                headers: { 'X-Tenant-Id': t.id },
              });
              return unwrapList<NatcashPaymentPointModel>(res);
            } catch {
              return [];
            }
          })
        );
        const map = new Map<number, NatcashPaymentPointModel>();
        results.flat().forEach((item) => {
          if (item && item.id) map.set(item.id, item);
        });
        return Array.from(map.values());
      }
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
    tenantId: string = getStoredTenantId()
  ): Promise<NatcashPaymentPointModel> {
    const response: any = await apiClient.post('/loyalty/v1/payment-points', data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return unwrapObject<NatcashPaymentPointModel>(response);
  },

  async updatePaymentPoint(
    id: number,
    data: Partial<NatcashPaymentPointModel>,
    tenantId: string = getStoredTenantId()
  ): Promise<NatcashPaymentPointModel> {
    const response: any = await apiClient.put(`/loyalty/v1/payment-points/${id}`, data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return unwrapObject<NatcashPaymentPointModel>(response);
  },

  async deletePaymentPoint(id: number, tenantId: string = getStoredTenantId()): Promise<void> {
    await apiClient.delete(`/loyalty/v1/payment-points/${id}`, {
      headers: { 'X-Tenant-Id': tenantId },
    });
  },

  async getIntegrationsOverview(tenantId: string = getStoredTenantId()): Promise<SystemIntegrationItemModel[]> {
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
  async getClearingBatches(tenantId: string = getStoredTenantId()): Promise<ClearingPaymentBatchModel[]> {
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
    tenantId: string = getStoredTenantId()
  ): Promise<ClearingPaymentBatchModel> {
    const response: any = await apiClient.post('/loyalty/v1/clearinghouse/batches', data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return unwrapObject<ClearingPaymentBatchModel>(response);
  },

  async confirmClearingBatch(
    batchCode: string,
    tenantId: string = getStoredTenantId()
  ): Promise<ClearingPaymentBatchModel> {
    const response: any = await apiClient.post(
      `/loyalty/v1/partner-portal/settlements/${encodeURIComponent(batchCode)}/confirm`,
      { confirmedBy: 'cms_admin' },
      { headers: { 'X-Tenant-Id': tenantId } }
    );
    return unwrapObject<ClearingPaymentBatchModel>(response);
  },

  // 14. Bộ dựng luật chiến dịch (NV-05), Theo dõi (NV-06), AI Copilot (AI-01) & Ngân sách (NS-01)
  async getCampaignRules(tenantId: string = getStoredTenantId()): Promise<CampaignRuleModel[]> {
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
    tenantId: string = getStoredTenantId()
  ): Promise<CampaignRuleModel> {
    const response: any = await apiClient.post('/loyalty/v1/campaigns/rules', data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return unwrapObject<CampaignRuleModel>(response);
  },

  async deleteCampaignRule(id: number, tenantId: string = getStoredTenantId()): Promise<void> {
    await apiClient.delete(`/loyalty/v1/campaigns/rules/${id}`, {
      headers: { 'X-Tenant-Id': tenantId },
    });
  },

  async getCampaignTracking(tenantId: string = getStoredTenantId()): Promise<CampaignTrackingItemModel[]> {
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
    tenantId: string = getStoredTenantId()
  ): Promise<AiCopilotSuggestResponse> {
    const response: any = await apiClient.post('/loyalty/v1/ai-copilot/suggest', data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return unwrapObject<AiCopilotSuggestResponse>(response);
  },

  async getBudgets(
    params?: { budgetMonth?: string },
    tenantId: string = getStoredTenantId()
  ): Promise<MonthlyBudgetModel[]> {
    try {
      if (!tenantId || tenantId === 'ALL') {
        const results = await Promise.all(
          RAW_TENANTS.map(async (t) => {
            try {
              const res: any = await apiClient.get('/loyalty/v1/budgets', {
                params,
                headers: { 'X-Tenant-Id': t.id },
              });
              return unwrapList<MonthlyBudgetModel>(res);
            } catch {
              return [];
            }
          })
        );
        const map = new Map<number, MonthlyBudgetModel>();
        results.flat().forEach((b) => {
          if (b && b.id) map.set(b.id, b);
        });
        return Array.from(map.values());
      }
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
    tenantId: string = getStoredTenantId()
  ): Promise<MonthlyBudgetModel> {
    const response: any = await apiClient.post('/loyalty/v1/budgets', data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return unwrapObject<MonthlyBudgetModel>(response);
  },

  // 15. Phân khúc (CN-03), Kịch bản nhắc nhở (CN-04) & Trung tâm cảnh báo (CN-05)
  async getSegments(tenantId: string = getStoredTenantId()): Promise<CustomerSegmentModel[]> {
    try {
      if (!tenantId || tenantId === 'ALL') {
        const results = await Promise.all(
          RAW_TENANTS.map(async (t) => {
            try {
              const res: any = await apiClient.get('/loyalty/v1/segments', {
                headers: { 'X-Tenant-Id': t.id },
              });
              return unwrapList<CustomerSegmentModel>(res);
            } catch {
              return [];
            }
          })
        );
        const map = new Map<string, CustomerSegmentModel>();
        results.flat().forEach((s) => {
          if (s && s.segmentCode && !map.has(s.segmentCode)) {
            map.set(s.segmentCode, s);
          }
        });
        return Array.from(map.values());
      }
      const response: any = await apiClient.get('/loyalty/v1/segments', {
        headers: { 'X-Tenant-Id': tenantId },
      });
      return unwrapList<CustomerSegmentModel>(response);
    } catch (e) {
      console.error('[getSegments] Error:', e);
      return [];
    }
  },

  async recalculateSegment(_segmentId: number, tenantId: string = getStoredTenantId()): Promise<any> {
    const response: any = await apiClient.post(
      '/loyalty/v1/segments/recalculate',
      {},
      { headers: { 'X-Tenant-Id': tenantId } }
    );
    return unwrapObject<any>(response);
  },

  async getSegmentMembers(
    segmentCode: string,
    tenantId: string = getStoredTenantId()
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

  async getReminderScenarios(tenantId: string = getStoredTenantId()): Promise<ReminderScenarioModel[]> {
    try {
      if (!tenantId || tenantId === 'ALL') {
        const results = await Promise.all(
          RAW_TENANTS.map(async (t) => {
            try {
              const res: any = await apiClient.get('/loyalty/v1/engagement/scenarios', {
                headers: { 'X-Tenant-Id': t.id },
              });
              return unwrapList<ReminderScenarioModel>(res);
            } catch {
              return [];
            }
          })
        );
        const map = new Map<string, ReminderScenarioModel>();
        results.flat().forEach((s) => {
          if (s && s.scenarioCode && !map.has(s.scenarioCode)) {
            map.set(s.scenarioCode, s);
          }
        });
        return Array.from(map.values());
      }
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
    tenantId: string = getStoredTenantId()
  ): Promise<ReminderScenarioModel> {
    const response: any = await apiClient.post('/loyalty/v1/engagement/scenarios', data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return unwrapObject<ReminderScenarioModel>(response);
  },

  async getReminderSendLogs(tenantId: string = getStoredTenantId()): Promise<ReminderSendLogModel[]> {
    try {
      if (!tenantId || tenantId === 'ALL') {
        const results = await Promise.all(
          RAW_TENANTS.map(async (t) => {
            try {
              const res: any = await apiClient.get('/loyalty/v1/engagement/scenarios', {
                headers: { 'X-Tenant-Id': t.id },
              });
              return unwrapList<ReminderSendLogModel>(res);
            } catch {
              return [];
            }
          })
        );
        const map = new Map<number, ReminderSendLogModel>();
        results.flat().forEach((l) => {
          if (l && l.id) map.set(l.id, l);
        });
        return Array.from(map.values());
      }
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
    tenantId: string = getStoredTenantId()
  ): Promise<SystemAlertModel[]> {
    try {
      if (!tenantId || tenantId === 'ALL') {
        const results = await Promise.all(
          RAW_TENANTS.map(async (t) => {
            try {
              const res: any = await apiClient.get('/loyalty/v1/alerts', {
                params,
                headers: { 'X-Tenant-Id': t.id },
              });
              return unwrapList<SystemAlertModel>(res);
            } catch {
              return [];
            }
          })
        );
        const map = new Map<string, SystemAlertModel>();
        results.flat().forEach((a) => {
          if (a && a.alertCode && !map.has(a.alertCode)) {
            map.set(a.alertCode, a);
          }
        });
        return Array.from(map.values());
      }
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

  async acknowledgeAlert(id: number, tenantId: string = getStoredTenantId()): Promise<SystemAlertModel> {
    const response: any = await apiClient.post(
      `/loyalty/v1/alerts/${id}/acknowledge`,
      {},
      { headers: { 'X-Tenant-Id': tenantId } }
    );
    return unwrapObject<SystemAlertModel>(response);
  },

  async resolveAlert(id: number, _note?: string, tenantId: string = getStoredTenantId()): Promise<SystemAlertModel> {
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
    tenantId: string = getStoredTenantId()
  ): Promise<ProgramEffectivenessModel[]> {
    try {
      if (!tenantId || tenantId === 'ALL') {
        const results = await Promise.all(
          RAW_TENANTS.map(async (t) => {
            try {
              const res: any = await apiClient.get('/loyalty/v1/reports/effectiveness', {
                params,
                headers: { 'X-Tenant-Id': t.id },
              });
              return unwrapList<ProgramEffectivenessModel>(res);
            } catch {
              return [];
            }
          })
        );
        const map = new Map<string, ProgramEffectivenessModel>();
        results.flat().forEach((item) => {
          if (item && item.campaignCode && !map.has(item.campaignCode)) {
            map.set(item.campaignCode, item);
          }
        });
        return Array.from(map.values());
      }
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
    tenantId: string = getStoredTenantId()
  ): Promise<CrossSellReportModel[]> {
    try {
      if (!tenantId || tenantId === 'ALL') {
        const results = await Promise.all(
          RAW_TENANTS.map(async (t) => {
            try {
              const res: any = await apiClient.get('/loyalty/v1/reports/cross-sell', {
                params,
                headers: { 'X-Tenant-Id': t.id },
              });
              return unwrapList<CrossSellReportModel>(res);
            } catch {
              return [];
            }
          })
        );
        const map = new Map<string, CrossSellReportModel>();
        results.flat().forEach((c) => {
          const key = `${c.sourcePartnerCode}_${c.targetPartnerCode}`;
          if (!map.has(key)) map.set(key, c);
        });
        return Array.from(map.values());
      }
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
    tenantId: string = getStoredTenantId()
  ): Promise<PointsLiabilityReportModel | null> {
    try {
      const response: any = await apiClient.get('/loyalty/v1/reports/points-liability', {
        headers: { 'X-Tenant-Id': tenantId === 'ALL' ? 'TENANT_NATCASH' : tenantId },
      });
      return unwrapObject<PointsLiabilityReportModel>(response);
    } catch (e) {
      console.error('[getPointsLiabilityReport] Error:', e);
      return null;
    }
  },

  async getReportSchedules(tenantId: string = getStoredTenantId()): Promise<ScheduledReportModel[]> {
    try {
      if (!tenantId || tenantId === 'ALL') {
        const results = await Promise.all(
          RAW_TENANTS.map(async (t) => {
            try {
              const res: any = await apiClient.get('/loyalty/v1/reports/schedules', {
                headers: { 'X-Tenant-Id': t.id },
              });
              return unwrapList<ScheduledReportModel>(res);
            } catch {
              return [];
            }
          })
        );
        const map = new Map<number, ScheduledReportModel>();
        results.flat().forEach((s) => {
          if (s && s.id) map.set(s.id, s);
        });
        return Array.from(map.values());
      }
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
    tenantId: string = getStoredTenantId()
  ): Promise<ScheduledReportModel> {
    const response: any = await apiClient.post('/loyalty/v1/reports/schedules', data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return unwrapObject<ScheduledReportModel>(response);
  },

  async deleteReportSchedule(id: number, tenantId: string = getStoredTenantId()): Promise<void> {
    await apiClient.delete(`/loyalty/v1/reports/schedules/${id}`, {
      headers: { 'X-Tenant-Id': tenantId },
    });
  },

  // 17. Ngân hàng câu hỏi Học tập (GM-09) & Thống kê Game (GM-07)
  async getLearningQuestions(
    params?: { courseCode?: string },
    tenantId: string = getStoredTenantId()
  ): Promise<LearningQuestionModel[]> {
    try {
      if (!tenantId || tenantId === 'ALL') {
        const results = await Promise.all(
          RAW_TENANTS.map(async (t) => {
            try {
              const res: any = await apiClient.get('/loyalty/v1/admin/learning/questions', {
                params,
                headers: { 'X-Tenant-Id': t.id },
              });
              return unwrapList<LearningQuestionModel>(res);
            } catch {
              return [];
            }
          })
        );
        const map = new Map<number, LearningQuestionModel>();
        results.flat().forEach((q) => {
          if (q && q.id) map.set(q.id, q);
        });
        return Array.from(map.values());
      }
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
    tenantId: string = getStoredTenantId()
  ): Promise<LearningQuestionModel> {
    const response: any = await apiClient.post('/loyalty/v1/admin/learning/questions', data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return unwrapObject<LearningQuestionModel>(response);
  },

  async deleteLearningQuestion(id: number, tenantId: string = getStoredTenantId()): Promise<void> {
    await apiClient.delete(`/loyalty/v1/admin/learning/questions/${id}`, {
      headers: { 'X-Tenant-Id': tenantId },
    });
  },

  async importLearningQuestions(
    questions: Partial<LearningQuestionModel>[],
    tenantId: string = getStoredTenantId()
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
    tenantId: string = getStoredTenantId()
  ): Promise<GameStatisticsResponseModel | null> {
    try {
      const response: any = await apiClient.get('/loyalty/v1/admin/games/statistics', {
        params,
        headers: { 'X-Tenant-Id': tenantId === 'ALL' ? 'TENANT_NATCASH' : tenantId },
      });
      return unwrapObject<GameStatisticsResponseModel>(response);
    } catch (e) {
      console.error('[getGameStatistics] Error:', e);
      return null;
    }
  },

  // 17b. Bảng xếp hạng Game points & Giải thưởng (GM-10 · Figma 18/11)
  async getLeaderboardRulesAdmin(tenantId: string = getStoredTenantId()): Promise<GamePointRuleModel[]> {
    try {
      const res: any = await apiClient.get('/gamehub/v1/admin/leaderboard/rules', {
        headers: { 'X-Tenant-Id': tenantId === 'ALL' ? 'TENANT_NATCASH' : tenantId },
      });
      return unwrapList<GamePointRuleModel>(res);
    } catch {
      return [];
    }
  },

  async saveLeaderboardRuleAdmin(data: Partial<GamePointRuleModel>, tenantId: string = getStoredTenantId()): Promise<GamePointRuleModel> {
    const res: any = await apiClient.post('/gamehub/v1/admin/leaderboard/rules', data, {
      headers: { 'X-Tenant-Id': tenantId === 'ALL' ? 'TENANT_NATCASH' : tenantId },
    });
    return unwrapObject<GamePointRuleModel>(res);
  },

  async getLeaderboardPrizesAdmin(tenantId: string = getStoredTenantId()): Promise<LeaderboardPrizeModel[]> {
    try {
      const res: any = await apiClient.get('/gamehub/v1/admin/leaderboard/prizes', {
        headers: { 'X-Tenant-Id': tenantId === 'ALL' ? 'TENANT_NATCASH' : tenantId },
      });
      return unwrapList<LeaderboardPrizeModel>(res);
    } catch {
      return [];
    }
  },

  async saveLeaderboardPrizeAdmin(data: Partial<LeaderboardPrizeModel>, tenantId: string = getStoredTenantId()): Promise<LeaderboardPrizeModel> {
    const res: any = await apiClient.post('/gamehub/v1/admin/leaderboard/prizes', data, {
      headers: { 'X-Tenant-Id': tenantId === 'ALL' ? 'TENANT_NATCASH' : tenantId },
    });
    return unwrapObject<LeaderboardPrizeModel>(res);
  },

  async deleteLeaderboardPrizeAdmin(id: number, tenantId: string = getStoredTenantId()): Promise<void> {
    await apiClient.delete(`/gamehub/v1/admin/leaderboard/prizes/${id}`, {
      headers: { 'X-Tenant-Id': tenantId === 'ALL' ? 'TENANT_NATCASH' : tenantId },
    });
  },

  async getLeaderboardPayoutsAdmin(month?: string, tenantId: string = getStoredTenantId()): Promise<LeaderboardPayoutModel[]> {
    try {
      const res: any = await apiClient.get('/gamehub/v1/admin/leaderboard/payouts', {
        params: month ? { month } : undefined,
        headers: { 'X-Tenant-Id': tenantId === 'ALL' ? 'TENANT_NATCASH' : tenantId },
      });
      return unwrapList<LeaderboardPayoutModel>(res);
    } catch {
      return [];
    }
  },

  async closeLeaderboardMonthAdmin(month?: string, tenantId: string = getStoredTenantId()): Promise<LeaderboardPayoutModel[]> {
    const res: any = await apiClient.post('/gamehub/v1/admin/leaderboard/close-month', null, {
      params: month ? { month } : undefined,
      headers: { 'X-Tenant-Id': tenantId === 'ALL' ? 'TENANT_NATCASH' : tenantId },
    });
    return unwrapList<LeaderboardPayoutModel>(res);
  },

  async approveLeaderboardPayoutAdmin(id: number, tenantId: string = getStoredTenantId()): Promise<LeaderboardPayoutModel> {
    const res: any = await apiClient.post(`/gamehub/v1/admin/leaderboard/payouts/${id}/approve`, null, {
      headers: { 'X-Tenant-Id': tenantId === 'ALL' ? 'TENANT_NATCASH' : tenantId },
    });
    return unwrapObject<LeaderboardPayoutModel>(res);
  },

  async rejectLeaderboardPayoutAdmin(id: number, tenantId: string = getStoredTenantId()): Promise<LeaderboardPayoutModel> {
    const res: any = await apiClient.post(`/gamehub/v1/admin/leaderboard/payouts/${id}/reject`, null, {
      headers: { 'X-Tenant-Id': tenantId === 'ALL' ? 'TENANT_NATCASH' : tenantId },
    });
    return unwrapObject<LeaderboardPayoutModel>(res);
  },

  // 17c. Banners, Popups & Targeted Offers (CN-06 · Figma 18/11 · Plan GĐ 5)
  async getContentBannersAdmin(tenantId: string = getStoredTenantId()): Promise<ContentBannerModel[]> {
    try {
      const res: any = await apiClient.get('/loyalty/v1/engagement/admin/banners', {
        headers: { 'X-Tenant-Id': tenantId === 'ALL' ? 'TENANT_NATCASH' : tenantId },
      });
      return unwrapList<ContentBannerModel>(res);
    } catch {
      return [];
    }
  },

  async saveContentBannerAdmin(data: Partial<ContentBannerModel>, tenantId: string = getStoredTenantId()): Promise<ContentBannerModel> {
    const res: any = await apiClient.post('/loyalty/v1/engagement/admin/banners', data, {
      headers: { 'X-Tenant-Id': tenantId === 'ALL' ? 'TENANT_NATCASH' : tenantId },
    });
    return unwrapObject<ContentBannerModel>(res);
  },

  async deleteContentBannerAdmin(id: number, tenantId: string = getStoredTenantId()): Promise<void> {
    await apiClient.delete(`/loyalty/v1/engagement/admin/banners/${id}`, {
      headers: { 'X-Tenant-Id': tenantId === 'ALL' ? 'TENANT_NATCASH' : tenantId },
    });
  },

  async getPopupRulesAdmin(tenantId: string = getStoredTenantId()): Promise<PopupRuleModel[]> {
    try {
      const res: any = await apiClient.get('/loyalty/v1/engagement/admin/popup-rules', {
        headers: { 'X-Tenant-Id': tenantId === 'ALL' ? 'TENANT_NATCASH' : tenantId },
      });
      return unwrapList<PopupRuleModel>(res);
    } catch {
      return [];
    }
  },

  async savePopupRuleAdmin(data: Partial<PopupRuleModel>, tenantId: string = getStoredTenantId()): Promise<PopupRuleModel> {
    const res: any = await apiClient.post('/loyalty/v1/engagement/admin/popup-rules', data, {
      headers: { 'X-Tenant-Id': tenantId === 'ALL' ? 'TENANT_NATCASH' : tenantId },
    });
    return unwrapObject<PopupRuleModel>(res);
  },

  async getTargetedOffersAdmin(tenantId: string = getStoredTenantId()): Promise<TargetedOfferModel[]> {
    try {
      const res: any = await apiClient.get('/loyalty/v1/engagement/admin/targeted-offers', {
        headers: { 'X-Tenant-Id': tenantId === 'ALL' ? 'TENANT_NATCASH' : tenantId },
      });
      return unwrapList<TargetedOfferModel>(res);
    } catch {
      return [];
    }
  },

  async saveTargetedOfferAdmin(data: Partial<TargetedOfferModel>, tenantId: string = getStoredTenantId()): Promise<TargetedOfferModel> {
    const res: any = await apiClient.post('/loyalty/v1/engagement/admin/targeted-offers', data, {
      headers: { 'X-Tenant-Id': tenantId === 'ALL' ? 'TENANT_NATCASH' : tenantId },
    });
    return unwrapObject<TargetedOfferModel>(res);
  },

  async deleteTargetedOfferAdmin(id: number, tenantId: string = getStoredTenantId()): Promise<void> {
    await apiClient.delete(`/loyalty/v1/engagement/admin/targeted-offers/${id}`, {
      headers: { 'X-Tenant-Id': tenantId === 'ALL' ? 'TENANT_NATCASH' : tenantId },
    });
  },

  async sendTargetedOfferAdmin(
    id: number,
    userIds?: string[],
    tenantId: string = getStoredTenantId()
  ): Promise<{ deliveredCount: number; totalSentCount: number; status: string }> {
    const res: any = await apiClient.post(
      `/loyalty/v1/engagement/admin/targeted-offers/${id}/send`,
      userIds && userIds.length > 0 ? { userIds } : {},
      { headers: { 'X-Tenant-Id': tenantId === 'ALL' ? 'TENANT_NATCASH' : tenantId } }
    );
    return unwrapObject<{ deliveredCount: number; totalSentCount: number; status: string }>(res);
  },

  // 18. Quản trị Đại lý & Tổng Đại lý (AG-03)
  async getAdminAgents(
    params?: { roleType?: string; month?: string },
    tenantId: string = getStoredTenantId()
  ): Promise<AgentLoyaltyItemModel[]> {
    try {
      if (!tenantId || tenantId === 'ALL') {
        const results = await Promise.all(
          RAW_TENANTS.map(async (t) => {
            try {
              const res: any = await apiClient.get('/loyalty/v1/admin/agents', {
                params,
                headers: { 'X-Tenant-Id': t.id },
              });
              return unwrapList<AgentLoyaltyItemModel>(res);
            } catch {
              return [];
            }
          })
        );
        const map = new Map<string | number, AgentLoyaltyItemModel>();
        results.flat().forEach((a) => {
          if (a && a.id) map.set(a.id, a);
        });
        return Array.from(map.values());
      }
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
    tenantId: string = getStoredTenantId()
  ): Promise<AgentTargetConfigModel> {
    const response: any = await apiClient.post('/loyalty/v1/admin/agents/targets', data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return unwrapObject<AgentTargetConfigModel>(response);
  },

  async approveAgentReward(
    agentId: string | number,
    month: string,
    tenantId: string = getStoredTenantId()
  ): Promise<any> {
    const response: any = await apiClient.post(
      `/loyalty/v1/admin/agents/${encodeURIComponent(String(agentId))}/approve-reward`,
      { month },
      { headers: { 'X-Tenant-Id': tenantId } }
    );
    return unwrapObject<any>(response);
  },

  async getAgentPlaybooks(tenantId: string = getStoredTenantId()): Promise<SupportPlaybookModel[]> {
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
    tenantId: string = getStoredTenantId()
  ): Promise<SupportPlaybookModel> {
    const response: any = await apiClient.post('/loyalty/v1/admin/agents/playbooks', data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return unwrapObject<SupportPlaybookModel>(response);
  },

  // 19. Merchant Partner Portal (/loyalty/v1/partner-portal/*)
  async getPartnerPortalDashboard(
    partnerId?: number,
    tenantId: string = getStoredTenantId()
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

  async getPartnerBranches(tenantId: string = getStoredTenantId()): Promise<PartnerBranchModel[]> {
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
    tenantId: string = getStoredTenantId()
  ): Promise<PartnerBranchModel> {
    const response: any = await apiClient.post('/loyalty/v1/partner-portal/branches', data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return unwrapObject<PartnerBranchModel>(response);
  },

  async getPartnerProductGroups(tenantId: string = getStoredTenantId()): Promise<PartnerProductGroupModel[]> {
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
    tenantId: string = getStoredTenantId()
  ): Promise<PartnerProductGroupModel> {
    const response: any = await apiClient.post('/loyalty/v1/partner-portal/product-groups', data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return unwrapObject<PartnerProductGroupModel>(response);
  },

  async getPartnerStaff(tenantId: string = getStoredTenantId()): Promise<PartnerStaffAccountModel[]> {
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
    tenantId: string = getStoredTenantId()
  ): Promise<PartnerStaffAccountModel> {
    const response: any = await apiClient.post('/loyalty/v1/partner-portal/staff', data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return unwrapObject<PartnerStaffAccountModel>(response);
  },

  async getPartnerProposals(tenantId: string = getStoredTenantId()): Promise<PartnerProgramProposalModel[]> {
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
    tenantId: string = getStoredTenantId()
  ): Promise<PartnerProgramProposalModel> {
    const response: any = await apiClient.post('/loyalty/v1/partner-portal/proposals', data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return unwrapObject<PartnerProgramProposalModel>(response);
  },

  async getPartnerPortalVouchers(tenantId: string = getStoredTenantId()): Promise<VoucherItemModel[]> {
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
    tenantId: string = getStoredTenantId()
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
    tenantId: string = getStoredTenantId()
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

  async getPartnerPortalSettlements(tenantId: string = getStoredTenantId()): Promise<PartnerSettlementBatchModel[]> {
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
    tenantId: string = getStoredTenantId()
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
    tenantId: string = getStoredTenantId()
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

  async getPartnerNotifications(tenantId: string = getStoredTenantId()): Promise<PartnerNotificationModel[]> {
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

  async markPartnerNotificationRead(id: number, tenantId: string = getStoredTenantId()): Promise<void> {
    await apiClient.post(
      `/loyalty/v1/partner-portal/notifications/${id}/read`,
      {},
      { headers: { 'X-Tenant-Id': tenantId } }
    );
  },

  async getPartnerApiKeys(tenantId: string = getStoredTenantId()): Promise<PartnerApiKeyConfigModel> {
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
    tenantId: string = getStoredTenantId()
  ): Promise<RotateApiKeyResultModel> {
    const response: any = await apiClient.post('/loyalty/v1/partner-portal/api-keys/rotate', data || {}, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return unwrapObject<RotateApiKeyResultModel>(response);
  },

  async revokePartnerApiKey(id: number, tenantId: string = getStoredTenantId()): Promise<void> {
    await apiClient.post(
      `/loyalty/v1/partner-portal/api-keys/${id}/revoke`,
      {},
      { headers: { 'X-Tenant-Id': tenantId } }
    );
  },

  async updatePartnerWebhookConfig(
    data: { webhookUrl: string; ipWhitelist: string; webhookSecret?: string },
    tenantId: string = getStoredTenantId()
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
  audienceRole?: 'CUSTOMER' | 'AGENT' | 'SUPER_AGENT' | string;
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

export interface GamePointRuleModel {
  id?: number;
  sourceCode: string;
  boardType: 'ALL' | 'LEARNING' | 'MINI_GAMES' | string;
  formulaType: 'FIXED' | 'PER_SCORE_UNIT' | string;
  basePts: number;
  scoreDivisor: number;
  maxPtsPerAction: number;
  dailyCapPts: number;
  status: string;
  description?: string;
}

export interface LeaderboardPrizeModel {
  id?: number;
  boardType: 'ALL' | 'LEARNING' | 'MINI_GAMES' | string;
  rankFrom: number;
  rankTo: number;
  prizeType: 'VOUCHER' | 'TELCO_DATA' | 'BADGE_AND_TURNS' | 'LOYALTY_COIN' | string;
  prizeLabel: string;
  prizeValue: number;
  voucherCode?: string;
  sponsorName?: string;
  status: string;
}

export interface LeaderboardPayoutModel {
  id: number;
  leaderboardMonth: string;
  boardType: string;
  externalUserId: string;
  displayName?: string;
  rankPosition: number;
  totalPts: number;
  prizeLabel?: string;
  prizeType?: string;
  prizeValue?: number;
  approvalStatus: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'PAID' | string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface ContentBannerModel {
  id?: number;
  placement: 'NATCASH_HOME_SLIDER' | 'LOYALTY_HOME' | 'VOUCHER_STORE' | 'GAME_HUB' | string;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  imageUrl?: string;
  deepLink?: string;
  segmentCode: string;
  i18nJson?: string;
  displayOrder: number;
  startDate?: string;
  endDate?: string;
  status: string;
}

export interface PopupRuleModel {
  id?: number;
  ruleCode: string;
  popupType: 'REWARD_READY' | 'VOUCHER_EXPIRING' | 'MISSION_ENDING' | 'CAMPAIGN_POPUP' | string;
  priority: number;
  thresholdDays?: number | null;
  title: string;
  body?: string;
  ctaLabel?: string;
  deepLink?: string;
  segmentCode: string;
  windowStartHour: number;
  windowEndHour: number;
  cooldownHours: number;
  enabled: boolean;
  status: string;
}

export interface TargetedOfferModel {
  id?: number;
  offerCode?: string;
  title: string;
  body: string;
  segmentCode: string;
  voucherCode?: string;
  channels: string;
  deepLink?: string;
  validUntil?: string;
  sentCount?: number;
  lastSentAt?: string;
  status: string;
}

export const loyaltyService = LoyaltyService;
