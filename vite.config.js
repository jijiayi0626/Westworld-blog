import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'terser'
  },
  server: { cors: true, port: 3000 },
  // 关键：修复crypto.getRandomValues报错
  define: {
    'global.crypto': require('crypto').webcrypto
  }
})
