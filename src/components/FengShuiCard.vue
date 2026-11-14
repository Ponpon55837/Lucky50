<script setup lang="ts">
import EngineCard from '@/components/engines/EngineCard.vue'
import { useEngineResult } from '@/composables/useEngineResult'
import { FengShuiEngine } from '@/services/engines/fengShui'
import { ELEMENT_LABEL, type ElementKey } from '@/utils/ganzhi'
import type { UserProfileCompat } from '@/services/integratedFortune'

interface DirectionNote {
  direction: string
  reason: string
}

interface FengShuiDetails {
  luckyDirections: DirectionNote[]
  avoidDirections: DirectionNote[]
  dailyFortune: { ganZhi: string; element: ElementKey | null; advice: string }
}

const props = defineProps<{
  profile: UserProfileCompat | null
  /** 流日計算的日期，跟著儀表板目前選的日子 */
  date: Date
}>()

const labels = (keys: readonly string[] = []) =>
  keys.map(key => ELEMENT_LABEL[key as ElementKey] ?? key).join('')

const state = useEngineResult(
  new FengShuiEngine(),
  () => props.profile,
  () => props.date,
  raw => {
    const details = raw.details as unknown as FengShuiDetails
    const daily = details.dailyFortune
    return {
      wealthDirection: raw.luckyDirection ?? '',
      daily: {
        ganZhi: daily.ganZhi,
        element: daily.element ? ELEMENT_LABEL[daily.element] : '',
        advice: daily.advice,
      },
      lucky: details.luckyDirections,
      avoid: details.avoidDirections,
      favorable: labels(raw.luckyElements),
      unfavorable: labels(raw.avoidElements),
    }
  }
)
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
      <p class="text-[13px] text-ink-2">
        <span class="text-ink">今日流日</span>
        {{ state.result.daily.ganZhi }} · 納音屬{{ state.result.daily.element }}。{{
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
          v-if="state.result.favorable || state.result.unfavorable"
          class="grid grid-cols-[40px_minmax(0,1fr)] gap-2"
        >
          <dt class="text-ink-3">
            五行
          </dt>
          <dd class="text-ink-2">
            喜{{ state.result.favorable || '—' }}，忌{{ state.result.unfavorable || '—' }}
          </dd>
        </div>
      </dl>
    </template>
  </EngineCard>
</template>
