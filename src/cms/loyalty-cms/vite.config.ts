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
    },
  }
})
