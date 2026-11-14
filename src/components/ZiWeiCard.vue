<script setup lang="ts">
import { computed } from 'vue'
import EngineCard from '@/components/engines/EngineCard.vue'
import { ZiWeiEngine } from '@/services/engines/ziWei'
import { buildBirthChart, energyWord } from '@/services/engines/birthChart'
import type { UserProfileCompat } from '@/services/integratedFortune'

interface PalaceResult {
  stars: string[]
  score: number
  dominantStar: string
  risk: string
}

const props = defineProps<{
  profile: UserProfileCompat | null
  /** 流日計算的日期，跟著儀表板目前選的日子 */
  date: Date
}>()

const engine = new ZiWeiEngine()

const state = computed(() => {
  const profile = props.profile
  if (!profile) return { result: null, error: null }
  try {
    const { lunarData, baZi, elements } = buildBirthChart(profile)
    const raw = engine.calculate(profile, props.date, lunarData, baZi, elements)
    const details = (raw.details ?? {}) as Record<string, unknown>
    const palaces = (details.palaces ?? {}) as Record<string, PalaceResult>

    return {
      result: {
        dominantStar: (details.dominantStar as string) || '紫微',
        investmentStyle: (details.investmentStyle as string) || '',
        riskProfile: (details.riskProfile as string) || '中風險',
        energy: energyWord(raw.score),
        palaces: Object.entries(palaces).map(([name, palace]) => ({
          name,
          star: palace.dominantStar,
          risk: palace.risk,
          energy: energyWord(palace.score),
        })),
      },
      error: null,
    }
  } catch (e) {
    return { result: null, error: e instanceof Error ? e.message : '計算失敗' }
  }
})
</script>

<template>
  <EngineCard
    tab="紫微斗數"
    title="紫微斗數分析"
    :error="state.error"
    :empty="!profile"
  >
    <template v-if="state.result">
      <p class="flex flex-wrap items-baseline gap-x-3">
        <span class="text-[13px] text-ink-3">命主星</span>
        <span class="font-kai text-[22px] font-bold">{{ state.result.dominantStar }}</span>
        <span class="text-[13px] text-ink-3">紫微能量{{ state.result.energy }}</span>
      </p>
      <p
        v-if="state.result.investmentStyle"
        class="text-[13px] text-ink-2"
      >
        {{ state.result.investmentStyle }}
      </p>
      <ul class="flex flex-col gap-1.5 border-t border-line pt-3 text-[13px]">
        <li
          v-for="palace in state.result.palaces"
          :key="palace.name"
          class="grid grid-cols-[56px_minmax(0,1fr)_auto] gap-2"
        >
          <span class="text-ink-3">{{ palace.name }}</span>
          <span class="truncate">{{ palace.star }} · {{ palace.risk }}</span>
          <span class="text-ink-3">{{ palace.energy }}</span>
        </li>
      </ul>
      <p class="text-[13px] text-ink-2">
        <span class="text-ink">風險評估：</span>{{ state.result.riskProfile }}
      </p>
    </template>
  </EngineCard>
</template>
