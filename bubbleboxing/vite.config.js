import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/bubbleboxing/dist/',
  server: {
    host: true, // expose on local network so phone can connect via IP
    port: 5173,
    https: false,
  },
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('firebase')) return 'firebase';
          if (id.includes('@mediapipe/tasks-vision')) return 'mediapipe';
          if (id.includes('@tensorflow')) return 'tensorflow';
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
