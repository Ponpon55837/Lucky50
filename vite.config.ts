import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // 移除 production 模式下的註解
          comments: false
        }
      }
    }),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.finmindtrade\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'finmind-api',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              }
            }
          }
        ]
      },
      manifest: {
        name: '農民曆智慧投資',
        short_name: 'Lucky50',
        description: '結合傳統農民曆智慧與現代金融科技的投資建議系統',
        theme_color: '#3B82F6',
        background_color: '#0f172a',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    target: 'es2015',
    outDir: 'dist',
    assetsDir: 'assets',
    // 啟用資源分割
    rollupOptions: {
      output: {
        manualChunks: {
          // 將 Vue 相關套件打包在一起
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          // Three.js 相關
          'three-vendor': ['three', '@tweenjs/tween.js'],
          // 圖表相關
          'chart-vendor': ['chart.js', 'vue-chartjs'],
          // 其他第三方套件
          'vendor': ['axios', 'chinese-s2t', 'lunar-javascript']
        },
        // 資源檔名優化
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    },
    // 啟用壓縮
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // 移除 console.log
        drop_debugger: true, // 移除 debugger
        pure_funcs: ['console.log', 'console.info'], // 移除指定函數
        passes: 3, // 增加壓縮次數
        unsafe_arrows: true, // 更激進的箭頭函數優化
        unsafe_methods: true, // 更激進的方法優化
      },
      mangle: {
        // 混淆變數名稱
        safari10: true,
        toplevel: true, // 混淆頂層作用域
      },
    },
    // 優化資源大小
    cssCodeSplit: true,
    sourcemap: false, // 生產環境關閉 sourcemap
    // 啟用 gzip
    reportCompressedSize: true,
    // chunk 大小警告閾值
    chunkSizeWarningLimit: 1000, // 降低警告閾值
    // 資源內聯閾值
    assetsInlineLimit: 8192, // 8KB 以下的資源內聯為 base64
  },
  // 優化相依性
  optimizeDeps: {
    include: [
      'vue',
      'vue-router', 
      'pinia',
      'axios',
      'three',
      '@tweenjs/tween.js',
      'chinese-s2t'
    ]
  }
})