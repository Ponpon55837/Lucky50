<template>
  <div class="h-64 w-full">
    <Bar
      v-if="chartData && chartOptions"
      :data="chartData"
      :options="chartOptions"
      class="w-full h-full"
    />
    <div v-else class="h-full bg-gray-800/50 rounded-lg flex items-center justify-center">
      <p class="text-gray-400">載入圖表中...</p>
    </div>
  </div>
</template>

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

// 計算圖表數據
const chartData = computed(() => {
  if (!props.etfData || props.etfData.length === 0) {
    return null
  }

  // 取最近20天的數據並按日期排序
  const sortedData = [...props.etfData]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-20)

  const labels = sortedData.map(item => {
    const date = new Date(item.date)
    return `${date.getMonth() + 1}/${date.getDate()}`
  })

  const volumes = sortedData.map(item => item.volume / 1000000) // 轉換為百萬

  return {
    labels,
    datasets: [
      {
        label: '成交量 (百萬)',
        data: volumes,
        backgroundColor: props.isDark ? 'rgba(251, 191, 36, 0.8)' : 'rgba(59, 130, 246, 0.8)',
        borderColor: props.isDark ? '#fbbf24' : '#3b82f6',
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  }
})

// 圖表選項
const chartOptions = computed(() => {
  const textColor = props.isDark ? '#e5e7eb' : '#374151'
  const gridColor = props.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'

  return {
    responsive: true,
    maintainAspectRatio: false,
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
            return `成交量: ${context.parsed.y.toFixed(1)}M`
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
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
            return `${value}M`
          },
        },
      },
    },
  }
})
</script>
