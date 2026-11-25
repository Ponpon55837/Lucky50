<script setup lang="ts">
import { computed, useId } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type Scale,
  type TooltipItem,
} from 'chart.js'
import { Bar } from 'vue-chartjs'
import type { ETFData } from '@/types'
import ChartDataDisclosure from './ChartDataDisclosure.vue'

// 註冊 Chart.js 組件
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

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
const volumeFormatter = new Intl.NumberFormat('zh-TW')
const rows = computed(() =>
  quotes.value.map(({ date, volume }) => ({
    key: date,
    label: date,
    values: [volumeFormatter.format(volume)],
  }))
)
const latestQuote = computed(() => quotes.value.at(-1))

const chartData = computed(() => {
  if (!quotes.value.length) return null

  // 成交量為中性資訊：墨色長條，最新一日以朱紅標示
  void props.isDark
  const highlight = token('seal-ink')
  const neutral = token('ink', 0.66)
  const bars = quotes.value.map((_, index) =>
    index === quotes.value.length - 1 ? highlight : neutral
  )

  return {
    labels: quotes.value.map(item => item.date),
    datasets: [
      {
        label: '成交量（百萬股）',
        data: quotes.value.map(item => item.volume / 1_000_000),
        backgroundColor: bars,
        hoverBackgroundColor: token('ink'),
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
            const quote = quotes.value[context.dataIndex]
            return quote ? `成交量：${volumeFormatter.format(quote.volume)} 股` : ''
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
            return `${value}M`
          },
        },
      },
    },
  }
})
</script>

<template>
  <div class="flex min-w-0 flex-col gap-3">
    <template v-if="chartData && latestQuote">
      <div class="relative h-64 w-full">
        <Bar
          :data="chartData"
          :options="chartOptions"
          :aria-label="`0050 成交量走勢圖${periodLabel}`"
          :aria-describedby="summaryId"
          class="w-full h-full"
        />
      </div>
      <p
        :id="summaryId"
        class="chart-data-summary text-sm text-ink-2"
      >
        共 {{ rows.length }} 個交易日。最近交易日 {{ latestQuote.date }} 的成交量為
        {{ volumeFormatter.format(latestQuote.volume) }} 股。
      </p>
      <ChartDataDisclosure
        :caption="`0050 成交量${periodLabel}`"
        :columns="['交易日期', '成交量（股）']"
        :rows="rows"
      />
    </template>
    <p
      v-else
      class="flex h-64 items-center justify-center rounded-[10px] bg-raised text-sm text-ink-3"
    >
      無成交量數據
    </p>
  </div>
</template>
