<template>
  <div class="min-h-screen py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-white mb-2">投資儀表板</h1>
        <p class="text-gray-300">
          今日是 {{ formatDate(new Date()) }}，
          <span v-if="currentFortune" :class="getFortuneColor(currentFortune.investmentScore)">
            投資運勢: {{ currentFortune.investmentScore }}/100
          </span>
        </p>
      </div>

      <!-- 運勢卡片區域 -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <!-- 今日運勢 -->
        <div class="card">
          <h2 class="text-xl font-semibold text-white mb-4">今日投資運勢</h2>
          <div v-if="currentFortune" class="space-y-6">
            <!-- 總體運勢進度條 -->
            <div>
              <div class="flex items-center justify-between mb-3">
                <span class="text-gray-300 font-medium">總體運勢</span>
                <span class="text-white text-sm font-semibold progress-label"
                  >{{ currentFortune.overallScore }}/100</span
                >
              </div>
              <div
                class="w-full bg-gray-800 border border-gray-600 rounded-full h-5 relative overflow-hidden"
              >
                <div
                  class="h-5 rounded-full transition-all duration-1000 ease-out shadow-lg relative overflow-hidden"
                  :class="getOverallScoreColorClass(currentFortune.overallScore)"
                  :style="{ width: `${Math.max(4, currentFortune.overallScore)}%` }"
                >
                  <div
                    class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent fortune-progress-glow"
                  ></div>
                  <div class="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>
                </div>
              </div>
            </div>

            <!-- 投資運勢進度條 -->
            <div>
              <div class="flex items-center justify-between mb-3">
                <span class="text-gray-300 font-medium">投資運勢</span>
                <span class="text-white text-sm font-semibold progress-label"
                  >{{ currentFortune.investmentScore }}/100</span
                >
              </div>
              <div
                class="w-full bg-gray-800 border border-gray-600 rounded-full h-5 relative overflow-hidden"
              >
                <div
                  class="h-5 rounded-full transition-all duration-1000 ease-out shadow-lg relative overflow-hidden"
                  :class="getInvestmentScoreColorClass(currentFortune.investmentScore)"
                  :style="{ width: `${Math.max(4, currentFortune.investmentScore)}%` }"
                >
                  <div
                    class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent fortune-progress-glow"
                  ></div>
                  <div class="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>
                </div>
              </div>
            </div>

            <div class="pt-4 border-t border-white/10">
              <div class="flex items-center justify-between mb-2">
                <span class="text-gray-300">建議操作</span>
                <span
                  :class="getRecommendationColor(currentFortune.recommendation)"
                  class="font-semibold"
                >
                  {{ getRecommendationText(currentFortune.recommendation) }}
                </span>
              </div>
              <p class="text-sm text-gray-300">{{ currentFortune.advice }}</p>
            </div>
          </div>
          <div v-else class="text-center py-8">
            <p class="text-gray-400">請先設定個人資料以計算運勢</p>
            <RouterLink to="/profile" class="btn-primary mt-4 inline-block"> 設定資料 </RouterLink>
          </div>
        </div>

        <!-- 0050 即時資訊 -->
        <div class="card">
          <h2 class="text-xl font-semibold text-white mb-4">元大台灣50 (0050)</h2>
          <div v-if="latestPrice" class="space-y-4">
            <div class="flex items-baseline space-x-2">
              <span class="text-3xl font-bold text-white">${{ latestPrice.close }}</span>
              <span :class="priceChangeColor" class="text-lg font-medium">
                {{ priceChange >= 0 ? '+' : '' }}{{ priceChange.toFixed(2) }} ({{
                  priceChangePercent >= 0 ? '+' : ''
                }}{{ priceChangePercent.toFixed(2) }}%)
              </span>
            </div>

            <div class="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
              <div>
                <span class="text-gray-400 text-sm">開盤</span>
                <div class="text-white font-medium">${{ latestPrice.open }}</div>
              </div>
              <div>
                <span class="text-gray-400 text-sm">最高</span>
                <div class="text-white font-medium">${{ latestPrice.high }}</div>
              </div>
              <div>
                <span class="text-gray-400 text-sm">最低</span>
                <div class="text-white font-medium">${{ latestPrice.low }}</div>
              </div>
              <div>
                <span class="text-gray-400 text-sm">成交量</span>
                <div class="text-white font-medium">{{ formatVolume(latestPrice.volume) }}</div>
              </div>
            </div>
          </div>
          <div v-else-if="loading" class="text-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500 mx-auto"></div>
            <p class="text-gray-400 mt-2">載入中...</p>
          </div>
          <div v-else class="text-center py-8">
            <p class="text-gray-400">無法載入股價資料</p>
          </div>
        </div>

        <!-- 交易時段建議 -->
        <div class="card">
          <h2 class="text-xl font-semibold text-white mb-4">交易時段建議</h2>
          <div v-if="currentFortune" class="space-y-4">
            <div class="bg-green-500/20 p-3 rounded-lg border border-green-500/30">
              <h3 class="text-green-400 font-medium mb-1">推薦時段</h3>
              <p class="text-white">{{ currentFortune.luckyTime }}</p>
              <p class="text-sm text-gray-300">適合買入或加碼投資</p>
            </div>

            <div class="bg-red-500/20 p-3 rounded-lg border border-red-500/30">
              <h3 class="text-red-400 font-medium mb-1">避免時段</h3>
              <p class="text-white">{{ currentFortune.avoidTime }}</p>
              <p class="text-sm text-gray-300">不宜進場或減碼操作</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 圖表區域 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 價格走勢圖 -->
        <div class="card">
          <h2 class="text-xl font-semibold text-white mb-4">價格走勢</h2>
          <PriceChart :etfData="investmentStore.etfData" :isDark="isDark" />
        </div>

        <!-- 五行能量圖 -->
        <div class="card">
          <h2 class="text-xl font-semibold text-white mb-4">五行能量</h2>
          <ElementRadarChart
            v-if="currentFortune && currentFortune.elements"
            :elements="currentFortune.elements"
            :isDark="isDark"
          />
          <div v-else class="h-64 bg-gray-800/50 rounded-lg flex items-center justify-center">
            <p class="text-gray-400">請先設定個人資料</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useInvestmentStore } from '@/stores/investment'
import { useTheme } from '@/composables/useTheme'
import { FortuneService } from '@/services/fortune'
import { FinMindService } from '@/services/finmind'
import PriceChart from '@/components/charts/PriceChart.vue'
import ElementRadarChart from '@/components/charts/ElementRadarChart.vue'

const userStore = useUserStore()
const investmentStore = useInvestmentStore()
const { isDark } = useTheme()

const loading = ref(true)
const currentFortune = ref(null)

const latestPrice = computed(() => investmentStore.latestPrice)
const priceChange = computed(() => investmentStore.priceChange)
const priceChangePercent = computed(() => investmentStore.priceChangePercent)

const priceChangeColor = computed(() => {
  if (priceChange.value > 0) return 'text-green-400'
  if (priceChange.value < 0) return 'text-red-400'
  return 'text-gray-400'
})

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })
}

const formatVolume = (volume: number): string => {
  if (volume >= 1000000) {
    return `${(volume / 1000000).toFixed(1)}M`
  } else if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}K`
  }
  return volume.toString()
}

const getFortuneColor = (score: number): string => {
  if (score >= 70) return 'text-green-400'
  if (score >= 40) return 'text-yellow-400'
  return 'text-red-400'
}

// 總體運勢進度條顏色類別 (基於分數區間使用不同的顏色系統)
const getOverallScoreColorClass = (score: number): string => {
  if (score >= 85) return 'bg-gradient-to-r from-green-400 to-emerald-500' // 優秀 - 鮮綠
  if (score >= 70) return 'bg-gradient-to-r from-blue-400 to-cyan-500' // 良好 - 藍色
  if (score >= 55) return 'bg-gradient-to-r from-yellow-400 to-amber-500' // 中等 - 黃色
  if (score >= 40) return 'bg-gradient-to-r from-orange-400 to-red-500' // 偏低 - 橙紅
  return 'bg-gradient-to-r from-red-500 to-rose-600' // 差 - 深紅
}

// 投資運勢進度條顏色類別 (使用紫色系統區分)
const getInvestmentScoreColorClass = (score: number): string => {
  if (score >= 85) return 'bg-gradient-to-r from-purple-400 to-pink-500' // 優秀 - 紫粉
  if (score >= 70) return 'bg-gradient-to-r from-indigo-400 to-purple-500' // 良好 - 靛紫
  if (score >= 55) return 'bg-gradient-to-r from-teal-400 to-cyan-500' // 中等 - 青色
  if (score >= 40) return 'bg-gradient-to-r from-yellow-500 to-orange-500' // 偏低 - 黃橙
  return 'bg-gradient-to-r from-gray-400 to-slate-500' // 差 - 灰色
}

const getRecommendationColor = (recommendation: string): string => {
  switch (recommendation) {
    case 'BUY':
      return 'text-green-400'
    case 'SELL':
      return 'text-red-400'
    default:
      return 'text-yellow-400'
  }
}

const getRecommendationText = (recommendation: string): string => {
  switch (recommendation) {
    case 'BUY':
      return '建議買入'
    case 'SELL':
      return '建議賣出'
    default:
      return '建議持有'
  }
}

const getElementName = (element: string): string => {
  const names: { [key: string]: string } = {
    metal: '金',
    wood: '木',
    water: '水',
    fire: '火',
    earth: '土',
  }
  return names[element] || element
}

const getElementColor = (element: string): string => {
  const colors: { [key: string]: string } = {
    metal: 'bg-gray-400',
    wood: 'bg-green-500',
    water: 'bg-blue-500',
    fire: 'bg-red-500',
    earth: 'bg-yellow-600',
  }
  return colors[element] || 'bg-gray-400'
}

const loadData = async () => {
  try {
    loading.value = true

    // Load user profile
    userStore.loadProfile()

    // Check API status first
    const apiStatus = await FinMindService.checkAPIStatus()
    if (!apiStatus) {
      console.warn('FinMind API 無法連接，將使用備用數據')
    }

    // Calculate fortune if profile exists
    if (userStore.profile) {
      currentFortune.value = FortuneService.calculateDailyFortune(
        userStore.profile,
        new Date()
      ) as any
    }

    // Load ETF data with better error handling
    const endDate = new Date().toISOString().split('T')[0]
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    try {
      const etfData = await FinMindService.getETFData(startDate, endDate)
      console.log('Dashboard - 載入的 ETF 數據:', etfData)
      console.log('Dashboard - ETF 數據長度:', etfData?.length)

      investmentStore.setETFData(etfData)
      console.log(`成功載入 ${etfData.length} 筆 ETF 資料${!apiStatus ? ' (使用備用數據)' : ''}`)
      console.log('Dashboard - investmentStore.etfData after set:', investmentStore.etfData)
    } catch (etfError) {
      console.error('ETF 數據載入失敗:', etfError)
      // ETF 載入失敗時，手動生成一些測試數據
      const testData = [
        {
          date: '2024-01-15',
          open: 132.0,
          high: 134.0,
          low: 131.0,
          close: 133.5,
          volume: 25000000,
          change: 1.5,
          changePercent: 1.13,
        },
        {
          date: '2024-01-16',
          open: 133.5,
          high: 135.0,
          low: 132.8,
          close: 134.2,
          volume: 28000000,
          change: 0.7,
          changePercent: 0.52,
        },
        {
          date: '2024-01-17',
          open: 134.2,
          high: 134.8,
          low: 133.0,
          close: 133.8,
          volume: 22000000,
          change: -0.4,
          changePercent: -0.3,
        },
      ]
      console.log('Dashboard - 使用測試數據:', testData)
      investmentStore.setETFData(testData)
    }
  } catch (error) {
    console.error('載入資料失敗:', error)
    // 可以添加 Toast 通知用戶
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>
