<script setup lang="ts">
import { computed, ref } from 'vue'

export interface SceneTooltipLine {
  label: string
  value: string
  /** 數值色調 class，例如 text-rise */
  tone?: string
}

export interface SceneTooltip {
  /** 相對於畫布左上角的指標位置（px） */
  x: number
  y: number
  title: string
  lines: SceneTooltipLine[]
}

const {
  title,
  subtitle = '',
  hint = '拖曳可旋轉，移到物件上查看數值',
  unsupported = false,
  empty = '',
  tooltip = null,
} = defineProps<{
  title: string
  subtitle?: string
  hint?: string
  /** WebGL 不可用：改顯示 fallback 插槽的文字摘要 */
  unsupported?: boolean
  /** 沒有資料時在畫布上顯示的說明 */
  empty?: string
  tooltip?: SceneTooltip | null
}>()

const stageArea = ref<HTMLElement>()

// 指標在右半邊時提示框改放左側、在下半邊時往上，避免超出卡片
const tooltipStyle = computed(() => {
  if (!tooltip) return {}
  const width = stageArea.value?.clientWidth ?? 0
  const height = stageArea.value?.clientHeight ?? 0
  const shiftX = tooltip.x > width / 2 ? 'calc(-100% - 12px)' : '12px'
  const shiftY = tooltip.y > height / 2 ? 'calc(-100% - 8px)' : '8px'
  return {
    transform: `translate(${tooltip.x}px, ${tooltip.y}px) translate(${shiftX}, ${shiftY})`,
  }
})
</script>

<template>
  <section class="card h-full gap-3 !p-4 sm:!p-5">
    <header class="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
      <div class="min-w-0">
        <h3 class="card-title">
          {{ title }}
        </h3>
        <p
          v-if="subtitle"
          class="card-meta mt-0.5"
        >
          {{ subtitle }}
        </p>
      </div>
      <dl class="flex flex-wrap gap-x-5 gap-y-1 text-[13px]">
        <slot name="stats" />
      </dl>
    </header>

    <div
      ref="stageArea"
      class="relative min-h-0 flex-1 overflow-hidden rounded-[10px]"
    >
      <div
        v-if="unsupported"
        class="flex h-full flex-col justify-center gap-3 rounded-[10px] border border-dashed border-line-strong p-4 text-sm text-ink-2"
        role="note"
      >
        <p class="text-[13px] text-ink-3">
          此瀏覽器無法顯示 3D 圖，以下為文字摘要。
        </p>
        <slot name="fallback" />
      </div>
      <template v-else>
        <slot />
        <p
          v-if="empty"
          class="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-ink-3"
        >
          {{ empty }}
        </p>
        <div
          v-if="tooltip"
          class="pointer-events-none absolute left-0 top-0 z-10 min-w-[9rem] rounded-[10px] border border-line bg-surface/95 px-3 py-2 shadow-card backdrop-blur-sm"
          :style="tooltipStyle"
          role="status"
        >
          <p class="mb-1 font-serif text-sm font-bold text-ink">
            {{ tooltip.title }}
          </p>
          <dl class="space-y-0.5 text-xs">
            <div
              v-for="line in tooltip.lines"
              :key="line.label"
              class="flex justify-between gap-4"
            >
              <dt class="text-ink-3">
                {{ line.label }}
              </dt>
              <dd :class="['font-mono', line.tone ?? 'text-ink']">
                {{ line.value }}
              </dd>
            </div>
          </dl>
        </div>
      </template>
    </div>

    <footer class="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-2">
      <slot name="legend" />
      <span
        v-if="!unsupported && hint"
        class="ml-auto hidden text-ink-3 sm:inline"
      >{{ hint }}</span>
    </footer>
  </section>
</template>
