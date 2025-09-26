<template>
  <div class="card">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-bold flex items-center" style="color: var(--primary-text)">
        <span class="mr-2" style="color: var(--accent-text)">📆</span>
        今日農民曆
      </h3>
      <div class="text-sm" style="color: var(--secondary-text)">
        {{ formatDate(today) }}
      </div>
    </div>

    <div v-if="lunarInfo && !loading" class="space-y-4">
      <!-- 農曆日期 -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="lunar-card">
          <h4 class="font-semibold text-red-500 mb-2">農曆日期</h4>
          <div class="text-lg font-bold" style="color: var(--primary-text)">
            {{ lunarInfo.lunarYear }}年 {{ lunarInfo.lunarMonth }}月 {{ lunarInfo.lunarDay }}日
          </div>
          <div class="text-sm mt-1" style="color: var(--secondary-text)">
            {{ lunarInfo.ganZhi }}年 {{ lunarInfo.monthGanZhi }}月 {{ lunarInfo.dayGanZhi }}日
          </div>
        </div>

        <div class="lunar-card">
          <h4 class="font-semibold text-blue-500 mb-2">生肖星座</h4>
          <div class="text-lg font-bold" style="color: var(--primary-text)">
            {{ lunarInfo.zodiac }}年 {{ lunarInfo.constellation }}
          </div>
          <div class="text-sm mt-1" style="color: var(--secondary-text)">
            本命納音：{{ lunarInfo.naYin }}
          </div>
        </div>
      </div>

      <!-- 節氣節日 -->
      <div v-if="lunarInfo.jieQi || lunarInfo.festivals?.length" class="lunar-card">
        <h4 class="font-semibold mb-2" style="color: var(--accent-text)">節氣節日</h4>
        <div class="flex flex-wrap gap-2">
          <span v-if="lunarInfo.jieQi" class="festival-tag festival-tag-green">
            {{ lunarInfo.jieQi }}
          </span>
          <span
            v-for="festival in lunarInfo.festivals"
            :key="festival"
            class="festival-tag festival-tag-red"
          >
            {{ festival }}
          </span>
        </div>
      </div>

      <!-- 宜忌事項 -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div class="lunar-card">
          <h4 class="font-semibold text-green-500 mb-2">宜</h4>
          <div class="flex flex-wrap gap-1">
            <span v-for="item in lunarInfo.yi" :key="item" class="yi-tag">
              {{ item }}
            </span>
          </div>
        </div>

        <div class="lunar-card">
          <h4 class="font-semibold text-red-500 mb-2">忌</h4>
          <div class="flex flex-wrap gap-1">
            <span v-for="item in lunarInfo.ji" :key="item" class="ji-tag">
              {{ item }}
            </span>
          </div>
        </div>
      </div>

      <!-- 投資建議 -->
      <div v-if="investmentAdvice" class="lunar-card mb-6">
        <h4 class="font-semibold mb-2" style="color: var(--accent-text)">今日投資運勢</h4>
        <div class="text-sm mb-2" style="color: var(--secondary-text)">
          運勢指數：
          <span class="font-bold" style="color: var(--primary-text)"
            >{{ investmentAdvice.luckyScore }}/100</span
          >
        </div>
        <p class="text-sm leading-relaxed mb-3" style="color: var(--secondary-text)">
          {{ investmentAdvice.advice }}
        </p>
        <div class="grid grid-cols-2 gap-4">
          <div class="text-sm">
            <span style="color: var(--secondary-text)">建議操作：</span>
            <span class="font-semibold" style="color: var(--primary-text)">{{
              getActionText(investmentAdvice.recommendedAction)
            }}</span>
          </div>
          <div class="text-sm">
            <span style="color: var(--secondary-text)">風險等級：</span>
            <span class="font-semibold" :class="getRiskColor(investmentAdvice.riskLevel)">{{
              getRiskText(investmentAdvice.riskLevel)
            }}</span>
          </div>
        </div>
      </div>

      <!-- 交易時段建議 -->
      <div v-if="tradingAnalysis" class="lunar-card mb-6">
        <h4 class="font-semibold mb-3 flex items-center" style="color: var(--primary-text)">
          <span class="mr-2" style="color: var(--accent-text)">📊</span>
          交易時段建議
        </h4>

        <!-- 推薦交易時段 -->
        <div
          v-if="tradingAnalysis.recommendedTimes.length > 0"
          class="mb-4 p-3 trading-recommend rounded-lg"
        >
          <h5 class="text-green-600 font-semibold mb-2">推薦交易時段（今日）</h5>
          <div class="space-y-2">
            <div
              v-for="period in tradingAnalysis.recommendedTimes"
              :key="period.time"
              class="flex justify-between items-start"
            >
              <div class="flex-1">
                <span class="font-semibold" style="color: var(--primary-text)">{{
                  period.time
                }}</span>
                <span class="text-green-600 ml-2">{{ period.description }}</span>
              </div>
            </div>
          </div>
          <p class="text-xs text-green-600 mt-2">今日適合買入或加碼的時段</p>
        </div>

        <!-- 避免交易時段 -->
        <div v-if="tradingAnalysis.avoidTimes.length > 0" class="p-3 trading-avoid rounded-lg">
          <h5 class="text-red-600 font-semibold mb-2">避免交易時段（今日）</h5>
          <div class="space-y-2">
            <div
              v-for="period in tradingAnalysis.avoidTimes"
              :key="period.time"
              class="flex justify-between items-start"
            >
              <div class="flex-1">
                <span class="font-semibold" style="color: var(--primary-text)">{{
                  period.time
                }}</span>
                <span class="text-red-600 ml-2">{{ period.description }}</span>
              </div>
            </div>
          </div>
          <p class="text-xs text-red-600 mt-2">今日不宜進場操作的時段</p>
        </div>
      </div>

      <!-- 時辰分析 -->
      <div class="lunar-card">
        <h4 class="font-semibold mb-3 flex items-center" style="color: var(--primary-text)">
          <span class="mr-2" style="color: var(--accent-text)">🕐</span>
          今日時辰吉凶
        </h4>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div
            v-for="hour in hourAnalysis"
            :key="hour.time"
            :class="[
              'p-2 rounded text-center transition-all',
              hour.isLucky ? 'hour-lucky' : 'hour-normal',
            ]"
          >
            <div class="font-semibold">{{ hour.name }}</div>
            <div class="text-xs">{{ hour.time }}</div>
            <div class="text-xs mt-1 font-bold">{{ hour.isLucky ? '吉' : '平' }}</div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-8" style="color: var(--secondary-text)">
      <div v-if="loading" class="loading-spinner"></div>
      <div v-else class="text-red-500">
        <span class="text-2xl">⚠️</span><br />
        載入農民曆資料失敗
      </div>
      {{ loading ? '載入農民曆資料中...' : '請重新整理頁面' }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { lunarService, type LunarData, type InvestmentAdvice } from '../services/lunar'

// Props
interface Props {
  date?: Date
}

const props = withDefaults(defineProps<Props>(), {
  date: () => new Date(),
})

// State
const today = ref(props.date)
const lunarInfo = ref<LunarData | null>(null)
const loading = ref(true)

// Computed
const investmentAdvice = computed((): InvestmentAdvice | null => {
  if (!lunarInfo.value) return null
  return lunarService.getInvestmentAdvice(today.value)
})

// 新增：交易時段分析
const tradingAnalysis = computed(() => {
  if (!lunarInfo.value) return null
  return lunarService.getTradingTimeAnalysis(today.value)
})

const hourAnalysis = computed(() => {
  if (!lunarInfo.value) {
    // 如果沒有農民曆資料，返回預設值
    const hours = [
      { name: '子時', time: '23:00-01:00', isLucky: false },
      { name: '丑時', time: '01:00-03:00', isLucky: false },
      { name: '寅時', time: '03:00-05:00', isLucky: false },
      { name: '卯時', time: '05:00-07:00', isLucky: false },
      { name: '辰時', time: '07:00-09:00', isLucky: false },
      { name: '巳時', time: '09:00-11:00', isLucky: false },
      { name: '午時', time: '11:00-13:00', isLucky: false },
      { name: '未時', time: '13:00-15:00', isLucky: false },
      { name: '申時', time: '15:00-17:00', isLucky: false },
      { name: '酉時', time: '17:00-19:00', isLucky: false },
      { name: '戌時', time: '19:00-21:00', isLucky: false },
      { name: '亥時', time: '21:00-23:00', isLucky: false },
    ]
    return hours
  }

  // 根據日干支計算時辰吉凶
  const dayGan = lunarInfo.value.dayGanZhi[0] // 取日干
  const luckyHours = getLuckyHours(dayGan)

  const hours = [
    { name: '子時', time: '23:00-01:00', isLucky: luckyHours.includes('子') },
    { name: '丑時', time: '01:00-03:00', isLucky: luckyHours.includes('丑') },
    { name: '寅時', time: '03:00-05:00', isLucky: luckyHours.includes('寅') },
    { name: '卯時', time: '05:00-07:00', isLucky: luckyHours.includes('卯') },
    { name: '辰時', time: '07:00-09:00', isLucky: luckyHours.includes('辰') },
    { name: '巳時', time: '09:00-11:00', isLucky: luckyHours.includes('巳') },
    { name: '午時', time: '11:00-13:00', isLucky: luckyHours.includes('午') },
    { name: '未時', time: '13:00-15:00', isLucky: luckyHours.includes('未') },
    { name: '申時', time: '15:00-17:00', isLucky: luckyHours.includes('申') },
    { name: '酉時', time: '17:00-19:00', isLucky: luckyHours.includes('酉') },
    { name: '戌時', time: '19:00-21:00', isLucky: luckyHours.includes('戌') },
    { name: '亥時', time: '21:00-23:00', isLucky: luckyHours.includes('亥') },
  ]
  return hours
})

// Methods
const getLuckyHours = (dayGan: string): string[] => {
  // 根據日干計算吉時，這個是傳統的時辰吉凶計算
  const luckyHourMap: { [key: string]: string[] } = {
    甲: ['子', '卯', '午', '酉'], // 甲日：子卯午酉吉
    乙: ['丑', '辰', '未', '戌'], // 乙日：辰戌丑未吉
    丙: ['寅', '巳', '申', '亥'], // 丙日：寅申巳亥吉
    丁: ['卯', '午', '酉', '子'], // 丁日：卯酉子午吉
    戊: ['辰', '未', '戌', '丑'], // 戊日：辰戌丑未吉
    己: ['巳', '申', '亥', '寅'], // 己日：巳亥寅申吉
    庚: ['午', '酉', '子', '卯'], // 庚日：午子卯酉吉
    辛: ['未', '戌', '丑', '辰'], // 辛日：未丑辰戌吉
    壬: ['申', '亥', '寅', '巳'], // 壬日：申寅巳亥吉
    癸: ['酉', '子', '卯', '午'], // 癸日：酉卯午子吉
  }

  return luckyHourMap[dayGan] || []
}

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(date)
}

const getActionText = (action: string): string => {
  const actionMap: { [key: string]: string } = {
    buy: '買入',
    sell: '賣出',
    hold: '持有',
    observe: '觀望',
  }
  return actionMap[action] || action
}

const getRiskText = (risk: string): string => {
  const riskMap: { [key: string]: string } = {
    low: '低風險',
    medium: '中風險',
    high: '高風險',
  }
  return riskMap[risk] || risk
}

const getRiskColor = (risk: string): string => {
  const colorMap: { [key: string]: string } = {
    low: 'text-green-400 dark:text-green-400 light:text-green-600',
    medium: 'text-yellow-400 dark:text-yellow-400 light:text-yellow-600',
    high: 'text-red-400 dark:text-red-400 light:text-red-600',
  }
  return colorMap[risk] || 'text-gray-400 dark:text-gray-400 light:text-gray-600'
}

const loadLunarInfo = async () => {
  try {
    loading.value = true
    // 確保使用當前時間，避免快取舊數據
    const currentDate = new Date()
    today.value = currentDate

    console.log(
      'LunarCalendarCard - 載入農民曆，當前日期:',
      currentDate.toLocaleDateString('zh-TW')
    )
    lunarInfo.value = lunarService.getLunarData(currentDate)

    console.log('LunarCalendarCard - 農民曆資料:', {
      ganZhi: lunarInfo.value.ganZhi,
      lunarMonth: lunarInfo.value.lunarMonth,
      lunarDay: lunarInfo.value.lunarDay,
      zodiac: lunarInfo.value.zodiac,
    })
  } catch (error) {
    console.error('載入農民曆資料失敗:', error)
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadLunarInfo()
})
</script>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 農民曆專用樣式 */
.lunar-card {
  background: var(--card-bg);
  border: 1px solid var(--border-light);
  padding: 1rem;
  border-radius: 0.75rem;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 16px var(--shadow-light);
  transition: all 0.3s ease;
}

.lunar-card:hover {
  box-shadow: 0 8px 32px var(--shadow-medium);
  transform: translateY(-1px);
}

/* 節日標籤 */
.festival-tag {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  border: 1px solid;
  font-weight: 500;
}

.festival-tag-green {
  background-color: rgba(34, 197, 94, 0.1);
  color: #059669;
  border-color: rgba(34, 197, 94, 0.3);
}

:root.light .festival-tag-green {
  background-color: rgba(34, 197, 94, 0.08);
  color: #047857;
  border-color: rgba(34, 197, 94, 0.2);
}

.festival-tag-red {
  background-color: rgba(239, 68, 68, 0.1);
  color: #dc2626;
  border-color: rgba(239, 68, 68, 0.3);
}

:root.light .festival-tag-red {
  background-color: rgba(239, 68, 68, 0.08);
  color: #b91c1c;
  border-color: rgba(239, 68, 68, 0.2);
}

/* 宜忌標籤 */
.yi-tag {
  padding: 0.25rem 0.5rem;
  background-color: rgba(34, 197, 94, 0.1);
  color: #059669;
  border-radius: 9999px;
  font-size: 0.75rem;
  border: 1px solid rgba(34, 197, 94, 0.3);
  font-weight: 500;
}

:root.light .yi-tag {
  background-color: rgba(34, 197, 94, 0.08);
  color: #047857;
  border-color: rgba(34, 197, 94, 0.2);
}

.ji-tag {
  padding: 0.25rem 0.5rem;
  background-color: rgba(239, 68, 68, 0.1);
  color: #dc2626;
  border-radius: 9999px;
  font-size: 0.75rem;
  border: 1px solid rgba(239, 68, 68, 0.3);
  font-weight: 500;
}

:root.light .ji-tag {
  background-color: rgba(239, 68, 68, 0.08);
  color: #b91c1c;
  border-color: rgba(239, 68, 68, 0.2);
}

/* 交易時段建議 */
.trading-recommend {
  background-color: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
}

:root.light .trading-recommend {
  background-color: rgba(34, 197, 94, 0.05);
  border-color: rgba(34, 197, 94, 0.15);
}

.trading-avoid {
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

:root.light .trading-avoid {
  background-color: rgba(239, 68, 68, 0.05);
  border-color: rgba(239, 68, 68, 0.15);
}

/* 時辰分析 */
.hour-lucky {
  background-color: rgba(34, 197, 94, 0.15);
  color: #059669;
  border: 1px solid rgba(34, 197, 94, 0.4);
}

:root.light .hour-lucky {
  background-color: rgba(34, 197, 94, 0.08);
  color: #047857;
  border-color: rgba(34, 197, 94, 0.2);
}

.hour-normal {
  background-color: var(--surface-bg);
  color: var(--secondary-text);
  border: 1px solid var(--border-light);
}

/* 載入動畫 */
.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 4px solid var(--border-light);
  border-top-color: var(--accent-text);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 0.5rem;
}
</style>
