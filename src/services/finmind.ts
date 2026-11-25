import axios from 'axios'
import type { AxiosError, InternalAxiosRequestConfig } from 'axios'
import type { ETFData, FinMindDataItem, FinMindDividendResultItem, FinMindSplitItem } from '@/types'
import { isIsoDay, isValidBar, marketDateRange, type MarketSnapshot } from './marketHistory'
import { isSortedByDate } from '@/utils/indicators'
import {
  dividendFactor,
  KNOWN_SPLITS,
  splitFactor,
  type PriceAdjustment,
} from '@/utils/priceAdjust'

const SYMBOL = '0050'
/** 0050 掛牌日，查詢除權息紀錄的起點 */
const LISTING_DATE = '2003-06-30'

// API 監控介面
interface ApiMonitor {
  record: (url: string, method: string, status: number, duration: number) => void
}

// 掛在 window 上的監控相關欄位
interface ApiMonitorWindow {
  __apiMonitorInterceptors?: boolean
  __apiMonitor?: ApiMonitor
}

// 附加請求開始時間的 axios 設定
interface TimedAxiosRequestConfig extends InternalAxiosRequestConfig {
  __startTime?: number
}

const finmindAPI = axios.create({
  baseURL: import.meta.env.VITE_FINMIND_API_URL || 'https://api.finmindtrade.com/api/v4',
  timeout: 10000,
  adapter: 'fetch',
  fetchOptions: { cache: 'no-store' },
  headers: {
    'Content-Type': 'application/json',
  },
})

// 添加請求攔截器來處理 API Token
finmindAPI.interceptors.request.use(config => {
  const token = import.meta.env.VITE_FINMIND_API_TOKEN
  if (token) {
    config.params = {
      ...config.params,
      token: token,
    }
  }
  return config
})

// API 監控 — 記錄每次 axios 請求的 endpoint / method / status / duration
if (typeof window !== 'undefined') {
  const monitorWindow = window as unknown as ApiMonitorWindow

  if (!monitorWindow.__apiMonitorInterceptors) {
    monitorWindow.__apiMonitorInterceptors = true
    finmindAPI.interceptors.request.use(config => {
      ;(config as TimedAxiosRequestConfig).__startTime = performance.now()
      return config
    })
    finmindAPI.interceptors.response.use(
      response => {
        const apiMon = monitorWindow.__apiMonitor
        if (apiMon) {
          const startTime = (response.config as TimedAxiosRequestConfig).__startTime
          const dur = performance.now() - (startTime ?? performance.now())
          apiMon.record(
            response.config.url || '',
            response.config.method?.toUpperCase() || 'GET',
            response.status,
            dur
          )
        }
        return response
      },
      (error: AxiosError) => {
        const apiMon = monitorWindow.__apiMonitor
        if (apiMon && error.config) {
          const startTime = (error.config as TimedAxiosRequestConfig).__startTime
          const dur = performance.now() - (startTime ?? performance.now())
          apiMon.record(
            error.config.url || '',
            error.config.method?.toUpperCase() || 'GET',
            error.response?.status || 0,
            dur
          )
        }
        return Promise.reject(error)
      }
    )
  }
}

function marketNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && /^[+-]?\d+(?:\.\d+)?$/.test(value.trim())) return Number(value)
  return NaN
}

export class FinMindService {
  /** 取得並驗證 0050 日 K（原始價，未還原），保留本次實際擷取時間。 */
  static async getMarketHistory(startDate: string, endDate: string): Promise<MarketSnapshot> {
    if (!isIsoDay(startDate) || !isIsoDay(endDate) || startDate > endDate) {
      throw new Error('0050 行情日期範圍無效')
    }
    const range = { startDate, endDate }
    const response = await finmindAPI.get('/data', {
      params: {
        dataset: 'TaiwanStockPrice',
        data_id: SYMBOL,
        start_date: startDate,
        end_date: endDate,
      },
    })
    const rows: FinMindDataItem[] | undefined = response.data?.data
    if (response.data?.status !== 200 || !Array.isArray(rows) || rows.length === 0) {
      throw new Error('FinMind API 無數據')
    }

    const dates = new Set<string>()
    const bars = rows.map((item): ETFData => {
      if (!item || (item.stock_id !== undefined && item.stock_id !== SYMBOL)) {
        throw new Error('FinMind 0050 行情格式無效')
      }
      const open = marketNumber(item.open)
      const close = marketNumber(item.close)
      // 舊格式沒有 spread 時，change 表示當日收盤減開盤。
      const change = item.spread === undefined ? close - open : marketNumber(item.spread)
      const base = item.spread === undefined ? open : close - change
      const bar = {
        date: item.date,
        open,
        high: marketNumber(item.max ?? item.high),
        low: marketNumber(item.min ?? item.low),
        close,
        volume: marketNumber(item.Trading_Volume ?? item.volume),
        change,
        changePercent: (change / base) * 100,
      }
      if (base <= 0 || !isValidBar(bar, range) || dates.has(bar.date)) {
        throw new Error('FinMind 0050 行情格式無效')
      }
      dates.add(bar.date)
      return bar
    })

    if (!isSortedByDate(bars)) bars.sort((a, b) => a.date.localeCompare(b.date))
    return {
      range,
      bars,
      provenance: {
        source: 'FinMind',
        asOf: bars[bars.length - 1].date,
        fetchedAt: new Date().toISOString(),
      },
    }
  }

  static async getDailyBars(startDate: string, endDate: string): Promise<ETFData[]> {
    return (await this.getMarketHistory(startDate, endDate)).bars
  }

  static getETFData(startDate: string, endDate: string): Promise<ETFData[]> {
    return this.getDailyBars(startDate, endDate)
  }

  /**
   * 取得 0050 歷來的分割與除息還原係數（FinMind 免費資料集）。
   * TaiwanStockPrice 是未還原的原始價，還原要靠這兩張表；任何一張抓不到就丟出錯誤。
   */
  static async getPriceAdjustments(): Promise<PriceAdjustment[]> {
    const fetchRows = async <T>(dataset: string): Promise<T[]> => {
      const response = await finmindAPI.get('/data', {
        params: { dataset, data_id: SYMBOL, start_date: LISTING_DATE },
      })
      if (response.data?.status !== 200 || !Array.isArray(response.data.data)) {
        throw new Error(`FinMind ${dataset} 無數據`)
      }
      return response.data.data
    }
    const [splits, dividends] = await Promise.all([
      fetchRows<FinMindSplitItem>('TaiwanStockSplitPrice'),
      fetchRows<FinMindDividendResultItem>('TaiwanStockDividendResult'),
    ])

    const { endDate } = marketDateRange(0)
    const parseEvents = <T extends FinMindSplitItem | FinMindDividendResultItem>(
      rows: T[],
      kind: PriceAdjustment['kind'],
      getReference: (row: T) => number,
      getFactor: (beforePrice: number, referencePrice: number) => number | null
    ): PriceAdjustment[] => {
      const events: PriceAdjustment[] = []
      const dates = new Set<string>()
      for (const row of rows) {
        if (
          !row ||
          !isIsoDay(row.date) ||
          row.date < LISTING_DATE ||
          (row.stock_id !== undefined && row.stock_id !== SYMBOL)
        ) {
          throw new Error(`FinMind 0050 ${kind} 資料格式無效`)
        }
        if (row.date > endDate) continue
        const beforePrice = marketNumber(row.before_price)
        const referencePrice = marketNumber(getReference(row))
        const factor = getFactor(beforePrice, referencePrice)
        if (factor === null || !Number.isFinite(factor) || factor <= 0 || dates.has(row.date)) {
          throw new Error(`FinMind 0050 ${kind} 資料格式無效`)
        }
        dates.add(row.date)
        events.push({ date: row.date, kind, factor, beforePrice, referencePrice })
      }
      return events
    }
    const splitEvents = parseEvents(splits, 'split', row => row.after_price, splitFactor)
    const dividendEvents = parseEvents(
      dividends,
      'dividend',
      row => row.reference_price,
      dividendFactor
    )
    if (
      !dividendEvents.length ||
      KNOWN_SPLITS.some(
        split => split.date <= endDate && !splitEvents.some(event => event.date === split.date)
      )
    ) {
      throw new Error('FinMind 0050 除權息資料不完整')
    }
    return [...splitEvents, ...dividendEvents]
  }

  /**
   * 取得近七日的最新日 K；連線失敗時回傳 null。
   */
  static async getRealTimePrice(): Promise<ETFData | null> {
    try {
      const { startDate, endDate } = marketDateRange(7)
      const data = await this.getETFData(startDate, endDate)
      // 資料依日期遞增，最新一筆在尾端
      return data.length > 0 ? data[data.length - 1] : null
    } catch (error) {
      console.error('取得即時價格失敗:', error)

      return null
    }
  }

  /**
   * 檢查 API 狀態
   */
  static async checkAPIStatus(): Promise<boolean> {
    try {
      const response = await finmindAPI.get('/data', {
        params: {
          dataset: 'TaiwanStockPrice',
          data_id: SYMBOL,
          start_date: '2024-01-01',
          end_date: '2024-01-01',
        },
      })
      return response.data.status === 200
    } catch {
      console.warn('FinMind API 無法連接')
      return false
    }
  }
}
