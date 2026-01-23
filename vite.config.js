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
  }
})
