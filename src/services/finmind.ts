import axios from 'axios'
import type { AxiosError, InternalAxiosRequestConfig } from 'axios'
import type { ETFData, FinMindDataItem, FinMindDividendResultItem, FinMindSplitItem } from '@/types'
import { apiCache, CacheKeyGenerator } from './apiCache'
import { toLocalDateString } from '@/utils/date'
import { isSortedByDate } from '@/utils/indicators'
import { dividendFactor, splitFactor, type PriceAdjustment } from '@/utils/priceAdjust'

const SYMBOL = '0050'
/** 0050 掛牌日，查詢除權息紀錄的起點 */
const LISTING_DATE = '2003-06-30'
const PRICE_CACHE_MS = 10 * 60 * 1000
/** 除權息一年只有兩次，還原係數快取半天 */
const ADJUSTMENT_CACHE_MS = 12 * 60 * 60 * 1000

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

// 安全的數字解析函數
const parseFloatSafe = (value: string | undefined, fallback: number = 0): number => {
  if (!value) return fallback
  const parsed = parseFloat(value)
  return isNaN(parsed) ? fallback : parsed
}

const parseIntSafe = (value: string | undefined, fallback: number = 0): number => {
  if (!value) return fallback
  const parsed = parseInt(value, 10)
  return isNaN(parsed) ? fallback : parsed
}

export class FinMindService {
  // 備用模擬數據
  private static getMockETFData(startDate: string, endDate: string): ETFData[] {
    const mockData: ETFData[] = []
    const start = new Date(startDate)
    const end = new Date(endDate)

    // 生成基於日期範圍的模擬數據
    let currentDate = new Date(start)
    let basePrice = 130 + Math.random() * 10 // 基準價格在 130-140 之間

    while (currentDate <= end) {
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
        // 跳過週末
        const priceChange = (Math.random() - 0.5) * 2 // -1 到 1 的隨機變化
        const open = basePrice + (Math.random() - 0.5) * 0.5
        const close = open + priceChange
        const high = Math.max(open, close) + Math.random() * 0.8
        const low = Math.min(open, close) - Math.random() * 0.8
        const volume = Math.floor(Math.random() * 50000000) + 10000000

        const dataPoint = {
          date: toLocalDateString(currentDate),
          open: Number(open.toFixed(2)),
          high: Number(high.toFixed(2)),
          low: Number(low.toFixed(2)),
          close: Number(close.toFixed(2)),
          volume: volume,
          change: Number((close - open).toFixed(2)),
          changePercent: Number((((close - open) / open) * 100).toFixed(2)),
        }

        mockData.push(dataPoint)
        basePrice = close // 下次的基準價格
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return mockData // 與 API 一致：依日期遞增，最新一筆在陣列尾端
  }

  /**
   * 向 FinMind 取得 0050 日 K（原始價，未還原）。沒有資料或回應異常時丟出錯誤，由呼叫端決定怎麼處理。
   */
  private static async fetchDailyBars(startDate: string, endDate: string): Promise<ETFData[]> {
    const response = await finmindAPI.get('/data', {
      params: {
        dataset: 'TaiwanStockPrice',
        data_id: SYMBOL,
        start_date: startDate,
        end_date: endDate,
      },
    })
    const rows: FinMindDataItem[] | undefined = response.data?.data
    if (response.data?.status !== 200 || !rows || rows.length === 0) {
      throw new Error('FinMind API 無數據')
    }

    const bars = rows.map((item): ETFData => {
      const open = parseFloatSafe(item.open)
      const close = parseFloatSafe(item.close)
      // spread 是對前一交易日收盤的漲跌；舊格式沒有這個欄位時退回當日收盤減開盤
      const spread = Number(item.spread)
      const hasSpread = item.spread !== undefined && Number.isFinite(spread)
      const change = hasSpread ? spread : close - open
      const base = hasSpread ? close - spread : open
      return {
        date: item.date,
        open,
        high: parseFloatSafe(item.max || item.high || item.close),
        low: parseFloatSafe(item.min || item.low || item.close),
        close,
        volume: parseIntSafe(item.Trading_Volume || item.volume),
        change,
        changePercent: base > 0 ? (change / base) * 100 : 0,
      }
    })

    // API 通常已依日期遞增；保險起見 O(n) 檢查，亂序時才排序
    if (!isSortedByDate(bars)) bars.sort((a, b) => (a.date < b.date ? -1 : 1))
    return bars
  }

  /**
   * 取得 0050 日 K，失敗時丟出錯誤、不以模擬資料代替。
   * 技術指標必須算在真實行情上，所以走這條路；與 getETFData 共用同一份快取。
   */
  static getDailyBars(startDate: string, endDate: string): Promise<ETFData[]> {
    return apiCache.cached(
      CacheKeyGenerator.stock(SYMBOL, startDate, endDate),
      () => this.fetchDailyBars(startDate, endDate),
      PRICE_CACHE_MS
    )
  }

  /**
   * 取得 0050 ETF 歷史資料 (支援快取)；API 失敗時退回模擬資料讓圖表仍可顯示
   */
  static async getETFData(startDate: string, endDate: string): Promise<ETFData[]> {
    try {
      return await this.getDailyBars(startDate, endDate)
    } catch (error: unknown) {
      console.error('FinMind API 請求失敗:', error instanceof Error ? error.message : String(error))
      console.warn('使用備用模擬數據替代')
      return this.getMockETFData(startDate, endDate)
    }
  }

  /**
   * 取得 0050 歷來的分割與除息還原係數（FinMind 免費資料集）。
   * TaiwanStockPrice 是未還原的原始價，還原要靠這兩張表；任何一張抓不到就丟出錯誤。
   */
  static getPriceAdjustments(): Promise<PriceAdjustment[]> {
    return apiCache.cached(
      CacheKeyGenerator.stock(SYMBOL, 'adjustments', LISTING_DATE),
      async () => {
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

        const adjustments: PriceAdjustment[] = []
        for (const row of splits) {
          const factor = splitFactor(Number(row.before_price), Number(row.after_price))
          if (factor !== null) adjustments.push({ date: row.date, kind: 'split', factor })
        }
        for (const row of dividends) {
          const factor = dividendFactor(Number(row.before_price), Number(row.reference_price))
          if (factor !== null) adjustments.push({ date: row.date, kind: 'dividend', factor })
        }
        return adjustments
      },
      ADJUSTMENT_CACHE_MS
    )
  }

  /**
   * 取得即時股價
   */
  static async getRealTimePrice(): Promise<ETFData | null> {
    try {
      const today = toLocalDateString(new Date())
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 7) // 取最近7天的數據
      const weekAgo = toLocalDateString(yesterday)

      const data = await this.getETFData(weekAgo, today)
      // 資料依日期遞增，最新一筆在尾端
      return data.length > 0 ? data[data.length - 1] : null
    } catch (error) {
      console.error('取得即時價格失敗:', error)

      // 如果無法取得數據，返回一個基本的模擬數據
      const mockPrice: ETFData = {
        date: toLocalDateString(new Date()),
        open: 132.5,
        high: 133.8,
        low: 131.9,
        close: 133.25,
        volume: 25000000,
        change: 0.75,
        changePercent: 0.57,
      }
      return mockPrice
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
      console.warn('FinMind API 無法連接，將使用備用數據')
      return false
    }
  }
}
