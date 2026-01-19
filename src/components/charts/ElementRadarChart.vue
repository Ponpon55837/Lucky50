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
  userElement?: string // 個人的主要五行屬性
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

// 將中文五行轉換為英文
const mapElementToEnglish = (chineseElement: string): string => {
  const elementMap: Record<string, string> = {
    金: 'metal',
    木: 'wood',
    水: 'water',
    火: 'fire',
    土: 'earth',
  }
  return elementMap[chineseElement] || chineseElement
}

// 五行對應的顏色
const getElementColors = () => {
  const baseColors = {
    wood: props.isDark ? '#10b981' : '#059669', // 綠色
    fire: props.isDark ? '#ef4444' : '#dc2626', // 紅色
    earth: props.isDark ? '#f59e0b' : '#d97706', // 黃色
    metal: props.isDark ? '#6b7280' : '#4b5563', // 灰色
    water: props.isDark ? '#3b82f6' : '#2563eb', // 藍色
  }

  return baseColors
}

// 計算圖表數據
const chartData = computed(() => {
  if (!props.elements) {
    return null
  }

  const elementColors = getElementColors()
  const elementOrder = ['wood', 'fire', 'earth', 'metal', 'water']

  // 獲取個人主要五行的英文名稱
  const userMainElement = props.userElement ? mapElementToEnglish(props.userElement) : null

  const labels = elementOrder.map(element => {
    const name = getElementName(element)
    // 如果是個人主要五行，添加星號標記
    return element === userMainElement ? `★ ${name}` : name
  })

  const data = elementOrder.map(element => props.elements[element] || 0)
  const borderColors = elementOrder.map(
    element => elementColors[element as keyof typeof elementColors]
  )

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
        pointRadius: elementOrder.map(
          element => (element === userMainElement ? 6 : 4) // 個人主要五行的點更大
        ),
        pointHoverRadius: elementOrder.map(element => (element === userMainElement ? 8 : 6)),
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
            const elementName = getElementName(context.label.toLowerCase())
            const isUserElement =
              props.userElement &&
              mapElementToEnglish(props.userElement) === context.label.toLowerCase()
            const marker = isUserElement ? '★ ' : ''
            return `${marker}${elementName}: ${context.parsed.r.toFixed(1)}`
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
            weight: 'bold' as const,
          },
        },
      },
    },
  } as const
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
    <div
      v-else
      class="h-full bg-gray-800/50 rounded-lg flex items-center justify-center"
    >
      <p class="text-gray-400">
        載入圖表中...
      </p>
    </div>
  </div>
</template>
