import AuthLayout from '@/layouts/AuthLayout';
import { Navigate, type RouteObject } from 'react-router-dom';

export const route: RouteObject = {
  path: 'auth',
  element: <AuthLayout />,
  children: [
    {
      path: '',
      element: <Navigate to="login" replace />,
    },
    {
      path: 'login',
      lazy: async () => {
        const { Page } = await import('@/pages/auth/login');
        return { Component: Page };
      },
    },
    {
      path: 'create-account',
      lazy: async () => {
        const { Page } = await import('@/pages/auth/create-account');
        return { Component: Page };
      },
    },
    {
      path: 'reset-password',
      lazy: async () => {
        const { Page } = await import('@/pages/auth/reset-password');
        return { Component: Page };
      },
    },
  ],
};
