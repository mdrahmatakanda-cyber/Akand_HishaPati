import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon/favicon.ico', 'icon/apple-touch-icon.png'],
      manifest: {
        name: 'Hishabpati ERP',
        short_name: 'Hishabpati',
        description: 'Smart Business Management',
        theme_color: '#0B5C47',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/icon/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/icon/maskable-icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/icon/maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
    
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // ৫ মেগাবাইট পর্যন্ত ক্যাশ করতে দেবে
      }
    })
  ],
})