<script setup lang="ts">
import { computed } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  type TooltipItem,
} from 'chart.js'
import { Bar } from 'vue-chartjs'
import type { MetaphysicsResult } from '@/services/engines/types'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

interface Props {
  results: MetaphysicsResult[]
  weights?: Record<string, number>
  isDark?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  weights: () => ({}),
  isDark: true,
})

// Chart.js 需要實際色值：渲染時從 CSS tokens（"r g b"）讀取，深淺主題自動跟著切換
const FALLBACK_TOKENS: Record<string, string> = {
  ink: '27 26 24',
  'ink-2': '85 82 76',
  'ink-3': '111 107 100',
  surface: '255 255 255',
  seal: '192 40 45',
}
const token = (name: string, alpha = 1): string => {
  const raw =
    typeof document === 'undefined'
      ? ''
      : getComputedStyle(document.documentElement).getPropertyValue(`--c-${name}`).trim()
  return `rgb(${raw || FALLBACK_TOKENS[name] || '128 128 128'} / ${alpha})`
}

const chartData = computed(() => {
  if (!props.results.length) return null

  void props.isDark
  const labels = props.results.map(r => r.engineName)
  const scores = props.results.map(r => r.score)

  // 所有引擎同為墨色，只有最高分的引擎以朱紅標示
  const top = Math.max(...scores)
  const bgColors = scores.map(score => (score === top ? token('seal', 0.85) : token('ink', 0.18)))

  return {
    labels,
    datasets: [
      {
        label: '引擎分數',
        data: scores,
        backgroundColor: bgColors,
        borderWidth: 0,
        borderRadius: 6,
        barThickness: 24,
      },
    ],
  }
})

const chartOptions = computed(() => {
  void props.isDark
  const textColor = token('ink-3')

  return {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: token('surface', 0.96),
        titleColor: token('ink-3'),
        bodyColor: token('ink'),
        borderColor: token('ink', 0.18),
        borderWidth: 1,
        cornerRadius: 10,
        displayColors: false,
        padding: 12,
        callbacks: {
          label: (ctx: TooltipItem<'bar'>) => {
            const result = props.results[ctx.dataIndex]
            const weight = props.weights[result.engineId] ?? 0
            return `分數: ${ctx.parsed.x}  權重: ${weight}%`
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        max: 100,
        ticks: { color: textColor, stepSize: 20 },
        grid: {
          color: token('ink', 0.08),
        },
        border: { display: false },
      },
      y: {
        ticks: {
          color: token('ink-2'),
          font: { size: 13 },
        },
        grid: { display: false },
        border: { display: false },
      },
    },
  } as const
})
</script>

<template>
  <div class="h-64 w-full">
    <Bar
      v-if="chartData"
      :data="chartData"
      :options="chartOptions"
      class="w-full h-full"
    />
    <div
      v-else
      class="flex h-full items-center justify-center rounded-[10px] bg-raised"
    >
      <p class="text-ink-3">
        無引擎數據
      </p>
    </div>
  </div>
</template>
