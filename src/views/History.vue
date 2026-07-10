<script setup lang="ts">
import FortuneLogViewer from '@/components/FortuneLogViewer.vue'
</script>

<template>
  <div class="min-h-screen py-6 sm:py-8 lg:py-12">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Page Header -->
      <div class="mb-6 sm:mb-8">
        <h1 class="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">
          運勢歷史記錄
        </h1>
        <p class="text-xs sm:text-sm lg:text-base text-gray-400">
          瀏覽所有已計算的運勢結果
        </p>
      </div>

      <!-- 運勢歷史列表 -->
      <FortuneLogViewer />
    </div>
  </div>
</template>
