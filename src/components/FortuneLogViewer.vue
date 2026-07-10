<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { fortuneHistoryStore } from '@/services/fortuneStore'
import type { FortuneRecord, HistoryQueryOptions, HistoryStats } from '@/types/history'

interface Props {
  pageSize?: number
}

const props = withDefaults(defineProps<Props>(), {
  pageSize: 30,
})

const emit = defineEmits<{
  confirmClear: []
}>()

const records = ref<FortuneRecord[]>([])
const total = ref(0)
const pageIndex = ref(0)
const loading = ref(false)
const stats = ref<HistoryStats | null>(null)

const now = new Date()
const sixMonthsAgo = new Date(now)
sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

const filterRecommendation = ref<FortuneRecord['recommendation'] | ''>('')
const filterDateStart = ref(sixMonthsAgo.toISOString().split('T')[0])
const filterDateEnd = ref(now.toISOString().split('T')[0])
const searchText = ref('')

const hasFilters = computed(() =>
  !!filterRecommendation.value || !!filterDateStart.value || !!filterDateEnd.value || !!searchText.value
)

const totalPages = computed(() => Math.ceil(total.value / props.pageSize))

const displayRecommendation = (rec: FortuneRecord['recommendation']): { text: string; class: string } => {
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
}

function clearFilters() {
  filterRecommendation.value = ''
  filterDateStart.value = ''
  filterDateEnd.value = ''
  searchText.value = ''
  pageIndex.value = 0
  loadRecords()
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

async function clearAllHistory() {
  emit('confirmClear')
  await fortuneHistoryStore.clear()
  records.value = []
  total.value = 0
  stats.value = null
  loadStats()
}

onMounted(async () => {
  await fortuneHistoryStore.init()
  await Promise.all([loadRecords(), loadStats()])
})
</script>

<template>
  <div class="space-y-5">
    <!-- Stats -->
    <div v-if="stats && stats.totalRecords > 0" class="card !py-2.5 !px-3 sm:!py-3 sm:!px-6">
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
            <span v-if="stats.dateRange" class="hidden sm:inline">
              · {{ stats.dateRange.earliest }} ~ {{ stats.dateRange.latest }}
            </span>
          </span>
          <button
            @click="clearAllHistory"
            class="px-1.5 py-0.5 text-[10px] font-medium text-rose-400 hover:text-rose-300 border border-rose-800/50 rounded hover:bg-rose-900/20 transition-colors"
          >
            清除
          </button>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="card !py-2.5 !px-3 sm:!py-3 sm:!px-6">
      <div class="flex flex-col gap-2">
        <div class="flex gap-2">
          <input
            v-model="searchText"
            @keyup.enter="applyFilters"
            type="text"
            placeholder="搜尋"
            class="flex-1 min-w-0 px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm bg-gray-800/40 border border-gray-700/60 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
          />
          <button
            @click="applyFilters"
            class="px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition-colors shrink-0"
          >
            搜尋
          </button>
        </div>
        <div class="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
          <div class="flex items-center gap-1.5">
            <select
              v-model="filterRecommendation"
              @change="applyFilters"
              class="px-2 py-1.5 text-xs sm:text-sm bg-gray-800/40 border border-gray-700/60 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
            >
              <option value="">全部</option>
              <option value="BUY">買入</option>
              <option value="HOLD">持有</option>
              <option value="SELL">賣出</option>
            </select>
            <button
              v-if="hasFilters"
              @click="clearFilters"
              class="sm:hidden text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              清除
            </button>
          </div>
           <div class="flex items-center gap-1">
            <input
              v-model="filterDateStart"
              @change="applyFilters"
              type="date"
              class="flex-1 sm:w-auto px-1.5 sm:px-2 py-1.5 text-xs sm:text-sm bg-gray-800/40 border border-gray-700/60 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 [color-scheme:dark] transition-all"
            />
            <span class="text-gray-600 shrink-0 text-xs sm:text-sm">~</span>
            <input
              v-model="filterDateEnd"
              @change="applyFilters"
              type="date"
              class="flex-1 sm:w-auto px-1.5 sm:px-2 py-1.5 text-xs sm:text-sm bg-gray-800/40 border border-gray-700/60 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 [color-scheme:dark] transition-all"
            />
          </div>
          <button
            v-if="hasFilters"
            @click="clearFilters"
            class="hidden sm:inline text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            清除篩選
          </button>
        </div>
      </div>
    </div>

    <!-- Records List -->
    <div v-if="loading" class="card !py-12">
      <div class="text-center text-gray-500">載入中...</div>
    </div>
    <div v-else-if="records.length === 0" class="card !py-12">
      <div class="text-center text-gray-500">
        {{ hasFilters ? '沒有符合條件的記錄' : '尚無歷史記錄' }}
      </div>
    </div>
    <div v-else class="card !p-0 divide-y divide-gray-800/60 overflow-hidden">
      <div
        v-for="record in records"
        :key="record.id"
        class="px-3 sm:px-6 py-2.5 sm:py-4 hover:bg-white/[0.02] transition-colors cursor-default"
      >
        <div class="flex items-center gap-2 sm:gap-4 flex-wrap sm:flex-nowrap">
          <div class="text-[11px] sm:text-sm font-medium text-white/70 shrink-0 min-w-12 sm:min-w-0 leading-tight">
            <span class="sm:hidden">{{ formatDate(record.date, true) }}</span>
            <span class="hidden sm:inline">{{ formatDate(record.date) }}</span>
          </div>
          <div
            class="w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold text-white shrink-0"
            :class="
              record.investmentScore >= 70
                ? 'bg-emerald-500'
                : record.investmentScore >= 40
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
            "
          >
            {{ record.investmentScore }}
          </div>
          <span
            class="px-1.5 py-0.5 text-[10px] sm:text-xs font-medium rounded-full shrink-0 leading-tight"
            :class="displayRecommendation(record.recommendation).class"
          >
            {{ displayRecommendation(record.recommendation).text }}
          </span>
          <div class="hidden sm:flex items-center gap-1 ml-auto">
            <div
              v-for="(value, key) in record.elements"
              :key="key"
              class="w-1.5 rounded-full"
              :style="{
                height: `${Math.max(4, value * 0.22)}px`,
                backgroundColor:
                  key === 'metal' ? '#9CA3AF' : key === 'wood' ? '#22C55E' : key === 'water' ? '#3B82F6' : key === 'fire' ? '#EF4444' : '#A16207',
              }"
            />
          </div>
          <span class="text-[10px] sm:text-xs text-gray-600 ml-auto leading-tight">
            {{ formatTime(record.timestamp) }}
          </span>
        </div>
        <p v-if="record.lunarSummary" class="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-gray-400/70 line-clamp-1 ml-12 sm:ml-0 leading-relaxed">
          {{ record.lunarSummary }}
        </p>
      </div>
    </div>

    <!-- Pagination -->
    <div
      v-if="totalPages > 1"
      class="flex items-center justify-between"
    >
      <button
        @click="prevPage"
        :disabled="pageIndex === 0"
        class="px-3 py-1.5 text-sm text-gray-500 hover:text-white bg-gray-800/20 hover:bg-gray-800/50 rounded-lg disabled:opacity-25 disabled:cursor-not-allowed transition-all"
      >
        ← 上一頁
      </button>
      <span class="text-sm text-gray-600">
        {{ pageIndex + 1 }} / {{ totalPages }}
      </span>
      <button
        @click="nextPage"
        :disabled="pageIndex >= totalPages - 1"
        class="px-3 py-1.5 text-sm text-gray-500 hover:text-white bg-gray-800/20 hover:bg-gray-800/50 rounded-lg disabled:opacity-25 disabled:cursor-not-allowed transition-all"
      >
        下一頁 →
      </button>
    </div>
  </div>
</template>
