import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,                      // same as --host, keeps it working both ways
    watch: { usePolling: true },     // file watching through Docker's file sharing on Windows
    proxy: {
      '/api': {
        target: 'http://host.docker.internal:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})