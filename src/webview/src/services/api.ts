/**
 * Tầng giao tiếp mạng RESTful API cho Cổng Trải Nghiệm Khách Hàng Webview (portal.mid.io.vn)
 * Dữ liệu lấy trực tiếp 100% từ loyalty-service & PostgreSQL database, tuyệt đối không mock data!
 */

const getApiBaseUrl = (): string => {
  const hostname = window.location.hostname;
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
  const origin = window.location.origin;
  const protocol = window.location.protocol;

  if (isLocal) {
    return 'http://localhost:8088';
  }
  if (hostname.includes('portal.mid.io.vn') || hostname.includes('mid.io.vn')) {
    return `${protocol}//api.mid.io.vn`;
  }
  return `${origin}/loyalty`;
};

export const getTenantId = (): string => {
  const urlParams = new URLSearchParams(window.location.search);
  const paramTenant = urlParams.get('tenantId') || urlParams.get('tenant_id');
  if (paramTenant) return paramTenant;
  const runtimeTenant = (window as any).__RUNTIME_CONFIG__?.TENANT_ID;
  if (runtimeTenant) return runtimeTenant;
  return 'TENANT_DELIMART';
};

export const getDefaultUserId = (): string => {
  const urlParams = new URLSearchParams(window.location.search);
  const paramUser = urlParams.get('userId') || urlParams.get('user_id') || urlParams.get('phone');
  if (paramUser) return paramUser;
  const tenant = getTenantId();
  if (tenant === 'TENANT_MICRO_CRM') return '84977777777';
  if (tenant === 'TENANT_NATCASH') return '50937123456';
  return '84988888888';
};

const API_BASE = getApiBaseUrl();

export interface MemberProfile {
  accountId: number;
  tenantId: string;
  externalUserId: string;
  phoneNumber: string;
  fullName: string;
  currentPoints: number;
  tierPoints: number;
  tier: {
    tierId: number;
    code: string;
    name: string;
    tierLevel: number;
    pointMultiplier: number;
    freeDailyTurns: number;
  };
  nextTierProgress: {
    nextTierCode: string;
    nextTierName: string;
    requiredPoints: number;
    currentTierPoints: number;
    pointsNeeded: number;
    progressPercentage: number;
  };
}

export interface MilestoneItem {
  id: number;
  campaignCode: string;
  campaignName: string;
  milestoneStep: number;
  targetMetric: string;
  targetValue: number;
  rewardPoints: number;
  currentProgress: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'CLAIMED';
}

export interface WheelPrizeItem {
  prizeId: number;
  prizeName: string;
  prizeType: string;
  prizeValue: number;
  displayOrder: number;
  colorCode: string;
}

export interface WheelConfigData {
  wheelId: number;
  wheelCode: string;
  wheelName: string;
  pricePerSpin: number;
  freeSpinsDaily: number;
  remainingSpinsToday: number;
  prizes: WheelPrizeItem[];
}

export interface UserVoucherItem {
  id: number;
  code: string;
  title: string;
  partnerName: string;
  category: string;
  discountText: string;
  minOrder: string;
  validUntil: string;
  status: string;
  terms: string;
}

export interface LedgerItem {
  id: number;
  pointChange: number;
  balanceAfter: number;
  changeType: string;
  referenceCode: string;
  description: string;
  createdAt: string;
}

export interface PartnerItem {
  id: number;
  partnerCode: string;
  partnerName: string;
  partnerType: string;
  status: string;
  description: string;
  shortCode: string;
  earnPolicyText: string;
}

export const LoyaltyApi = {
  // 1. Lấy thông tin tài khoản hội viên
  async getProfile(externalUserId: string = getDefaultUserId()): Promise<MemberProfile> {
    const res = await fetch(`${API_BASE}/loyalty/v1/profile?externalUserId=${externalUserId}`, {
      headers: { 'X-Tenant-Id': getTenantId() },
    });
    if (!res.ok) throw new Error('Không thể tải thông tin hội viên');
    return res.json();
  },

  // 2. Lấy danh sách nhiệm vụ cột mốc
  async getMilestones(externalUserId: string = getDefaultUserId()): Promise<{ campaigns: any[]; milestones: MilestoneItem[] }> {
    const res = await fetch(`${API_BASE}/loyalty/v1/milestones/list?externalUserId=${externalUserId}`, {
      headers: { 'X-Tenant-Id': getTenantId() },
    });
    if (!res.ok) throw new Error('Không thể tải danh sách nhiệm vụ');
    return res.json();
  },

  // 3. Nhận thưởng nhiệm vụ cột mốc
  async claimMilestone(externalUserId: string, campaignCode: string, milestoneStep: number) {
    const res = await fetch(`${API_BASE}/loyalty/v1/milestones/claim-reward`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-Id': getTenantId(),
      },
      body: JSON.stringify({ externalUserId, campaignCode, milestoneStep }),
    });
    if (!res.ok) throw new Error('Không thể nhận thưởng cột mốc');
    return res.json();
  },

  // 4. Lấy cấu hình và giải thưởng vòng quay may mắn
  async getLuckyWheelConfig(externalUserId: string = getDefaultUserId(), wheelCode?: string): Promise<WheelConfigData> {
    const tenant = getTenantId();
    const effectiveWheelCode = wheelCode || (tenant === 'TENANT_NATCASH' ? 'LUCKY_WHEEL_NATCASH' : tenant === 'TENANT_MICRO_CRM' ? 'LUCKY_WHEEL_CRM' : 'LUCKY_WHEEL');
    const res = await fetch(`${API_BASE}/loyalty/v1/luckydraw/config?wheelCode=${effectiveWheelCode}&externalUserId=${externalUserId}`, {
      headers: { 'X-Tenant-Id': tenant },
    });
    if (!res.ok) throw new Error('Không thể tải cấu hình vòng quay');
    return res.json();
  },

  // 5. Thực hiện quay thưởng may mắn nguyên tử
  async spinLuckyWheel(externalUserId: string = getDefaultUserId(), usePoints: boolean = false, wheelCode?: string) {
    const tenant = getTenantId();
    const effectiveWheelCode = wheelCode || (tenant === 'TENANT_NATCASH' ? 'LUCKY_WHEEL_NATCASH' : tenant === 'TENANT_MICRO_CRM' ? 'LUCKY_WHEEL_CRM' : 'LUCKY_WHEEL');
    const res = await fetch(`${API_BASE}/loyalty/v1/luckydraw/spin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-Id': tenant,
      },
      body: JSON.stringify({ externalUserId, usePoints, wheelCode: effectiveWheelCode }),
    });
    if (!res.ok) throw new Error('Không thể thực hiện quay thưởng');
    return res.json();
  },

  // 6. Lấy kho voucher của người dùng
  async getUserVouchers(externalUserId: string = getDefaultUserId(), status: string = 'ALL'): Promise<UserVoucherItem[]> {
    const res = await fetch(`${API_BASE}/loyalty/v1/vouchers/my-vouchers?externalUserId=${externalUserId}&status=${status}`, {
      headers: { 'X-Tenant-Id': getTenantId() },
    });
    if (!res.ok) throw new Error('Không thể tải kho voucher');
    return res.json();
  },

  // 7. Lấy lịch sử biến động điểm (Sổ cái)
  async getPointLedger(externalUserId: string = getDefaultUserId(), page: number = 0, size: number = 10): Promise<{ items: LedgerItem[]; totalElements: number }> {
    const res = await fetch(`${API_BASE}/loyalty/v1/ledger?externalUserId=${externalUserId}&page=${page}&size=${size}`, {
      headers: { 'X-Tenant-Id': getTenantId() },
    });
    if (!res.ok) throw new Error('Không thể tải lịch sử điểm');
    return res.json();
  },

  // 8. Lấy danh sách đối tác liên minh
  async getPartners(): Promise<PartnerItem[]> {
    const res = await fetch(`${API_BASE}/loyalty/v1/partners`, {
      headers: { 'X-Tenant-Id': getTenantId() },
    });
    if (!res.ok) throw new Error('Không thể tải danh sách đối tác');
    return res.json();
  },
};
