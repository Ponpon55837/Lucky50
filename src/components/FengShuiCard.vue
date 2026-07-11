<template>
  <div class="card">
    <h3 class="text-lg font-bold mb-4 flex items-center">
      <span class="text-gold-400 mr-2">🧭</span>
      <span class="text-white">風水方位與流日</span>
    </h3>

    <div v-if="loading" class="text-center py-8 text-gray-400">計算中...</div>

    <div v-else-if="error" class="text-center py-8 text-red-400">
      {{ error }}
    </div>

    <template v-else-if="result">
      <!-- 流日概覽 -->
      <div class="text-center mb-6 p-4 bg-white/5 rounded-lg">
        <div class="text-sm text-amber-400 mb-1">今日流日</div>
        <div class="text-2xl font-bold text-white">
          {{ result.daily.stem }}{{ result.daily.branch }}
        </div>
        <div class="text-sm text-gray-400 mt-1">五行：{{ elementLabel(result.daily.element) }}</div>
        <div class="text-lg font-bold mt-2" :class="dailyScoreColor">
          {{ result.daily.overallScore }}分
        </div>
        <div class="text-sm text-gray-300 mt-1">
          {{ result.daily.advice }}
        </div>
      </div>

      <!-- 吉方 -->
      <div class="mb-4">
        <h4 class="text-sm font-bold text-green-400 mb-2">吉方</h4>
        <div class="space-y-2">
          <div
            v-for="(dir, idx) in result.luckyDirections"
            :key="idx"
            class="flex items-center justify-between p-2 bg-white/5 rounded"
          >
            <div class="flex items-center gap-2">
              <span class="text-lg">{{ directionIcon(dir.direction) }}</span>
              <span class="font-bold text-sm text-white">{{ dir.direction }}</span>
            </div>
            <div class="text-right">
              <div class="text-sm text-green-400">{{ dir.score }}分</div>
              <div class="text-xs text-gray-500">
                {{ dir.reason }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 凶方 -->
      <div class="mb-4">
        <h4 class="text-sm font-bold text-red-400 mb-2">凶方</h4>
        <div class="space-y-1">
          <div
            v-for="(dir, idx) in result.avoidDirections"
            :key="idx"
            class="flex items-center gap-2 p-2 bg-white/5 rounded"
          >
            <span class="text-lg">{{ directionIcon(dir.direction) }}</span>
            <span class="text-sm text-red-400">{{ dir.direction }}</span>
            <span class="text-xs text-gray-500 ml-auto">{{ dir.reason }}</span>
          </div>
        </div>
      </div>

      <!-- 幸運元素 -->
      <div class="grid grid-cols-2 gap-2">
        <div class="p-2 bg-white/5 rounded">
          <div class="text-xs text-amber-400 mb-1">幸運五行</div>
          <div class="flex flex-wrap gap-1">
            <span
              v-for="el in result.favorableElements"
              :key="el"
              class="text-xs px-2 py-1 bg-amber-500/10 text-amber-300 rounded"
            >
              {{ elementLabel(el) }}
            </span>
          </div>
        </div>
        <div class="p-2 bg-white/5 rounded">
          <div class="text-xs text-gray-500 mb-1">避開五行</div>
          <div class="flex flex-wrap gap-1">
            <span
              v-for="el in result.unfavorableElements"
              :key="el"
              class="text-xs px-2 py-1 bg-white/10 text-gray-400 rounded"
            >
              {{ elementLabel(el) }}
            </span>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="text-center py-8 text-gray-500">請先設定出生資料</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { FengShuiEngine } from '@/services/engines/fengShui'
import { lunarService } from '@/services/lunar'
import type { UserProfileCompat } from '@/services/integratedFortune'

interface DirectionInfo {
  direction: string
  reason: string
  score?: number
}

interface DailyFortune {
  stem: string
  branch: string
  element: string
  overallScore: number
  advice: string
  favorableElements: string[]
  unfavorableElements: string[]
}

interface FengShuiResult {
  score: number
  luckyDirections: DirectionInfo[]
  avoidDirections: DirectionInfo[]
  daily: DailyFortune
  favorableElements: string[]
  unfavorableElements: string[]
}

const props = defineProps<{
  profile: UserProfileCompat | null
}>()

const engine = new FengShuiEngine()
const result = ref<FengShuiResult | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

const dailyScoreColor = computed(() => {
  const score = result.value?.daily.overallScore || 0
  if (score >= 75) return 'text-green-600'
  if (score >= 55) return 'text-blue-600'
  return 'text-orange-600'
})

const elementLabel = (el: string): string => {
  const map: Record<string, string> = {
    wood: '木',
    fire: '火',
    earth: '土',
    metal: '金',
    water: '水',
  }
  return map[el] || el
}

const directionIcon = (dir: string): string => {
  if (dir.includes('東') && dir.includes('北')) return '↖️'
  if (dir.includes('東') && dir.includes('南')) return '↙️'
  if (dir.includes('西') && dir.includes('北')) return '↗️'
  if (dir.includes('西') && dir.includes('南')) return '↘️'
  if (dir.includes('東')) return '⬅️'
  if (dir.includes('西')) return '➡️'
  if (dir.includes('南')) return '⬇️'
  if (dir.includes('北')) return '⬆️'
  return '⏺️'
}

function calculate() {
  if (!props.profile) {
    result.value = null
    return
  }

  loading.value = true
  error.value = null

  try {
    const lunarData = lunarService.getLunarData(new Date(props.profile.birthDate))
    const mockBaZi = {
      yearGanZhi: lunarData.ganZhi,
      monthGanZhi: lunarData.monthGanZhi,
      dayGanZhi: lunarData.dayGanZhi,
      hourGanZhi: lunarData.ganZhi,
      zodiac: lunarData.zodiac,
      element: props.profile.element,
      naYin: lunarData.naYin,
    }
    const mockElements = { wood: 20, fire: 20, earth: 20, metal: 20, water: 20 }

    const raw = engine.calculate(props.profile, new Date(), lunarData, mockBaZi, mockElements)

    const details = raw.details as Record<string, unknown>

    result.value = {
      score: raw.score,
      luckyDirections: (details.luckyDirections as DirectionInfo[]) || [],
      avoidDirections: (details.avoidDirections as DirectionInfo[]) || [],
      daily: (details.dailyFortune as DailyFortune) || {
        stem: '',
        branch: '',
        element: 'earth',
        overallScore: 50,
        advice: '',
        favorableElements: [],
        unfavorableElements: [],
      },
      favorableElements: raw.luckyElements || [],
      unfavorableElements: raw.avoidElements || [],
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
