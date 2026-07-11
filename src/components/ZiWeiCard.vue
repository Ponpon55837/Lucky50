<template>
  <div class="card">
    <h3 class="text-lg font-bold mb-4 flex items-center">
      <span class="text-gold-400 mr-2">⭐</span>
      <span class="text-white">紫微斗數分析</span>
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
          紫微能量分數
        </div>
      </div>

      <!-- 命主星 -->
      <div class="mb-4 p-4 bg-white/5 rounded-lg text-center">
        <div class="text-sm text-amber-400 mb-1">
          命主星
        </div>
        <div class="text-xl font-bold text-white">
          {{ result.dominantStar }}
        </div>
        <div class="text-sm text-gray-400 mt-1">
          {{ result.investmentStyle }}
        </div>
      </div>

      <!-- 三星宮位 -->
      <div class="space-y-3 mb-4">
        <div
          v-for="(palace, name) in result.palaces"
          :key="name"
          class="p-3 bg-white/5 rounded-lg"
        >
          <div class="flex justify-between items-center mb-2">
            <span class="font-bold text-sm text-white">{{ name }}</span>
            <span
              class="text-sm"
              :class="palaceScoreColor(palace.score)"
            >
              {{ palace.score }}分
            </span>
          </div>
          <div class="flex flex-wrap gap-1">
            <span
              v-for="star in palace.stars.slice(0, 4)"
              :key="star"
              class="text-xs px-2 py-1 bg-amber-500/10 text-amber-300 rounded"
            >
              {{ star }}
            </span>
            <span
              v-if="palace.stars.length > 4"
              class="text-xs px-2 py-1 bg-white/10 text-gray-400 rounded"
            >
              +{{ palace.stars.length - 4 }}
            </span>
          </div>
          <div class="text-xs text-gray-500 mt-1">
            主星：{{ palace.dominantStar }} · {{ palace.risk }}
          </div>
        </div>
      </div>

      <!-- 風險評估 -->
      <div class="p-3 bg-white/5 rounded-lg">
        <div class="text-sm font-bold text-amber-400 mb-1">
          風險評估
        </div>
        <div class="text-sm text-gray-300">
          {{ result.riskProfile }}
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
import { ZiWeiEngine } from '@/services/engines/ziWei'
import { lunarService } from '@/services/lunar'
import type { UserProfileCompat } from '@/services/integratedFortune'

interface PalaceResult {
  stars: string[]
  score: number
  dominantStar: string
  risk: string
}

interface ZiWeiResult {
  score: number
  dominantStar: string
  investmentStyle: string
  riskProfile: string
  palaces: Record<string, PalaceResult>
}

const props = defineProps<{
  profile: UserProfileCompat | null
}>()

const engine = new ZiWeiEngine()
const result = ref<ZiWeiResult | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

const scoreColor = computed(() => {
  const score = result.value?.score || 0
  if (score >= 70) return 'text-green-600'
  if (score >= 50) return 'text-blue-600'
  return 'text-orange-600'
})

function palaceScoreColor(score: number): string {
  if (score >= 70) return 'text-green-600'
  if (score >= 50) return 'text-blue-600'
  return 'text-orange-600'
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
    const palaces = details.palaces as Record<string, PalaceResult>

    result.value = {
      score: raw.score,
      dominantStar: (details.dominantStar as string) || '紫微',
      investmentStyle: (details.investmentStyle as string) || '',
      riskProfile: (details.riskProfile as string) || '中風險',
      palaces,
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
