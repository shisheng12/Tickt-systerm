import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/Tickt-systerm/', // GitHub Pages 路径（须与仓库名一致）
  build: {
    outDir: 'dist',
    sourcemap: false
  },
  server: {
    host: '127.0.0.1',
    port: 5173
  },
  preview: {
    host: '127.0.0.1',
    port: 5173
  }
})
