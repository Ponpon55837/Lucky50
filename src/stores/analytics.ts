import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import { useQueryCache } from '@pinia/colada'
import type { ETFData, BacktestCosts, BacktestResults } from '@/types'
import { dateRangeFromToday, loadMarketRange, priceAdjustmentsQuery } from '@/queries'
import {
  formatMarketFetchTime,
  type MarketProvenance,
  type MarketStatus,
} from '@/services/marketHistory'
import { isSortedByDate } from '@/utils/indicators'
import {
  adjustBars,
  hasPriceAdjustmentMismatch,
  KNOWN_SPLITS,
  reconcilePriceAdjustments,
  type PriceAdjustment,
} from '@/utils/priceAdjust'
import { buildTechnicalSnapshot } from '@/utils/technical'
import {
  DEFAULT_BACKTEST_COSTS,
  fortuneCorrelation,
  runBacktest,
  type BandStats,
  type FortuneBand,
} from '@/utils/backtest'
import { mapInSlices } from '@/utils/scheduling'

/**
 * 技術指標固定取最近這麼多天的日 K（約 540 個交易日），不隨畫面選的分析區間改變：
 * 200 日均線、52 週區間與一年報酬都需要一年以上的資料，EMA 也要夠長的暖機期才會收斂。
 */
const TECHNICAL_LOOKBACK_DAYS = 800

type LoadState = 'idle' | 'loading' | 'ready' | 'failed'

export interface StrategyAnalysis {
  /** 資料不足兩個交易日時為 null */
  backtest: BacktestResults | null
  correlation: Record<FortuneBand, BandStats>
}

export const useAnalyticsStore = defineStore('analytics', () => {
  // 分析相關的狀態
  const selectedPeriod = shallowRef('1個月')
  const periods = ['1個月', '3個月', '6個月', '1年', '3年', '5年']

  // 回測結果緩存：只留最近一組（資料 + 評分依據）
  // 存的是 Promise：計算途中再被要求同一組，會共用同一次計算
  let strategyCache: { key: string; analysis: Promise<StrategyAnalysis> } | null = null

  // 調整後 ETF 數據緩存：Analytics 頁面會有多個元件（4 個 3D 視覺化 + 圖表）
  // 針對同一份 etfData 各自呼叫 getAdjustedEtfData，沒有緩存會造成重複排序/映射
  let adjustedEtfDataCache: {
    key: string
    data: ETFData[]
    checks: ReturnType<typeof reconcilePriceAdjustments>
  } | null = null

  // 根據時間段獲取天數
  const getPeriodDays = (period: string) => {
    const periodMap: Record<string, number> = {
      '1個月': 30,
      '3個月': 90,
      '6個月': 180,
      '1年': 365,
      '3年': 1095,
      '5年': 1825,
    }
    return periodMap[period] || 30
  }

  // ── 還原股價 ──

  /** 分割與除息的還原係數；載入前（或載入失敗）只有已知的分割 */
  const adjustments = shallowRef<readonly PriceAdjustment[]>(KNOWN_SPLITS)
  /** ready：已含除息還原；failed：除權息資料抓不到，只還原了分割 */
  const adjustmentState = ref<LoadState | 'cached'>('idle')
  const adjustmentFetchedAt = ref('')
  const dividendAdjusted = computed(() => Boolean(adjustmentFetchedAt.value))
  const adjustmentLabel = computed(() => {
    if (adjustmentState.value === 'cached') {
      return `沿用 ${formatMarketFetchTime(adjustmentFetchedAt.value)} 擷取的分割與除息資料，更新失敗`
    }
    return dividendAdjusted.value ? '價格已還原分割與除息' : '價格僅還原已知分割，未還原除息'
  })

  const queryCache = useQueryCache()

  let adjustmentRequest: { force: boolean; promise: Promise<void> } | null = null
  const loadPriceAdjustments = (force = false): Promise<void> => {
    if (adjustmentRequest) {
      const pending = adjustmentRequest.promise
      return force && !adjustmentRequest.force
        ? pending.then(() => loadPriceAdjustments(true))
        : pending
    }

    const hasLoaded = dividendAdjusted.value
    if (!hasLoaded) adjustmentState.value = 'loading'
    const promise = (async () => {
      try {
        const entry = queryCache.ensure(priceAdjustmentsQuery)
        const state = force ? await queryCache.fetch(entry) : await queryCache.refresh(entry)
        if (state.status === 'error') throw state.error
        if (state.status === 'success') {
          adjustments.value = state.data
          adjustmentFetchedAt.value = new Date(entry.when).toISOString()
          adjustmentState.value = 'ready'
        }
      } catch (error) {
        // 保留上一次成功取得的係數，避免無法重新核對時隱藏已知的不一致。
        console.error('除權息資料載入失敗，沿用目前的還原因子:', error)
        adjustmentState.value = hasLoaded ? 'cached' : 'failed'
      }
    })().finally(() => {
      adjustmentRequest = null
    })
    adjustmentRequest = { force, promise }
    return promise
  }

  const sortedByDate = (etfData: ETFData[]) =>
    // 資料多半已依日期排序：先 O(n) 檢查，只有亂序時才付出 O(n log n) 排序成本
    // （複本排序避免 mutate 傳入的 store 陣列）
    isSortedByDate(etfData)
      ? etfData
      : [...etfData].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))

  const adjustedEtfAnalysis = (etfData: ETFData[]) => {
    // 供應商可能修訂區間中間的 K 棒或除權息係數，筆數與首尾資料不變時也需重算。
    const applied = adjustments.value
    const key = JSON.stringify([applied, etfData])
    if (adjustedEtfDataCache?.key === key) return adjustedEtfDataCache

    const sorted = sortedByDate(etfData)
    const checks = reconcilePriceAdjustments(sorted, applied)
    const data = hasPriceAdjustmentMismatch(checks) ? [] : adjustBars(sorted, applied)
    adjustedEtfDataCache = { key, data, checks }
    return adjustedEtfDataCache
  }

  /** 還原分割與除息後的 ETF 資料（依日期遞增）；企業行動資料不一致時暫停計算。 */
  const getAdjustedEtfData = (etfData: ETFData[]) => adjustedEtfAnalysis(etfData).data
  const getPriceAdjustmentChecks = (etfData: ETFData[]) => adjustedEtfAnalysis(etfData).checks

  // ── 技術指標 ──

  const technicalBars = shallowRef<ETFData[]>([])
  const technicalStatus = ref<MarketStatus>('idle')
  const technicalProvenance = shallowRef<MarketProvenance | null>(null)
  const technicalLoading = ref(false)
  let technicalRequest = 0
  const technicalState = computed<LoadState>(() => {
    if (technicalLoading.value) return 'loading'
    if (technicalStatus.value === 'current') return 'ready'
    return technicalStatus.value === 'idle' ? 'idle' : 'failed'
  })

  const sortedTechnicalBars = computed(() => sortedByDate(technicalBars.value))
  const technicalAdjustmentChecks = computed(() =>
    reconcilePriceAdjustments(sortedTechnicalBars.value, adjustments.value)
  )

  /** 最新交易日的技術面快照；行情缺少或事件前收不一致時，各值為 null。 */
  const technicalSnapshot = computed(() =>
    buildTechnicalSnapshot(
      hasPriceAdjustmentMismatch(technicalAdjustmentChecks.value)
        ? []
        : adjustBars(sortedTechnicalBars.value, adjustments.value)
    )
  )

  /** 載入技術指標用的日 K；離線時只使用相同期間的已驗證快取。 */
  const loadTechnicalBars = async (force = false) => {
    const seq = ++technicalRequest
    technicalLoading.value = true
    const range = dateRangeFromToday(TECHNICAL_LOOKBACK_DAYS)
    try {
      const { data, status } = await loadMarketRange(
        queryCache,
        range,
        force,
        TECHNICAL_LOOKBACK_DAYS
      )
      if (seq !== technicalRequest) return
      technicalBars.value = data?.bars ?? []
      technicalProvenance.value = data?.provenance ?? null
      technicalStatus.value = status
    } finally {
      if (seq === technicalRequest) technicalLoading.value = false
    }
  }

  /**
   * 以實際開盤價執行策略、收盤價估值，並統計各分數區間的收盤漲跌。
   * scoreOf 回傳某日的投資分數；scoreKey 代表評分依據（個人資料與引擎設定），用來辨識快取是否仍適用。
   * 逐日評分是這裡最花時間的部分（五年約上千天），所以分段執行不卡畫面，
   * 而且同一份資料與評分依據只算一次。評分失敗時不留快取，下次會重算。
   */
  const analyzeStrategies = (
    etfData: ETFData[],
    scoreOf: (date: string) => number,
    scoreKey: string,
    overrides: Partial<BacktestCosts> = {}
  ): Promise<StrategyAnalysis> => {
    // 分段評分開始前先取一份價格快照，避免中途更新行情時混用不同版本。
    const prices = getAdjustedEtfData(etfData).map(({ date, open, close }) => ({
      date,
      open,
      close,
    }))
    const costs = { ...DEFAULT_BACKTEST_COSTS, ...overrides }
    const key = JSON.stringify([prices, scoreKey, costs])
    if (strategyCache?.key === key) return strategyCache.analysis

    const analysis = mapInSlices(prices, item => ({ ...item, score: scoreOf(item.date) })).then(
      days => ({ backtest: runBacktest(days, costs), correlation: fortuneCorrelation(days) })
    )
    strategyCache = { key, analysis }
    analysis.catch(() => {
      if (strategyCache?.analysis === analysis) strategyCache = null
    })
    return analysis
  }

  // 設置選中的時間段
  const setSelectedPeriod = (period: string) => {
    selectedPeriod.value = period
  }

  const clearStrategyCache = () => {
    strategyCache = null
  }

  return {
    // 狀態
    selectedPeriod,
    periods,
    adjustments,
    dividendAdjusted,
    adjustmentLabel,
    adjustmentState,
    technicalState,
    technicalStatus,
    technicalProvenance,
    technicalAdjustmentChecks,
    technicalSnapshot,

    // 方法
    getPeriodDays,
    getAdjustedEtfData,
    getPriceAdjustmentChecks,
    loadPriceAdjustments,
    loadTechnicalBars,
    analyzeStrategies,
    setSelectedPeriod,
    clearStrategyCache,
  }
})
