<script setup lang="ts">
import EngineCard from '@/components/engines/EngineCard.vue'
import { useEngineResult } from '@/composables/useEngineResult'
import { ZiWeiEngine } from '@/services/engines/ziWei'
import { energyWord } from '@/services/engines/birthChart'
import type { UserProfileCompat } from '@/services/integratedFortune'

interface PalaceDetail {
  name: string
  ganZhi: string
  stars: string[]
  starLabels: string[]
  borrowed: boolean
  assistStars: string[]
  minorStars: string[]
  transformations: string[]
}

interface ZiWeiDetails {
  bureau: string
  lifeStars: string[]
  lifeBorrowed: boolean
  investmentStyle: string
  riskProfile: string
  palaces: PalaceDetail[]
}

const props = defineProps<{
  profile: UserProfileCompat | null
  /** 流日計算的日期，跟著儀表板目前選的日子 */
  date: Date
}>()

const state = useEngineResult(
  new ZiWeiEngine(),
  () => props.profile,
  () => props.date,
  raw => {
    const details = raw.details as unknown as ZiWeiDetails
    return {
      lifeStars: details.lifeStars.join('、') || '無主星',
      lifeBorrowed: details.lifeBorrowed,
      bureau: details.bureau,
      investmentStyle: details.investmentStyle,
      riskProfile: details.riskProfile,
      energy: energyWord(raw.score),
      palaces: details.palaces.map(palace => ({
        name: palace.name,
        stars: `${palace.borrowed ? '借' : ''}${palace.starLabels.join('、') || '—'}`,
        assistStars: palace.assistStars.join('、'),
        minorStars: palace.minorStars.join('、'),
        transformations: palace.transformations.join('、'),
      })),
    }
  }
)
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
        <span class="text-[13px] text-ink-3">{{
          state.result.lifeBorrowed ? '命無正曜，借對宮' : '命宮主星'
        }}</span>
        <span class="font-kai text-[22px] font-bold">{{ state.result.lifeStars }}</span>
        <span class="text-[13px] text-ink-3">{{ state.result.bureau }} · 今日能量{{ state.result.energy }}</span>
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
          class="grid grid-cols-[56px_minmax(0,1fr)_auto] gap-x-2 gap-y-0.5"
        >
          <span class="text-ink-3">{{ palace.name }}</span>
          <span>{{ palace.stars }}</span>
          <span class="text-ink-3">{{ palace.transformations }}</span>
          <span
            v-if="palace.assistStars"
            class="col-start-2 col-end-4 text-[12px] text-ink-2"
          >{{
            palace.assistStars
          }}</span>
          <span
            v-if="palace.minorStars"
            class="col-start-2 col-end-4 text-[12px] text-ink-3"
          >{{
            palace.minorStars
          }}</span>
        </li>
      </ul>
      <p
        v-if="state.result.riskProfile"
        class="text-[13px] text-ink-2"
      >
        <span class="text-ink">風險傾向：</span>{{ state.result.riskProfile }}
      </p>
      <p class="text-[12px] text-ink-3">
        括號內為星曜亮度：廟、旺最有力，得、利、平居中，不、陷最弱。
      </p>
    </template>
  </EngineCard>
</template>
