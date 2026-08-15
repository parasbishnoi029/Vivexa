import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    hmr: false,
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts') || id.includes('d3')) return 'vendor-charts';
            if (id.includes('framer-motion') || id.includes('motion')) return 'vendor-motion';
            if (id.includes('lucide-react')) return 'vendor-icons';
            if (id.includes('@radix-ui')) return 'vendor-radix';
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) return 'vendor-react';
            if (id.includes('@supabase')) return 'vendor-supabase';
            if (id.includes('jspdf')) return 'vendor-jspdf';
            if (id.includes('html2canvas')) return 'vendor-html2canvas';
            if (id.includes('@tanstack/react-query')) return 'vendor-query';
            if (id.includes('alasql')) return 'vendor-alasql';
            if (id.includes('pptxgenjs')) return 'vendor-pptxgenjs';
            if (id.includes('papaparse')) return 'vendor-papaparse';
            if (id.includes('jszip')) return 'vendor-jszip';
            if (id.includes('axios')) return 'vendor-axios';
            if (id.includes('lodash')) return 'vendor-lodash';
            return 'vendor-core';
          }
        },
      },
    },
  },
});
