import MainLayout from '@/layouts/MainLayout';
import type { RouteObject } from 'react-router-dom';

import { paths } from '@/paths';

export const route: RouteObject = {
  path: '/',
  element: <MainLayout />,
  children: [
    {
      path: paths.changeProfile,
      lazy: async () => {
        const { Page } = await import('@/pages/profile/change-profile/change-profile');
        return { Component: Page };
      },
    },
    {
      path: paths.changePassword,
      lazy: async () => {
        const { Page } = await import('@/pages/profile/change-password/change-password');
        return { Component: Page };
      },
    },
  ],
};
