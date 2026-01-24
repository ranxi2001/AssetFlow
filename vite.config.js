import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 1456,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:1457',
        changeOrigin: true
      }
    }
  },
  build: {
    // 生产构建优化
    target: 'es2015',
    minify: 'esbuild',
    // 代码分割：将大型依赖单独打包
    rollupOptions: {
      output: {
        manualChunks: {
          // Chart.js 单独打包（这是最大的依赖）
          'chart': ['chart.js', 'vue-chartjs'],
          // Vue 核心库
          'vue-vendor': ['vue'],
          // 其他工具库
          'utils': ['axios']
        }
      }
    },
    // chunk 大小警告阈值
    chunkSizeWarningLimit: 1000
  },
  // 启用源码映射（仅开发环境）
  sourcemap: false
})
