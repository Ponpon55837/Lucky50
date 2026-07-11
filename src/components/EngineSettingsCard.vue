<template>
  <div class="card">
    <h3 class="text-lg font-bold mb-4 flex items-center">
      <span class="text-gold-400 mr-2">⚙️</span>
      <span class="text-white">命理引擎設定</span>
    </h3>

    <p class="text-sm text-gray-400 mb-4">
      調整各命理引擎的啟用狀態與權重，影響運勢計算結果
    </p>

    <div class="space-y-4">
      <div
        v-for="engine in engines"
        :key="engine.id"
        class="p-4 bg-white/5 rounded-lg"
      >
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <span class="text-lg">{{ engine.icon }}</span>
            <div>
              <div class="font-bold text-sm text-white">
                {{ engine.name }}
              </div>
              <div class="text-xs text-gray-500">
                {{ engine.description }}
              </div>
            </div>
          </div>
          <button
            :class="[
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              engine.enabled ? 'bg-amber-500' : 'bg-white/20',
            ]"
            @click="toggleEngine(engine.id)"
          >
            <span
              :class="[
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                engine.enabled ? 'translate-x-6' : 'translate-x-1',
              ]"
            />
          </button>
        </div>

        <div
          v-if="engine.enabled"
          class="mt-3"
        >
          <div class="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>權重</span>
            <span class="text-amber-400">{{ engine.weight }}%</span>
          </div>
          <input
            type="range"
            :value="engine.weight"
            min="0"
            max="100"
            step="5"
            class="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500"
            @input="e => updateWeight(engine.id, Number((e.target as HTMLInputElement).value))"
          >
          <div class="flex justify-between text-xs text-gray-500 mt-1">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 重設按鈕 -->
    <div class="mt-6 flex gap-3">
      <button
        class="px-4 py-2 text-sm text-gray-300 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
        @click="resetToDefaults"
      >
        恢復預設
      </button>
      <button
        class="px-4 py-2 text-sm text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition-colors"
        @click="saveSettings"
      >
        儲存設定
      </button>
    </div>

    <div
      v-if="saved"
      class="mt-2 text-sm text-green-400"
    >
      設定已儲存
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { IntegratedFortuneService } from '@/services/integratedFortune'

interface EngineConfig {
  id: string
  name: string
  description: string
  icon: string
  enabled: boolean
  weight: number
  defaultWeight: number
}

const STORAGE_KEY = 'lucky50-engine-settings'

const engines = ref<EngineConfig[]>([
  {
    id: 'classic',
    name: '經典命理',
    description: '傳統五行、生肖、星座綜合運勢',
    icon: '🏮',
    enabled: true,
    weight: 30,
    defaultWeight: 30,
  },
  {
    id: 'bazi-ten-gods',
    name: '八字十神',
    description: '基於四柱的十神投資性格分析',
    icon: '🔮',
    enabled: true,
    weight: 25,
    defaultWeight: 25,
  },
  {
    id: 'zi-wei',
    name: '紫微斗數',
    description: '十四主星的簡化投資分析',
    icon: '⭐',
    enabled: true,
    weight: 20,
    defaultWeight: 20,
  },
  {
    id: 'feng-shui',
    name: '風水方位',
    description: '五行方位與流日吉凶分析',
    icon: '🧭',
    enabled: true,
    weight: 15,
    defaultWeight: 15,
  },
])

const saved = ref(false)

function loadSettings() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))

  // 清除運勢快取，下次載入時會使用新設定重新計算
  IntegratedFortuneService.clearCache()

  // 通知其他元件設定已變更
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
