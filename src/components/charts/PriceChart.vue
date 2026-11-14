<script setup lang="ts">
import { computed } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type TooltipItem,
} from 'chart.js'
import { Line } from 'vue-chartjs'
import type { ETFData } from '@/types'

// 註冊 Chart.js 組件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

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
    console.log('PriceChart - No data available')
    return null
  }

  // 使用所有傳入的數據，不再限制為30天
  const sortedData = [...props.etfData].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  if (sortedData.length > 0) {
    console.log(
      'PriceChart - 日期範圍:',
      sortedData[0].date,
      '至',
      sortedData[sortedData.length - 1].date
    )
  }

  const labels = sortedData.map(item => {
    const date = new Date(item.date)
    return `${date.getMonth() + 1}/${date.getDate()}`
  })

  const prices = sortedData.map(item => item.close)

  // isDark 只用來觸發重新計算；實際顏色由 tokens 決定
  void props.isDark
  const line = token('seal')

  const data = {
    labels,
    datasets: [
      {
        label: '0050 收盤價',
        data: prices,
        borderColor: line,
        backgroundColor: token('seal', 0.08),
        borderWidth: 2,
        fill: true,
        tension: 0.35,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointBackgroundColor: line,
        pointBorderColor: token('surface'),
        pointBorderWidth: 2,
      },
    ],
  }

  return data
})

// 圖表選項
const chartOptions = computed(() => {
  void props.isDark
  const textColor = token('ink-3')
  const gridColor = token('ink', 0.08)

  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
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
          label: function (context: TooltipItem<'line'>) {
            return `收盤價: $${(context.parsed.y ?? 0).toFixed(2)}`
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
            return `$${value}`
          },
        },
      },
    },
    elements: {
      point: {
        hoverBackgroundColor: token('seal'),
      },
    },
  }
})
</script>

<template>
  <div class="h-64 w-full">
    <div
      v-if="!chartData"
      class="flex h-full items-center justify-center rounded-[10px] bg-raised text-center"
    >
      <p class="text-sm text-ink-3">
        {{ props.etfData?.length === 0 ? '無數據可顯示' : '載入圖表中...' }}
        <br>
        <small class="font-mono text-xs">數據數量: {{ props.etfData?.length || 0 }}</small>
      </p>
    </div>
    <Line
      v-else
      :data="chartData"
      :options="chartOptions"
      class="w-full h-full"
    />
  </div>
</template>
