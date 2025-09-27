<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { defineAsyncComponent } from 'vue'

// Lazy load FortuneOrb component
const FortuneOrb = defineAsyncComponent({
  loader: () => import('@/components/FortuneOrb.vue'),
  loadingComponent: () => import('@/components/ui/Loading.vue'),
})
</script>

<template>
  <div class="min-h-screen">
    <!-- Hero Section -->
    <section class="relative overflow-hidden">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div class="text-center">
          <h1 class="text-4xl md:text-6xl font-bold text-white mb-6">農民曆智慧投資</h1>
          <p class="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            結合傳統農民曆智慧與現代金融科技<br />
            為您的 0050 ETF 投資提供個人化建議
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <RouterLink to="/dashboard" class="btn-primary text-lg px-8 py-3">
              開始投資分析
            </RouterLink>
            <RouterLink to="/profile" class="btn-secondary text-lg px-8 py-3">
              設定個人資料
            </RouterLink>
          </div>
        </div>

        <!-- 3D Fortune Orb -->
        <div class="mt-12 sm:mt-16 flex justify-center">
          <div class="w-48 h-48 sm:w-64 sm:h-64 relative">
            <Suspense>
              <FortuneOrb
                :fortune-score="75"
                :elements="{
                  metal: 85,
                  wood: 60,
                  water: 70,
                  fire: 90,
                  earth: 55,
                }"
              />
              <template #fallback>
                <div class="w-full h-full flex items-center justify-center">
                  <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              </template>
            </Suspense>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="py-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="text-3xl md:text-4xl font-bold text-white mb-6">專案特色</h2>
          <p class="text-xl text-gray-300 max-w-2xl mx-auto">
            創新結合東方智慧與西方科技，為現代投資者提供全新視角
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          <div class="card text-center">
            <div
              class="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-gold-500 to-yellow-600 flex items-center justify-center"
            >
              <svg
                class="w-6 h-6 sm:w-8 sm:h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h3 class="text-lg sm:text-xl font-semibold text-white mb-2">個人化分析</h3>
            <p class="text-sm sm:text-base text-gray-300">
              根據出生年月日、時辰與生肖計算個人投資運勢
            </p>
          </div>

          <div class="card text-center">
            <div
              class="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-jade-500 to-green-600 flex items-center justify-center"
            >
              <svg
                class="w-6 h-6 sm:w-8 sm:h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 class="text-lg sm:text-xl font-semibold text-white mb-2">農民曆整合</h3>
            <p class="text-sm sm:text-base text-gray-300">結合傳統農民曆的吉凶宜忌判斷投資時機</p>
          </div>

          <div class="card text-center">
            <div
              class="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center"
            >
              <svg
                class="w-6 h-6 sm:w-8 sm:h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M7 4V2a1 1 0 011-1h4a1 1 0 011 1v2M7 4h10M7 4l.01 16h9.98L17 4M12 8v8"
                />
              </svg>
            </div>
            <h3 class="text-lg sm:text-xl font-semibold text-white mb-2">3D 視覺化</h3>
            <p class="text-sm sm:text-base text-gray-300">
              使用 Three.js 打造沉浸式 3D 投資運勢球體
            </p>
          </div>

          <div class="card text-center">
            <div
              class="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-cyan-600 flex items-center justify-center"
            >
              <svg
                class="w-6 h-6 sm:w-8 sm:h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 class="text-lg sm:text-xl font-semibold text-white mb-2">0050 專注</h3>
            <p class="text-sm sm:text-base text-gray-300">
              專門針對台灣最具代表性的 ETF 提供精準分析
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-20">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div class="card">
          <h2 class="text-3xl font-bold text-white mb-6">立即開始您的智慧投資之旅</h2>
          <p class="text-xl text-gray-300 mb-8">設定您的個人資料，獲取專屬的投資運勢分析</p>
          <RouterLink to="/profile" class="btn-primary text-lg px-8 py-4 inline-block">
            建立個人檔案
          </RouterLink>
        </div>
      </div>
    </section>
  </div>
</template>
