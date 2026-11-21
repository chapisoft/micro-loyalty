import { PARTNER_PORTAL_CONSTANTS } from '@/constants';
import {
  CommonStatus,
  PartnerApiKeyConfigModel,
  PartnerApiKeyItemModel,
  PartnerBranchModel,
  PartnerNotificationModel,
  PartnerPortalDashboardModel,
  PartnerProductGroupModel,
  PartnerProgramProposalModel,
  PartnerSettlementBatchModel,
  PartnerSettlementClaimRequestModel,
  PartnerStaffAccountModel,
  PartnerVoucherRedeemRequestModel,
  PartnerWebhookConfigModel,
  PointLedgerItem,
  PolicyRuleModel,
  VoucherItemModel,
} from '@/models';
import { apiClient } from '@/service/apiClient';

export type {
  PartnerApiKeyConfigModel,
  PartnerApiKeyItemModel,
  PartnerBranchModel,
  PartnerNotificationModel,
  PartnerPortalDashboardModel,
  PartnerProductGroupModel,
  PartnerProgramProposalModel,
  PartnerSettlementBatchModel,
  PartnerSettlementClaimRequestModel,
  PartnerStaffAccountModel,
  PartnerVoucherRedeemRequestModel,
  PartnerWebhookConfigModel,
  PointLedgerItem,
  PolicyRuleModel,
  VoucherItemModel,
};

function unwrapList<T>(response: any): T[] {
  if (Array.isArray(response)) return response;
  if (response && Array.isArray(response.data)) return response.data;
  if (response?.data && Array.isArray(response.data.data)) return response.data.data;
  if (response && Array.isArray(response.content)) return response.content;
  return [];
}

function unwrapObject<T>(response: any): T {
  if (response && response.data !== undefined && !Array.isArray(response.data)) {
    if (response.data && response.data.data !== undefined && !Array.isArray(response.data.data)) {
      return response.data.data as T;
    }
    return response.data as T;
  }
  return response as T;
}

export const LoyaltyService = {
  async getPolicies(tenantId: string = PARTNER_PORTAL_CONSTANTS.DEFAULT_TENANT_ID): Promise<PolicyRuleModel[]> {
    try {
      const response: any = await apiClient.get('/loyalty/v1/partner-portal/policies', {
        headers: { 'X-Tenant-Id': tenantId },
      });
      return unwrapList<any>(response).map((p: any) => ({
        id: p.id,
        policyCode: p.code || p.policyCode || `POL_${p.id}`,
        code: p.code || p.policyCode,
        name: p.name || p.description || '',
        partnerId: p.partnerId,
        partnerCode: p.partnerCode || '',
        partnerName: p.partnerName || '',
        type: p.type || 'BURN',
        earnRule: p.earnRule || `${p.earnRatePercent ?? 1}%`,
        earnRate: p.earnRatePercent ?? p.earnRate ?? 1,
        earnRatePercent: p.earnRatePercent ?? p.earnRate ?? 1,
        exchangeRate: p.exchangeRate ?? p.pointExchangeRate ?? PARTNER_PORTAL_CONSTANTS.DEFAULT_EXCHANGE_RATE,
        maxBurnPercent: p.maxBurnPercentage ?? p.maxBurnPercent ?? 50,
        maxBurnPercentage: p.maxBurnPercentage ?? p.maxBurnPercent ?? 50,
        minBillAmount: p.minBillAmount ?? p.minBurnPoints ?? 10,
        burnEnabled: p.burnEnabled ?? true,
        burnRatio: p.burnRatio ?? p.maxBurnPercentage ?? 50,
        settlementCycle: p.settlementCycle || '',
        budgetCap: p.budgetCap ?? p.settlementCreditLimit ?? 0,
        status: p.status || CommonStatus.ACTIVE,
        effectiveDate: p.updatedAt ? new Date(p.updatedAt).toLocaleString('vi-VN') : '',
        description: p.description || '',
      }));
    } catch {
      return [];
    }
  },

  async createApprovalRequest(
    data: Record<string, any>,
    tenantId: string = PARTNER_PORTAL_CONSTANTS.DEFAULT_TENANT_ID
  ): Promise<any> {
    const response: any = await apiClient.post('/loyalty/v1/partner-portal/proposals', data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return unwrapObject<any>(response);
  },

  async getPartnerPortalDashboard(
    partnerId?: number,
    tenantId: string = PARTNER_PORTAL_CONSTANTS.DEFAULT_TENANT_ID
  ): Promise<PartnerPortalDashboardModel | null> {
    try {
      const response: any = await apiClient.get('/loyalty/v1/partner-portal/dashboard', {
        params: partnerId ? { partnerId } : undefined,
        headers: { 'X-Tenant-Id': tenantId },
      });
      return unwrapObject<PartnerPortalDashboardModel>(response);
    } catch {
      return null;
    }
  },

  async getPartnerBranches(tenantId: string = PARTNER_PORTAL_CONSTANTS.DEFAULT_TENANT_ID): Promise<PartnerBranchModel[]> {
    try {
      const response: any = await apiClient.get('/loyalty/v1/partner-portal/branches', {
        headers: { 'X-Tenant-Id': tenantId },
      });
      return unwrapList<any>(response).map((b: any) => ({
        ...b,
        managerPhone: b.managerPhone || b.phoneNumber || '',
      }));
    } catch {
      return [];
    }
  },

  async savePartnerBranch(
    data: Partial<PartnerBranchModel>,
    tenantId: string = PARTNER_PORTAL_CONSTANTS.DEFAULT_TENANT_ID
  ): Promise<PartnerBranchModel> {
    const response: any = await apiClient.post('/loyalty/v1/partner-portal/branches', data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return unwrapObject<PartnerBranchModel>(response);
  },

  async getPartnerProductGroups(
    tenantId: string = PARTNER_PORTAL_CONSTANTS.DEFAULT_TENANT_ID
  ): Promise<PartnerProductGroupModel[]> {
    try {
      const response: any = await apiClient.get('/loyalty/v1/partner-portal/product-groups', {
        headers: { 'X-Tenant-Id': tenantId },
      });
      return unwrapList<any>(response).map((g: any) => ({
        ...g,
        earnMultiplier: Number(g.earnMultiplier ?? g.earnRatePercent ?? 1),
        allowBurn: g.allowBurn ?? Number(g.maxBurnPercentage ?? 0) > 0,
      }));
    } catch {
      return [];
    }
  },

  async savePartnerProductGroup(
    data: Partial<PartnerProductGroupModel>,
    tenantId: string = PARTNER_PORTAL_CONSTANTS.DEFAULT_TENANT_ID
  ): Promise<PartnerProductGroupModel> {
    const response: any = await apiClient.post('/loyalty/v1/partner-portal/product-groups', data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return unwrapObject<PartnerProductGroupModel>(response);
  },

  async getPartnerStaff(
    tenantId: string = PARTNER_PORTAL_CONSTANTS.DEFAULT_TENANT_ID
  ): Promise<PartnerStaffAccountModel[]> {
    try {
      const response: any = await apiClient.get('/loyalty/v1/partner-portal/staff', {
        headers: { 'X-Tenant-Id': tenantId },
      });
      return unwrapList<PartnerStaffAccountModel>(response);
    } catch {
      return [];
    }
  },

  async savePartnerStaff(
    data: Partial<PartnerStaffAccountModel>,
    tenantId: string = PARTNER_PORTAL_CONSTANTS.DEFAULT_TENANT_ID
  ): Promise<PartnerStaffAccountModel> {
    const response: any = await apiClient.post('/loyalty/v1/partner-portal/staff', data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return unwrapObject<PartnerStaffAccountModel>(response);
  },

  async togglePartnerStaffLock(
    staffId: number,
    tenantId: string = PARTNER_PORTAL_CONSTANTS.DEFAULT_TENANT_ID
  ): Promise<any> {
    const response: any = await apiClient.post(
      `/loyalty/v1/partner-portal/staff/${staffId}/toggle-lock`,
      {},
      { headers: { 'X-Tenant-Id': tenantId } }
    );
    return response?.data || response;
  },

  async deletePartnerStaff(
    staffId: number,
    tenantId: string = PARTNER_PORTAL_CONSTANTS.DEFAULT_TENANT_ID
  ): Promise<any> {
    const response: any = await apiClient.delete(
      `/loyalty/v1/partner-portal/staff/${staffId}`,
      { headers: { 'X-Tenant-Id': tenantId } }
    );
    return response?.data || response;
  },

  async getPartnerProposals(
    tenantId: string = PARTNER_PORTAL_CONSTANTS.DEFAULT_TENANT_ID
  ): Promise<PartnerProgramProposalModel[]> {
    try {
      const response: any = await apiClient.get('/loyalty/v1/partner-portal/proposals', {
        headers: { 'X-Tenant-Id': tenantId },
      });
      return unwrapList<PartnerProgramProposalModel>(response);
    } catch {
      return [];
    }
  },

  async createPartnerProposal(
    data: Partial<PartnerProgramProposalModel>,
    tenantId: string = PARTNER_PORTAL_CONSTANTS.DEFAULT_TENANT_ID
  ): Promise<PartnerProgramProposalModel> {
    const response: any = await apiClient.post('/loyalty/v1/partner-portal/proposals', data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return unwrapObject<PartnerProgramProposalModel>(response);
  },

  async getPartnerPortalVouchers(
    tenantId: string = PARTNER_PORTAL_CONSTANTS.DEFAULT_TENANT_ID
  ): Promise<VoucherItemModel[]> {
    try {
      const response: any = await apiClient.get('/loyalty/v1/partner-portal/vouchers', {
        headers: { 'X-Tenant-Id': tenantId },
      });
      return unwrapList<any>(response).map((v: any) => ({
        ...v,
        voucherName: v.voucherName || v.title || '',
        availableQuantity: Number(v.availableQuantity ?? v.remainingQuantity ?? 0),
        remainingQuantity: Number(v.remainingQuantity ?? v.availableQuantity ?? 0),
        expiryDate: v.expiryDate || v.validTo || v.endDate || '',
      }));
    } catch {
      return [];
    }
  },

  async checkPartnerVoucher(
    data: { code: string; branchCode?: string; billAmount?: number },
    tenantId: string = PARTNER_PORTAL_CONSTANTS.DEFAULT_TENANT_ID
  ): Promise<any> {
    const response: any = await apiClient.post('/loyalty/v1/partner-portal/vouchers/checkVoucher', data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return unwrapObject<any>(response);
  },

  async redeemPartnerVoucherAtCounter(
    data: PartnerVoucherRedeemRequestModel,
    tenantId: string = PARTNER_PORTAL_CONSTANTS.DEFAULT_TENANT_ID
  ): Promise<any> {
    const response: any = await apiClient.post('/loyalty/v1/partner-portal/vouchers/redeem-counter', data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return unwrapObject<any>(response);
  },

  async getPartnerPortalTransactions(
    params?: { branchCode?: string; fromDate?: string; toDate?: string; actionType?: string; keyword?: string; search?: string },
    tenantId: string = PARTNER_PORTAL_CONSTANTS.DEFAULT_TENANT_ID
  ): Promise<PointLedgerItem[]> {
    try {
      const response: any = await apiClient.get('/loyalty/v1/partner-portal/transactions', {
        params,
        headers: { 'X-Tenant-Id': tenantId },
      });
      return unwrapList<PointLedgerItem>(response);
    } catch {
      return [];
    }
  },

  async getPartnerPortalSettlements(
    tenantId: string = PARTNER_PORTAL_CONSTANTS.DEFAULT_TENANT_ID
  ): Promise<PartnerSettlementBatchModel[]> {
    try {
      const response: any = await apiClient.get('/loyalty/v1/partner-portal/settlements', {
        headers: { 'X-Tenant-Id': tenantId },
      });
      return unwrapList<any>(response).map((s: any) => ({
        ...s,
        periodFrom: s.periodFrom || s.periodStart || s.period || '',
        periodTo: s.periodTo || s.periodEnd || s.period || '',
        mdrFeeAmount: Number(s.mdrFeeAmount ?? s.mdrFee ?? 0),
        netPayableAmount: Number(s.netPayableAmount ?? s.netPayable ?? 0),
      }));
    } catch {
      return [];
    }
  },

  async confirmPartnerSettlement(
    batchCode: string,
    tenantId: string = PARTNER_PORTAL_CONSTANTS.DEFAULT_TENANT_ID
  ): Promise<any> {
    const response: any = await apiClient.post(
      `/loyalty/v1/partner-portal/settlements/${encodeURIComponent(batchCode)}/confirm`,
      {},
      { headers: { 'X-Tenant-Id': tenantId } }
    );
    return unwrapObject<any>(response);
  },

  async raisePartnerSettlementClaim(
    data: PartnerSettlementClaimRequestModel,
    tenantId: string = PARTNER_PORTAL_CONSTANTS.DEFAULT_TENANT_ID
  ): Promise<any> {
    const response: any = await apiClient.post(
      `/loyalty/v1/partner-portal/settlements/${encodeURIComponent(data.batchCode)}/claim`,
      { partnerAmount: data.claimedAmount, reason: data.reason, attachmentUrl: data.attachmentUrl },
      { headers: { 'X-Tenant-Id': tenantId } }
    );
    return unwrapObject<any>(response);
  },

  async getPartnerNotifications(
    tenantId: string = PARTNER_PORTAL_CONSTANTS.DEFAULT_TENANT_ID
  ): Promise<PartnerNotificationModel[]> {
    try {
      const response: any = await apiClient.get('/loyalty/v1/partner-portal/notifications', {
        headers: { 'X-Tenant-Id': tenantId },
      });
      return unwrapList<any>(response).map((n: any) => ({
        ...n,
        category: n.category || n.notifType || 'SYSTEM',
        content: n.content || n.message || '',
      }));
    } catch {
      return [];
    }
  },

  async markPartnerNotificationRead(
    id: number,
    tenantId: string = PARTNER_PORTAL_CONSTANTS.DEFAULT_TENANT_ID
  ): Promise<void> {
    await apiClient.post(
      `/loyalty/v1/partner-portal/notifications/${id}/read`,
      {},
      { headers: { 'X-Tenant-Id': tenantId } }
    );
  },

  async getPartnerApiKeys(
    tenantId: string = PARTNER_PORTAL_CONSTANTS.DEFAULT_TENANT_ID
  ): Promise<PartnerApiKeyConfigModel> {
    try {
      const [keysResponse, webhookResponse] = await Promise.all([
        apiClient.get('/loyalty/v1/partner-portal/api-keys', {
          headers: { 'X-Tenant-Id': tenantId },
        }),
        apiClient
          .get('/loyalty/v1/partner-portal/webhook-config', {
            headers: { 'X-Tenant-Id': tenantId },
          })
          .catch(() => null),
      ]);
      const obj = unwrapObject<any>(keysResponse);
      const webhookObj = webhookResponse ? unwrapObject<any>(webhookResponse) : null;
      const rawKeys = Array.isArray(obj) ? obj : Array.isArray(obj?.keys) ? obj.keys : [];
      const keys: PartnerApiKeyItemModel[] = rawKeys.map((k: any) => ({
        ...k,
        label: k.label || k.keyName || k.keyPrefix,
        plainTextKey: k.plainTextKey || k.plainSecretKeyOnce,
        graceExpiresAt: k.graceExpiresAt || k.gracePeriodUntil,
      }));
      return {
        keys,
        webhookUrl: webhookObj?.webhookUrl || obj?.webhookUrl,
        ipWhitelist: webhookObj?.ipWhitelist || obj?.ipWhitelist,
      };
    } catch {
      return { keys: [] };
    }
  },

  async rotatePartnerApiKey(
    data?: { label?: string; gracePeriodHours?: number },
    tenantId: string = PARTNER_PORTAL_CONSTANTS.DEFAULT_TENANT_ID
  ): Promise<PartnerApiKeyItemModel> {
    const response: any = await apiClient.post('/loyalty/v1/partner-portal/api-keys/rotate', data || {}, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    const k = unwrapObject<any>(response);
    return {
      ...k,
      label: k.label || k.keyName || k.keyPrefix,
      plainTextKey: k.plainTextKey || k.plainSecretKeyOnce,
      graceExpiresAt: k.graceExpiresAt || k.gracePeriodUntil,
    };
  },

  async revokePartnerApiKey(id: number, tenantId: string = PARTNER_PORTAL_CONSTANTS.DEFAULT_TENANT_ID): Promise<void> {
    await apiClient.post(
      `/loyalty/v1/partner-portal/api-keys/${id}/revoke`,
      {},
      { headers: { 'X-Tenant-Id': tenantId } }
    );
  },

  async updatePartnerWebhookConfig(
    data: PartnerWebhookConfigModel,
    tenantId: string = PARTNER_PORTAL_CONSTANTS.DEFAULT_TENANT_ID
  ): Promise<any> {
    const response: any = await apiClient.put('/loyalty/v1/partner-portal/webhook-config', data, {
      headers: { 'X-Tenant-Id': tenantId },
    });
    return unwrapObject<any>(response);
  },
};
