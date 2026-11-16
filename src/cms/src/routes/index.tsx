import 'react-router';
import { LocalStorage } from 'micro-sdk';
import { Navigate, type RouteObject } from 'react-router-dom';

import { paths } from '@/paths';
import { Page as NotFoundPage } from '@/pages/not-found';
import MainLayout from '@/layouts/MainLayout';

import { route as auth } from './auth';

declare module 'react-router' {
  interface IndexRouteObject {
    name?: string;
  }
  interface NonIndexRouteObject {
    name?: string;
  }
}

export const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const token = LocalStorage.getToken();
  if (!token) {
    return <Navigate to={paths.login} replace />;
  }
  return children;
};

// Safe lazy loading wrapper to prevent stale chunk errors across deployments
const safeLazy = (factory: () => Promise<any>) => {
  return async () => {
    try {
      return await factory();
    } catch (error) {
      console.warn('[safeLazy] Dynamic import failed (stale chunk detected), reloading latest version...', error);
      window.location.reload();
      return new Promise(() => {}); // Wait for browser reload
    }
  };
};

const mainAppRoutes: RouteObject = {
  element: (
    <RequireAuth>
      <MainLayout />
    </RequireAuth>
  ),
  children: [
    {
      path: paths.home,
      element: <Navigate to={paths.dashboard} replace />,
    },
    {
      path: paths.dashboard,
      lazy: safeLazy(async () => {
        const { Dashboard } = await import('@/pages/dashboard/dashboard');
        return { Component: Dashboard };
      }),
    },
    {
      path: paths.customers,
      lazy: safeLazy(async () => {
        const { Customers } = await import('@/pages/customers/customers');
        return { Component: Customers };
      }),
    },
    {
      path: paths.partners,
      lazy: safeLazy(async () => {
        const { Partners } = await import('@/pages/partners/partners');
        return { Component: Partners };
      }),
    },
    {
      path: paths.transactions,
      lazy: safeLazy(async () => {
        const { Transactions } = await import('@/pages/transactions/transactions');
        return { Component: Transactions };
      }),
    },
    {
      path: paths.categoryManagement,
      lazy: safeLazy(async () => {
        const { GeneralCategoryManagementPage } = await import('@/pages/categories/GeneralCategoryManagementPage');
        return { Component: GeneralCategoryManagementPage };
      }),
    },
    {
      path: paths.systemParameters,
      lazy: safeLazy(async () => {
        const { SystemParameters } = await import('@/pages/system-parameters/system-parameters');
        return { Component: SystemParameters };
      }),
    },
    // Loyalty Core modules
    {
      path: paths.policyConfig,
      lazy: safeLazy(async () => {
        const { PolicyConfigurationPage } = await import('@/pages/policy/PolicyConfigurationPage');
        return { Component: PolicyConfigurationPage };
      }),
    },
    {
      path: paths.tierManagement,
      lazy: safeLazy(async () => {
        const { TierManagementPage } = await import('@/pages/tiers/TierManagementPage');
        return { Component: TierManagementPage };
      }),
    },
    {
      path: paths.campaignMilestones,
      lazy: safeLazy(async () => {
        const { CampaignMilestonesPage } = await import('@/pages/campaigns/CampaignMilestonesPage');
        return { Component: CampaignMilestonesPage };
      }),
    },
    {
      path: paths.voucherManagement,
      lazy: safeLazy(async () => {
        const { VoucherManagementPage } = await import('@/pages/vouchers/VoucherManagementPage');
        return { Component: VoucherManagementPage };
      }),
    },
    {
      path: paths.gameManagement,
      lazy: safeLazy(async () => {
        const { GameManagementPage } = await import('@/pages/games/GameManagementPage');
        return { Component: GameManagementPage };
      }),
    },
    {
      path: paths.gameHubConfig,
      lazy: safeLazy(async () => {
        const { GameHubConfigPage } = await import('@/pages/games/GameHubConfigPage');
        return { Component: GameHubConfigPage };
      }),
    },
    {
      path: paths.clearingSettlement,
      lazy: safeLazy(async () => {
        const { ClearingSettlementPage } = await import('@/pages/clearing/ClearingSettlementPage');
        return { Component: ClearingSettlementPage };
      }),
    },
    // Admin routes
    {
      path: paths.userManagement,
      lazy: safeLazy(async () => {
        const { UserManagementPage } = await import('@/pages/admin/user-management');
        return { Component: UserManagementPage };
      }),
    },
    {
      path: paths.roleManagement,
      lazy: safeLazy(async () => {
        const { RoleManagementPage } = await import('@/pages/admin/role-management');
        return { Component: RoleManagementPage };
      }),
    },
    {
      path: paths.auditManagement,
      lazy: safeLazy(async () => {
        const AuditLogPage = (await import('@/pages/admin/audit-management')).default;
        return { Component: AuditLogPage };
      }),
    },
    {
      path: paths.deadLetterManagement,
      lazy: safeLazy(async () => {
        const { DeadLetterPage } = await import('@/pages/deadletter/DeadLetterPage');
        return { Component: DeadLetterPage };
      }),
    },
    // CMS v2.1 New Admin & Engagement & Reports Routes
    {
      path: paths.approvalQueue,
      lazy: safeLazy(async () => {
        const { ApprovalQueuePage } = await import('@/pages/admin/ApprovalQueuePage');
        return { Component: ApprovalQueuePage };
      }),
    },
    {
      path: paths.natcashPaymentPoints,
      lazy: safeLazy(async () => {
        const { NatcashBranchesPaymentPointsPage } = await import('@/pages/partners/NatcashBranchesPaymentPointsPage');
        return { Component: NatcashBranchesPaymentPointsPage };
      }),
    },
    {
      path: paths.customerSegments,
      lazy: safeLazy(async () => {
        const { CustomerSegmentsPage } = await import('@/pages/engagement/CustomerSegmentsPage');
        return { Component: CustomerSegmentsPage };
      }),
    },
    {
      path: paths.reminderScenarios,
      lazy: safeLazy(async () => {
        const { ReminderScenariosPage } = await import('@/pages/engagement/ReminderScenariosPage');
        return { Component: ReminderScenariosPage };
      }),
    },
    {
      path: paths.budgetManagement,
      lazy: safeLazy(async () => {
        const { BudgetManagementPage } = await import('@/pages/reports/BudgetManagementPage');
        return { Component: BudgetManagementPage };
      }),
    },
    {
      path: paths.programEffectiveness,
      lazy: safeLazy(async () => {
        const { ProgramEffectivenessPage } = await import('@/pages/reports/ProgramEffectivenessPage');
        return { Component: ProgramEffectivenessPage };
      }),
    },
    {
      path: paths.alertCenter,
      lazy: safeLazy(async () => {
        const { AlertCenterPage } = await import('@/pages/reports/AlertCenterPage');
        return { Component: AlertCenterPage };
      }),
    },
    {
      path: paths.advancedReports,
      lazy: safeLazy(async () => {
        const { AdvancedReportsPage } = await import('@/pages/reports/AdvancedReportsPage');
        return { Component: AdvancedReportsPage };
      }),
    },
    {
      path: paths.learningQuizBank,
      lazy: safeLazy(async () => {
        const { LearningQuizBankPage } = await import('@/pages/games/LearningQuizBankPage');
        return { Component: LearningQuizBankPage };
      }),
    },
    {
      path: paths.gameStatistics,
      lazy: safeLazy(async () => {
        const { GameStatisticsPage } = await import('@/pages/games/GameStatisticsPage');
        return { Component: GameStatisticsPage };
      }),
    },
    {
      path: paths.agentLoyaltyManagement,
      lazy: safeLazy(async () => {
        const { AgentLoyaltyManagementPage } = await import('@/pages/agents/AgentLoyaltyManagementPage');
        return { Component: AgentLoyaltyManagementPage };
      }),
    },
    // Profile routes
    {
      path: paths.changeProfile,
      lazy: safeLazy(async () => {
        const { Page } = await import('@/pages/profile/change-profile/change-profile');
        return { Component: Page };
      }),
    },
    {
      path: paths.changePassword,
      lazy: safeLazy(async () => {
        const { Page } = await import('@/pages/profile/change-password/change-password');
        return { Component: Page };
      }),
    },
  ],
};

// eslint-disable-next-line react-refresh/only-export-components
export const routes: RouteObject[] = [
  mainAppRoutes,
  { path: '*', element: <NotFoundPage /> },
];

// eslint-disable-next-line react-refresh/only-export-components
export const noAuthRoutes: RouteObject[] = [
  auth,
  {
    path: 'login',
    element: <Navigate to={paths.login} replace />,
  },
  {
    path: 'signin',
    element: <Navigate to={paths.login} replace />,
  },
  {
    path: 'logout',
    element: <Navigate to={paths.login} replace />,
  },
];
