import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // 根路径部署
  build: {
    outDir: 'dist',
    sourcemap: false
  },
  server: {
    port: 5178,
    host: true
  },
  preview: {
    port: 5178,
    host: true
  }
})
