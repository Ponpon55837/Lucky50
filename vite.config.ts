import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
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
        passes: 2, // 多次壓縮以獲得更好的結果
      },
      mangle: {
        // 混淆變數名稱
        safari10: true,
      },
    },
    // 啟用 gzip
    reportCompressedSize: true,
    // chunk 大小警告閾值
    chunkSizeWarningLimit: 1500,
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