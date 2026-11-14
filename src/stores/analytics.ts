import { defineStore } from 'pinia'
import { shallowRef } from 'vue'
import type { ETFData, BacktestResults } from '@/types'
import {
  isSortedByDate,
  rsi as calcRsi,
  macd as calcMacd,
  bollingerPosition,
  stochasticKD,
} from '@/utils/indicators'
import { fortuneCorrelation, runBacktest, type BandStats, type FortuneBand } from '@/utils/backtest'
import { mapInSlices } from '@/utils/scheduling'

// 0050 於 2025/6/18 進行 1 拆 4；ISO 日期字串可直接字典序比較，省去每筆 new Date()
const SPLIT_DATE = '2025-06-18'
const SPLIT_RATIO = 4

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
  let adjustedEtfDataCache: { hash: string; data: ETFData[] } | null = null

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

  // 調整ETF數據以處理股票分拆
  const getAdjustedEtfData = (etfData: ETFData[]) => {
    if (!etfData.length) return []

    // 同一份 etfData 常被多個元件（4 個 3D 視覺化 + 各種統計計算）重複呼叫，
    // 命中緩存可省去重複的排序與映射
    const hash = generateDataHash(etfData)
    if (adjustedEtfDataCache && adjustedEtfDataCache.hash === hash) {
      return adjustedEtfDataCache.data
    }

    // 資料多半已依日期排序：先 O(n) 檢查，只有亂序時才付出 O(n log n) 排序成本
    // （複本排序避免 mutate 傳入的 store 陣列）
    const data = isSortedByDate(etfData)
      ? etfData
      : [...etfData].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))

    // 分拆前的價格除以分拆比例、成交量乘以比例，以保持連續性
    const result = data.map((item: ETFData) =>
      item.date < SPLIT_DATE
        ? {
            ...item,
            open: item.open / SPLIT_RATIO,
            high: item.high / SPLIT_RATIO,
            low: item.low / SPLIT_RATIO,
            close: item.close / SPLIT_RATIO,
            volume: item.volume * SPLIT_RATIO,
          }
        : item
    )

    adjustedEtfDataCache = { hash, data: result }
    return result
  }

  // 計算技術指標
  const calculateTechnicalIndicators = (etfData: ETFData[]) => {
    const adjustedData = getAdjustedEtfData(etfData)

    if (adjustedData.length === 0) {
      return {
        rsi: 50,
        macd: 0,
        bollingerBand: '中軌',
        kd: { k: 50, d: 50 },
      }
    }

    const prices: number[] = []
    for (const item of adjustedData) {
      if (typeof item.close === 'number' && !isNaN(item.close)) prices.push(item.close)
    }

    if (prices.length < 14) {
      return {
        rsi: 50,
        macd: 0,
        bollingerBand: '中軌',
        kd: { k: 50, d: 50 },
      }
    }

    // 各指標皆為 O(n) 單次掃描；KD 使用單調佇列求滑動視窗極值
    const rsi = calcRsi(prices, 14)
    const macd = calcMacd(prices)
    const bollingerBand = bollingerPosition(prices, 20, 2)
    const { k, d } = stochasticKD(adjustedData, 9)

    return {
      rsi: Math.round(rsi * 10) / 10,
      macd: Math.round(macd * 100) / 100,
      bollingerBand,
      kd: { k: Math.round(k), d: Math.round(d) },
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
    const key = `${generateDataHash(etfData)}|${scoreKey}`
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

    // 方法
    getPeriodDays,
    getAdjustedEtfData,
    calculateTechnicalIndicators,
    analyzeStrategies,
    setSelectedPeriod,
    clearStrategyCache,
  }
})
