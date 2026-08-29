import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  server: {
    proxy: {
      '/api': {
<<<<<<< Updated upstream
        target: 'https://localhost:7080',
        changeOrigin: true,
        secure: false,
=======
        target: 'http://localhost:5080',
        changeOrigin: true,
>>>>>>> Stashed changes
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
})
