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
  <div class="min-h-screen py-8">
    <div class="max-w-4xl mx-auto px-4">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-white">
          API 監控
        </h1>
        <p class="text-gray-400 text-sm mt-1">
          開發者工具 — 監控所有 API 請求狀態與耗時
        </p>
        <p class="text-gray-500 text-xs mt-1">
          在應用程式中呼叫
          <code class="text-gold-400 bg-gray-800 px-1 rounded">window.__apiMonitor.record(endpoint, method, status, duration)</code>
          即可記錄
        </p>
      </div>

      <div class="flex gap-3 mb-6">
        <button
          class="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-medium transition-colors"
          @click="clearCalls"
        >
          清除紀錄
        </button>
      </div>

      <div
        v-if="calls.length === 0"
        class="text-center py-12 text-gray-500"
      >
        尚無 API 呼叫紀錄
      </div>

      <div
        v-else
        class="space-y-2"
      >
        <div
          v-for="(call, i) in calls.slice().reverse()"
          :key="i"
          class="flex items-center justify-between px-4 py-3 rounded-lg bg-gray-800/50 border border-gray-700/50"
        >
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <span
              class="text-xs font-mono font-bold px-2 py-0.5 rounded"
              :class="{
                'bg-green-600/30 text-green-400': call.status >= 200 && call.status < 300,
                'bg-yellow-600/30 text-yellow-400': call.status >= 300 && call.status < 500,
                'bg-red-600/30 text-red-400': call.status >= 500,
              }"
            >
              {{ call.status }}
            </span>
            <span class="text-xs font-mono text-gray-500 uppercase">{{ call.method }}</span>
            <span class="text-white font-mono text-sm truncate">{{ call.endpoint }}</span>
          </div>
          <div class="flex items-center gap-3 flex-shrink-0 ml-3">
            <span class="text-gray-500 text-xs">{{ call.timestamp }}</span>
            <span
              class="font-mono font-medium text-sm"
              :class="
                call.duration > 2000
                  ? 'text-red-400'
                  : call.duration > 800
                    ? 'text-yellow-400'
                    : 'text-green-400'
              "
            >
              {{ call.duration }}ms
            </span>
          </div>
        </div>
      </div>

      <div
        v-if="calls.length > 0"
        class="mt-4 flex justify-between text-sm text-gray-500"
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
  </div>
</template>
