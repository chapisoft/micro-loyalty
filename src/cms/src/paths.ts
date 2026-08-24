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
} as const;
