import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import { useQueryCache } from '@pinia/colada'
import type { ETFData, BacktestResults } from '@/types'
import { dateRangeFromToday, priceAdjustmentsQuery, technicalBarsQuery } from '@/queries'
import { isSortedByDate } from '@/utils/indicators'
import { adjustBars, KNOWN_SPLITS, type PriceAdjustment } from '@/utils/priceAdjust'
import { buildTechnicalSnapshot } from '@/utils/technical'
import { fortuneCorrelation, runBacktest, type BandStats, type FortuneBand } from '@/utils/backtest'
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
    hash: string
    adjustments: readonly PriceAdjustment[]
    data: ETFData[]
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

  // 生成數據哈希值（用於緩存鍵）
  const generateDataHash = (etfData: ETFData[]): string => {
    if (etfData.length === 0) return 'empty'

    // 使用數據長度、第一條和最後一條數據的關鍵資訊來生成hash
    const first = etfData[0]
    const last = etfData[etfData.length - 1]
    const hashSource = `${etfData.length}-${first.date}-${first.close}-${last.date}-${last.close}`

    // 簡單的hash函數
    let hash = 0
    for (let i = 0; i < hashSource.length; i++) {
      const char = hashSource.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString()
  }

  // ── 還原股價 ──

  /** 分割與除息的還原係數；載入前（或載入失敗）只有已知的分割 */
  const adjustments = shallowRef<readonly PriceAdjustment[]>(KNOWN_SPLITS)
  /** ready：已含除息還原；failed：除權息資料抓不到，只還原了分割 */
  const adjustmentState = ref<LoadState>('idle')
  const dividendAdjusted = computed(() => adjustmentState.value === 'ready')

  const queryCache = useQueryCache()

  /** staleTime 內直接回傳快取；查詢失敗時丟出錯誤 */
  const runQuery = async <T>(options: Parameters<typeof queryCache.ensure<T>>[0]): Promise<T> => {
    const state = await queryCache.refresh(queryCache.ensure(options))
    if (state.status === 'error') throw state.error
    return state.data as T
  }

  const loadPriceAdjustments = async () => {
    if (adjustmentState.value === 'ready' || adjustmentState.value === 'loading') return
    adjustmentState.value = 'loading'
    try {
      adjustments.value = await runQuery(priceAdjustmentsQuery)
      adjustmentState.value = 'ready'
    } catch (error) {
      console.error('除權息資料載入失敗，價格僅還原分割:', error)
      adjustments.value = KNOWN_SPLITS
      adjustmentState.value = 'failed'
    }
  }

  const sortedByDate = (etfData: ETFData[]) =>
    // 資料多半已依日期排序：先 O(n) 檢查，只有亂序時才付出 O(n log n) 排序成本
    // （複本排序避免 mutate 傳入的 store 陣列）
    isSortedByDate(etfData)
      ? etfData
      : [...etfData].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))

  /** 還原分割與除息後的 ETF 資料（依日期遞增） */
  const getAdjustedEtfData = (etfData: ETFData[]) => {
    if (!etfData.length) return []

    // 同一份 etfData 常被多個元件（3D 視覺化 + 圖表 + 回測）重複呼叫，命中緩存可省去重複的排序與映射
    const applied = adjustments.value
    const hash = generateDataHash(etfData)
    if (adjustedEtfDataCache?.hash === hash && adjustedEtfDataCache.adjustments === applied) {
      return adjustedEtfDataCache.data
    }

    const result = adjustBars(sortedByDate(etfData), applied)
    adjustedEtfDataCache = { hash, adjustments: applied, data: result }
    return result
  }

  // ── 技術指標 ──

  const technicalBars = shallowRef<ETFData[]>([])
  const technicalState = ref<LoadState>('idle')

  /** 最新交易日的技術面快照；行情尚未載入時各值為 null */
  const technicalSnapshot = computed(() =>
    buildTechnicalSnapshot(adjustBars(sortedByDate(technicalBars.value), adjustments.value))
  )

  /** 載入技術指標用的日 K；只收真實行情，失敗時保留上一次成功的資料並標記 failed */
  const loadTechnicalBars = async () => {
    if (technicalState.value === 'loading') return
    technicalState.value = 'loading'
    const range = dateRangeFromToday(TECHNICAL_LOOKBACK_DAYS)
    try {
      technicalBars.value = await runQuery(technicalBarsQuery(range))
      technicalState.value = 'ready'
    } catch (error) {
      console.error('技術指標行情載入失敗:', error)
      technicalState.value = 'failed'
    }
  }

  /**
   * 以實際收盤價回測三種策略，並統計各分數區間當日的漲跌。
   * scoreOf 回傳某日的投資分數；scoreKey 代表評分依據（個人資料與引擎設定），用來辨識快取是否仍適用。
   * 逐日評分是這裡最花時間的部分（五年約上千天），所以分段執行不卡畫面，
   * 而且同一份資料與評分依據只算一次。評分失敗時不留快取，下次會重算。
   */
  const analyzeStrategies = (
    etfData: ETFData[],
    scoreOf: (date: string) => number,
    scoreKey: string
  ): Promise<StrategyAnalysis> => {
    // 還原係數換了（除息資料載入完成），收盤價跟著變，回測要重算
    const key = `${generateDataHash(etfData)}|${adjustments.value.length}|${scoreKey}`
    if (strategyCache?.key === key) return strategyCache.analysis

    const analysis = mapInSlices(getAdjustedEtfData(etfData), item => ({
      date: item.date,
      close: item.close,
      score: scoreOf(item.date),
    })).then(days => ({ backtest: runBacktest(days), correlation: fortuneCorrelation(days) }))
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
    technicalState,
    technicalSnapshot,

    // 方法
    getPeriodDays,
    getAdjustedEtfData,
    loadPriceAdjustments,
    loadTechnicalBars,
    analyzeStrategies,
    setSelectedPeriod,
    clearStrategyCache,
  }
})
