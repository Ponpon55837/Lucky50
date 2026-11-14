/**
 * 台股交易時間和假日檢查服務
 */
export class TaiwanStockService {
  // 台股交易時間：週一至週五 09:00-13:30
  private static readonly TRADING_START_HOUR = 9
  private static readonly TRADING_START_MINUTE = 0
  private static readonly TRADING_END_HOUR = 13
  private static readonly TRADING_END_MINUTE = 30

  // 2024-2025年台灣政府行事曆假期（包含補假）
  private static readonly GOVERNMENT_HOLIDAYS_2024 = new Set([
    '2024-01-01', // 元旦
    '2024-02-08', // 農曆除夕前一日調整放假
    '2024-02-09', // 農曆除夕
    '2024-02-10', // 農曆正月初一（春節）
    '2024-02-11', // 農曆正月初二
    '2024-02-12', // 農曆正月初三
    '2024-02-13', // 農曆正月初四調整放假
    '2024-02-14', // 農曆正月初五調整放假
    '2024-02-28', // 和平紀念日
    '2024-04-04', // 兒童節
    '2024-04-05', // 清明節
    '2024-05-01', // 勞動節
    '2024-06-10', // 端午節
    '2024-09-17', // 中秋節
    '2024-10-10', // 國慶日
  ])

  private static readonly GOVERNMENT_HOLIDAYS_2025 = new Set([
    '2025-01-01', // 元旦
    '2025-01-27', // 農曆除夕調整放假
    '2025-01-28', // 農曆除夕
    '2025-01-29', // 農曆正月初一（春節）
    '2025-01-30', // 農曆正月初二
    '2025-01-31', // 農曆正月初三
    '2025-02-28', // 和平紀念日
    '2025-04-03', // 兒童節調整放假
    '2025-04-04', // 兒童節
    '2025-04-05', // 清明節
    '2025-05-01', // 勞動節
    '2025-05-31', // 端午節
    '2025-09-28', // 教師節
    '2025-10-06', // 中秋節
    '2025-10-10', // 國慶日
  ])

  /**
   * 檢查指定日期是否為台股交易日
   */
  static isTradingDay(date: Date): boolean {
    // 檢查是否為週末
    const dayOfWeek = date.getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      // 週日或週六
      return false
    }

    // 格式化日期為 YYYY-MM-DD
    const dateStr = this.formatDateISO(date)

    // 檢查是否為2024年政府假期
    if (this.GOVERNMENT_HOLIDAYS_2024.has(dateStr)) {
      return false
    }

    // 檢查是否為2025年政府假期
    if (this.GOVERNMENT_HOLIDAYS_2025.has(dateStr)) {
      return false
    }

    return true
  }

  /**
   * 格式化日期為 ISO 格式 (YYYY-MM-DD)
   */
  private static formatDateISO(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  /**
   * 檢查指定時間是否在交易時間內
   */
  static isInTradingHours(date: Date): boolean {
    if (!this.isTradingDay(date)) {
      return false
    }

    const hour = date.getHours()
    const minute = date.getMinutes()
    const currentTime = hour * 100 + minute

    const startTime = this.TRADING_START_HOUR * 100 + this.TRADING_START_MINUTE // 900
    const endTime = this.TRADING_END_HOUR * 100 + this.TRADING_END_MINUTE // 1330

    return currentTime >= startTime && currentTime <= endTime
  }

  /**
   * 獲取下一個交易日
   */
  static getNextTradingDay(date: Date): Date {
    const nextDay = new Date(date)

    do {
      nextDay.setDate(nextDay.getDate() + 1)
    } while (!this.isTradingDay(nextDay))

    return nextDay
  }

  /**
   * 根據當前時間獲取交易狀態
   */
  static getTradingStatus(date: Date = new Date()): {
    isOpen: boolean
    status: 'closed' | 'pre_market' | 'trading' | 'post_market'
    message: string
    nextTradingDay?: Date
  } {
    const now = new Date(date)

    if (!this.isTradingDay(now)) {
      const nextTradingDay = this.getNextTradingDay(now)
      return {
        isOpen: false,
        status: 'closed',
        message: `今日休市，下個交易日為 ${this.formatDate(nextTradingDay)}`,
        nextTradingDay,
      }
    }

    const hour = now.getHours()
    const minute = now.getMinutes()
    const currentTime = hour * 100 + minute

    if (currentTime < 900) {
      return {
        isOpen: false,
        status: 'pre_market',
        message: '尚未開盤，交易時間 09:00-13:30',
      }
    } else if (currentTime >= 900 && currentTime <= 1330) {
      return {
        isOpen: true,
        status: 'trading',
        message: '交易時間中',
      }
    } else {
      const nextTradingDay = this.getNextTradingDay(now)
      return {
        isOpen: false,
        status: 'post_market',
        message: `今日交易結束，下個交易日為 ${this.formatDate(nextTradingDay)}`,
        nextTradingDay,
      }
    }
  }

  /**
   * 格式化日期顯示
   */
  private static formatDate(date: Date): string {
    return new Intl.DateTimeFormat('zh-TW', {
      month: 'numeric',
      day: 'numeric',
      weekday: 'short',
    }).format(date)
  }
}
