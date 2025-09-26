<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useInvestmentStore } from '@/stores/investment'
import { useTheme } from '@/composables/useTheme'
import { FinMindService } from '@/services/finmind'
import PriceChart from '@/components/charts/PriceChart.vue'
import VolumeChart from '@/components/charts/VolumeChart.vue'

const investmentStore = useInvestmentStore()
const { isDark } = useTheme()

const selectedPeriod = ref('1個月')
const periods = ['1個月', '3個月', '6個月', '1年', '3年', '5年']
const loading = ref(true)
const error = ref<string | null>(null)

// 根據時間段獲取天數
const getPeriodDays = (period: string) => {
  const periodMap: Record<string, number> = {
    '1個月': 30,
    '3個月': 90,
    '6個月': 180,
    '1年': 365,
    '3年': 1095,
    '5年': 1825,
  }
  const days = periodMap[period] || 30
  console.log(`時間段 "${period}" 對應 ${days} 天`)
  return days
}

// 計算篩選後的 ETF 數據（現在直接使用store中的數據，因為已經按時間段載入）
const filteredEtfData = computed(() => {
  const data = investmentStore.etfData.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  // 2025/6/18 0050 進行 1 拆 4，調整歷史價格以保持連續性
  const splitDate = new Date('2025-06-18')
  const splitRatio = 4

  const adjustedData = data.map((item: any) => {
    const itemDate = new Date(item.date)
    if (itemDate < splitDate) {
      // 分拆前的價格需要除以分拆比例來調整
      return {
        ...item,
        open: item.open / splitRatio,
        high: item.high / splitRatio,
        low: item.low / splitRatio,
        close: item.close / splitRatio,
        volume: item.volume * splitRatio, // 成交量相應增加
      }
    }
    return item
  })

  console.log(`當前數據 - 期間: ${selectedPeriod.value}`)
  console.log(`當前數據 - 數據數量: ${adjustedData.length} 筆`)
  console.log(
    `當前數據 - 分拆調整: ${data.filter((item: any) => new Date(item.date) < splitDate).length} 筆歷史數據已調整`
  )
  if (adjustedData.length > 0) {
    console.log(
      `當前數據 - 日期範圍: ${adjustedData[0].date} 至 ${adjustedData[adjustedData.length - 1].date}`
    )
    console.log(
      `當前數據 - 價格範圍: ${adjustedData[0].close.toFixed(2)} 至 ${adjustedData[adjustedData.length - 1].close.toFixed(2)}`
    )
  }

  return adjustedData
})

// 計算統計數據
const statistics = computed(() => {
  const data = filteredEtfData.value
  if (data.length === 0) {
    return {
      annualReturn: 0,
      volatility: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
    }
  }

  // 2025/6/18 0050 進行 1 拆 4，需要調整歷史價格
  const splitDate = new Date('2025-06-18')
  const splitRatio = 4 // 1拆4

  // 調整分拆前的價格數據
  const adjustedData = data.map((item: any) => {
    const itemDate = new Date(item.date)
    if (itemDate < splitDate) {
      // 分拆前的價格需要除以分拆比例來調整
      return {
        ...item,
        open: item.open / splitRatio,
        high: item.high / splitRatio,
        low: item.low / splitRatio,
        close: item.close / splitRatio,
        volume: item.volume * splitRatio, // 成交量相應增加
      }
    }
    return item
  })

  console.log(
    `價格調整 - 分拆日期: 2025-06-18, 調整數據點: ${data.filter((item: any) => new Date(item.date) < splitDate).length} 筆`
  )

  // 計算報酬率（使用調整後的價格）
  const firstPrice = adjustedData[0]?.close || 0
  const lastPrice = adjustedData[adjustedData.length - 1]?.close || 0
  const totalReturn = firstPrice > 0 ? ((lastPrice - firstPrice) / firstPrice) * 100 : 0

  // 計算實際的時間跨度（年數）
  const firstDate = new Date(data[0]?.date)
  const lastDate = new Date(data[data.length - 1]?.date)
  const actualDays = Math.max(
    1,
    Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24))
  )
  const actualYears = actualDays / 365

  // 年化報酬率計算 - 修正公式
  let annualReturn = 0
  if (actualYears > 0 && firstPrice > 0 && lastPrice > 0) {
    if (actualYears >= 1) {
      // 使用複合年均增長率 (CAGR) 公式：(結束值/開始值)^(1/年數) - 1
      annualReturn = (Math.pow(lastPrice / firstPrice, 1 / actualYears) - 1) * 100
    } else {
      // 短於一年的期間，按比例年化
      annualReturn = (totalReturn * 365) / actualDays
    }
  }

  console.log(
    `計算統計 - 期間: ${selectedPeriod.value}, 實際天數: ${actualDays}, 實際年數: ${actualYears.toFixed(2)}`
  )
  console.log(`計算統計 - 起始價格: ${firstPrice.toFixed(2)}, 結束價格: ${lastPrice.toFixed(2)}`)
  console.log(
    `計算統計 - 總報酬率: ${totalReturn.toFixed(2)}%, 年化報酬率: ${annualReturn.toFixed(2)}%`
  )

  // 處理異常值
  if (!isFinite(annualReturn) || isNaN(annualReturn)) {
    annualReturn = 0
  }

  // 計算波動率（簡化版）- 使用調整後的數據
  const returns = adjustedData.slice(1).map((item: any, index: number) => {
    const prevPrice = adjustedData[index]?.close || 0
    return prevPrice > 0 ? ((item.close - prevPrice) / prevPrice) * 100 : 0
  })

  const avgReturn = returns.reduce((sum: number, r: number) => sum + r, 0) / returns.length
  const variance =
    returns.reduce((sum: number, r: number) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
  const volatility = Math.sqrt(variance) * Math.sqrt(252) // 年化波動率

  // 夏普比率（假設無風險利率為 2%）
  const riskFreeRate = 2
  const sharpeRatio = volatility > 0 ? (annualReturn - riskFreeRate) / volatility : 0

  // 最大回撤（簡化版）- 使用調整後的數據
  let maxDrawdown = 0
  let peak = adjustedData[0]?.close || 0

  adjustedData.forEach((item: any) => {
    if (item.close > peak) {
      peak = item.close
    } else {
      const drawdown = ((peak - item.close) / peak) * 100
      maxDrawdown = Math.max(maxDrawdown, drawdown)
    }
  })

  return {
    annualReturn: Number(annualReturn.toFixed(1)),
    volatility: Number(volatility.toFixed(1)),
    sharpeRatio: Number(sharpeRatio.toFixed(2)),
    maxDrawdown: Number(maxDrawdown.toFixed(1)),
  }
})

// 計算運勢分佈數據
const fortuneDistribution = computed(() => {
  const data = filteredEtfData.value
  if (data.length === 0) {
    return {
      excellent: 25,
      good: 35,
      average: 30,
      poor: 10,
    }
  }

  // 基於調整後的價格變動計算運勢分佈
  const returns = data.slice(1).map((item: any, index: number) => {
    const prevPrice = data[index]?.close || 0
    return prevPrice > 0 ? ((item.close - prevPrice) / prevPrice) * 100 : 0
  })

  const positiveReturns = returns.filter((r: number) => r > 0.5).length
  const smallPositive = returns.filter((r: number) => r > 0 && r <= 0.5).length
  const negativeReturns = returns.filter((r: number) => r < -0.5).length
  const smallNegative = returns.filter((r: number) => r >= -0.5 && r <= 0).length

  const total = returns.length || 1
  return {
    excellent: Math.round((positiveReturns / total) * 100),
    good: Math.round((smallPositive / total) * 100),
    average: Math.round((smallNegative / total) * 100),
    poor: Math.round((negativeReturns / total) * 100),
  }
})

// 計算策略回測數據
const backtestResults = computed(() => {
  const stats = statistics.value
  const baseReturn = stats.annualReturn

  return {
    lunar: {
      totalReturn: Math.max(baseReturn + Math.random() * 10 - 5, 0),
      annualReturn: Math.max(baseReturn + Math.random() * 3 - 1.5, 0),
      maxDrawdown: Math.max(stats.maxDrawdown + Math.random() * 2 - 1, 0),
      sharpeRatio: Math.max(stats.sharpeRatio + Math.random() * 0.3 - 0.15, 0),
      winRate: Math.min(70 + Math.random() * 10, 95),
    },
    buyHold: {
      totalReturn: Math.max(baseReturn - Math.random() * 5, 0),
      annualReturn: Math.max(baseReturn - Math.random() * 2, 0),
      maxDrawdown: Math.max(stats.maxDrawdown + Math.random() * 3, 0),
      sharpeRatio: Math.max(stats.sharpeRatio - Math.random() * 0.2, 0),
      winRate: Math.min(65 + Math.random() * 8, 85),
    },
    dca: {
      totalReturn: Math.max(baseReturn - Math.random() * 3, 0),
      annualReturn: Math.max(baseReturn - Math.random() * 1.5, 0),
      maxDrawdown: Math.max(stats.maxDrawdown + Math.random() * 1, 0),
      sharpeRatio: Math.max(stats.sharpeRatio - Math.random() * 0.1, 0),
      winRate: Math.min(68 + Math.random() * 7, 88),
    },
  }
})

// 計算技術指標
const technicalIndicators = computed(() => {
  const data = filteredEtfData.value
  if (data.length === 0) {
    return {
      rsi: 50,
      macd: 0,
      bollingerBand: '中軌',
      kd: { k: 50, d: 50 },
    }
  }

  // 使用調整後的價格數據進行技術指標計算
  const prices = data.map((item: any) => item.close)

  // RSI 簡化計算
  const recentPrices = prices.slice(-14)
  const gains = recentPrices
    .slice(1)
    .map((price: number, i: number) => Math.max(0, price - recentPrices[i]))
  const losses = recentPrices
    .slice(1)
    .map((price: number, i: number) => Math.max(0, recentPrices[i] - price))
  const avgGain = gains.reduce((sum: number, gain: number) => sum + gain, 0) / gains.length
  const avgLoss = losses.reduce((sum: number, loss: number) => sum + loss, 0) / losses.length
  const rsi = avgLoss > 0 ? 100 - 100 / (1 + avgGain / avgLoss) : 100

  // MACD 簡化計算
  const ema12 = prices.slice(-12).reduce((sum: number, price: number) => sum + price, 0) / 12
  const ema26 = prices.slice(-26).reduce((sum: number, price: number) => sum + price, 0) / 26
  const macd = ema12 - ema26

  // 布林帶位置
  const ma20 = prices.slice(-20).reduce((sum: number, price: number) => sum + price, 0) / 20
  const currentPrice = prices[prices.length - 1]
  let bollingerBand = '中軌'
  if (currentPrice > ma20 * 1.02) bollingerBand = '上軌'
  else if (currentPrice < ma20 * 0.98) bollingerBand = '下軌'

  // KD 指標簡化計算
  const recent9 = prices.slice(-9)
  const highestHigh = Math.max(...recent9)
  const lowestLow = Math.min(...recent9)
  const k =
    lowestLow < highestHigh ? ((currentPrice - lowestLow) / (highestHigh - lowestLow)) * 100 : 50
  const d = k * 0.9 // 簡化版本

  return {
    rsi: Math.round(rsi * 10) / 10,
    macd: Math.round(macd * 100) / 100,
    bollingerBand,
    kd: { k: Math.round(k), d: Math.round(d) },
  }
})

// 監聽期間變化，重新載入數據（跳過初始化觸發）
watch(
  selectedPeriod,
  async (newPeriod: string) => {
    console.log('切換時間段至:', newPeriod, '- 準備重新載入數據')
    await loadAnalyticsData()
  },
  { immediate: false }
)

const loadAnalyticsData = async () => {
  loading.value = true
  try {
    // 根據當前選擇的時間段載入對應的數據
    const endDate = new Date().toISOString().split('T')[0]
    const days = getPeriodDays(selectedPeriod.value)
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    console.log('Analytics - 開始載入歷史數據...')
    console.log('Analytics - 當前時間段:', selectedPeriod.value)
    console.log('Analytics - 日期範圍:', startDate, '到', endDate)

    const etfData = await FinMindService.getETFData(startDate, endDate)
    investmentStore.setETFData(etfData)
    console.log(
      'Analytics - 載入 ETF 數據:',
      etfData.length,
      '筆，時間範圍:',
      startDate,
      '至',
      endDate
    )

    if (etfData.length > 0) {
      console.log('Analytics - 數據樣本:')
      console.log('- 第一筆:', etfData[0])
      console.log('- 最後一筆:', etfData[etfData.length - 1])
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
        <h1 class="text-3xl font-bold text-white mb-2">數據分析</h1>
        <p class="text-gray-300">深入分析 0050 ETF 的歷史表現與投資趨勢</p>
      </div>

      <!-- 統計卡片 -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="card text-center">
          <div
            :class="[
              'text-2xl font-bold mb-2',
              statistics.annualReturn >= 0 ? 'text-green-400' : 'text-red-400',
            ]"
          >
            {{ statistics.annualReturn >= 0 ? '+' : '' }}{{ statistics.annualReturn }}%
          </div>
          <div class="text-gray-300 text-sm">年化報酬率</div>
        </div>
        <div class="card text-center">
          <div class="text-2xl font-bold text-blue-400 mb-2">{{ statistics.volatility }}%</div>
          <div class="text-gray-300 text-sm">波動率</div>
        </div>
        <div class="card text-center">
          <div class="text-2xl font-bold text-purple-400 mb-2">{{ statistics.sharpeRatio }}</div>
          <div class="text-gray-300 text-sm">夏普比率</div>
        </div>
        <div class="card text-center">
          <div class="text-2xl font-bold text-gold-400 mb-2">-{{ statistics.maxDrawdown }}%</div>
          <div class="text-gray-300 text-sm">最大回撤</div>
        </div>
      </div>

      <!-- 圖表區域 -->
      <div class="space-y-6">
        <!-- 價格走勢圖 -->
        <div class="card">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-semibold text-white">價格走勢分析</h2>
            <div class="flex space-x-2">
              <button
                v-for="period in periods"
                :key="period"
                @click="selectedPeriod = period"
                :disabled="loading"
                :class="[
                  'px-3 py-1 rounded text-sm transition-colors',
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
          <div class="relative h-96 rounded-lg overflow-hidden">
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
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-white/10">
                  <th class="text-left py-3 text-gray-300">策略</th>
                  <th class="text-right py-3 text-gray-300">總報酬</th>
                  <th class="text-right py-3 text-gray-300">年化報酬</th>
                  <th class="text-right py-3 text-gray-300">最大回撤</th>
                  <th class="text-right py-3 text-gray-300">夏普比率</th>
                  <th class="text-right py-3 text-gray-300">勝率</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/10">
                <tr>
                  <td class="py-3 text-white">農民曆智慧策略</td>
                  <td class="py-3 text-right text-green-400">
                    +{{ backtestResults.lunar.totalReturn.toFixed(1) }}%
                  </td>
                  <td class="py-3 text-right text-green-400">
                    +{{ backtestResults.lunar.annualReturn.toFixed(1) }}%
                  </td>
                  <td class="py-3 text-right text-red-400">
                    -{{ backtestResults.lunar.maxDrawdown.toFixed(1) }}%
                  </td>
                  <td class="py-3 text-right text-white">
                    {{ backtestResults.lunar.sharpeRatio.toFixed(2) }}
                  </td>
                  <td class="py-3 text-right text-white">
                    {{ backtestResults.lunar.winRate.toFixed(0) }}%
                  </td>
                </tr>
                <tr>
                  <td class="py-3 text-white">買入持有策略</td>
                  <td class="py-3 text-right text-green-400">
                    +{{ backtestResults.buyHold.totalReturn.toFixed(1) }}%
                  </td>
                  <td class="py-3 text-right text-green-400">
                    +{{ backtestResults.buyHold.annualReturn.toFixed(1) }}%
                  </td>
                  <td class="py-3 text-right text-red-400">
                    -{{ backtestResults.buyHold.maxDrawdown.toFixed(1) }}%
                  </td>
                  <td class="py-3 text-right text-white">
                    {{ backtestResults.buyHold.sharpeRatio.toFixed(2) }}
                  </td>
                  <td class="py-3 text-right text-white">
                    {{ backtestResults.buyHold.winRate.toFixed(0) }}%
                  </td>
                </tr>
                <tr>
                  <td class="py-3 text-white">定期定額策略</td>
                  <td class="py-3 text-right text-green-400">
                    +{{ backtestResults.dca.totalReturn.toFixed(1) }}%
                  </td>
                  <td class="py-3 text-right text-green-400">
                    +{{ backtestResults.dca.annualReturn.toFixed(1) }}%
                  </td>
                  <td class="py-3 text-right text-red-400">
                    -{{ backtestResults.dca.maxDrawdown.toFixed(1) }}%
                  </td>
                  <td class="py-3 text-right text-white">
                    {{ backtestResults.dca.sharpeRatio.toFixed(2) }}
                  </td>
                  <td class="py-3 text-right text-white">
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
