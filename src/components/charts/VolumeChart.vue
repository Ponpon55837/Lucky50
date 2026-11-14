<script setup lang="ts">
import { computed } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type TooltipItem,
} from 'chart.js'
import { Bar } from 'vue-chartjs'
import type { ETFData } from '@/types'

// 註冊 Chart.js 組件
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface Props {
  etfData: ETFData[]
  isDark?: boolean
}

const props = withDefaults(defineProps<Props>(), {
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

// 計算圖表數據
const chartData = computed(() => {
  if (!props.etfData || props.etfData.length === 0) {
    return null
  }

  // 使用所有傳入的數據，不再限制為20天
  const sortedData = [...props.etfData].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  const labels = sortedData.map(item => {
    const date = new Date(item.date)
    return `${date.getMonth() + 1}/${date.getDate()}`
  })

  const volumes = sortedData.map(item => {
    const volume = item.volume / 1000000 // 轉換為百萬
    return isNaN(volume) ? 0 : volume
  })

  // 成交量為中性資訊：墨色長條，最新一日以朱紅標示
  void props.isDark
  const bars = volumes.map((_, i) =>
    i === volumes.length - 1 ? token('seal', 0.85) : token('ink', 0.22)
  )

  return {
    labels,
    datasets: [
      {
        label: '成交量 (百萬)',
        data: volumes,
        backgroundColor: bars,
        hoverBackgroundColor: token('ink', 0.45),
        borderWidth: 0,
        borderRadius: 3,
        borderSkipped: false,
      },
    ],
  }
})

// 圖表選項
const chartOptions = computed(() => {
  void props.isDark
  const textColor = token('ink-3')
  const gridColor = token('ink', 0.08)

  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: token('surface', 0.96),
        titleColor: token('ink-3'),
        bodyColor: token('ink'),
        borderColor: token('ink', 0.18),
        borderWidth: 1,
        cornerRadius: 10,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: function (context: TooltipItem<'bar'>) {
            return `成交量: ${(context.parsed.y ?? 0).toFixed(1)}M`
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        border: { color: gridColor },
        ticks: {
          color: textColor,
          font: {
            size: 12,
          },
        },
      },
      y: {
        grid: {
          display: true,
          color: gridColor,
        },
        border: { display: false },
        ticks: {
          color: textColor,
          font: {
            size: 12,
          },
          callback: function (value: string | number) {
            return `${value}M`
          },
        },
      },
    },
  }
})
</script>

<template>
  <div class="h-64 w-full">
    <Bar
      v-if="chartData && chartOptions && props.etfData.length > 0"
      :data="chartData"
      :options="chartOptions"
      class="w-full h-full"
    />
    <div
      v-else
      class="flex h-full items-center justify-center rounded-[10px] bg-raised"
    >
      <div class="text-center">
        <p class="text-ink-3 mb-2">
          {{ props.etfData.length === 0 ? '無成交量數據' : '載入圖表中...' }}
        </p>
        <p class="text-ink-3 text-sm">
          數據筆數: {{ props.etfData.length }}
        </p>
      </div>
    </div>
  </div>
</template>
