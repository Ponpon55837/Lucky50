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

// 計算圖表數據
const chartData = computed(() => {
  if (!props.etfData || props.etfData.length === 0) {
    console.log('VolumeChart - No data available')
    return null
  }

  // 使用所有傳入的數據，不再限制為20天
  const sortedData = [...props.etfData].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  console.log('VolumeChart - Data count:', sortedData.length)

  if (sortedData.length > 0) {
    console.log(
      'VolumeChart - 日期範圍:',
      sortedData[0].date,
      '至',
      sortedData[sortedData.length - 1].date
    )
    console.log('VolumeChart - First volume:', sortedData[0].volume)
    console.log('VolumeChart - Last volume:', sortedData[sortedData.length - 1].volume)
  }

  const labels = sortedData.map(item => {
    const date = new Date(item.date)
    return `${date.getMonth() + 1}/${date.getDate()}`
  })

  const volumes = sortedData.map(item => {
    const volume = item.volume / 1000000 // 轉換為百萬
    return isNaN(volume) ? 0 : volume
  })

  console.log('VolumeChart - Volume data:', volumes.slice(0, 5)) // 顯示前5筆數據

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
          label: function (context: TooltipItem<'bar'>) {
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
      class="h-full bg-gray-800/50 rounded-lg flex items-center justify-center"
    >
      <div class="text-center">
        <p class="text-gray-400 mb-2">
          {{ props.etfData.length === 0 ? '無成交量數據' : '載入圖表中...' }}
        </p>
        <p class="text-gray-500 text-sm">
          數據筆數: {{ props.etfData.length }}
        </p>
      </div>
    </div>
  </div>
</template>
