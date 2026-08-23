import MainLayout from '@/layouts/MainLayout';
import type { RouteObject } from 'react-router-dom';
import { Navigate } from 'react-router-dom';

import { paths } from '@/paths';

export const route: RouteObject = {
  path: '/',
  element: <MainLayout />,
  children: [
    {
      index: true,
      element: <Navigate to={paths.dashboard} replace />,
    },
    {
      path: paths.dashboard,
      lazy: async () => {
        const { Dashboard } = await import('@/pages/dashboard/dashboard');
        return { Component: Dashboard };
      },
    },
    {
      path: paths.systemParameters,
      lazy: async () => {
        const { SystemParameters } = await import('@/pages/system-parameters/system-parameters');
        return { Component: SystemParameters };
      },
    },
    {
      path: paths.partners,
      lazy: async () => {
        const { Partners } = await import('@/pages/partners/partners');
        return { Component: Partners };
      },
    },
    {
      path: paths.customers,
      lazy: async () => {
        const { Customers } = await import('@/pages/customers/customers');
        return { Component: Customers };
      },
    },
    {
      path: paths.transactions,
      lazy: async () => {
        const { Transactions } = await import('@/pages/transactions/transactions');
        return { Component: Transactions };
      },
    },
  ],
};
