import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  base: '/bubbleboxing/dist/',
  server: {
    host: true,
    port: 5173,
  },
  plugins: [react(), basicSsl()],
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
