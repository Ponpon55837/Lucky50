<script setup lang="ts">
import { onMounted, computed, watch, defineAsyncComponent } from 'vue'
import { useUserStore } from '@/stores/user'
import { useDashboardStore } from '@/stores/dashboard'
import { useTheme } from '@/composables/useTheme'
import type { UserProfileCompat } from '@/services/integratedFortune'

// Lazy load components
const PriceChart = defineAsyncComponent({
  loader: () => import('@/components/charts/PriceChart.vue'),
  loadingComponent: () => import('@/components/ui/Loading.vue'),
})
const ElementRadarChart = defineAsyncComponent({
  loader: () => import('@/components/charts/ElementRadarChart.vue'),
  loadingComponent: () => import('@/components/ui/Loading.vue'),
})
const LunarCalendarCard = defineAsyncComponent({
  loader: () => import('@/components/LunarCalendarCard.vue'),
  loadingComponent: () => import('@/components/ui/Loading.vue'),
})
const FortuneCard = defineAsyncComponent({
  loader: () => import('@/components/FortuneCard.vue'),
  loadingComponent: () => import('@/components/ui/Loading.vue'),
})

// Store instances
const userStore = useUserStore()
const dashboardStore = useDashboardStore()
const { isDark } = useTheme()

// 將userStore的profile轉換為UserProfileCompat格式
const userProfileCompat = computed((): UserProfileCompat | null => {
  if (!userStore.profile) return null

  return {
    name: userStore.profile.name,
    birthDate: userStore.profile.birthDate,
    birthTime: userStore.profile.birthTime || '12:00',
    zodiac: userStore.profile.zodiac,
    element: userStore.profile.element,
    luckyColors: [...userStore.profile.luckyColors],
    luckyNumbers: [...userStore.profile.luckyNumbers],
  }
})

// 重試函數的包裝器
const retryIntegratedFortune = () => {
  return dashboardStore.retryIntegratedFortune(userProfileCompat.value)
}

onMounted(() => {
  // 使用轉換後的用戶資料載入dashboard數據
  dashboardStore.loadAllData(userProfileCompat.value)
})

// 監聽用戶資料變化，自動重新載入dashboard數據
watch(
  userProfileCompat,
  newProfile => {
    if (newProfile) {
      dashboardStore.refreshData(newProfile)
    }
  },
  { deep: true }
)
</script>

<template>
  <div class="min-h-screen py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-white mb-2">投資儀表板</h1>
        <p class="text-gray-300">
          今日是 {{ dashboardStore.formattedCurrentDate }}，
          <span
            v-if="dashboardStore.integratedFortune"
            :class="
              dashboardStore.integratedFortune.investmentScore >= 70
                ? 'text-green-400'
                : dashboardStore.integratedFortune.investmentScore >= 40
                  ? 'text-yellow-400'
                  : 'text-red-400'
            "
          >
            投資運勢: {{ dashboardStore.integratedFortune.investmentScore }}/100
          </span>
          <span
            v-if="dashboardStore.integratedFortune && dashboardStore.integratedFortune.lunarData"
            class="text-gray-400 ml-2"
          >
            • {{ dashboardStore.integratedFortune.lunarData.ganZhi }}年 農曆{{
              dashboardStore.integratedFortune.lunarData.lunarMonth
            }}月{{ dashboardStore.integratedFortune.lunarData.lunarDay }}日 ({{
              dashboardStore.integratedFortune.lunarData.zodiac
            }}年)
          </span>
        </p>
        <div
          v-if="
            dashboardStore.integratedFortune && dashboardStore.integratedFortune.lunarData.jieQi
          "
          class="mt-2"
        >
          <span class="text-gold-400 text-sm">
            🌿 {{ dashboardStore.integratedFortune.lunarData.jieQi }}
          </span>
        </div>
      </div>

      <!-- 運勢卡片區域 -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <!-- 今日運勢 -->
        <FortuneCard
          :fortuneData="dashboardStore.integratedFortune"
          :loading="dashboardStore.fortuneLoading"
          :errorMessage="dashboardStore.fortuneError || ''"
          title="今日投資運勢"
          icon="🔮"
          :showWealthScore="true"
          :showTimeAdvice="false"
          :showDirectionAdvice="false"
          :showLuckyInfo="false"
          @retry="retryIntegratedFortune"
        />

        <!-- 0050 即時資訊 -->
        <div class="card">
          <h2 class="text-lg sm:text-xl font-semibold text-white mb-4">元大台灣50 (0050)</h2>
          <div v-if="dashboardStore.latestPrice" class="space-y-3 sm:space-y-4">
            <div
              class="flex flex-col sm:flex-row sm:items-baseline space-y-1 sm:space-y-0 sm:space-x-2"
            >
              <span class="text-2xl sm:text-3xl font-bold text-white"
                >${{ dashboardStore.latestPrice.close }}</span
              >
              <span
                :class="dashboardStore.priceChangeColor"
                class="text-base sm:text-lg font-medium"
              >
                {{ dashboardStore.priceChange >= 0 ? '+' : ''
                }}{{ dashboardStore.priceChange.toFixed(2) }} ({{
                  dashboardStore.priceChangePercent >= 0 ? '+' : ''
                }}{{ dashboardStore.priceChangePercent.toFixed(2) }}%)
              </span>
            </div>

            <div class="grid grid-cols-2 gap-3 sm:gap-4 pt-3 sm:pt-4 border-t border-white/10">
              <div>
                <span class="text-gray-400 text-xs sm:text-sm">開盤</span>
                <div class="text-white font-medium text-sm sm:text-base">
                  ${{ dashboardStore.latestPrice.open }}
                </div>
              </div>
              <div>
                <span class="text-gray-400 text-xs sm:text-sm">最高</span>
                <div class="text-white font-medium text-sm sm:text-base">
                  ${{ dashboardStore.latestPrice.high }}
                </div>
              </div>
              <div>
                <span class="text-gray-400 text-xs sm:text-sm">最低</span>
                <div class="text-white font-medium text-sm sm:text-base">
                  ${{ dashboardStore.latestPrice.low }}
                </div>
              </div>
              <div>
                <span class="text-gray-400 text-xs sm:text-sm">成交量</span>
                <div class="text-white font-medium text-sm sm:text-base">
                  {{ dashboardStore.formatVolume(dashboardStore.latestPrice.volume) }}
                </div>
              </div>
            </div>
          </div>
          <div
            v-else-if="dashboardStore.loading || dashboardStore.etfLoading"
            class="text-center py-8"
          >
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
          <div v-if="dashboardStore.integratedFortune" class="space-y-4">
            <!-- 推薦交易時段 -->
            <div
              v-if="dashboardStore.integratedFortune.bestTradingHours.length > 0"
              class="bg-green-500/20 p-3 rounded-lg border border-green-500/30"
            >
              <h3 class="text-green-400 font-medium mb-2">推薦交易時段 (今日)</h3>
              <div class="space-y-1">
                <div
                  v-for="period in dashboardStore.integratedFortune.bestTradingHours"
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
              v-if="dashboardStore.integratedFortune.avoidTradingHours.length > 0"
              class="bg-red-500/20 p-3 rounded-lg border border-red-500/30"
            >
              <h3 class="text-red-400 font-medium mb-2">避免交易時段 (今日)</h3>
              <div class="space-y-1">
                <div
                  v-for="period in dashboardStore.integratedFortune.avoidTradingHours"
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
                dashboardStore.integratedFortune.bestTradingHours.length === 0 &&
                dashboardStore.integratedFortune.stockTradingStatus.isOpen
              "
              class="bg-blue-500/20 p-3 rounded-lg border border-blue-500/30"
            >
              <h3 class="text-blue-400 font-medium mb-1">傳統吉時參考</h3>
              <p class="text-white">{{ dashboardStore.integratedFortune.luckyTime }}</p>
              <p class="text-sm text-gray-300">可參考的吉時，但需注意個人運勢狀況</p>
            </div>

            <!-- 交易日提醒 (只在非交易日或假日顯示) -->
            <div
              v-if="!dashboardStore.integratedFortune.tradingDayInfo.isToday"
              class="bg-yellow-500/20 p-3 rounded-lg border border-yellow-500/30"
            >
              <h3 class="text-yellow-400 font-medium mb-1">📅 下個交易日</h3>
              <p class="text-white text-sm">
                {{
                  dashboardStore.formatDate(
                    dashboardStore.integratedFortune.tradingDayInfo.tradingDay
                  )
                }}
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
        <LunarCalendarCard :fortuneData="dashboardStore.integratedFortune" />
      </div>

      <!-- 圖表區域 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 價格走勢圖 -->
        <div class="card">
          <h2 class="text-xl font-semibold text-white mb-4">價格走勢</h2>
          <div
            v-if="dashboardStore.etfData.length === 0"
            class="h-64 bg-gray-800/50 rounded-lg flex items-center justify-center"
          >
            <p class="text-gray-400">
              {{
                dashboardStore.loading || dashboardStore.etfLoading
                  ? '載入圖表中...'
                  : '無數據可顯示'
              }}
              <br />
              <small class="text-xs">數據數量: {{ dashboardStore.etfData.length }}</small>
            </p>
          </div>
          <PriceChart v-else :etfData="dashboardStore.etfData" :isDark="isDark" />
        </div>

        <!-- 五行能量圖 -->
        <div class="card">
          <h2 class="text-xl font-semibold text-white mb-4">五行能量分析</h2>
          <ElementRadarChart
            v-if="dashboardStore.integratedFortune && dashboardStore.integratedFortune.elements"
            :elements="dashboardStore.integratedFortune.elements"
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
