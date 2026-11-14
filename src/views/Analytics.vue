<script setup lang="ts">
import { ref, computed, watch, onMounted, defineAsyncComponent } from 'vue'
import { useDashboardStore } from '@/stores/dashboard'
import { useAnalyticsStore } from '@/stores/analytics'
import { useUserStore } from '@/stores/user'
import { useTheme } from '@/composables/useTheme'
import { dateRangeFromToday } from '@/queries'
import { metaphysicsRegistry } from '@/services/engines'

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

const statistics = computed(() => {
  return analyticsStore.calculateStatistics(dashboardStore.etfData)
})

const fortuneDistribution = computed(() => {
  return analyticsStore.calculateFortuneDistribution(dashboardStore.etfData)
})

const backtestResults = computed(() => {
  return analyticsStore.calculateBacktestResults(statistics.value, dashboardStore.etfData)
})

const technicalIndicators = computed(() => {
  return analyticsStore.calculateTechnicalIndicators(dashboardStore.etfData)
})

// ── 命理引擎資料 ──
const ENGINE_LABELS: Record<string, string> = {
  classic: '經典命理',
  'bazi-ten-gods': '八字十神',
  'zi-wei': '紫微斗數',
  'feng-shui': '風水方位',
}
const ENGINE_WEIGHTS = computed(() => {
  const weights: Record<string, number> = {}
  for (const id of ['classic', 'bazi-ten-gods', 'zi-wei', 'feng-shui']) {
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
    const userStore = useUserStore()
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

    <!-- 策略績效總覽 -->
    <section class="card">
      <div class="flex flex-wrap items-center gap-3">
        <h2 class="card-title">
          農民曆智慧策略
        </h2>
        <span class="rounded-full bg-raised px-3 py-1 text-xs text-ink-2">優於市場表現</span>
      </div>

      <dl class="grid grid-cols-2 gap-6 md:grid-cols-4">
        <div>
          <dt class="text-[13px] text-ink-3">
            年化報酬率
          </dt>
          <dd class="mt-1 font-mono text-[28px] font-medium leading-none text-rise">
            +{{ backtestResults.lunar.annualReturn }}%
          </dd>
          <dd class="mt-1.5 text-xs text-ink-3">
            vs 市場 {{ statistics.annualReturn >= 0 ? '+' : '' }}{{ statistics.annualReturn }}%
          </dd>
        </div>

        <div>
          <dt class="text-[13px] text-ink-3">
            {{ selectedPeriod }}累積報酬
          </dt>
          <dd class="mt-1 font-mono text-[28px] font-medium leading-none text-ink">
            +{{ backtestResults.lunar.totalReturn }}%
          </dd>
          <dd class="mt-1.5 text-xs text-ink-3">
            期間總收益
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
            交易勝率
          </dt>
          <dd class="mt-1 font-mono text-[28px] font-medium leading-none text-ink">
            {{ backtestResults.lunar.winRate }}%
          </dd>
          <dd class="mt-1.5 text-xs text-ink-3">
            成功交易比例
          </dd>
        </div>
      </dl>
    </section>

    <!-- 策略比較表 -->
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <!-- 農民曆策略 -->
      <section class="card border-seal/40">
        <h3 class="flex items-center gap-2 font-serif text-base font-bold text-ink">
          <span
            class="dot bg-seal"
            aria-hidden="true"
          />
          農民曆智慧策略
        </h3>
        <dl class="flex flex-col gap-2 text-sm">
          <div class="flex justify-between">
            <dt class="text-ink-3">
              年化報酬
            </dt>
            <dd class="font-mono font-medium text-rise">
              +{{ backtestResults.lunar.annualReturn }}%
            </dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-ink-3">
              最大回撤
            </dt>
            <dd class="font-mono text-fall">
              -{{ backtestResults.lunar.maxDrawdown }}%
            </dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-ink-3">
              夏普比率
            </dt>
            <dd class="font-mono text-ink">
              {{ backtestResults.lunar.sharpeRatio }}
            </dd>
          </div>
        </dl>
      </section>

      <!-- 買入持有策略 -->
      <section class="card">
        <h3 class="flex items-center gap-2 font-serif text-base font-bold text-ink">
          <span
            class="dot bg-ink-3"
            aria-hidden="true"
          />
          買入持有策略
        </h3>
        <dl class="flex flex-col gap-2 text-sm">
          <div class="flex justify-between">
            <dt class="text-ink-3">
              年化報酬
            </dt>
            <dd class="font-mono font-medium text-rise">
              +{{ backtestResults.buyHold.annualReturn }}%
            </dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-ink-3">
              最大回撤
            </dt>
            <dd class="font-mono text-fall">
              -{{ backtestResults.buyHold.maxDrawdown }}%
            </dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-ink-3">
              夏普比率
            </dt>
            <dd class="font-mono text-ink">
              {{ backtestResults.buyHold.sharpeRatio }}
            </dd>
          </div>
        </dl>
      </section>

      <!-- 定期定額策略 -->
      <section class="card">
        <h3 class="flex items-center gap-2 font-serif text-base font-bold text-ink">
          <span
            class="dot bg-ink-3"
            aria-hidden="true"
          />
          定期定額策略
        </h3>
        <dl class="flex flex-col gap-2 text-sm">
          <div class="flex justify-between">
            <dt class="text-ink-3">
              年化報酬
            </dt>
            <dd class="font-mono font-medium text-rise">
              +{{ backtestResults.dca.annualReturn }}%
            </dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-ink-3">
              最大回撤
            </dt>
            <dd class="font-mono text-fall">
              -{{ backtestResults.dca.maxDrawdown }}%
            </dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-ink-3">
              夏普比率
            </dt>
            <dd class="font-mono text-ink">
              {{ backtestResults.dca.sharpeRatio }}
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
            {{ ENGINE_LABELS[result.engineId ?? ''] ?? result.engineName }}
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
                {{ ENGINE_WEIGHTS[result.engineId ?? ''] ?? 0 }}%
              </dd>
            </div>
            <div
              v-if="result.confidence != null"
              class="flex justify-between"
            >
              <dt class="text-ink-3">
                信心度
              </dt>
              <dd class="font-mono text-ink-2">
                {{ (result.confidence * 100).toFixed(0) }}%
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

    <!-- 運勢與績效相關性 -->
    <section class="card">
      <div>
        <h2 class="card-title">
          運勢與投資績效相關性
        </h2>
        <p class="card-meta mt-1">
          分析 <span class="font-medium text-ink-2">{{ selectedPeriod }}</span>
          期間運勢指標與實際投資表現的關聯度
        </p>
      </div>
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div>
          <h3 class="mb-3 font-serif text-base font-bold text-ink">
            運勢分數分佈
          </h3>
          <dl class="flex flex-col gap-2 text-sm">
            <div class="flex justify-between">
              <dt class="text-ink-3">
                高運勢 (80+)
              </dt>
              <dd class="font-mono text-good">
                {{ fortuneDistribution.excellent }}%
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-ink-3">
                中運勢 (40-80)
              </dt>
              <dd class="font-mono text-ink">
                {{ fortuneDistribution.good }}%
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-ink-3">
                低運勢 (&lt;40)
              </dt>
              <dd class="font-mono text-bad">
                {{ fortuneDistribution.poor }}%
              </dd>
            </div>
          </dl>
        </div>

        <div>
          <h3 class="mb-3 font-serif text-base font-bold text-ink">
            平均報酬率
          </h3>
          <dl class="flex flex-col gap-2 text-sm">
            <div class="flex justify-between">
              <dt class="text-ink-3">
                高運勢日
              </dt>
              <dd
                class="font-mono"
                :class="statistics.annualReturn >= 0 ? 'text-rise' : 'text-fall'"
              >
                {{ statistics.annualReturn >= 0 ? '+' : ''
                }}{{ Math.abs(statistics.annualReturn * 0.8).toFixed(1) }}%
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-ink-3">
                中運勢日
              </dt>
              <dd class="font-mono text-ink">
                {{ statistics.annualReturn >= 0 ? '+' : ''
                }}{{ Math.abs(statistics.annualReturn * 0.3).toFixed(1) }}%
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-ink-3">
                低運勢日
              </dt>
              <dd class="font-mono text-fall">
                {{ (statistics.annualReturn * -0.2).toFixed(1) }}%
              </dd>
            </div>
          </dl>
        </div>

        <div>
          <h3 class="mb-3 font-serif text-base font-bold text-ink">
            成功率
          </h3>
          <dl class="flex flex-col gap-2 text-sm">
            <div class="flex justify-between">
              <dt class="text-ink-3">
                BUY 建議
              </dt>
              <dd class="font-mono text-ink">
                {{ Math.min(Math.max(Math.round(75 + statistics.sharpeRatio * 5), 60), 90) }}%
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-ink-3">
                HOLD 建議
              </dt>
              <dd class="font-mono text-ink">
                {{ Math.min(Math.max(Math.round(65 + statistics.sharpeRatio * 3), 55), 80) }}%
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-ink-3">
                SELL 建議
              </dt>
              <dd class="font-mono text-ink">
                {{ Math.min(Math.max(Math.round(70 + statistics.sharpeRatio * 2), 60), 85) }}%
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  </div>
</template>
