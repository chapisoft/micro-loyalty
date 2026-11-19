export const CommonStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  PENDING: 'PENDING',
  EXPIRED: 'EXPIRED',
  USED: 'USED',
} as const;

export const VoucherAcquireTypeEnum = {
  COINS: 'COINS',
  FREE_COLLECT: 'FREE_COLLECT',
  GIVEN: 'GIVEN',
} as const;

export const VoucherUsageTypeEnum = {
  NATCASH_STORE: 'NATCASH_STORE',
  PARTNER_CODE: 'PARTNER_CODE',
  ONLINE: 'ONLINE',
} as const;

export const MilestoneStatusEnum = {
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CLAIMED: 'CLAIMED',
  EXPIRED: 'EXPIRED',
} as const;

export const CampaignMetricEnum = {
  BILL_AMOUNT: 'BILL_AMOUNT',
  TRANSACTION_COUNT: 'TRANSACTION_COUNT',
  EARN_POINTS: 'EARN_POINTS',
  GAME_SPINS: 'GAME_SPINS',
} as const;

export const AudienceRoleEnum = {
  CUSTOMER: 'CUSTOMER',
  AGENT: 'AGENT',
  SUPER_AGENT: 'SUPER_AGENT',
} as const;

export const GeneralCategoryType = {
  VOUCHER_CATEGORY: 'VOUCHER_CATEGORY',
} as const;

export const VoucherSortMode = {
  RECOMMENDED: 'recommended',
  POPULAR: 'popular',
  NEWEST: 'newest',
  COINS: 'coins',
  ENDING: 'ending',
} as const;
export type VoucherSortModeValue = (typeof VoucherSortMode)[keyof typeof VoucherSortMode];

export const VoucherWhereFilter = {
  ALL: 'all',
  STORE: 'store',
  ONLINE: 'online',
} as const;
export type VoucherWhereFilterValue = (typeof VoucherWhereFilter)[keyof typeof VoucherWhereFilter];

export const VoucherHowFilter = {
  ALL: 'all',
  FREE: 'free',
  COINS: 'coins',
} as const;
export type VoucherHowFilterValue = (typeof VoucherHowFilter)[keyof typeof VoucherHowFilter];

export const MissionTab = {
  IN_PROGRESS: 'IN_PROGRESS',
  AVAILABLE: 'AVAILABLE',
  COMPLETED: 'COMPLETED',
} as const;
export type MissionTabValue = (typeof MissionTab)[keyof typeof MissionTab];

export const CurrencyCode = {
  HTG: 'HTG',
} as const;
