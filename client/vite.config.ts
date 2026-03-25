import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      // Forward API calls to the backend so the OpenAI key stays server-side.
      '/api': 'http://localhost:8787',
    },
  },
});

