import { defineConfig, loadEnv, type ProxyOptions } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const baseApiProxy = (target: string, bypassHtml = false): ProxyOptions => ({
  target,
  changeOrigin: true,
  secure: false, // chỉ áp dụng cho dev proxy (npm run dev), không vào bản build
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

export default defineConfig(({ mode }) => {
  // VITE_PROXY_TARGET: đặt (vd https://api.mid.io.vn) để đi qua gateway; trống thì dùng microservice cục bộ.
  const proxyTarget = (loadEnv(mode, process.cwd(), '').VITE_PROXY_TARGET || '').trim();
  const createApiProxy = (target: string, bypassHtml = false): ProxyOptions =>
    baseApiProxy(proxyTarget || target, bypassHtml);
  return {
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3001,
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
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('react-dom')) return 'vendor-react-dom';
          if (id.includes('react-router') || id.includes('@remix-run')) return 'vendor-router';
          if (id.includes('framer-motion')) return 'vendor-motion';
          if (id.includes('lucide-react')) return 'vendor-icons';
          if (id.includes('i18next')) return 'vendor-i18n';
          if (id.includes('axios')) return 'vendor-http';
          if (id.includes('/react/') || id.includes('scheduler')) return 'vendor-react';
          return 'vendor-misc';
        },
      },
    },
  },
  };
});
