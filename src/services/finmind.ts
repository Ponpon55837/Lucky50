import axios from 'axios'
import type { ETFData } from '@/types'

const finmindAPI = axios.create({
  baseURL: 'https://api.finmindtrade.com/api/v4',
  timeout: 10000
})

export class FinMindService {
  /**
   * 取得 0050 ETF 歷史資料
   */
  static async getETFData(startDate: string, endDate: string): Promise<ETFData[]> {
    try {
      const response = await finmindAPI.get('/data', {
        params: {
          dataset: 'TaiwanStockDaily',
          data_id: '0050',
          start_date: startDate,
          end_date: endDate
        }
      })

      if (response.data.status !== 200) {
        throw new Error('API 回應錯誤')
      }

      return response.data.data.map((item: any) => ({
        date: item.date,
        open: parseFloat(item.open),
        high: parseFloat(item.max),
        low: parseFloat(item.min),
        close: parseFloat(item.close),
        volume: parseInt(item.Trading_Volume),
        change: parseFloat(item.close) - parseFloat(item.open),
        changePercent: ((parseFloat(item.close) - parseFloat(item.open)) / parseFloat(item.open)) * 100
      }))
    } catch (error) {
      console.error('取得 ETF 資料失敗:', error)
      throw new Error('無法取得股市資料，請稍後再試')
    }
  }

  /**
   * 取得即時股價
   */
  static async getRealTimePrice(): Promise<ETFData | null> {
    try {
      const today = new Date().toISOString().split('T')[0]
      const data = await this.getETFData(today, today)
      return data[0] || null
    } catch (error) {
      console.error('取得即時價格失敗:', error)
      return null
    }
  }

  /**
   * 取得技術指標
   */
  static async getTechnicalIndicators(startDate: string, endDate: string) {
    try {
      const response = await finmindAPI.get('/data', {
        params: {
          dataset: 'TaiwanStockStatistics',
          data_id: '0050',
          start_date: startDate,
          end_date: endDate
        }
      })

      return response.data.data
    } catch (error) {
      console.error('取得技術指標失敗:', error)
      throw new Error('無法取得技術分析資料')
    }
  }
}