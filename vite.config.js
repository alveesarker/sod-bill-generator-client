import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In development, API calls to /api are proxied to the local server.
// In production, set VITE_API_BASE_URL to your deployed server URL.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
