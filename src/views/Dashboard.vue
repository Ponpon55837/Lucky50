<script setup lang="ts">
import { computed, onMounted, onUnmounted, toRef, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useDashboardStore } from '@/stores/dashboard'
import { useDashboardAlmanac } from '@/composables/useDashboardAlmanac'
import { lunarService } from '@/services/lunar'
import { TaiwanStockService } from '@/services/taiwanStock'
import { primaryMarketSlotIndex } from '@/utils/almanac'
import { ELEMENT_LABEL } from '@/utils/ganzhi'
import { formatFullDate, formatMonthDayWeekday } from '@/utils/date'
import FortuneLot from '@/components/almanac/FortuneLot.vue'
import HourWheel from '@/components/almanac/HourWheel.vue'
import InkPriceChart from '@/components/almanac/InkPriceChart.vue'
import AlmanacYiJi from '@/components/almanac/AlmanacYiJi.vue'
import FiveElementsCycle from '@/components/almanac/FiveElementsCycle.vue'
import TenGodsCard from '@/components/TenGodsCard.vue'
import ZiWeiCard from '@/components/ZiWeiCard.vue'
import FengShuiCard from '@/components/FengShuiCard.vue'
import type { UserProfileCompat } from '@/services/integratedFortune'

const userStore = useUserStore()
const dashboardStore = useDashboardStore()

// ── 資料來源 ──

/** UserProfile 結構上相容於引擎所需的 UserProfileCompat，直接傳入即可 */
const userProfileCompat = computed((): UserProfileCompat | null =>
  userStore.isProfileComplete ? userStore.profile : null
)

const fortune = toRef(dashboardStore, 'integratedFortune')
const lunar = computed(() => fortune.value?.lunarData ?? dashboardStore.lunarData)

/** 今天是否開盤；休市則改看下一個交易日（由交易日曆判斷，不依賴個人資料） */
const tradingDay = computed(() => {
  const date = dashboardStore.currentDate
  const isToday = TaiwanStockService.isTradingDay(date)
  return { isToday, date: isToday ? date : TaiwanStockService.getNextTradingDay(date) }
})

/** 時辰輪看的是「下一次開盤」那一天 */
const wheelLunar = computed(() =>
  tradingDay.value.isToday ? lunar.value : lunarService.getLunarData(tradingDay.value.date)
)

const { hourSlots, strengths, ownElement, elementReading, chartPoints, luckyDaySummary, lotSeed } =
  useDashboardAlmanac(
    lunar,
    wheelLunar,
    computed(() => (userStore.isProfileComplete ? userStore.profile : null)),
    toRef(dashboardStore, 'etfData'),
    toRef(dashboardStore, 'currentDate')
  )

// ── 畫面文字 ──

const fullDate = computed(() => formatFullDate(dashboardStore.currentDate))

const nextOpenLabel = computed(() => formatMonthDayWeekday(tradingDay.value.date))

const marketNote = computed(() =>
  tradingDay.value.isToday
    ? {
        text: TaiwanStockService.getTradingStatus(dashboardStore.currentDate).message,
        emphasis: '',
      }
    : { text: '今天休市，', emphasis: `${nextOpenLabel.value} 再開盤` }
)

/** 籤上寫的「最順時段」：只有開盤時段真的有吉時才寫 */
const bestHour = computed(() => {
  const slot = hourSlots.value[primaryMarketSlotIndex(hourSlots.value)]
  return slot?.omen === 'good' ? `${slot.branch}時 ${slot.range}` : null
})

const wheelTitle = computed(() =>
  tradingDay.value.isToday ? '今天的時辰' : `${nextOpenLabel.value}的時辰`
)

const chartCaption = computed(
  () =>
    `近 ${chartPoints.value.length} 個交易日 · 紅印為${userProfileCompat.value ? '你的吉日' : '宜交易的日子'}`
)

const latestClose = computed(() => dashboardStore.latestPrice?.close.toFixed(2) ?? null)
const changePercent = computed(() => {
  const value = dashboardStore.priceChangePercent
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
})

// ── 資料載入 ──

const retryFortune = () => dashboardStore.retryIntegratedFortune(userProfileCompat.value)

watch(userProfileCompat, profile => {
  if (profile) dashboardStore.refreshData(profile)
})

// 命理引擎設定變更：使運勢查詢失效並重新載入
const onSettingsChanged = () => {
  dashboardStore.invalidateFortune()
  if (userProfileCompat.value) {
    dashboardStore.loadIntegratedFortune(userProfileCompat.value, dashboardStore.currentDate, true)
  }
}

onMounted(() => {
  dashboardStore.loadAllData(userProfileCompat.value)
  window.addEventListener('engine-settings-changed', onSettingsChanged)
})

// 離開頁面時移除監聽，避免每次進入 Dashboard 累積一個 listener
onUnmounted(() => {
  window.removeEventListener('engine-settings-changed', onSettingsChanged)
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- 頁首：日期與開盤狀態 -->
    <header class="flex flex-wrap items-end justify-between gap-6">
      <div class="flex items-center gap-5">
        <div
          v-if="lunar"
          class="seal-stamp h-[52px] w-[52px] -rotate-[4deg] text-lg"
          :aria-label="`${lunar.dayGanZhi}日`"
        >
          {{ lunar.dayGanZhi }}
        </div>
        <div>
          <h1
            class="font-serif text-[32px] font-black leading-none tracking-[0.02em] sm:text-[44px]"
          >
            {{ lunar ? `${lunar.lunarMonth}月${lunar.lunarDay}` : '投資儀表板' }}
          </h1>
          <p class="mt-1.5 text-sm text-ink-2">
            {{ fullDate }}<template v-if="lunar">
              · {{ lunar.ganZhi }}年
            </template><template v-if="lunar?.jieQi">
              · {{ lunar.jieQi }}
            </template>
          </p>
        </div>
      </div>
      <p
        v-if="marketNote"
        class="inline-flex items-center rounded-full border border-dashed border-line-strong px-3.5 py-2 text-[13px] text-ink-2"
      >
        {{ marketNote.text
        }}<b
          v-if="marketNote.emphasis"
          class="font-medium text-ink"
        >{{ marketNote.emphasis }}</b>
      </p>
    </header>

    <!-- 亮點：今日籤 -->
    <FortuneLot
      v-if="fortune && userProfileCompat"
      :score="fortune.investmentScore"
      :seed="lotSeed"
      :recommendation="fortune.recommendation"
      :best-hour="bestHour"
      :lucky-direction="fortune.luckyDirection"
    />
    <section
      v-else-if="!userProfileCompat"
      class="flex flex-col items-start gap-4 rounded-[20px] bg-seal px-6 py-8 text-seal-on sm:px-10"
    >
      <h2 class="font-serif text-2xl font-bold sm:text-3xl">
        先留下生辰，才能抽今日籤
      </h2>
      <p class="max-w-[32rem] opacity-90">
        籤詩、時辰吉凶和五行解讀都依你的出生年月日與時辰推算。農民曆宜忌與 0050 走勢不需要設定也能看
      </p>
      <RouterLink
        to="/profile"
        class="btn-primary bg-seal-on text-seal hover:bg-seal-on/90"
      >
        設定生辰
      </RouterLink>
    </section>
    <section
      v-else-if="dashboardStore.fortuneError"
      class="card items-start"
    >
      <p class="text-danger">
        今日籤沒有算出來：{{ dashboardStore.fortuneError }}
      </p>
      <button
        type="button"
        class="btn-secondary btn-sm"
        @click="retryFortune"
      >
        重新計算
      </button>
    </section>
    <div
      v-else
      class="h-[300px] animate-pulse rounded-[20px] bg-raised"
      aria-label="正在計算今日籤"
    />

    <!-- 走勢 + 時辰輪 -->
    <div class="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <section class="card">
        <div class="flex flex-wrap items-baseline justify-between gap-3">
          <h2 class="card-title">
            0050 走勢
          </h2>
          <span class="card-meta">{{ chartCaption }}</span>
        </div>
        <InkPriceChart
          v-if="chartPoints.length > 1"
          :points="chartPoints"
        />
        <p
          v-else
          class="grid h-[260px] place-items-center text-ink-3"
        >
          {{ dashboardStore.etfLoading ? '正在載入行情' : '目前沒有行情資料' }}
        </p>
        <div
          v-if="latestClose"
          class="flex flex-wrap justify-between gap-4 text-[13px] text-ink-2"
        >
          <span class="inline-flex items-baseline gap-2">
            最新收盤
            <span class="font-mono text-ink">{{ latestClose }}</span>
            <span
              class="font-mono"
              :class="dashboardStore.priceChangeColor"
            >{{
              changePercent
            }}</span>
          </span>
          <span
            v-if="userProfileCompat && luckyDaySummary.lucky > 0"
            class="inline-flex items-center gap-1.5"
          >
            <i
              class="grid h-4 w-4 -rotate-6 place-items-center rounded-[3px] bg-seal font-kai text-[11px] not-italic text-seal-on"
            >吉</i>
            這段期間有 {{ luckyDaySummary.lucky }} 個吉日，其中 {{ luckyDaySummary.luckyUp }} 天收紅
          </span>
        </div>
      </section>

      <section class="card">
        <div class="flex flex-wrap items-baseline justify-between gap-3">
          <h2 class="card-title">
            {{ wheelTitle }}
          </h2>
          <span class="card-meta">點一下看建議</span>
        </div>
        <HourWheel
          v-if="hourSlots.length"
          :slots="hourSlots"
        />
        <p
          v-else
          class="text-ink-3"
        >
          設定生辰後，會依你的生肖推算每個時辰的吉凶
        </p>
      </section>
    </div>

    <!-- 宜忌 + 五行 -->
    <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <section
        v-if="lunar"
        class="card"
      >
        <div class="flex flex-wrap items-baseline justify-between gap-3">
          <h2 class="card-title">
            今日宜忌
          </h2>
          <span class="card-meta">
            {{ lunar.dayGanZhi }}日<template v-if="lunar.tianShen">
              · {{ lunar.tianShen }}{{ lunar.tianShenLuck === '吉' ? '黃道' : '黑道' }}
            </template>
          </span>
        </div>
        <AlmanacYiJi :lunar="lunar" />
      </section>

      <section
        v-if="strengths && elementReading"
        class="card"
      >
        <div class="flex flex-wrap items-baseline justify-between gap-3">
          <h2 class="card-title">
            五行
          </h2>
          <span class="card-meta">
            {{ lunar?.monthGanZhi }}月<template v-if="ownElement">
              · 本命{{ ELEMENT_LABEL[ownElement] }}
            </template>
          </span>
        </div>
        <FiveElementsCycle
          :strengths="strengths"
          :own-element="ownElement"
          :reading="elementReading"
        />
      </section>
    </div>

    <!-- 三種推算 -->
    <div class="grid gap-5 lg:grid-cols-3">
      <TenGodsCard
        :profile="userProfileCompat"
        :date="dashboardStore.currentDate"
      />
      <ZiWeiCard
        :profile="userProfileCompat"
        :missing-birth-time="Boolean(userStore.profile.birthDate && !userStore.profile.birthTime)"
        :date="dashboardStore.currentDate"
      />
      <FengShuiCard
        :profile="userProfileCompat"
        :date="dashboardStore.currentDate"
      />
    </div>
  </div>
</template>
