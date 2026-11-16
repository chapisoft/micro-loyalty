import React from 'react';
import ReactDOM from 'react-dom/client';
import Root from './figma-ui/Root';
import './language'; // Initialize i18n
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
