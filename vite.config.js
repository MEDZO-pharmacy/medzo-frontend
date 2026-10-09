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
          target: 'http://127.0.0.1:5080',
          changeOrigin: true,
        },
        '/catalogue-inventory-api': {
          target: env.VITE_CATALOGUE_INVENTORY_SERVICE_TARGET || 'http://127.0.0.1:5000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/catalogue-inventory-api/, ''),
        },
        '/purchasing-supplier-api': {
          target: env.VITE_PURCHASING_SUPPLIER_SERVICE_TARGET || 'http://127.0.0.1:5090',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/purchasing-supplier-api/, ''),
        },
        '/sales-api': {
          target: env.VITE_SALES_SERVICE_TARGET || 'http://localhost:5227',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/sales-api/, ''),
        },
      },
      '/sales-api': {
        target: 'http://localhost:5227',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/sales-api/, ''),
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setup.js',
    },
  }
})
