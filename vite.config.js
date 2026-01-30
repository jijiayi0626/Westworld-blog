import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: '/', // 适配CF Pages根路径，避免路由404
  build: {
    outDir: 'dist', // CF默认识别输出目录
    assetsDir: 'assets',
    minify: 'terser', // 压缩代码，提升访问速度
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    }
  },
  server: {
    cors: true, // 解决本地开发服务器状态查询跨域
    port: 3000,
    open: true // 本地启动自动打开浏览器
  }
})
