<script setup lang="ts">
import { computed } from 'vue'
import EngineCard from '@/components/engines/EngineCard.vue'
import { FengShuiEngine } from '@/services/engines/fengShui'
import { buildBirthChart } from '@/services/engines/birthChart'
import { ELEMENT_LABEL, type ElementKey } from '@/utils/almanac'
import type { UserProfileCompat } from '@/services/integratedFortune'

interface DirectionInfo {
  direction: string
  reason: string
}

interface DailyFortune {
  stem: string
  branch: string
  element: string
  advice: string
}

const props = defineProps<{
  profile: UserProfileCompat | null
  /** 流日計算的日期，跟著儀表板目前選的日子 */
  date: Date
}>()

const engine = new FengShuiEngine()

const elementLabel = (key: string) => ELEMENT_LABEL[key as ElementKey] ?? key

const state = computed(() => {
  const profile = props.profile
  if (!profile) return { result: null, error: null }
  try {
    const { lunarData, baZi, elements } = buildBirthChart(profile)
    const raw = engine.calculate(profile, props.date, lunarData, baZi, elements)
    const details = (raw.details ?? {}) as Record<string, unknown>
    const daily = details.dailyFortune as DailyFortune | undefined
    const lucky = (details.luckyDirections as DirectionInfo[] | undefined) ?? []
    const avoid = (details.avoidDirections as DirectionInfo[] | undefined) ?? []

    return {
      result: {
        wealthDirection: lucky[0]?.direction ?? raw.luckyDirection ?? '',
        daily: daily
          ? {
              ganZhi: `${daily.stem}${daily.branch}`,
              element: elementLabel(daily.element),
              advice: daily.advice,
            }
          : null,
        lucky,
        avoid,
        favorable: (raw.luckyElements ?? []).map(elementLabel),
        unfavorable: (raw.avoidElements ?? []).map(elementLabel),
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
    tab="風水方位"
    title="風水方位與流日"
    :error="state.error"
    :empty="!profile"
  >
    <template v-if="state.result">
      <p
        v-if="state.result.wealthDirection"
        class="font-kai text-[22px] font-bold"
      >
        財位在{{ state.result.wealthDirection }}
      </p>
      <p
        v-if="state.result.daily"
        class="text-[13px] text-ink-2"
      >
        <span class="text-ink">今日流日</span>
        {{ state.result.daily.ganZhi }} · 五行屬{{ state.result.daily.element }}。{{
          state.result.daily.advice
        }}
      </p>
      <dl class="grid gap-1.5 border-t border-line pt-3 text-[13px]">
        <div
          v-if="state.result.lucky.length"
          class="grid grid-cols-[40px_minmax(0,1fr)] gap-2"
        >
          <dt class="text-seal-ink">
            吉方
          </dt>
          <dd>
            {{ state.result.lucky.map(d => d.direction).join('、') }}
          </dd>
        </div>
        <div
          v-if="state.result.avoid.length"
          class="grid grid-cols-[40px_minmax(0,1fr)] gap-2"
        >
          <dt class="text-ink-3">
            凶方
          </dt>
          <dd class="text-ink-2">
            {{ state.result.avoid.map(d => d.direction).join('、') }}
          </dd>
        </div>
        <div
          v-if="state.result.favorable.length || state.result.unfavorable.length"
          class="grid grid-cols-[40px_minmax(0,1fr)] gap-2"
        >
          <dt class="text-ink-3">
            五行
          </dt>
          <dd class="text-ink-2">
            喜{{ state.result.favorable.join('') || '—' }}，忌{{
              state.result.unfavorable.join('') || '—'
            }}
          </dd>
        </div>
      </dl>
    </template>
  </EngineCard>
</template>
