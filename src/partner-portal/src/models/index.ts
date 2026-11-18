export enum CommonStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
  LOCKED = 'LOCKED',
}

export enum ApprovalTargetType {
  PROGRAM_PROPOSAL = 'PROGRAM_PROPOSAL',
  POLICY = 'POLICY',
  CAMPAIGN = 'CAMPAIGN',
  VOUCHER = 'VOUCHER',
  SETTLEMENT_CLAIM = 'SETTLEMENT_CLAIM',
}

export enum ProposalStatus {
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum PaymentBatchStatus {
  PENDING_CONFIRM = 'PENDING_CONFIRM',
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PAID = 'PAID',
  DISPUTED = 'DISPUTED',
}

export enum ApiKeyStatus {
  ACTIVE = 'ACTIVE',
  GRACE_PERIOD = 'GRACE_PERIOD',
  REVOKED = 'REVOKED',
}

export enum PartnerStaffRole {
  PARTNER_OWNER = 'PARTNER_OWNER',
  PARTNER_ADMIN = 'PARTNER_ADMIN',
  PARTNER_BRANCH_MANAGER = 'PARTNER_BRANCH_MANAGER',
  PARTNER_ACCOUNTANT = 'PARTNER_ACCOUNTANT',
  PARTNER_CASHIER = 'PARTNER_CASHIER',
}

export enum ProposalFundingType {
  CO_FUNDED_CAMPAIGN = 'CO_FUNDED_CAMPAIGN',
  VOUCHER_SUPPLY = 'VOUCHER_SUPPLY',
  TIER_PERK = 'TIER_PERK',
}

export enum PointActionType {
  EARN = 'EARN',
  BURN = 'BURN',
  REFUND = 'REFUND',
  EXPIRE = 'EXPIRE',
  ADJUST = 'ADJUST',
  CASHBACK = 'CASHBACK',
}

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  FREE_ITEM = 'FREE_ITEM',
}

export enum VoucherStatus {
  ACTIVE = 'ACTIVE',
  USED = 'USED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export enum NotificationCategory {
  ALERT = 'ALERT',
  SETTLEMENT = 'SETTLEMENT',
  SYSTEM = 'SYSTEM',
  CAMPAIGN = 'CAMPAIGN',
}

export interface ILanguage {
  code: string;
  name: string;
}

export interface UserProfile {
  userId?: number | string;
  username?: string;
  userName?: string;
  fullName?: string;
  email?: string;
  roles?: string[];
  partnerId?: number | string;
  partnerCode?: string;
  partnerName?: string;
  tenantId?: string;
  branchId?: number;
}

export interface TenantItemModel {
  id: string;
  code: string;
  name: string;
  shortName: string;
  type: string;
  country: string;
  currency: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  status: CommonStatus;
}

export interface PolicyRuleModel {
  id?: number;
  policyCode?: string;
  code?: string;
  name?: string;
  partnerId?: number;
  partnerCode?: string;
  partnerName?: string;
  type?: string;
  earnRule?: string;
  earnRate?: number;
  earnRatePercent?: number;
  exchangeRate?: number;
  maxBurnPercent?: number;
  maxBurnPercentage?: number;
  minBillAmount?: number;
  burnEnabled?: boolean;
  burnRatio?: number;
  settlementCycle?: string;
  budgetCap?: number;
  status: string;
  effectiveDate?: string;
  description?: string;
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
  partnerCode?: string;
  partnerName?: string;
  partnerType?: string;
  referenceId?: string;
  description?: string;
  status?: string;
  createdAt: string;
}

export interface VoucherItemModel {
  id: number;
  voucherCode: string;
  voucherName: string;
  discountType?: string;
  discountValue: number;
  acquireType?: 'COINS' | 'FREE_COLLECT' | 'GIVEN' | string;
  usageType?: 'NATCASH_STORE' | 'PARTNER_CODE' | 'ONLINE' | string;
  categoryCode?: string;
  branchScope?: string;
  batchQuantity?: number;
  batchPeriod?: string;
  availableQuantity?: number;
  remainingQuantity?: number;
  totalQuantity: number;
  expiryDate?: string;
  status: string;
}

export interface PartnerPortalDashboardModel {
  partnerId?: number;
  partnerCode?: string;
  partnerName?: string;
  totalEarnTransactions?: number;
  totalBurnTransactions?: number;
  burnTransactionsCount?: number;
  totalEarnAmount?: number;
  totalBurnAmount?: number;
  activeMembersCount?: number;
  pendingSettlementAmount?: number;
  activeVouchersCount?: number;
  totalVoucherRedeemed?: number;
  burnTxCount?: number;
  payingCustomersCount?: number;
  netSettlementAmount?: number;
  newMembersCount?: number;
  newMembersAcquired?: number;
  recentTransactions?: PointLedgerItem[];
}

export interface PartnerBranchModel {
  id?: number;
  partnerId?: number;
  branchCode: string;
  branchName: string;
  paymentPointCode?: string;
  address?: string;
  province?: string;
  managerPhone?: string;
  status: string;
  createdAt?: string;
}

export interface PartnerProductGroupModel {
  id?: number;
  partnerId?: number;
  groupCode: string;
  groupName: string;
  earnMultiplier: number;
  allowBurn?: boolean;
  burnAllowed?: boolean;
  productCount?: number;
  cofundRatio?: number;
  status: string;
}

export interface PartnerStaffAccountModel {
  id?: number;
  partnerId?: number;
  username: string;
  fullName: string;
  phoneNumber?: string;
  branchId?: number;
  branchName?: string;
  roleCode: PartnerStaffRole | string;
  status: CommonStatus | string;
  lastLoginAt?: string;
}

export interface PartnerProgramProposalModel {
  id?: number;
  proposalCode?: string;
  partnerId?: number;
  fundingType?: ProposalFundingType | string;
  proposalType?: string;
  programName?: string;
  title?: string;
  description?: string;
  proposedBudget?: number;
  natcashCoFundPercent?: number;
  earnRateBoostPercent?: number;
  proposedEarnAmount?: number;
  proposedBurnAmount?: number;
  budgetCap?: number;
  startDate?: string;
  endDate?: string;
  status: string;
  reviewerNote?: string;
  createdAt?: string;
}

export interface PartnerVoucherRedeemRequestModel {
  voucherCode: string;
  branchCode?: string;
  billAmount?: number;
  customerPhone?: string;
  note?: string;
}

export interface PartnerSettlementBatchModel {
  id: number;
  batchCode: string;
  periodFrom?: string;
  periodTo?: string;
  periodStart?: string;
  periodEnd?: string;
  grossAmount: number;
  mdrFeeAmount?: number;
  mdrFee?: number;
  netPayableAmount?: number;
  netPayable?: number;
  disputedAmount?: number;
  status: string;
  confirmedAt?: string;
  claimReason?: string;
}

export interface PartnerSettlementClaimRequestModel {
  batchCode: string;
  claimedAmount: number;
  reason: string;
  attachmentUrl?: string;
}

export interface PartnerNotificationModel {
  id: number;
  title: string;
  content?: string;
  message?: string;
  category: string;
  isRead: boolean;
  createdAt: string;
}

export interface PartnerApiKeyItemModel {
  id: number;
  keyPrefix: string;
  label?: string;
  partnerName?: string;
  plainTextKey?: string;
  secretKey?: string;
  status: string;
  graceExpiresAt?: string;
  gracePeriodUntil?: string;
  createdAt: string;
}

export interface PartnerApiKeyConfigModel {
  keys: PartnerApiKeyItemModel[];
  webhookUrl?: string;
  ipWhitelist?: string;
}

export interface PartnerWebhookConfigModel {
  webhookUrl: string;
  ipWhitelist?: string;
  secretHeader?: string;
}
