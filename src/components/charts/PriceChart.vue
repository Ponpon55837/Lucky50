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

  // 創建背景色 - 使用簡單的字符串而不是漸變
  const backgroundColor = props.isDark ? 'rgba(251, 191, 36, 0.1)' : 'rgba(59, 130, 246, 0.1)'

  const data = {
    labels,
    datasets: [
      {
        label: '0050 收盤價',
        data: prices,
        borderColor: props.isDark ? '#fbbf24' : '#3b82f6',
        backgroundColor,
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: props.isDark ? '#fbbf24' : '#3b82f6',
        pointBorderColor: props.isDark ? '#ffffff' : '#1f2937',
        pointBorderWidth: 2,
      },
    ],
  }

  return data
})

// 圖表選項
const chartOptions = computed(() => {
  const textColor = props.isDark ? '#e5e7eb' : '#374151'
  const gridColor = props.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'

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
        backgroundColor: props.isDark ? 'rgba(17, 24, 39, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        titleColor: textColor,
        bodyColor: textColor,
        borderColor: props.isDark ? '#fbbf24' : '#3b82f6',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: function (context: any) {
            return `收盤價: $${context.parsed.y.toFixed(2)}`
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: true,
          color: gridColor,
        },
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
        ticks: {
          color: textColor,
          font: {
            size: 12,
          },
          callback: function (value: any) {
            return `$${value}`
          },
        },
      },
    },
    elements: {
      point: {
        hoverBackgroundColor: props.isDark ? '#fbbf24' : '#3b82f6',
      },
    },
  }
})
</script>

<template>
  <div class="h-64 w-full">
    <div
      v-if="!chartData"
      class="h-full bg-gray-800/50 rounded-lg flex items-center justify-center"
    >
      <p class="text-gray-400">
        {{ props.etfData?.length === 0 ? '無數據可顯示' : '載入圖表中...' }}
        <br />
        <small class="text-xs">數據數量: {{ props.etfData?.length || 0 }}</small>
      </p>
    </div>
    <Line v-else :data="chartData" :options="chartOptions" class="w-full h-full" />
  </div>
</template>
