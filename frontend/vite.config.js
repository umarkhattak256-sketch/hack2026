import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { basename, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const configDir = dirname(fileURLToPath(import.meta.url))
const projectFolder = process.env.VITE_XAMPP_PROJECT || basename(resolve(configDir, '..'))
const backendUrl = `http://localhost/${encodeURIComponent(projectFolder)}/backend`

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  server: {
    allowedHosts: true,
    proxy: {
      '/api': {
        target: `${backendUrl}/api`,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/uploads': {
        target: `${backendUrl}/uploads`,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/uploads/, ''),
      },
    },
  }
})
