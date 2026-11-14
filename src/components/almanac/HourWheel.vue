<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { annularSector, polar } from '@/utils/chart'
import {
  MARKET_CLOSE_MINUTES,
  MARKET_OPEN_MINUTES,
  OMEN_LABEL,
  primaryMarketSlotIndex,
  type HourSlot,
} from '@/utils/almanac'

const props = defineProps<{
  slots: readonly HourSlot[]
}>()

// 幾何設定：子時在正上方（-90°），每個時辰 30°
const SLICE = 30
const GAP = 1.2
const INNER = 78
const INNER_MARKET = 70
const OUTER = 132
const OUTER_ACTIVE = 140
const LABEL_RADIUS = 108
const MARKET_RADIUS = 62

const selected = ref(primaryMarketSlotIndex(props.slots))

// 只有吉凶內容真的變了才重設選取，避免同內容的新陣列把使用者的選擇洗掉
watch(
  () => props.slots.map(slot => slot.omen).join(),
  () => (selected.value = primaryMarketSlotIndex(props.slots))
)

const angleOf = (index: number) => -90 + index * SLICE

// 時鐘角度：00:00 在正上方，每小時 15°
const clockAngle = (minutes: number) => -90 + (minutes / 60) * 15

const sectors = computed(() =>
  props.slots.map((slot, index) => {
    const active = index === selected.value
    const center = angleOf(index)
    return {
      slot,
      index,
      active,
      path: annularSector(
        slot.inMarket ? INNER_MARKET : INNER,
        active ? OUTER_ACTIVE : OUTER,
        center - SLICE / 2 + GAP,
        center + SLICE / 2 - GAP
      ),
      label: polar(LABEL_RADIUS, center),
    }
  })
)

const marketArc = computed(() => {
  const start = polar(MARKET_RADIUS, clockAngle(MARKET_OPEN_MINUTES))
  const end = polar(MARKET_RADIUS, clockAngle(MARKET_CLOSE_MINUTES))
  return `M${start.x} ${start.y} A${MARKET_RADIUS} ${MARKET_RADIUS} 0 0 1 ${end.x} ${end.y}`
})

const current = computed(() => props.slots[selected.value])

const sectorEls = ref<SVGGElement[]>([])

const select = (index: number) => {
  selected.value = index
}

/** radiogroup 鍵盤操作：方向鍵移動、Home/End 跳到頭尾，焦點跟著選取移動（roving tabindex） */
const onKeydown = (event: KeyboardEvent) => {
  const count = props.slots.length
  const targets: Record<string, number> = {
    ArrowRight: selected.value + 1,
    ArrowDown: selected.value + 1,
    ArrowLeft: selected.value - 1,
    ArrowUp: selected.value - 1,
    Home: 0,
    End: count - 1,
  }
  const target = targets[event.key]
  if (target === undefined) return
  event.preventDefault()
  selected.value = (target + count) % count
  nextTick(() => sectorEls.value[selected.value]?.focus())
}
</script>

<template>
  <div class="flex flex-col items-center gap-3">
    <svg
      viewBox="-150 -150 300 300"
      class="aspect-square w-full max-w-[300px] overflow-visible"
      role="radiogroup"
      aria-label="十二時辰吉凶"
      @keydown="onKeydown"
    >
      <g
        v-for="sector in sectors"
        :key="sector.slot.branch"
        ref="sectorEls"
        role="radio"
        :tabindex="sector.active ? 0 : -1"
        :aria-checked="sector.active"
        :aria-label="`${sector.slot.branch}時 ${sector.slot.range} ${OMEN_LABEL[sector.slot.omen]}`"
        class="cursor-pointer outline-none [&:focus-visible>path]:stroke-ink [&:focus-visible>path]:stroke-2"
        @click="select(sector.index)"
      >
        <path
          :d="sector.path"
          class="transition-opacity duration-150 hover:opacity-85"
          :class="[
            `omen-${sector.slot.omen}`,
            { 'opacity-55': !sector.slot.inMarket && !sector.active },
          ]"
        />
        <text
          :x="sector.label.x"
          :y="sector.label.y + 7"
          text-anchor="middle"
          class="pointer-events-none font-kai text-[20px] font-bold"
          :class="`label-${sector.slot.omen}`"
        >
          {{ sector.slot.branch }}
        </text>
      </g>
      <path
        :d="marketArc"
        class="fill-none stroke-gold"
        stroke-width="5"
        stroke-linecap="round"
      />
      <circle
        r="54"
        class="fill-none stroke-line-strong"
      />
      <text
        y="-6"
        text-anchor="middle"
        class="font-kai text-[40px] font-bold"
        :class="current?.omen === 'good' ? 'fill-seal-ink' : 'fill-ink'"
      >
        {{ current ? OMEN_LABEL[current.omen] : '' }}
      </text>
      <text
        y="22"
        text-anchor="middle"
        class="fill-ink-2 font-mono text-[12px]"
      >
        {{ current?.range }}
      </text>
    </svg>

    <p
      v-if="current"
      class="min-h-12 text-center"
      aria-live="polite"
    >
      <b class="block font-serif text-base">
        {{ current.branch }}時 {{ current.range }} · {{ current.advice }}
      </b>
      <span class="text-[13px] text-ink-2">{{ current.reason }}</span>
    </p>

    <ul class="flex flex-wrap justify-center gap-4 text-xs text-ink-2">
      <li class="inline-flex items-center gap-1.5">
        <i class="h-2.5 w-2.5 rounded-[3px] bg-seal" />吉
      </li>
      <li class="inline-flex items-center gap-1.5">
        <i class="h-2.5 w-2.5 rounded-[3px] border border-line-strong bg-raised" />平
      </li>
      <li class="inline-flex items-center gap-1.5">
        <i class="h-2.5 w-2.5 rounded-[3px] bg-ink-2" />凶
      </li>
      <li class="inline-flex items-center gap-1.5">
        <i class="h-2.5 w-2.5 rounded-[3px] border-2 border-gold" />開盤時段
      </li>
    </ul>
  </div>
</template>

<style scoped>
.omen-good {
  @apply fill-seal;
}
.omen-neutral {
  @apply fill-raised;
}
.omen-bad {
  @apply fill-ink-2;
}
.label-good {
  @apply fill-seal-on;
}
.label-neutral {
  @apply fill-ink;
}
.label-bad {
  @apply fill-surface;
}
</style>
