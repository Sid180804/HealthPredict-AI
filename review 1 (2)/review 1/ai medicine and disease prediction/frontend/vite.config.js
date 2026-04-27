import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    esbuildOptions: {
      drop: ['console', 'debugger'],
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React runtime — always cached
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Charts — only loaded on analytics pages
          'vendor-charts': ['recharts'],
          // i18n — loaded once at startup
          'vendor-i18n': ['i18next', 'react-i18next'],
          // Animation — loaded by heavy pages
          'vendor-motion': ['framer-motion'],
          // HTTP client
          'vendor-axios': ['axios'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },

  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
