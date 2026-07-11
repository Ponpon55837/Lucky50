<script setup lang="ts">
import { ref, computed, onMounted, defineAsyncComponent } from 'vue'
import { useUserStore } from '@/stores/user'
import type { FortuneRecord, HistoryQueryOptions, HistoryStats } from '@/types/history'
import '@vuepic/vue-datepicker/dist/main.css'
import { fortuneHistoryStore } from '@/services/fortuneStore'
import { IntegratedFortuneService } from '@/services/integratedFortune'
import { toLocalDateString } from '@/utils/date'

const VueDatePicker = defineAsyncComponent(() =>
  import('@vuepic/vue-datepicker').then(m => m.default)
)

// ── Props / Emits ──
interface Props {
  pageSize?: number
}

const props = withDefaults(defineProps<Props>(), {
  pageSize: 30,
})

const emit = defineEmits<{
  confirmClear: []
}>()

// ── 常量與設定 ──
const now = new Date()
const sixMonthsAgo = new Date(now)
sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

const defaultDateStart = toLocalDateString(sixMonthsAgo)
const defaultDateEnd = toLocalDateString(now)

const elementColors: Record<string, string> = {
  metal: '#9CA3AF',
  wood: '#22C55E',
  water: '#3B82F6',
  fire: '#EF4444',
  earth: '#A16207',
}
const elementLabels: Record<string, string> = {
  metal: '金',
  wood: '木',
  water: '水',
  fire: '火',
  earth: '土',
}

// ── 響應式狀態 ──
const records = ref<FortuneRecord[]>([])
const total = ref(0)
const pageIndex = ref(0)
const loading = ref(false)
const stats = ref<HistoryStats | null>(null)
const filtersExpanded = ref(false)
const showClearConfirm = ref(false)

const filterRecommendation = ref<FortuneRecord['recommendation'] | ''>('')
const filterDateStart = ref(defaultDateStart)
const filterDateEnd = ref(defaultDateEnd)
const searchText = ref('')

// ── 計算屬性 ──
const hasFilters = computed(
  () =>
    !!filterRecommendation.value ||
    !!filterDateStart.value ||
    !!filterDateEnd.value ||
    !!searchText.value
)

const activeFilterTags = computed(() => {
  const tags: { label: string; color: string }[] = []
  if (filterRecommendation.value) {
    const map = {
      BUY: { label: '買入', color: 'bg-green-500/20 text-green-400' },
      HOLD: { label: '持有', color: 'bg-yellow-500/20 text-yellow-400' },
      SELL: { label: '賣出', color: 'bg-red-500/20 text-red-400' },
    }
    tags.push(map[filterRecommendation.value])
  }
  if (filterDateStart.value && filterDateStart.value !== defaultDateStart) {
    tags.push({ label: filterDateStart.value.slice(5), color: 'bg-blue-500/20 text-blue-400' })
  }
  if (filterDateEnd.value && filterDateEnd.value !== defaultDateEnd) {
    tags.push({ label: filterDateEnd.value.slice(5), color: 'bg-blue-500/20 text-blue-400' })
  }
  if (searchText.value) {
    tags.push({ label: searchText.value, color: 'bg-purple-500/20 text-purple-400' })
  }
  return tags
})

const totalPages = computed(() => Math.ceil(total.value / props.pageSize))

// ── 生命週期 ──
onMounted(async () => {
  await fortuneHistoryStore.init()
  await Promise.all([loadRecords(), loadStats()])

  const today = toLocalDateString(new Date())
  const todayRecords = await fortuneHistoryStore.query({
    pageIndex: 0,
    dateRange: { start: today, end: today },
    pageSize: 1,
  })
  if (todayRecords.total === 0) {
    const userStore = useUserStore()
    const profile = userStore.profile
    if (profile && profile.name && profile.birthDate) {
      try {
        const userProfileCompat = {
          name: profile.name,
          birthDate: profile.birthDate,
          birthTime: profile.birthTime || '12:00',
          zodiac: profile.zodiac,
          element: profile.element,
          nameElement: profile.nameElement,
          nameStrokes: profile.nameStrokes,
          luckyColors: [...profile.luckyColors],
          luckyNumbers: [...profile.luckyNumbers],
        }
        await IntegratedFortuneService.calculateIntegratedFortune(userProfileCompat, new Date())
      } catch {
        // 計算失敗靜默處理
      }
      await Promise.all([loadRecords(), loadStats()])
    }
  }
})

// ── 方法與函式 ──
async function loadRecords() {
  loading.value = true
  try {
    const options: HistoryQueryOptions = {
      pageIndex: pageIndex.value,
      pageSize: props.pageSize,
    }
    if (filterRecommendation.value) {
      options.recommendation = filterRecommendation.value as FortuneRecord['recommendation']
    }
    if (filterDateStart.value && filterDateEnd.value) {
      options.dateRange = { start: filterDateStart.value, end: filterDateEnd.value }
    }
    if (searchText.value) {
      options.keyword = searchText.value
    }

    const result = await fortuneHistoryStore.query(options)
    records.value = result.records
    total.value = result.total
  } finally {
    loading.value = false
  }
}

async function loadStats() {
  stats.value = await fortuneHistoryStore.getStats()
}

function applyFilters() {
  pageIndex.value = 0
  loadRecords()
  filtersExpanded.value = false
}

function clearFilters() {
  filterRecommendation.value = ''
  filterDateStart.value = defaultDateStart
  filterDateEnd.value = defaultDateEnd
  searchText.value = ''
  pageIndex.value = 0
  loadRecords()
}

function toggleRecommendation(value: FortuneRecord['recommendation']) {
  filterRecommendation.value = filterRecommendation.value === value ? '' : value
  applyFilters()
}

function nextPage() {
  if (pageIndex.value < totalPages.value - 1) {
    pageIndex.value++
    loadRecords()
  }
}

function prevPage() {
  if (pageIndex.value > 0) {
    pageIndex.value--
    loadRecords()
  }
}

function openClearConfirm() {
  showClearConfirm.value = true
}

function closeClearConfirm() {
  showClearConfirm.value = false
}

async function confirmClearAll() {
  showClearConfirm.value = false
  emit('confirmClear')
  await fortuneHistoryStore.clear()
  records.value = []
  total.value = 0
  stats.value = null
  loadStats()
}

// ── 模板輔助 ──
const displayRecommendation = (
  rec: FortuneRecord['recommendation']
): { text: string; class: string } => {
  const map = {
    BUY: { text: '買入', class: 'bg-green-500/20 text-green-400 border border-green-500/30' },
    HOLD: { text: '持有', class: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' },
    SELL: { text: '賣出', class: 'bg-red-500/20 text-red-400 border border-red-500/30' },
  }
  return map[rec]
}

const formatDate = (dateStr: string, mobile = false): string => {
  const d = new Date(dateStr + 'T00:00:00')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  if (mobile) return `${mm}/${dd}`
  const w = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()]
  return `${mm}/${dd} 週${w}`
}

const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
}

function getScoreColor(score: number): string {
  if (score >= 70) return 'bg-emerald-500'
  if (score >= 40) return 'bg-amber-500'
  return 'bg-rose-500'
}
</script>

<template>
  <div class="space-y-4 sm:space-y-5">
    <!-- Stats -->
    <div
      v-if="stats && stats.totalRecords > 0"
      class="card !py-2.5 !px-3 sm:!py-3 sm:!px-6"
    >
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2">
        <div class="flex flex-wrap items-center gap-2 text-[11px] sm:text-sm">
          <div class="flex items-center gap-1">
            <span class="text-gray-500">均分</span>
            <span class="font-bold text-white">{{ stats.averageScore }}</span>
          </div>
          <div class="flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span class="text-gray-400">{{ stats.recommendationDistribution.BUY }}</span>
          </div>
          <div class="flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span class="text-gray-400">{{ stats.recommendationDistribution.HOLD }}</span>
          </div>
          <div class="flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span class="text-gray-400">{{ stats.recommendationDistribution.SELL }}</span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-gray-600 text-[11px]">
            共 {{ stats.totalRecords }} 筆
            <span
              v-if="stats.dateRange"
              class="hidden sm:inline"
            >
              · {{ stats.dateRange.earliest }} ~ {{ stats.dateRange.latest }}
            </span>
          </span>
          <button
            class="px-1.5 py-0.5 text-[10px] font-medium text-rose-400 hover:text-rose-300 border border-rose-800/50 rounded hover:bg-rose-900/20 transition-colors"
            @click="openClearConfirm"
          >
            清除
          </button>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="card !py-2.5 !px-3 sm:!py-3 sm:!px-6">
      <!-- Mobile: collapsed summary bar -->
      <div class="sm:hidden">
        <button
          class="w-full flex items-center justify-between gap-2"
          @click="filtersExpanded = !filtersExpanded"
        >
          <div class="flex items-center gap-2 min-w-0 overflow-hidden">
            <svg
              class="w-4 h-4 text-gray-500 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            <div
              v-if="activeFilterTags.length === 0"
              class="text-xs text-gray-500 truncate"
            >
              篩選條件
            </div>
            <div
              v-else
              class="flex items-center gap-1 overflow-hidden"
            >
              <span
                v-for="(tag, i) in activeFilterTags"
                :key="i"
                class="px-1.5 py-0.5 text-[10px] rounded-full shrink-0"
                :class="tag.color"
              >
                {{ tag.label }}
              </span>
            </div>
          </div>
          <svg
            class="w-4 h-4 text-gray-500 shrink-0 transition-transform duration-200"
            :class="{ 'rotate-180': filtersExpanded }"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        <!-- Expanded filters (mobile) -->
        <div
          v-show="filtersExpanded"
          class="mt-3 space-y-2 border-t border-white/5 pt-3"
        >
          <div class="flex gap-2">
            <input
              v-model="searchText"
              type="text"
              placeholder="搜尋"
              class="flex-1 min-w-0 px-3 py-2 text-sm bg-gray-800/40 border border-gray-700/60 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
              @keyup.enter="applyFilters"
            >
            <button
              class="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition-colors shrink-0"
              @click="applyFilters"
            >
              搜尋
            </button>
          </div>

          <!-- Chips -->
          <div class="flex items-center gap-2">
            <button
              v-for="rec in ['BUY', 'HOLD', 'SELL'] as const"
              :key="rec"
              class="px-3 py-1.5 text-xs font-medium rounded-full border transition-all"
              :class="
                filterRecommendation === rec
                  ? rec === 'BUY'
                    ? 'bg-green-500/30 text-green-400 border-green-500/50'
                    : rec === 'HOLD'
                      ? 'bg-yellow-500/30 text-yellow-400 border-yellow-500/50'
                      : 'bg-red-500/30 text-red-400 border-red-500/50'
                  : 'bg-gray-800/40 text-gray-500 border-gray-700/60 hover:text-gray-300'
              "
              @click="toggleRecommendation(rec)"
            >
              {{ rec === 'BUY' ? '買入' : rec === 'HOLD' ? '持有' : '賣出' }}
            </button>
          </div>

          <!-- Date range -->
          <div class="flex items-center gap-2">
            <VueDatePicker
              v-model="filterDateStart"
              :locale="'zh-TW'"
              :max-date="new Date(filterDateEnd)"
              :min-date="new Date(1900, 0, 1)"
              :enable-time-picker="false"
              :dark="true"
              :format="'yyyy年MM月dd日'"
              :auto-apply="true"
              placeholder="開始日期"
              class="flex-1"
              @update:model-value="applyFilters"
            />
            <span class="text-gray-600 shrink-0 text-sm">~</span>
            <VueDatePicker
              v-model="filterDateEnd"
              :locale="'zh-TW'"
              :max-date="new Date()"
              :min-date="new Date(filterDateStart)"
              :enable-time-picker="false"
              :dark="true"
              :format="'yyyy年MM月dd日'"
              :auto-apply="true"
              placeholder="結束日期"
              class="flex-1"
              @update:model-value="applyFilters"
            />
          </div>

          <button
            v-if="hasFilters"
            class="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            @click="clearFilters"
          >
            清除篩選
          </button>
        </div>
      </div>

      <!-- Desktop: always expanded -->
      <div class="hidden sm:block">
        <div class="flex flex-col gap-2">
          <div class="flex gap-2">
            <input
              v-model="searchText"
              type="text"
              placeholder="搜尋"
              class="flex-1 min-w-0 px-3 py-2 text-sm bg-gray-800/40 border border-gray-700/60 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
              @keyup.enter="applyFilters"
            >
            <button
              class="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition-colors shrink-0"
              @click="applyFilters"
            >
              搜尋
            </button>
          </div>
          <div class="flex items-center gap-3">
            <!-- Desktop Chips -->
            <div class="flex items-center gap-1.5">
              <button
                v-for="rec in ['BUY', 'HOLD', 'SELL'] as const"
                :key="rec"
                class="px-3 py-1.5 text-xs font-medium rounded-full border transition-all"
                :class="
                  filterRecommendation === rec
                    ? rec === 'BUY'
                      ? 'bg-green-500/30 text-green-400 border-green-500/50'
                      : rec === 'HOLD'
                        ? 'bg-yellow-500/30 text-yellow-400 border-yellow-500/50'
                        : 'bg-red-500/30 text-red-400 border-red-500/50'
                    : 'bg-gray-800/40 text-gray-500 border-gray-700/60 hover:text-gray-300'
                "
                @click="toggleRecommendation(rec)"
              >
                {{ rec === 'BUY' ? '買入' : rec === 'HOLD' ? '持有' : '賣出' }}
              </button>
            </div>
            <div class="flex items-center gap-1">
              <VueDatePicker
                v-model="filterDateStart"
                :locale="'zh-TW'"
                :max-date="new Date(filterDateEnd)"
                :min-date="new Date(1900, 0, 1)"
                :enable-time-picker="false"
                :dark="true"
                :format="'yyyy年MM月dd日'"
                :auto-apply="true"
                placeholder="開始日期"
                class="w-auto"
                @update:model-value="applyFilters"
              />
              <span class="text-gray-600 shrink-0 text-sm">~</span>
              <VueDatePicker
                v-model="filterDateEnd"
                :locale="'zh-TW'"
                :max-date="new Date()"
                :min-date="new Date(filterDateStart)"
                :enable-time-picker="false"
                :dark="true"
                :format="'yyyy年MM月dd日'"
                :auto-apply="true"
                placeholder="結束日期"
                class="w-auto"
                @update:model-value="applyFilters"
              />
            </div>
            <button
              v-if="hasFilters"
              class="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              @click="clearFilters"
            >
              清除篩選
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div
      v-if="loading"
      class="space-y-4 sm:space-y-0 sm:divide-y sm:divide-gray-800/60 sm:overflow-hidden sm:card sm:!p-0"
    >
      <div
        v-for="n in 5"
        :key="n"
        class="card sm:!rounded-none sm:!border-0 sm:!shadow-none !py-3 !px-3 sm:!py-4 sm:!px-6"
      >
        <!-- Mobile card skeleton -->
        <div class="sm:hidden space-y-2">
          <div class="flex items-center gap-2">
            <div class="w-12 h-3 bg-white/5 rounded animate-pulse" />
            <div class="w-7 h-7 bg-white/5 rounded-full animate-pulse" />
            <div class="w-10 h-5 bg-white/5 rounded-full animate-pulse" />
            <div class="ml-auto w-8 h-3 bg-white/5 rounded animate-pulse" />
          </div>
          <div class="flex items-center gap-1 pl-[52px]">
            <div
              v-for="e in 5"
              :key="e"
              class="w-5 h-1 bg-white/5 rounded-full animate-pulse"
            />
          </div>
        </div>
        <!-- Desktop list skeleton -->
        <div class="hidden sm:flex items-center gap-4">
          <div class="w-20 h-4 bg-white/5 rounded animate-pulse" />
          <div class="w-9 h-9 bg-white/5 rounded-full animate-pulse" />
          <div class="w-12 h-5 bg-white/5 rounded-full animate-pulse" />
          <div class="flex items-center gap-1 ml-auto">
            <div
              v-for="e in 5"
              :key="e"
              class="w-1.5 bg-white/5 rounded-full animate-pulse"
              :style="{ height: `${Math.max(4, 30 * 0.22)}px` }"
            />
          </div>
          <div class="w-10 h-3 bg-white/5 rounded animate-pulse" />
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="records.length === 0"
      class="card !py-12"
    >
      <div class="text-center text-gray-500">
        {{ hasFilters ? '沒有符合條件的記錄' : '尚無歷史記錄' }}
      </div>
    </div>

    <!-- Records List -->
    <div
      v-else
      class="sm:card sm:!p-0 sm:divide-y sm:divide-gray-800/60 sm:overflow-hidden"
    >
      <div
        v-for="record in records"
        :key="record.id"
        class="card !rounded-xl sm:!rounded-none sm:!border-0 sm:!shadow-none sm:!p-0 hover:bg-white/[0.02] transition-colors cursor-default"
      >
        <!-- Mobile: card layout -->
        <div class="sm:hidden">
          <div class="flex items-center gap-2 mb-1.5">
            <span class="text-[11px] font-medium text-white/70 leading-tight">
              {{ formatDate(record.date, true) }}
            </span>
            <div
              class="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
              :class="getScoreColor(record.investmentScore)"
            >
              {{ record.investmentScore }}
            </div>
            <span
              class="px-1.5 py-0.5 text-[10px] font-medium rounded-full shrink-0 leading-tight"
              :class="displayRecommendation(record.recommendation).class"
            >
              {{ displayRecommendation(record.recommendation).text }}
            </span>
            <span class="text-[10px] text-gray-600 ml-auto leading-tight">
              {{ formatTime(record.timestamp) }}
            </span>
          </div>
          <div class="flex items-center gap-1.5 pl-1">
            <div
              v-for="(value, key) in record.elements"
              :key="key"
              class="flex items-end gap-0.5"
            >
              <div
                class="w-5 h-1 rounded-full"
                :style="{
                  height: `${Math.max(4, value * 0.22)}px`,
                  backgroundColor: elementColors[key],
                }"
              />
              <span class="text-[8px] text-gray-600 leading-none">{{ elementLabels[key] }}</span>
            </div>
          </div>
          <p
            v-if="record.lunarSummary"
            class="mt-1.5 text-[10px] text-gray-400/70 line-clamp-1 leading-relaxed"
          >
            {{ record.lunarSummary }}
          </p>
        </div>

        <!-- Desktop: list layout -->
        <div class="hidden sm:flex items-center gap-4 py-3 px-6">
          <span class="text-sm font-medium text-white/70 min-w-20 leading-tight">
            {{ formatDate(record.date) }}
          </span>
          <div
            class="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            :class="getScoreColor(record.investmentScore)"
          >
            {{ record.investmentScore }}
          </div>
          <span
            class="px-2 py-0.5 text-xs font-medium rounded-full shrink-0 leading-tight"
            :class="displayRecommendation(record.recommendation).class"
          >
            {{ displayRecommendation(record.recommendation).text }}
          </span>
          <div class="flex items-center gap-1 ml-auto">
            <div
              v-for="(value, key) in record.elements"
              :key="key"
              class="w-1.5 rounded-full"
              :style="{
                height: `${Math.max(4, value * 0.22)}px`,
                backgroundColor: elementColors[key],
              }"
            />
          </div>
          <span class="text-xs text-gray-600 leading-tight">
            {{ formatTime(record.timestamp) }}
          </span>
          <p
            v-if="record.lunarSummary"
            class="absolute -bottom-0.5 left-[160px] text-xs text-gray-400/70 line-clamp-1 leading-relaxed"
          >
            {{ record.lunarSummary }}
          </p>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div
      v-if="totalPages > 1"
      class="flex items-center justify-between"
    >
      <button
        :disabled="pageIndex === 0"
        class="px-3 py-1.5 text-sm text-gray-500 hover:text-white bg-gray-800/20 hover:bg-gray-800/50 rounded-lg disabled:opacity-25 disabled:cursor-not-allowed transition-all"
        @click="prevPage"
      >
        ← 上一頁
      </button>
      <span class="text-sm text-gray-600"> {{ pageIndex + 1 }} / {{ totalPages }} </span>
      <button
        :disabled="pageIndex >= totalPages - 1"
        class="px-3 py-1.5 text-sm text-gray-500 hover:text-white bg-gray-800/20 hover:bg-gray-800/50 rounded-lg disabled:opacity-25 disabled:cursor-not-allowed transition-all"
        @click="nextPage"
      >
        下一頁 →
      </button>
    </div>

    <!-- Clear confirmation dialog -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showClearConfirm"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            class="absolute inset-0 bg-black/60 backdrop-blur-sm"
            @click="closeClearConfirm"
          />
          <div class="card relative w-full max-w-sm !py-6 !px-6 z-10">
            <h3 class="text-base font-semibold text-white mb-2">
              確認清除
            </h3>
            <p class="text-sm text-gray-400 mb-5">
              確定要清除所有運勢歷史記錄嗎？此操作無法復原。
            </p>
            <div class="flex justify-end gap-2">
              <button
                class="px-4 py-2 text-sm text-gray-400 hover:text-white bg-gray-800/40 hover:bg-gray-800/60 rounded-lg transition-colors"
                @click="closeClearConfirm"
              >
                取消
              </button>
              <button
                class="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors"
                @click="confirmClearAll"
              >
                確認清除
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
