import process from 'node:process'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [tailwindcss(), react()],
    server: {
      proxy: {
        '/api': {
          target: 'https://localhost:7080',
          changeOrigin: true,
          secure: false,
        },
        '/catalogue-inventory-api': {
          target: env.VITE_CATALOGUE_INVENTORY_SERVICE_TARGET || 'http://localhost:5000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/catalogue-inventory-api/, ''),
        },
        '/sales-api': {
          target: env.VITE_SALES_SERVICE_TARGET || 'http://localhost:5227',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/sales-api/, ''),
        },
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setup.js',
    },
  }
})
