import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5180,
    proxy: {
      '/api': 'http://localhost:8787'
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 4180
  }
});
