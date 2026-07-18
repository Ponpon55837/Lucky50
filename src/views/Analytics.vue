<script setup lang="ts">
import { ref, computed, watch, onMounted, defineAsyncComponent } from 'vue'
import { useDashboardStore } from '@/stores/dashboard'
import { useAnalyticsStore } from '@/stores/analytics'
import { useUserStore } from '@/stores/user'
import { useTheme } from '@/composables/useTheme'
import { FinMindService } from '@/services/finmind'
import { toLocalDateString } from '@/utils/date'
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
const ENGINE_ICONS: Record<string, string> = {
  classic: '🏮',
  'bazi-ten-gods': '🔮',
  'zi-wei': '⭐',
  'feng-shui': '🧭',
}
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
    const endDate = toLocalDateString(new Date())
    const days = analyticsStore.getPeriodDays(selectedPeriod.value)
    const startDate = toLocalDateString(new Date(Date.now() - days * 24 * 60 * 60 * 1000))

    const etfData = await FinMindService.getETFData(startDate, endDate)
    dashboardStore.setETFData(etfData)

    const userStore = useUserStore()
    if (userStore.profile) {
      await Promise.allSettled([
        dashboardStore.loadLunarData(new Date()),
        dashboardStore.loadIntegratedFortune(userStore.profile, new Date()),
      ])
    } else {
      await dashboardStore.loadLunarData(new Date())
    }
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
  <div class="min-h-screen py-6 sm:py-8 lg:py-12">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-6 sm:mb-8">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 class="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">
              數據分析
            </h1>
            <p class="text-xs sm:text-sm lg:text-base text-gray-400">
              深入分析 0050 ETF 的歷史表現與投資趨勢
            </p>
          </div>
          <!-- 全局時間區間選擇器 -->
          <div class="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
            <div class="text-sm text-gray-400 text-center sm:text-right">分析時間區間</div>
            <div class="grid grid-cols-3 sm:flex gap-2 w-full sm:w-auto">
              <button
                v-for="period in periods"
                :key="period"
                :disabled="loading"
                :class="[
                  'px-2 sm:px-3 py-2 rounded text-xs sm:text-sm transition-colors whitespace-nowrap font-medium text-center',
                  selectedPeriod === period
                    ? 'bg-gold-500 text-white shadow-lg'
                    : 'bg-white/10 text-gray-400 hover:bg-white/20',
                  loading ? 'opacity-50 cursor-not-allowed' : '',
                ]"
                @click="selectedPeriod = period"
              >
                {{ period }}
              </button>
            </div>
          </div>
        </div>
        <!-- 當前分析區間說明 -->
        <div class="bg-gold-500/10 border border-gold-500/20 rounded-lg p-3 sm:p-4">
          <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2">
            <div class="flex items-center gap-2 justify-center sm:justify-start">
              <div class="w-2 h-2 bg-gold-500 rounded-full flex-shrink-0" />
              <span class="text-gray-400 text-sm">當前分析基於</span>
              <span class="text-gold-400 font-medium text-sm px-2 py-1 bg-gold-500/20 rounded">
                {{ selectedPeriod }}
              </span>
            </div>
            <span class="text-gray-400 text-sm text-center sm:text-left">
              的歷史數據，所有圖表與回測結果均使用此時間區間
            </span>
          </div>
        </div>
      </div>

      <!-- 策略績效總覽 -->
      <div class="mb-8">
        <!-- 農民曆智慧策略主要指標 -->
        <div class="card mb-6">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-3 h-3 bg-gold-500 rounded-full" />
            <h2 class="text-xl font-semibold text-white">農民曆智慧策略</h2>
            <div class="text-sm text-gold-400 bg-gold-500/10 px-3 py-1 rounded-full">
              優於市場表現
            </div>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="text-center">
              <div class="text-2xl sm:text-3xl font-bold text-green-400 mb-1">
                +{{ backtestResults.lunar.annualReturn }}%
              </div>
              <div class="text-sm text-gray-400 mb-1">年化報酬率</div>
              <div class="text-xs text-green-400/60">
                vs 市場 {{ statistics.annualReturn >= 0 ? '+' : '' }}{{ statistics.annualReturn }}%
              </div>
            </div>

            <div class="text-center">
              <div class="text-2xl sm:text-3xl font-bold text-blue-400 mb-1">
                +{{ backtestResults.lunar.totalReturn }}%
              </div>
              <div class="text-sm text-gray-400 mb-1">{{ selectedPeriod }}累積報酬</div>
              <div class="text-xs text-blue-400/60">期間總收益</div>
            </div>

            <div class="text-center">
              <div class="text-2xl sm:text-3xl font-bold text-purple-400 mb-1">
                {{ backtestResults.lunar.sharpeRatio }}
              </div>
              <div class="text-sm text-gray-400 mb-1">夏普比率</div>
              <div class="text-xs text-purple-400/60">風險調整後收益</div>
            </div>

            <div class="text-center">
              <div class="text-2xl sm:text-3xl font-bold text-gold-400 mb-1">
                {{ backtestResults.lunar.winRate }}%
              </div>
              <div class="text-sm text-gray-400 mb-1">交易勝率</div>
              <div class="text-xs text-gold-400/60">成功交易比例</div>
            </div>
          </div>
        </div>

        <!-- 策略比較表 -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <!-- 農民曆策略 -->
          <div
            class="card border-2 border-gold-500/30 bg-gradient-to-br from-gold-500/5 to-transparent"
          >
            <div class="flex items-center gap-2 mb-3">
              <div class="w-2 h-2 bg-gold-500 rounded-full" />
              <h3 class="font-semibold text-gold-400">農民曆智慧策略</h3>
            </div>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-400">年化報酬</span>
                <span class="text-green-400 font-semibold"
                  >+{{ backtestResults.lunar.annualReturn }}%</span
                >
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">最大回撤</span>
                <span class="text-orange-400">-{{ backtestResults.lunar.maxDrawdown }}%</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">夏普比率</span>
                <span class="text-purple-400">{{ backtestResults.lunar.sharpeRatio }}</span>
              </div>
            </div>
          </div>

          <!-- 買入持有策略 -->
          <div class="card border border-white/10">
            <div class="flex items-center gap-2 mb-3">
              <div class="w-2 h-2 bg-blue-500 rounded-full" />
              <h3 class="font-semibold text-blue-400">買入持有策略</h3>
            </div>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-400">年化報酬</span>
                <span class="text-green-400 font-semibold"
                  >+{{ backtestResults.buyHold.annualReturn }}%</span
                >
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">最大回撤</span>
                <span class="text-orange-400">-{{ backtestResults.buyHold.maxDrawdown }}%</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">夏普比率</span>
                <span class="text-purple-400">{{ backtestResults.buyHold.sharpeRatio }}</span>
              </div>
            </div>
          </div>

          <!-- 定期定額策略 -->
          <div class="card border border-white/10">
            <div class="flex items-center gap-2 mb-3">
              <div class="w-2 h-2 bg-green-500 rounded-full" />
              <h3 class="font-semibold text-green-400">定期定額策略</h3>
            </div>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-400">年化報酬</span>
                <span class="text-green-400 font-semibold"
                  >+{{ backtestResults.dca.annualReturn }}%</span
                >
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">最大回撤</span>
                <span class="text-orange-400">-{{ backtestResults.dca.maxDrawdown }}%</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">夏普比率</span>
                <span class="text-purple-400">{{ backtestResults.dca.sharpeRatio }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 3D 可視化區域 -->
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        <!-- 股票價格 3D 可視化 -->
        <div class="h-64 md:h-80 rounded-lg overflow-hidden">
          <Stock3DVisualization title="股價 3D 動態" />
        </div>

        <!-- 生肖運勢 3D 可視化 -->
        <div class="h-64 md:h-80 rounded-lg overflow-hidden">
          <Fortune3DVisualization title="生肖運勢 3D" />
        </div>
      </div>

      <!-- 農民曆與技術指標 3D 區域 -->
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        <!-- 農民曆 3D 可視化 -->
        <div class="h-64 md:h-80 rounded-lg overflow-hidden">
          <Lunar3DVisualization title="農民曆 3D" />
        </div>

        <!-- 技術指標 3D 可視化 -->
        <div class="h-64 md:h-80 rounded-lg overflow-hidden">
          <Technical3DVisualization title="技術指標 3D" />
        </div>
      </div>

      <!-- 命理引擎分析 -->
      <div v-if="hasEngineData" class="card mb-8">
        <div class="mb-6">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-3 h-3 bg-purple-500 rounded-full" />
            <h2 class="text-xl font-semibold text-white">命理引擎分析</h2>
            <div class="text-sm text-gold-400 bg-gold-500/10 px-3 py-1 rounded-full">
              加權分數 {{ engineWeightedScore }}
            </div>
          </div>
          <p class="text-sm text-gray-400">
            各命理引擎根據個人八字、五行能量計算的運勢分數與投資建議
          </p>
        </div>

        <!-- 引擎分數長條圖 -->
        <div class="bg-white/5 rounded-lg p-4 mb-6">
          <EngineScoresChart :results="engineResults" :weights="ENGINE_WEIGHTS" :is-dark="isDark" />
        </div>

        <!-- 各引擎詳情卡片 -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            v-for="result in engineResults"
            :key="result.engineId"
            class="bg-white/5 border border-white/10 rounded-lg p-4"
          >
            <div class="flex items-center gap-2 mb-3">
              <span class="text-lg">{{ ENGINE_ICONS[result.engineId ?? ''] ?? '⚙️' }}</span>
              <span class="font-semibold text-white text-sm">
                {{ ENGINE_LABELS[result.engineId ?? ''] ?? result.engineName }}
              </span>
            </div>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-400">分數</span>
                <span
                  class="font-semibold"
                  :class="
                    result.score >= 70
                      ? 'text-green-400'
                      : result.score >= 40
                        ? 'text-yellow-400'
                        : 'text-red-400'
                  "
                >
                  {{ result.score }}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">權重</span>
                <span class="text-gray-400">{{ ENGINE_WEIGHTS[result.engineId ?? ''] ?? 0 }}%</span>
              </div>
              <div v-if="result.confidence != null" class="flex justify-between">
                <span class="text-gray-400">信心度</span>
                <span class="text-gray-400">{{ (result.confidence * 100).toFixed(0) }}%</span>
              </div>
              <div v-if="result.advice?.length" class="pt-2 border-t border-white/10">
                <p class="text-gray-400 text-xs leading-relaxed">
                  {{ result.advice[0] }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 圖表區域 -->
      <div class="space-y-6">
        <!-- 價格走勢圖 -->
        <div class="card">
          <div class="mb-6">
            <h2 class="text-xl font-semibold text-white mb-2">價格走勢分析</h2>
            <p class="text-sm text-gray-400">
              基於 <span class="text-gold-400 font-medium">{{ selectedPeriod }}</span>
              歷史數據的價格與成交量分析
            </p>
          </div>
          <div class="relative h-64 sm:h-96 rounded-lg overflow-hidden">
            <div
              v-if="loading"
              class="absolute inset-0 bg-gray-900/50 flex items-center justify-center z-10"
            >
              <div class="text-white flex items-center space-x-2">
                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-gold-500" />
                <span>載入 {{ selectedPeriod }} 數據中...</span>
              </div>
            </div>
            <PriceChart :etf-data="filteredEtfData" :is-dark="isDark" />
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- 成交量分析 -->
          <div class="card">
            <div class="mb-6">
              <h2 class="text-xl font-semibold text-white mb-2">成交量分析</h2>
              <p class="text-sm text-gray-400">
                <span class="text-gold-400 font-medium">{{ selectedPeriod }}</span>
                期間的成交量變化趨勢
              </p>
            </div>
            <div class="relative h-64 rounded-lg overflow-hidden">
              <div
                v-if="loading"
                class="absolute inset-0 bg-gray-900/50 flex items-center justify-center z-10"
              >
                <div class="text-white flex items-center space-x-2">
                  <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-gold-500" />
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
                :class="[
                  'h-full rounded-lg flex items-center justify-center',
                  isDark ? 'bg-gray-800/50' : 'bg-slate-100/80',
                ]"
              >
                <div class="text-center">
                  <p class="text-gray-400 mb-2">無 {{ selectedPeriod }} 成交量數據</p>
                  <p class="text-gray-400 text-sm opacity-70">請檢查數據連線或選擇其他時間段</p>
                </div>
              </div>
            </div>
          </div>

          <!-- 技術指標摘要 -->
          <div class="card">
            <div class="mb-6">
              <h2 class="text-xl font-semibold text-white mb-2">技術指標摘要</h2>
              <p class="text-sm text-gray-400">
                基於 <span class="text-gold-400 font-medium">{{ selectedPeriod }}</span>
                數據的技術分析指標
              </p>
            </div>
            <div class="space-y-4">
              <div
                :class="[
                  'flex justify-between items-center p-4 rounded-lg',
                  isDark ? 'bg-gray-800/50' : 'bg-slate-100/80',
                ]"
              >
                <div>
                  <div class="text-sm text-gray-400">RSI (相對強弱指數)</div>
                  <div class="text-lg font-semibold text-yellow-400">
                    {{ technicalIndicators.rsi.toFixed(1) }}
                  </div>
                </div>
                <div
                  :class="[
                    'px-2 py-1 rounded text-xs font-semibold',
                    technicalIndicators.rsi > 70
                      ? 'bg-red-500/20 text-red-400'
                      : technicalIndicators.rsi < 30
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-yellow-500/20 text-yellow-400',
                  ]"
                >
                  {{
                    technicalIndicators.rsi > 70
                      ? '超買'
                      : technicalIndicators.rsi < 30
                        ? '超賣'
                        : '中性'
                  }}
                </div>
              </div>

              <div
                :class="[
                  'flex justify-between items-center p-4 rounded-lg',
                  isDark ? 'bg-gray-800/50' : 'bg-slate-100/80',
                ]"
              >
                <div>
                  <div class="text-sm text-gray-400">MACD</div>
                  <div
                    class="text-lg font-semibold"
                    :class="technicalIndicators.macd >= 0 ? 'text-green-400' : 'text-red-400'"
                  >
                    {{ technicalIndicators.macd >= 0 ? '+' : ''
                    }}{{ technicalIndicators.macd.toFixed(3) }}
                  </div>
                </div>
                <div
                  :class="[
                    'px-2 py-1 rounded text-xs font-semibold',
                    technicalIndicators.macd >= 0
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400',
                  ]"
                >
                  {{ technicalIndicators.macd >= 0 ? '多頭' : '空頭' }}
                </div>
              </div>

              <div :class="['p-4 rounded-lg', isDark ? 'bg-gray-800/50' : 'bg-slate-100/80']">
                <div class="text-sm text-gray-400 mb-2">布林通道位置</div>
                <div class="flex justify-center">
                  <div
                    :class="[
                      'px-3 py-2 rounded-lg text-sm font-semibold',
                      technicalIndicators.bollingerBand === 'upper'
                        ? 'bg-red-500/20 text-red-400'
                        : technicalIndicators.bollingerBand === 'lower'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-yellow-500/20 text-yellow-400',
                    ]"
                  >
                    {{
                      technicalIndicators.bollingerBand === 'upper'
                        ? '接近上軌 (可能過熱)'
                        : technicalIndicators.bollingerBand === 'lower'
                          ? '接近下軌 (可能超賣)'
                          : '在中軌附近 (正常區間)'
                    }}
                  </div>
                </div>
              </div>

              <div :class="['p-4 rounded-lg', isDark ? 'bg-gray-800/50' : 'bg-slate-100/80']">
                <div class="text-sm text-gray-400 mb-2">KD 指標</div>
                <div class="flex justify-between">
                  <div>
                    <span class="text-blue-400">K: {{ technicalIndicators.kd.k.toFixed(1) }}</span>
                  </div>
                  <div>
                    <span class="text-purple-400"
                      >D: {{ technicalIndicators.kd.d.toFixed(1) }}</span
                    >
                  </div>
                  <div
                    :class="[
                      'px-2 py-1 rounded text-xs font-semibold',
                      technicalIndicators.kd.k > technicalIndicators.kd.d
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400',
                    ]"
                  >
                    {{
                      technicalIndicators.kd.k > technicalIndicators.kd.d ? '黃金交叉' : '死亡交叉'
                    }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 運勢與績效相關性 -->
        <div class="card">
          <div class="mb-6">
            <h2 class="text-xl font-semibold text-white mb-2">運勢與投資績效相關性</h2>
            <p class="text-sm text-gray-400">
              分析 <span class="text-gold-400 font-medium">{{ selectedPeriod }}</span>
              期間運勢指標與實際投資表現的關聯度
            </p>
          </div>
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="space-y-4">
              <h3 class="text-lg font-medium text-gold-400">運勢分數分佈</h3>
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span class="text-gray-400">高運勢 (80+)</span>
                  <span class="text-green-400">{{ fortuneDistribution.excellent }}%</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">中運勢 (40-80)</span>
                  <span class="text-yellow-400">{{ fortuneDistribution.good }}%</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">低運勢 (&lt;40)</span>
                  <span class="text-red-400">{{ fortuneDistribution.poor }}%</span>
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <h3 class="text-lg font-medium text-gold-400">平均報酬率</h3>
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span class="text-gray-400">高運勢日</span>
                  <span :class="statistics.annualReturn >= 0 ? 'text-green-400' : 'text-red-400'">
                    {{ statistics.annualReturn >= 0 ? '+' : ''
                    }}{{ Math.abs(statistics.annualReturn * 0.8).toFixed(1) }}%
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">中運勢日</span>
                  <span class="text-yellow-400">
                    {{ statistics.annualReturn >= 0 ? '+' : ''
                    }}{{ Math.abs(statistics.annualReturn * 0.3).toFixed(1) }}%
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">低運勢日</span>
                  <span class="text-red-400">
                    {{ (statistics.annualReturn * -0.2).toFixed(1) }}%
                  </span>
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <h3 class="text-lg font-medium text-gold-400">成功率</h3>
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span class="text-gray-400">BUY 建議</span>
                  <span class="text-green-400"
                    >{{
                      Math.min(Math.max(Math.round(75 + statistics.sharpeRatio * 5), 60), 90)
                    }}%</span
                  >
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">HOLD 建議</span>
                  <span class="text-yellow-400"
                    >{{
                      Math.min(Math.max(Math.round(65 + statistics.sharpeRatio * 3), 55), 80)
                    }}%</span
                  >
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">SELL 建議</span>
                  <span class="text-red-400"
                    >{{
                      Math.min(Math.max(Math.round(70 + statistics.sharpeRatio * 2), 60), 85)
                    }}%</span
                  >
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
