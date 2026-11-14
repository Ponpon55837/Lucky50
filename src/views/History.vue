<script setup lang="ts">
import FortuneLogViewer from '@/components/FortuneLogViewer.vue'
</script>

<template>
  <div class="flex flex-col gap-6">
    <header>
      <h1 class="font-serif text-[28px] font-bold leading-tight text-ink sm:text-[36px]">
        運勢歷史記錄
      </h1>
      <p class="mt-1.5 text-sm text-ink-2">
        瀏覽所有已計算的運勢結果
      </p>
    </header>

    <!-- 運勢歷史列表 -->
    <FortuneLogViewer />
  </div>
</template>
