<script setup lang="ts">
import { computed, useId } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  type TooltipItem,
} from 'chart.js'
import { Bar } from 'vue-chartjs'
import type { MetaphysicsResult } from '@/services/engines/types'
import ChartDataDisclosure from './ChartDataDisclosure.vue'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

interface Props {
  results: MetaphysicsResult[]
  weights?: Record<string, number>
  isDark?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  weights: () => ({}),
  isDark: true,
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
const caption = '命理引擎分數'
const engineScores = computed(() =>
  props.results.map(({ engineId, engineName, score }) => ({
    engineId,
    engineName,
    score,
    weight: props.weights[engineId] ?? 0,
  }))
)
const rows = computed(() =>
  engineScores.value.map(({ engineId, engineName, score, weight }) => ({
    key: engineId,
    label: engineName,
    values: [String(score), `${weight}%`],
  }))
)
const topScore = computed(() => Math.max(...engineScores.value.map(item => item.score)))
const topEngines = computed(() =>
  engineScores.value
    .filter(item => item.score === topScore.value)
    .map(item => item.engineName)
    .join('、')
)

const chartData = computed(() => {
  if (!engineScores.value.length) return null

  void props.isDark
  const scores = engineScores.value.map(item => item.score)

  // 所有引擎同為墨色，只有最高分的引擎以朱紅標示
  const bgColors = scores.map(score =>
    score === topScore.value ? token('seal-ink') : token('ink', 0.66)
  )

  return {
    labels: engineScores.value.map(item => item.engineName),
    datasets: [
      {
        label: '引擎分數',
        data: scores,
        backgroundColor: bgColors,
        borderWidth: 0,
        borderRadius: 6,
        barThickness: 24,
      },
    ],
  }
})

const chartOptions = computed(() => {
  void props.isDark
  const textColor = token('ink-3')

  return {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: token('surface', 0.96),
        titleColor: token('ink-3'),
        bodyColor: token('ink'),
        borderColor: token('ink', 0.18),
        borderWidth: 1,
        cornerRadius: 10,
        displayColors: false,
        padding: 12,
        callbacks: {
          label: (ctx: TooltipItem<'bar'>) => {
            const result = engineScores.value[ctx.dataIndex]
            return result ? `分數：${result.score}，權重：${result.weight}%` : ''
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        max: 100,
        ticks: { color: textColor, stepSize: 20 },
        grid: {
          color: token('ink', 0.08),
        },
        border: { display: false },
      },
      y: {
        ticks: {
          color: token('ink-2'),
          font: { size: 13 },
        },
        grid: { display: false },
        border: { display: false },
      },
    },
  } as const
})
</script>

<template>
  <div class="flex min-w-0 flex-col gap-3">
    <template v-if="chartData">
      <div class="relative h-64 w-full">
        <Bar
          :data="chartData"
          :options="chartOptions"
          :aria-label="`${caption}圖`"
          :aria-describedby="summaryId"
          class="w-full h-full"
        />
      </div>
      <p
        :id="summaryId"
        class="chart-data-summary text-sm text-ink-2"
      >
        最高分為 {{ topScore }} 分（滿分 100 分），由 {{ topEngines }} 取得。
      </p>
      <ChartDataDisclosure
        :caption="caption"
        :columns="['命理引擎', '分數', '權重']"
        :rows="rows"
      />
    </template>
    <p
      v-else
      class="flex h-64 items-center justify-center rounded-[10px] bg-raised text-sm text-ink-3"
    >
      無引擎數據
    </p>
  </div>
</template>
