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
    target: 'es2022',
    minify: 'esbuild',
    cssMinify: true,
    cssCodeSplit: true,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 1000,
    modulePreload: {
      polyfill: false,
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Core React ecosystem
            if (id.includes('react-dom') || id.includes('react-router-dom') || (id.includes('/react/') && !id.includes('react-'))) {
              return 'vendor-react-core';
            }
            // Animation Engine
            if (id.includes('motion')) {
              return 'vendor-motion';
            }
            // Data Query & Virtualization
            if (id.includes('@tanstack')) {
              return 'vendor-tanstack';
            }
            // Supabase Database & Auth
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            // Icon Library
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            // Radix & UI Utilities
            if (id.includes('@radix-ui') || id.includes('class-variance-authority') || id.includes('clsx') || id.includes('tailwind-merge') || id.includes('sonner')) {
              return 'vendor-ui-primitives';
            }
            // In-browser SQL & Arrow
            if (id.includes('@duckdb') || id.includes('apache-arrow')) {
              return 'vendor-duckdb';
            }
            // Heavy Excel / CSV Parsers
            if (id.includes('xlsx') || id.includes('papaparse') || id.includes('csv-parser')) {
              return 'vendor-sheets-parser';
            }
            // Client-side PDF / PPTX / ZIP Export engines
            if (id.includes('jspdf') || id.includes('pptxgenjs') || id.includes('jszip') || id.includes('html2canvas')) {
              return 'vendor-exports';
            }
            // Google GenAI SDK
            if (id.includes('@google/genai')) {
              return 'vendor-genai';
            }
            // Charts & Visualizations
            if (id.includes('recharts') || id.includes('d3')) {
              return 'vendor-charts';
            }
            // Markdown & Sanitization
            if (id.includes('react-markdown') || id.includes('dompurify')) {
              return 'vendor-markdown';
            }
          }
        },
      },
    },
  },
});

