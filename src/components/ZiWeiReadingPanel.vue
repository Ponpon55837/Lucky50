<script setup lang="ts">
import { computed, shallowRef, ref, useId, watch } from 'vue'
import { buildBirthChart } from '@/services/engines/birthChart'
import { adaptZiWeiChart } from '@/services/ziwei-enrichment/adaptChart'
import {
  buildZiWeiTransformationLayers,
  type ZiWeiLayer,
} from '@/services/ziwei-enrichment/flows/transformations'
import { loadZiWeiPatterns } from '@/services/ziwei-enrichment/loadPatterns'
import type {
  ZiWeiPatternResult,
  ZiWeiPatternStar,
} from '@/services/ziwei-enrichment/patterns/types'
import { fromLocalDateString, toLocalDateString } from '@/utils/date'
import { buildZiWeiChart } from '@/utils/ziwei'

const props = defineProps<{
  birthDate: string
  birthTime: string
  date: Date
}>()

const LAYERS = {
  natal: '本命',
  year: '流年',
  month: '流月',
  day: '流日',
} satisfies Record<ZiWeiLayer, string>

const PATTERN_STATUS = {
  qualified: '成立',
  weakened: '見破格因素',
  'not-qualified': '未成立',
} satisfies Record<ZiWeiPatternResult['status'], string>

const layerId = useId()
const dateId = useId()
const dashboardDate = computed(() => toLocalDateString(props.date))
const readingDate = ref(dashboardDate.value)
const layer = ref<ZiWeiLayer>('natal')
const patterns = shallowRef<ZiWeiPatternResult[] | null>(null)
const patternError = ref(false)
const validTime = computed(() => /^(?:[01]?\d|2[0-3]):[0-5]\d$/.test(props.birthTime))
const natal = computed(() => {
  if (!validTime.value) return null

  try {
    const birth = buildBirthChart({ birthDate: props.birthDate, birthTime: props.birthTime })
    const chart = buildZiWeiChart({
      yearStem: birth.lunarYear.stem,
      yearBranch: birth.lunarYear.branch,
      lunarMonth: birth.lunarMonth,
      lunarDay: birth.lunarDay,
      hourBranch: birth.hourBranch,
    })
    return { chart, snapshot: adaptZiWeiChart(chart, birth.lunarYear.stem) }
  } catch {
    return null
  }
})

const flows = computed(() => {
  if (!natal.value || !readingDate.value) return null

  const date = fromLocalDateString(readingDate.value)
  if (toLocalDateString(date) !== readingDate.value) return null

  try {
    const { chart, snapshot } = natal.value
    return buildZiWeiTransformationLayers(
      chart,
      snapshot.natalTransformations.sourceStem,
      date
    )
  } catch {
    return null
  }
})

const selectedLayer = computed(() =>
  layer.value === 'natal' ? natal.value?.snapshot.natalTransformations : flows.value?.layers[layer.value]
)
const dateLabel = computed(() => {
  if (layer.value === 'natal') return ''
  const flow = flows.value
  if (!flow) return ''
  if (layer.value === 'year') return `農曆 ${flow.lunarYear} 年`
  if (layer.value === 'day') return flow.date

  const currentMonth = `農曆 ${flow.lunarYear} 年 ${flow.isLeapMonth ? '閏' : ''}${flow.lunarMonth} 月 ${flow.lunarDay} 日`
  if (flow.effectiveMonth === flow.lunarMonth) return currentMonth
  const effectiveYear =
    flow.effectiveMonthYear === flow.lunarYear ? '' : `${flow.effectiveMonthYear} 年 `
  return `${currentMonth}，按 ${effectiveYear}${flow.effectiveMonth} 月起算`
})

const visiblePatterns = computed(
  () =>
    patterns.value?.filter(
      result => result.id === 'zi-fu-life-palace' || result.status !== 'not-qualified'
    ) ?? []
)

function evidenceGroups(result: ZiWeiPatternResult) {
  return [
    {
      label: result.status === 'not-qualified' ? '判定依據' : '成立依據',
      entries: result.required,
    },
    { label: '強化因素', entries: result.supporting },
    { label: '破格因素', entries: result.breaking },
  ].filter(group => group.entries.length > 0)
}

function formatEvidenceStar(star: ZiWeiPatternStar) {
  const fields = [
    natal.value?.snapshot.palaces[star.branch].name,
    star.branch,
    star.brightness,
    star.natalTransformation ? `本命${star.natalTransformation}` : null,
  ].filter(Boolean)
  return `${star.name}（${fields.join('・')}）`
}

watch(dashboardDate, value => { readingDate.value = value })

watch(
  natal,
  async (value, _previous, onCleanup) => {
    patterns.value = null
    patternError.value = false
    if (!value) return

    let current = true
    onCleanup(() => {
      current = false
    })
    try {
      const results = await loadZiWeiPatterns(value.snapshot)
      if (current) patterns.value = results
    } catch {
      if (current) patternError.value = true
    }
  },
  { immediate: true }
)
</script>

<template>
  <div class="mt-3 flex min-w-0 flex-col gap-4 break-words text-sm">
    <p class="text-xs text-ink-3">
      傳統命理解讀，僅供文化參考。
    </p>
    <p
      v-if="!natal"
      role="status"
      class="text-ink-2"
    >
      {{
        validTime
          ? '出生日期無法排盤，格局與四化未計算。'
          : '請填寫有效的出生時間，格局與四化目前未計算。'
      }}
    </p>
    <template v-else>
      <p class="text-xs text-ink-2">
        命宮在{{ natal.snapshot.lifeBranch }}，身宮在{{ natal.snapshot.bodyBranch }}。
      </p>
      <section class="min-w-0 space-y-2">
        <label
          :for="layerId"
          class="block font-semibold"
        >四化層別</label>
        <select
          :id="layerId"
          v-model="layer"
          class="w-full rounded border border-line-strong bg-surface px-2 py-2 text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-seal"
        >
          <option
            v-for="(label, key) in LAYERS"
            :key="key"
            :value="key"
          >
            {{ label }}
          </option>
        </select>
        <div
          v-if="layer !== 'natal'"
          class="space-y-1"
        >
          <label
            :for="dateId"
            class="block text-xs font-semibold"
          >四化查閱日期</label>
          <input
            :id="dateId"
            v-model="readingDate"
            type="date"
            min="1900-01-01"
            max="2100-12-31"
            class="w-full min-w-0 max-w-full rounded border border-line-strong bg-surface px-2 py-2 text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-seal"
          >
        </div>
        <div
          aria-live="polite"
          class="space-y-2"
        >
          <template v-if="selectedLayer">
            <p class="text-xs text-ink-2">
              {{ LAYERS[layer] }}以{{ selectedLayer.sourceStem }}干起四化<span v-if="dateLabel">
                · {{ dateLabel }}</span>
            </p>
            <dl class="space-y-1 rounded border border-line bg-raised p-2">
              <div
                v-for="entry in selectedLayer.entries"
                :key="entry.type"
                class="grid grid-cols-[3em_minmax(0,1fr)] gap-x-2"
              >
                <dt class="font-semibold">
                  {{ entry.type }}
                </dt>
                <dd>
                  {{ entry.star }} · {{ natal.snapshot.palaces[entry.palaceBranch].name }}（{{
                    entry.palaceBranch
                  }}）
                </dd>
              </div>
            </dl>
          </template>
          <p
            v-else
            class="text-ink-2"
          >
            請選擇 1900 至 2100 年之間的日期。
          </p>
        </div>
      </section>
      <section class="min-w-0 space-y-2">
        <h4 class="font-semibold">
          本命格局
        </h4>
        <p
          v-if="patternError || !patterns || visiblePatterns.length === 0"
          role="status"
          class="text-xs text-ink-2"
        >
          {{
            patternError
              ? '目前無法計算本命格局。'
              : !patterns
                ? '正在判讀本命格局'
                : '本命盤未符合目前收錄的格局。'
          }}
        </p>
        <details
          v-for="pattern in visiblePatterns"
          :key="pattern.id"
          class="rounded border border-line p-2"
        >
          <summary
            class="cursor-pointer rounded font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-seal"
          >
            {{ pattern.name
            }}<span class="ml-2 text-xs font-normal text-ink-2">{{
              PATTERN_STATUS[pattern.status]
            }}</span>
          </summary>
          <div class="mt-2 space-y-3 text-xs">
            <div
              v-for="group in evidenceGroups(pattern)"
              :key="group.label"
            >
              <p class="font-semibold">
                {{ group.label }}
              </p>
              <ul class="space-y-1 pt-1 text-ink-2">
                <li
                  v-for="entry in group.entries"
                  :key="entry.id"
                >
                  {{ entry.description }}
                  <span
                    v-if="entry.stars.length"
                    class="block"
                  >{{
                    entry.stars.map(formatEvidenceStar).join('、')
                  }}</span>
                </li>
              </ul>
            </div>
            <div v-if="pattern.borrowedLifeStars?.length">
              <p class="font-semibold">
                命宮借星
              </p>
              <p class="pt-1 text-ink-2">
                {{ pattern.borrowedLifeStars.map(formatEvidenceStar).join('、') }}
              </p>
            </div>
            <div class="space-y-1 border-t border-line pt-2">
              <p class="text-ink-2">
                規則版本 {{ pattern.ruleVersion }}
              </p>
              <a
                v-for="source in pattern.sources"
                :key="source.url"
                :href="source.url"
                target="_blank"
                rel="noopener noreferrer"
                class="block rounded text-seal-ink underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-seal"
              >{{ source.title }}</a>
            </div>
          </div>
        </details>
      </section>
    </template>
  </div>
</template>
