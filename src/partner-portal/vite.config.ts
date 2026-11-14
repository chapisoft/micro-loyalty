import { defineConfig, type ProxyOptions } from 'vite';
import react from '@vitejs/plugin-react-swc';

const createApiProxy = (target: string, bypassHtml = false): ProxyOptions => ({
  target,
  changeOrigin: true,
  rewrite: (reqPath) => reqPath.replace(/^\/loyalty-service/, ''),
  ...(bypassHtml
    ? {
        bypass(req) {
          if (req.method === 'GET' && req.headers.accept?.includes('text/html')) {
            return '/index.html';
          }
        },
      }
    : {}),
});

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: '@',
        replacement: new URL('./src', import.meta.url).pathname,
      },
    ],
  },
  server: {
    port: 8991,
    host: true,
    proxy: {
      '^/(loyalty-service/)?gamehub/v1(/|\\?|$)': createApiProxy('http://localhost:8083'),
      '^/(loyalty-service/)?loyalty/v1/luckydraw(/|\\?|$)': createApiProxy('http://localhost:8083'),
      '^/(loyalty-service/)?loyalty/v1/admin/learning(/|\\?|$)': createApiProxy('http://localhost:8083'),
      '^/(loyalty-service/)?loyalty/v1/admin/games(/|\\?|$)': createApiProxy('http://localhost:8083'),
      '^/(loyalty-service/)?loyalty/v1/admin/dead-letter(/|\\?|$)': createApiProxy('http://localhost:8085'),
      '^/(loyalty-service/)?loyalty/v1/partners/locations(/|\\?|$)': createApiProxy('http://localhost:8085'),
      '^/(loyalty-service/)?loyalty/v1/payment-points(/|\\?|$)': createApiProxy('http://localhost:8085'),
      '^/(loyalty-service/)?loyalty/v1/partner-portal(/|\\?|$)': createApiProxy('http://localhost:8085'),
      '^/(loyalty-service/)?loyalty/v1/partner(/|\\?|$)': createApiProxy('http://localhost:8085'),
      '^/(loyalty-service/)?loyalty/v1/clearinghouse(/|\\?|$)': createApiProxy('http://localhost:8085'),
      '^/(loyalty-service/)?loyalty/v1/(segments|engagement|milestones|campaigns|referrals|budgets|ai-copilot|alerts|notification-preferences|inbox)(/|\\?|$)': createApiProxy('http://localhost:8084'),
      '^/(loyalty-service/)?loyalty/v1/(admin/agents|agents|earn|ledger|point-history|sso|ussd|wallet|vouchers|reward-wallet|devices|accounts|profile|tiers)(/|\\?|$)': createApiProxy('http://localhost:8082'),
      '^/(loyalty-service/)?(loyalty/v1|loyalty/auth|loyalty/users|auth|users|roles|policies|partners|system-parameters|api|v1|cms|actuator)(/|\\?|$)': createApiProxy('http://localhost:8081', true),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('react-dom')) return 'vendor-react-dom';
          if (id.includes('react-router')) return 'vendor-router';
          if (id.includes('@tanstack/react-query') || id.includes('@tanstack/query-core')) return 'vendor-query';
          if (id.includes('react-hook-form')) return 'vendor-forms';
          if (id.includes('i18next') || id.includes('react-i18next')) return 'vendor-i18n';
          if (id.includes('axios')) return 'vendor-http';
          if (id.includes('xlsx')) return 'vendor-xlsx';
          if (id.includes('primereact/datatable')) return 'vendor-prime-datatable';
          if (id.includes('primereact/column') || id.includes('primereact/paginator')) return 'vendor-prime-column';
          if (
            id.includes('primereact/dropdown') ||
            id.includes('primereact/multiselect') ||
            id.includes('primereact/virtualscroller')
          ) {
            return 'vendor-prime-dropdown';
          }
          if (id.includes('primereact/calendar')) return 'vendor-prime-calendar';
          if (
            id.includes('primereact/dialog') ||
            id.includes('primereact/confirmdialog') ||
            id.includes('primereact/sidebar')
          ) {
            return 'vendor-prime-dialog';
          }
          if (
            id.includes('primereact/menubar') ||
            id.includes('primereact/menu') ||
            id.includes('primereact/toast') ||
            id.includes('primereact/tabview')
          ) {
            return 'vendor-prime-menu';
          }
          if (
            id.includes('primereact/inputtext') ||
            id.includes('primereact/inputnumber') ||
            id.includes('primereact/password') ||
            id.includes('primereact/inputtextarea') ||
            id.includes('primereact/checkbox') ||
            id.includes('primereact/button') ||
            id.includes('primereact/tag')
          ) {
            return 'vendor-prime-inputs';
          }
          if (id.includes('primereact')) return 'vendor-prime-core';
          if (id.includes('/react/') || id.includes('scheduler')) return 'vendor-react';
          return 'vendor-misc';
        },
      },
    },
  },
});
