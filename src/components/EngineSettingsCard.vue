<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Cog6ToothIcon } from '@heroicons/vue/24/outline'
import { ENGINE_LIST, ENGINE_SETTINGS_STORAGE_KEY } from '@/services/engines/settings'

interface EngineConfig {
  id: string
  name: string
  description: string
  enabled: boolean
  weight: number
  defaultWeight: number
}

const engines = ref<EngineConfig[]>(
  ENGINE_LIST.map(meta => ({
    id: meta.id,
    name: meta.name,
    description: meta.description,
    enabled: true,
    weight: meta.defaultWeight,
    defaultWeight: meta.defaultWeight,
  }))
)

const saved = ref(false)

const totalWeight = computed(() =>
  engines.value.filter(e => e.enabled).reduce((sum, e) => sum + e.weight, 0)
)

const weightStatus = computed(() => {
  const t = totalWeight.value
  if (t === 100)
    return {
      label: '100% — 完美',
      color: 'text-good',
      bar: 'bg-good',
      ring: 'ring-good/30',
    }
  if (t >= 80 && t <= 120)
    return {
      label: `${t}% — 接近`,
      color: 'text-warn',
      bar: 'bg-warn',
      ring: 'ring-warn/30',
    }
  return {
    label: `${t}% — 偏差`,
    color: 'text-danger',
    bar: 'bg-danger',
    ring: 'ring-danger/30',
  }
})

function loadSettings() {
  try {
    const stored = localStorage.getItem(ENGINE_SETTINGS_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as Record<string, { enabled: boolean; weight: number }>
      for (const engine of engines.value) {
        if (parsed[engine.id]) {
          engine.enabled = parsed[engine.id].enabled
          engine.weight = parsed[engine.id].weight
        }
      }
    }
  } catch {
    // 使用預設值
  }
}

function saveSettings() {
  const settings: Record<string, { enabled: boolean; weight: number }> = {}
  for (const engine of engines.value) {
    settings[engine.id] = { enabled: engine.enabled, weight: engine.weight }
  }
  localStorage.setItem(ENGINE_SETTINGS_STORAGE_KEY, JSON.stringify(settings))

  // 通知其他元件設定已變更；查詢鍵含設定指紋，運勢會自動重算
  window.dispatchEvent(new CustomEvent('engine-settings-changed'))

  saved.value = true
  setTimeout(() => {
    saved.value = false
  }, 2000)
}

function toggleEngine(id: string) {
  const engine = engines.value.find(e => e.id === id)
  if (engine) {
    engine.enabled = !engine.enabled
  }
}

function updateWeight(id: string, weight: number) {
  const engine = engines.value.find(e => e.id === id)
  if (engine) {
    engine.weight = weight
  }
}

function resetToDefaults() {
  for (const engine of engines.value) {
    engine.enabled = true
    engine.weight = engine.defaultWeight
  }
}

onMounted(loadSettings)
</script>

<template>
  <section class="card">
    <h2 class="card-title flex items-center gap-2">
      <Cog6ToothIcon
        class="h-[18px] w-[18px] text-ink-3"
        aria-hidden="true"
      />
      命理引擎設定
    </h2>

    <p class="text-sm text-ink-2">
      每個引擎的「權重」代表它在綜合運勢中佔的比例。例如經典命理 30%、八字十神
      25%，表示前者影響力略大於後者。
    </p>

    <ul class="divide-y divide-line border-y border-line">
      <li
        v-for="engine in engines"
        :key="engine.id"
        class="py-4"
      >
        <div class="flex items-center justify-between gap-4">
          <div class="min-w-0">
            <div class="text-sm font-medium text-ink">
              {{ engine.name }}
            </div>
            <div class="text-xs text-ink-3">
              {{ engine.description }}
            </div>
          </div>
          <button
            type="button"
            role="switch"
            :aria-checked="engine.enabled"
            :aria-label="`${engine.enabled ? '停用' : '啟用'}${engine.name}`"
            :class="[
              'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-150',
              engine.enabled ? 'bg-seal' : 'bg-line-strong',
            ]"
            @click="toggleEngine(engine.id)"
          >
            <span
              :class="[
                'inline-block h-4 w-4 transform rounded-full bg-surface transition-transform duration-150 ease-out',
                engine.enabled ? 'translate-x-6' : 'translate-x-1',
              ]"
            />
          </button>
        </div>

        <div
          v-if="engine.enabled"
          class="mt-3"
        >
          <div class="mb-1 flex items-center justify-between text-xs text-ink-3">
            <span>權重</span>
            <span class="font-mono text-ink">{{ engine.weight }}%</span>
          </div>
          <input
            type="range"
            :value="engine.weight"
            min="0"
            max="100"
            step="5"
            :aria-label="`${engine.name}權重`"
            class="h-2 w-full cursor-pointer accent-seal"
            @input="e => updateWeight(engine.id, Number((e.target as HTMLInputElement).value))"
          >
          <div class="mt-1 flex justify-between font-mono text-xs text-ink-3">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
      </li>
    </ul>

    <!-- 權重加總指示器 -->
    <div class="rounded-[10px] bg-raised p-4">
      <div class="mb-2 flex items-center justify-between">
        <span class="text-xs text-ink-3">啟用引擎的權重加總</span>
        <span
          class="font-mono text-sm font-medium"
          :class="weightStatus.color"
        >{{
          weightStatus.label
        }}</span>
      </div>
      <div class="h-1.5 w-full overflow-hidden rounded-full bg-line">
        <div
          class="h-full rounded-full transition-[width] duration-300 ease-out"
          :class="weightStatus.bar"
          :style="{ width: `${Math.min(totalWeight, 150) / 1.5}%` }"
        />
      </div>
      <div class="mt-1 flex justify-between font-mono text-[11px] text-ink-3">
        <span>0%</span>
        <span :class="totalWeight === 100 ? 'font-medium text-good' : 'text-ink-3'">100%</span>
        <span>150%</span>
      </div>
      <p class="mt-2 text-xs leading-relaxed text-ink-3">
        <template v-if="totalWeight === 100">
          權重加總恰好為 100%，各引擎按比例貢獻。
        </template>
        <template v-else-if="totalWeight > 0 && totalWeight < 100">
          加總不足 100% 時，系統會自動正規化（按比例放大），不影響排序結果。
        </template>
        <template v-else-if="totalWeight > 100">
          加總超過 100% 時，系統會自動正規化（按比例縮小），不影響排序結果。
        </template>
        <template v-else>
          所有引擎已關閉，運勢將使用基礎分數。
        </template>
      </p>
    </div>

    <!-- 重設按鈕 -->
    <div class="flex flex-wrap items-center gap-3">
      <button
        type="button"
        class="btn-secondary btn-sm"
        @click="resetToDefaults"
      >
        恢復預設
      </button>
      <button
        type="button"
        class="btn-primary btn-sm"
        @click="saveSettings"
      >
        儲存設定
      </button>
      <span
        v-if="saved"
        class="text-sm text-ink-2"
        role="status"
      >設定已儲存</span>
    </div>
  </section>
</template>
