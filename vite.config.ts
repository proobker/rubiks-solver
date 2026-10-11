import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vitest/config'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'
import pkg from './package.json' with { type: 'json' }

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Rubik\'s Cube Solver',
        short_name: 'Cube Solver',
        description: 'Interactive Rubik\'s cube with solver, learning stages, WCA scrambles and a solve timer.',
        theme_color: '#13111c',
        background_color: '#13111c',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,html,css,svg,png,woff2}'],
        // cubing.js code-splits every WCA event; only the 3x3 scramble path is ever loaded.
        globIgnores: [
          '**/puzzles-dynamic-{4x4x4,megaminx,side-events,unofficial}-*.js',
          '**/search-dynamic-{sgs-*,solve-4x4x4,solve-fto,solve-kilominx,solve-master_tetraminx}-*.js',
          '**/twips*.js',
        ],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/assets\/.*/],
      },
    }),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ['cubing', 'cubing/scramble'],
  },
  base: '/',
  test: {
    include: ['src/**/*.test.ts'],
  },
  build: {
    // three.js + drei is a single ~1.1 MB chunk by design; it is cached by the service worker.
    chunkSizeWarningLimit: 1200,
    rolldownOptions: {
      output: {
        manualChunks: (id: string) => {
          if (id.includes('three') || id.includes('@react-three') || id.includes('@react-spring/three')) {
            return 'three';
          }
        },
      } as never,
    },
  },
})
