<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { lunarService } from '@/services/lunar'
import { useDashboardStore } from '@/stores/dashboard'
import { gradeFromScore } from '@/utils/almanac'

const dashboardStore = useDashboardStore()

// 農民曆為同步計算且有快取，首頁直接取今天的資料
const today = lunarService.getLunarData(new Date())

/** 已在儀表板算過今日運勢時，封面帶上籤等 */
const grade = computed(() => {
  const score = dashboardStore.integratedFortune?.investmentScore
  return score == null ? null : gradeFromScore(score)
})

const STEPS = [
  { mark: '一', title: '留下生辰', text: '出生年月日、時辰和姓名，算出你的本命五行' },
  { mark: '二', title: '每天抽一支籤', text: '結合當日宜忌、沖煞與節氣，寫成一首看得懂的籤詩' },
  { mark: '三', title: '照時辰下單', text: '開盤時段哪個時辰吉、哪個凶，和 0050 走勢擺在一起看' },
] as const
</script>

<template>
  <div class="flex flex-col gap-16 lg:gap-20">
    <section
      class="grid items-center gap-12 pt-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:pt-12"
    >
      <div class="flex items-start gap-4 sm:gap-8">
        <p
          class="shrink-0 border-l border-line-strong pl-3.5 font-kai text-lg tracking-[0.3em] text-seal-ink [writing-mode:vertical-rl]"
        >
          翻開今天的農民曆
        </p>
        <div>
          <h1
            class="isolate mb-6 font-serif text-[40px] font-black leading-[1.12] sm:text-[56px] xl:text-[68px]"
          >
            今天，<em class="hero-em">宜</em>買 0050 嗎？
          </h1>
          <p class="mb-8 max-w-[30rem] text-base leading-relaxed text-ink-2 sm:text-lg">
            輸入生辰，每天幫你對照農民曆、八字和紫微，抽一支專屬的投資籤，告訴你哪個時辰下單最順
          </p>
          <div class="flex flex-wrap gap-3">
            <RouterLink
              to="/dashboard"
              class="btn-primary h-12 px-6"
            >
              抽今日籤
            </RouterLink>
            <RouterLink
              to="/profile"
              class="btn-secondary h-12 px-6"
            >
              先設定生辰
            </RouterLink>
          </div>
        </div>
      </div>

      <figure
        class="cover"
        aria-label="今日農民曆封面"
      >
        <div class="flex items-start justify-between">
          <b class="font-kai text-[15px] tracking-[0.2em] text-gold">{{ today.ganZhi }}年</b>
          <span class="font-mono text-xs opacity-80">0050</span>
        </div>
        <div class="flex flex-row-reverse items-start gap-4 self-center justify-self-center">
          <small class="pt-2 font-kai text-lg tracking-[0.3em] [writing-mode:vertical-rl]">投資專用</small>
          <span
            class="font-serif text-[40px] font-black leading-[1.1] tracking-[0.25em] text-gold [writing-mode:vertical-rl] sm:text-[54px]"
          >農民曆</span>
        </div>
        <figcaption class="flex items-end justify-between gap-3 text-[13px]">
          <span>
            {{ today.lunarMonth }}月{{ today.lunarDay }}<br>
            {{ grade ? `今日${grade}` : `宜${today.yi[0] ?? '靜候'}` }}
          </span>
          <span class="seal-stamp seal-stamp-inverse h-[52px] w-[52px] rotate-[-4deg] text-lg">
            {{ today.dayGanZhi }}
          </span>
        </figcaption>
      </figure>
    </section>

    <section class="grid gap-6 border-t border-line pt-12 md:grid-cols-3 md:gap-10">
      <div
        v-for="step in STEPS"
        :key="step.mark"
        class="grid grid-cols-[48px_minmax(0,1fr)] gap-x-4 gap-y-1"
      >
        <span
          class="row-span-2 grid h-12 w-12 place-items-center rounded-full border-[1.5px] border-seal font-kai text-[22px] text-seal-ink"
        >{{ step.mark }}</span>
        <h2 class="self-end font-serif text-[17px] font-bold">
          {{ step.title }}
        </h2>
        <p class="text-sm text-ink-2">
          {{ step.text }}
        </p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.hero-em {
  @apply relative not-italic text-seal-ink;
}

/* 黃色螢光筆底線，像在農民曆上圈重點 */
.hero-em::after {
  content: '';
  @apply absolute bottom-1 left-0 right-0 -z-10 h-2.5 bg-gold/55;
}

.cover {
  @apply relative isolate grid aspect-[4/5] max-h-[520px] w-full max-w-[420px] grid-rows-[auto_1fr_auto] justify-self-center overflow-hidden rounded-3xl bg-seal p-6 text-seal-on sm:p-8;
}

/* 封面內框金線 */
.cover::before {
  content: '';
  @apply absolute inset-3.5 -z-10 rounded-[14px] border-2 border-gold/70;
}
</style>
