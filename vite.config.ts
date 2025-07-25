import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // Bundle analyzer - only in build mode
    mode === 'build' && process.env.ANALYZE && visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
      // Performance headers
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
    },
    cors: {
      origin: process.env.VITE_ALLOWED_ORIGINS?.split(',') || [
        'http://localhost:3000',
        'http://localhost:5173',
        'https://localhost:3000',
        'https://localhost:5173',
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: process.env.NODE_ENV === 'development', // Source maps only in development
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production', // Remove console statements in production
        drop_debugger: true,
        pure_funcs: process.env.NODE_ENV === 'production' ? ['console.log', 'console.info', 'console.debug'] : [],
      },
      mangle: {
        safari10: true, // Fix Safari 10 issues
      },
    },
    rollupOptions: {
      output: {
        // Improved chunk splitting strategy
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            // React ecosystem
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            // Supabase
            if (id.includes('@supabase')) {
              return 'supabase-vendor';
            }
            // UI libraries
            if (id.includes('@radix-ui') || id.includes('lucide-react') || id.includes('class-variance-authority')) {
              return 'ui-vendor';
            }
            // Charts and visualization
            if (id.includes('recharts') || id.includes('@nivo') || id.includes('framer-motion')) {
              return 'charts-vendor';
            }
            // Forms and validation
            if (id.includes('react-hook-form') || id.includes('zod') || id.includes('@hookform')) {
              return 'forms-vendor';
            }
            // Query and state management
            if (id.includes('@tanstack') || id.includes('zustand')) {
              return 'state-vendor';
            }
            // Other vendor libraries
            return 'vendor';
          }
          
          // Feature-based chunks
          if (id.includes('src/modules/portfolio-tracker')) {
            return 'portfolio-tracker';
          }
          if (id.includes('src/modules/sip-swp')) {
            return 'sip-swp-calculator';
          }
          if (id.includes('src/modules/zakat')) {
            return 'zakat-calculator';
          }
          if (id.includes('src/modules/share-averaging')) {
            return 'share-averaging-calculator';
          }
          if (id.includes('src/pages/auth')) {
            return 'auth-pages';
          }
        },
        // Optimize chunk file names
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
          return `assets/[name]-[hash].js`;
        },
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 1000,
    // Enable asset inlining for small files
    assetsInlineLimit: 4096,
    // Optimize CSS
    cssCodeSplit: true,
    // Report compressed size
    reportCompressedSize: true,
    // Target modern browsers for better optimization
    target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],
    // Enable experimental features for better performance
    cssMinify: 'lightningcss',
    // Preload modules for better performance
    modulePreload: {
      polyfill: true,
    },
  },
  define: {
    // Remove development-only code in production
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      '@supabase/supabase-js',
      'zustand',
      'zod',
      'react-hook-form',
      '@hookform/resolvers/zod',
      'lucide-react',
      'recharts',
      'framer-motion',
    ],
    exclude: ['web-vitals'], // Exclude web-vitals from pre-bundling as it's loaded dynamically
  },
  // Enable esbuild for faster builds
  esbuild: {
    // Remove console statements in production
    drop: mode === 'production' ? ['console', 'debugger'] : [],
    // Enable tree shaking
    treeShaking: true,
  },
}))