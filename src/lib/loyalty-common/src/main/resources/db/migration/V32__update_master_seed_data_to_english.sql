-- =====================================================================================
-- V32: Update Master Seed Data, Catalog, Categories and Permissions to English
-- Standardizes all system roles, granular permissions, system parameters, master categories,
-- partners, tiers, vouchers, minigames, lucky wheels, campaigns, customer segments,
-- reminder scenarios, and demo accounts across all tenants to standard English.
-- =====================================================================================

-- -------------------------------------------------------------------------------------
-- 1. TENANTS & ECOSYSTEMS
-- -------------------------------------------------------------------------------------
UPDATE tenants SET name = 'Delimart Supermarket & Retail Ecosystem' WHERE code = 'TENANT_DELIMART';
UPDATE tenants SET name = 'Natcash Mobile E-Wallet & Natcom Telecom Platform' WHERE code = 'TENANT_NATCASH';
UPDATE tenants SET name = 'Micro-CRM Multi-Tenant Loyalty Alliance' WHERE code = 'TENANT_MICRO_CRM';

-- -------------------------------------------------------------------------------------
-- 2. SYSTEM ROLES
-- -------------------------------------------------------------------------------------
UPDATE system_roles SET name = 'Super Admin', description = 'Full system access to entire Loyalty & GameHub platform' WHERE code = 'SUPER_ADMIN';
UPDATE system_roles SET name = 'Loyalty Administrator', description = 'Manages loyalty operations, reward programs & campaigns' WHERE code = 'LOYALTY_ADMIN';
UPDATE system_roles SET name = 'Operations Specialist', description = 'Manages minigames, reward points and vouchers' WHERE code = 'OPERATOR';
UPDATE system_roles SET name = 'Campaign Manager', description = 'Configures milestones, customer segments and reminder scenarios' WHERE code = 'CAMPAIGN_MANAGER';
UPDATE system_roles SET name = 'Finance & Settlement Auditor', description = 'Audits clearing cycles, settlements and financial reconciliations' WHERE code = 'FINANCE_AUDITOR';
UPDATE system_roles SET name = 'Partner Network Manager', description = 'Coordinates partner onboarding, branches and co-funding proposals' WHERE code = 'PARTNER_MANAGER';
UPDATE system_roles SET name = 'Partner Administrator', description = 'Manages enterprise operations on Partner Portal' WHERE code = 'PARTNER_ADMIN';
UPDATE system_roles SET name = 'Customer Support Specialist', description = '360 member profile inquiry and transaction support' WHERE code = 'CUSTOMER_SUPPORT';

-- -------------------------------------------------------------------------------------
-- 3. SYSTEM PERMISSIONS (67 GRANULAR PERMISSIONS + CORE MODULES)
-- -------------------------------------------------------------------------------------
UPDATE system_permissions SET name = 'View Admin Users & Profiles', description = 'Search and view CMS admin user accounts' WHERE code = 'user.view';
UPDATE system_permissions SET name = 'Create Admin User', description = 'Create new administrator accounts on the system' WHERE code = 'user.create';
UPDATE system_permissions SET name = 'Edit Admin User', description = 'Update user full name, email, phone number' WHERE code = 'user.edit';
UPDATE system_permissions SET name = 'Delete Admin User', description = 'Permanently delete administrator accounts' WHERE code = 'user.delete';
UPDATE system_permissions SET name = 'Lock / Unlock Admin User', description = 'Suspend or reactivate login permissions' WHERE code = 'user.lock';
UPDATE system_permissions SET name = 'Assign User Roles', description = 'Assign operational roles and permissions to accounts' WHERE code = 'user.roles';
UPDATE system_permissions SET name = 'Reset User Password', description = 'Issue new password for administrator accounts' WHERE code = 'user.reset_pwd';
UPDATE system_permissions SET name = 'Export Users to Excel', description = 'Export admin user list to Excel' WHERE code = 'user.export';
UPDATE system_permissions SET name = 'View Roles & Permissions', description = 'Search and view role catalog and current permissions' WHERE code = 'role.view';
UPDATE system_permissions SET name = 'Create Admin Role', description = 'Configure new administrative roles and assign permissions' WHERE code = 'role.create';
UPDATE system_permissions SET name = 'Edit Role & Matrix', description = 'Update role name, description and permission matrix' WHERE code = 'role.edit';
UPDATE system_permissions SET name = 'Delete Admin Role', description = 'Remove unused administrative roles' WHERE code = 'role.delete';
UPDATE system_permissions SET name = 'Export Roles to Excel', description = 'Export system role catalog to Excel' WHERE code = 'role.export';
UPDATE system_permissions SET name = 'View Categories & Values', description = 'Search category groups and master data tables' WHERE code = 'category.view';
UPDATE system_permissions SET name = 'Create Category or Value', description = 'Add new category groups or lookup values' WHERE code = 'category.create';
UPDATE system_permissions SET name = 'Edit Category Data', description = 'Update name, display order and category status' WHERE code = 'category.edit';
UPDATE system_permissions SET name = 'Delete Category or Value', description = 'Remove inactive or deprecated category items' WHERE code = 'category.delete';
UPDATE system_permissions SET name = 'Export Categories to Excel', description = 'Export master data categories to Excel' WHERE code = 'category.export';
UPDATE system_permissions SET name = 'View Member List & 360 Profiles', description = 'Query points balance, tier, history and profile' WHERE code = 'customer.view';
UPDATE system_permissions SET name = 'Edit Member Profile', description = 'Update member profile details and contact info' WHERE code = 'customer.edit';
UPDATE system_permissions SET name = 'Lock / Unlock Member Account', description = 'Freeze or reactivate member points wallet' WHERE code = 'customer.lock';
UPDATE system_permissions SET name = 'Export Members to Excel', description = 'Export loyalty member list to Excel' WHERE code = 'customer.export';
UPDATE system_permissions SET name = 'View Member Tiers', description = 'Query upgrade criteria and privileges for each tier' WHERE code = 'tier.view';
UPDATE system_permissions SET name = 'Create Member Tier', description = 'Define new membership tier in loyalty program' WHERE code = 'tier.create';
UPDATE system_permissions SET name = 'Edit Tier Criteria & Benefits', description = 'Adjust threshold points, multipliers and benefits' WHERE code = 'tier.edit';
UPDATE system_permissions SET name = 'Delete Member Tier', description = 'Remove inactive membership tiers' WHERE code = 'tier.delete';
UPDATE system_permissions SET name = 'View Point Policies', description = 'Query earn rates and redemption burn limits' WHERE code = 'policy.view';
UPDATE system_permissions SET name = 'Create Point Policy', description = 'Configure new earn/burn policies for partners' WHERE code = 'policy.create';
UPDATE system_permissions SET name = 'Edit Point Policy', description = 'Update point exchange rate and redemption ratios' WHERE code = 'policy.edit';
UPDATE system_permissions SET name = 'Delete Point Policy', description = 'Deactivate expired point policies' WHERE code = 'policy.delete';
UPDATE system_permissions SET name = 'View Partner List & Profiles', description = 'Search commercial partners, branches and POS devices' WHERE code = 'partner.view';
UPDATE system_permissions SET name = 'Onboard Alliance Partner', description = 'Register new merchant partner into loyalty alliance' WHERE code = 'partner.create';
UPDATE system_permissions SET name = 'Edit Partner Information', description = 'Update partner contract, settlement and fee rates' WHERE code = 'partner.edit';
UPDATE system_permissions SET name = 'Manage Partner Keys & Security', description = 'Rotate API Key, Webhook Secret and IP Whitelist' WHERE code = 'partner.keys';
UPDATE system_permissions SET name = 'Delete Partner Profile', description = 'Deactivate partner from alliance ecosystem' WHERE code = 'partner.delete';
UPDATE system_permissions SET name = 'Export Partners to Excel', description = 'Export merchant partner directory to Excel' WHERE code = 'partner.export';
UPDATE system_permissions SET name = 'View Vouchers & Coupon Vault', description = 'Search voucher campaigns and inventory' WHERE code = 'voucher.view';
UPDATE system_permissions SET name = 'Create Voucher Campaign', description = 'Issue new vouchers, discounts and gift codes' WHERE code = 'voucher.create';
UPDATE system_permissions SET name = 'Edit Voucher Details', description = 'Update terms, validity dates and point costs' WHERE code = 'voucher.edit';
UPDATE system_permissions SET name = 'Delete / Terminate Voucher', description = 'Deactivate or recall voucher inventory' WHERE code = 'voucher.delete';
UPDATE system_permissions SET name = 'Export Vouchers to Excel', description = 'Export voucher codes and redemption logs to Excel' WHERE code = 'voucher.export';
UPDATE system_permissions SET name = 'View Campaigns & Milestones', description = 'Search promotional campaigns, tasks and conditions' WHERE code = 'campaign.view';
UPDATE system_permissions SET name = 'Create Campaign & Quests', description = 'Set up new campaigns, milestone steps and quests' WHERE code = 'campaign.create';
UPDATE system_permissions SET name = 'Edit Campaign & Budget', description = 'Update campaign rules, duration and targets' WHERE code = 'campaign.edit';
UPDATE system_permissions SET name = 'Delete / Cancel Campaign', description = 'Stop early or remove promotional campaigns' WHERE code = 'campaign.delete';
UPDATE system_permissions SET name = 'Approve Campaign Budget', description = 'Approve co-funding expenditure for campaigns' WHERE code = 'campaign.approve';
UPDATE system_permissions SET name = 'View Games & Prize Pools', description = 'Query minigames, lucky wheels and gift catalog' WHERE code = 'game.view';
UPDATE system_permissions SET name = 'Create Game or Prize Pool', description = 'Add minigame and configure prize winning structures' WHERE code = 'game.create';
UPDATE system_permissions SET name = 'Edit Win Rates & Game Budgets', description = 'Adjust probability weights and daily limits' WHERE code = 'game.edit';
UPDATE system_permissions SET name = 'Delete / Suspend Minigame', description = 'Remove or unpublish minigame from GameHub' WHERE code = 'game.delete';
UPDATE system_permissions SET name = 'View Transaction Ledger & FIFO', description = 'Inspect earn / burn / refund / expire transactions' WHERE code = 'transaction.view';
UPDATE system_permissions SET name = 'Adjust Points Balance', description = 'Submit manual point adjustment request for review' WHERE code = 'transaction.adjust';
UPDATE system_permissions SET name = 'Export Transactions to Excel', description = 'Export point ledger transactions for audit' WHERE code = 'transaction.export';
UPDATE system_permissions SET name = 'View Clearing & Settlement Cycles', description = 'Inspect multilateral clearing statements and balances' WHERE code = 'clearing.view';
UPDATE system_permissions SET name = 'Execute 3-Way Reconciliation', description = 'Trigger automated reconciliation process' WHERE code = 'clearing.execute';
UPDATE system_permissions SET name = 'Approve Settlement Disbursement', description = 'Approve cash payout batch for merchant partners' WHERE code = 'clearing.approve';
UPDATE system_permissions SET name = 'Manage Clearing Disputes', description = 'Log and resolve transaction discrepancy disputes' WHERE code = 'clearing.dispute';
UPDATE system_permissions SET name = 'Export Clearing Reports to Excel', description = 'Export clearinghouse settlement summaries' WHERE code = 'clearing.export';
UPDATE system_permissions SET name = 'View Pending Approval Queue', description = 'List Maker-Checker requests awaiting approval' WHERE code = 'approval.view';
UPDATE system_permissions SET name = 'Approve Business Request', description = 'Approve campaigns, vouchers or point adjustments' WHERE code = 'approval.approve';
UPDATE system_permissions SET name = 'Reject Business Request', description = 'Reject proposed request with reason notes' WHERE code = 'approval.reject';
UPDATE system_permissions SET name = 'View Dashboards & Analytics', description = 'Track KPI metrics, activation rates and revenue' WHERE code = 'report.view';
UPDATE system_permissions SET name = 'Export Management Reports', description = 'Export analytics and management reports to Excel' WHERE code = 'report.export';
UPDATE system_permissions SET name = 'View System Parameters', description = 'Inspect system security parameters, limits and flags' WHERE code = 'system_param.view';
UPDATE system_permissions SET name = 'Edit System Parameters', description = 'Update dynamic system configuration values' WHERE code = 'system_param.edit';
UPDATE system_permissions SET name = 'View Audit Trail Logs', description = 'Track user actions and operational history' WHERE code = 'audit_log.view';
UPDATE system_permissions SET name = 'Export Audit Logs to Excel', description = 'Export security audit trail records for compliance' WHERE code = 'audit_log.export';
UPDATE system_permissions SET name = 'User Management', description = 'Manage CMS user accounts and access status' WHERE code = 'USER_MGMT';
UPDATE system_permissions SET name = 'Role Management', description = 'Manage system roles and permission matrices' WHERE code = 'ROLE_MGMT';
UPDATE system_permissions SET name = 'Policy Management', description = 'Configure earn rates and burn redemption limits' WHERE code = 'POLICY_MGMT';
UPDATE system_permissions SET name = 'Customer Management', description = 'Query member accounts and loyalty points' WHERE code = 'CUSTOMER_MGMT';
UPDATE system_permissions SET name = 'Tier Management', description = 'Configure membership tiers and upgrade rules' WHERE code = 'TIER_MGMT';
UPDATE system_permissions SET name = 'Partner Management', description = 'Manage alliance merchant partners and branches' WHERE code = 'PARTNER_MGMT';
UPDATE system_permissions SET name = 'Voucher Management', description = 'Issue and manage discount vouchers and coupon pools' WHERE code = 'VOUCHER_MGMT';
UPDATE system_permissions SET name = 'Campaign Management', description = 'Create promotional campaigns and reward milestones' WHERE code = 'CAMPAIGN_MGMT';
UPDATE system_permissions SET name = 'GameHub Management', description = 'Manage minigames, lucky wheels and prize pools' WHERE code = 'GAME_MGMT';
UPDATE system_permissions SET name = 'Transaction Management', description = 'View point ledger and manual adjustments' WHERE code = 'TRANSACTION_MGMT';
UPDATE system_permissions SET name = 'Clearing & Settlement', description = 'Alliance multilateral clearing and settlements' WHERE code = 'CLEARING_MGMT';
UPDATE system_permissions SET name = 'Reporting & Analytics', description = 'View executive dashboards and KPI summaries' WHERE code = 'REPORT_VIEW';
UPDATE system_permissions SET name = 'System Parameter Management', description = 'Configure platform parameters and business limits' WHERE code = 'SYSTEM_PARAM_MGMT';
UPDATE system_permissions SET name = 'Audit Trail View', description = 'Inspect administrative action audit trail' WHERE code = 'AUDIT_VIEW';

-- -------------------------------------------------------------------------------------
-- 4. SYSTEM USERS
-- -------------------------------------------------------------------------------------
UPDATE system_users SET full_name = 'System Administrator' WHERE username = 'admin';
UPDATE system_users SET full_name = 'Loyalty Operations Lead' WHERE username = 'loyalty_admin';
UPDATE system_users SET full_name = 'Campaign Operations Lead' WHERE username = 'campaign_mgr';
UPDATE system_users SET full_name = 'Delimart Administrator' WHERE username = 'delimart';
UPDATE system_users SET full_name = 'Delimart Partner Portal' WHERE username = 'partner';
UPDATE system_users SET full_name = 'Delimart Operations Lead' WHERE username = 'partner_admin';

-- -------------------------------------------------------------------------------------
-- 5. SYSTEM PARAMETERS (74 DYNAMIC PARAMETERS)
-- -------------------------------------------------------------------------------------
UPDATE system_parameters SET param_name = 'Reward Point Exchange Rate (HTG)', description = 'Point-to-currency conversion rate for payment settlement (1 Point = 1 HTG)' WHERE param_key = 'LOYALTY_POINT_EXCHANGE_RATE_HTG';
UPDATE system_parameters SET param_name = 'Default Point Expiration Period (Months)', description = 'Default FIFO expiration period in months for newly earned reward points' WHERE param_key = 'WALLET_DEFAULT_POINT_EXPIRATION_MONTHS';
UPDATE system_parameters SET param_name = 'Maximum Earn Points Per Transaction', description = 'Maximum reward points allowed to be earned in a single transaction' WHERE param_key = 'WALLET_MAX_EARN_POINTS_PER_TX';
UPDATE system_parameters SET param_name = 'Maximum Earn Points Per Day', description = 'Maximum cumulative reward points an account can earn in a single day' WHERE param_key = 'WALLET_MAX_EARN_POINTS_PER_DAY';
UPDATE system_parameters SET param_name = 'FIFO Point Expiry Batch Chunk Size', description = 'Account chunk size per page for FIFO point expiration scheduled worker' WHERE param_key = 'POINT_EXPIRATION_BATCH_CHUNK_SIZE';
UPDATE system_parameters SET param_name = 'Pre-Auth Payment Hold Default TTL (Minutes)', description = 'Default time-to-live in minutes for temporary point holds during checkout' WHERE param_key = 'PAYMENT_HOLD_DEFAULT_TTL_MINUTES';
UPDATE system_parameters SET param_name = 'Percentage Divisor Constant', description = 'Divisor constant used for computing discount percentages, burn rates and MDR fees' WHERE param_key = 'PERCENT_DIVISOR';
UPDATE system_parameters SET param_name = 'Maximum Bill Redemption Percentage (%)', description = 'Maximum percentage of invoice total that can be offset using reward points' WHERE param_key = 'MAX_DAILY_BURN_PERCENTAGE';
UPDATE system_parameters SET param_name = 'Minimum Points Per Redemption', description = 'Minimum points required to execute a point redemption transaction' WHERE param_key = 'MIN_BURN_POINTS_TRANSACTION';
UPDATE system_parameters SET param_name = 'Maximum Points Per Redemption', description = 'Maximum allowable points redeemed in a single transaction' WHERE param_key = 'MAX_BURN_POINTS_PER_TX';
UPDATE system_parameters SET param_name = 'Maximum Points Redeemed Per Day', description = 'Daily aggregate point redemption limit per member account' WHERE param_key = 'MAX_BURN_POINTS_PER_DAY';
UPDATE system_parameters SET param_name = 'Default Voucher Validity Period (Days)', description = 'Standard validity period in days after voucher redemption' WHERE param_key = 'VOUCHER_DEFAULT_VALIDITY_DAYS';
UPDATE system_parameters SET param_name = 'Dynamic QR Code Time-to-Live (Seconds)', description = 'Validity duration (TTL) for POS dynamic payment QR codes' WHERE param_key = 'REWARD_WALLET_DYNAMIC_QR_TTL_SECONDS';
UPDATE system_parameters SET param_name = 'Minimum Permissible QR TTL (Seconds)', description = 'Lower bound for dynamic payment QR time-to-live configuration' WHERE param_key = 'QR_MIN_TTL_SECONDS';
UPDATE system_parameters SET param_name = 'Maximum Permissible QR TTL (Seconds)', description = 'Upper bound for dynamic payment QR time-to-live configuration' WHERE param_key = 'QR_MAX_TTL_SECONDS';
UPDATE system_parameters SET param_name = 'HMAC Signature Clock Drift Tolerance (Seconds)', description = 'Allowed clock drift tolerance for X-Timestamp in HMAC-SHA256 signatures' WHERE param_key = 'HMAC_DRIFT_TOLERANCE_SECONDS';
UPDATE system_parameters SET param_name = 'Point Redemption Distributed Lock Wait (ms)', description = 'Maximum wait time (waitTimeMs) to acquire Redisson RLock for point redemption' WHERE param_key = 'REDISSON_LOCK_BURN_TIMEOUT_MS';
UPDATE system_parameters SET param_name = 'Standard Financial Distributed Lock Lease (ms)', description = 'Maximum hold duration (leaseTimeMs) for financial point transaction locks' WHERE param_key = 'REDISSON_LOCK_LEASE_TIME_MS';
UPDATE system_parameters SET param_name = 'Short-Term Distributed Lock Lease (ms)', description = 'Lease duration for lightweight operations (voucher claim, quest check)' WHERE param_key = 'REDISSON_LOCK_SHORT_LEASE_MS';
UPDATE system_parameters SET param_name = 'Minigame Spin Distributed Lock Wait (ms)', description = 'Maximum wait time to acquire Redisson RLock for spin/game play actions' WHERE param_key = 'REDISSON_LOCK_SPIN_TIMEOUT_MS';
UPDATE system_parameters SET param_name = 'Minigame Spin Distributed Lock Lease (ms)', description = 'Maximum lease duration for minigame turn execution' WHERE param_key = 'REDISSON_LOCK_SPIN_LEASE_MS';
UPDATE system_parameters SET param_name = 'SSO Ticket Time-to-Live (Seconds)', description = 'Validity duration of single-use ticket when launching loyalty Webview' WHERE param_key = 'SESSION_TICKET_TTL_SECONDS';
UPDATE system_parameters SET param_name = 'SSO Access Token Time-to-Live (Seconds)', description = 'Validity duration of session access token exchanged from SSO ticket' WHERE param_key = 'SESSION_ACCESS_TOKEN_TTL_SECONDS';
UPDATE system_parameters SET param_name = 'Authentication OTP Code Length', description = 'Character length of one-time password (OTP) code for login verification' WHERE param_key = 'AUTH_OTP_LENGTH';
UPDATE system_parameters SET param_name = 'Default JWT Access Token TTL (Seconds)', description = 'Default time-to-live duration for JWT authentication tokens' WHERE param_key = 'AUTH_DEFAULT_TOKEN_TTL_SECONDS';
UPDATE system_parameters SET param_name = 'Default JWT Refresh Token TTL (Seconds)', description = 'Default time-to-live duration for JWT refresh tokens' WHERE param_key = 'AUTH_REFRESH_TOKEN_TTL_SECONDS';
UPDATE system_parameters SET param_name = 'Maximum Webhook Dispatch Retries', description = 'Maximum retry attempts before routing failed webhook events to Dead Letter Queue' WHERE param_key = 'WEBHOOK_MAX_RETRIES';
UPDATE system_parameters SET param_name = 'Transactional Outbox Batch Size', description = 'Number of pending outbox events polled and processed per batch iteration' WHERE param_key = 'OUTBOX_BATCH_SIZE';
UPDATE system_parameters SET param_name = 'Transactional Outbox Max Retries', description = 'Maximum retries before marking an outbox event as permanently failed' WHERE param_key = 'OUTBOX_MAX_RETRIES';
UPDATE system_parameters SET param_name = 'Processed Outbox Event Retention (Days)', description = 'Retention window in days for successfully published outbox records before purging' WHERE param_key = 'OUTBOX_CLEANUP_RETENTION_DAYS';
UPDATE system_parameters SET param_name = 'Default Partner Clearing Fee / MDR (%)', description = 'Default commission percentage charged on partner point redemptions' WHERE param_key = 'PARTNER_DEFAULT_COMMISSION_PERCENT';
UPDATE system_parameters SET param_name = 'Default Partner Settlement Credit Limit (HTG)', description = 'Maximum unsettled negative position balance allowed for a merchant partner' WHERE param_key = 'PARTNER_CREDIT_LIMIT_DEFAULT_HTG';
UPDATE system_parameters SET param_name = 'Daily 3-Way Reconciliation Run Hour (UTC)', description = 'Daily scheduled hour in UTC to trigger automated partner reconciliation' WHERE param_key = 'PARTNER_AUTO_RECON_HOUR_UTC';
UPDATE system_parameters SET param_name = 'Minimum Settlement Payout Threshold (HTG)', description = 'Minimum net settlement balance required to generate a cash payment batch' WHERE param_key = 'PARTNER_MIN_SETTLEMENT_AMOUNT_HTG';
UPDATE system_parameters SET param_name = 'Settlement Payment Due Window (Days)', description = 'Grace period in business days to finalize partner settlement payouts' WHERE param_key = 'PARTNER_PAYMENT_DUE_DAYS';
UPDATE system_parameters SET param_name = 'Dispute Resolution Expiration Window (Days)', description = 'Window in days before unconfirmed reconciliation claims are auto-closed' WHERE param_key = 'PARTNER_DISPUTE_AUTO_CLOSE_DAYS';
UPDATE system_parameters SET param_name = 'Partner API Key Rotation Grace Period (Hours)', description = 'Grace period during which retired API keys remain valid after key rotation' WHERE param_key = 'PARTNER_KEY_GRACE_PERIOD_HOURS';
UPDATE system_parameters SET param_name = 'Maximum Active API Keys Per Partner', description = 'Maximum concurrent active API keys permitted per partner merchant' WHERE param_key = 'PARTNER_MAX_ACTIVE_KEYS';
UPDATE system_parameters SET param_name = 'Max Failed Login Attempts Before Lock', description = 'Maximum consecutive failed login attempts before locking user account' WHERE param_key = 'SECURITY_FAILED_LOGIN_MAX_ATTEMPTS';
UPDATE system_parameters SET param_name = 'Account Lockout Duration (Minutes)', description = 'Duration in minutes an account remains locked after repeated failed logins' WHERE param_key = 'SECURITY_LOCKOUT_DURATION_MINUTES';
UPDATE system_parameters SET param_name = 'Minimum Password Length', description = 'Minimum character length required for user passwords' WHERE param_key = 'SECURITY_PASSWORD_MIN_LENGTH';
UPDATE system_parameters SET param_name = 'Password Expiration Window (Days)', description = 'Maximum period in days before administrator passwords require rotation' WHERE param_key = 'SECURITY_PASSWORD_EXPIRY_DAYS';
UPDATE system_parameters SET param_name = 'Strict IP Whitelist Enforcement Flag', description = 'Enforce strict IP validation for partner API Gateway access' WHERE param_key = 'SECURITY_IP_WHITELIST_STRICT_MODE';
UPDATE system_parameters SET param_name = 'Security Audit Trail Retention (Months)', description = 'Retention duration in months for compliance audit logs before archival' WHERE param_key = 'AUDIT_LOG_RETENTION_MONTHS';
UPDATE system_parameters SET param_name = 'Asynchronous Audit Log Queue Capacity', description = 'In-memory buffer capacity for asynchronous audit log publisher' WHERE param_key = 'AUDIT_LOG_ASYNC_QUEUE_CAPACITY';
UPDATE system_parameters SET param_name = 'Default Max Points Cap Per Campaign', description = 'Default ceiling on total reward points budget for a promotional campaign' WHERE param_key = 'CAMPAIGN_DEFAULT_MAX_REWARD_POINTS';
UPDATE system_parameters SET param_name = 'Maximum Concurrent Active Campaigns', description = 'Maximum concurrent running campaigns allowed per tenant ecosystem' WHERE param_key = 'CAMPAIGN_MAX_ACTIVE_PER_TENANT';
UPDATE system_parameters SET param_name = 'Minimum Campaign Duration (Days)', description = 'Minimum permissible duration in days when creating a new campaign' WHERE param_key = 'CAMPAIGN_MIN_DAYS_DURATION';
UPDATE system_parameters SET param_name = 'Maximum Campaign Duration (Days)', description = 'Maximum permissible duration in days when creating a new campaign' WHERE param_key = 'CAMPAIGN_MAX_DAYS_DURATION';
UPDATE system_parameters SET param_name = 'Default A/B Test Control Group Ratio (%)', description = 'Default percentage of users assigned to holdout control group for A/B analytics' WHERE param_key = 'CAMPAIGN_DEFAULT_CONTROL_GROUP_PERCENT';
UPDATE system_parameters SET param_name = 'VIP Segment Qualifying Points Threshold', description = 'Minimum qualifying tier points to automatically classify member as HIGH_VALUE' WHERE param_key = 'SEGMENT_VIP_MIN_TIER_POINTS';
UPDATE system_parameters SET param_name = 'Daily Free Lucky Wheel Spins', description = 'Number of complimentary lucky wheel spins granted to members daily' WHERE param_key = 'GAME_LUCKY_DRAW_FREE_DAILY_TURNS';
UPDATE system_parameters SET param_name = 'Default Lucky Wheel Code', description = 'Default lucky wheel identifier applied when request omits wheelCode' WHERE param_key = 'DEFAULT_WHEEL_CODE';
UPDATE system_parameters SET param_name = 'Minigame Session Time-to-Live (Seconds)', description = 'Active session lifetime in seconds for interactive GameHub minigames' WHERE param_key = 'GAME_SESSION_TTL_SECONDS';
UPDATE system_parameters SET param_name = 'Default Daily Game Reward Budget (HTG)', description = 'Default maximum daily reward points budget allocated across minigames' WHERE param_key = 'GAME_DEFAULT_DAILY_BUDGET';
UPDATE system_parameters SET param_name = 'Default Consolation Reward Points', description = 'Minimum encouragement points granted when daily budget is capped or on non-winning turns' WHERE param_key = 'GAME_CONSOLATION_POINTS';
UPDATE system_parameters SET param_name = 'Points Cost Per Minigame Turn', description = 'Default reward points required to purchase an additional minigame play turn' WHERE param_key = 'GAME_DEFAULT_POINTS_PER_TURN';
UPDATE system_parameters SET param_name = 'Maximum Minigame Turns Per Day Per User', description = 'Daily limit on paid and free minigame turns per member account' WHERE param_key = 'GAME_DEFAULT_MAX_DAILY_TURNS';
UPDATE system_parameters SET param_name = 'Game Studio Partner Revenue Share (%)', description = 'Default revenue sharing percentage paid to game development studio partners' WHERE param_key = 'GAME_DEFAULT_REVENUE_SHARE_PERCENT';
UPDATE system_parameters SET param_name = 'Default Lucky Wheel Visual Theme Code', description = 'Fallback visual theme code used when tenant has not assigned custom wheel styling' WHERE param_key = 'GAME_DEFAULT_WHEEL_THEME_CODE';
UPDATE system_parameters SET param_name = 'Lucky Wheel Total Probability Weight Target', description = 'Target aggregate weight used when calibrating lucky wheel probability slices' WHERE param_key = 'WHEEL_PROBABILITY_TOTAL_WEIGHT';
UPDATE system_parameters SET param_name = 'Minigame Prize Total Probability Weight Target', description = 'Target aggregate weight used when balancing minigame reward prize matrices' WHERE param_key = 'GAME_PRIZE_PROBABILITY_TOTAL_WEIGHT';
UPDATE system_parameters SET param_name = 'Quiz Level 1 Minimum Correct Answers', description = 'Threshold of correct answers to achieve Tier 1 reward in trivia quiz' WHERE param_key = 'LEARNING_TIER1_CORRECT';
UPDATE system_parameters SET param_name = 'Quiz Level 2 Minimum Correct Answers', description = 'Threshold of correct answers to achieve Tier 2 reward in trivia quiz' WHERE param_key = 'LEARNING_TIER2_CORRECT';
UPDATE system_parameters SET param_name = 'Quiz Level 3 Minimum Correct Answers', description = 'Threshold of correct answers to achieve Tier 3 reward in trivia quiz' WHERE param_key = 'LEARNING_TIER3_CORRECT';
UPDATE system_parameters SET param_name = 'Monthly Agent New Customer Target', description = 'Minimum number of successfully verified eKYC customers per month for agent reward' WHERE param_key = 'AGENT_MONTHLY_NEW_CUSTOMER_TARGET';
UPDATE system_parameters SET param_name = 'Agent Monthly Target Reward (HTG)', description = 'Fixed monetary reward (HTG) granted to retail agents reaching monthly targets' WHERE param_key = 'AGENT_REWARD_HTG';
UPDATE system_parameters SET param_name = 'Master Agent Network Achievement Rate (%)', description = 'Minimum percentage of subordinate agents meeting targets for master agent reward' WHERE param_key = 'AGENT_SUPER_MIN_ACHIEVEMENT_PCT';
UPDATE system_parameters SET param_name = 'Master Agent Target Reward (HTG)', description = 'Fixed monetary reward (HTG) granted to master agents reaching network targets' WHERE param_key = 'AGENT_SUPER_REWARD_HTG';
UPDATE system_parameters SET param_name = 'Max Point Adjustment Requiring Approval', description = 'Threshold points above which manual point adjustments require Maker-Checker authorization' WHERE param_key = 'APPROVAL_POINT_ADJUSTMENT_MAX_LIMIT';
UPDATE system_parameters SET param_name = 'Default System Approval Actor ID', description = 'System identifier logged as actor for automated system approval transitions' WHERE param_key = 'APPROVAL_DEFAULT_SYSTEM_ACTOR';
UPDATE system_parameters SET param_name = 'Standard ISO Date String Length (yyyy-MM-dd)', description = 'Character length of ISO standard local date strings for range parsing' WHERE param_key = 'ISO_LOCAL_DATE_LENGTH';
UPDATE system_parameters SET param_name = 'Platform Operating Mode', description = 'Current platform operational mode (NORMAL, MAINTENANCE, READ_ONLY)' WHERE param_key = 'SYSTEM_OPERATION_MODE';
UPDATE system_parameters SET param_name = 'System Parameter Cache TTL (Seconds)', description = 'Time-to-live in seconds for system configuration parameters in Redis and L1 cache' WHERE param_key = 'SYSTEM_CACHE_TTL_SECONDS';
UPDATE system_parameters SET param_name = 'Advanced Feature Toggles (JSON)', description = 'JSON-formatted feature flags dictionary controlling modular platform capabilities' WHERE param_key = 'FEATURE_FLAGS_JSON';

-- -------------------------------------------------------------------------------------
-- 6. SYSTEM CODE GENERATION TYPES (23 TYPES)
-- -------------------------------------------------------------------------------------
UPDATE sys_code_types SET description = 'Clearinghouse financial settlement batch identifier' WHERE code_type = 'SETTLEMENT_BATCH';
UPDATE sys_code_types SET description = 'Partner payment disbursement statement identifier' WHERE code_type = 'PAYMENT_BATCH';
UPDATE sys_code_types SET description = 'Automated B2B reconciliation session identifier' WHERE code_type = 'RECON_BATCH';
UPDATE sys_code_types SET description = 'B2B clearing discrepancy dispute case identifier' WHERE code_type = 'CLEARING_DISPUTE';
UPDATE sys_code_types SET description = 'Partner Portal payment reconciliation claim code' WHERE code_type = 'PARTNER_CLAIM';
UPDATE sys_code_types SET description = 'Pre-authorization point payment hold reference' WHERE code_type = 'PAYMENT_HOLD';
UPDATE sys_code_types SET description = 'Maker-Checker authorization request ticket code' WHERE code_type = 'APPROVAL_REQ';
UPDATE sys_code_types SET description = 'System promotional voucher / coupon campaign code' WHERE code_type = 'VOUCHER_CODE';
UPDATE sys_code_types SET description = 'Point ledger transaction reference for voucher redemption' WHERE code_type = 'VOUCHER_REDEEM';
UPDATE sys_code_types SET description = 'Unique voucher redemption voucher code issued to member' WHERE code_type = 'VOUCHER_REDEMPTION_CODE';
UPDATE sys_code_types SET description = 'Promotional campaign and reward quest code' WHERE code_type = 'CAMPAIGN';
UPDATE sys_code_types SET description = 'Campaign rule condition set identifier' WHERE code_type = 'CAMPAIGN_RULE';
UPDATE sys_code_types SET description = 'Milestone reward quest claim transaction code' WHERE code_type = 'MILESTONE_CLAIM';
UPDATE sys_code_types SET description = 'Commercial alliance partner merchant identifier' WHERE code_type = 'PARTNER';
UPDATE sys_code_types SET description = 'Partner store / branch location code' WHERE code_type = 'PARTNER_BRANCH';
UPDATE sys_code_types SET description = 'Partner product / merchandise category group code' WHERE code_type = 'PARTNER_GROUP';
UPDATE sys_code_types SET description = 'Natcash proprietary cashier / POS terminal code' WHERE code_type = 'PARTNER_PAYMENT_POINT';
UPDATE sys_code_types SET description = 'GameHub points / turn transaction identifier' WHERE code_type = 'GAME_TX';
UPDATE sys_code_types SET description = 'GameHub gameplay session history identifier' WHERE code_type = 'GAME_PLAY_TX';
UPDATE sys_code_types SET description = 'Lucky Wheel spin turn and prize claim transaction code' WHERE code_type = 'SPIN_TX';
UPDATE sys_code_types SET description = 'Trivia quiz knowledge reward transaction code' WHERE code_type = 'QUIZ_REWARD_TX';
UPDATE sys_code_types SET description = 'Periodic FIFO point expiration ledger batch code' WHERE code_type = 'POINT_EXPIRY_TX';
UPDATE sys_code_types SET description = 'General point movement and transaction audit reference' WHERE code_type = 'POINT_TX';

-- -------------------------------------------------------------------------------------
-- 7. MASTER GENERAL CATEGORIES (22 GROUPS + 106 LOOKUP VALUES)
-- -------------------------------------------------------------------------------------
UPDATE cfg_general_categories SET name = 'Alliance Partner Type', description = 'Classification of commercial partners participating in loyalty alliance' WHERE category_type = 'CATEGORY_GROUP' AND code = 'PARTNER_TYPE';
UPDATE cfg_general_categories SET name = 'Member Status', description = 'Customer account lifecycle status in point reward system' WHERE category_type = 'CATEGORY_GROUP' AND code = 'MEMBER_STATUS';
UPDATE cfg_general_categories SET name = 'Transaction Type', description = 'Point ledger balance movement classifications' WHERE category_type = 'CATEGORY_GROUP' AND code = 'TRANSACTION_TYPE';
UPDATE cfg_general_categories SET name = 'Transaction Status', description = 'Processing status of point earn, burn and refund transactions' WHERE category_type = 'CATEGORY_GROUP' AND code = 'TRANSACTION_STATUS';
UPDATE cfg_general_categories SET name = 'Voucher Status', description = 'Lifecycle and redemption status of reward vouchers' WHERE category_type = 'CATEGORY_GROUP' AND code = 'VOUCHER_STATUS';
UPDATE cfg_general_categories SET name = 'Discount Type', description = 'Reward discount mechanism or calculation type' WHERE category_type = 'CATEGORY_GROUP' AND code = 'DISCOUNT_TYPE';
UPDATE cfg_general_categories SET name = 'Game Type', description = 'Interactive minigame categories for user engagement' WHERE category_type = 'CATEGORY_GROUP' AND code = 'GAME_TYPE';
UPDATE cfg_general_categories SET name = 'Prize Type', description = 'Reward types granted from minigames and campaigns' WHERE category_type = 'CATEGORY_GROUP' AND code = 'PRIZE_TYPE';
UPDATE cfg_general_categories SET name = 'Campaign Quest Category', description = 'Classification of user quest actions and mission tasks' WHERE category_type = 'CATEGORY_GROUP' AND code = 'CAMPAIGN_MISSION_CATEGORY';
UPDATE cfg_general_categories SET name = 'Approval Status', description = 'Maker-Checker approval workflow status' WHERE category_type = 'CATEGORY_GROUP' AND code = 'APPROVAL_STATUS';
UPDATE cfg_general_categories SET name = 'Approval Target Type', description = 'Entities requiring dual-control Maker-Checker authorization' WHERE category_type = 'CATEGORY_GROUP' AND code = 'APPROVAL_TARGET_TYPE';
UPDATE cfg_general_categories SET name = 'Clearing Status', description = 'Alliance clearinghouse and settlement cycle status' WHERE category_type = 'CATEGORY_GROUP' AND code = 'CLEARING_STATUS';
UPDATE cfg_general_categories SET name = 'Dispute Status', description = 'Reconciliation discrepancy and dispute resolution stage' WHERE category_type = 'CATEGORY_GROUP' AND code = 'DISPUTE_STATUS';
UPDATE cfg_general_categories SET name = 'Payment Batch Status', description = 'Cash payout batch disbursement execution status' WHERE category_type = 'CATEGORY_GROUP' AND code = 'PAYMENT_BATCH_STATUS';
UPDATE cfg_general_categories SET name = 'Alert Severity', description = 'System incident severity and risk categorization' WHERE category_type = 'CATEGORY_GROUP' AND code = 'ALERT_SEVERITY';
UPDATE cfg_general_categories SET name = 'Alert Status', description = 'Alert resolution and acknowledgment lifecycle' WHERE category_type = 'CATEGORY_GROUP' AND code = 'ALERT_STATUS';
UPDATE cfg_general_categories SET name = 'Admin User Status', description = 'Administrative account operational status' WHERE category_type = 'CATEGORY_GROUP' AND code = 'SYSTEM_USER_STATUS';
UPDATE cfg_general_categories SET name = 'Integration Protocol Type', description = 'Technical integration protocols between services' WHERE category_type = 'CATEGORY_GROUP' AND code = 'INTEGRATION_TYPE';
UPDATE cfg_general_categories SET name = 'Data Value Type', description = 'Data format classification for system configuration parameters' WHERE category_type = 'CATEGORY_GROUP' AND code = 'VALUE_TYPE';
UPDATE cfg_general_categories SET name = 'Customer Segment Type', description = 'Behavioral and financial segmentation of members' WHERE category_type = 'CATEGORY_GROUP' AND code = 'CUSTOMER_SEGMENT_TYPE';
UPDATE cfg_general_categories SET name = 'Reminder Trigger Type', description = 'Events triggering smart contextual notifications' WHERE category_type = 'CATEGORY_GROUP' AND code = 'REMINDER_TRIGGER_TYPE';
UPDATE cfg_general_categories SET name = 'Agent Tier Role', description = 'Agent network hierarchy and branch operational levels' WHERE category_type = 'CATEGORY_GROUP' AND code = 'AGENT_ROLE_TYPE';

UPDATE cfg_general_categories SET name = 'Retail & Convenience Stores', description = 'Grocery, convenience and general merchandise stores' WHERE category_type = 'PARTNER_TYPE' AND code = 'RETAIL';
UPDATE cfg_general_categories SET name = 'Supermarkets & Food', description = 'Supermarket chains and fresh produce markets' WHERE category_type = 'PARTNER_TYPE' AND code = 'GROCERY';
UPDATE cfg_general_categories SET name = 'Food & Beverage', description = 'Restaurants, cafes and catering services' WHERE category_type = 'PARTNER_TYPE' AND code = 'FNB';
UPDATE cfg_general_categories SET name = 'Banking & Finance', description = 'Financial institutions, payment gateways and digital wallets' WHERE category_type = 'PARTNER_TYPE' AND code = 'BANK';
UPDATE cfg_general_categories SET name = 'Telecom & Digital', description = 'Telecommunication operators and mobile digital services' WHERE category_type = 'PARTNER_TYPE' AND code = 'TELCO';
UPDATE cfg_general_categories SET name = 'Entertainment & Cinema', description = 'Movie theaters, amusement parks and event venues' WHERE category_type = 'PARTNER_TYPE' AND code = 'ENTERTAINMENT';
UPDATE cfg_general_categories SET name = 'Healthcare & Pharmacy', description = 'Pharmacies, clinics and hospitals' WHERE category_type = 'PARTNER_TYPE' AND code = 'HEALTHCARE';
UPDATE cfg_general_categories SET name = 'Transportation & Mobility', description = 'Ride-hailing, taxis, bus tickets and airlines' WHERE category_type = 'PARTNER_TYPE' AND code = 'TRANSPORTATION';
UPDATE cfg_general_categories SET name = 'Other Industries', description = 'Other commercial partner services' WHERE category_type = 'PARTNER_TYPE' AND code = 'OTHER';
UPDATE cfg_general_categories SET name = 'Active', description = 'Normal member account with earn and burn permissions' WHERE category_type = 'MEMBER_STATUS' AND code = 'ACTIVE';
UPDATE cfg_general_categories SET name = 'Inactive', description = 'Dormant account with no recent transaction activity' WHERE category_type = 'MEMBER_STATUS' AND code = 'INACTIVE';
UPDATE cfg_general_categories SET name = 'Locked / Suspended', description = 'Temporarily frozen due to security violation or fraud alert' WHERE category_type = 'MEMBER_STATUS' AND code = 'LOCKED';
UPDATE cfg_general_categories SET name = 'Pending Verification', description = 'Newly registered account awaiting eKYC identity check' WHERE category_type = 'MEMBER_STATUS' AND code = 'PENDING_VERIFY';
UPDATE cfg_general_categories SET name = 'Terminated', description = 'Permanently closed member account' WHERE category_type = 'MEMBER_STATUS' AND code = 'TERMINATED';
UPDATE cfg_general_categories SET name = 'Earn Points', description = 'Points accumulated from purchase or topup transactions' WHERE category_type = 'TRANSACTION_TYPE' AND code = 'EARN';
UPDATE cfg_general_categories SET name = 'Redeem Points', description = 'Points deducted for bill payment or voucher exchange' WHERE category_type = 'TRANSACTION_TYPE' AND code = 'BURN';
UPDATE cfg_general_categories SET name = 'Refund Points', description = 'Points refunded back to wallet from cancelled orders' WHERE category_type = 'TRANSACTION_TYPE' AND code = 'REFUND';
UPDATE cfg_general_categories SET name = 'Manual Adjustment', description = 'Manual point adjustment approved via Maker-Checker' WHERE category_type = 'TRANSACTION_TYPE' AND code = 'ADJUST';
UPDATE cfg_general_categories SET name = 'Expire Points', description = 'Points expired based on FIFO maturity policy' WHERE category_type = 'TRANSACTION_TYPE' AND code = 'EXPIRE';
UPDATE cfg_general_categories SET name = 'Transfer Points', description = 'Points transferred to another member wallet' WHERE category_type = 'TRANSACTION_TYPE' AND code = 'TRANSFER';
UPDATE cfg_general_categories SET name = 'Pre-Auth Hold', description = 'Temporary point hold during POS transaction checkout' WHERE category_type = 'TRANSACTION_TYPE' AND code = 'HOLD';
UPDATE cfg_general_categories SET name = 'Success', description = 'Transaction successfully processed and balance updated' WHERE category_type = 'TRANSACTION_STATUS' AND code = 'SUCCESS';
UPDATE cfg_general_categories SET name = 'Pending', description = 'Transaction awaiting confirmation or upstream response' WHERE category_type = 'TRANSACTION_STATUS' AND code = 'PENDING';
UPDATE cfg_general_categories SET name = 'Failed', description = 'Transaction rejected due to system error or limit breach' WHERE category_type = 'TRANSACTION_STATUS' AND code = 'FAILED';
UPDATE cfg_general_categories SET name = 'Cancelled', description = 'Transaction cancelled before settlement completion' WHERE category_type = 'TRANSACTION_STATUS' AND code = 'CANCELLED';
UPDATE cfg_general_categories SET name = 'On Hold', description = 'Points temporarily held pending final capture' WHERE category_type = 'TRANSACTION_STATUS' AND code = 'HOLD';
UPDATE cfg_general_categories SET name = 'Active', description = 'Voucher published and ready for redemption' WHERE category_type = 'VOUCHER_STATUS' AND code = 'ACTIVE';
UPDATE cfg_general_categories SET name = 'Draft', description = 'Voucher draft under configuration or pending review' WHERE category_type = 'VOUCHER_STATUS' AND code = 'DRAFT';
UPDATE cfg_general_categories SET name = 'Depleted', description = 'All voucher codes claimed - inventory exhausted' WHERE category_type = 'VOUCHER_STATUS' AND code = 'DEPLETED';
UPDATE cfg_general_categories SET name = 'Expired', description = 'Voucher passed expiration date and can no longer be used' WHERE category_type = 'VOUCHER_STATUS' AND code = 'EXPIRED';
UPDATE cfg_general_categories SET name = 'Suspended', description = 'Temporarily paused by merchant partner or administrator' WHERE category_type = 'VOUCHER_STATUS' AND code = 'SUSPENDED';
UPDATE cfg_general_categories SET name = 'Fixed Amount Discount', description = 'Direct reduction of a specific currency amount on bill' WHERE category_type = 'DISCOUNT_TYPE' AND code = 'FIXED_AMOUNT';
UPDATE cfg_general_categories SET name = 'Percentage Discount', description = 'Percentage discount on qualifying invoice subtotal' WHERE category_type = 'DISCOUNT_TYPE' AND code = 'PERCENTAGE';
UPDATE cfg_general_categories SET name = 'Free Shipping', description = 'Waiver of delivery or courier fee' WHERE category_type = 'DISCOUNT_TYPE' AND code = 'FREE_SHIPPING';
UPDATE cfg_general_categories SET name = 'Complimentary Gift', description = 'Free merchandise or promotional item upon checkout' WHERE category_type = 'DISCOUNT_TYPE' AND code = 'GIFT_ITEM';
UPDATE cfg_general_categories SET name = 'Lucky Wheel', description = 'Fortune prize wheel with configurable probability slices' WHERE category_type = 'GAME_TYPE' AND code = 'LUCKY_WHEEL';
UPDATE cfg_general_categories SET name = 'Scratch Card', description = 'Instant win scratch cards with matching symbols' WHERE category_type = 'GAME_TYPE' AND code = 'SCRATCH_CARD';
UPDATE cfg_general_categories SET name = 'Trivia Quiz', description = 'Knowledge challenge questions rewarding bonus points' WHERE category_type = 'GAME_TYPE' AND code = 'QUIZ';
UPDATE cfg_general_categories SET name = 'Daily Check-in', description = 'Consecutive daily check-in rewards and streak bonuses' WHERE category_type = 'GAME_TYPE' AND code = 'DAILY_CHECKIN';
UPDATE cfg_general_categories SET name = 'Puzzle Quest', description = 'Brain teaser, tangram and tile matching puzzles' WHERE category_type = 'GAME_TYPE' AND code = 'PUZZLE';
UPDATE cfg_general_categories SET name = 'Sports Challenge', description = 'Penalty kicks, basketball shots and sports mini-games' WHERE category_type = 'GAME_TYPE' AND code = 'SPORTS_CHALLENGE';
UPDATE cfg_general_categories SET name = 'Loyalty Points', description = 'Bonus points credited directly to member wallet' WHERE category_type = 'PRIZE_TYPE' AND code = 'POINTS';
UPDATE cfg_general_categories SET name = 'Discount Voucher', description = 'Electronic voucher coupon added to member vault' WHERE category_type = 'PRIZE_TYPE' AND code = 'VOUCHER';
UPDATE cfg_general_categories SET name = 'Wallet Cashback', description = 'Direct cash credit into digital wallet balance' WHERE category_type = 'PRIZE_TYPE' AND code = 'CASHBACK';
UPDATE cfg_general_categories SET name = 'Score Multiplier', description = 'Multiplier boosting transaction points for a limited time' WHERE category_type = 'PRIZE_TYPE' AND code = 'MULTIPLIER';
UPDATE cfg_general_categories SET name = 'Bonus Game Turn', description = 'Extra free turn to continue playing minigames' WHERE category_type = 'PRIZE_TYPE' AND code = 'EXTRA_TURN';
UPDATE cfg_general_categories SET name = 'Physical Gift', description = 'Tangible merchandise claimed at partner branch' WHERE category_type = 'PRIZE_TYPE' AND code = 'PHYSICAL_GIFT';
UPDATE cfg_general_categories SET name = 'Better Luck Next Time', description = 'Encouragement consolation message with zero points' WHERE category_type = 'PRIZE_TYPE' AND code = 'NO_LUCK';
UPDATE cfg_general_categories SET name = 'Welcome Quests', description = 'First-time registration, eKYC and profile completion' WHERE category_type = 'CAMPAIGN_MISSION_CATEGORY' AND code = 'ONBOARDING';
UPDATE cfg_general_categories SET name = 'Spend Threshold', description = 'Reach target invoice spending within promotion period' WHERE category_type = 'CAMPAIGN_MISSION_CATEGORY' AND code = 'SPEND_THRESHOLD';
UPDATE cfg_general_categories SET name = 'Transaction Streak', description = 'Complete repeat transactions for consecutive days/weeks' WHERE category_type = 'CAMPAIGN_MISSION_CATEGORY' AND code = 'TRANSACTION_STREAK';
UPDATE cfg_general_categories SET name = 'Cross-Partner Shopping', description = 'Transact across multiple alliance partner merchants' WHERE category_type = 'CAMPAIGN_MISSION_CATEGORY' AND code = 'CROSS_PARTNER';
UPDATE cfg_general_categories SET name = 'Digital Payments', description = 'Scan QR or pay utility bills via digital wallet' WHERE category_type = 'CAMPAIGN_MISSION_CATEGORY' AND code = 'DIGITAL_PAYMENT';
UPDATE cfg_general_categories SET name = 'Social & Referral', description = 'Refer friends or share campaign on social media' WHERE category_type = 'CAMPAIGN_MISSION_CATEGORY' AND code = 'SOCIAL_ENGAGEMENT';
UPDATE cfg_general_categories SET name = 'Pending Review', description = 'Awaiting review and approval from authorized checker' WHERE category_type = 'APPROVAL_STATUS' AND code = 'PENDING';
UPDATE cfg_general_categories SET name = 'Approved', description = 'Request verified and approved for execution' WHERE category_type = 'APPROVAL_STATUS' AND code = 'APPROVED';
UPDATE cfg_general_categories SET name = 'Rejected', description = 'Request rejected with reviewer reason notes' WHERE category_type = 'APPROVAL_STATUS' AND code = 'REJECTED';
UPDATE cfg_general_categories SET name = 'Cancelled', description = 'Request withdrawn by initiator before approval' WHERE category_type = 'APPROVAL_STATUS' AND code = 'CANCELLED';
UPDATE cfg_general_categories SET name = 'Campaign Co-funding Budget', description = 'Proposal for campaign subsidy and co-funding budget' WHERE category_type = 'APPROVAL_TARGET_TYPE' AND code = 'CAMPAIGN_BUDGET';
UPDATE cfg_general_categories SET name = 'Voucher Pool Issuance', description = 'Approval for issuing large-quantity discount vouchers' WHERE category_type = 'APPROVAL_TARGET_TYPE' AND code = 'VOUCHER_ISSUANCE';
UPDATE cfg_general_categories SET name = 'Manual Point Adjustment', description = 'Customer support adjustment to member point balance' WHERE category_type = 'APPROVAL_TARGET_TYPE' AND code = 'POINT_ADJUSTMENT';
UPDATE cfg_general_categories SET name = 'Partner Profile Approval', description = 'Verification and onboarding approval for new merchant' WHERE category_type = 'APPROVAL_TARGET_TYPE' AND code = 'PARTNER_ONBOARDING';
UPDATE cfg_general_categories SET name = 'Clearing Payout Batch', description = 'Authorization of cash settlement payout to merchant' WHERE category_type = 'APPROVAL_TARGET_TYPE' AND code = 'CLEARING_PAYOUT';
UPDATE cfg_general_categories SET name = 'Open Cycle', description = 'Clearing period currently ongoing and collecting transactions' WHERE category_type = 'CLEARING_STATUS' AND code = 'OPEN';
UPDATE cfg_general_categories SET name = 'Reconciled', description = 'Multilateral positions calculated and ready for confirmation' WHERE category_type = 'CLEARING_STATUS' AND code = 'CALCULATED';
UPDATE cfg_general_categories SET name = 'Confirmed', description = 'Both parties verified and signed off settlement statement' WHERE category_type = 'CLEARING_STATUS' AND code = 'CONFIRMED';
UPDATE cfg_general_categories SET name = 'Disbursed / Paid', description = 'Cash payout transferred to partner bank account' WHERE category_type = 'CLEARING_STATUS' AND code = 'DISBURSED';
UPDATE cfg_general_categories SET name = 'Disputed', description = 'Cycle flagged with discrepancy awaiting dispute resolution' WHERE category_type = 'CLEARING_STATUS' AND code = 'DISPUTED';
UPDATE cfg_general_categories SET name = 'Open Dispute', description = 'Newly filed discrepancy awaiting investigation' WHERE category_type = 'DISPUTE_STATUS' AND code = 'OPEN';
UPDATE cfg_general_categories SET name = 'Under Investigation', description = 'Operations team cross-checking logs and settlement data' WHERE category_type = 'DISPUTE_STATUS' AND code = 'INVESTIGATING';
UPDATE cfg_general_categories SET name = 'Resolved', description = 'Discrepancy reconciled and compensation agreed' WHERE category_type = 'DISPUTE_STATUS' AND code = 'RESOLVED';
UPDATE cfg_general_categories SET name = 'Dispute Rejected', description = 'Claim found invalid following audit log verification' WHERE category_type = 'DISPUTE_STATUS' AND code = 'REJECTED';
UPDATE cfg_general_categories SET name = 'Batch Created', description = 'Disbursement statement compiled for payment' WHERE category_type = 'PAYMENT_BATCH_STATUS' AND code = 'CREATED';
UPDATE cfg_general_categories SET name = 'Authorized', description = 'Authorized by finance manager for wire transfer' WHERE category_type = 'PAYMENT_BATCH_STATUS' AND code = 'AUTHORIZED';
UPDATE cfg_general_categories SET name = 'Executing Payout', description = 'Payout order in transit via banking/wallet gateway' WHERE category_type = 'PAYMENT_BATCH_STATUS' AND code = 'EXECUTING';
UPDATE cfg_general_categories SET name = 'Completed', description = 'Funds successfully credited to merchant account' WHERE category_type = 'PAYMENT_BATCH_STATUS' AND code = 'COMPLETED';
UPDATE cfg_general_categories SET name = 'Payout Failed', description = 'Bank transfer rejected - requires review' WHERE category_type = 'PAYMENT_BATCH_STATUS' AND code = 'FAILED';
UPDATE cfg_general_categories SET name = 'Informational', description = 'Routine notification and normal system status' WHERE category_type = 'ALERT_SEVERITY' AND code = 'INFO';
UPDATE cfg_general_categories SET name = 'Warning', description = 'Potential anomaly approaching operational threshold' WHERE category_type = 'ALERT_SEVERITY' AND code = 'WARNING';
UPDATE cfg_general_categories SET name = 'Error', description = 'Service error or transaction disruption requiring attention' WHERE category_type = 'ALERT_SEVERITY' AND code = 'ERROR';
UPDATE cfg_general_categories SET name = 'Critical', description = 'High-severity incident affecting financial or system integrity' WHERE category_type = 'ALERT_SEVERITY' AND code = 'CRITICAL';
UPDATE cfg_general_categories SET name = 'New Alert', description = 'Newly triggered alert awaiting acknowledgment' WHERE category_type = 'ALERT_STATUS' AND code = 'NEW';
UPDATE cfg_general_categories SET name = 'Acknowledged', description = 'Operations engineer assigned and reviewing issue' WHERE category_type = 'ALERT_STATUS' AND code = 'ACKNOWLEDGED';
UPDATE cfg_general_categories SET name = 'Resolved', description = 'Underlying incident resolved and verified normal' WHERE category_type = 'ALERT_STATUS' AND code = 'RESOLVED';
UPDATE cfg_general_categories SET name = 'Dismissed', description = 'False positive or expected maintenance alert' WHERE category_type = 'ALERT_STATUS' AND code = 'DISMISSED';
UPDATE cfg_general_categories SET name = 'Active', description = 'Account in good standing with full authorized access' WHERE category_type = 'SYSTEM_USER_STATUS' AND code = 'ACTIVE';
UPDATE cfg_general_categories SET name = 'Locked', description = 'Account locked due to failed login attempts or security rule' WHERE category_type = 'SYSTEM_USER_STATUS' AND code = 'LOCKED';
UPDATE cfg_general_categories SET name = 'Inactive', description = 'Account disabled by administrator' WHERE category_type = 'SYSTEM_USER_STATUS' AND code = 'INACTIVE';
UPDATE cfg_general_categories SET name = 'RESTful API', description = 'Standard HTTP JSON API communication' WHERE category_type = 'INTEGRATION_TYPE' AND code = 'REST_API';
UPDATE cfg_general_categories SET name = 'Event Webhook', description = 'Asynchronous event push notification to partner URL' WHERE category_type = 'INTEGRATION_TYPE' AND code = 'WEBHOOK';
UPDATE cfg_general_categories SET name = 'Secure FTP (SFTP)', description = 'Secure batch file transfer for daily reconciliations' WHERE category_type = 'INTEGRATION_TYPE' AND code = 'SFTP';
UPDATE cfg_general_categories SET name = 'gRPC High Performance', description = 'High-speed binary RPC protocol for internal microservices' WHERE category_type = 'INTEGRATION_TYPE' AND code = 'GRPC';
UPDATE cfg_general_categories SET name = 'Message Bus (Kafka/Redis)', description = 'Distributed pub/sub event streaming' WHERE category_type = 'INTEGRATION_TYPE' AND code = 'MESSAGE_BUS';
UPDATE cfg_general_categories SET name = 'Text String', description = 'Alphanumeric character string' WHERE category_type = 'VALUE_TYPE' AND code = 'STRING';
UPDATE cfg_general_categories SET name = 'Integer Number', description = 'Whole integer numeric value' WHERE category_type = 'VALUE_TYPE' AND code = 'INTEGER';
UPDATE cfg_general_categories SET name = 'Decimal Number', description = 'Floating-point monetary or percentage value' WHERE category_type = 'VALUE_TYPE' AND code = 'DECIMAL';
UPDATE cfg_general_categories SET name = 'Boolean Flag', description = 'True/False binary switch' WHERE category_type = 'VALUE_TYPE' AND code = 'BOOLEAN';
UPDATE cfg_general_categories SET name = 'JSON Object', description = 'Structured JSON configuration payload' WHERE category_type = 'VALUE_TYPE' AND code = 'JSON';
UPDATE cfg_general_categories SET name = 'New Customer', description = 'Members registered or verified within the last 30 days' WHERE category_type = 'CUSTOMER_SEGMENT_TYPE' AND code = 'NEW_CUSTOMER';
UPDATE cfg_general_categories SET name = 'Low Activity', description = 'Members with 1-2 transactions in the past month' WHERE category_type = 'CUSTOMER_SEGMENT_TYPE' AND code = 'LOW_ACTIVITY';
UPDATE cfg_general_categories SET name = 'High-Value VIP', description = 'Platinum and Diamond tier members with high spend' WHERE category_type = 'CUSTOMER_SEGMENT_TYPE' AND code = 'HIGH_VALUE';
UPDATE cfg_general_categories SET name = 'Single Service', description = 'Members utilizing only one utility or telecom feature' WHERE category_type = 'CUSTOMER_SEGMENT_TYPE' AND code = 'SINGLE_SERVICE';
UPDATE cfg_general_categories SET name = 'At-Risk Churn', description = 'Inactive members with no purchases in over 45 days' WHERE category_type = 'CUSTOMER_SEGMENT_TYPE' AND code = 'WIN_BACK';
UPDATE cfg_general_categories SET name = 'Retail Shopper', description = 'Members who regularly shop at merchant partner POS' WHERE category_type = 'CUSTOMER_SEGMENT_TYPE' AND code = 'PARTNER_SHOPPER';
UPDATE cfg_general_categories SET name = 'Standard Member', description = 'General baseline membership base' WHERE category_type = 'CUSTOMER_SEGMENT_TYPE' AND code = 'GENERAL';
UPDATE cfg_general_categories SET name = 'Points Expiry Nudge', description = 'Alert sent 14/7/3 days before FIFO points expire' WHERE category_type = 'REMINDER_TRIGGER_TYPE' AND code = 'POINTS_EXPIRING';
UPDATE cfg_general_categories SET name = 'Tier Upgrade Near', description = 'Alert sent when member reaches 80% of tier goal' WHERE category_type = 'REMINDER_TRIGGER_TYPE' AND code = 'TIER_UPGRADE_NUDGE';
UPDATE cfg_general_categories SET name = 'Voucher Expiry Nudge', description = 'Alert sent when claimed voucher is near expiration' WHERE category_type = 'REMINDER_TRIGGER_TYPE' AND code = 'VOUCHER_EXPIRING';
UPDATE cfg_general_categories SET name = 'Win-Back Reminder', description = 'Contextual incentive sent to re-engage inactive users' WHERE category_type = 'REMINDER_TRIGGER_TYPE' AND code = 'INACTIVE_REMINDER';
UPDATE cfg_general_categories SET name = 'Post-Purchase Reward', description = 'Gamified reward prompt immediately following purchase' WHERE category_type = 'REMINDER_TRIGGER_TYPE' AND code = 'POST_PURCHASE';
UPDATE cfg_general_categories SET name = 'Super Agent / Master Distributor', description = 'Oversees regional agent network and KPI targets' WHERE category_type = 'AGENT_ROLE_TYPE' AND code = 'SUPER_AGENT';
UPDATE cfg_general_categories SET name = 'Retail Agent / Merchant Branch', description = 'Direct customer servicing, cash-in/out and point issuing' WHERE category_type = 'AGENT_ROLE_TYPE' AND code = 'AGENT';
UPDATE cfg_general_categories SET name = 'Sub-Agent / Point of Sale', description = 'Subordinated transaction point or kiosk' WHERE category_type = 'AGENT_ROLE_TYPE' AND code = 'SUB_AGENT';

-- -------------------------------------------------------------------------------------
-- 8. LOYALTY PARTNERS, BRANCHES, PRODUCT GROUPS & CATALOG
-- -------------------------------------------------------------------------------------
UPDATE loyalty_partners SET partner_name = 'Delimart Supermarket Chain' WHERE partner_code = 'DELIMART';
UPDATE loyalty_partners SET partner_name = 'Natcom Telecommunications Corporation' WHERE partner_code = 'NATCOM';
UPDATE loyalty_partners SET partner_name = 'Ringme OTT SuperApp & Entertainment' WHERE partner_code = 'RINGME';
UPDATE loyalty_partners SET partner_name = 'Natcash Mobile E-Wallet (Transfer & Payments)' WHERE partner_code = 'NATCASH_WALLET';
UPDATE loyalty_partners SET partner_name = 'Natcom Telecom (Topup & 4G/5G Data)' WHERE partner_code = 'NATCOM_TELCO';
UPDATE loyalty_partners SET partner_name = 'EDH Electricity of Haiti (Utility Bill Pay)' WHERE partner_code = 'EDH_POWER';
UPDATE loyalty_partners SET partner_name = 'Delimart Convenience Supermarkets' WHERE partner_code = 'DELIMART_RETAIL';
UPDATE loyalty_partners SET partner_name = 'Fahasa National Bookstore & Stationery' WHERE partner_code = 'FAHASA_BOOKSTORE';
UPDATE loyalty_partners SET partner_name = 'Highlands Coffee Franchise Chain' WHERE partner_code = 'HIGHLANDS_COFFEE';
UPDATE loyalty_partners SET partner_name = 'CGV Cinemas & Entertainment' WHERE partner_code = 'CGV_CINEMAS';

UPDATE partner_branches SET branch_name = 'Delimart Delmas 33 Supermarket' WHERE branch_code = 'DELI_BR_DELMAS';
UPDATE partner_branches SET branch_name = 'Delimart Pétion-Ville Flagship' WHERE branch_code = 'DELI_BR_PETIONVILLE';
UPDATE partner_branches SET branch_name = 'Delimart Tabarre Superstore' WHERE branch_code = 'DELI_BR_TABARRE';
UPDATE partner_branches SET branch_name = 'Delimart Carrefour Express' WHERE branch_code = 'DELI_BR_CARREFOUR';
UPDATE partner_branches SET branch_name = 'Delimart Cap-Haïtien Plaza' WHERE branch_code = 'DELI_BR_CAPHAITIEN';
UPDATE partner_branches SET branch_name = 'Natcash Hub Delmas 32' WHERE branch_code = 'NC_PP_DELMAS32';
UPDATE partner_branches SET branch_name = 'Natcash Point Pétion-Ville' WHERE branch_code = 'NC_PP_PETIONVILLE';
UPDATE partner_branches SET branch_name = 'Natcash Center Cap-Haïtien' WHERE branch_code = 'NC_PP_CAPHAITIEN';
UPDATE partner_branches SET branch_name = 'Natcash Branch Gonaïves' WHERE branch_code = 'NC_PP_GONAIVES';

UPDATE partner_product_groups SET group_name = 'Fresh Produce & Daily Essentials', description = '2% earn rate and max 50% point redemption at checkout' WHERE group_code = 'GROCERY_FRESH';
UPDATE partner_product_groups SET group_name = 'Data Packages & Mobile Topup', description = '3% earn rate and max 70% point redemption via e-wallet' WHERE group_code = 'TELECOM_DATA';
UPDATE partner_product_groups SET group_name = 'F&B Dining & Beverages', description = '2.5% earn rate and max 40% point redemption at counter' WHERE group_code = 'FNB_BEVERAGE';
UPDATE partner_product_groups SET group_name = 'Cinema & Event Tickets', description = '1.5% earn rate and max 50% point redemption' WHERE group_code = 'ENTERTAINMENT_TICKET';
UPDATE partner_product_groups SET group_name = 'Imported Beverages & Snacks', description = 'Imported juices, coffee and premium confectionery' WHERE group_code = 'BEVERAGES_SNACKS';
UPDATE partner_product_groups SET group_name = 'Organic Vegetables & Local Farm', description = 'Certified clean and organic agricultural produce' WHERE group_code = 'ORGANIC_PRODUCE';
UPDATE partner_product_groups SET group_name = 'Dairy & Fresh Baked Goods', description = 'Pasteurized fresh milk, butter, cheese and daily baked bread' WHERE group_code = 'DAIRY_BAKERY';
UPDATE partner_product_groups SET group_name = 'Home Essentials & Personal Care', description = 'Detergents, personal hygiene and home care supplies' WHERE group_code = 'HOUSEHOLD_CARE';

UPDATE partner_products SET product_name = 'Artibonite Fragrant Rice 5Kg' WHERE sku_code = 'SKU_RICE_5KG';
UPDATE partner_products SET product_name = 'Delimart Fresh Whole Milk 1L' WHERE sku_code = 'SKU_MILK_1L';
UPDATE partner_products SET product_name = 'Haitian Blue Organic Roasted Coffee 250g' WHERE sku_code = 'SKU_COFFEE_250G';
UPDATE partner_products SET product_name = 'Delimart Sliced Sandwich Bread 500g' WHERE sku_code = 'SKU_BREAD_500G';
UPDATE partner_products SET product_name = 'French Butter Cookies 300g' WHERE sku_code = 'SKU_COOKIES_300G';
UPDATE partner_products SET product_name = 'Fresh Farm Eggs (Tray of 12)' WHERE sku_code = 'SKU_EGGS_TRAY12';
UPDATE partner_products SET product_name = 'Extra Virgin Olive Oil 750ml' WHERE sku_code = 'SKU_OLIVE_OIL_750ML';
UPDATE partner_products SET product_name = 'Natural Mineral Spring Water 1.5L' WHERE sku_code = 'SKU_WATER_15L';
UPDATE partner_products SET product_name = 'Caribbean Tropical Fruit Jam 350g' WHERE sku_code = 'SKU_JAM_350G';
UPDATE partner_products SET product_name = 'Natural Smoked Pork Sausage 500g' WHERE sku_code = 'SKU_SAUSAGE_500G';

UPDATE partner_staff_accounts SET full_name = 'Michel-Ange Jean (Delmas 33 Manager)' WHERE username = 'mgr_delmas_delimart';
UPDATE partner_staff_accounts SET full_name = 'Nadine Desir (Pétion-Ville Manager)' WHERE username = 'mgr_petion_delimart';
UPDATE partner_staff_accounts SET full_name = 'Jean-Pierre Paul (Tabarre Manager)' WHERE username = 'mgr_tabarre_delimart';
UPDATE partner_staff_accounts SET full_name = 'Partner Administrator ' || partner_id WHERE username LIKE 'owner_%';

UPDATE agent_loyalty_programs SET full_name = 'Jean-Claude Super Agent Ouest' WHERE agent_code = 'SA_PAP_001';
UPDATE agent_loyalty_programs SET full_name = 'Agent Delmas 33 - Jean Baptiste' WHERE agent_code = 'AG_DEL_001';
UPDATE agent_loyalty_programs SET full_name = 'Agent Pétion-Ville - Nadège Louis' WHERE agent_code = 'AG_DEL_002';
UPDATE agent_loyalty_programs SET full_name = 'Agent Cap-Haïtien - Fritzner Paul' WHERE agent_code = 'AG_CAP_001';

-- -------------------------------------------------------------------------------------
-- 9. LOYALTY TIERS
-- -------------------------------------------------------------------------------------
UPDATE loyalty_tiers SET name = 'Silver Tier', description = 'Starter tier upon account registration with standard benefits' WHERE code = 'SILVER';
UPDATE loyalty_tiers SET name = 'Gold Tier', description = 'Accumulate 1,000 points within a 12-month rolling period' WHERE code = 'GOLD';
UPDATE loyalty_tiers SET name = 'Platinum Tier', description = 'Accumulate 5,000 points with premium tier benefits and multipliers' WHERE code = 'PLATINUM';
UPDATE loyalty_tiers SET name = 'Diamond Tier', description = 'VIP tier with exclusive priority benefits, dedicated hotline and maximum multipliers' WHERE code = 'DIAMOND';

-- -------------------------------------------------------------------------------------
-- 10. REWARD VOUCHERS & COUPON VAULT
-- -------------------------------------------------------------------------------------
UPDATE loyalty_vouchers SET title = '50 HTG Off at Delimart Supermarket', description = 'Applicable across all Delimart nationwide branches for orders over 200 HTG.' WHERE voucher_code = 'DELIMART-50K-9X8Z';
UPDATE loyalty_vouchers SET title = '10% Off Natcom Airtime Topup', description = 'Applicable for mobile airtime topup and 4G Natcom data plans.' WHERE voucher_code = 'NATCOM-10PCT-7B2C';
UPDATE loyalty_vouchers SET title = '20 HTG Off Confectionery & Snacks', description = 'Applicable for food & beverage categories at Delimart branches.' WHERE voucher_code = 'DELIMART-20K-1A4F';
UPDATE loyalty_vouchers SET title = '1GB High-Speed 4G Data (24 Hours)', description = 'Applicable for all Natcom prepaid and postpaid mobile subscribers.' WHERE voucher_code = 'NC-DATA-1GB';
UPDATE loyalty_vouchers SET title = '100 HTG Cashback on Utility Bill Payment', description = 'Applicable for EDH electricity or DINEPA water bills over 500 HTG paid via Natcash.' WHERE voucher_code = 'NC-CASHBACK-100';
UPDATE loyalty_vouchers SET title = '10% Discount on Airtime Topup', description = 'Applicable for Natcom topup from 100 HTG via Natcash Wallet app.' WHERE voucher_code = 'NC-AIRTIME-50';
UPDATE loyalty_vouchers SET title = '100 HTG Shopping Voucher at Delimart', description = 'Applicable for grocery shopping baskets from 500 HTG at Delimart.' WHERE voucher_code = 'CRM-DELI-100K';
UPDATE loyalty_vouchers SET title = '20% Off Books & School Supplies', description = 'Applicable for all orders at Fahasa bookstore nationwide.' WHERE voucher_code = 'CRM-FAHASA-20PCT';
UPDATE loyalty_vouchers SET title = 'Free Large Drink at Highlands Coffee', description = 'Redeem at any Highlands Coffee outlet with 80 reward points.' WHERE voucher_code = 'CRM-COFFEE-FREE';
UPDATE loyalty_vouchers SET title = '50 HTG Off Weekend 2D Movie Tickets', description = 'Applicable online or at CGV Cinemas ticket counters for weekend screenings.' WHERE voucher_code = 'CRM-CGV-2D';
UPDATE loyalty_vouchers SET title = '15% Off Weekend Shopping at Delimart', description = 'Valid for bills from 500 HTG, max 150 HTG across 5 Delimart stores.' WHERE voucher_code = 'DELIMART-15PCT-WKND';
UPDATE loyalty_vouchers SET title = 'Free Delimart Delivery (35 HTG)', description = 'Direct 35 HTG delivery discount within Port-au-Prince metropolitan area.' WHERE voucher_code = 'DELIMART-FREESHIP-35';

-- -------------------------------------------------------------------------------------
-- 11. GAMEHUB, MINIGAMES, LUCKY WHEELS & PRIZES
-- -------------------------------------------------------------------------------------
UPDATE loyalty_games SET game_name = 'Daily Brand Trivia Challenge', description = 'Answer 5 multiple-choice questions to win bonus points!', rules_text = 'Each correct answer earns bonus points. Max 1 free play per day.' WHERE game_code = 'QUIZ_MASTER';
UPDATE loyalty_games SET game_name = 'Delimart Harvest Farm', description = 'Plant, water and harvest crops daily to earn loyalty coins!', rules_text = 'Daily check-in gives water drops to harvest crops and convert to coins.' WHERE game_code = 'FARM_DELI';
UPDATE loyalty_games SET game_name = 'Alliance Voucher Vault', description = 'Redeem points for high-value partner discount vouchers.', rules_text = 'Select voucher and confirm points deduction.' WHERE game_code = 'VOUCHER_STORE';
UPDATE loyalty_games SET game_name = 'Natcom Topup Champion Challenge', description = 'Top up mobile credit regularly to climb leaderboard and win prizes.', rules_text = 'Scores based on topup frequency and transaction amounts.' WHERE game_code = 'TOPUP_CHALLENGE';
UPDATE loyalty_games SET game_name = 'Lucky Scratch Card', description = 'Scratch 3 matching symbols to win instant rewards!', rules_text = 'Reveal 3 identical icons to claim reward points.' WHERE game_code = 'SCRATCH_CARD';
UPDATE loyalty_games SET game_name = 'Penalty Shootout Challenge', description = 'Score goals against the keeper to win loyalty points!', rules_text = 'Shoot past the goalkeeper across 5 rounds.' WHERE game_code = 'PENALTY_SHOOTOUT';
UPDATE loyalty_games SET game_name = 'Pirate Island Treasure Hunt', description = 'Explore island map chests to discover hidden rewards.', rules_text = 'Open chests with game keys to find bonus prizes.' WHERE game_code = 'TREASURE_HUNT';
UPDATE loyalty_games SET game_name = 'Crossword Vocabulary Quest', description = 'Solve daily word puzzles in French, Haitian Creole and English.', rules_text = 'Complete the crossword puzzle before timer runs out.' WHERE game_code = 'WORD_PUZZLE';
UPDATE loyalty_games SET game_name = 'Plinko Fortune Drop', description = 'Drop bouncy chips through pegs into high multiplier bins!', rules_text = 'Drop disc through pegs to hit reward multipliers.' WHERE game_code = 'PLINKO_DROP';
UPDATE loyalty_games SET game_name = 'Lucky Golden Egg Smash', description = 'Smash golden eggs to reveal surprise reward gifts!', rules_text = 'Crack golden eggs for instant coin prizes.' WHERE game_code = 'GOLDEN_EGG';
UPDATE loyalty_games SET game_name = 'Lucky Dice Roll', description = 'Roll lucky dice combinations to multiply your points!', rules_text = 'Roll pairs, straights, or triples to win big.' WHERE game_code = 'LUCKY_DICE';
UPDATE loyalty_games SET game_name = 'Smart Scholar Trivia Quiz', description = 'Test your general knowledge and win instant bonus points.', rules_text = 'Answer all questions accurately to get maximum points.' WHERE game_code = 'TRIVIA_QUIZ';
UPDATE loyalty_games SET game_name = 'Tangram Screw Puzzle', description = 'Unscrew bolts, drop colorful acrylic plates to complete cultural symbols and win bonus points!', rules_text = 'Remove screws in proper order to let acrylic boards drop.' WHERE game_code = 'SCREW_PUZZLE';

UPDATE loyalty_lucky_wheels SET wheel_name = 'Customer Appreciation Lucky Wheel' WHERE wheel_code = 'LUCKY_WHEEL';
UPDATE loyalty_lucky_wheels SET wheel_name = 'Natcash Customer Appreciation Wheel' WHERE wheel_code = 'LUCKY_WHEEL_NATCASH';
UPDATE loyalty_lucky_wheels SET wheel_name = 'Alliance Customer Lucky Wheel' WHERE wheel_code = 'LUCKY_WHEEL_CRM';

UPDATE loyalty_wheel_themes SET theme_name = 'Natcash Signature Orange Theme', description = 'Default brand theme with Natcash orange and blue accents' WHERE theme_code = 'THEME_NATCASH_DEFAULT';
UPDATE loyalty_wheel_themes SET theme_name = 'Kanaval Tropical Festival Theme', description = 'Vibrant carnival theme celebrating Haitian culture and Kanaval spirit' WHERE theme_code = 'THEME_KANAVAL_FESTIVAL';
UPDATE loyalty_wheel_themes SET theme_name = 'Neon Cyberpunk Futuristic Theme', description = 'Modern dark mode with glowing cyan and magenta neon accents' WHERE theme_code = 'THEME_NEON_CYBER';

UPDATE loyalty_game_prizes SET prize_name = '3 Gold Chests Mega Win' WHERE prize_code = 'SCRATCH_GOLD';
UPDATE loyalty_game_prizes SET prize_name = '3 Silver Coins Prosperity' WHERE prize_code = 'SCRATCH_SILVER';
UPDATE loyalty_game_prizes SET prize_name = '3 Bronze Stars' WHERE prize_code = 'SCRATCH_BRONZE';
UPDATE loyalty_game_prizes SET prize_name = 'Consolation Lucky Draw' WHERE prize_code = 'SCRATCH_CONSOLATION';
UPDATE loyalty_game_prizes SET prize_name = 'Hat-trick Golden Goal (5/5)' WHERE prize_code = 'PENALTY_HAT_TRICK';
UPDATE loyalty_game_prizes SET prize_name = 'Sharp Striker Double (4/5)' WHERE prize_code = 'PENALTY_BRACE';
UPDATE loyalty_game_prizes SET prize_name = 'Honorary Penalty (3/5)' WHERE prize_code = 'PENALTY_SINGLE';
UPDATE loyalty_game_prizes SET prize_name = 'Cursed Pirate Diamond Chest' WHERE prize_code = 'TREASURE_DIAMOND';
UPDATE loyalty_game_prizes SET prize_name = 'Golden Galleon Chest' WHERE prize_code = 'TREASURE_GOLD';
UPDATE loyalty_game_prizes SET prize_name = 'Silver Doubloon Cache' WHERE prize_code = 'TREASURE_SILVER';
UPDATE loyalty_game_prizes SET prize_name = 'Linguistic Master (100% Score)' WHERE prize_code = 'WORD_MASTER';
UPDATE loyalty_game_prizes SET prize_name = 'Literary Scholar (80% Score)' WHERE prize_code = 'WORD_SCHOLAR';
UPDATE loyalty_game_prizes SET prize_name = 'Aspiring Word Apprentice' WHERE prize_code = 'WORD_APPRENTICE';
UPDATE loyalty_game_prizes SET prize_name = 'Plinko Jackpot Bin x10' WHERE prize_code = 'PLINKO_JACKPOT';
UPDATE loyalty_game_prizes SET prize_name = 'Outer Boundary Bin x5' WHERE prize_code = 'PLINKO_BIN_1';
UPDATE loyalty_game_prizes SET prize_name = 'Inner High Bin x2' WHERE prize_code = 'PLINKO_BIN_2';
UPDATE loyalty_game_prizes SET prize_name = 'Center Standard Bin x1' WHERE prize_code = 'PLINKO_BIN_3';
UPDATE loyalty_game_prizes SET prize_name = 'Golden Egg Fortune Jackpot' WHERE prize_code = 'EGG_MEGA';
UPDATE loyalty_game_prizes SET prize_name = 'Blooming Gold Egg Surprise' WHERE prize_code = 'EGG_BLOOM';
UPDATE loyalty_game_prizes SET prize_name = 'Lucky Red Packet Envelope' WHERE prize_code = 'EGG_RED_PACKET';
UPDATE loyalty_game_prizes SET prize_name = 'Golden Chick Consolation' WHERE prize_code = 'EGG_CHICK';
UPDATE loyalty_game_prizes SET prize_name = 'Triple Match Dice Jackpot' WHERE prize_code = 'DICE_TRIPLE';
UPDATE loyalty_game_prizes SET prize_name = 'Lucky Straight Run' WHERE prize_code = 'DICE_STRAIGHT';
UPDATE loyalty_game_prizes SET prize_name = 'Fortune Pair Dice' WHERE prize_code = 'DICE_PAIR';
UPDATE loyalty_game_prizes SET prize_name = 'Dice Sum Pips (x5)' WHERE prize_code = 'DICE_SUM';
UPDATE loyalty_game_prizes SET prize_name = 'Trivia Grand Champion (5/5)' WHERE prize_code = 'QUIZ_PERFECT';
UPDATE loyalty_game_prizes SET prize_name = 'Sharp Wit Scholar (4/5)' WHERE prize_code = 'QUIZ_EXCELLENT';
UPDATE loyalty_game_prizes SET prize_name = 'Trivia Qualifier (3/5)' WHERE prize_code = 'QUIZ_GOOD';

UPDATE loyalty_wheel_prizes SET prize_name = '100 Reward Points' WHERE prize_name = '100 Điểm Thưởng';
UPDATE loyalty_wheel_prizes SET prize_name = '50 HTG Voucher' WHERE prize_name = 'Voucher 50 HTG';
UPDATE loyalty_wheel_prizes SET prize_name = 'Better Luck Next Time' WHERE prize_name = 'Chúc May Mắn';
UPDATE loyalty_wheel_prizes SET prize_name = '500 HTG Wallet Cash' WHERE prize_name = '500 HTG Tiền Mặt Ví';
UPDATE loyalty_wheel_prizes SET prize_name = '1GB 4G Data Natcom' WHERE prize_name = '1GB Data 4G Natcom';
UPDATE loyalty_wheel_prizes SET prize_name = 'Better Luck Next Time' WHERE prize_name = 'Chúc May Mắn Lần Sau';
UPDATE loyalty_wheel_prizes SET prize_name = '100 HTG Delimart Voucher' WHERE prize_name = 'Voucher 100 HTG Delimart';
UPDATE loyalty_wheel_prizes SET prize_name = 'CGV 2D Movie Ticket' WHERE prize_name = 'Vé Xem Phim CGV 2D';
UPDATE loyalty_wheel_prizes SET prize_name = '20 Encouragement Points' WHERE prize_name = '20 Điểm Khuyến Khích';

UPDATE loyalty_game_hub_config SET welcome_banner_text = 'Play daily minigames and win exciting rewards from Natcash!' WHERE tenant_id = 'TENANT_NATCASH';
UPDATE loyalty_game_hub_config SET welcome_banner_text = 'Earn bonus reward points across the Micro-CRM Alliance ecosystem!' WHERE tenant_id = 'TENANT_MICRO_CRM';
UPDATE loyalty_game_hub_config SET welcome_banner_text = 'Play games to win shopping vouchers and rewards at Delimart Supermarkets!' WHERE tenant_id = 'TENANT_DELIMART';

-- -------------------------------------------------------------------------------------
-- 12. CAMPAIGNS, MILESTONES & RULE CONDITIONS
-- -------------------------------------------------------------------------------------
UPDATE loyalty_campaign_milestones SET campaign_name = 'Golden Shopping Week' WHERE campaign_code = 'GOLDEN_WEEK';
UPDATE loyalty_campaign_milestones SET campaign_name = 'Natcash Digital Transaction Quest' WHERE campaign_code = 'NATCASH_MISSION_2026';
UPDATE loyalty_campaign_milestones SET campaign_name = 'Retail Alliance Shopping Festival' WHERE campaign_code = 'RETAIL_FEST_2026';
UPDATE loyalty_campaign_milestones SET campaign_name = 'Delimart Harvest Quest' WHERE campaign_code = 'CAMP_DELI_HARVEST';

UPDATE campaign_rule_conditions SET rule_name = 'First Natcash QR Payment Bonus' WHERE rule_code = 'RULE_FIRST_QR_PAY';
UPDATE campaign_rule_conditions SET rule_name = 'Natcom 3-Week Topup Streak' WHERE rule_code = 'RULE_WEEKLY_TOPUP_STREAK';
UPDATE campaign_rule_conditions SET rule_name = 'First EDH Electricity Bill Payment' WHERE rule_code = 'RULE_CROSS_SELL_EDH';
UPDATE campaign_rule_conditions SET rule_name = '2X Points on Fresh Produce Weekends' WHERE rule_code = 'RULE_DELI_WEEKEND_X2';
UPDATE campaign_rule_conditions SET rule_name = 'First-Time QR Burn Bonus at Delimart' WHERE rule_code = 'RULE_DELI_FIRST_QR_POS';

UPDATE loyalty_monthly_budgets SET budget_name = 'Natcash Loyalty Budget November 2026' WHERE budget_name = 'Ngân sách Loyalty Natcash Tháng 11/2026';
UPDATE loyalty_monthly_budgets SET budget_name = 'Alliance Partner Co-Funding Budget 11/2026' WHERE budget_name = 'Quỹ Đồng Tài Trợ Đối Tác Liên Minh 11/2026';
UPDATE loyalty_monthly_budgets SET budget_name = 'GameHub & Learning Rewards Budget 11/2026' WHERE budget_name = 'Ngân sách Trả Thưởng GameHub & Learning 11/2026';
UPDATE loyalty_monthly_budgets SET budget_name = 'Delimart Loyalty Budget 11/2026' WHERE budget_name = 'Ngân sách Loyalty Delimart 11/2026';
UPDATE loyalty_monthly_budgets SET budget_name = 'Natcash x Delimart Co-Funding Budget Nov 2026' WHERE budget_name = 'Ngân sách Đồng tài trợ Natcash x Delimart T11/2026';
UPDATE loyalty_monthly_budgets SET budget_name = 'Delimart Self-Funded VIP Loyalty Budget Nov 2026' WHERE budget_name = 'Ngân sách Tự chi Delimart VIP Loyalty T11/2026';

-- -------------------------------------------------------------------------------------
-- 13. CUSTOMER SEGMENTS & REMINDER SCENARIOS
-- -------------------------------------------------------------------------------------
UPDATE customer_segments SET segment_name = 'New Customers (0-30 Days)', description = 'Members verified via eKYC within the last 30 days' WHERE segment_code = 'NEW_CUSTOMER';
UPDATE customer_segments SET segment_name = 'Low Activity Customers', description = 'Members with 1-2 transactions in the past month' WHERE segment_code = 'LOW_ACTIVITY';
UPDATE customer_segments SET segment_name = 'High-Value VIP Members', description = 'Platinum and Diamond tier members with 5,000+ points or spend > 5,000 HTG/month' WHERE segment_code = 'HIGH_VALUE';
UPDATE customer_segments SET segment_name = 'Single-Service Customers', description = 'Members using only 1 service category (e.g. mobile topup only)' WHERE segment_code = 'SINGLE_SERVICE';
UPDATE customer_segments SET segment_name = 'At-Risk Churn Customers', description = 'Inactive members with no purchase transactions in the last 45 days' WHERE segment_code = 'WIN_BACK';
UPDATE customer_segments SET segment_name = 'Alliance Retail Shoppers', description = 'Members who regularly shop and earn/burn points at merchant partner POS' WHERE segment_code = 'PARTNER_SHOPPER';
UPDATE customer_segments SET segment_name = 'Standard Members', description = 'Standard active loyalty members in the ecosystem' WHERE segment_code = 'GENERAL';

UPDATE reminder_scenarios SET scenario_name = 'Tier Upgrade Alert (80%)', title_vi = 'You are almost at your next tier!', body_vi = 'Only 20% more points needed to unlock Natcash VIP benefits.' WHERE scenario_code = 'SCN_TIER_80_PCT';
UPDATE reminder_scenarios SET scenario_name = 'Re-engage Inactive Members', title_vi = 'A 50 HTG Voucher is waiting for you', body_vi = 'Come back and pay with Natcash Wallet to claim 50 HTG off your next order.' WHERE scenario_code = 'SCN_WINBACK_VOUCHER';
UPDATE reminder_scenarios SET scenario_name = 'Points Expiry Reminder at Delimart', title_vi = 'You have Delimart points expiring soon!', body_vi = 'Visit your nearest Delimart store to redeem voucher up to 50 HTG before points expire.' WHERE scenario_code = 'REM_DELI_EXPIRING_PTS';
UPDATE reminder_scenarios SET scenario_name = 'Delimart Voucher Ready at Counter', title_vi = 'Your Delimart voucher is ready at checkout', body_vi = 'Show your Reward Wallet QR code to Delimart cashier to apply discount on today bill.' WHERE scenario_code = 'REM_DELI_VOUCHER_READY';

-- -------------------------------------------------------------------------------------
-- 14. SUPPORT PLAYBOOKS & LEARNING MODULES
-- -------------------------------------------------------------------------------------
UPDATE support_playbooks SET title = 'Customer eKYC Verification & First Transaction Guide', steps_json = '[{"step":1,"title":"Inspect CIN/Passport ID","detail":"Capture clear front and back photos of original ID with no glare"},{"step":2,"title":"Biometric Liveness Check","detail":"Guide customer to follow on-screen face motion prompts"},{"step":3,"title":"First Topup & Pin Activation","detail":"Assist customer to complete first mobile topup to unlock bonus points"}]'::jsonb WHERE playbook_code = 'PB_EKYC_ASSIST';
UPDATE support_playbooks SET title = 'Troubleshooting Offline POS / Network Timeout at Counter', steps_json = '[{"step":1,"title":"Verify POS Connection","detail":"Check Wi-Fi and 4G status on counter POS terminal"},{"step":2,"title":"Scan Offline QR Voucher","detail":"Use offline dynamic QR fallback with signature verification"},{"step":3,"title":"Manual Settlement Claim","detail":"Record dispute reference if invoice is not synced within 15 minutes"}]'::jsonb WHERE playbook_code = 'PB_POS_OFFLINE';

UPDATE learning_courses SET title_vi = title_en, description_vi = description_en WHERE title_en IS NOT NULL;

-- -------------------------------------------------------------------------------------
-- 15. OPERATIONAL APPROVALS, DISPUTES, ALERTS & INBOX NOTIFICATIONS
-- -------------------------------------------------------------------------------------
UPDATE approval_requests SET 
    reason = CASE 
        WHEN reason LIKE '%Bồi hoàn 150 Natcash Coin%' THEN 'Reimbursement of 150 Natcash Coins for POS Delmas transaction timeout'
        WHEN reason LIKE '%Kích cầu tiêu dùng nông sản%' THEN 'Stimulate local agricultural consumption in Q4/2026'
        WHEN reason LIKE '%Tăng tỷ lệ giao dịch%' THEN 'Increase POS checkout volume Friday through Sunday'
        WHEN reason LIKE '%Giữ chân nhóm khách hàng VIP%' THEN 'Retain VIP members with shopping basket over 3,000 HTG'
        WHEN reason LIKE '%Chiến dịch kích cầu quy mô lớn%' THEN 'Large-scale promotion campaign across entire chain'
        ELSE reason
    END,
    comments = CASE
        WHEN comments LIKE '%Khách hàng bị treo%' THEN 'Customer POS transaction hung on POS-DELMAS-01 - manual adjustment required'
        WHEN comments LIKE '%Ngân sách đề xuất vượt trần%' THEN 'Proposed budget exceeds co-funding limit - capped at 150,000 HTG'
        ELSE comments
    END;

UPDATE loyalty_clearing_disputes SET 
    resolution_note = CASE 
        WHEN dispute_code = 'KN-DELI-001' THEN 'Reconcile 1,300 HTG discrepancy across 3 Delmas counter invoices on Oct 28 due to POS network timeout'
        WHEN dispute_code = 'KN-DELI-002' THEN 'Customer duplicate card swipe charge at Pétion-Ville branch - reversal confirmed'
        ELSE resolution_note
    END;

UPDATE user_inbox_messages SET 
    title = CASE 
        WHEN title LIKE '%Chào mừng bạn đến với Hạng Vàng%' THEN 'Welcome to Natcash Gold Tier'
        WHEN title LIKE '%Ưu đãi X2 điểm%' THEN '2X Bonus Points on Fresh Produce at Delimart'
        WHEN title LIKE '%Bạn đang có 2 phiếu giảm giá%' THEN 'You have 2 Delimart discount vouchers ready to use'
        ELSE title
    END,
    body = CASE
        WHEN body LIKE '%Bạn đang sở hữu 2.500 Natcash Coin%' THEN 'You have 2,500 Natcash Coins. Explore Money Smart courses to earn up to 100 more Coins!'
        WHEN body LIKE '%Mua sắm nhóm Nông sản Hữu cơ%' THEN 'Shop Organic Produce this weekend to receive double reward points and 2 Delimart Farm game turns.'
        WHEN body LIKE '%Xuất trình mã%' THEN 'Present code RED-DELI-POS-001 at checkout to apply 15% discount directly.'
        ELSE body
    END;

UPDATE partner_notifications SET 
    title = CASE 
        WHEN title LIKE '%Bảng kê đối soát kỳ 2026-11 đã sẵn sàng%' THEN 'Settlement statement for 2026-11 is ready for confirmation'
        WHEN title LIKE '%Kỳ đối soát tháng 11/2026%' THEN 'November 2026 settlement cycle (PAY-202611-69) awaiting confirmation'
        WHEN title LIKE '%Đề xuất PROP-DELI-2026-001%' THEN 'Proposal PROP-DELI-2026-001 has been approved'
        WHEN title LIKE '%Nhắc nhở xoay vòng khóa%' THEN 'Self-Checkout Kiosk Key Rotation Reminder'
        ELSE title
    END,
    message = CASE
        WHEN message LIKE '%đã được tổng hợp. Vui lòng xác nhận%' THEN 'Payment batch has been compiled. Please review and confirm within 3 business days.'
        WHEN message LIKE '%Bảng kê công nợ chu kỳ%' THEN 'Debt settlement statement for period 2026-11 ready. Please confirm before Nov 28.'
        WHEN message LIKE '%Chiến dịch Tuần lễ Tích điểm%' THEN 'Campaign 2X Points on Clean Produce has been co-funded and approved.'
        WHEN message LIKE '%Khóa pk_deli_ksk1%' THEN 'Key pk_deli_ksk1 is in grace period. Please rotate key before expiration.'
        ELSE message
    END;

UPDATE system_alerts SET 
    title = CASE 
        WHEN title LIKE '%Quỹ đồng tài trợ đối tác đã đạt 82%%' THEN 'Partner Co-Funding Fund has reached 82% of November 2026 limit'
        WHEN title LIKE '%Kỳ quyết toán PAY-202611-69%' THEN 'Delimart Settlement Period PAY-202611-69 awaiting confirmation'
        WHEN title LIKE '%Khiếu nại KN-DELI-001%' THEN 'Dispute KN-DELI-001 is currently open for review'
        ELSE title
    END,
    message = CASE
        WHEN message LIKE '%Ngân sách PARTNER_CO_FUND đã tiêu thụ%' THEN 'PARTNER_CO_FUND budget consumed 205,000 / 250,000 HTG (82%). Review extension plan.'
        WHEN message LIKE '%Kỳ quyết toán bù trừ%' THEN 'Multilateral clearing settlement period PAY-202611-69 compiled - awaiting partner signature.'
        WHEN message LIKE '%Khiếu nại chênh lệch 1.300 HTG%' THEN 'Discrepancy claim of 1,300 HTG on Oct 28 at Delmas 33 awaiting resolution.'
        ELSE message
    END;

UPDATE ai_campaign_suggestions SET 
    objective = CASE 
        WHEN objective LIKE '%Tăng tỷ lệ quay lại%' THEN 'Increase retention and re-purchase rate for Delimart fresh produce shoppers'
        ELSE objective
    END;

-- -------------------------------------------------------------------------------------
-- 16. DEMO MEMBER ACCOUNTS & POINT LEDGER DESCRIPTIONS
-- -------------------------------------------------------------------------------------
UPDATE loyalty_accounts SET full_name = 'John Doe (Platinum Member)' WHERE full_name LIKE '%Nguyễn Văn Khách Hàng%';
UPDATE loyalty_point_ledger SET 
    description = CASE 
        WHEN description LIKE '%Tích điểm hóa đơn%' THEN 'Points earned for Delimart POS invoice checkout'
        WHEN description LIKE '%Tích điểm mua sắm tại Siêu thị Delimart%' THEN 'Points earned for Delimart Supermarket purchase'
        WHEN description LIKE '%Tích điểm nạp tiền cước di động Natcom%' THEN 'Points earned for Natcom mobile airtime topup 500 HTG'
        WHEN description LIKE '%Tích điểm mua sách%' THEN 'Points earned for Fahasa books & stationery purchase'
        WHEN description LIKE '%Tích điểm cuối tuần%' THEN 'Bonus points for weekend fresh produce purchase'
        WHEN description LIKE '%Tích điểm đơn đầu%' THEN 'Welcome bonus points for first Delimart transaction'
        ELSE description
    END
WHERE description LIKE '%Tích điểm%';

