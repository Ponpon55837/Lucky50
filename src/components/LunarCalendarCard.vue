<script setup lang="ts">
import { computed } from 'vue'
import { useDashboardStore } from '@/stores/dashboard'
import { useUserStore } from '@/stores/user'

// 使用全域狀態管理 - 純粹消費資料，不重複載入
const dashboardStore = useDashboardStore()
const userStore = useUserStore()

// 計算屬性 - 直接使用dashboard store中的資料
const lunarInfo = computed(() => dashboardStore.lunarData)
const loading = computed(() => dashboardStore.lunarLoading)

// 動態時辰分析，基於農民曆資料和用戶生肖
const hourAnalysis = computed(() => {
  // 基本時辰資料
  const hours = [
    { name: '子時', time: '23:00-01:00', zhi: '子' },
    { name: '丑時', time: '01:00-03:00', zhi: '丑' },
    { name: '寅時', time: '03:00-05:00', zhi: '寅' },
    { name: '卯時', time: '05:00-07:00', zhi: '卯' },
    { name: '辰時', time: '07:00-09:00', zhi: '辰' },
    { name: '巳時', time: '09:00-11:00', zhi: '巳' },
    { name: '午時', time: '11:00-13:00', zhi: '午' },
    { name: '未時', time: '13:00-15:00', zhi: '未' },
    { name: '申時', time: '15:00-17:00', zhi: '申' },
    { name: '酉時', time: '17:00-19:00', zhi: '酉' },
    { name: '戌時', time: '19:00-21:00', zhi: '戌' },
    { name: '亥時', time: '21:00-23:00', zhi: '亥' },
  ]

  // 如果沒有農民曆資料，返回中性時辰
  if (!lunarInfo.value) {
    return hours.map(hour => ({
      ...hour,
      isLucky: false,
      status: '待載入',
    }))
  }

  // 根據農民曆的日天干推算吉時
  const dayGan = lunarInfo.value.dayGanZhi?.charAt(0) // 取天干
  const luckyZhi = getLuckyZhiByGan(dayGan)

  // 優先使用用戶個人生肖，否則使用當年生肖
  const userZodiac = userStore.profile?.zodiac || lunarInfo.value.zodiac

  return hours.map(hour => {
    let isLucky = false
    let status = '平'

    // 基於天干的吉時判斷
    if (luckyZhi.includes(hour.zhi)) {
      isLucky = true
      status = '吉'
    }

    // 基於用戶生肖的進一步調整
    if (userZodiac) {
      const zodiacLuckyZhi = getZodiacLuckyZhi(userZodiac)
      if (zodiacLuckyZhi.includes(hour.zhi)) {
        isLucky = true
        status = '大吉'
      }

      // 檢查是否為沖時
      const clashZhi = getClashZhi(userZodiac)
      if (clashZhi.includes(hour.zhi)) {
        isLucky = false
        status = '忌'
      }
    }

    return {
      ...hour,
      isLucky,
      status,
    }
  })
})

// 用於顯示分析基準的計算屬性
const analysisBase = computed(() => {
  if (!lunarInfo.value) return { dayGanZhi: '載入中...', zodiac: '載入中...' }

  const userZodiac = userStore.profile?.zodiac || lunarInfo.value.zodiac
  const zodiacSource = userStore.profile?.zodiac ? '(個人生肖)' : '(當年生肖)'

  return {
    dayGanZhi: lunarInfo.value.dayGanZhi,
    zodiac: `${userZodiac} ${zodiacSource}`,
  }
})

// 根據天干獲取對應的吉時地支
function getLuckyZhiByGan(gan: string): string[] {
  const ganToZhi: Record<string, string[]> = {
    甲: ['子', '辰', '申'], // 甲日貴人在子辰申
    乙: ['丑', '巳', '酉'], // 乙日貴人在丑巳酉
    丙: ['寅', '午', '戌'], // 丙日貴人在寅午戌
    丁: ['卯', '未', '亥'], // 丁日貴人在卯未亥
    戊: ['辰', '申', '子'], // 戊日貴人在辰申子
    己: ['巳', '酉', '丑'], // 己日貴人在巳酉丑
    庚: ['午', '戌', '寅'], // 庚日貴人在午戌寅
    辛: ['未', '亥', '卯'], // 辛日貴人在未亥卯
    壬: ['申', '子', '辰'], // 壬日貴人在申子辰
    癸: ['酉', '丑', '巳'], // 癸日貴人在酉丑巳
  }

  return ganToZhi[gan] || ['辰', '午'] // 預設吉時
}

// 根據生肖獲取對應的三合吉時
function getZodiacLuckyZhi(zodiac: string): string[] {
  const zodiacToZhi: Record<string, string[]> = {
    鼠: ['子', '辰', '申'], // 申子辰三合
    牛: ['丑', '巳', '酉'], // 巳酉丑三合
    虎: ['寅', '午', '戌'], // 寅午戌三合
    兔: ['卯', '未', '亥'], // 亥卯未三合
    龍: ['辰', '子', '申'], // 申子辰三合
    蛇: ['巳', '酉', '丑'], // 巳酉丑三合
    馬: ['午', '寅', '戌'], // 寅午戌三合
    羊: ['未', '亥', '卯'], // 亥卯未三合
    猴: ['申', '子', '辰'], // 申子辰三合
    雞: ['酉', '丑', '巳'], // 巳酉丑三合
    狗: ['戌', '寅', '午'], // 寅午戌三合
    豬: ['亥', '卯', '未'], // 亥卯未三合
  }

  return zodiacToZhi[zodiac] || []
}

// 根據生肖獲取相沖的時辰（需要避免的時辰）
function getClashZhi(zodiac: string): string[] {
  const zodiacClash: Record<string, string[]> = {
    鼠: ['午'], // 子午相沖
    牛: ['未'], // 丑未相沖
    虎: ['申'], // 寅申相沖
    兔: ['酉'], // 卯酉相沖
    龍: ['戌'], // 辰戌相沖
    蛇: ['亥'], // 巳亥相沖
    馬: ['子'], // 午子相沖
    羊: ['丑'], // 未丑相沖
    猴: ['寅'], // 申寅相沖
    雞: ['卯'], // 酉卯相沖
    狗: ['辰'], // 戌辰相沖
    豬: ['巳'], // 亥巳相沖
  }

  return zodiacClash[zodiac] || []
}
</script>

<template>
  <div class="card">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
      <h3 class="text-lg sm:text-xl font-bold flex items-center" style="color: var(--primary-text)">
        <span class="mr-2" style="color: var(--accent-text)">📆</span>
        今日農民曆
      </h3>
      <div class="text-sm" style="color: var(--secondary-text)">
        {{ dashboardStore.formattedCurrentDate }}
      </div>
    </div>

    <div v-if="lunarInfo && !loading" class="space-y-4">
      <!-- 農曆日期 -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
      <div v-if="lunarInfo.jieQi" class="lunar-card">
        <h4 class="font-semibold mb-2" style="color: var(--accent-text)">節氣節日</h4>
        <div class="flex flex-wrap gap-2">
          <span v-if="lunarInfo.jieQi" class="festival-tag festival-tag-green">
            {{ lunarInfo.jieQi }}
          </span>
        </div>
      </div>

      <!-- 宜忌事項 -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
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

      <!-- 時辰分析 -->
      <div class="lunar-card">
        <h4 class="font-semibold mb-3 flex items-center" style="color: var(--primary-text)">
          <span class="mr-2" style="color: var(--accent-text)">🕐</span>
          今日時辰吉凶分析
        </h4>
        <div class="text-xs mb-3" style="color: var(--secondary-text)">
          基於農民曆 {{ analysisBase.dayGanZhi }} 日和生肖 {{ analysisBase.zodiac }} 推算
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
          <div
            v-for="hour in hourAnalysis"
            :key="hour.time"
            :class="[
              'hour-card',
              {
                'hour-daji': hour.status === '大吉',
                'hour-ji': hour.status === '吉',
                'hour-ji-bad': hour.status === '忌',
                'hour-normal': hour.status === '平' || hour.status === '待載入',
              },
            ]"
          >
            <div class="font-bold text-sm mb-1">
              {{ hour.name }}
            </div>
            <div class="text-xs opacity-75 mb-2">
              {{ hour.time }}
            </div>
            <div class="text-sm font-bold flex items-center justify-center">
              <span v-if="hour.status === '大吉'" class="mr-1">⭐</span>
              <span v-else-if="hour.status === '吉'" class="mr-1">✨</span>
              <span v-else-if="hour.status === '忌'" class="mr-1">⚠️</span>
              <span v-else-if="hour.status === '平'" class="mr-1">◐</span>
              {{ hour.status }}
            </div>
          </div>
        </div>
        <div class="mt-3 text-xs" style="color: var(--secondary-text)">
          <span class="text-green-600">大吉⭐</span>：生肖三合吉時 |
          <span class="text-green-500">吉✨</span>：天干貴人吉時 |
          <span class="text-gray-500">平</span>：普通時辰 |
          <span class="text-red-500">忌⚠️</span>：生肖相沖時辰
        </div>
      </div>
    </div>

    <div v-else class="text-center py-8" style="color: var(--secondary-text)">
      <div v-if="loading" class="loading-spinner" />
      <div v-else class="text-red-500">
        <span class="text-2xl">⚠️</span><br />
        載入農民曆資料失敗
      </div>
      {{ loading ? '載入農民曆資料中...' : '請重新整理頁面' }}
    </div>
  </div>
</template>
<style scoped>
/* 全局動畫 */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* 主容器樣式 */
.card {
  animation: fadeInUp 0.6s ease-out;
}

/* 農民曆專用卡片樣式 */
.lunar-card {
  background: var(--card-bg);
  border: 1px solid var(--border-light);
  padding: 1.25rem;
  border-radius: 1rem;
  backdrop-filter: blur(12px);
  box-shadow:
    0 4px 16px var(--shadow-light),
    0 1px 4px rgba(0, 0, 0, 0.02);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.lunar-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--accent-text), transparent);
  transition: left 0.6s ease;
}

.lunar-card:hover {
  box-shadow:
    0 12px 40px var(--shadow-medium),
    0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px) scale(1.02);
  border-color: var(--accent-text);
}

.lunar-card:hover::before {
  left: 100%;
}

/* 現代化節日標籤 */
.festival-tag {
  display: inline-flex;
  align-items: center;
  padding: 0.375rem 0.75rem;
  border-radius: 2rem;
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.025em;
  border: 1px solid;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.festival-tag::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.6s ease;
}

.festival-tag:hover::before {
  left: 100%;
}

.festival-tag-green {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.05));
  color: #047857;
  border-color: rgba(34, 197, 94, 0.4);
  box-shadow: 0 2px 8px rgba(34, 197, 94, 0.2);
}

.festival-tag-green:hover {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.25), rgba(34, 197, 94, 0.1));
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(34, 197, 94, 0.3);
}

:root.light .festival-tag-green {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.02));
  color: #065f46;
  border-color: rgba(34, 197, 94, 0.3);
}

.festival-tag-red {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05));
  color: #b91c1c;
  border-color: rgba(239, 68, 68, 0.4);
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.2);
}

.festival-tag-red:hover {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(239, 68, 68, 0.1));
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(239, 68, 68, 0.3);
}

:root.light .festival-tag-red {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.02));
  color: #991b1b;
  border-color: rgba(239, 68, 68, 0.3);
}

/* 現代化宜忌標籤 */
.yi-tag {
  padding: 0.375rem 0.75rem;
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.08));
  color: #047857;
  border-radius: 2rem;
  font-size: 0.75rem;
  border: 1px solid rgba(34, 197, 94, 0.4);
  font-weight: 600;
  letter-spacing: 0.025em;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  box-shadow: 0 2px 8px rgba(34, 197, 94, 0.15);
}

.yi-tag::before {
  content: '✓';
  margin-right: 0.25rem;
  font-weight: bold;
}

.yi-tag:hover {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.25), rgba(34, 197, 94, 0.12));
  transform: translateY(-1px) scale(1.05);
  box-shadow: 0 4px 16px rgba(34, 197, 94, 0.25);
}

:root.light .yi-tag {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.12), rgba(34, 197, 94, 0.05));
  color: #065f46;
  border-color: rgba(34, 197, 94, 0.3);
}

.ji-tag {
  padding: 0.375rem 0.75rem;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.08));
  color: #b91c1c;
  border-radius: 2rem;
  font-size: 0.75rem;
  border: 1px solid rgba(239, 68, 68, 0.4);
  font-weight: 600;
  letter-spacing: 0.025em;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.15);
}

.ji-tag::before {
  content: '✗';
  margin-right: 0.25rem;
  font-weight: bold;
}

.ji-tag:hover {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(239, 68, 68, 0.12));
  transform: translateY(-1px) scale(1.05);
  box-shadow: 0 4px 16px rgba(239, 68, 68, 0.25);
}

:root.light .ji-tag {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(239, 68, 68, 0.05));
  color: #991b1b;
  border-color: rgba(239, 68, 68, 0.3);
}

/* 時辰分析樣式優化 */
.hour-card {
  padding: 0.75rem;
  border-radius: 0.75rem;
  text-align: center;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(8px);
  cursor: pointer;
}

.hour-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 2px;
  transition: left 0.6s ease;
}

.hour-card:hover::before {
  left: 100%;
}

/* 大吉時辰樣式 */
.hour-daji {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.1));
  border-color: rgba(34, 197, 94, 0.5);
  color: #047857;
  box-shadow:
    0 4px 16px rgba(34, 197, 94, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.hour-daji::before {
  background: linear-gradient(90deg, transparent, rgba(34, 197, 94, 0.8), transparent);
}

.hour-daji:hover {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(34, 197, 94, 0.15));
  transform: translateY(-2px) scale(1.05);
  box-shadow:
    0 8px 24px rgba(34, 197, 94, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

/* 吉時辰樣式 */
.hour-ji {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.05));
  border-color: rgba(34, 197, 94, 0.4);
  color: #059669;
  box-shadow:
    0 2px 12px rgba(34, 197, 94, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.hour-ji::before {
  background: linear-gradient(90deg, transparent, rgba(34, 197, 94, 0.6), transparent);
}

.hour-ji:hover {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.25), rgba(34, 197, 94, 0.1));
  transform: translateY(-1px) scale(1.02);
  box-shadow:
    0 6px 20px rgba(34, 197, 94, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.12);
}

/* 忌時辰樣式 */
.hour-ji-bad {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.1));
  border-color: rgba(239, 68, 68, 0.5);
  color: #b91c1c;
  box-shadow:
    0 4px 16px rgba(239, 68, 68, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.hour-ji-bad::before {
  background: linear-gradient(90deg, transparent, rgba(239, 68, 68, 0.8), transparent);
}

.hour-ji-bad:hover {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(239, 68, 68, 0.15));
  transform: translateY(-2px) scale(1.05);
  box-shadow:
    0 8px 24px rgba(239, 68, 68, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

/* 普通時辰樣式 */
.hour-normal {
  background: var(--surface-bg);
  color: var(--secondary-text);
  border-color: var(--border-light);
  box-shadow:
    0 2px 8px var(--shadow-light),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.hour-normal::before {
  background: linear-gradient(90deg, transparent, var(--border-light), transparent);
}

.hour-normal:hover {
  background: var(--card-bg);
  transform: translateY(-1px);
  box-shadow:
    0 4px 16px var(--shadow-medium),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

/* 載入動畫優化 */
.loading-spinner {
  width: 2.5rem;
  height: 2.5rem;
  border: 4px solid var(--border-light);
  border-top-color: var(--accent-text);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
  position: relative;
}

.loading-spinner::after {
  content: '';
  position: absolute;
  inset: 4px;
  border: 2px solid transparent;
  border-top-color: rgba(var(--accent-rgb), 0.3);
  border-radius: 50%;
  animation: spin 1.5s linear infinite reverse;
}

/* 響應式優化 */
@media (max-width: 768px) {
  .lunar-card {
    padding: 1rem;
    border-radius: 0.75rem;
  }

  .festival-tag,
  .yi-tag,
  .ji-tag {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
  }

  .hour-card {
    padding: 0.5rem;
    font-size: 0.75rem;
  }
}

/* 深色模式優化 */
:root.dark .lunar-card {
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.3),
    0 1px 4px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

:root.dark .lunar-card:hover {
  box-shadow:
    0 12px 48px rgba(0, 0, 0, 0.4),
    0 4px 16px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

/* 漸變動畫 */
@keyframes gradientShift {
  0%,
  100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

.animated-bg {
  background-size: 200% 200%;
  animation: gradientShift 3s ease infinite;
}

/* 輔助類 */
.glass-effect {
  backdrop-filter: blur(16px) saturate(180%);
  background-color: rgba(var(--card-bg-rgb), 0.8);
  border: 1px solid rgba(255, 255, 255, 0.125);
}

.shadow-glow {
  filter: drop-shadow(0 0 8px rgba(var(--accent-rgb), 0.3));
}
</style>
