import { defineConfig } from 'vite'

export default defineConfig({
  base: '/video/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: 'index.html'
    }
  }
})
