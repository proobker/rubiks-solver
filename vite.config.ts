import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

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
        theme_color: '#09090b',
        background_color: '#09090b',
        display: 'standalone',
        start_url: '/rubiks-solver/',
        scope: '/rubiks-solver/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,html,css,svg,png}'],
        navigateFallback: '/rubiks-solver/index.html',
        navigateFallbackDenylist: [/^\/rubiks-solver\/assets\/.*/],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ['cubing', 'cubing/scramble'],
  },
  base: '/rubiks-solver/',
  build: {
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
