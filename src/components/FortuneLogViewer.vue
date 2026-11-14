<script setup lang="ts">
import { ref, computed, onMounted, defineAsyncComponent } from 'vue'
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
} from '@heroicons/vue/24/outline'
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

const elementLabels: Record<string, string> = {
  metal: '金',
  wood: '木',
  water: '水',
  fire: '火',
  earth: '土',
}

// 引擎以短名稱標示，不用 emoji
const engineLabels: Record<string, string> = {
  classic: '經典',
  'bazi-ten-gods': '八字',
  'zi-wei': '紫微',
  'feng-shui': '風水',
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
      BUY: { label: '買入', color: 'bg-good/10 text-good' },
      HOLD: { label: '持有', color: 'bg-raised text-ink-2' },
      SELL: { label: '賣出', color: 'bg-bad/10 text-bad' },
    }
    tags.push(map[filterRecommendation.value])
  }
  if (filterDateStart.value && filterDateStart.value !== defaultDateStart) {
    tags.push({ label: filterDateStart.value.slice(5), color: 'bg-raised text-ink-2' })
  }
  if (filterDateEnd.value && filterDateEnd.value !== defaultDateEnd) {
    tags.push({ label: filterDateEnd.value.slice(5), color: 'bg-raised text-ink-2' })
  }
  if (searchText.value) {
    tags.push({ label: searchText.value, color: 'bg-raised text-ink-2' })
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
        await IntegratedFortuneService.calculateIntegratedFortune(profile, new Date())
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
    BUY: { text: '買入', class: 'bg-good/10 text-good' },
    HOLD: { text: '持有', class: 'bg-raised text-ink-2' },
    SELL: { text: '賣出', class: 'bg-bad/10 text-bad' },
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

// 分數只用文字色區分：高分吉（紅）、低分凶（綠）、中間為墨色
function getScoreColor(score: number): string {
  if (score >= 70) return 'text-good'
  if (score >= 40) return 'text-ink'
  return 'text-bad'
}

const chipClass = (rec: FortuneRecord['recommendation']): string => {
  if (filterRecommendation.value !== rec) return 'border-line-strong text-ink-2 hover:bg-raised'
  return 'border-seal bg-seal text-seal-on'
}

const recLabel = (rec: FortuneRecord['recommendation']): string =>
  rec === 'BUY' ? '買入' : rec === 'HOLD' ? '持有' : '賣出'
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Stats -->
    <div
      v-if="stats && stats.totalRecords > 0"
      class="flex flex-col gap-2 rounded-card border border-line bg-surface px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="flex flex-wrap items-center gap-4 text-sm">
        <div class="flex items-center gap-1.5">
          <span class="text-ink-3">均分</span>
          <span class="font-mono font-medium text-ink">{{ stats.averageScore }}</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span
            class="dot bg-good"
            aria-hidden="true"
          />
          <span class="text-ink-3">買入</span>
          <span class="font-mono text-ink-2">{{ stats.recommendationDistribution.BUY }}</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span
            class="dot bg-ink-3"
            aria-hidden="true"
          />
          <span class="text-ink-3">持有</span>
          <span class="font-mono text-ink-2">{{ stats.recommendationDistribution.HOLD }}</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span
            class="dot bg-bad"
            aria-hidden="true"
          />
          <span class="text-ink-3">賣出</span>
          <span class="font-mono text-ink-2">{{ stats.recommendationDistribution.SELL }}</span>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-[13px] text-ink-3">
          共 {{ stats.totalRecords }} 筆
          <span
            v-if="stats.dateRange"
            class="hidden sm:inline"
          >
            · {{ stats.dateRange.earliest }} ~ {{ stats.dateRange.latest }}
          </span>
        </span>
        <button
          type="button"
          class="rounded-md px-2 py-1 text-xs font-medium text-danger transition-colors hover:bg-danger/10"
          @click="openClearConfirm"
        >
          清除
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="rounded-card border border-line bg-surface px-5 py-4">
      <!-- Mobile: collapsed summary bar -->
      <div class="sm:hidden">
        <button
          type="button"
          class="flex w-full items-center justify-between gap-2"
          :aria-expanded="filtersExpanded"
          @click="filtersExpanded = !filtersExpanded"
        >
          <div class="flex min-w-0 items-center gap-2 overflow-hidden">
            <FunnelIcon
              class="h-4 w-4 shrink-0 text-ink-3"
              aria-hidden="true"
            />
            <div
              v-if="activeFilterTags.length === 0"
              class="truncate text-sm text-ink-3"
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
                class="shrink-0 rounded-full px-2 py-0.5 text-[11px]"
                :class="tag.color"
              >
                {{ tag.label }}
              </span>
            </div>
          </div>
          <ChevronDownIcon
            class="h-4 w-4 shrink-0 text-ink-3 transition-transform duration-200 ease-out"
            :class="{ 'rotate-180': filtersExpanded }"
            aria-hidden="true"
          />
        </button>

        <!-- Expanded filters (mobile) -->
        <div
          v-show="filtersExpanded"
          class="mt-3 flex flex-col gap-3 border-t border-line pt-3"
        >
          <div class="flex gap-2">
            <input
              v-model="searchText"
              type="text"
              placeholder="搜尋"
              class="form-input min-w-0 flex-1 !py-2 text-sm"
              @keyup.enter="applyFilters"
            >
            <button
              type="button"
              class="btn-primary btn-sm shrink-0"
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
              type="button"
              class="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
              :class="chipClass(rec)"
              :aria-pressed="filterRecommendation === rec"
              @click="toggleRecommendation(rec)"
            >
              {{ recLabel(rec) }}
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
            <span class="shrink-0 text-sm text-ink-3">~</span>
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
            type="button"
            class="self-start text-xs text-ink-3 transition-colors hover:text-ink"
            @click="clearFilters"
          >
            清除篩選
          </button>
        </div>
      </div>

      <!-- Desktop: always expanded -->
      <div class="hidden sm:block">
        <div class="flex flex-col gap-3">
          <div class="flex gap-2">
            <input
              v-model="searchText"
              type="text"
              placeholder="搜尋"
              class="form-input min-w-0 flex-1 !py-2 text-sm"
              @keyup.enter="applyFilters"
            >
            <button
              type="button"
              class="btn-primary btn-sm shrink-0"
              @click="applyFilters"
            >
              搜尋
            </button>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <!-- Desktop Chips -->
            <div class="flex items-center gap-1.5">
              <button
                v-for="rec in ['BUY', 'HOLD', 'SELL'] as const"
                :key="rec"
                type="button"
                class="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
                :class="chipClass(rec)"
                :aria-pressed="filterRecommendation === rec"
                @click="toggleRecommendation(rec)"
              >
                {{ recLabel(rec) }}
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
              <span class="shrink-0 text-sm text-ink-3">~</span>
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
              type="button"
              class="text-xs text-ink-3 transition-colors hover:text-ink"
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
      class="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface"
    >
      <div
        v-for="n in 5"
        :key="n"
        class="px-5 py-4"
      >
        <!-- Mobile card skeleton -->
        <div class="flex flex-col gap-2 sm:hidden">
          <div class="flex items-center gap-2">
            <div class="h-11 w-11 animate-pulse rounded-full bg-raised" />
            <div class="h-3 w-12 animate-pulse rounded bg-raised" />
            <div class="h-5 w-10 animate-pulse rounded-full bg-raised" />
            <div class="ml-auto h-3 w-8 animate-pulse rounded bg-raised" />
          </div>
          <div class="flex items-center gap-1">
            <div
              v-for="e in 5"
              :key="e"
              class="h-1 w-5 animate-pulse rounded-full bg-raised"
            />
          </div>
        </div>
        <!-- Desktop list skeleton -->
        <div class="hidden items-center gap-4 sm:flex">
          <div class="h-12 w-12 animate-pulse rounded-full bg-raised" />
          <div class="h-4 w-20 animate-pulse rounded bg-raised" />
          <div class="h-5 w-12 animate-pulse rounded-full bg-raised" />
          <div class="ml-auto flex items-center gap-1">
            <div
              v-for="e in 5"
              :key="e"
              class="h-2 w-6 animate-pulse rounded-full bg-raised"
            />
          </div>
          <div class="h-3 w-10 animate-pulse rounded bg-raised" />
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="records.length === 0"
      class="rounded-card border border-line bg-surface py-12 text-center text-ink-3"
    >
      {{ hasFilters ? '沒有符合條件的記錄' : '尚無歷史記錄' }}
    </div>

    <!-- Records List -->
    <ul
      v-else
      class="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface"
    >
      <li
        v-for="record in records"
        :key="record.id"
        class="px-5 py-4 transition-colors hover:bg-raised/50"
      >
        <!-- Mobile: card layout -->
        <div class="flex flex-col gap-2.5 sm:hidden">
          <!-- Top row: score + date + time -->
          <div class="flex items-center gap-3">
            <div
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line-strong font-mono text-sm font-medium"
              :class="getScoreColor(record.investmentScore)"
            >
              {{ record.investmentScore }}
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-ink">
                  {{ formatDate(record.date, true) }}
                </span>
                <span class="font-mono text-[11px] text-ink-3">
                  {{ formatTime(record.timestamp) }}
                </span>
              </div>
              <span
                class="mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium leading-tight"
                :class="displayRecommendation(record.recommendation).class"
                :data-recommendation="record.recommendation"
              >
                {{ displayRecommendation(record.recommendation).text }}
              </span>
            </div>
          </div>
          <!-- 五行能量條 -->
          <div class="flex items-end gap-1.5">
            <div
              v-for="(value, key) in record.elements"
              :key="key"
              class="flex flex-col items-center gap-1"
            >
              <div
                class="w-6 rounded-full bg-ink-3/40"
                :style="{ height: `${Math.max(6, value * 0.28)}px` }"
              />
              <span class="text-[10px] leading-none text-ink-3">{{ elementLabels[key] }}</span>
            </div>
          </div>
          <!-- 引擎分數 -->
          <div
            v-if="record.enginesResults && record.enginesResults.length > 0"
            class="flex flex-wrap items-center gap-1.5"
          >
            <span
              v-for="engine in record.enginesResults"
              :key="engine.engineId"
              class="inline-flex items-center gap-1 rounded bg-raised px-1.5 py-0.5 text-[11px]"
            >
              <span class="text-ink-3">{{ engineLabels[engine.engineId] || engine.engineId }}</span>
              <span class="font-mono font-medium text-ink">{{ engine.score }}</span>
              <span class="font-mono text-ink-3">{{ engine.weight }}%</span>
            </span>
            <span
              v-if="record.engineWeightedScore != null"
              class="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium text-ink"
            >
              加權 <span class="ml-1 font-mono">{{ record.engineWeightedScore }}</span>
            </span>
          </div>
          <!-- 農曆摘要 -->
          <p
            v-if="record.lunarSummary"
            class="line-clamp-2 text-xs leading-relaxed text-ink-3"
          >
            {{ record.lunarSummary }}
          </p>
        </div>

        <!-- Desktop: card layout -->
        <div class="hidden sm:block">
          <div class="flex items-start gap-5">
            <!-- Left: Score circle -->
            <div class="flex shrink-0 flex-col items-center gap-1.5">
              <div
                class="flex h-12 w-12 items-center justify-center rounded-full border border-line-strong font-mono text-base font-medium"
                :class="getScoreColor(record.investmentScore)"
              >
                {{ record.investmentScore }}
              </div>
              <span
                class="rounded-full px-2 py-0.5 text-[11px] font-medium leading-tight"
                :class="displayRecommendation(record.recommendation).class"
                :data-recommendation="record.recommendation"
              >
                {{ displayRecommendation(record.recommendation).text }}
              </span>
            </div>
            <!-- Center: date + elements + summary -->
            <div class="min-w-0 flex-1">
              <div class="mb-2 flex items-center gap-2">
                <span class="text-sm font-medium text-ink">
                  {{ formatDate(record.date) }}
                </span>
                <span class="font-mono text-xs text-ink-3">
                  {{ formatTime(record.timestamp) }}
                </span>
              </div>
              <!-- 五行能量 -->
              <div class="mb-2 flex items-end gap-1.5">
                <div
                  v-for="(value, key) in record.elements"
                  :key="key"
                  class="flex flex-col items-center gap-1"
                >
                  <div
                    class="w-7 rounded-full bg-ink-3/40"
                    :style="{ height: `${Math.max(6, value * 0.3)}px` }"
                  />
                  <span class="text-[11px] leading-none text-ink-3">{{ elementLabels[key] }}</span>
                </div>
              </div>
              <p
                v-if="record.lunarSummary"
                class="line-clamp-1 text-[13px] leading-relaxed text-ink-3"
              >
                {{ record.lunarSummary }}
              </p>
            </div>
            <!-- Right: engine scores -->
            <div
              v-if="record.enginesResults && record.enginesResults.length > 0"
              class="flex shrink-0 flex-col items-end gap-1.5"
            >
              <div class="flex items-center gap-1.5">
                <span
                  v-for="engine in record.enginesResults"
                  :key="engine.engineId"
                  class="inline-flex items-center gap-1 rounded bg-raised px-1.5 py-0.5 text-[11px]"
                >
                  <span class="text-ink-3">{{
                    engineLabels[engine.engineId] || engine.engineId
                  }}</span>
                  <span class="font-mono font-medium text-ink">{{ engine.score }}</span>
                </span>
              </div>
              <span
                v-if="record.engineWeightedScore != null"
                class="text-xs text-ink-2"
              >
                加權
                <span class="font-mono font-medium text-ink">{{ record.engineWeightedScore }}</span>
              </span>
            </div>
          </div>
        </div>
      </li>
    </ul>

    <!-- Pagination -->
    <div
      v-if="totalPages > 1"
      class="flex items-center justify-between"
    >
      <button
        type="button"
        :disabled="pageIndex === 0"
        class="btn-secondary btn-sm"
        @click="prevPage"
      >
        <ChevronLeftIcon
          class="h-4 w-4"
          aria-hidden="true"
        />
        上一頁
      </button>
      <span class="font-mono text-sm text-ink-2"> {{ pageIndex + 1 }} / {{ totalPages }} </span>
      <button
        type="button"
        :disabled="pageIndex >= totalPages - 1"
        class="btn-secondary btn-sm"
        @click="nextPage"
      >
        下一頁
        <ChevronRightIcon
          class="h-4 w-4"
          aria-hidden="true"
        />
      </button>
    </div>

    <!-- Clear confirmation dialog -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showClearConfirm"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="clear-confirm-title"
        >
          <div
            class="absolute inset-0 bg-black/50"
            @click="closeClearConfirm"
          />
          <div class="card relative z-10 w-full max-w-sm shadow-card">
            <h3
              id="clear-confirm-title"
              class="card-title"
            >
              確認清除
            </h3>
            <p class="text-sm text-ink-2">
              確定要清除所有運勢歷史記錄嗎？此操作無法復原。
            </p>
            <div class="flex justify-end gap-2">
              <button
                type="button"
                class="btn-secondary btn-sm"
                @click="closeClearConfirm"
              >
                取消
              </button>
              <button
                type="button"
                class="btn-sm inline-flex items-center justify-center rounded-full bg-danger font-medium text-seal-on transition-colors hover:bg-danger/90"
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
