import { useMemo } from 'react';
import { LocalStorage, useAppProps } from 'micro-sdk';
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom';
import { createGlobalStyle } from 'styled-components';

import { Root } from './root';
import { noAuthRoutes, routes } from './routes';

const GlobalStyles = createGlobalStyle<{ $theme: string }>`
  :root {
    --item-background: ${({ $theme }) => ($theme === 'light' ? '#F4F7FA' : '#112C45')};
  }
`;

export default function App() {
  const { basename = '/', theme = 'light' } = useAppProps();
  const token = LocalStorage.getToken();

  const router = useMemo(
    () =>
      createBrowserRouter(
        [
          {
            path: '/',
            element: (
              <Root>
                <Outlet />
              </Root>
            ),
            children: [
              ...noAuthRoutes,
              ...routes,
            ],
          },
        ],
        {
          basename: basename,
        }
      ),
    [basename, token]
  );

  return (
    <>
      <GlobalStyles $theme={theme} />
      {router && <RouterProvider router={router} />}
    </>
  );
}
