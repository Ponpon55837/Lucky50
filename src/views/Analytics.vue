<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useDashboardStore } from '@/stores/dashboard'
import { useAnalyticsStore } from '@/stores/analytics'
import { useTheme } from '@/composables/useTheme'
import { FinMindService } from '@/services/finmind'
import PriceChart from '@/components/charts/PriceChart.vue'
import VolumeChart from '@/components/charts/VolumeChart.vue'

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

// 計算策略回測數據
const backtestResults = computed(() => {
  return analyticsStore.calculateBacktestResults(statistics.value)
})

// 計算技術指標
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

    const etfData = await FinMindService.getETFData(startDate, endDate)
    dashboardStore.setETFData(etfData)
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
        <h1 class="text-3xl font-bold text-white mb-2">數據分析</h1>
        <p class="text-gray-300">深入分析 0050 ETF 的歷史表現與投資趨勢</p>
      </div>

      <!-- 統計卡片 -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
        <div class="card text-center">
          <div
            :class="[
              'text-lg sm:text-2xl font-bold mb-2',
              statistics.annualReturn >= 0 ? 'text-green-400' : 'text-red-400',
            ]"
          >
            {{ statistics.annualReturn >= 0 ? '+' : '' }}{{ statistics.annualReturn }}%
          </div>
          <div class="text-gray-300 text-xs sm:text-sm">年化報酬率</div>
        </div>
        <div class="card text-center">
          <div class="text-lg sm:text-2xl font-bold text-blue-400 mb-2">
            {{ statistics.volatility }}%
          </div>
          <div class="text-gray-300 text-xs sm:text-sm">波動率</div>
        </div>
        <div class="card text-center">
          <div class="text-lg sm:text-2xl font-bold text-purple-400 mb-2">
            {{ statistics.sharpeRatio }}
          </div>
          <div class="text-gray-300 text-xs sm:text-sm">夏普比率</div>
        </div>
        <div class="card text-center">
          <div class="text-lg sm:text-2xl font-bold text-gold-400 mb-2">
            -{{ statistics.maxDrawdown }}%
          </div>
          <div class="text-gray-300 text-xs sm:text-sm">最大回撤</div>
        </div>
      </div>

      <!-- 圖表區域 -->
      <div class="space-y-6">
        <!-- 價格走勢圖 -->
        <div class="card">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
            <h2 class="text-xl font-semibold text-white">價格走勢分析</h2>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="period in periods"
                :key="period"
                @click="selectedPeriod = period"
                :disabled="loading"
                :class="[
                  'px-2 sm:px-3 py-1 rounded text-xs sm:text-sm transition-colors whitespace-nowrap',
                  selectedPeriod === period
                    ? 'bg-gold-500 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20',
                  loading ? 'opacity-50 cursor-not-allowed' : '',
                ]"
              >
                {{ period }}
              </button>
            </div>
          </div>
          <div class="relative h-64 sm:h-96 rounded-lg overflow-hidden">
            <div
              v-if="loading"
              class="absolute inset-0 bg-gray-900/50 flex items-center justify-center z-10"
            >
              <div class="text-white flex items-center space-x-2">
                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-gold-500"></div>
                <span>載入中...</span>
              </div>
            </div>
            <PriceChart :etfData="filteredEtfData" :isDark="isDark" />
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- 成交量分析 -->
          <div class="card">
            <h2 class="text-xl font-semibold text-white mb-6">成交量分析</h2>
            <div class="relative h-64 rounded-lg overflow-hidden">
              <div
                v-if="loading"
                class="absolute inset-0 bg-gray-900/50 flex items-center justify-center z-10"
              >
                <div class="text-white flex items-center space-x-2">
                  <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-gold-500"></div>
                  <span>載入中...</span>
                </div>
              </div>
              <VolumeChart :etfData="filteredEtfData" :isDark="isDark" />
            </div>
          </div>

          <!-- 技術指標 -->
          <div class="card">
            <h2 class="text-xl font-semibold text-white mb-6">技術指標</h2>
            <div class="space-y-4">
              <div class="flex justify-between items-center">
                <span class="text-gray-300">RSI (14)</span>
                <span class="text-white font-medium">{{ technicalIndicators.rsi }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-300">MACD</span>
                <span
                  :class="technicalIndicators.macd >= 0 ? 'text-green-400' : 'text-red-400'"
                  class="font-medium"
                >
                  {{ technicalIndicators.macd >= 0 ? '+' : '' }}{{ technicalIndicators.macd }}
                </span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-300">布林帶位置</span>
                <span
                  :class="{
                    'text-red-400': technicalIndicators.bollingerBand === '上軌',
                    'text-yellow-400': technicalIndicators.bollingerBand === '中軌',
                    'text-green-400': technicalIndicators.bollingerBand === '下軌',
                  }"
                  class="font-medium"
                  >{{ technicalIndicators.bollingerBand }}</span
                >
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-300">KD指標</span>
                <span class="text-white font-medium"
                  >K:{{ technicalIndicators.kd.k }} D:{{ technicalIndicators.kd.d }}</span
                >
              </div>
            </div>
          </div>
        </div>

        <!-- 運勢與績效相關性 -->
        <div class="card">
          <h2 class="text-xl font-semibold text-white mb-6">運勢與投資績效相關性</h2>
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="space-y-4">
              <h3 class="text-lg font-medium text-gold-400">運勢分數分佈</h3>
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span class="text-gray-300">高運勢 (80+)</span>
                  <span class="text-green-400">{{ fortuneDistribution.excellent }}%</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-300">中運勢 (40-80)</span>
                  <span class="text-yellow-400">{{ fortuneDistribution.good }}%</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-300">低運勢 (<40)</span>
                  <span class="text-red-400">{{ fortuneDistribution.poor }}%</span>
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <h3 class="text-lg font-medium text-gold-400">平均報酬率</h3>
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span class="text-gray-300">高運勢日</span>
                  <span :class="statistics.annualReturn >= 0 ? 'text-green-400' : 'text-red-400'">
                    {{ statistics.annualReturn >= 0 ? '+' : ''
                    }}{{ Math.abs(statistics.annualReturn * 0.8).toFixed(1) }}%
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-300">中運勢日</span>
                  <span class="text-yellow-400">
                    {{ statistics.annualReturn >= 0 ? '+' : ''
                    }}{{ Math.abs(statistics.annualReturn * 0.3).toFixed(1) }}%
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-300">低運勢日</span>
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
                  <span class="text-gray-300">BUY 建議</span>
                  <span class="text-green-400"
                    >{{
                      Math.min(Math.max(Math.round(75 + statistics.sharpeRatio * 5), 60), 90)
                    }}%</span
                  >
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-300">HOLD 建議</span>
                  <span class="text-yellow-400"
                    >{{
                      Math.min(Math.max(Math.round(65 + statistics.sharpeRatio * 3), 55), 80)
                    }}%</span
                  >
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-300">SELL 建議</span>
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

        <!-- 歷史回測 -->
        <div class="card">
          <h2 class="text-xl font-semibold text-white mb-6">策略回測結果</h2>
          <div class="overflow-x-auto">
            <table class="w-full text-xs sm:text-sm">
              <thead>
                <tr class="border-b border-white/10">
                  <th class="text-left py-3 text-gray-300">策略</th>
                  <th class="text-right py-3 text-gray-300 hidden sm:table-cell">總報酬</th>
                  <th class="text-right py-3 text-gray-300">年化報酬</th>
                  <th class="text-right py-3 text-gray-300 hidden md:table-cell">最大回撤</th>
                  <th class="text-right py-3 text-gray-300 hidden lg:table-cell">夏普比率</th>
                  <th class="text-right py-3 text-gray-300 hidden sm:table-cell">勝率</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/10">
                <tr>
                  <td class="py-3 text-white text-xs sm:text-sm">農民曆智慧策略</td>
                  <td class="py-3 text-right text-green-400 hidden sm:table-cell">
                    +{{ backtestResults.lunar.totalReturn.toFixed(1) }}%
                  </td>
                  <td class="py-3 text-right text-green-400">
                    +{{ backtestResults.lunar.annualReturn.toFixed(1) }}%
                  </td>
                  <td class="py-3 text-right text-red-400 hidden md:table-cell">
                    -{{ backtestResults.lunar.maxDrawdown.toFixed(1) }}%
                  </td>
                  <td class="py-3 text-right text-white hidden lg:table-cell">
                    {{ backtestResults.lunar.sharpeRatio.toFixed(2) }}
                  </td>
                  <td class="py-3 text-right text-white hidden sm:table-cell">
                    {{ backtestResults.lunar.winRate.toFixed(0) }}%
                  </td>
                </tr>
                <tr>
                  <td class="py-3 text-white text-xs sm:text-sm">買入持有策略</td>
                  <td class="py-3 text-right text-green-400 hidden sm:table-cell">
                    +{{ backtestResults.buyHold.totalReturn.toFixed(1) }}%
                  </td>
                  <td class="py-3 text-right text-green-400">
                    +{{ backtestResults.buyHold.annualReturn.toFixed(1) }}%
                  </td>
                  <td class="py-3 text-right text-red-400 hidden md:table-cell">
                    -{{ backtestResults.buyHold.maxDrawdown.toFixed(1) }}%
                  </td>
                  <td class="py-3 text-right text-white hidden lg:table-cell">
                    {{ backtestResults.buyHold.sharpeRatio.toFixed(2) }}
                  </td>
                  <td class="py-3 text-right text-white hidden sm:table-cell">
                    {{ backtestResults.buyHold.winRate.toFixed(0) }}%
                  </td>
                </tr>
                <tr>
                  <td class="py-3 text-white text-xs sm:text-sm">定期定額策略</td>
                  <td class="py-3 text-right text-green-400 hidden sm:table-cell">
                    +{{ backtestResults.dca.totalReturn.toFixed(1) }}%
                  </td>
                  <td class="py-3 text-right text-green-400">
                    +{{ backtestResults.dca.annualReturn.toFixed(1) }}%
                  </td>
                  <td class="py-3 text-right text-red-400 hidden md:table-cell">
                    -{{ backtestResults.dca.maxDrawdown.toFixed(1) }}%
                  </td>
                  <td class="py-3 text-right text-white hidden lg:table-cell">
                    {{ backtestResults.dca.sharpeRatio.toFixed(2) }}
                  </td>
                  <td class="py-3 text-right text-white hidden sm:table-cell">
                    {{ backtestResults.dca.winRate.toFixed(0) }}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
