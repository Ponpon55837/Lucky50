<template>
  <div class="card">
    <h3 class="text-lg font-bold mb-4 flex items-center">
      <span class="text-gold-400 mr-2">🔮</span>
      <span class="text-white">八字十神分析</span>
    </h3>

    <div
      v-if="loading"
      class="text-center py-8 text-gray-400"
    >
      計算中...
    </div>

    <div
      v-else-if="error"
      class="text-center py-8 text-red-400"
    >
      {{ error }}
    </div>

    <template v-else-if="result">
      <!-- 綜合分數 -->
      <div class="text-center mb-6">
        <div
          class="text-4xl font-bold"
          :class="scoreColor"
        >
          {{ result.score }}
        </div>
        <div class="text-sm text-gray-400 mt-1">
          十神能量分數
        </div>
      </div>

      <!-- 四柱十神 -->
      <div
        v-if="result.distribution"
        class="grid grid-cols-4 gap-2 mb-6"
      >
        <div
          v-for="(label, key) in pillarLabels"
          :key="key"
          class="text-center p-3 bg-white/5 rounded"
        >
          <div class="text-xs text-gray-400">
            {{ label }}
          </div>
          <div class="font-bold text-sm text-white mt-1">
            {{ result.distribution[key as keyof typeof result.distribution] }}
          </div>
          <div class="text-xs text-gray-500 mt-1">
            {{ result.ganZhi[key as keyof typeof result.ganZhi] }}
          </div>
        </div>
      </div>

      <!-- 投資風格 -->
      <div class="mb-4 p-4 bg-white/5 rounded-lg">
        <div class="text-sm font-bold text-amber-400 mb-1">
          投資風格
        </div>
        <div
          class="text-sm text-gray-300"
          :class="styleColor"
        >
          {{ result.personality }}
        </div>
      </div>

      <!-- 十神統計 -->
      <div
        v-if="result.counts"
        class="grid grid-cols-2 gap-2"
      >
        <div
          v-for="(count, god) in result.counts"
          :key="god"
          class="flex justify-between items-center p-2 bg-white/5 rounded text-sm"
        >
          <span class="text-gray-300">{{ god }}</span>
          <span
            class="font-bold"
            :class="count > 0 ? 'text-amber-400' : 'text-gray-500'"
          >
            {{ count }}
          </span>
        </div>
      </div>
    </template>

    <div
      v-else
      class="text-center py-8 text-gray-500"
    >
      請先設定出生資料
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { lunarService } from '@/services/lunar'
import {
  calculateFourPillarsTenGods,
  countTenGods,
  findDominantTenGods,
  inferInvestmentPersonality,
  TEN_GODS_INVESTMENT_STYLE,
} from '@/utils/tenGods'
import type { UserProfileCompat } from '@/services/integratedFortune'

interface TenGodsResult {
  score: number
  distribution: Record<string, string>
  counts: Record<string, number>
  ganZhi: Record<string, string>
  personality: string
}

const props = defineProps<{
  profile: UserProfileCompat | null
}>()

const result = ref<TenGodsResult | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

const pillarLabels: Record<string, string> = {
  year: '年柱',
  month: '月柱',
  day: '日柱',
  hour: '時柱',
}

const scoreColor = computed(() => {
  const score = result.value?.score || 0
  if (score >= 70) return 'text-green-600'
  if (score >= 50) return 'text-blue-600'
  return 'text-orange-600'
})

const styleColor = computed(() => {
  const personality = result.value?.personality || ''
  if (personality.includes('積極交易')) return 'text-red-600 dark:text-red-400'
  if (personality.includes('研究分析')) return 'text-purple-600 dark:text-purple-400'
  if (personality.includes('創意突破')) return 'text-amber-600 dark:text-amber-400'
  return 'text-blue-600 dark:text-blue-400'
})

function calculate() {
  if (!props.profile) {
    result.value = null
    return
  }

  loading.value = true
  error.value = null

  try {
    const lunarData = lunarService.getLunarData(new Date(props.profile.birthDate))
    const distribution = calculateFourPillarsTenGods(
      lunarData.ganZhi,
      lunarData.monthGanZhi,
      lunarData.dayGanZhi,
      lunarData.ganZhi // 使用年干支作為時柱近似值
    )

    const counts = countTenGods(distribution)
    const dominantGods = findDominantTenGods(counts)
    const personality = inferInvestmentPersonality(distribution)

    const maxCount = Math.max(...Object.values(counts))
    const concentration = maxCount / 4
    const score = Math.round(30 + concentration * 50)

    result.value = {
      score,
      distribution: distribution as unknown as Record<string, string>,
      counts: counts as unknown as Record<string, number>,
      ganZhi: {
        year: lunarData.ganZhi,
        month: lunarData.monthGanZhi,
        day: lunarData.dayGanZhi,
        hour: lunarData.ganZhi,
      },
      personality: `${personality.description} 主要十神：${dominantGods.map(g => `${g}(${TEN_GODS_INVESTMENT_STYLE[g]})`).join('、')}`,
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : '計算失敗'
  } finally {
    loading.value = false
  }
}

onMounted(calculate)
watch(() => props.profile, calculate)
</script>
