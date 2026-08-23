export const paths = {
  home: '/',
  // Auth
  login: '/auth/login',
  createAccount: '/auth/create-account',
  resetPassword: '/auth/reset-password',

  // Profile
  changeProfile: '/profile/change-profile',
  changePassword: '/profile/change-password',

  // Core Smart OTP Modules
  dashboard: '/dashboard',
  partners: '/partners',
  customers: '/customers',
  transactions: '/transactions',
  systemParameters: '/system-parameters',
  sandbox: '/sandbox',

  // Loyalty Core Modules
  policyConfig: '/policies',
  tierManagement: '/tiers',
  campaignMilestones: '/campaigns',
  voucherManagement: '/vouchers',
  gameManagement: '/games',
  clearingSettlement: '/clearing',

  // Admin & Security
  userManagement: '/admin/users',
  roleManagement: '/admin/roles',
  auditManagement: '/admin/audit-logs',
  deadLetterManagement: '/admin/dead-letter',
  sandboxUsers: '/admin/sandbox/users',
  sandboxGroups: '/admin/sandbox/groups',
  sandboxMenus: '/admin/sandbox/menus',
} as const;
