<script setup lang="ts">
import { computed } from 'vue'
import { polar } from '@/utils/chart'
import {
  ELEMENT_CYCLE,
  ELEMENT_LABEL,
  STRENGTH_RANK,
  type ElementKey,
  type ElementReading,
  type Strength,
} from '@/utils/almanac'

const props = defineProps<{
  strengths: Readonly<Record<ElementKey, Strength>>
  ownElement: ElementKey | null
  reading: ElementReading
}>()

// 五個節點平均分佈在圓上，從本命五行（或火）開始於正上方
const RADIUS = 92
const STEP = 72
const ARROW_INSET = 22

const order = computed(() => {
  const start = ELEMENT_CYCLE.indexOf(props.ownElement ?? 'fire')
  return ELEMENT_CYCLE.map((_, i) => ELEMENT_CYCLE[(start + i) % 5])
})

const nodes = computed(() =>
  order.value.map((key, i) => {
    const strength = props.strengths[key]
    const position = polar(RADIUS, -90 + i * STEP)
    // 越旺的節點越大：半徑 16–34
    const size = 16 + STRENGTH_RANK[strength] * 4.5
    return {
      key,
      label: ELEMENT_LABEL[key],
      strength,
      position,
      size,
      isOwn: key === props.ownElement,
      isSeason: strength === '旺',
      captionY: position.y > 0 ? position.y + size + 16 : position.y - size - 8,
    }
  })
)

/** 相生：外圈弧線箭頭 */
const generateArcs = computed(() =>
  order.value.map((_, i) => {
    const start = polar(RADIUS, -90 + i * STEP + ARROW_INSET)
    const end = polar(RADIUS, -90 + (i + 1) * STEP - ARROW_INSET)
    return `M${start.x} ${start.y} A${RADIUS} ${RADIUS} 0 0 1 ${end.x} ${end.y}`
  })
)

/** 相剋：星形虛線（隔一位相剋） */
const controlLines = computed(() =>
  nodes.value.map((node, i) => ({ from: node.position, to: nodes.value[(i + 2) % 5].position }))
)
</script>

<template>
  <div
    class="grid items-center gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
  >
    <svg
      viewBox="-140 -140 280 280"
      class="aspect-square w-full max-w-[260px] justify-self-center overflow-visible"
      role="img"
      :aria-label="`五行相生圖：${nodes.map(n => n.label + n.strength).join('、')}`"
    >
      <defs>
        <marker
          id="cycle-arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path
            d="M0 0 L10 5 L0 10z"
            class="fill-ink-3"
          />
        </marker>
      </defs>
      <line
        v-for="(line, i) in controlLines"
        :key="`control-${i}`"
        :x1="line.from.x"
        :y1="line.from.y"
        :x2="line.to.x"
        :y2="line.to.y"
        class="stroke-line-strong"
        stroke-dasharray="3 5"
      />
      <path
        v-for="(arc, i) in generateArcs"
        :key="`generate-${i}`"
        :d="arc"
        class="fill-none stroke-ink-3"
        stroke-width="1.5"
        marker-end="url(#cycle-arrow)"
      />
      <g
        v-for="node in nodes"
        :key="node.key"
      >
        <circle
          :cx="node.position.x"
          :cy="node.position.y"
          :r="node.size"
          :class="
            node.isSeason ? 'fill-ink' : node.isOwn ? 'fill-seal' : 'fill-raised stroke-line-strong'
          "
        />
        <text
          :x="node.position.x"
          :y="node.position.y + 7"
          text-anchor="middle"
          class="font-kai font-bold"
          :class="[
            node.size > 28 ? 'text-[22px]' : 'text-[18px]',
            node.isSeason ? 'fill-surface' : node.isOwn ? 'fill-seal-on' : 'fill-ink',
          ]"
        >
          {{ node.label }}
        </text>
        <text
          :x="node.position.x"
          :y="node.captionY"
          text-anchor="middle"
          class="text-[14px]"
          :class="node.isOwn ? 'fill-seal-ink' : 'fill-ink-2'"
        >
          {{ node.strength }}{{ node.isOwn ? ' · 本命' : '' }}
        </text>
      </g>
    </svg>

    <div class="flex flex-col gap-2.5">
      <p class="font-kai text-[22px] font-bold leading-snug">
        {{ reading.headline }}
      </p>
      <p
        v-for="line in reading.details"
        :key="line"
        class="text-ink-2"
      >
        {{ line }}
      </p>
    </div>
  </div>
</template>
