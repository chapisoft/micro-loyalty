/**
 * Tầng giao tiếp mạng RESTful API cho Cổng Trải Nghiệm Khách Hàng Webview (portal.mid.io.vn)
 * Dữ liệu lấy trực tiếp 100% từ loyalty-service & PostgreSQL database, tuyệt đối không fake default values.
 */

const getApiBaseUrl = (): string => {
  const runtimeApiGatewayUrl = (
    window as unknown as { __RUNTIME_CONFIG__?: { API_GATEWAY_URL?: string } }
  ).__RUNTIME_CONFIG__?.API_GATEWAY_URL;
  const envApiUrl = (import.meta as unknown as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL;
  const configuredBaseUrl = runtimeApiGatewayUrl || envApiUrl;
  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/+$/, '');
  }

  const hostname = window.location.hostname;
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
  const origin = window.location.origin;
  const protocol = window.location.protocol;

  if (isLocal) {
    return '';
  }
  if (hostname.includes('portal.mid.io.vn') || hostname.includes('mid.io.vn')) {
    return `${protocol}//api.mid.io.vn`;
  }
  return origin;
};

export const getTenantId = (): string => {
  const urlParams = new URLSearchParams(window.location.search);
  const paramTenant = urlParams.get('tenantId') || urlParams.get('tenant_id');
  if (paramTenant) return paramTenant;
  const runtimeTenant = (window as unknown as { __RUNTIME_CONFIG__?: { TENANT_ID?: string } }).__RUNTIME_CONFIG__?.TENANT_ID;
  if (runtimeTenant) return runtimeTenant;
  const stored = localStorage.getItem('selected_tenant_id') || localStorage.getItem('tenant_id');
  if (stored) return stored;
  return 'DEFAULT';
};

export const getDefaultUserId = (): string => {
  const urlParams = new URLSearchParams(window.location.search);
  const paramUser = urlParams.get('userId') || urlParams.get('user_id') || urlParams.get('phone');
  if (paramUser) return paramUser;
  const storedUser = sessionStorage.getItem('loyalty_user');
  if (storedUser) return storedUser;
  return '';
};

const API_BASE = getApiBaseUrl();

const getAuthHeaders = (includeJsonContentType: boolean = false): Record<string, string> => {
  const headers: Record<string, string> = {
    'X-Tenant-Id': getTenantId(),
  };
  const token = sessionStorage.getItem('loyalty_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (includeJsonContentType) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

export interface MemberProfile {
  accountId: number;
  tenantId: string;
  externalUserId: string;
  phoneNumber: string;
  fullName: string;
  currentPoints: number;
  tierPoints: number;
  freeDailyTurns?: number;
  perpetualTurns?: number;
  checkinStreakDays?: number;
  hasCheckedInToday?: boolean;
  cycleEndAt?: string;
  tier: {
    tierId: number;
    code: string;
    name: string;
    tierLevel: number;
    pointMultiplier: number;
    freeDailyTurns: number;
    keepTierPoints?: number;
    upgradePoints?: number;
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
  campaignCategory?: string;
  partnerName?: string;
  description?: string;
  milestoneStep: number;
  targetMetric: string;
  targetValue: number;
  rewardPoints: number;
  currentProgress: number;
  claimDeadline?: string;
  expiresAt?: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'CLAIMED' | 'EXPIRED';
}

export interface MissionClaimResponse {
  milestoneId: number;
  pointsAwarded: number;
  newPointBalance: number;
  status: string;
  claimedAt?: string;
  message?: string;
}

export interface ExpiringBucketItem {
  bucketId: number;
  assetType: 'LOYALTY_COIN' | 'TIER_POINT' | string;
  initialPoints: number;
  remainingPoints: number;
  earnedAt: string;
  expiredAt: string;
  daysRemaining?: number;
  sourceRef?: string;
  sourceDescription?: string;
  status: string;
}

export interface ExpiringBucketsResponse {
  totalExpiringPoints: number;
  nearestExpiryDate?: string;
  buckets: ExpiringBucketItem[];
}

export interface ReferralFriendItem {
  id: number;
  referredUserId?: string;
  maskedPhone: string;
  fullName?: string;
  ekycStatus: 'VERIFIED_EKYC' | 'PENDING_EKYC' | 'REWARDED' | string;
  firstTxCompleted?: boolean;
  rewardPoints: number;
  invitedAt: string;
}

export interface MyReferralsResponse {
  referralCode: string;
  referralLink: string;
  totalInvited: number;
  totalEkycVerified: number;
  totalRewardPoints: number;
  rewardPerReferral: number;
  referrals: ReferralFriendItem[];
}

export interface RewardQrTokenResponse {
  qrToken: string;
  expiresInSeconds: number;
  expiresAt: string;
}

export interface PartnerLocationItem {
  id: number;
  partnerId?: number;
  partnerCode: string;
  partnerName: string;
  branchCode?: string;
  branchName?: string;
  paymentPointCode?: string;
  category: string;
  province?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  earnPolicyText?: string;
  burnPolicyText?: string;
  status: string;
}

export interface UssdMenuOption {
  key: string;
  label: string;
}

export interface UssdMenuResponse {
  sessionId?: string;
  menuLevel: number;
  title: string;
  screenText: string;
  options: UssdMenuOption[];
  isEndSession: boolean;
}

export type SegmentCode =
  | 'NEW_CUSTOMER'
  | 'LOW_ACTIVITY'
  | 'HIGH_VALUE'
  | 'SINGLE_SERVICE'
  | 'WIN_BACK'
  | 'PARTNER_SHOPPER'
  | 'GENERAL';

export interface SegmentProfileResponse {
  externalUserId: string;
  segmentCode: SegmentCode | string;
  segmentName?: string;
  headline?: string;
  subheadline?: string;
  ctaLabel?: string;
  ctaTarget?: string;
  badgeText?: string;
  updatedAt?: string;
}

export interface InboxMessageItem {
  id: number;
  category: 'REWARD' | 'TIER' | 'PROMO' | 'SYSTEM' | string;
  title: string;
  body: string;
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
}

export interface InboxMessagesResponse {
  unreadCount: number;
  messages: InboxMessageItem[];
}

export interface NotificationPreferencesDto {
  externalUserId?: string;
  optOutMarketing: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
  preferredLocale: string;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

export interface LearningCourseItem {
  id: number;
  courseCode: string;
  title: string;
  description?: string;
  category?: string;
  difficulty?: string;
  totalQuestions: number;
  rewardPointsMax: number;
  completedQuestions?: number;
  bestScore?: number;
  iconSymbol?: string;
}

export interface LearningQuestionItem {
  id: number;
  courseId: number;
  questionText: string;
  options: string[];
  audioUrl?: string;
  orderIndex: number;
}

export interface LearningQuizAnswer {
  questionId: number;
  selectedOptionIndex: number;
}

export interface LearningQuizSubmitResponse {
  courseId: number;
  correctCount: number;
  totalQuestions: number;
  pointsAwarded: number;
  newPointBalance?: number;
  milestoneBonusTier?: number;
  results?: Array<{
    questionId: number;
    correct: boolean;
    correctOptionIndex: number;
  }>;
}

export interface LearningLeaderboardItem {
  rank: number;
  externalUserId: string;
  maskedPhone?: string;
  displayName: string;
  totalPoints: number;
  badge?: string;
}

export interface ScratchCardPlayResponse {
  transactionRef: string;
  outcome: 'WIN' | 'NO_LUCK' | string;
  prizeName: string;
  prizeType: 'POINTS' | 'VOUCHER' | 'NO_LUCK' | string;
  pointsAwarded: number;
  newPointBalance?: number;
  turnsRemaining?: number;
  scratchMatrix: string[];
  winningSymbol?: string;
  message?: string;
  timestamp?: string;
}

export interface AgentSubordinateItem {
  agentId: string;
  agentName: string;
  agentCode: string;
  ekycCount: number;
  targetCount: number;
  qualified: boolean;
  province?: string;
  lastActiveAt?: string;
}

export interface AgentDashboardResponse {
  agentRole: 'AGENT' | 'SUPER_AGENT' | string;
  agentCode: string;
  agentName: string;
  monthLabel: string;
  monthlyTargetCustomers: number;
  currentCustomersCount: number;
  pendingEkycCount?: number;
  rewardAmount: number;
  rewardCurrency: string;
  rewardClaimed?: boolean;
  superAgentNetworkRate?: number;
  superAgentTargetRate?: number;
  superAgentRewardAmount?: number;
  subordinateTotal?: number;
  subordinateQualifiedCount?: number;
  subordinates?: AgentSubordinateItem[];
}

export interface WheelPrizeItem {
  prizeId: number;
  prizeName: string;
  nameVi?: string;
  nameEn?: string;
  nameFr?: string;
  nameHt?: string;
  prizeType: string;
  prizeValue: number;
  displayOrder: number;
  colorCode: string;
  iconSymbol?: string;
  iconUrl?: string;
  bgImageUrl?: string;
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
  redemptionCode?: string;
  title: string;
  partnerName: string;
  category: string;
  discountText: string;
  minOrder: string;
  validUntil: string;
  status: string;
  terms: string;
}

export interface CatalogVoucherItem {
  id: number;
  voucherCode: string;
  title: string;
  description?: string;
  partnerId?: number;
  partnerCode?: string;
  partnerName: string;
  discountType: string;
  discountValue: number;
  minBillAmount?: number;
  maxDiscountAmount?: number;
  totalQuantity?: number;
  availableQuantity?: number;
  pointCost: number;
  startDate?: string;
  endDate?: string;
  status: string;
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

export interface GameSessionData {
  sessionToken: string;
  expiresAt: string;
}

export interface GamePrizeItem {
  id: number;
  prizeCode: string;
  prizeName: string;
  prizeType: string;
  prizeValue: number;
  probabilityWeight: number;
  colorCode?: string;
  iconSymbol?: string;
  displayOrder: number;
}

export interface GameDetailData {
  id: number;
  gameCode: string;
  gameName: string;
  category: string;
  pricePerTurn: number;
  freeTurnsDaily: number;
  remainingTurnsToday: number;
  userPointBalance: number;
  description?: string;
  rulesText?: string;
  bannerUrl?: string;
  iconUrl?: string;
  allowPointsSpin: boolean;
  prizes: GamePrizeItem[];
  gameParams?: Record<string, unknown>;
}

export const LoyaltyApi = {
  // 1. Lấy thông tin tài khoản hội viên
  async getProfile(externalUserId: string = getDefaultUserId()): Promise<MemberProfile> {
    const res = await fetch(
      `${API_BASE}/loyalty/v1/profile?externalUserId=${encodeURIComponent(externalUserId)}`,
      { headers: getAuthHeaders() }
    );
    if (!res.ok) {
      throw new Error(`HTTP_${res.status}`);
    }
    return res.json();
  },

  // 2. Lấy danh sách nhiệm vụ cột mốc
  async getMilestones(externalUserId: string = getDefaultUserId()): Promise<{ campaigns: unknown[]; milestones: MilestoneItem[] }> {
    const res = await fetch(
      `${API_BASE}/loyalty/v1/milestones/list?externalUserId=${encodeURIComponent(externalUserId)}`,
      { headers: getAuthHeaders() }
    );
    if (!res.ok) throw new Error(`HTTP_${res.status}`);
    return res.json();
  },

  // 3. Nhận thưởng nhiệm vụ cột mốc (legacy path)
  async claimMilestone(externalUserId: string, campaignCode: string, milestoneStep: number) {
    const res = await fetch(`${API_BASE}/loyalty/v1/milestones/claim-reward`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: JSON.stringify({ externalUserId, campaignCode, milestoneStep }),
    });
    if (!res.ok) throw new Error(`HTTP_${res.status}`);
    return res.json();
  },

  // 3b. Nhận thưởng nhiệm vụ theo ID (v2.2 endpoint)
  async claimMission(id: number | string, externalUserId: string = getDefaultUserId()): Promise<MissionClaimResponse> {
    const res = await fetch(`${API_BASE}/loyalty/v1/campaigns/milestones/${encodeURIComponent(String(id))}/claim`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: JSON.stringify({ externalUserId }),
    });
    if (!res.ok) throw new Error(`HTTP_${res.status}`);
    return res.json();
  },

  // 4. Lấy danh sách lô điểm sắp hết hạn theo FIFO (DT-01)
  async getExpiringBuckets(externalUserId: string = getDefaultUserId()): Promise<ExpiringBucketsResponse> {
    const res = await fetch(
      `${API_BASE}/loyalty/v1/ledger/expiring-buckets?externalUserId=${encodeURIComponent(externalUserId)}`,
      { headers: getAuthHeaders() }
    );
    if (!res.ok) throw new Error(`HTTP_${res.status}`);
    return res.json();
  },

  // 5. Lấy thông tin mời bạn bè & danh sách bạn bè đã eKYC (NV-06)
  async getMyReferrals(externalUserId: string = getDefaultUserId()): Promise<MyReferralsResponse> {
    const res = await fetch(
      `${API_BASE}/loyalty/v1/referrals/me?externalUserId=${encodeURIComponent(externalUserId)}`,
      { headers: getAuthHeaders() }
    );
    if (!res.ok) throw new Error(`HTTP_${res.status}`);
    return res.json();
  },

  // 6. Sinh mã QR Ví Phần Thưởng động 60s (LM-17)
  async generateRewardQrToken(externalUserId: string = getDefaultUserId()): Promise<RewardQrTokenResponse> {
    const res = await fetch(`${API_BASE}/loyalty/v1/wallet/qr-token`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: JSON.stringify({ externalUserId }),
    });
    if (res.status === 404) {
      const legacyRes = await fetch(`${API_BASE}/loyalty/v1/reward-wallet/qr/generate`, {
        method: 'POST',
        headers: getAuthHeaders(true),
        body: JSON.stringify({ externalUserId }),
      });
      if (!legacyRes.ok) throw new Error(`HTTP_${legacyRes.status}`);
      return legacyRes.json();
    }
    if (!res.ok) throw new Error(`HTTP_${res.status}`);
    return res.json();
  },

  // 7. Lấy điểm chấp nhận tiêu điểm đối tác (LM-04)
  async getWhereToUsePartners(category?: string): Promise<PartnerLocationItem[]> {
    const query = category && category !== 'ALL' ? `?category=${encodeURIComponent(category)}` : '';
    const res = await fetch(`${API_BASE}/loyalty/v1/partners/locations${query}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP_${res.status}`);
    return res.json();
  },

  // 8. Mô phỏng thực đơn USSD *202# (Section 5)
  async getUssdMenu(input: string = '', externalUserId: string = getDefaultUserId()): Promise<UssdMenuResponse> {
    const params = new URLSearchParams();
    if (input) params.set('input', input);
    params.set('externalUserId', externalUserId);
    const res = await fetch(`${API_BASE}/loyalty/v1/ussd/menu?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP_${res.status}`);
    return res.json();
  },

  // 9. Lấy phân khúc khách hàng hiện tại (CN-01)
  async getSegmentProfile(externalUserId: string = getDefaultUserId()): Promise<SegmentProfileResponse> {
    const res = await fetch(
      `${API_BASE}/loyalty/v1/segments/me?externalUserId=${encodeURIComponent(externalUserId)}`,
      { headers: getAuthHeaders() }
    );
    if (!res.ok) throw new Error(`HTTP_${res.status}`);
    return res.json();
  },

  // 10. Hộp thư thông báo (CN-02)
  async getInboxMessages(externalUserId: string = getDefaultUserId(), category?: string): Promise<InboxMessagesResponse> {
    const params = new URLSearchParams({ externalUserId });
    if (category && category !== 'ALL') params.set('category', category);
    const res = await fetch(`${API_BASE}/loyalty/v1/inbox?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP_${res.status}`);
    return res.json();
  },

  async markInboxRead(id: number | string, externalUserId: string = getDefaultUserId()): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/loyalty/v1/inbox`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: JSON.stringify({ id, externalUserId, action: 'MARK_READ' }),
    });
    if (!res.ok) throw new Error(`HTTP_${res.status}`);
    return res.json();
  },

  // 11. Cài đặt thông báo & Opt-out tiếp thị (CN-04)
  async getNotificationPreferences(externalUserId: string = getDefaultUserId()): Promise<NotificationPreferencesDto> {
    const res = await fetch(
      `${API_BASE}/loyalty/v1/notification-preferences?externalUserId=${encodeURIComponent(externalUserId)}`,
      { headers: getAuthHeaders() }
    );
    if (!res.ok) throw new Error(`HTTP_${res.status}`);
    return res.json();
  },

  async updateNotificationPreferences(
    dto: NotificationPreferencesDto,
    externalUserId: string = getDefaultUserId()
  ): Promise<NotificationPreferencesDto> {
    const res = await fetch(`${API_BASE}/loyalty/v1/notification-preferences`, {
      method: 'PUT',
      headers: getAuthHeaders(true),
      body: JSON.stringify({ ...dto, externalUserId }),
    });
    if (!res.ok) throw new Error(`HTTP_${res.status}`);
    return res.json();
  },

  // 12. Learning & Quiz EdTech API (/gamehub/v1/learning/*)
  async getLearningCourses(): Promise<LearningCourseItem[]> {
    const res = await fetch(`${API_BASE}/gamehub/v1/learning/courses`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP_${res.status}`);
    return res.json();
  },

  async getLearningQuestions(courseId: number | string): Promise<LearningQuestionItem[]> {
    const res = await fetch(`${API_BASE}/gamehub/v1/learning/courses/${encodeURIComponent(String(courseId))}/questions`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP_${res.status}`);
    return res.json();
  },

  async submitLearningQuiz(
    courseId: number | string,
    answers: LearningQuizAnswer[],
    externalUserId: string = getDefaultUserId()
  ): Promise<LearningQuizSubmitResponse> {
    const res = await fetch(`${API_BASE}/gamehub/v1/learning/courses/${encodeURIComponent(String(courseId))}/submit`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: JSON.stringify({ externalUserId, answers }),
    });
    if (!res.ok) throw new Error(`HTTP_${res.status}`);
    return res.json();
  },

  async getLearningLeaderboard(): Promise<LearningLeaderboardItem[]> {
    const res = await fetch(`${API_BASE}/gamehub/v1/leaderboard`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP_${res.status}`);
    return res.json();
  },

  // 13. Thẻ cào may mắn (Lucky Scratch Card - GM-02)
  async playScratchCard(externalUserId: string = getDefaultUserId()): Promise<ScratchCardPlayResponse> {
    const res = await fetch(`${API_BASE}/gamehub/v1/scratch-card/play`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: JSON.stringify({ externalUserId }),
    });
    if (!res.ok) throw new Error(`HTTP_${res.status}`);
    return res.json();
  },

  // 14. Cổng Đại lý & Tổng đại lý (AG-01 & AG-02)
  async getAgentDashboard(externalUserId: string = getDefaultUserId()): Promise<AgentDashboardResponse> {
    const res = await fetch(
      `${API_BASE}/loyalty/v1/agents/me?externalUserId=${encodeURIComponent(externalUserId)}`,
      { headers: getAuthHeaders() }
    );
    if (!res.ok) throw new Error(`HTTP_${res.status}`);
    return res.json();
  },

  // 15. Lấy cấu hình và giải thưởng vòng quay may mắn
  async getLuckyWheelConfig(externalUserId: string = getDefaultUserId(), wheelCode?: string): Promise<WheelConfigData> {
    const tenant = getTenantId();
    const effectiveWheelCode =
      wheelCode ||
      (tenant === 'TENANT_NATCASH' ? 'LUCKY_WHEEL_NATCASH' : tenant === 'TENANT_MICRO_CRM' ? 'LUCKY_WHEEL_CRM' : 'LUCKY_WHEEL');
    const res = await fetch(
      `${API_BASE}/loyalty/v1/luckydraw/config?wheelCode=${encodeURIComponent(effectiveWheelCode)}&externalUserId=${encodeURIComponent(externalUserId)}`,
      { headers: getAuthHeaders() }
    );
    if (!res.ok) throw new Error(`HTTP_${res.status}`);
    return res.json();
  },

  // 16. Thực hiện quay thưởng may mắn nguyên tử
  async spinLuckyWheel(externalUserId: string = getDefaultUserId(), usePoints: boolean = false, wheelCode?: string) {
    const tenant = getTenantId();
    const effectiveWheelCode =
      wheelCode ||
      (tenant === 'TENANT_NATCASH' ? 'LUCKY_WHEEL_NATCASH' : tenant === 'TENANT_MICRO_CRM' ? 'LUCKY_WHEEL_CRM' : 'LUCKY_WHEEL');
    const res = await fetch(`${API_BASE}/loyalty/v1/luckydraw/spin`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: JSON.stringify({ externalUserId, usePoints, wheelCode: effectiveWheelCode }),
    });
    if (!res.ok) throw new Error(`HTTP_${res.status}`);
    return res.json();
  },

  // 17. Lấy kho voucher của người dùng
  async getUserVouchers(externalUserId: string = getDefaultUserId(), status: string = 'ALL'): Promise<UserVoucherItem[]> {
    const res = await fetch(
      `${API_BASE}/loyalty/v1/vouchers/my-vouchers?externalUserId=${encodeURIComponent(externalUserId)}&status=${encodeURIComponent(status)}`,
      { headers: getAuthHeaders() }
    );
    if (!res.ok) throw new Error(`HTTP_${res.status}`);
    return res.json();
  },

  // 18. Lấy danh mục voucher đối tác khả dụng để đổi điểm
  async getVoucherCatalog(): Promise<CatalogVoucherItem[]> {
    const res = await fetch(`${API_BASE}/loyalty/v1/vouchers`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP_${res.status}`);
    return res.json();
  },

  // 19. Đổi điểm lấy voucher
  async redeemVoucher(externalUserId: string, voucherCode: string): Promise<UserVoucherItem> {
    const res = await fetch(`${API_BASE}/loyalty/v1/vouchers/redeem`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: JSON.stringify({ externalUserId, voucherCode }),
    });
    if (!res.ok) throw new Error(`HTTP_${res.status}`);
    return res.json();
  },

  // 20. Lấy lịch sử biến động điểm (Sổ cái)
  async getPointLedger(externalUserId: string = getDefaultUserId(), page: number = 0, size: number = 10): Promise<{ items: LedgerItem[]; totalElements: number }> {
    const res = await fetch(
      `${API_BASE}/loyalty/v1/ledger?externalUserId=${encodeURIComponent(externalUserId)}&page=${page}&size=${size}`,
      { headers: getAuthHeaders() }
    );
    if (!res.ok) throw new Error(`HTTP_${res.status}`);
    return res.json();
  },

  // 21. Lấy danh sách đối tác liên minh
  async getPartners(): Promise<PartnerItem[]> {
    const res = await fetch(`${API_BASE}/loyalty/v1/partners`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP_${res.status}`);
    return res.json();
  },

  // 22. Khởi tạo phiên chơi minigame
  async initGameSession(gameCode: string, externalUserId: string = getDefaultUserId()): Promise<GameSessionData> {
    const res = await fetch(`${API_BASE}/gamehub/v1/session/init`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: JSON.stringify({ externalUserId, gameCode }),
    });
    if (!res.ok) throw new Error(`HTTP_${res.status}`);
    return res.json();
  },

  // 23. Ghi nhận kết quả lượt chơi minigame
  async submitGameResult(
    gameCode: string,
    score: number,
    externalUserId: string = getDefaultUserId(),
    sessionToken?: string,
    details?: string
  ) {
    const res = await fetch(`${API_BASE}/gamehub/v1/games/submit-result`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: JSON.stringify({
        externalUserId,
        gameCode,
        score,
        sessionToken,
        details,
      }),
    });
    if (!res.ok) throw new Error(`HTTP_${res.status}`);
    return res.json();
  },

  // 24. Mua thêm lượt chơi trong game bằng Điểm
  async inGameCheckout(
    gameCode: string,
    sessionToken: string,
    turnsToBuy: number = 1,
    paymentAmount: number = 10,
    externalUserId: string = getDefaultUserId()
  ) {
    const res = await fetch(`${API_BASE}/gamehub/v1/billing/in-game-checkout`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: JSON.stringify({
        externalUserId,
        gameCode,
        sessionToken,
        turnsToBuy,
        paymentAmount,
        paymentMethod: 'POINTS',
      }),
    });
    if (!res.ok) throw new Error(`HTTP_${res.status}`);
    return res.json();
  },

  // 25. Tra cứu lịch sử chơi game của người dùng
  async getGamePlayHistory(externalUserId: string = getDefaultUserId(), page: number = 0, size: number = 20) {
    const res = await fetch(
      `${API_BASE}/gamehub/v1/history/my-history?externalUserId=${encodeURIComponent(externalUserId)}&page=${page}&size=${size}`,
      { headers: getAuthHeaders() }
    );
    if (!res.ok) throw new Error(`HTTP_${res.status}`);
    return res.json();
  },

  // 26. Lấy danh sách Theme vòng quay
  async getWheelThemes() {
    const res = await fetch(`${API_BASE}/gamehub/v1/themes`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP_${res.status}`);
    return res.json();
  },

  // 27. Chọn giao diện chủ đề vòng quay
  async selectWheelTheme(themeCode: string) {
    const res = await fetch(`${API_BASE}/gamehub/v1/themes/select`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: JSON.stringify({ themeCode }),
    });
    if (!res.ok) throw new Error(`HTTP_${res.status}`);
    return res.json();
  },

  // 28. Thực hiện lượt chơi may rủi bảo mật phía Server
  async playGame(
    gameCode: string,
    clientChoice?: number,
    stepNumber?: number,
    sessionToken?: string,
    action: string = 'PLAY',
    externalUserId: string = getDefaultUserId()
  ) {
    const res = await fetch(`${API_BASE}/gamehub/v1/games/play`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: JSON.stringify({
        externalUserId,
        gameCode,
        clientChoice,
        stepNumber,
        sessionToken,
        action,
      }),
    });
    if (!res.ok) throw new Error(`HTTP_${res.status}`);
    return res.json();
  },

  // 29. Lấy chi tiết ma trận giải thưởng trò chơi
  async getGameDetail(gameCode: string, externalUserId: string = getDefaultUserId()): Promise<GameDetailData> {
    const res = await fetch(
      `${API_BASE}/gamehub/v1/games/detail?gameCode=${encodeURIComponent(gameCode)}&userId=${encodeURIComponent(externalUserId)}`,
      { headers: getAuthHeaders() }
    );
    if (!res.ok) throw new Error(`HTTP_${res.status}`);
    return res.json();
  },
};
