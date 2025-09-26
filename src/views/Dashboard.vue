<script setup lang="ts">
import { ref, computed, onMounted, shallowRef } from 'vue'
import { useUserStore } from '@/stores/user'
import { useInvestmentStore } from '@/stores/investment'
import { useTheme } from '@/composables/useTheme'
import { IntegratedFortuneService } from '@/services/integratedFortune'
import { lunarService } from '@/services/lunar'
import { FinMindService } from '@/services/finmind'
import PriceChart from '@/components/charts/PriceChart.vue'
import ElementRadarChart from '@/components/charts/ElementRadarChart.vue'
import LunarCalendarCard from '@/components/LunarCalendarCard.vue'
import FortuneCard from '@/components/FortuneCard.vue'
import type { IntegratedFortuneData, UserProfileCompat } from '@/services/integratedFortune'

// Store instances
const userStore = useUserStore()
const investmentStore = useInvestmentStore()
const { isDark } = useTheme()

// Reactive state with performance optimizations
const loading = ref(true)
const fortuneLoading = ref(false)
const currentFortune = shallowRef<IntegratedFortuneData | null>(null) // 使用整合運勢資料
const fortuneError = ref<string>('')

// Computed properties with caching
const latestPrice = computed(() => investmentStore.latestPrice)
const priceChange = computed(() => investmentStore.priceChange)
const priceChangePercent = computed(() => investmentStore.priceChangePercent)

// Memoized color calculations
const priceChangeColor = computed(() => {
  const change = priceChange.value
  return change > 0 ? 'text-green-400' : change < 0 ? 'text-red-400' : 'text-gray-400'
})

// Performance-optimized utility functions
const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(date)
}

const formatVolume = (volume: number): string => {
  if (volume >= 1_000_000) return `${(volume / 1_000_000).toFixed(1)}M`
  if (volume >= 1_000) return `${(volume / 1_000).toFixed(1)}K`
  return volume.toString()
}

// 載入整合運勢資料
const loadIntegratedFortune = async () => {
  if (!userStore.profile) {
    fortuneError.value = '請先設定個人資料'
    return
  }

  try {
    fortuneLoading.value = true
    fortuneError.value = ''

    // 轉換用戶資料格式以符合新介面
    const profileCompat: UserProfileCompat = {
      name: userStore.profile.name,
      birthDate: userStore.profile.birthDate,
      birthTime: userStore.profile.birthTime || '12:00',
      zodiac: userStore.profile.zodiac,
      element: userStore.profile.element,
      luckyColors: [...userStore.profile.luckyColors],
      luckyNumbers: [...userStore.profile.luckyNumbers],
    }

    currentFortune.value = await IntegratedFortuneService.calculateIntegratedFortune(
      profileCompat,
      new Date()
    )
  } catch (error) {
    console.error('載入整合運勢失敗:', error)
    fortuneError.value = '載入運勢資料失敗'
  } finally {
    fortuneLoading.value = false
  }
}

// Data loading with optimized error handling
const loadData = async () => {
  try {
    loading.value = true

    // 清除農民曆快取，確保使用最新資料
    lunarService.clearCache()
    IntegratedFortuneService.clearCache()

    // Load user profile
    userStore.loadProfile()

    // Load integrated fortune
    await loadIntegratedFortune()

    // Check API status first
    const apiStatus = await FinMindService.checkAPIStatus()
    if (!apiStatus) {
      console.warn('FinMind API 無法連接，將使用備用數據')
    }

    // Load ETF data with better error handling
    const endDate = new Date().toISOString().split('T')[0]
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    try {
      const etfData = await FinMindService.getETFData(startDate, endDate)
      console.log('Dashboard - 成功載入 ETF 資料:', etfData.length, '筆')
      if (etfData.length > 0) {
        console.log('Dashboard - 第一筆資料:', etfData[0])
        console.log('Dashboard - 最後一筆資料:', etfData[etfData.length - 1])
      }
      investmentStore.setETFData(etfData)
      console.log('Dashboard - Store 中的資料數量:', investmentStore.etfData.length)
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

// 重試載入運勢
const retryFortune = () => {
  loadIntegratedFortune()
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="min-h-screen py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-white mb-2">投資儀表板</h1>
        <p class="text-gray-300">
          今日是 {{ formatDate(new Date()) }}，
          <span
            v-if="currentFortune"
            :class="
              currentFortune.investmentScore >= 70
                ? 'text-green-400'
                : currentFortune.investmentScore >= 40
                  ? 'text-yellow-400'
                  : 'text-red-400'
            "
          >
            投資運勢: {{ currentFortune.investmentScore }}/100
          </span>
          <span v-if="currentFortune && currentFortune.lunarData" class="text-gray-400 ml-2">
            • {{ currentFortune.lunarData.ganZhi }}年 農曆{{
              currentFortune.lunarData.lunarMonth
            }}月{{ currentFortune.lunarData.lunarDay }}日 ({{ currentFortune.lunarData.zodiac }}年)
          </span>
        </p>
        <div v-if="currentFortune && currentFortune.lunarData.jieQi" class="mt-2">
          <span class="text-gold-400 text-sm"> 🌿 {{ currentFortune.lunarData.jieQi }} </span>
        </div>
      </div>

      <!-- 運勢卡片區域 -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <!-- 今日運勢 -->
        <FortuneCard
          :fortuneData="currentFortune"
          :loading="fortuneLoading"
          :errorMessage="fortuneError"
          title="今日投資運勢"
          icon="🔮"
          :showWealthScore="true"
          :showTimeAdvice="false"
          :showDirectionAdvice="false"
          :showLuckyInfo="false"
          @retry="retryFortune"
        />

        <!-- 0050 即時資訊 -->
        <div class="card">
          <h2 class="text-lg sm:text-xl font-semibold text-white mb-4">元大台灣50 (0050)</h2>
          <div v-if="latestPrice" class="space-y-3 sm:space-y-4">
            <div
              class="flex flex-col sm:flex-row sm:items-baseline space-y-1 sm:space-y-0 sm:space-x-2"
            >
              <span class="text-2xl sm:text-3xl font-bold text-white"
                >${{ latestPrice.close }}</span
              >
              <span :class="priceChangeColor" class="text-base sm:text-lg font-medium">
                {{ priceChange >= 0 ? '+' : '' }}{{ priceChange.toFixed(2) }} ({{
                  priceChangePercent >= 0 ? '+' : ''
                }}{{ priceChangePercent.toFixed(2) }}%)
              </span>
            </div>

            <div class="grid grid-cols-2 gap-3 sm:gap-4 pt-3 sm:pt-4 border-t border-white/10">
              <div>
                <span class="text-gray-400 text-xs sm:text-sm">開盤</span>
                <div class="text-white font-medium text-sm sm:text-base">
                  ${{ latestPrice.open }}
                </div>
              </div>
              <div>
                <span class="text-gray-400 text-xs sm:text-sm">最高</span>
                <div class="text-white font-medium text-sm sm:text-base">
                  ${{ latestPrice.high }}
                </div>
              </div>
              <div>
                <span class="text-gray-400 text-xs sm:text-sm">最低</span>
                <div class="text-white font-medium text-sm sm:text-base">
                  ${{ latestPrice.low }}
                </div>
              </div>
              <div>
                <span class="text-gray-400 text-xs sm:text-sm">成交量</span>
                <div class="text-white font-medium text-sm sm:text-base">
                  {{ formatVolume(latestPrice.volume) }}
                </div>
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
            <!-- 交易狀態 -->
            <!-- <div
              class="mb-4 p-3 rounded-lg border"
              :class="
                currentFortune.stockTradingStatus.isOpen
                  ? 'bg-green-500/20 border-green-500/30'
                  : 'bg-gray-500/20 border-gray-500/30'
              "
            >
              <div class="flex items-center justify-between">
                <span class="text-white font-medium">台股狀態</span>
                <span
                  :class="
                    currentFortune.stockTradingStatus.isOpen ? 'text-green-400' : 'text-gray-400'
                  "
                  class="text-sm"
                >
                  {{ currentFortune.stockTradingStatus.isOpen ? '🟢 交易中' : '🔴 休市' }}
                </span>
              </div>
              <p class="text-sm text-gray-300 mt-1">
                {{ currentFortune.stockTradingStatus.message }}
              </p>
            </div> -->

            <!-- 推薦交易時段 -->
            <div
              v-if="currentFortune.bestTradingHours.length > 0"
              class="bg-green-500/20 p-3 rounded-lg border border-green-500/30"
            >
              <h3 class="text-green-400 font-medium mb-2">推薦交易時段 (今日)</h3>
              <div class="space-y-1">
                <div
                  v-for="period in currentFortune.bestTradingHours"
                  :key="period.time"
                  class="flex justify-between items-center text-sm"
                >
                  <span class="text-white">{{ period.time }}</span>
                  <span class="text-green-300">{{ period.reason }}</span>
                </div>
              </div>
              <p class="text-sm text-gray-300 mt-2">今日適合買入或加碼的時段</p>
            </div>

            <!-- 避免交易時段 -->
            <div
              v-if="currentFortune.avoidTradingHours.length > 0"
              class="bg-red-500/20 p-3 rounded-lg border border-red-500/30"
            >
              <h3 class="text-red-400 font-medium mb-2">避免交易時段 (今日)</h3>
              <div class="space-y-1">
                <div
                  v-for="period in currentFortune.avoidTradingHours"
                  :key="period.time"
                  class="flex justify-between items-center text-sm"
                >
                  <span class="text-white">{{ period.time }}</span>
                  <span class="text-red-300">{{ period.reason }}</span>
                </div>
              </div>
              <p class="text-sm text-gray-300 mt-2">今日不宜進場操作的時段</p>
            </div>

            <!-- 如果當天沒有特別推薦時段，顯示傳統吉時參考 -->
            <div
              v-if="
                currentFortune.bestTradingHours.length === 0 &&
                currentFortune.stockTradingStatus.isOpen
              "
              class="bg-blue-500/20 p-3 rounded-lg border border-blue-500/30"
            >
              <h3 class="text-blue-400 font-medium mb-1">傳統吉時參考</h3>
              <p class="text-white">{{ currentFortune.luckyTime }}</p>
              <p class="text-sm text-gray-300">可參考的吉時，但需注意個人運勢狀況</p>
            </div>

            <!-- 交易日提醒 (只在非交易日或假日顯示) -->
            <div
              v-if="!currentFortune.tradingDayInfo.isToday"
              class="bg-yellow-500/20 p-3 rounded-lg border border-yellow-500/30"
            >
              <h3 class="text-yellow-400 font-medium mb-1">📅 下個交易日</h3>
              <p class="text-white text-sm">
                {{ formatDate(currentFortune.tradingDayInfo.tradingDay) }}
              </p>
              <p class="text-sm text-gray-300">今日為假日或國定假日，股市休市</p>
            </div>
          </div>
          <div v-else class="text-center py-8">
            <p class="text-gray-400">請先設定個人資料</p>
          </div>
        </div>
      </div>

      <!-- 農民曆區域 -->
      <div class="mb-8">
        <LunarCalendarCard :fortuneData="currentFortune" />
      </div>

      <!-- 圖表區域 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 價格走勢圖 -->
        <div class="card">
          <h2 class="text-xl font-semibold text-white mb-4">價格走勢</h2>
          <div
            v-if="investmentStore.etfData.length === 0"
            class="h-64 bg-gray-800/50 rounded-lg flex items-center justify-center"
          >
            <p class="text-gray-400">
              {{ loading ? '載入圖表中...' : '無數據可顯示' }}
              <br />
              <small class="text-xs">數據數量: {{ investmentStore.etfData.length }}</small>
            </p>
          </div>
          <PriceChart v-else :etfData="investmentStore.etfData" :isDark="isDark" />
        </div>

        <!-- 五行能量圖 -->
        <div class="card">
          <h2 class="text-xl font-semibold text-white mb-4">五行能量分析</h2>
          <ElementRadarChart
            v-if="currentFortune && currentFortune.elements"
            :elements="currentFortune.elements"
            :userElement="userStore.profile?.element"
            :isDark="isDark"
          />
          <div v-else class="h-64 bg-gray-800/50 rounded-lg flex items-center justify-center">
            <p class="text-gray-400">請先設定個人資料</p>
          </div>

          <!-- 個人五行屬性說明 -->
          <div
            v-if="userStore.profile?.element"
            class="mt-4 p-3 bg-gold-500/10 rounded-lg border border-gold-500/20"
          >
            <div class="flex items-center gap-2">
              <span class="text-gold-400 text-sm font-medium">★ 您的本命五行</span>
              <span class="text-white font-bold">{{ userStore.profile.element }}</span>
            </div>
            <p class="text-gray-300 text-sm mt-1">
              圖中標有 ★ 的是您的本命五行，能量值會根據個人八字和當日運勢動態調整
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
