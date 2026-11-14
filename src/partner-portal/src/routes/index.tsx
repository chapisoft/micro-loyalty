import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import { MainLayout } from '@/layouts/MainLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { paths } from '@/paths';

const PartnerDashboardPage = lazy(() =>
  import('@/pages/PartnerDashboardPage').then((m) => ({ default: m.PartnerDashboardPage }))
);
const PartnerBranchesProductsPage = lazy(() =>
  import('@/pages/PartnerBranchesProductsPage').then((m) => ({ default: m.PartnerBranchesProductsPage }))
);
const PartnerPointsPolicyPage = lazy(() =>
  import('@/pages/PartnerPointsPolicyPage').then((m) => ({ default: m.PartnerPointsPolicyPage }))
);
const PartnerStaffAccountsPage = lazy(() =>
  import('@/pages/PartnerStaffAccountsPage').then((m) => ({ default: m.PartnerStaffAccountsPage }))
);
const PartnerProgramProposalPage = lazy(() =>
  import('@/pages/PartnerProgramProposalPage').then((m) => ({ default: m.PartnerProgramProposalPage }))
);
const PartnerVouchersPage = lazy(() =>
  import('@/pages/PartnerVouchersPage').then((m) => ({ default: m.PartnerVouchersPage }))
);
const PartnerTransactionsPage = lazy(() =>
  import('@/pages/PartnerTransactionsPage').then((m) => ({ default: m.PartnerTransactionsPage }))
);
const PartnerSettlementPage = lazy(() =>
  import('@/pages/PartnerSettlementPage').then((m) => ({ default: m.PartnerSettlementPage }))
);
const PartnerNotificationsPage = lazy(() =>
  import('@/pages/PartnerNotificationsPage').then((m) => ({ default: m.PartnerNotificationsPage }))
);
const PartnerWebhookApiKeyPage = lazy(() =>
  import('@/pages/PartnerWebhookApiKeyPage').then((m) => ({ default: m.PartnerWebhookApiKeyPage }))
);

function withLazyBoundary(element: React.ReactNode): React.ReactElement {
  return (
    <Suspense
      fallback={
        <div className="p-5 flex justify-content-center align-items-center">
          <i className="pi pi-spin pi-spinner text-2xl text-primary" />
        </div>
      }
    >
      {element}
    </Suspense>
  );
}

export const router = createBrowserRouter([
  {
    path: paths.login,
    element: <LoginPage />,
  },
  {
    path: paths.root,
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Navigate to={paths.dashboard} replace />,
      },
      {
        path: paths.dashboard,
        element: withLazyBoundary(<PartnerDashboardPage />),
      },
      {
        path: paths.branches,
        element: withLazyBoundary(<PartnerBranchesProductsPage />),
      },
      {
        path: paths.policy,
        element: withLazyBoundary(<PartnerPointsPolicyPage />),
      },
      {
        path: paths.staff,
        element: withLazyBoundary(<PartnerStaffAccountsPage />),
      },
      {
        path: paths.proposals,
        element: withLazyBoundary(<PartnerProgramProposalPage />),
      },
      {
        path: paths.vouchers,
        element: withLazyBoundary(<PartnerVouchersPage />),
      },
      {
        path: paths.transactions,
        element: withLazyBoundary(<PartnerTransactionsPage />),
      },
      {
        path: paths.settlement,
        element: withLazyBoundary(<PartnerSettlementPage />),
      },
      {
        path: paths.notifications,
        element: withLazyBoundary(<PartnerNotificationsPage />),
      },
      {
        path: paths.apiKeys,
        element: withLazyBoundary(<PartnerWebhookApiKeyPage />),
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to={paths.dashboard} replace />,
  },
]);
