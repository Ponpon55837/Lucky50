<script setup lang="ts">
import { computed, ref, shallowRef, type Component } from 'vue'
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
  missingBirthTime?: boolean
  /** 流日計算的日期，跟著儀表板目前選的日子 */
  date: Date
}>()

type ReadingPanelState =
  | { status: 'idle' | 'loading' | 'error' }
  | { status: 'ready'; component: Component }

const readingEnabled = computed(() => import.meta.env.VITE_ZIWEI_PATTERNS === 'true')
const readingOpen = ref(false)
const reading = shallowRef<ReadingPanelState>({ status: 'idle' })

async function loadReading() {
  if (
    import.meta.env.VITE_ZIWEI_PATTERNS !== 'true' ||
    reading.value.status === 'loading' ||
    reading.value.status === 'ready'
  ) {
    return
  }

  reading.value = { status: 'loading' }
  try {
    const { default: component } = await import('./ZiWeiReadingPanel.vue')
    reading.value = { status: 'ready', component }
  } catch {
    reading.value = { status: 'error' }
  }
}

function toggleReading(event: Event) {
  readingOpen.value =
    event.currentTarget instanceof HTMLDetailsElement && event.currentTarget.open
  if (readingOpen.value) void loadReading()
}

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
    <template
      v-if="readingEnabled && missingBirthTime"
      #empty
    >
      請填寫有效的出生時間，格局與四化目前未計算。
    </template>
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
      <details
        v-if="readingEnabled && profile"
        class="min-w-0 border-t border-line pt-3"
        :open="readingOpen"
        @toggle="toggleReading"
      >
        <summary class="cursor-pointer rounded text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-seal">
          格局與四化
        </summary>
        <template v-if="readingOpen">
          <p
            v-if="reading.status === 'loading'"
            role="status"
            class="mt-3 text-sm text-ink-3"
          >
            正在載入紫微解讀
          </p>
          <div
            v-else-if="reading.status === 'error'"
            class="mt-3 flex flex-wrap items-baseline gap-x-2 text-sm"
          >
            <p role="status">
              暫時無法載入紫微解讀。
            </p>
            <button
              type="button"
              class="rounded text-seal-ink underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-seal"
              @click="loadReading"
            >
              重試
            </button>
          </div>
          <component
            :is="reading.component"
            v-else-if="reading.status === 'ready'"
            :birth-date="profile.birthDate"
            :birth-time="profile.birthTime"
            :date="date"
          />
        </template>
      </details>
    </template>
  </EngineCard>
</template>
