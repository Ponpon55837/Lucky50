<script setup lang="ts">
import { ref } from 'vue'

// ── 型別定義 ──
interface ApiCall {
  endpoint: string
  method: string
  status: number
  duration: number
  timestamp: string
}

interface ApiMonitorWindow {
  __apiMonitor?: {
    record: (url: string, method: string, status: number, duration: number) => void
  }
}

// ── 響應式狀態 ──
const calls = ref<ApiCall[]>([])

// ── 方法與函式 ──
const apiRecord = {
  record(ep: string, method: string, status: number, duration: number) {
    calls.value.push({
      endpoint: ep,
      method,
      status,
      duration: +duration.toFixed(2),
      timestamp: new Date().toLocaleTimeString('zh-TW'),
    })
  },
}

if (typeof window !== 'undefined') {
  ;(window as unknown as ApiMonitorWindow).__apiMonitor = apiRecord
}

function clearCalls() {
  calls.value = []
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <header>
      <h1 class="font-serif text-[28px] font-bold leading-tight text-ink">
        API 監控
      </h1>
      <p class="mt-1.5 text-sm text-ink-2">
        開發者工具 — 監控所有 API 請求狀態與耗時
      </p>
      <p class="mt-1 text-xs text-ink-3">
        在應用程式中呼叫
        <code class="rounded bg-raised px-1 font-mono text-ink-2">window.__apiMonitor.record(endpoint, method, status, duration)</code>
        即可記錄
      </p>
    </header>

    <div class="flex gap-3">
      <button
        class="btn-secondary btn-sm"
        @click="clearCalls"
      >
        清除紀錄
      </button>
    </div>

    <div
      v-if="calls.length === 0"
      class="py-12 text-center text-ink-3"
    >
      尚無 API 呼叫紀錄
    </div>

    <ul
      v-else
      class="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface"
    >
      <li
        v-for="(call, i) in calls.slice().reverse()"
        :key="i"
        class="flex items-center justify-between gap-3 px-4 py-3"
      >
        <div class="flex min-w-0 flex-1 items-center gap-3">
          <span
            class="rounded px-2 py-0.5 font-mono text-xs font-medium"
            :class="{
              'bg-good/10 text-good': call.status >= 200 && call.status < 300,
              'bg-warn/10 text-warn': call.status >= 300 && call.status < 500,
              'bg-danger/10 text-danger': call.status >= 500,
            }"
          >
            {{ call.status }}
          </span>
          <span class="font-mono text-xs uppercase text-ink-3">{{ call.method }}</span>
          <span class="truncate font-mono text-sm text-ink">{{ call.endpoint }}</span>
        </div>
        <div class="flex flex-shrink-0 items-center gap-3">
          <span class="text-xs text-ink-3">{{ call.timestamp }}</span>
          <span
            class="font-mono text-sm font-medium"
            :class="
              call.duration > 2000
                ? 'text-danger'
                : call.duration > 800
                  ? 'text-warn'
                  : 'text-ink-2'
            "
          >
            {{ call.duration }}ms
          </span>
        </div>
      </li>
    </ul>

    <div
      v-if="calls.length > 0"
      class="flex flex-wrap justify-between gap-2 text-sm text-ink-3"
    >
      <span>總請求數: {{ calls.length }}</span>
      <span>
        平均耗時:
        {{ (calls.reduce((s, c) => s + c.duration, 0) / calls.length).toFixed(0) }}ms
      </span>
      <span>
        成功率:
        {{ ((calls.filter(c => c.status < 400).length / calls.length) * 100).toFixed(1) }}%
      </span>
    </div>
  </div>
</template>
