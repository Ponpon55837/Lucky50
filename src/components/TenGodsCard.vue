<script setup lang="ts">
import EngineCard from '@/components/engines/EngineCard.vue'
import { useEngineResult } from '@/composables/useEngineResult'
import { BaziTenGodsEngine } from '@/services/engines/baziTenGods'
import { energyWord } from '@/services/engines/birthChart'
import { PILLAR_KEYS, TEN_GODS_INVESTMENT_STYLE, type FourPillarsGods } from '@/utils/tenGods'
import type { TenGodName } from '@/utils/tenGods'
import type { UserProfileCompat } from '@/services/integratedFortune'

interface TenGodsDetails {
  gods: FourPillarsGods
  dominantGods: TenGodName[]
  investmentDescription: string
  strengthText: string
}

const props = defineProps<{
  profile: UserProfileCompat | null
  /** 流日計算的日期，跟著儀表板目前選的日子 */
  date: Date
}>()

const PILLAR_LABEL = { year: '年柱', month: '月柱', day: '日柱', hour: '時柱' } as const

const state = useEngineResult(
  new BaziTenGodsEngine(),
  () => props.profile,
  () => props.date,
  (raw, { chart }) => {
    const details = raw.details as unknown as TenGodsDetails
    return {
      headline: details.dominantGods[0],
      styleNote: details.dominantGods
        .map(god => `${god}${TEN_GODS_INVESTMENT_STYLE[god]}`)
        .join('、'),
      description: details.investmentDescription,
      strengthText: details.strengthText,
      energy: energyWord(raw.score),
      pillars: PILLAR_KEYS.map(key => ({
        label: PILLAR_LABEL[key],
        stemGod: details.gods[key].stem ?? '日主',
        branchGod: details.gods[key].branch,
        ganZhi: `${chart.pillars[key].stem}${chart.pillars[key].branch}`,
      })),
    }
  }
)
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
        <span class="text-[13px] text-ink-3">今日能量{{ state.result.energy }}</span>
      </p>
      <p class="text-[13px] text-ink-2">
        <span class="text-ink">投資風格：</span>{{ state.result.description }}
      </p>
      <p class="text-[13px] text-ink-3">
        {{ state.result.styleNote }}
      </p>
      <p class="text-[13px] text-ink-2">
        {{ state.result.strengthText }}
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
            {{ pillar.ganZhi }}
          </dd>
          <dd class="text-xs text-ink-3">
            {{ pillar.stemGod }}
          </dd>
          <dd class="text-xs text-ink-3">
            {{ pillar.branchGod }}
          </dd>
        </div>
      </dl>
    </template>
  </EngineCard>
</template>
