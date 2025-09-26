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

  // 教師節等特殊假期
  private static readonly TEACHERS_DAY_2025 = '2025-09-28' // 下週一教師節放假

  /**
   * 檢查指定日期是否為台股交易日
   */
  static isTradingDay(date: Date): boolean {
    // 檢查是否為週末
    const dayOfWeek = date.getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) { // 週日或週六
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
    const endTime = this.TRADING_END_HOUR * 100 + this.TRADING_END_MINUTE     // 1330

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
   * 獲取台股交易時段劃分
   */
  static getTradingPeriods(): Array<{
    name: string
    start: string
    end: string
    description: string
    type: 'opening' | 'morning' | 'midday' | 'closing'
  }> {
    return [
      {
        name: '開盤競價',
        start: '09:00',
        end: '09:05',
        description: '開盤集合競價時段',
        type: 'opening'
      },
      {
        name: '早盤交易',
        start: '09:05',
        end: '10:00',
        description: '早盤活躍交易時段',
        type: 'morning'
      },
      {
        name: '上午盤中',
        start: '10:00',
        end: '11:00',
        description: '上午盤中交易',
        type: 'morning'
      },
      {
        name: '午前交易',
        start: '11:00',
        end: '12:00',
        description: '午前交易時段',
        type: 'midday'
      },
      {
        name: '午後開盤',
        start: '12:00',
        end: '13:00',
        description: '午後開盤交易',
        type: 'midday'
      },
      {
        name: '收盤前段',
        start: '13:00',
        end: '13:25',
        description: '收盤前交易',
        type: 'closing'
      },
      {
        name: '收盤競價',
        start: '13:25',
        end: '13:30',
        description: '收盤集合競價',
        type: 'closing'
      }
    ]
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
        nextTradingDay
      }
    }

    const hour = now.getHours()
    const minute = now.getMinutes()
    const currentTime = hour * 100 + minute

    if (currentTime < 900) {
      return {
        isOpen: false,
        status: 'pre_market',
        message: '尚未開盤，交易時間 09:00-13:30'
      }
    } else if (currentTime >= 900 && currentTime <= 1330) {
      return {
        isOpen: true,
        status: 'trading',
        message: '交易時間中'
      }
    } else {
      const nextTradingDay = this.getNextTradingDay(now)
      return {
        isOpen: false,
        status: 'post_market',
        message: `今日交易結束，下個交易日為 ${this.formatDate(nextTradingDay)}`,
        nextTradingDay
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
      weekday: 'short'
    }).format(date)
  }

  /**
   * 獲取建議的交易時段（基於吉時和交易時間的交集）
   * 只返回當天的時段建議
   */
  static getRecommendedTradingPeriods(
    luckyHours: string[], 
    avoidHours: string[], 
    date: Date = new Date()
  ): {
    recommended: Array<{ time: string; reason: string }>
    avoid: Array<{ time: string; reason: string }>
    isToday: boolean
    tradingDay: Date
  } {
    const now = new Date()
    const isToday = this.isSameDay(date, now)
    
    // 只有當天才計算推薦和避免時段
    const recommended: Array<{ time: string; reason: string }> = []
    const avoid: Array<{ time: string; reason: string }> = []
    
    // 只在當天且為交易日時計算時段建議
    if (isToday && this.isTradingDay(date)) {
      // 台股交易時段
      const tradingPeriods = [
        { time: '09:00-10:00', name: '早盤交易' },
        { time: '10:00-11:00', name: '上午盤中' },
        { time: '11:00-12:00', name: '午前交易' },
        { time: '12:00-13:00', name: '午後開盤' },
        { time: '13:00-13:30', name: '收盤交易' }
      ]

      for (const period of tradingPeriods) {
        const isLucky = luckyHours.some(lucky => this.timeOverlap(period.time, lucky))
        const isAvoid = avoidHours.some(avoidTime => this.timeOverlap(period.time, avoidTime))

        if (isLucky && !isAvoid) {
          recommended.push({
            time: period.time,
            reason: `${period.name} - 吉時交易`
          })
        } else if (isAvoid) {
          avoid.push({
            time: period.time,
            reason: `${period.name} - 兇時避免`
          })
        }
      }
    }

    return { 
      recommended, 
      avoid, 
      isToday, 
      tradingDay: date 
    }
  }

  /**
   * 檢查兩個時間段是否重疊
   */
  private static timeOverlap(period1: string, period2: string): boolean {
    const parseTime = (timeRange: string) => {
      const [start, end] = timeRange.split('-')
      const parseHour = (time: string) => {
        const [hour, minute = '0'] = time.split(':')
        return parseInt(hour) * 60 + parseInt(minute)
      }
      return {
        start: parseHour(start),
        end: parseHour(end)
      }
    }

    const p1 = parseTime(period1)
    const p2 = parseTime(period2)

    return !(p1.end <= p2.start || p2.end <= p1.start)
  }

  /**
   * 檢查兩個日期是否為同一天
   */
  private static isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate()
  }
}