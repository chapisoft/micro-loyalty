export const paths = {
  home: '/',
  // Auth
  login: '/auth/login',
  createAccount: '/auth/create-account',
  resetPassword: '/auth/reset-password',

  // Profile
  changeProfile: '/profile/change-profile',
  changePassword: '/profile/change-password',

  // Loyalty Core Modules
  dashboard: '/dashboard',
  tierManagement: '/tiers',
  policyConfig: '/policies',
  campaignMilestones: '/campaigns',
  voucherManagement: '/vouchers',
  gameManagement: '/games',
  gameHubConfig: '/games/config',
  partners: '/partners',
  transactions: '/transactions',
  customers: '/customers',
  clearingSettlement: '/clearing',

  // Admin & Security
  systemParameters: '/system-parameters',
  userManagement: '/admin/users',
  roleManagement: '/admin/roles',
  auditManagement: '/admin/audit-logs',
  deadLetterManagement: '/admin/dead-letter',
  approvalQueue: '/admin/approvals',
  natcashPaymentPoints: '/partners/payment-points',
  customerSegments: '/engagement/segments',
  reminderScenarios: '/engagement/scenarios',
  budgetManagement: '/reports/budgets',
  programEffectiveness: '/reports/effectiveness',
  alertCenter: '/reports/alerts',
  advancedReports: '/reports/advanced',
  learningQuizBank: '/games/learning-quiz',
  gameStatistics: '/games/statistics',
  agentLoyaltyManagement: '/agents/loyalty',
} as const;
