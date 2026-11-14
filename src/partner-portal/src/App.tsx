import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PrimeReactProvider } from 'primereact/api';
import { RouterProvider } from 'react-router-dom';

import { router } from '@/routes';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <PrimeReactProvider>
        <RouterProvider router={router} />
      </PrimeReactProvider>
    </QueryClientProvider>
  );
};
