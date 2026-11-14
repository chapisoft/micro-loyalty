import React from 'react';
import ReactDOM from 'react-dom/client';

import '@/styles/index.scss';
import '@/language';
import { App } from '@/App';
import { loadExternalLocaleOverrides } from '@/language';
import { loadRuntimeConfig } from '@/service/config';

async function bootstrap() {
  await Promise.all([loadRuntimeConfig(), loadExternalLocaleOverrides()]);
  const rootEl = document.getElementById('root');
  if (rootEl) {
    ReactDOM.createRoot(rootEl).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  }
}

bootstrap();
