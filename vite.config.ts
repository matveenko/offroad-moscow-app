import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/offroad-moscow-app/',
  build: {
    chunkSizeWarningLimit: 1600, // Подняли лимит до 1.6мб, чтобы не ныл
  },
})