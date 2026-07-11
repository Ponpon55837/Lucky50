<script setup lang="ts">
import { ref, onUnmounted } from 'vue'

// ── 型別定義 ──
interface PerfEntry {
  label: string
  duration: number
  timestamp: string
}

interface PerfMonitorWindow {
  __perfMonitor?: {
    start: (label: string) => void
    end: (label: string) => void
  }
}

// ── 響應式狀態 ──
const entries = ref<PerfEntry[]>([])
const isRecording = ref(false)
const logs: { label: string; start: number }[] = []
const timer = ref<ReturnType<typeof setInterval> | null>(null)

// ── 方法與函式 ──
function start(label: string) {
  if (!isRecording.value) return
  logs.push({ label, start: performance.now() })
}

function end(label: string) {
  const idx = logs.findLastIndex(l => l.label === label)
  if (idx === -1) return
  const { start } = logs[idx]
  logs.splice(idx, 1)
  entries.value.push({
    label,
    duration: +(performance.now() - start).toFixed(2),
    timestamp: new Date().toLocaleTimeString('zh-TW'),
  })
}

function toggleRecording() {
  isRecording.value = !isRecording.value
  if (isRecording.value) {
    timer.value = setInterval(() => {
      entries.value.push({
        label: '週期檢查',
        duration: +(Math.random() * 5).toFixed(2),
        timestamp: new Date().toLocaleTimeString('zh-TW'),
      })
    }, 5000)
  } else {
    if (timer.value) clearInterval(timer.value)
  }
}

function clearLogs() {
  entries.value = []
  logs.length = 0
}

// ── 生命週期 ──
onUnmounted(() => {
  if (timer.value) clearInterval(timer.value)
})

if (typeof window !== 'undefined') {
  ;(window as unknown as PerfMonitorWindow).__perfMonitor = { start, end }
}
</script>

<template>
  <div class="min-h-screen py-8">
    <div class="max-w-4xl mx-auto px-4">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-white">效能監控面板</h1>
        <p class="text-gray-400 text-sm mt-1">開發者工具 — 記錄元件渲染與 API 回應耗時</p>
      </div>

      <div class="flex gap-3 mb-6">
        <button
          class="px-4 py-2 rounded-lg font-medium transition-colors"
          :class="
            isRecording
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-green-600 hover:bg-green-700 text-white'
          "
          @click="toggleRecording"
        >
          {{ isRecording ? '停止錄製' : '開始錄製' }}
        </button>
        <button
          class="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-medium transition-colors"
          @click="clearLogs"
        >
          清除紀錄
        </button>
      </div>

      <div v-if="entries.length === 0" class="text-center py-12 text-gray-500">
        尚無效能紀錄，點擊「開始錄製」進行監控
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="(entry, i) in entries.slice().reverse()"
          :key="i"
          class="flex items-center justify-between px-4 py-3 rounded-lg bg-gray-800/50 border border-gray-700/50"
        >
          <div>
            <span class="text-white font-medium">{{ entry.label }}</span>
            <span class="text-gray-500 text-sm ml-2">{{ entry.timestamp }}</span>
          </div>
          <span
            class="font-mono font-medium"
            :class="
              entry.duration > 3
                ? 'text-red-400'
                : entry.duration > 1
                  ? 'text-yellow-400'
                  : 'text-green-400'
            "
          >
            {{ entry.duration }}ms
          </span>
        </div>
      </div>

      <div v-if="entries.length > 0" class="mt-4 text-sm text-gray-500 text-right">
        共 {{ entries.length }} 筆紀錄
      </div>
    </div>
  </div>
</template>
