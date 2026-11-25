<script setup lang="ts">
import { computed, useId } from 'vue'
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
  type Scale,
  type TooltipItem,
} from 'chart.js'
import { Line } from 'vue-chartjs'
import type { ETFData } from '@/types'
import ChartDataDisclosure from './ChartDataDisclosure.vue'

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
  period?: string
}

const props = withDefaults(defineProps<Props>(), {
  isDark: true,
  period: '',
})

// Chart.js 需要實際色值：渲染時從 CSS tokens（"r g b"）讀取，深淺主題自動跟著切換
const FALLBACK_TOKENS: Record<string, string> = {
  ink: '27 26 24',
  'ink-2': '85 82 76',
  'ink-3': '111 107 100',
  surface: '255 255 255',
  seal: '192 40 45',
  'seal-ink': '176 34 39',
}
const token = (name: string, alpha = 1): string => {
  const raw =
    typeof document === 'undefined'
      ? ''
      : getComputedStyle(document.documentElement).getPropertyValue(`--c-${name}`).trim()
  return `rgb(${raw || FALLBACK_TOKENS[name] || '128 128 128'} / ${alpha})`
}

const summaryId = useId()
const periodLabel = computed(() => (props.period ? `（${props.period}）` : ''))
const quotes = computed(() => [...props.etfData].sort((a, b) => a.date.localeCompare(b.date)))
const formatPrice = (price: number) => price.toFixed(2)
const rows = computed(() =>
  quotes.value.map(({ date, close }) => ({ key: date, label: date, values: [formatPrice(close)] }))
)
const firstQuote = computed(() => quotes.value[0])
const latestQuote = computed(() => quotes.value.at(-1))

const chartData = computed(() => {
  if (!quotes.value.length) return null

  // isDark 只用來觸發重新計算；實際顏色由 tokens 決定
  void props.isDark
  const line = token('seal-ink')

  return {
    labels: quotes.value.map(item => item.date),
    datasets: [
      {
        label: '0050 收盤價',
        data: quotes.value.map(item => item.close),
        borderColor: line,
        backgroundColor: token('seal', 0.08),
        borderWidth: 2,
        fill: true,
        tension: 0.35,
        pointRadius: quotes.value.length === 1 ? 4 : 0,
        pointHoverRadius: 4,
        pointBackgroundColor: line,
        pointBorderColor: token('surface'),
        pointBorderWidth: 2,
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
            return `收盤價：${formatPrice(context.parsed.y ?? 0)} 元`
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
          callback(this: Scale, value: string | number) {
            return this.getLabelForValue(Number(value)).slice(5).replace('-', '/')
          },
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
        hoverBackgroundColor: token('seal-ink'),
      },
    },
  }
})
</script>

<template>
  <div class="flex min-w-0 flex-col gap-3">
    <template v-if="chartData && firstQuote && latestQuote">
      <div class="relative h-64 w-full sm:h-96">
        <Line
          :data="chartData"
          :options="chartOptions"
          :aria-label="`0050 收盤價走勢圖${periodLabel}`"
          :aria-describedby="summaryId"
          class="w-full h-full"
        />
      </div>
      <p
        :id="summaryId"
        class="chart-data-summary text-sm text-ink-2"
      >
        共 {{ rows.length }} 個交易日。收盤價從 {{ firstQuote.date }} 的
        {{ formatPrice(firstQuote.close) }} 元到 {{ latestQuote.date }} 的
        {{ formatPrice(latestQuote.close) }} 元。
      </p>
      <ChartDataDisclosure
        :caption="`0050 收盤價${periodLabel}`"
        :columns="['交易日期', '收盤價（新台幣元）']"
        :rows="rows"
      />
    </template>
    <p
      v-else
      class="flex h-64 items-center justify-center rounded-[10px] bg-raised text-sm text-ink-3 sm:h-96"
    >
      無收盤價數據
    </p>
  </div>
</template>
