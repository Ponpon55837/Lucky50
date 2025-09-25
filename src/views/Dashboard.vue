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
          <div v-if="currentFortune" class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-gray-300">總體運勢</span>
              <div class="flex items-center space-x-2">
                <div class="w-24 bg-gray-700 rounded-full h-2">
                  <div
                    class="h-2 rounded-full bg-gradient-to-r from-gold-500 to-yellow-600"
                    :style="{ width: `${currentFortune.overallScore}%` }"
                  ></div>
                </div>
                <span class="text-white text-sm">{{ currentFortune.overallScore }}/100</span>
              </div>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-gray-300">投資運勢</span>
              <div class="flex items-center space-x-2">
                <div class="w-24 bg-gray-700 rounded-full h-2">
                  <div
                    class="h-2 rounded-full bg-gradient-to-r from-jade-500 to-green-600"
                    :style="{ width: `${currentFortune.investmentScore}%` }"
                  ></div>
                </div>
                <span class="text-white text-sm">{{ currentFortune.investmentScore }}/100</span>
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

        <!-- 時辰建議 -->
        <div class="card">
          <h2 class="text-xl font-semibold text-white mb-4">時辰建議</h2>
          <div v-if="currentFortune" class="space-y-4">
            <div class="bg-green-500/20 p-3 rounded-lg border border-green-500/30">
              <h3 class="text-green-400 font-medium mb-1">吉時</h3>
              <p class="text-white">{{ currentFortune.luckyTime }}</p>
              <p class="text-sm text-gray-300">適合進行投資決策</p>
            </div>

            <div class="bg-red-500/20 p-3 rounded-lg border border-red-500/30">
              <h3 class="text-red-400 font-medium mb-1">凶時</h3>
              <p class="text-white">{{ currentFortune.avoidTime }}</p>
              <p class="text-sm text-gray-300">不宜進行交易操作</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 圖表區域 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 價格走勢圖 -->
        <div class="card">
          <h2 class="text-xl font-semibold text-white mb-4">價格走勢</h2>
          <div class="h-64 bg-gray-800/50 rounded-lg flex items-center justify-center">
            <p class="text-gray-400">圖表載入中...</p>
          </div>
        </div>

        <!-- 五行能量圖 -->
        <div class="card">
          <h2 class="text-xl font-semibold text-white mb-4">五行能量</h2>
          <div v-if="currentFortune" class="space-y-3">
            <div
              v-for="(value, element) in currentFortune.elements"
              :key="element"
              class="flex items-center space-x-3"
            >
              <span class="w-12 text-gray-300 text-sm">{{ getElementName(element) }}</span>
              <div class="flex-1 bg-gray-700 rounded-full h-2">
                <div
                  class="h-2 rounded-full"
                  :class="getElementColor(element)"
                  :style="{ width: `${value}%` }"
                ></div>
              </div>
              <span class="text-white text-sm w-8">{{ Math.round(value) }}</span>
            </div>
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
import { FortuneService } from '@/services/fortune'
import { FinMindService } from '@/services/finmind'

const userStore = useUserStore()
const investmentStore = useInvestmentStore()

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

    // Calculate fortune if profile exists
    if (userStore.profile) {
      currentFortune.value = FortuneService.calculateDailyFortune(
        userStore.profile,
        new Date()
      ) as any
    }

    // Load ETF data
    const endDate = new Date().toISOString().split('T')[0]
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const etfData = await FinMindService.getETFData(startDate, endDate)
    investmentStore.setETFData(etfData)
  } catch (error) {
    console.error('載入資料失敗:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>
