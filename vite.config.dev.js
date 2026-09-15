import { defineConfig } from 'vite'

export default defineConfig({
  base: '/video/video-dev/',
  build: {
    outDir: 'dist-dev',
    emptyOutDir: true,
    rollupOptions: {
      input: 'index.html'
    }
  }
})
