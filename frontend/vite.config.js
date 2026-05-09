import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const apiUrl = process.env.VITE_API_URL || 'http://localhost/donortrace/backend/api'

export default defineConfig({
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(apiUrl),
  },

  plugins: [
    react(),
    tailwindcss(),
  ],

  server: {
    allowedHosts: true,
    proxy: {
      '/api': {
        target: apiUrl,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/uploads': {
        target: apiUrl.replace('/api', '') + '/uploads',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/uploads/, ''),
      },
    },
  }
})
