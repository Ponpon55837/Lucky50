<script setup lang="ts">
import type { IntegratedFortuneData } from '@/services/integratedFortune'

// Props
interface Props {
  fortuneData: IntegratedFortuneData | null
  loading?: boolean
  errorMessage?: string
  title?: string
  icon?: string
  date?: Date
  showDate?: boolean
  showWealthScore?: boolean
  showTimeAdvice?: boolean
  showDirectionAdvice?: boolean
  showLuckyInfo?: boolean
}

withDefaults(defineProps<Props>(), {
  loading: false,
  errorMessage: undefined,
  title: '今日運勢',
  icon: '🔮',
  date: () => new Date(),
  showDate: true,
  showWealthScore: false,
  showTimeAdvice: false,
  showDirectionAdvice: false,
  showLuckyInfo: false,
})

// Emits
defineEmits<{
  retry: []
}>()

// Methods
const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(date)
}

const getScoreColorClass = (score: number): string => {
  if (score >= 85) return 'bg-gradient-to-r from-green-400 to-emerald-500'
  if (score >= 70) return 'bg-gradient-to-r from-blue-400 to-cyan-500'
  if (score >= 55) return 'bg-gradient-to-r from-yellow-400 to-amber-500'
  if (score >= 40) return 'bg-gradient-to-r from-orange-400 to-red-500'
  return 'bg-gradient-to-r from-red-500 to-rose-600'
}

const getInvestmentScoreColorClass = (score: number): string => {
  if (score >= 85) return 'bg-gradient-to-r from-purple-400 to-pink-500'
  if (score >= 70) return 'bg-gradient-to-r from-indigo-400 to-purple-500'
  if (score >= 55) return 'bg-gradient-to-r from-teal-400 to-cyan-500'
  if (score >= 40) return 'bg-gradient-to-r from-yellow-500 to-orange-500'
  return 'bg-gradient-to-r from-gray-400 to-slate-500'
}

const getWealthScoreColorClass = (score: number): string => {
  if (score >= 85) return 'bg-gradient-to-r from-gold-400 to-yellow-500'
  if (score >= 70) return 'bg-gradient-to-r from-green-400 to-emerald-500'
  if (score >= 55) return 'bg-gradient-to-r from-blue-400 to-cyan-500'
  if (score >= 40) return 'bg-gradient-to-r from-orange-400 to-red-500'
  return 'bg-gradient-to-r from-gray-400 to-slate-500'
}

const getRecommendationColor = (recommendation: string): string => {
  const colorMap: { [key: string]: string } = {
    BUY: 'text-green-400',
    SELL: 'text-red-400',
    HOLD: 'text-yellow-400',
    OBSERVE: 'text-blue-400',
  }
  return colorMap[recommendation] || 'text-gray-400'
}

const getRecommendationText = (recommendation: string): string => {
  const textMap: { [key: string]: string } = {
    BUY: '建議買入',
    SELL: '建議賣出',
    HOLD: '建議持有',
    OBSERVE: '建議觀望',
  }
  return textMap[recommendation] || '建議持有'
}

const getRiskLevelColor = (riskLevel: string): string => {
  const colorMap: { [key: string]: string } = {
    low: 'text-green-400',
    medium: 'text-yellow-400',
    high: 'text-red-400',
  }
  return colorMap[riskLevel] || 'text-gray-400'
}

const getRiskLevelText = (riskLevel: string): string => {
  const textMap: { [key: string]: string } = {
    low: '低風險',
    medium: '中風險',
    high: '高風險',
  }
  return textMap[riskLevel] || '中風險'
}
</script>

<template>
  <div class="fortune-card card">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
      <h3 class="text-lg sm:text-xl font-bold text-white flex items-center">
        <span class="text-gold-400 mr-2">{{ icon }}</span>
        {{ title }}
      </h3>
      <div
        v-if="showDate"
        class="text-sm text-gray-300"
      >
        {{ formatDate(date) }}
      </div>
    </div>

    <div
      v-if="fortuneData && !loading"
      class="space-y-4"
    >
      <!-- 運勢分數區域 -->
      <div class="space-y-4">
        <!-- 總體運勢 -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-gray-300 font-medium">總體運勢</span>
            <span class="text-white text-sm font-semibold">
              {{ fortuneData.overallScore }}/100
            </span>
          </div>
          <div
            class="w-full bg-gray-800 border border-gray-600 rounded-full h-3 relative overflow-hidden"
          >
            <div
              class="h-3 rounded-full transition-all duration-1000 ease-out"
              :class="getScoreColorClass(fortuneData.overallScore)"
              :style="{ width: `${Math.max(4, fortuneData.overallScore)}%` }"
            />
          </div>
        </div>

        <!-- 投資運勢 -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-gray-300 font-medium">投資運勢</span>
            <span class="text-white text-sm font-semibold">
              {{ fortuneData.investmentScore }}/100
            </span>
          </div>
          <div
            class="w-full bg-gray-800 border border-gray-600 rounded-full h-3 relative overflow-hidden"
          >
            <div
              class="h-3 rounded-full transition-all duration-1000 ease-out"
              :class="getInvestmentScoreColorClass(fortuneData.investmentScore)"
              :style="{ width: `${Math.max(4, fortuneData.investmentScore)}%` }"
            />
          </div>
        </div>

        <!-- 財富運勢 -->
        <div v-if="showWealthScore">
          <div class="flex items-center justify-between mb-2">
            <span class="text-gray-300 font-medium">財富運勢</span>
            <span class="text-white text-sm font-semibold">
              {{ fortuneData.wealthScore }}/100
            </span>
          </div>
          <div
            class="w-full bg-gray-800 border border-gray-600 rounded-full h-3 relative overflow-hidden"
          >
            <div
              class="h-3 rounded-full transition-all duration-1000 ease-out"
              :class="getWealthScoreColorClass(fortuneData.wealthScore)"
              :style="{ width: `${Math.max(4, fortuneData.wealthScore)}%` }"
            />
          </div>
        </div>
      </div>

      <!-- 建議操作區域 -->
      <div class="pt-4 border-t border-white/10">
        <div class="flex items-center justify-between mb-2">
          <span class="text-gray-300">建議操作</span>
          <span
            :class="getRecommendationColor(fortuneData.recommendation)"
            class="font-semibold"
          >
            {{ getRecommendationText(fortuneData.recommendation) }}
          </span>
        </div>
        <p class="text-sm text-gray-300 mb-3">
          {{ fortuneData.advice }}
        </p>

        <!-- 風險等級 -->
        <div class="flex items-center justify-between">
          <span class="text-gray-300 text-sm">風險等級</span>
          <span
            :class="getRiskLevelColor(fortuneData.riskLevel)"
            class="text-sm font-medium"
          >
            {{ getRiskLevelText(fortuneData.riskLevel) }}
          </span>
        </div>
      </div>

      <!-- 時間建議區域 -->
      <div
        v-if="showTimeAdvice"
        class="pt-4 border-t border-white/10"
      >
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="bg-green-500/20 p-3 rounded-lg border border-green-500/30">
            <h4 class="text-green-400 font-medium text-sm mb-1">
              推薦時段
            </h4>
            <p class="text-white text-sm">
              {{ fortuneData.luckyTime }}
            </p>
          </div>
          <div class="bg-red-500/20 p-3 rounded-lg border border-red-500/30">
            <h4 class="text-red-400 font-medium text-sm mb-1">
              避免時段
            </h4>
            <p class="text-white text-sm">
              {{ fortuneData.avoidTime }}
            </p>
          </div>
        </div>
      </div>

      <!-- 方位建議區域 -->
      <div
        v-if="showDirectionAdvice"
        class="pt-4 border-t border-white/10"
      >
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="bg-blue-500/20 p-3 rounded-lg border border-blue-500/30">
            <h4 class="text-blue-400 font-medium text-sm mb-1">
              吉方
            </h4>
            <p class="text-white text-sm">
              {{ fortuneData.luckyDirection }}
            </p>
          </div>
          <div class="bg-orange-500/20 p-3 rounded-lg border border-orange-500/30">
            <h4 class="text-orange-400 font-medium text-sm mb-1">
              兇方
            </h4>
            <p class="text-white text-sm">
              {{ fortuneData.avoidDirection }}
            </p>
          </div>
        </div>
      </div>

      <!-- 幸��顏色和數字 -->
      <div
        v-if="showLuckyInfo"
        class="pt-4 border-t border-white/10"
      >
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <h4 class="text-gray-300 text-sm mb-2">
              幸運顏色
            </h4>
            <div class="flex flex-wrap gap-1">
              <span
                v-for="color in fortuneData.luckyColors"
                :key="color"
                class="px-2 py-1 bg-purple-900/30 text-purple-300 rounded-full text-xs border border-purple-700"
              >
                {{ color }}
              </span>
            </div>
          </div>
          <div>
            <h4 class="text-gray-300 text-sm mb-2">
              幸運數字
            </h4>
            <div class="flex flex-wrap gap-1">
              <span
                v-for="number in fortuneData.luckyNumbers"
                :key="number"
                class="px-2 py-1 bg-gold-900/30 text-gold-300 rounded-full text-xs border border-gold-700"
              >
                {{ number }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 特殊提醒 -->
      <div
        v-if="fortuneData.warnings.length > 0 || fortuneData.opportunities.length > 0"
        class="pt-4 border-t border-white/10"
      >
        <div
          v-if="fortuneData.opportunities.length > 0"
          class="mb-3"
        >
          <h4 class="text-green-400 text-sm mb-2">
            機會提醒
          </h4>
          <ul class="space-y-1">
            <li
              v-for="opportunity in fortuneData.opportunities"
              :key="opportunity"
              class="text-green-300 text-sm flex items-start"
            >
              <span class="text-green-400 mr-1">•</span>
              {{ opportunity }}
            </li>
          </ul>
        </div>
        <div v-if="fortuneData.warnings.length > 0">
          <h4 class="text-red-400 text-sm mb-2">
            注意事項
          </h4>
          <ul class="space-y-1">
            <li
              v-for="warning in fortuneData.warnings"
              :key="warning"
              class="text-red-300 text-sm flex items-start"
            >
              <span class="text-red-400 mr-1">•</span>
              {{ warning }}
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 載入狀態 -->
    <div
      v-else-if="loading"
      class="text-center py-8"
    >
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-400 mx-auto" />
      <p class="text-gray-300 mt-2">
        計算運勢中...
      </p>
    </div>

    <!-- 錯誤狀態 -->
    <div
      v-else
      class="text-center py-8"
    >
      <p class="text-red-400 mb-2">
        {{ errorMessage || '無法載入運勢資料' }}
      </p>
      <button
        class="text-gold-400 hover:text-gold-300 text-sm underline"
        @click="$emit('retry')"
      >
        重新載入
      </button>
    </div>
  </div>
</template>
