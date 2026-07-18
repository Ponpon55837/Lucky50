<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/')
}

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    goHome()
  }
}
</script>

<template>
  <div class="min-h-screen py-6 sm:py-8 lg:py-12">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex flex-col items-center justify-center text-center py-16 sm:py-24">
        <!-- 404 數字 -->
        <div class="mb-8">
          <span class="text-7xl sm:text-9xl font-bold text-white/10 select-none">404</span>
        </div>

        <!-- 圖示 -->
        <div
          class="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-gold-500/20 to-yellow-600/20 flex items-center justify-center border border-gold-500/30"
        >
          <svg
            class="w-8 h-8 sm:w-10 sm:h-10 text-gold-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <!-- 標題與說明 -->
        <h1 class="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-3">找不到頁面</h1>
        <p class="text-sm sm:text-base text-gray-400 mb-8 max-w-md">
          您要找的頁面不存在或已被移除，請檢查網址是否正確。
        </p>

        <!-- 操作按鈕 -->
        <div class="flex flex-col sm:flex-row gap-3">
          <button class="btn-primary px-6 py-3 text-sm sm:text-base" @click="goHome">
            返回首頁
          </button>
          <button class="btn-secondary px-6 py-3 text-sm sm:text-base" @click="goBack">
            回上一頁
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
