<script setup lang="ts">
import { computed, ref } from 'vue'
import * as THREE from 'three'
import SceneCard, { type SceneTooltip } from '@/components/three/SceneCard.vue'
import { useSceneStage } from '@/composables/useSceneStage'
import { useDashboardStore } from '@/stores/dashboard'
import { tradeItemsFirst } from '@/utils/almanac'
import { ringPosition } from '@/utils/sceneLayout'
import { SEASON_MARKERS, SOLAR_TERMS, solarTermProgress } from '@/utils/solarTerms'
import {
  createBase,
  createColumns,
  easeOutCubic,
  matteMaterial,
  placeColumn,
} from '@/utils/three-scene'

const { title = '節氣與宜忌' } = defineProps<{ title?: string }>()

const TERM_COUNT = SOLAR_TERMS.length
/** 節氣磚環半徑、今天標記半徑、外側標籤半徑 */
const RING = { tiles: 2.7, today: 2.25, labels: 3.5 }
const TILE = { width: 0.55, depth: 0.3, height: 0.14, current: 0.55 }
const TODAY_RADIUS = 0.11
const ADVICE_LIMIT = 4

const dashboardStore = useDashboardStore()

const lunarData = computed(() => dashboardStore.lunarData)
const progress = computed(() => solarTermProgress(dashboardStore.currentDate))

const lunarDateText = computed(() => {
  const data = lunarData.value
  if (!data || !data.lunarMonth || !data.lunarDay) return ''
  return `${data.lunarMonth}月${data.lunarDay}`
})
const dayGanZhiText = computed(() =>
  lunarData.value?.dayGanZhi ? `${lunarData.value.dayGanZhi}日` : ''
)

const termText = computed(() => {
  const current = progress.value
  if (!current) return ''
  const todayTerm = lunarData.value?.jieQi
  return todayTerm ? `今日${todayTerm}` : `${current.current}・第 ${current.daysIn + 1} 天`
})

const dutyText = computed(() => {
  const data = lunarData.value
  if (!data?.tianShen) return ''
  return data.tianShenLuck ? `${data.tianShen}（${data.tianShenLuck}）` : data.tianShen
})

const yiItems = computed(() => tradeItemsFirst(lunarData.value?.yi ?? []).slice(0, ADVICE_LIMIT))
const jiItems = computed(() => tradeItemsFirst(lunarData.value?.ji ?? []).slice(0, ADVICE_LIMIT))

const shortDate = (date: Date) =>
  `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`

const threeContainer = ref<HTMLElement>()

const { unsupported, hover } = useSceneStage(threeContainer, {
  view: [0, 1.5, 1.3],
  sources: [progress, lunarData],
  build: (stage, root, palette) => {
    const current = progress.value
    if (!current) return

    root.add(createBase(palette, { radius: 3.6 }))

    // 24 塊節氣磚：一個 InstancedMesh，每塊朝向圓心
    const tiles = createColumns(TERM_COUNT, matteMaterial(0xffffff))
    const finals = SOLAR_TERMS.map((_, i) => {
      const isCurrent = i === current.currentIndex
      const height = isCurrent ? TILE.current : TILE.height
      tiles.setColorAt(
        i,
        isCurrent ? palette.seal : i < current.currentIndex ? palette['ink-3'] : palette.line
      )
      const [x, z] = ringPosition(i, TERM_COUNT, RING.tiles)
      // 磚面朝向圓心
      const facing = Math.PI - (i / TERM_COUNT) * Math.PI * 2
      const place = (scale: number) =>
        placeColumn(tiles, i, [x, 0, z], [TILE.width, height * scale, TILE.depth], facing)
      place(1)
      return place
    })
    root.add(tiles)

    // 今天：依本節氣進度在目前與下個節氣之間內插角度
    const [todayX, todayZ] = ringPosition(
      current.currentIndex + current.fraction,
      TERM_COUNT,
      RING.today
    )
    const today = new THREE.Mesh(
      new THREE.SphereGeometry(TODAY_RADIUS, 24, 16),
      matteMaterial(palette.gold)
    )
    today.position.set(todayX, TODAY_RADIUS, todayZ)
    root.add(today)
    const [todayLabelX, todayLabelZ] = ringPosition(
      current.currentIndex + current.fraction,
      TERM_COUNT,
      RING.today - 0.5
    )
    stage.addLabel('今天', [todayLabelX, 0.1, todayLabelZ], { tone: 'ink' })

    // 標籤：目前節氣與其餘（下個節氣、二分二至四立）放外側
    const labelAt = (index: number, radius: number, y: number) => {
      const [x, z] = ringPosition(index, TERM_COUNT, radius)
      return [x, y, z] as THREE.Vector3Tuple
    }
    stage.addLabel(current.current, labelAt(current.currentIndex, RING.labels, 0.05), {
      variant: 'title',
      tone: 'seal',
    })
    const nextIndex = SOLAR_TERMS.indexOf(current.next)
    stage.addLabel(current.next, labelAt(nextIndex, RING.labels, 0.05), { tone: 'ink-2' })
    const labelled = new Set<string>([current.current, current.next])
    for (const marker of SEASON_MARKERS) {
      if (labelled.has(marker)) continue
      stage.addLabel(marker, labelAt(SOLAR_TERMS.indexOf(marker), RING.labels, 0.05), {
        tone: 'ink-3',
      })
    }

    // 中央：今日干支與農曆月日；沒有農曆資料時只放目前節氣
    if (dayGanZhiText.value) {
      stage.addLabel(dayGanZhiText.value, [0, 0.1, 0], {
        variant: 'title',
        tone: 'ink',
        detail: lunarDateText.value || undefined,
      })
    } else {
      stage.addLabel(current.current, [0, 0.12, 0], { variant: 'title', tone: 'ink' })
    }

    stage.animate(900, p => {
      finals.forEach((place, i) => {
        const delay = (i / finals.length) * 0.5
        place(easeOutCubic(Math.min(1, Math.max(0, (p - delay) / 0.5))))
      })
    })
    return [tiles]
  },
})

const tooltip = computed<SceneTooltip | null>(() => {
  const hit = hover.value
  const info = progress.value
  if (!hit || hit.instanceId === undefined || !info) return null
  const index = hit.instanceId
  const term = SOLAR_TERMS[index]
  if (!term) return null

  const isCurrent = index === info.currentIndex
  const status = isCurrent ? '目前節氣' : index < info.currentIndex ? '已過' : '未到'
  const lines: SceneTooltip['lines'] = [{ label: '狀態', value: status }]
  if (isCurrent) {
    lines.push(
      { label: '交節', value: shortDate(info.currentDate) },
      { label: '已過', value: `第 ${info.daysIn + 1} 天` },
      { label: '距下個節氣', value: `${info.daysLeft} 天` }
    )
  } else if (term === info.next) {
    lines.push({ label: '交節', value: shortDate(info.nextDate) })
  }
  return { x: hit.x, y: hit.y, title: term, lines }
})
</script>

<template>
  <SceneCard
    :title="title"
    subtitle="二十四節氣進度與今日宜忌"
    :unsupported="unsupported"
    :empty="progress ? '' : '無法取得節氣資料'"
    :tooltip="tooltip"
  >
    <template #stats>
      <div v-if="lunarDateText">
        <dt class="text-ink-3">
          農曆
        </dt>
        <dd class="font-serif text-base text-ink">
          {{ lunarDateText }}
        </dd>
      </div>
      <div v-if="termText">
        <dt class="text-ink-3">
          節氣
        </dt>
        <dd class="font-serif text-base text-seal-ink">
          {{ termText }}
        </dd>
      </div>
      <div v-if="dutyText">
        <dt class="text-ink-3">
          值日
        </dt>
        <dd class="font-serif text-base text-ink">
          {{ dutyText }}
        </dd>
      </div>
    </template>

    <div
      ref="threeContainer"
      class="absolute inset-0"
    />

    <template #legend>
      <template v-if="lunarData">
        <span
          v-if="yiItems.length"
          class="flex flex-wrap items-center gap-1.5"
        >
          <span
            v-for="item in yiItems"
            :key="`yi-${item}`"
            class="rounded-full bg-raised px-2 py-0.5 text-seal-ink"
          >宜 {{ item }}</span>
        </span>
        <span
          v-if="jiItems.length"
          class="flex flex-wrap items-center gap-1.5"
        >
          <span
            v-for="item in jiItems"
            :key="`ji-${item}`"
            class="rounded-full bg-raised px-2 py-0.5 text-ink-2"
          >忌 {{ item }}</span>
        </span>
      </template>
      <span class="inline-flex items-center gap-1.5"><i class="h-2.5 w-2.5 rounded-sm bg-seal" />目前節氣</span>
      <span class="inline-flex items-center gap-1.5"><i class="h-2.5 w-2.5 rounded-full bg-gold" />今天</span>
      <span class="inline-flex items-center gap-1.5"><i class="h-2.5 w-2.5 rounded-sm bg-ink-3" />已過節氣</span>
    </template>

    <template #fallback>
      <dl class="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1">
        <template v-if="lunarDateText">
          <dt>農曆</dt>
          <dd>{{ lunarDateText }}</dd>
        </template>
        <template v-if="termText">
          <dt>節氣</dt>
          <dd>{{ termText }}</dd>
        </template>
        <template v-if="yiItems.length">
          <dt>宜</dt>
          <dd>{{ yiItems.join('、') }}</dd>
        </template>
        <template v-if="jiItems.length">
          <dt>忌</dt>
          <dd>{{ jiItems.join('、') }}</dd>
        </template>
      </dl>
    </template>
  </SceneCard>
</template>
