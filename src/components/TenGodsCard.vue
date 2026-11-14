<script setup lang="ts">
import { computed } from 'vue'
import EngineCard from '@/components/engines/EngineCard.vue'
import { buildBirthChart, energyWord } from '@/services/engines/birthChart'
import {
  calculateFourPillarsTenGods,
  countTenGods,
  findDominantTenGods,
  inferInvestmentPersonality,
  TEN_GODS_INVESTMENT_STYLE,
} from '@/utils/tenGods'
import type { UserProfileCompat } from '@/services/integratedFortune'

const props = defineProps<{
  profile: UserProfileCompat | null
}>()

const PILLARS = [
  { key: 'year', label: '年柱' },
  { key: 'month', label: '月柱' },
  { key: 'day', label: '日柱' },
  { key: 'hour', label: '時柱' },
] as const

/** 計算為同步純運算，直接用 computed，資料不變時不重算 */
const state = computed(() => {
  if (!props.profile) return { result: null, error: null }
  try {
    const { baZi } = buildBirthChart(props.profile)
    const ganZhi = {
      year: baZi.yearGanZhi,
      month: baZi.monthGanZhi,
      day: baZi.dayGanZhi,
      hour: baZi.hourGanZhi,
    }
    const distribution = calculateFourPillarsTenGods(
      ganZhi.year,
      ganZhi.month,
      ganZhi.day,
      ganZhi.hour
    )
    const counts = countTenGods(distribution)
    const dominant = findDominantTenGods(counts)
    const personality = inferInvestmentPersonality(distribution)
    // 十神越集中，能量越強
    const concentration = Math.max(...Object.values(counts)) / 4
    const score = Math.round(30 + concentration * 50)

    return {
      result: {
        headline: dominant[0] ?? '十神均衡',
        styleNote: dominant.map(god => `${god}${TEN_GODS_INVESTMENT_STYLE[god]}`).join('、'),
        description: personality.description,
        energy: energyWord(score),
        pillars: PILLARS.map(({ key, label }) => ({
          label,
          god: distribution[key],
          ganZhi: ganZhi[key],
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
    tab="八字十神"
    title="八字十神分析"
    :error="state.error"
    :empty="!profile"
  >
    <template v-if="state.result">
      <p class="flex flex-wrap items-baseline gap-x-3">
        <span class="font-kai text-[22px] font-bold">{{ state.result.headline }}</span>
        <span class="text-[13px] text-ink-3">十神能量{{ state.result.energy }}</span>
      </p>
      <p class="text-[13px] text-ink-2">
        <span class="text-ink">投資風格：</span>{{ state.result.description }}
      </p>
      <p
        v-if="state.result.styleNote"
        class="text-[13px] text-ink-3"
      >
        {{ state.result.styleNote }}
      </p>
      <dl class="grid grid-cols-4 gap-2 border-t border-line pt-3 text-center">
        <div
          v-for="pillar in state.result.pillars"
          :key="pillar.label"
        >
          <dt class="text-xs text-ink-3">
            {{ pillar.label }}
          </dt>
          <dd class="font-kai text-base">
            {{ pillar.god }}
          </dd>
          <dd class="text-xs text-ink-3">
            {{ pillar.ganZhi }}
          </dd>
        </div>
      </dl>
    </template>
  </EngineCard>
</template>
