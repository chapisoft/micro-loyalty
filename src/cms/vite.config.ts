import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    base: env.VITE_CONTEXT_PATH || '/',
    plugins: [react()],
    server: {
      port: 8990,
      host: '0.0.0.0',
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
