<script setup lang="ts">
import { computed } from 'vue'
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'
import { Radar } from 'vue-chartjs'

// 註冊 Chart.js 組件
ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

interface Props {
  elements: Record<string, number>
  isDark?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isDark: true,
})

// 五行對應的中文名稱
const getElementName = (element: string): string => {
  const elementNames: Record<string, string> = {
    wood: '木',
    fire: '火',
    earth: '土',
    metal: '金',
    water: '水',
  }
  return elementNames[element] || element
}

// 五行對應的顏色
const getElementColors = () => {
  if (props.isDark) {
    return {
      wood: '#10b981', // 綠色
      fire: '#ef4444', // 紅色
      earth: '#f59e0b', // 黃色
      metal: '#6b7280', // 灰色
      water: '#3b82f6', // 藍色
    }
  } else {
    return {
      wood: '#059669',
      fire: '#dc2626',
      earth: '#d97706',
      metal: '#4b5563',
      water: '#2563eb',
    }
  }
}

// 計算圖表數據
const chartData = computed(() => {
  if (!props.elements) {
    return null
  }

  const elementColors = getElementColors()
  const elementOrder = ['wood', 'fire', 'earth', 'metal', 'water']

  const labels = elementOrder.map(element => getElementName(element))
  const data = elementOrder.map(element => props.elements[element] || 0)
  const borderColors = elementOrder.map(
    element => elementColors[element as keyof typeof elementColors]
  )
  const backgroundColors = borderColors.map(color => color + '40') // 添加透明度

  return {
    labels,
    datasets: [
      {
        label: '五行能量',
        data,
        borderColor: props.isDark ? '#fbbf24' : '#3b82f6',
        backgroundColor: props.isDark ? 'rgba(251, 191, 36, 0.2)' : 'rgba(59, 130, 246, 0.2)',
        borderWidth: 2,
        pointBackgroundColor: borderColors,
        pointBorderColor: props.isDark ? '#ffffff' : '#1f2937',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  }
})

// 圖表選項
const chartOptions = computed(() => {
  const textColor = props.isDark ? '#e5e7eb' : '#374151'
  const gridColor = props.isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'

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
        callbacks: {
          label: function (context: any) {
            return `${context.label}: ${context.parsed.r.toFixed(1)}`
          },
        },
      },
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          display: false,
        },
        grid: {
          color: gridColor,
        },
        angleLines: {
          color: gridColor,
        },
        pointLabels: {
          color: textColor,
          font: {
            size: 14,
            weight: 'bold',
          },
        },
      },
    },
  }
})
</script>

<template>
  <div class="h-64 w-full">
    <Radar
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
