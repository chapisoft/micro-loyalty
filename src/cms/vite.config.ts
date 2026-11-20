import path from 'node:path'
import { defineConfig, loadEnv, type ProxyOptions } from 'vite'
import react from '@vitejs/plugin-react-swc'

const baseApiProxy = (target: string, bypassHtml = false): ProxyOptions => ({
  target,
  changeOrigin: true,
  secure: false, // chỉ áp dụng cho dev proxy (npm run dev), không vào bản build
  rewrite: (reqPath) => reqPath.replace(/^\/loyalty-service/, ''),
  ...(bypassHtml
    ? {
        bypass(req) {
          if (req.method === 'GET' && req.headers.accept?.includes('text/html')) {
            return '/index.html'
          }
        },
      }
    : {}),
})

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // VITE_PROXY_TARGET: nếu khai báo (vd https://api.mid.io.vn) thì mọi API đi qua gateway đó;
  // để trống thì proxy về từng microservice chạy cục bộ (8081..8085).
  const proxyTarget = (env.VITE_PROXY_TARGET || '').trim()
  const createApiProxy = (target: string, bypassHtml = false): ProxyOptions =>
    baseApiProxy(proxyTarget || target, bypassHtml)

  return {
    base: env.VITE_CONTEXT_PATH || '/',
    plugins: [react()],
    server: {
      port: 8990,
      host: '0.0.0.0',
      proxy: {
        // 1. Game-Service (8083)
        '^/(loyalty-service/)?gamehub/v1(/|\\?|$)': createApiProxy('http://localhost:8083'),
        '^/(loyalty-service/)?loyalty/v1/luckydraw(/|\\?|$)': createApiProxy('http://localhost:8083'),
        '^/(loyalty-service/)?loyalty/v1/admin/learning(/|\\?|$)': createApiProxy('http://localhost:8083'),
        '^/(loyalty-service/)?loyalty/v1/admin/games(/|\\?|$)': createApiProxy('http://localhost:8083'),

        // 2. Partner-Service (8085)
        '^/(loyalty-service/)?loyalty/v1/admin/dead-letter(/|\\?|$)': createApiProxy('http://localhost:8085'),
        '^/(loyalty-service/)?loyalty/v1/partners/locations(/|\\?|$)': createApiProxy('http://localhost:8085'),
        '^/(loyalty-service/)?loyalty/v1/payment-points(/|\\?|$)': createApiProxy('http://localhost:8085'),
        '^/(loyalty-service/)?loyalty/v1/partner-portal(/|\\?|$)': createApiProxy('http://localhost:8085'),
        '^/(loyalty-service/)?loyalty/v1/partner(/|\\?|$)': createApiProxy('http://localhost:8085'),
        '^/(loyalty-service/)?loyalty/v1/clearinghouse(/|\\?|$)': createApiProxy('http://localhost:8085'),

        // 3. Campaign-Service (8084)
        '^/(loyalty-service/)?loyalty/v1/(segments|engagement|milestones|campaigns|referrals|budgets|ai-copilot|alerts|notification-preferences|inbox)(/|\\?|$)': createApiProxy('http://localhost:8084'),

        // 4. Customer-Service (8082)
        '^/(loyalty-service/)?loyalty/v1/(admin/agents|agents|earn|ledger|point-history|sso|ussd|wallet|vouchers|reward-wallet|devices|accounts|profile|tiers)(/|\\?|$)': createApiProxy('http://localhost:8082'),

        // 5. CMS-Service (8081)
        '^/(loyalty-service/)?(loyalty/v1|loyalty/auth|loyalty/users|auth|users|roles|policies|partners|system-parameters|api|v1|cms|actuator)(/|\\?|$)': createApiProxy('http://localhost:8081', true),
      },
    },
    resolve: {
      alias: [
        {
          find: /^~(.+)/,
          replacement: path.join(process.cwd(), 'node_modules/$1'),
        },
        {
          find: /^@\/(.+)/,
          replacement: path.join(process.cwd(), 'src/$1'),
        },
        {
          find: 'components/src',
          replacement: path.join(process.cwd(), 'libraries/components/src'),
        },
        {
          find: 'components',
          replacement: path.join(process.cwd(), 'libraries/components/src/index.ts'),
        },
        {
          find: 'micro-sdk',
          replacement: path.join(process.cwd(), 'libraries/micro-sdk/index.ts'),
        },
        {
          find: 'types',
          replacement: path.join(process.cwd(), 'libraries/types/index.ts'),
        },
        {
          find: 'utils',
          replacement: path.join(process.cwd(), 'libraries/micro-sdk/utils'),
        },
      ],
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
            if (id.includes('@tanstack/react-query')) return 'vendor-query';
            if (id.includes('primereact/datatable') || id.includes('primereact/column') || id.includes('primereact/paginator') || id.includes('primereact/dropdown') || id.includes('primereact/virtualscroller')) return 'vendor-prime-table';
            if (id.includes('primereact/calendar') || id.includes('primereact/editor') || id.includes('primereact/fileupload') || id.includes('primereact/colorpicker') || id.includes('primereact/multiselect')) return 'vendor-prime-widgets';
            if (id.includes('primereact')) return 'vendor-primereact';
            if (id.includes('xlsx')) return 'vendor-xlsx';
            if (id.includes('quill')) return 'vendor-quill';
            if (id.includes('jspdf') || id.includes('html2canvas')) return 'vendor-pdf';
            if (id.includes('jszip') || id.includes('html-docx')) return 'vendor-zip';
            if (id.includes('@codemirror') || id.includes('@uiw')) return 'vendor-codemirror';
            if (id.includes('hls.js')) return 'vendor-hls';
            if (id.includes('@dnd-kit')) return 'vendor-dnd';
            if (id.includes('react-syntax-highlighter') || id.includes('refractor') || id.includes('prismjs')) return 'vendor-syntax';
            if (id.includes('framer-motion')) return 'vendor-motion';
            if (id.includes('styled-components')) return 'vendor-styled';
            if (id.includes('lodash')) return 'vendor-lodash';
            if (id.includes('firebase')) return 'vendor-firebase';
            if (id.includes('echarts') || id.includes('chart.js') || id.includes('zrender')) return 'vendor-charts';
            if (id.includes('i18next')) return 'vendor-i18n';
            if (id.includes('axios') || id.includes('zod') || id.includes('dayjs')) return 'vendor-utils';
            if (id.includes('react-hook-form') || id.includes('@hookform')) return 'vendor-forms';
            if (id.includes('/react/') || id.includes('scheduler')) return 'vendor-react';
            return 'vendor-misc';
          },
        },
      },
    },
  }
})
