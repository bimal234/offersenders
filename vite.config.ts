import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Simple, robust proxy configuration for local development
      '/sms-proxy': {
        target: 'https://smseveryone.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/sms-proxy/, ''),
        secure: false, 
        timeout: 20000, // 20s Timeout
        headers: {
          'Connection': 'keep-alive'
        }
      },
    },
  },
});
