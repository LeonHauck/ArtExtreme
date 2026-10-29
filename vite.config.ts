import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon-64x64.png', 'apple-touch-icon-180x180.png', 'brand/*', 'images/*'],
      manifest: {
        name: 'ArtExtreme Tattoo Studio',
        short_name: 'ArtExtreme',
        description: 'Agende sua tattoo e simule o orçamento no corpo 3D.',
        lang: 'pt-BR',
        theme_color: '#08070b',
        background_color: '#08070b',
        display: 'standalone',
        start_url: '/',
        // Atalhos ao segurar o ícone do app (Android)
        shortcuts: [
          { name: 'Agenda do artista', short_name: 'Agenda', url: '/admin', icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
          { name: 'Simular tattoo', short_name: 'Simular', url: '/orcamento', icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
        ],
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webp,woff,woff2}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        // Notificações de pedido novo (public/push-sw.js)
        importScripts: ['push-sw.js'],
      },
    }),
  ],
  build: {
    // O chunk do 3D (three.js) é grande, mas só carrega na página do simulador
    chunkSizeWarningLimit: 1100,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
