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

const ENGINE_ICONS: Record<string, string> = {
  classic: '🏮',
  'bazi-ten-gods': '🔮',
  'zi-wei': '⭐',
  'feng-shui': '🧭',
}

const ENGINE_COLORS: Record<string, string> = {
  classic: '#f59e0b',
  'bazi-ten-gods': '#8b5cf6',
  'zi-wei': '#3b82f6',
  'feng-shui': '#10b981',
}

const chartData = computed(() => {
  if (!props.results.length) return null

  const labels = props.results.map(r => {
    const icon = ENGINE_ICONS[r.engineId || ''] || '⚙️'
    return `${icon} ${r.engineName}`
  })

  const scores = props.results.map(r => r.score)

  const bgColors = props.results.map(r => {
    const color = ENGINE_COLORS[r.engineId || ''] || '#6b7280'
    return color + '33'
  })

  const borderColors = props.results.map(r => {
    return ENGINE_COLORS[r.engineId || ''] || '#6b7280'
  })

  return {
    labels,
    datasets: [
      {
        label: '引擎分數',
        data: scores,
        backgroundColor: bgColors,
        borderColor: borderColors,
        borderWidth: 2,
        borderRadius: 6,
        barThickness: 32,
      },
    ],
  }
})

const chartOptions = computed(() => {
  const textColor = props.isDark ? '#e5e7eb' : '#374151'

  return {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: props.isDark ? 'rgba(17, 24, 39, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        titleColor: textColor,
        bodyColor: textColor,
        borderColor: props.isDark ? '#fbbf24' : '#3b82f6',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        callbacks: {
          label: (ctx: TooltipItem<'bar'>) => {
            const result = props.results[ctx.dataIndex]
            const weight = props.weights[result.engineId || ''] || 0
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
          color: props.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        },
      },
      y: {
        ticks: {
          color: textColor,
          font: { size: 13, weight: 'bold' as const },
        },
        grid: { display: false },
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
      class="h-full bg-white/5 rounded-lg flex items-center justify-center"
    >
      <p class="text-gray-400">
        無引擎數據
      </p>
    </div>
  </div>
</template>
