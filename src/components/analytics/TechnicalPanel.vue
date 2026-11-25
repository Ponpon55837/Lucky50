<script setup lang="ts">
import { computed } from 'vue'
import { useAnalyticsStore } from '@/stores/analytics'
import { formatMarketFetchTime } from '@/services/marketHistory'
import { formatPriceAdjustmentCheck, hasPriceAdjustmentMismatch } from '@/utils/priceAdjust'
import {
  MISSING,
  SIGNAL_MIN_VOTES,
  SIGNAL_THRESHOLD,
  compositeSignal,
  formatSigned,
  formatValue,
  technicalReadings,
  type Tone,
} from '@/utils/technical'

const analyticsStore = useAnalyticsStore()
const snapshot = computed(() => analyticsStore.technicalSnapshot)
const readings = computed(() => technicalReadings(snapshot.value))
const signal = computed(() => compositeSignal(snapshot.value))

const TONE_TEXT: Readonly<Record<Tone, string>> = {
  rise: 'text-rise',
  fall: 'text-fall',
  ink: 'text-ink',
}
const TONE_CHIP: Readonly<Record<Tone, string>> = {
  rise: 'bg-rise/10 text-rise',
  fall: 'bg-fall/10 text-fall',
  ink: 'bg-raised text-ink-2',
}
const toneOf = (value: number | null): Tone =>
  value === null || value === 0 ? 'ink' : value > 0 ? 'rise' : 'fall'

const VOTE_TEXT = { 1: '偏多', 0: '中立', [-1]: '偏空' } as const
const voteLabel = (vote: 1 | 0 | -1 | null) => (vote === null ? MISSING : VOTE_TEXT[vote])

const signalTone = computed<Tone>(() =>
  signal.value.label === '偏多' ? 'rise' : signal.value.label === '偏空' ? 'fall' : 'ink'
)

/** 均線與收盤價的差距（%）：正值代表收盤在均線之上 */
const averages = computed(() => {
  const { close, ma, ema } = snapshot.value
  const row = (label: string, value: number | null) => ({
    label,
    value,
    gap: close !== null && value ? (close / value - 1) * 100 : null,
  })
  return [
    ...ma.map(item => row(`MA${item.period}`, item.value)),
    ...ema.map(item => row(`EMA${item.period}`, item.value)),
  ]
})

const notice = computed(() => {
  if (analyticsStore.technicalState === 'loading') return '行情載入中…'
  if (analyticsStore.technicalStatus === 'unavailable') return '無法取得行情，技術指標暫不提供。'
  return ''
})

const adjustmentMismatch = computed(() =>
  hasPriceAdjustmentMismatch(analyticsStore.technicalAdjustmentChecks)
)
const adjustmentIssues = computed(() =>
  analyticsStore.technicalAdjustmentChecks.filter(check => check.status !== 'matched')
)
const adjustmentNote = computed(() => {
  if (adjustmentMismatch.value) return '價格還原待查'
  return analyticsStore.adjustmentLabel
})
</script>

<template>
  <section
    class="card"
    aria-labelledby="technical-heading"
  >
    <div>
      <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h2
          id="technical-heading"
          class="card-title"
        >
          技術指標
        </h2>
        <span
          class="rounded-full px-3 py-1 text-xs"
          :class="
            analyticsStore.dividendAdjusted && !adjustmentMismatch
              ? 'bg-raised text-ink-2'
              : 'bg-gold/20 text-ink'
          "
        >
          {{ adjustmentNote }}
        </span>
      </div>
      <p
        v-if="analyticsStore.technicalProvenance"
        class="card-meta mt-1.5"
      >
        {{ analyticsStore.technicalStatus === 'cached' ? '行情快取' : '日 K' }} ·
        {{ analyticsStore.technicalProvenance.source }} ·
        截至 {{ analyticsStore.technicalProvenance.asOf }} ·
        擷取於 {{ formatMarketFetchTime(analyticsStore.technicalProvenance.fetchedAt) }}
      </p>
      <p
        v-if="!adjustmentMismatch"
        class="card-meta mt-1.5"
      >
        以最近 {{ snapshot.bars }} 根日 K 計算，參數採台灣券商軟體慣例；不隨上方的分析時間區間改變。
      </p>
      <div
        v-if="adjustmentIssues.length"
        class="mt-2 border-l-2 border-line-strong pl-3 text-sm text-ink-2"
        role="status"
      >
        <p v-if="adjustmentMismatch">
          事件記載與日 K 前收不一致，暫停顯示技術指標。
        </p>
        <ul>
          <li
            v-for="check in adjustmentIssues"
            :key="`${check.date}-${check.kind}`"
          >
            {{ formatPriceAdjustmentCheck(check) }}
          </li>
        </ul>
      </div>
      <p
        v-if="notice"
        class="mt-2 border-l-2 border-line-strong pl-3 text-sm text-ink-2"
        role="status"
      >
        {{ notice }}
      </p>
    </div>

    <!-- 綜合訊號與依據 -->
    <div class="rounded-[10px] border border-line p-4">
      <div class="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h3 class="text-[13px] text-ink-3">
          綜合訊號
        </h3>
        <span :class="['font-serif text-2xl font-bold', TONE_TEXT[signalTone]]">
          {{ signal.label }}
        </span>
        <span class="font-mono text-sm text-ink-2">
          偏多 {{ signal.bullish }}・偏空 {{ signal.bearish }}・中立 {{ signal.neutral }}
        </span>
      </div>
      <p class="mt-1 text-xs leading-relaxed text-ink-3">
        下列七項各看一件事，偏多與偏空的項數相減達 {{ SIGNAL_THRESHOLD }}
        項以上才稱偏多或偏空，否則為中性；算得出來的不足 {{ SIGNAL_MIN_VOTES }}
        項時不下結論。過熱與超賣不列入計算。
      </p>
      <ul class="mt-3 grid grid-cols-1 gap-x-6 md:grid-cols-2">
        <li
          v-for="vote in signal.votes"
          :key="vote.key"
          class="flex items-baseline justify-between gap-3 border-t border-line py-2 text-sm"
        >
          <span class="min-w-0">
            <span class="text-ink">{{ vote.name }}</span>
            <span class="ml-2 text-xs text-ink-3">{{ vote.reading }}</span>
          </span>
          <span :class="['shrink-0 text-xs font-medium', TONE_TEXT[toneOf(vote.vote)]]">
            {{ voteLabel(vote.vote) }}
          </span>
        </li>
      </ul>
    </div>

    <!-- 相對位置：52 週區間與各期間報酬 -->
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div class="rounded-[10px] border border-line p-4">
        <div class="flex items-baseline justify-between gap-3">
          <h3 class="text-[13px] text-ink-3">
            52 週區間
          </h3>
          <span class="font-mono text-sm text-ink">
            {{
              snapshot.range52w ? `位於 ${snapshot.range52w.position.toFixed(0)}%` : MISSING
            }}
          </span>
        </div>
        <div
          class="relative mt-4 h-1.5 rounded-full bg-raised"
          role="img"
          :aria-label="
            snapshot.range52w
              ? `收盤價位於 52 週區間的 ${snapshot.range52w.position.toFixed(0)}%`
              : '52 週區間資料不足'
          "
        >
          <span
            v-if="snapshot.range52w"
            class="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-seal"
            :style="{ left: `${snapshot.range52w.position}%` }"
          />
        </div>
        <div class="mt-3 flex justify-between font-mono text-xs text-ink-2">
          <span>低 {{ formatValue(snapshot.range52w?.low ?? null) }}</span>
          <span class="text-ink">收 {{ formatValue(snapshot.close) }}</span>
          <span>高 {{ formatValue(snapshot.range52w?.high ?? null) }}</span>
        </div>
        <p class="mt-2 text-xs text-ink-3">
          最近一年最高與最低價之間，目前收盤落在哪裡；0% 是一年低點、100% 是一年高點。
        </p>
      </div>

      <div class="rounded-[10px] border border-line p-4">
        <h3 class="text-[13px] text-ink-3">
          期間報酬
        </h3>
        <dl class="mt-3 grid grid-cols-4 gap-2">
          <div
            v-for="item in snapshot.returns"
            :key="item.months"
          >
            <dt class="text-xs text-ink-3">
              {{ item.label }}
            </dt>
            <dd :class="['mt-1 font-mono text-base font-medium', TONE_TEXT[toneOf(item.value)]]">
              {{ formatSigned(item.value, 1, '%') }}
            </dd>
          </div>
        </dl>
        <p class="mt-3 text-xs text-ink-3">
          以還原後的收盤價計算，{{
            analyticsStore.dividendAdjusted ? '已含配息' : '未含配息'
          }}；資料沒有涵蓋到的期間顯示「{{ MISSING }}」。
        </p>
      </div>
    </div>

    <!-- 均線 -->
    <div>
      <h3 class="text-[13px] text-ink-3">
        均線（括號內為收盤價與均線的差距）
      </h3>
      <dl class="mt-2 grid grid-cols-2 gap-x-6 sm:grid-cols-4">
        <div
          v-for="item in averages"
          :key="item.label"
          class="flex items-baseline justify-between gap-2 border-t border-line py-2"
        >
          <dt class="text-xs text-ink-3">
            {{ item.label }}
          </dt>
          <dd class="text-right font-mono text-sm text-ink">
            {{ formatValue(item.value) }}
            <span :class="['block text-xs', TONE_TEXT[toneOf(item.gap)]]">
              （{{ formatSigned(item.gap, 1, '%') }}）
            </span>
          </dd>
        </div>
      </dl>
      <p class="mt-2 text-xs text-ink-3">
        MA 是最近 N 個交易日收盤價的平均：MA5 約一週、MA20 月線、MA60 季線、MA200
        年線。EMA 把較近的價格算得比較重，轉向比同天期的 MA 早。
      </p>
    </div>

    <!-- 各指標 -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="reading in readings"
        :key="reading.key"
        class="flex flex-col gap-2 rounded-[10px] border border-line p-4"
      >
        <h3 class="flex items-baseline justify-between gap-2 text-sm font-medium text-ink">
          {{ reading.name }}
          <span
            v-if="reading.params"
            class="font-mono text-xs font-normal text-ink-3"
          >（{{ reading.params }}）</span>
        </h3>
        <dl class="flex flex-wrap gap-x-5 gap-y-1">
          <div
            v-for="value in reading.values"
            :key="value.label"
          >
            <dt class="text-xs text-ink-3">
              {{ value.label }}
            </dt>
            <dd :class="['font-mono text-lg font-medium', TONE_TEXT[value.tone ?? 'ink']]">
              {{ value.text }}
            </dd>
          </div>
        </dl>
        <p :class="['self-start rounded-md px-2 py-1 text-xs', TONE_CHIP[reading.tone]]">
          {{ reading.state }}
        </p>
        <p class="text-xs leading-relaxed text-ink-3">
          {{ reading.description }}
        </p>
      </article>
    </div>

    <p class="border-t border-line pt-3 text-xs leading-relaxed text-ink-3">
      技術指標只是把價量資料換一種方式呈現，本身不預測後市，也不是投資建議。行情與除權息資料來自
      FinMind；成交量含盤後與零股，會比券商軟體的一般交易量略高。
    </p>
  </section>
</template>
