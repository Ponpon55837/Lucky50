<script setup lang="ts">
import { ref, shallowRef, computed, watch, onMounted, defineAsyncComponent } from 'vue'
import { useDashboardStore } from '@/stores/dashboard'
import { useAnalyticsStore, type StrategyAnalysis } from '@/stores/analytics'
import { useUserStore } from '@/stores/user'
import { useTheme } from '@/composables/useTheme'
import { dateRangeFromToday, engineSettingsFingerprint } from '@/queries'
import { ENGINE_LIST, metaphysicsRegistry } from '@/services/engines'
import { IntegratedFortuneService } from '@/services/integratedFortune'
import { lunarService } from '@/services/lunar'
import { BUY_THRESHOLD, HOLD_THRESHOLD, OBSERVE_THRESHOLD } from '@/utils/almanac'
import { fromLocalDateString } from '@/utils/date'
import { profileHash } from '@/utils/hash'
import type { FortuneBand } from '@/utils/backtest'

// ── 元件 ──
const PriceChart = defineAsyncComponent({
  loader: () => import('@/components/charts/PriceChart.vue'),
  loadingComponent: () => import('@/components/ui/Loading.vue'),
})
const VolumeChart = defineAsyncComponent({
  loader: () => import('@/components/charts/VolumeChart.vue'),
  loadingComponent: () => import('@/components/ui/Loading.vue'),
})
const Stock3DVisualization = defineAsyncComponent({
  loader: () => import('@/components/three/Stock3DVisualization.vue'),
  loadingComponent: () => import('@/components/ui/Loading.vue'),
})
const Fortune3DVisualization = defineAsyncComponent({
  loader: () => import('@/components/three/Fortune3DVisualization.vue'),
  loadingComponent: () => import('@/components/ui/Loading.vue'),
})
const Lunar3DVisualization = defineAsyncComponent({
  loader: () => import('@/components/three/Lunar3DVisualization.vue'),
  loadingComponent: () => import('@/components/ui/Loading.vue'),
})
const Technical3DVisualization = defineAsyncComponent({
  loader: () => import('@/components/three/Technical3DVisualization.vue'),
  loadingComponent: () => import('@/components/ui/Loading.vue'),
})
const EngineScoresChart = defineAsyncComponent({
  loader: () => import('@/components/charts/EngineScoresChart.vue'),
  loadingComponent: () => import('@/components/ui/Loading.vue'),
})

// ── Store 實例 ──
const dashboardStore = useDashboardStore()
const analyticsStore = useAnalyticsStore()
const userStore = useUserStore()
const { isDark } = useTheme()

// ── 響應式狀態 ──
const loading = ref(true)
const error = ref<string | null>(null)

// ── 計算屬性 ──
const selectedPeriod = computed({
  get: () => analyticsStore.selectedPeriod,
  set: (value: string) => analyticsStore.setSelectedPeriod(value),
})
const periods = analyticsStore.periods

const filteredEtfData = computed(() => {
  return analyticsStore.getAdjustedEtfData(dashboardStore.etfData)
})

/** 逐日評分依據：有生辰用個人命盤，否則只看日子本身 */
const scoringProfile = computed(() => (userStore.isProfileComplete ? userStore.profile : null))
const scoreKey = computed(() => {
  const profile = scoringProfile.value
  return profile ? `${profileHash(profile)}|${engineSettingsFingerprint()}` : 'day'
})

type AnalysisState = 'computing' | 'ready' | 'failed'
const strategyAnalysis = shallowRef<StrategyAnalysis | null>(null)
const analysisState = ref<AnalysisState>('computing')

/**
 * 逐日評分上千個交易日需要幾秒，分段在背景算完再更新畫面。
 * 途中資料或評分依據又變了，舊的結果就丟掉；評分失敗（例如舊資料的生辰格式不合）只影響回測區塊。
 */
watch(
  [() => dashboardStore.etfData, scoreKey],
  async ([etfData, key], _previous, onCleanup) => {
    let stale = false
    onCleanup(() => (stale = true))
    analysisState.value = 'computing'

    const profile = scoringProfile.value
    metaphysicsRegistry.loadFromStorage()
    const scoreOf = (day: string) => {
      const date = fromLocalDateString(day)
      return profile
        ? IntegratedFortuneService.computeFortune(profile, date).investmentScore
        : lunarService.getInvestmentAdvice(date).luckyScore
    }

    try {
      const analysis = await analyticsStore.analyzeStrategies(etfData, scoreOf, key)
      if (stale) return
      strategyAnalysis.value = analysis
      analysisState.value = 'ready'
    } catch (err) {
      if (stale) return
      console.error('Analytics 回測計算失敗:', err)
      strategyAnalysis.value = null
      analysisState.value = 'failed'
    }
  },
  { immediate: true }
)
const backtestResults = computed(() => strategyAnalysis.value?.backtest ?? null)
const correlation = computed(() => strategyAnalysis.value?.correlation ?? null)
const backtestNotice = computed(() => {
  if (analysisState.value === 'computing') return '回測計算中…'
  if (analysisState.value === 'failed') return '回測計算失敗，請確認個人設定的出生日期與時間是否正確。'
  return '行情資料不足兩個交易日，無法回測。'
})

const STRATEGIES = [
  {
    key: 'lunar',
    name: '農民曆策略',
    note: `只在投資分數 ${HOLD_THRESHOLD} 以上的日子持有`,
    accent: true,
  },
  { key: 'buyHold', name: '買入持有', note: '全程持有', accent: false },
  { key: 'dca', name: '定期定額', note: '每個交易日投入等額資金', accent: false },
] as const

const BANDS: ReadonlyArray<{ key: FortuneBand; label: string; tone: string }> = [
  { key: 'high', label: `高分日（${BUY_THRESHOLD} 以上）`, tone: 'text-good' },
  { key: 'medium', label: `中間（${OBSERVE_THRESHOLD}–${BUY_THRESHOLD - 1}）`, tone: 'text-ink' },
  { key: 'low', label: `低分日（低於 ${OBSERVE_THRESHOLD}）`, tone: 'text-bad' },
]

/** 農民曆策略與買入持有的累積報酬差距（百分點）；短期間年化會失真，所以比較期間報酬 */
const edgeOverMarket = computed(() => {
  const results = backtestResults.value
  return results ? Number((results.lunar.totalReturn - results.buyHold.totalReturn).toFixed(1)) : 0
})

/** 帶正負號的百分比，例如 +3.2% */
const signedPercent = (value: number) => `${value > 0 ? '+' : ''}${value}%`
const returnClass = (value: number) => (value >= 0 ? 'text-rise' : 'text-fall')
const orDash = (value: number | null, format: (v: number) => string) =>
  value === null ? '—' : format(value)

const technicalIndicators = computed(() => {
  return analyticsStore.calculateTechnicalIndicators(dashboardStore.etfData)
})

// ── 命理引擎資料 ──
const ENGINE_LABELS: Record<string, string> = Object.fromEntries(
  ENGINE_LIST.map(meta => [meta.id, meta.name])
)
const ENGINE_WEIGHTS = computed(() => {
  const weights: Record<string, number> = {}
  for (const { id } of ENGINE_LIST) {
    weights[id] = metaphysicsRegistry.getEngineById(id)?.getWeight() ?? 0
  }
  return weights
})

const engineResults = computed(() => dashboardStore.integratedFortune?.enginesResults ?? [])
const engineWeightedScore = computed(
  () => dashboardStore.integratedFortune?.engineWeightedScore ?? 0
)
const hasEngineData = computed(() => engineResults.value.length > 0)

// ── 方法與函式 ──
const loadAnalyticsData = async () => {
  loading.value = true

  try {
    const { startDate, endDate } = dateRangeFromToday(
      analyticsStore.getPeriodDays(selectedPeriod.value)
    )

    // 三者互不相依，並行載入；皆經 Pinia Colada 快取，從 Dashboard 切換過來時直接命中
    const today = new Date()
    await Promise.allSettled([
      dashboardStore.loadETFRange(startDate, endDate),
      dashboardStore.loadLunarData(today),
      userStore.isProfileComplete
        ? dashboardStore.loadIntegratedFortune(userStore.profile, today)
        : Promise.resolve(),
    ])
  } catch (err) {
    console.error('Analytics 數據載入失敗:', err)
    error.value = '數據載入失敗'
  } finally {
    loading.value = false
  }
}

// ── 監聽器 ──
watch(
  () => selectedPeriod.value,
  async () => {
    await loadAnalyticsData()
  },
  { immediate: false }
)

// ── 生命週期 ──
onMounted(() => {
  loadAnalyticsData()
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Header -->
    <header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="font-serif text-[28px] font-bold leading-tight text-ink sm:text-[36px]">
          數據分析
        </h1>
        <p class="mt-1.5 text-sm text-ink-2">
          深入分析 0050 ETF 的歷史表現與投資趨勢
        </p>
      </div>
      <!-- 全局時間區間選擇器 -->
      <div class="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
        <div class="text-[13px] text-ink-3">
          分析時間區間
        </div>
        <div
          class="grid w-full grid-cols-3 gap-1 rounded-[10px] border border-line-strong p-1 sm:flex sm:w-auto"
          role="group"
          aria-label="分析時間區間"
        >
          <button
            v-for="period in periods"
            :key="period"
            type="button"
            :disabled="loading"
            :aria-pressed="selectedPeriod === period"
            :class="[
              'whitespace-nowrap rounded-md px-3 py-1.5 text-center text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
              selectedPeriod === period ? 'bg-seal text-seal-on' : 'text-ink-2 hover:bg-raised',
            ]"
            @click="selectedPeriod = period"
          >
            {{ period }}
          </button>
        </div>
      </div>
    </header>

    <!-- 當前分析區間說明 -->
    <p class="border-l-2 border-line-strong pl-3 text-sm text-ink-3">
      當前分析基於
      <span class="font-medium text-ink">{{ selectedPeriod }}</span>
      的歷史數據，所有圖表與回測結果均使用此時間區間
    </p>

    <!-- 策略績效總覽：以實際收盤價逐日回測 -->
    <section
      v-if="backtestResults"
      class="card"
    >
      <div class="flex flex-wrap items-center gap-3">
        <h2 class="card-title">
          農民曆策略回測
        </h2>
        <span class="rounded-full bg-raised px-3 py-1 text-xs text-ink-2">
          {{ edgeOverMarket >= 0 ? '優於' : '落後' }}買入持有
          {{ Math.abs(edgeOverMarket) }} 個百分點
        </span>
      </div>
      <p class="card-meta">
        只在當天投資分數 {{ HOLD_THRESHOLD }} 以上時持有 0050，其餘日子空手；未計手續費與交易稅。
        這是歷史模擬，不代表未來績效。
      </p>
      <dl class="grid grid-cols-2 gap-6 md:grid-cols-4">
        <div>
          <dt class="text-[13px] text-ink-3">
            {{ selectedPeriod }}累積報酬
          </dt>
          <dd
            class="mt-1 font-mono text-[28px] font-medium leading-none"
            :class="returnClass(backtestResults.lunar.totalReturn)"
          >
            {{ signedPercent(backtestResults.lunar.totalReturn) }}
          </dd>
          <dd class="mt-1.5 text-xs text-ink-3">
            買入持有 {{ signedPercent(backtestResults.buyHold.totalReturn) }}
          </dd>
        </div>
        <div>
          <dt class="text-[13px] text-ink-3">
            最大回撤
          </dt>
          <dd class="mt-1 font-mono text-[28px] font-medium leading-none text-ink">
            -{{ backtestResults.lunar.maxDrawdown }}%
          </dd>
          <dd class="mt-1.5 text-xs text-ink-3">
            買入持有 -{{ backtestResults.buyHold.maxDrawdown }}%
          </dd>
        </div>
        <div>
          <dt class="text-[13px] text-ink-3">
            夏普比率
          </dt>
          <dd class="mt-1 font-mono text-[28px] font-medium leading-none text-ink">
            {{ backtestResults.lunar.sharpeRatio }}
          </dd>
          <dd class="mt-1.5 text-xs text-ink-3">
            風險調整後收益
          </dd>
        </div>
        <div>
          <dt class="text-[13px] text-ink-3">
            持有日勝率
          </dt>
          <dd class="mt-1 font-mono text-[28px] font-medium leading-none text-ink">
            {{ backtestResults.lunar.winRate }}%
          </dd>
          <dd class="mt-1.5 text-xs text-ink-3">
            共持有 {{ backtestResults.lunar.trades }} 個交易日
          </dd>
        </div>
      </dl>
    </section>
    <section
      v-else
      class="card"
    >
      <h2 class="card-title">
        農民曆策略回測
      </h2>
      <p
        class="card-meta"
        role="status"
      >
        {{ backtestNotice }}
      </p>
    </section>

    <!-- 策略比較表 -->
    <div
      v-if="backtestResults"
      class="grid grid-cols-1 gap-4 lg:grid-cols-3"
    >
      <section
        v-for="strategy in STRATEGIES"
        :key="strategy.key"
        class="card"
        :class="{ 'border-seal/40': strategy.accent }"
      >
        <h3 class="flex items-center gap-2 font-serif text-base font-bold text-ink">
          <span
            class="dot"
            :class="strategy.accent ? 'bg-seal' : 'bg-ink-3'"
            aria-hidden="true"
          />
          {{ strategy.name }}
        </h3>
        <p class="text-xs text-ink-3">
          {{ strategy.note }}
        </p>
        <dl class="flex flex-col gap-2 text-sm">
          <div class="flex justify-between">
            <dt class="text-ink-3">
              累積報酬
            </dt>
            <dd
              class="font-mono font-medium"
              :class="returnClass(backtestResults[strategy.key].totalReturn)"
            >
              {{ signedPercent(backtestResults[strategy.key].totalReturn) }}
            </dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-ink-3">
              最大回撤
            </dt>
            <dd class="font-mono text-fall">
              -{{ backtestResults[strategy.key].maxDrawdown }}%
            </dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-ink-3">
              夏普比率
            </dt>
            <dd class="font-mono text-ink">
              {{ backtestResults[strategy.key].sharpeRatio }}
            </dd>
          </div>
        </dl>
      </section>
    </div>

    <!-- 3D 可視化區域 -->
    <div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <!-- 股票價格 3D 可視化 -->
      <div class="h-64 md:h-80">
        <Stock3DVisualization title="股價 3D 動態" />
      </div>

      <!-- 生肖運勢 3D 可視化 -->
      <div class="h-64 md:h-80">
        <Fortune3DVisualization title="生肖運勢 3D" />
      </div>
    </div>

    <!-- 農民曆與技術指標 3D 區域 -->
    <div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <!-- 農民曆 3D 可視化 -->
      <div class="h-64 md:h-80">
        <Lunar3DVisualization title="農民曆 3D" />
      </div>

      <!-- 技術指標 3D 可視化 -->
      <div class="h-64 md:h-80">
        <Technical3DVisualization title="技術指標 3D" />
      </div>
    </div>

    <!-- 命理引擎分析 -->
    <section
      v-if="hasEngineData"
      class="card"
    >
      <div>
        <div class="flex flex-wrap items-center gap-3">
          <h2 class="card-title">
            命理引擎分析
          </h2>
          <span class="rounded-full bg-raised px-3 py-1 text-xs text-ink-2">
            加權分數 <span class="font-mono font-medium text-ink">{{ engineWeightedScore }}</span>
          </span>
        </div>
        <p class="card-meta mt-1">
          各命理引擎根據個人八字、五行能量計算的運勢分數與投資建議
        </p>
      </div>

      <!-- 引擎分數長條圖 -->
      <EngineScoresChart
        :results="engineResults"
        :weights="ENGINE_WEIGHTS"
        :is-dark="isDark"
      />

      <!-- 各引擎詳情卡片 -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div
          v-for="result in engineResults"
          :key="result.engineId"
          class="rounded-[10px] border border-line p-4"
        >
          <div class="mb-3 text-sm font-medium text-ink">
            {{ ENGINE_LABELS[result.engineId] ?? result.engineName }}
          </div>
          <dl class="flex flex-col gap-2 text-sm">
            <div class="flex justify-between">
              <dt class="text-ink-3">
                分數
              </dt>
              <dd
                class="font-mono font-medium"
                :class="
                  result.score >= 70 ? 'text-good' : result.score >= 40 ? 'text-ink' : 'text-bad'
                "
              >
                {{ result.score }}
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-ink-3">
                權重
              </dt>
              <dd class="font-mono text-ink-2">
                {{ ENGINE_WEIGHTS[result.engineId] ?? 0 }}%
              </dd>
            </div>
            <div
              v-if="result.advice?.length"
              class="border-t border-line pt-2"
            >
              <p class="text-xs leading-relaxed text-ink-3">
                {{ result.advice[0] }}
              </p>
            </div>
          </dl>
        </div>
      </div>
    </section>

    <!-- 價格走勢圖 -->
    <section class="card">
      <div>
        <h2 class="card-title">
          價格走勢分析
        </h2>
        <p class="card-meta mt-1">
          基於 <span class="font-medium text-ink-2">{{ selectedPeriod }}</span>
          歷史數據的價格與成交量分析
        </p>
      </div>
      <div class="relative h-64 overflow-hidden sm:h-96">
        <div
          v-if="loading"
          class="absolute inset-0 z-10 flex items-center justify-center bg-surface/80"
        >
          <div class="flex items-center gap-2 text-sm text-ink-2">
            <div
              class="h-5 w-5 animate-spin rounded-full border-2 border-line-strong border-t-seal"
            />
            <span>載入 {{ selectedPeriod }} 數據中...</span>
          </div>
        </div>
        <PriceChart
          :etf-data="filteredEtfData"
          :is-dark="isDark"
        />
      </div>
    </section>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <!-- 成交量分析 -->
      <section class="card">
        <div>
          <h2 class="card-title">
            成交量分析
          </h2>
          <p class="card-meta mt-1">
            <span class="font-medium text-ink-2">{{ selectedPeriod }}</span>
            期間的成交量變化趨勢
          </p>
        </div>
        <div class="relative h-64 overflow-hidden">
          <div
            v-if="loading"
            class="absolute inset-0 z-10 flex items-center justify-center bg-surface/80"
          >
            <div class="flex items-center gap-2 text-sm text-ink-2">
              <div
                class="h-5 w-5 animate-spin rounded-full border-2 border-line-strong border-t-seal"
              />
              <span>載入中...</span>
            </div>
          </div>
          <VolumeChart
            v-if="!loading && filteredEtfData.length > 0"
            :etf-data="filteredEtfData"
            :is-dark="isDark"
          />
          <div
            v-else-if="!loading && filteredEtfData.length === 0"
            class="flex h-full items-center justify-center rounded-[10px] bg-raised"
          >
            <div class="text-center">
              <p class="mb-2 text-ink-2">
                無 {{ selectedPeriod }} 成交量數據
              </p>
              <p class="text-sm text-ink-3">
                請檢查數據連線或選擇其他時間段
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- 技術指標摘要 -->
      <section class="card">
        <div>
          <h2 class="card-title">
            技術指標摘要
          </h2>
          <p class="card-meta mt-1">
            基於 <span class="font-medium text-ink-2">{{ selectedPeriod }}</span>
            數據的技術分析指標
          </p>
        </div>
        <div class="flex flex-col divide-y divide-line border-y border-line">
          <div class="flex items-center justify-between py-3">
            <div>
              <div class="text-[13px] text-ink-3">
                RSI (相對強弱指數)
              </div>
              <div class="font-mono text-lg font-medium text-ink">
                {{ technicalIndicators.rsi.toFixed(1) }}
              </div>
            </div>
            <span
              :class="[
                'rounded-full px-2.5 py-0.5 text-xs font-medium',
                technicalIndicators.rsi > 70
                  ? 'bg-rise/10 text-rise'
                  : technicalIndicators.rsi < 30
                    ? 'bg-fall/10 text-fall'
                    : 'bg-raised text-ink-2',
              ]"
            >
              {{
                technicalIndicators.rsi > 70
                  ? '超買'
                  : technicalIndicators.rsi < 30
                    ? '超賣'
                    : '中性'
              }}
            </span>
          </div>

          <div class="flex items-center justify-between py-3">
            <div>
              <div class="text-[13px] text-ink-3">
                MACD
              </div>
              <div
                class="font-mono text-lg font-medium"
                :class="technicalIndicators.macd >= 0 ? 'text-rise' : 'text-fall'"
              >
                {{ technicalIndicators.macd >= 0 ? '+' : ''
                }}{{ technicalIndicators.macd.toFixed(3) }}
              </div>
            </div>
            <span
              :class="[
                'rounded-full px-2.5 py-0.5 text-xs font-medium',
                technicalIndicators.macd >= 0 ? 'bg-rise/10 text-rise' : 'bg-fall/10 text-fall',
              ]"
            >
              {{ technicalIndicators.macd >= 0 ? '多頭' : '空頭' }}
            </span>
          </div>

          <div class="flex items-center justify-between py-3">
            <div class="text-[13px] text-ink-3">
              布林通道位置
            </div>
            <span
              :class="[
                'rounded-full px-2.5 py-0.5 text-xs font-medium',
                technicalIndicators.bollingerBand === 'upper'
                  ? 'bg-rise/10 text-rise'
                  : technicalIndicators.bollingerBand === 'lower'
                    ? 'bg-fall/10 text-fall'
                    : 'bg-raised text-ink-2',
              ]"
            >
              {{
                technicalIndicators.bollingerBand === 'upper'
                  ? '接近上軌 (可能過熱)'
                  : technicalIndicators.bollingerBand === 'lower'
                    ? '接近下軌 (可能超賣)'
                    : '在中軌附近 (正常區間)'
              }}
            </span>
          </div>

          <div class="flex items-center justify-between gap-4 py-3">
            <div>
              <div class="text-[13px] text-ink-3">
                KD 指標
              </div>
              <div class="flex gap-4 font-mono text-sm text-ink">
                <span>K: {{ technicalIndicators.kd.k.toFixed(1) }}</span>
                <span>D: {{ technicalIndicators.kd.d.toFixed(1) }}</span>
              </div>
            </div>
            <span
              :class="[
                'rounded-full px-2.5 py-0.5 text-xs font-medium',
                technicalIndicators.kd.k > technicalIndicators.kd.d
                  ? 'bg-rise/10 text-rise'
                  : 'bg-fall/10 text-fall',
              ]"
            >
              {{ technicalIndicators.kd.k > technicalIndicators.kd.d ? '黃金交叉' : '死亡交叉' }}
            </span>
          </div>
        </div>
      </section>
    </div>

    <!-- 運勢與績效相關性：各分數區間當天的實際漲跌 -->
    <section
      v-if="correlation"
      class="card"
    >
      <div>
        <h2 class="card-title">
          投資分數與當日漲跌
        </h2>
        <p class="card-meta mt-1">
          <span class="font-medium text-ink-2">{{ selectedPeriod }}</span>
          內每個交易日依投資分數分成三組，統計當天 0050 的實際表現
        </p>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-ink-3">
              <th class="py-2 pr-4 font-normal">
                分數區間
              </th>
              <th class="py-2 pr-4 text-right font-normal">
                交易日數
              </th>
              <th class="py-2 pr-4 text-right font-normal">
                當日平均漲跌
              </th>
              <th class="py-2 text-right font-normal">
                收紅比例
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="band in BANDS"
              :key="band.key"
              class="border-t border-line"
            >
              <td
                class="py-2 pr-4"
                :class="band.tone"
              >
                {{ band.label }}
              </td>
              <td class="py-2 pr-4 text-right font-mono text-ink-2">
                {{ correlation[band.key].days }}（{{ correlation[band.key].share }}%）
              </td>
              <td
                class="py-2 pr-4 text-right font-mono"
                :class="returnClass(correlation[band.key].averageReturn ?? 0)"
              >
                {{ orDash(correlation[band.key].averageReturn, signedPercent) }}
              </td>
              <td class="py-2 text-right font-mono text-ink">
                {{ orDash(correlation[band.key].upRate, value => `${value}%`) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
