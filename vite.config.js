import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'terser',
    // 关键：强制忽略二维码文件，彻底解决打包报错
    rollupOptions: {
      external: ['/blogs/qrcode.jpg'],
      onwarn: (warning, warn) => {
        if (warning.code === 'UNUSED_EXTERNAL_IMPORT') return
        warn(warning)
      }
    }
  },
  server: { cors: true, port: 3000 },
  define: { 'global.crypto': require('crypto').webcrypto }
})
