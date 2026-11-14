<script setup lang="ts">
import { computed, ref } from 'vue'
import * as THREE from 'three'
import SceneCard, { type SceneTooltip } from '@/components/three/SceneCard.vue'
import { useSceneStage } from '@/composables/useSceneStage'
import { useDashboardStore } from '@/stores/dashboard'
import { useAnalyticsStore } from '@/stores/analytics'
import { evenIndices } from '@/utils/chart'
import { candleLayout, movingAverage, toneOf, type SceneTone } from '@/utils/sceneLayout'
import {
  createBase,
  createColumns,
  easeOutCubic,
  lineMaterial,
  matteMaterial,
  placeColumn,
  type ScenePalette,
} from '@/utils/three-scene'

const { title = '股價走勢' } = defineProps<{ title?: string }>()

/** 顯示的交易日數：再多 K 棒會細到看不清 */
const VISIBLE_DAYS = 60
const MA_PERIOD = 20
const CHART = { width: 10, height: 3.2, lift: 0.9, volumeHeight: 0.65, depth: 0.42 }

const dashboardStore = useDashboardStore()
const analyticsStore = useAnalyticsStore()

const allDays = computed(() => analyticsStore.getAdjustedEtfData(dashboardStore.etfData))
const days = computed(() => allDays.value.slice(-VISIBLE_DAYS))
const movingAverages = computed(() =>
  movingAverage(
    allDays.value.map(d => d.close),
    MA_PERIOD
  ).slice(-VISIBLE_DAYS)
)

const latest = computed(() => days.value.at(-1) ?? null)
const change = computed(() => {
  const all = allDays.value
  if (all.length < 2) return { value: 0, percent: 0 }
  const previous = all[all.length - 2].close
  const value = all[all.length - 1].close - previous
  return { value, percent: previous ? (value / previous) * 100 : 0 }
})

const TONE_CLASS: Readonly<Record<SceneTone, string>> = {
  rise: 'text-rise',
  fall: 'text-fall',
  flat: 'text-ink-2',
}
const changeTone = computed(() => TONE_CLASS[toneOf(change.value.value)])
const signed = (value: number, digits = 2) => `${value > 0 ? '+' : ''}${value.toFixed(digits)}`
const shortDate = (date: string) => date.slice(5).replace('-', '/')

const toneColor = (palette: ScenePalette, tone: SceneTone) =>
  tone === 'flat' ? palette['ink-3'] : palette[tone]

const threeContainer = ref<HTMLElement>()

const { unsupported, hover } = useSceneStage(threeContainer, {
  view: [0, 0.55, 2.4],
  sources: [days],
  build: (stage, root, palette) => {
    const data = days.value
    if (data.length === 0) return

    const { width, height, lift, volumeHeight, depth } = CHART
    const layout = candleLayout(data, { width, height, volumeHeight })
    const barWidth = Math.min(depth, layout.slot * 0.68)

    root.add(createBase(palette, { width: width + 0.8, depth: 1.4 }))

    // 價格格線：畫在 K 棒後方的淡線，對應左側價格刻度
    const gridPoints: THREE.Vector3[] = []
    for (const tick of layout.ticks) {
      const y = lift + layout.priceToY(tick)
      gridPoints.push(new THREE.Vector3(-width / 2, y, -0.4), new THREE.Vector3(width / 2, y, -0.4))
      stage.addLabel(tick.toFixed(tick % 1 === 0 ? 0 : 1), [-width / 2 - 0.15, y, 0], {
        variant: 'value',
        align: 'right',
      })
    }
    root.add(
      new THREE.LineSegments(
        new THREE.BufferGeometry().setFromPoints(gridPoints),
        lineMaterial(palette.line)
      )
    )

    // K 棒實體、影線、成交量各一個 InstancedMesh，每根 K 棒以實例顏色區分漲跌
    const bodies = createColumns(data.length, matteMaterial(0xffffff))
    const wicks = createColumns(data.length, matteMaterial(0xffffff))
    const volumes = createColumns(data.length, matteMaterial(0xffffff, { opacity: 0.55 }))
    const finals = layout.bars.map((bar, i) => {
      const color = toneColor(palette, bar.tone)
      bodies.setColorAt(i, color)
      wicks.setColorAt(i, color)
      volumes.setColorAt(i, color)
      const place = (scale: number) => {
        placeColumn(
          bodies,
          i,
          [bar.x, lift + bar.bodyBottom * scale, 0],
          [barWidth, bar.bodyHeight * scale, barWidth]
        )
        placeColumn(
          wicks,
          i,
          [bar.x, lift + bar.wickBottom * scale, 0],
          [0.035, bar.wickHeight * scale, 0.035]
        )
        placeColumn(volumes, i, [bar.x, 0, 0], [barWidth, bar.volume * scale, barWidth])
      }
      place(1)
      return place
    })
    root.add(bodies, wicks, volumes)

    // 20 日均線
    const maPoints = movingAverages.value.flatMap((value, i) =>
      value === null ? [] : [new THREE.Vector3(layout.bars[i].x, lift + layout.priceToY(value), 0)]
    )
    if (maPoints.length > 1) {
      root.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(maPoints),
          lineMaterial(palette['ink-2'], 0.9)
        )
      )
      const last = maPoints[maPoints.length - 1]
      stage.addLabel(`MA${MA_PERIOD}`, [last.x + 0.1, last.y, 0], { align: 'left', tone: 'ink-2' })
    }

    // 日期軸
    for (const i of evenIndices(data.length, 4)) {
      stage.addLabel(shortDate(data[i].date), [layout.bars[i].x, -0.12, 0.7], {
        variant: 'value',
        anchor: 'below',
      })
    }
    stage.addLabel('成交量', [-width / 2 - 0.12, volumeHeight / 2, 0], { align: 'right' })

    // 透明的整欄點選區：K 棒很細，用整個交易日的欄位當滑鼠目標
    const hitMaterial = new THREE.MeshBasicMaterial({ visible: false })
    const hits = createColumns(data.length, hitMaterial)
    layout.bars.forEach((bar, i) =>
      placeColumn(hits, i, [bar.x, 0, 0], [layout.slot, lift + height, 0.8])
    )
    root.add(hits)

    stage.animate(900, progress => {
      finals.forEach((place, i) => {
        const delay = (i / finals.length) * 0.45
        place(easeOutCubic(Math.min(1, Math.max(0, (progress - delay) / 0.55))))
      })
    })
    return [hits]
  },
})

const tooltip = computed<SceneTooltip | null>(() => {
  const hit = hover.value
  if (!hit || hit.instanceId === undefined) return null
  const index = hit.instanceId
  const day = days.value[index]
  if (!day) return null
  const offset = allDays.value.length - days.value.length
  const previous = allDays.value[offset + index - 1]
  const diff = previous ? day.close - previous.close : 0
  return {
    x: hit.x,
    y: hit.y,
    title: day.date,
    lines: [
      { label: '開盤', value: day.open.toFixed(2) },
      { label: '最高', value: day.high.toFixed(2) },
      { label: '最低', value: day.low.toFixed(2) },
      { label: '收盤', value: day.close.toFixed(2), tone: TONE_CLASS[toneOf(diff)] },
      {
        label: '漲跌',
        value: previous ? `${signed(diff)}（${signed((diff / previous.close) * 100)}%）` : '—',
        tone: TONE_CLASS[toneOf(diff)],
      },
      { label: '成交量', value: `${Math.round(day.volume / 1000).toLocaleString('zh-TW')} 張` },
    ],
  }
})
</script>

<template>
  <SceneCard
    :title="title"
    :subtitle="`0050 近 ${days.length} 個交易日 K 線與成交量`"
    :unsupported="unsupported"
    :empty="days.length === 0 ? '尚無股價資料' : ''"
    :tooltip="tooltip"
  >
    <template #stats>
      <div>
        <dt class="text-ink-3">
          收盤
        </dt>
        <dd :class="['font-mono text-base', changeTone]">
          {{ latest ? latest.close.toFixed(2) : '—' }}
        </dd>
      </div>
      <div>
        <dt class="text-ink-3">
          漲跌
        </dt>
        <dd :class="['font-mono text-base', changeTone]">
          {{ signed(change.value) }}（{{ signed(change.percent) }}%）
        </dd>
      </div>
    </template>

    <div
      ref="threeContainer"
      class="absolute inset-0"
    />

    <template #legend>
      <span class="inline-flex items-center gap-1.5"><i class="h-2.5 w-2.5 rounded-sm bg-rise" />收高於開</span>
      <span class="inline-flex items-center gap-1.5"><i class="h-2.5 w-2.5 rounded-sm bg-fall" />收低於開</span>
      <span class="inline-flex items-center gap-1.5"><i class="h-0.5 w-4 bg-ink-2" />{{ MA_PERIOD }} 日均線</span>
      <span class="inline-flex items-center gap-1.5"><i class="h-2.5 w-2.5 rounded-sm bg-ink-3/50" />下方為成交量</span>
    </template>

    <template #fallback>
      <dl
        v-if="latest"
        class="grid grid-cols-2 gap-x-6 gap-y-1"
      >
        <dt>日期</dt>
        <dd class="font-mono">
          {{ latest.date }}
        </dd>
        <dt>收盤</dt>
        <dd :class="['font-mono', changeTone]">
          {{ latest.close.toFixed(2) }}
        </dd>
        <dt>漲跌</dt>
        <dd :class="['font-mono', changeTone]">
          {{ signed(change.value) }}（{{ signed(change.percent) }}%）
        </dd>
        <dt>區間最高／最低</dt>
        <dd class="font-mono">
          {{ Math.max(...days.map(d => d.high)).toFixed(2) }}／{{
            Math.min(...days.map(d => d.low)).toFixed(2)
          }}
        </dd>
      </dl>
    </template>
  </SceneCard>
</template>
