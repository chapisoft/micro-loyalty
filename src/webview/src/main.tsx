import React from 'react';
import ReactDOM from 'react-dom/client';
import Root from './figma-ui/Root';
import { initI18n } from './language';
import './index.css';

void initI18n().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <Root />
    </React.StrictMode>,
  );
});
