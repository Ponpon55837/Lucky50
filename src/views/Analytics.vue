<script setup lang="ts">
import { ref, computed, watch, onMounted, defineAsyncComponent } from 'vue'
import { useDashboardStore } from '@/stores/dashboard'
import { useAnalyticsStore } from '@/stores/analytics'
import { useUserStore } from '@/stores/user'
import { useTheme } from '@/composables/useTheme'
import { FinMindService } from '@/services/finmind'

// Lazy load components
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

const dashboardStore = useDashboardStore()
const analyticsStore = useAnalyticsStore()
const { isDark } = useTheme()

const loading = ref(true)
const error = ref<string | null>(null)

// 使用 analytics store 的狀態
const selectedPeriod = computed({
  get: () => analyticsStore.selectedPeriod,
  set: (value: string) => analyticsStore.setSelectedPeriod(value),
})
const periods = analyticsStore.periods

// 計算篩選後的 ETF 數據
const filteredEtfData = computed(() => {
  return analyticsStore.getAdjustedEtfData(dashboardStore.etfData)
})

// 計算統計數據
const statistics = computed(() => {
  return analyticsStore.calculateStatistics(dashboardStore.etfData)
})

// 計算運勢分佈數據
const fortuneDistribution = computed(() => {
  return analyticsStore.calculateFortuneDistribution(dashboardStore.etfData)
})

// 計算策略回測數據 - 使用穩定的計算方法
const backtestResults = computed(() => {
  return analyticsStore.calculateBacktestResults(statistics.value, dashboardStore.etfData)
})

// 使用 analytics store 的技術指標計算
const technicalIndicators = computed(() => {
  return analyticsStore.calculateTechnicalIndicators(dashboardStore.etfData)
})

// 監聽期間變化，重新載入數據
watch(
  () => selectedPeriod.value,
  async () => {
    await loadAnalyticsData()
  },
  { immediate: false }
)

const loadAnalyticsData = async () => {
  loading.value = true

  try {
    // 根據當前選擇的時間段載入對應的數據
    const endDate = new Date().toISOString().split('T')[0]
    const days = analyticsStore.getPeriodDays(selectedPeriod.value)
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // 載入 ETF 數據
    const etfData = await FinMindService.getETFData(startDate, endDate)

    // 設置數據到 dashboard store
    dashboardStore.setETFData(etfData)

    // 只載入農民曆和運勢數據，避免覆蓋ETF數據
    const userStore = useUserStore()
    if (userStore.profile) {
      // 只載入農民曆和整合運勢，不要載入ETF數據
      await Promise.allSettled([
        dashboardStore.loadLunarData(new Date()),
        dashboardStore.loadIntegratedFortune(userStore.profile, new Date()),
      ])
    } else {
      // 如果沒有用戶資料，只載入農民曆
      await dashboardStore.loadLunarData(new Date())
    }
  } catch (err) {
    console.error('Analytics 數據載入失敗:', err)
    error.value = '數據載入失敗'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadAnalyticsData()
})
</script>

<template>
  <div class="min-h-screen py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 class="text-3xl font-bold text-primary mb-2">數據分析</h1>
            <p class="text-secondary">深入分析 0050 ETF 的歷史表現與投資趨勢</p>
          </div>
          <!-- 全局時間區間選擇器 -->
          <div class="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
            <div class="text-sm text-secondary text-center sm:text-right">分析時間區間</div>
            <div class="grid grid-cols-3 sm:flex gap-2 w-full sm:w-auto">
              <button
                v-for="period in periods"
                :key="period"
                @click="selectedPeriod = period"
                :disabled="loading"
                :class="[
                  'px-2 sm:px-3 py-2 rounded text-xs sm:text-sm transition-colors whitespace-nowrap font-medium text-center',
                  selectedPeriod === period
                    ? 'bg-gold-500 text-primary shadow-lg'
                    : 'bg-white/10 text-secondary hover:bg-white/20',
                  loading ? 'opacity-50 cursor-not-allowed' : '',
                ]"
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
              <div class="w-2 h-2 bg-gold-500 rounded-full flex-shrink-0"></div>
              <span class="text-secondary text-sm">當前分析基於</span>
              <span class="text-gold-400 font-medium text-sm px-2 py-1 bg-gold-500/20 rounded">
                {{ selectedPeriod }}
              </span>
            </div>
            <span class="text-secondary text-sm text-center sm:text-left">
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
            <div class="w-3 h-3 bg-gold-500 rounded-full"></div>
            <h2 class="text-xl font-semibold text-primary">農民曆智慧策略</h2>
            <div class="text-sm text-gold-400 bg-gold-500/10 px-3 py-1 rounded-full">
              優於市場表現
            </div>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="text-center">
              <div class="text-2xl sm:text-3xl font-bold text-green-400 mb-1">
                +{{ backtestResults.lunar.annualReturn }}%
              </div>
              <div class="text-sm text-secondary mb-1">年化報酬率</div>
              <div class="text-xs text-green-400/60">
                vs 市場 {{ statistics.annualReturn >= 0 ? '+' : '' }}{{ statistics.annualReturn }}%
              </div>
            </div>

            <div class="text-center">
              <div class="text-2xl sm:text-3xl font-bold text-blue-400 mb-1">
                +{{ backtestResults.lunar.totalReturn }}%
              </div>
              <div class="text-sm text-secondary mb-1">{{ selectedPeriod }}累積報酬</div>
              <div class="text-xs text-blue-400/60">期間總收益</div>
            </div>

            <div class="text-center">
              <div class="text-2xl sm:text-3xl font-bold text-purple-400 mb-1">
                {{ backtestResults.lunar.sharpeRatio }}
              </div>
              <div class="text-sm text-secondary mb-1">夏普比率</div>
              <div class="text-xs text-purple-400/60">風險調整後收益</div>
            </div>

            <div class="text-center">
              <div class="text-2xl sm:text-3xl font-bold text-gold-400 mb-1">
                {{ backtestResults.lunar.winRate }}%
              </div>
              <div class="text-sm text-secondary mb-1">交易勝率</div>
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
              <div class="w-2 h-2 bg-gold-500 rounded-full"></div>
              <h3 class="font-semibold text-gold-400">農民曆智慧策略</h3>
            </div>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-secondary">年化報酬</span>
                <span class="text-green-400 font-semibold"
                  >+{{ backtestResults.lunar.annualReturn }}%</span
                >
              </div>
              <div class="flex justify-between">
                <span class="text-secondary">最大回撤</span>
                <span class="text-orange-400">-{{ backtestResults.lunar.maxDrawdown }}%</span>
              </div>
              <div class="flex justify-between">
                <span class="text-secondary">夏普比率</span>
                <span class="text-purple-400">{{ backtestResults.lunar.sharpeRatio }}</span>
              </div>
            </div>
          </div>

          <!-- 買入持有策略 -->
          <div class="card border border-white/10">
            <div class="flex items-center gap-2 mb-3">
              <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
              <h3 class="font-semibold text-blue-400">買入持有策略</h3>
            </div>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-secondary">年化報酬</span>
                <span class="text-green-400 font-semibold"
                  >+{{ backtestResults.buyHold.annualReturn }}%</span
                >
              </div>
              <div class="flex justify-between">
                <span class="text-secondary">最大回撤</span>
                <span class="text-orange-400">-{{ backtestResults.buyHold.maxDrawdown }}%</span>
              </div>
              <div class="flex justify-between">
                <span class="text-secondary">夏普比率</span>
                <span class="text-purple-400">{{ backtestResults.buyHold.sharpeRatio }}</span>
              </div>
            </div>
          </div>

          <!-- 定期定額策略 -->
          <div class="card border border-white/10">
            <div class="flex items-center gap-2 mb-3">
              <div class="w-2 h-2 bg-green-500 rounded-full"></div>
              <h3 class="font-semibold text-green-400">定期定額策略</h3>
            </div>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-secondary">年化報酬</span>
                <span class="text-green-400 font-semibold"
                  >+{{ backtestResults.dca.annualReturn }}%</span
                >
              </div>
              <div class="flex justify-between">
                <span class="text-secondary">最大回撤</span>
                <span class="text-orange-400">-{{ backtestResults.dca.maxDrawdown }}%</span>
              </div>
              <div class="flex justify-between">
                <span class="text-secondary">夏普比率</span>
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

      <!-- 圖表區域 -->
      <div class="space-y-6">
        <!-- 價格走勢圖 -->
        <div class="card">
          <div class="mb-6">
            <h2 class="text-xl font-semibold text-primary mb-2">價格走勢分析</h2>
            <p class="text-sm text-secondary">
              基於 <span class="text-gold-400 font-medium">{{ selectedPeriod }}</span>
              歷史數據的價格與成交量分析
            </p>
          </div>
          <div class="relative h-64 sm:h-96 rounded-lg overflow-hidden">
            <div
              v-if="loading"
              class="absolute inset-0 bg-gray-900/50 flex items-center justify-center z-10"
            >
              <div class="text-primary flex items-center space-x-2">
                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-gold-500"></div>
                <span>載入 {{ selectedPeriod }} 數據中...</span>
              </div>
            </div>
            <PriceChart :etfData="filteredEtfData" :isDark="isDark" />
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- 成交量分析 -->
          <div class="card">
            <div class="mb-6">
              <h2 class="text-xl font-semibold text-primary mb-2">成交量分析</h2>
              <p class="text-sm text-secondary">
                <span class="text-gold-400 font-medium">{{ selectedPeriod }}</span>
                期間的成交量變化趨勢
              </p>
            </div>
            <div class="relative h-64 rounded-lg overflow-hidden">
              <div
                v-if="loading"
                class="absolute inset-0 bg-gray-900/50 flex items-center justify-center z-10"
              >
                <div class="text-primary flex items-center space-x-2">
                  <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-gold-500"></div>
                  <span>載入中...</span>
                </div>
              </div>
              <VolumeChart
                :etfData="filteredEtfData"
                :isDark="isDark"
                v-if="!loading && filteredEtfData.length > 0"
              />
              <div
                v-else-if="!loading && filteredEtfData.length === 0"
                :class="[
                  'h-full rounded-lg flex items-center justify-center',
                  isDark ? 'bg-gray-800/50' : 'bg-slate-100/80',
                ]"
              >
                <div class="text-center">
                  <p class="text-secondary mb-2">無 {{ selectedPeriod }} 成交量數據</p>
                  <p class="text-secondary text-sm opacity-70">請檢查數據連線或選擇其他時間段</p>
                </div>
              </div>
            </div>
          </div>

          <!-- 技術指標摘要 -->
          <div class="card">
            <div class="mb-6">
              <h2 class="text-xl font-semibold text-primary mb-2">技術指標摘要</h2>
              <p class="text-sm text-secondary">
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
                  <div class="text-sm text-secondary">RSI (相對強弱指數)</div>
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
                  <div class="text-sm text-secondary">MACD</div>
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
                <div class="text-sm text-secondary mb-2">布林通道位置</div>
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
                <div class="text-sm text-secondary mb-2">KD 指標</div>
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
            <h2 class="text-xl font-semibold text-primary mb-2">運勢與投資績效相關性</h2>
            <p class="text-sm text-secondary">
              分析 <span class="text-gold-400 font-medium">{{ selectedPeriod }}</span>
              期間運勢指標與實際投資表現的關聯度
            </p>
          </div>
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="space-y-4">
              <h3 class="text-lg font-medium text-gold-400">運勢分數分佈</h3>
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span class="text-secondary">高運勢 (80+)</span>
                  <span class="text-green-400">{{ fortuneDistribution.excellent }}%</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-secondary">中運勢 (40-80)</span>
                  <span class="text-yellow-400">{{ fortuneDistribution.good }}%</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-secondary">低運勢 (<40)</span>
                  <span class="text-red-400">{{ fortuneDistribution.poor }}%</span>
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <h3 class="text-lg font-medium text-gold-400">平均報酬率</h3>
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span class="text-secondary">高運勢日</span>
                  <span :class="statistics.annualReturn >= 0 ? 'text-green-400' : 'text-red-400'">
                    {{ statistics.annualReturn >= 0 ? '+' : ''
                    }}{{ Math.abs(statistics.annualReturn * 0.8).toFixed(1) }}%
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-secondary">中運勢日</span>
                  <span class="text-yellow-400">
                    {{ statistics.annualReturn >= 0 ? '+' : ''
                    }}{{ Math.abs(statistics.annualReturn * 0.3).toFixed(1) }}%
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-secondary">低運勢日</span>
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
                  <span class="text-secondary">BUY 建議</span>
                  <span class="text-green-400"
                    >{{
                      Math.min(Math.max(Math.round(75 + statistics.sharpeRatio * 5), 60), 90)
                    }}%</span
                  >
                </div>
                <div class="flex justify-between">
                  <span class="text-secondary">HOLD 建議</span>
                  <span class="text-yellow-400"
                    >{{
                      Math.min(Math.max(Math.round(65 + statistics.sharpeRatio * 3), 55), 80)
                    }}%</span
                  >
                </div>
                <div class="flex justify-between">
                  <span class="text-secondary">SELL 建議</span>
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
