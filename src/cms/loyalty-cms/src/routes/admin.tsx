import MainLayout from '@/layouts/MainLayout';
import type { RouteObject } from 'react-router-dom';

import { paths } from '@/paths';

export const route: RouteObject = {
  path: '/',
  element: <MainLayout />,
  children: [
    {
      path: paths.userManagement,
      lazy: async () => {
        const { UserManagementPage } = await import('@/pages/admin/user-management');
        return { Component: UserManagementPage };
      },
    },
    {
      path: paths.roleManagement,
      lazy: async () => {
        const { RoleManagementPage } = await import('@/pages/admin/role-management');
        return { Component: RoleManagementPage };
      },
    },
    {
      path: paths.auditManagement,
      lazy: async () => {
        const AuditLogPage = (await import('@/pages/admin/audit-management')).default;
        return { Component: AuditLogPage };
      },
    },
    {
      path: paths.deadLetterManagement,
      lazy: async () => {
        const { DeadLetterPage } = await import('@/pages/deadletter/DeadLetterPage');
        return { Component: DeadLetterPage };
      },
    },
  ],
};
