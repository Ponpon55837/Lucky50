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
  <div class="flex flex-col gap-6">
    <header>
      <h1 class="font-serif text-[28px] font-bold leading-tight text-ink">
        效能監控面板
      </h1>
      <p class="mt-1.5 text-sm text-ink-2">
        開發者工具 — 記錄元件渲染與 API 回應耗時
      </p>
    </header>

    <div class="flex gap-3">
      <button
        class="btn-sm"
        :class="isRecording ? 'btn-secondary' : 'btn-primary'"
        :aria-pressed="isRecording"
        @click="toggleRecording"
      >
        <span
          v-if="isRecording"
          class="dot animate-pulse bg-danger"
          aria-hidden="true"
        />
        {{ isRecording ? '停止錄製' : '開始錄製' }}
      </button>
      <button
        class="btn-secondary btn-sm"
        @click="clearLogs"
      >
        清除紀錄
      </button>
    </div>

    <div
      v-if="entries.length === 0"
      class="py-12 text-center text-ink-3"
    >
      尚無效能紀錄，點擊「開始錄製」進行監控
    </div>

    <ul
      v-else
      class="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface"
    >
      <li
        v-for="(entry, i) in entries.slice().reverse()"
        :key="i"
        class="flex items-center justify-between gap-3 px-4 py-3"
      >
        <div>
          <span class="font-medium text-ink">{{ entry.label }}</span>
          <span class="ml-2 text-sm text-ink-3">{{ entry.timestamp }}</span>
        </div>
        <span
          class="font-mono font-medium"
          :class="
            entry.duration > 3 ? 'text-danger' : entry.duration > 1 ? 'text-warn' : 'text-ink-2'
          "
        >
          {{ entry.duration }}ms
        </span>
      </li>
    </ul>

    <div
      v-if="entries.length > 0"
      class="text-right text-sm text-ink-3"
    >
      共 {{ entries.length }} 筆紀錄
    </div>
  </div>
</template>
