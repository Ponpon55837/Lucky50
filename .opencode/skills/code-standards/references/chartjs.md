# Chart.js 圖表開發詳細規範

## 📊 Chart.js 版本與配置

### 推薦版本

- **Chart.js**: `^4.4.0` 或更新
- **@types/chart.js**: 當前與 Chart.js 版本一致
- **vue-chartjs**: `^5.3.0` 或更新

### 設定

```typescript
// chart.config.ts
import { Chart, registerables } from 'chart.js'

// 設定預設值
Chart.defaults.font.family = "'Noto Sans TC', '微軟黑體', 'sans-serif'
Chart.defaults.color = '#666'
Chart.defaults.borderColor = '#ddd'
Chart.defaults.font.size = 12

// 設定響應式設計
Chart.defaults.responsive = true
Chart.defaults.maintainAspectRatio = false
Chart.defaults.plugins = [
  Chart.Title,
  Chart.Tooltip,
  Legend,
  Chart.CategoryScale,
  LinearScale,
  PointElement,
]
```

## 📊 圖表類型支援

### 基本圖表類型

```typescript
// 折線圖
type LineChartOptions = {
  type: 'line'
  data: Array<{
    x: number
    y: number
  }>
  options: ChartOptions<'line'>
}

// 柱狀圖
type BarChartOptions = {
  type: 'bar'
  data: Array<{
    x: string
    y: number
  }>
  options: ChartOptions<'bar'>
}

// 餲圓圖
type PieChartOptions = {
  type: 'pie'
  data: Array<{
    label: string
    value: number
  }>
  chartOptions: ChartOptions<'pie'>
}

// 雷散圖
type ScatterChartOptions = {
  type: 'scatter'
  data: Array<{
    x: number
    y: number
  }>
  options: ChartOptions<'scatter'>
}
```

### 進階圖表類型

```typescript
// 多軸折線圖
interface MultiLineChartOptions extends ChartOptions<'line'> {
  datasets: Array<{
    label: string
    data: Array<{ x: number; y: number }>
    borderColor: string
    backgroundColor: string
    fill: boolean
  }>
  yAxesID: string
  xAxesID: string
}
```

// 混合圖表
interface MixedChartOptions {
type: 'bar' | 'line'
data: BarChartData | LineChartData
options: ChartOptions<'bar' | 'line'>
}

````

## 🎯 Vue Chart.js 整合

### Chart.vue 組件範例

```vue
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Chart as ChartJS } from 'chart.js'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
} from 'chart.js'

import { useTheme } from '@/composables/useTheme'

// Props 定義
interface Props {
  data: {
    labels: string[]
    datasets: {
      label: string
      data: number[]
      backgroundColor: string
      borderColor: string
    }[]
  }
  options?: ChartOptions
  responsive?: boolean
  maintainAspectRatio?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  responsive: true,
  maintainAspectRatio: false,
})

// Chart 實例
const chartRef = ref<Chart>()

// 主題響應式配置
const { theme } = useTheme()

const chartConfig = computed(() => ({
  scales: {
    x: {
      grid: {
        color: theme.value === 'dark' ? '#374151' : '#e5e7eb',
      },
    },
    y: {
      grid: {
        color: theme.value === 'dark' ? '#6b7280' : '#e5e7eb',
      },
    },
  },
  plugins: [
    Title,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    PointElement,
  ],
}))

// 創建圖表
const createChart = () => {
  if (chartRef.value) {
    chartRef.value.destroy()
  }

  new Chart(chartRef.value.getContext('2d'), {
    type: props.type,
    data: props.data,
    options: { ...props.options, ...chartConfig.value },
  })
}

onMounted(() => {
  createChart()
})

onUnmounted(() => {
  createChart()
})

// 更新數據的方法
const updateChartData = (newData: Props['data']) => {
  if (chartRef.value) {
    chartRef.value.data = newData
    chartRef.value.update()
  }
}

return { chartRef, updateChartData, createChart }
}
````

### 響應式設計

```vue
<script setup lang="ts">
const { useTheme } from '@/composables/useTheme'

const { theme } = useTheme()

const chartConfig = computed(() => ({
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: theme.value === 'dark' ? '#6b7280' : '#e5e7eb',
      },
    },
  },
  plugins: [
    Title,
    Tooltip,
    {
      mode: 'index',
      intersect: false,
      callbacks: {
        title: function(context) {
          return context[0].label
        },
      },
    },
    Legend,
  ],
}))

// 使用響應式主題顏色
const chartColors = computed(() => ({
  backgroundColor: [
    theme.value === 'dark'
      ? ['rgba(75, 192, 192, 0.2)',
      'rgba(54, 162, 235, 0.2)',
      'rgba(153, 102, 255, 0.2)',
    ] : [
      'rgba(54, 162, 235, 0.2)',
      'rgba(75, 192, 192, 0.2)',
      'rgba(153, 102, 255, 0.2)',
      'rgba(54, 162, 235, 0.2)',
    ],
  ]
})
```

## 📊 動態數據更新

### 即時更新

```vue
<script setup lang="ts">
const chartRef = ref<Chart>()
const data = ref<ChartData>([])

// 即時添加數據點
const addDataPoint = (x: number, y: number) => {
  data.value.push({ x, y })
}

// 批次批次更新
const updateDataBatch = (newData: ChartData[]) => {
  data.value = newData
}
// 移除舊數據
const clearData = () => {
  data.value = []
}

// 替換數據
const replaceData = (oldIndex: number, newItem: ChartData) => {
  data.value[oldIndex] = newItem
}
```

### 事件處理

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'

// 點擊事件
const handleChartClick = (event: any) => {
  const chart = event.chart
  const points = chart.getElementsAtEventForMode(event, 'nearest', { intersect: true })

  if (points.length) {
    const point = points[0]
    const datasetIndex = point.datasetIndex
    const dataset = chart.data[datasetIndex]
    const label = chart.data.labels[point.index]

    console.log(`Clicked on ${label}:`, point)
  }
}

// 懸放事件
const handleHover = (event: any) => {
  const chart = event.chart
  const canvas = chart.canvas

  if (event.native) {
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    const canvasPosition = Chart.helpers.getRelativePosition(event, chart)
    console.log('Chart position:', canvasPosition)
  }
}

onMounted(() => {
  if (chartRef.value) {
    chartRef.value.options.onClick = handleChartClick
    chartRef.value.onHover = handleHover
  }
})
```

## 📊 圖表自訂義

### 自定義圖表類型

```typescript
interface CustomChartElement extends ChartElement {
  customProperty: string
  draw: (ctx: CanvasRenderingContext) => void
  id: string
}

// 自定義插件
const customPlugin = {
  id: 'customPlugin',
  beforeDraw: (chart) => {
    const ctx = chart.ctx
    // 自定義前的繪製邏輯
  },
  afterDraw: (chart) => {
    // 自定義後的繪製邏輯
  },
  id: 'customPlugin',
  },
}
```

## 📊 效能優化

### 大數據集處理

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

const MAX_DATA_POINTS = 1000
const SAMPLE_SIZE = 100

// 處擬數據採樣
const sampleData = computed(() => {
  const points = []
  for (let i = 0; i < SAMPLE_SIZE; i++) {
    points.push({
      x: i,
      y: Math.sin(i * 0.1) + Math.random() * 0.1,
    })
  }
  return points
})

// 數據減採樣
const downsampledData = computed(() => {
  return sampleData.value.filter((_, index) => index % 10 === 0)
})

// 範例點數減少
const reducedData = computed(() => {
  return sampleData.value.slice(0, 100)
})
</script>
```

### 效能提示用戶

```vue
<template>
  <div class="chart-container">
    <canvas ref="chartRef"></canvas>
    <div class="chart-controls">
      <button @click="exportChart">導出圖表</button>
      <button @click="resetZoom">重置縮放</button>
      <button @click="toggleAnimation">切換動畫</button>
    </div>
  </div>
</template>

<script setup lang="ts">
const chartRef = ref<Chart>()
const isAnimating = ref(false)

const exportChart = () => {
  if (chartRef.value) {
    const url = chartRef.value.toBase64Image()
    const link = document.createElement('a')
    link.download = 'chart.png'
    link.href = url
    link.click()
  }
}

const resetZoom = () => {
  if (chartRef.value) {
    chartRef.value.resetZoom()
  }
}

const toggleAnimation = () => {
  isAnimating.value = !isAnimating.value
  if (isAnimating.value) {
    chartRef.value.stop()
  } else {
    chartRef.value.start()
  }
}
</script>
```

---

**注意**：Chart.js 在處理大型數據集時可能需要效能最佳化，特別是即時更新頻率。
