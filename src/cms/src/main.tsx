import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PrimeReactProvider } from 'primereact/api';

import './dev-only.scss';

import App from '@/app.tsx';
import { envVariables } from '@/constants';
import { AppPropsContext, UserProvider } from 'micro-sdk';
import { I18nextProvider } from 'react-i18next';

import i18next from './language';

// Global Stale Chunk Auto-Recovery after production deployments
window.addEventListener('vite:preloadError', (event) => {
  console.warn('[Vite Preload Error] Stale chunk detected after deployment, reloading...', event);
  window.location.reload();
});

window.addEventListener('error', (event) => {
  if (
    event.message &&
    (event.message.includes('Importing a module script failed') ||
      event.message.includes('Failed to fetch dynamically imported module') ||
      event.message.includes('error loading dynamically imported module'))
  ) {
    console.warn('[Module Script Error] Stale chunk detected, reloading page...');
    window.location.reload();
  }
});

let initialUserData: any = { accessToken: envVariables.ACCESS_TOKEN };
try {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    initialUserData = { ...initialUserData, ...JSON.parse(storedUser) };
  }
} catch (e) {
  console.warn('[main.tsx] Failed to parse stored user:', e);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PrimeReactProvider value={{ hideOverlaysOnDocumentScrolling: false, ripple: true }}>
      <I18nextProvider i18n={i18next}>
        <AppPropsContext.Provider value={{ theme: 'light', userData: initialUserData, basename: envVariables.CONTEXT_PATH || '/', }}>
          <UserProvider userData={initialUserData}>
            <App />
          </UserProvider>
        </AppPropsContext.Provider>
      </I18nextProvider>
    </PrimeReactProvider>
  </StrictMode>
);

