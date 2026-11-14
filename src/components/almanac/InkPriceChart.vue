<script setup lang="ts">
import { computed, ref } from 'vue'
import { useElementWidth } from '@/composables/useElementWidth'
import { areaPath, evenIndices, extent, linearScale, smoothPath } from '@/utils/chart'
import type { ChartPoint } from '@/composables/useDashboardAlmanac'

const props = defineProps<{
  points: readonly ChartPoint[]
}>()

// 高度固定、寬度跟隨容器，viewBox 與實際像素一致，印章不會被拉伸
const HEIGHT = 260
const PAD = { top: 32, right: 12, bottom: 24, left: 4 }
const STAMP_LIFT = 22
const STAMP_SIZE = 18
const AXIS_LABELS = 3

const container = ref<HTMLElement | null>(null)
const { width } = useElementWidth(container)

const geometry = computed(() => {
  const points = props.points
  const [min, max] = extent(points.map(p => p.close))
  const pad = Math.max((max - min) * 0.08, 0.5)
  const x = linearScale([0, Math.max(points.length - 1, 1)], [PAD.left, width.value - PAD.right])
  const y = linearScale([min - pad, max + pad], [HEIGHT - PAD.bottom, PAD.top])
  const xy = points.map((p, i) => ({ x: x(i), y: y(p.close) }))
  const baseline = HEIGHT - PAD.bottom

  return {
    line: smoothPath(xy),
    area: areaPath(xy, baseline),
    grid: [0, 1, 2, 3].map(i => PAD.top + ((baseline - PAD.top) * i) / 3),
    stamps: points.flatMap((p, i) =>
      p.omen === 'good' ? [{ key: p.date, x: xy[i].x, y: xy[i].y, tilt: i % 2 ? 6 : -7 }] : []
    ),
    last: xy[xy.length - 1] ?? null,
    labels: evenIndices(points.length, AXIS_LABELS).map(i => ({
      key: points[i].date,
      x: xy[i].x,
      text: points[i].date.slice(5).replace('-', '/'),
      anchor: i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle',
    })),
  }
})
</script>

<template>
  <div
    ref="container"
    class="w-full"
  >
    <svg
      :viewBox="`0 0 ${width} ${HEIGHT}`"
      :height="HEIGHT"
      class="block w-full overflow-visible"
      role="img"
      :aria-label="`0050 近 ${points.length} 個交易日走勢，${geometry.stamps.length} 個吉日以紅印標示`"
    >
      <line
        v-for="gy in geometry.grid"
        :key="gy"
        x1="0"
        :x2="width"
        :y1="gy"
        :y2="gy"
        class="stroke-line"
        stroke-dasharray="2 4"
      />
      <path
        :d="geometry.area"
        class="fill-ink"
        fill-opacity="0.04"
      />
      <path
        :d="geometry.line"
        class="fill-none stroke-ink"
        stroke-width="2"
        stroke-linecap="round"
      />
      <g
        v-for="stamp in geometry.stamps"
        :key="stamp.key"
      >
        <line
          :x1="stamp.x"
          :x2="stamp.x"
          :y1="stamp.y - STAMP_LIFT + STAMP_SIZE / 2"
          :y2="stamp.y - 2"
          class="stroke-seal"
        />
        <g :transform="`translate(${stamp.x} ${stamp.y - STAMP_LIFT}) rotate(${stamp.tilt})`">
          <rect
            :x="-STAMP_SIZE / 2"
            :y="-STAMP_SIZE / 2"
            :width="STAMP_SIZE"
            :height="STAMP_SIZE"
            rx="3"
            class="fill-seal"
          />
          <text
            y="4.5"
            text-anchor="middle"
            class="fill-seal-on font-kai text-[12px] font-bold"
          >
            吉
          </text>
        </g>
      </g>
      <g v-if="geometry.last">
        <circle
          :cx="geometry.last.x"
          :cy="geometry.last.y"
          r="9"
          class="fill-none stroke-ink"
          stroke-opacity="0.25"
        />
        <circle
          :cx="geometry.last.x"
          :cy="geometry.last.y"
          r="5"
          class="fill-ink"
        />
      </g>
      <text
        v-for="label in geometry.labels"
        :key="label.key"
        :x="label.x"
        :y="HEIGHT - 4"
        :text-anchor="label.anchor"
        class="fill-ink-3 font-mono text-[11px]"
      >
        {{ label.text }}
      </text>
    </svg>
  </div>
</template>
