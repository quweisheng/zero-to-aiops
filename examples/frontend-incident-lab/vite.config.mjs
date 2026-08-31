import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import react from '@vitejs/plugin-react'

const proxy = { '/api': 'http://127.0.0.1:4188' }

export default defineConfig({
  plugins: [vue(), react()],
  server: { port: 4187, strictPort: true, proxy },
  preview: { port: 4189, strictPort: true, proxy },
  build: {
    rollupOptions: {
      input: {
        vanilla: fileURLToPath(new URL('./index.html', import.meta.url)),
        vue: fileURLToPath(new URL('./vue.html', import.meta.url)),
        react: fileURLToPath(new URL('./react.html', import.meta.url))
      }
    }
  },
  test: { include: ['test/**/*.test.ts'], environment: 'node' }
})
