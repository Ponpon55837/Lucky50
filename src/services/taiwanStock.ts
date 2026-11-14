/**
 * 台股交易時間和休市日檢查服務
 */

/**
 * 各年度休市日（不含一般週末）。
 *
 * 來源：臺灣證券交易所「市場開休市日期」公告，逐年取自
 * https://www.twse.com.tw/rwd/zh/holidaySchedule/holidaySchedule?response=json&date=YYYY0101
 * （網頁版：https://www.twse.com.tw/zh/trading/holiday.html），2026-11-14 查詢。
 * 公告中的「開始交易日」「最後交易日」是交易日，不列入；
 * 「市場無交易，僅辦理結算交割作業」當天不能買賣，列為休市。
 * 颱風等臨時停止交易是事後公告，不在這張表裡。
 *
 * 證交所通常在前一年年底公告次年日期；新年度公告後請在這裡補上。
 */
const MARKET_HOLIDAYS: Readonly<Record<number, ReadonlySet<string>>> = {
  2024: new Set([
    '2024-01-01', // 中華民國開國紀念日
    '2024-02-06', // 市場無交易，僅辦理結算交割作業
    '2024-02-07', // 市場無交易，僅辦理結算交割作業
    '2024-02-08', // 農曆除夕前一日
    '2024-02-09', // 農曆除夕
    '2024-02-10', // 農曆春節
    '2024-02-11', // 農曆春節
    '2024-02-12', // 農曆春節
    '2024-02-13', // 農曆春節
    '2024-02-14', // 農曆春節
    '2024-02-28', // 和平紀念日
    '2024-04-04', // 兒童節
    '2024-04-05', // 民族掃墓節
    '2024-05-01', // 勞動節
    '2024-06-10', // 端午節
    '2024-09-17', // 中秋節
    '2024-10-10', // 國慶日
  ]),
  2025: new Set([
    '2025-01-01', // 中華民國開國紀念日
    '2025-01-23', // 市場無交易，僅辦理結算交割作業
    '2025-01-24', // 市場無交易，僅辦理結算交割作業
    '2025-01-27', // 農曆除夕前一日
    '2025-01-28', // 農曆除夕
    '2025-01-29', // 農曆春節
    '2025-01-30', // 農曆春節
    '2025-01-31', // 農曆春節
    '2025-02-28', // 和平紀念日
    '2025-04-03', // 兒童節及民族掃墓節
    '2025-04-04', // 兒童節及民族掃墓節
    '2025-05-01', // 勞動節
    '2025-05-30', // 端午節
    '2025-05-31', // 端午節
    '2025-09-28', // 孔子誕辰紀念日／教師節
    '2025-09-29', // 孔子誕辰紀念日／教師節
    '2025-10-06', // 中秋節
    '2025-10-10', // 國慶日
    '2025-10-24', // 臺灣光復暨金門古寧頭大捷紀念日
    '2025-10-25', // 臺灣光復暨金門古寧頭大捷紀念日
    '2025-12-25', // 行憲紀念日
  ]),
  2026: new Set([
    '2026-01-01', // 中華民國開國紀念日
    '2026-02-12', // 市場無交易，僅辦理結算交割作業
    '2026-02-13', // 市場無交易，僅辦理結算交割作業
    '2026-02-15', // 農曆除夕及春節
    '2026-02-16', // 農曆除夕及春節
    '2026-02-17', // 農曆除夕及春節
    '2026-02-18', // 農曆除夕及春節
    '2026-02-19', // 農曆除夕及春節
    '2026-02-20', // 農曆除夕及春節
    '2026-02-27', // 和平紀念日
    '2026-02-28', // 和平紀念日
    '2026-04-03', // 兒童節及民族掃墓節
    '2026-04-04', // 兒童節及民族掃墓節
    '2026-04-05', // 兒童節及民族掃墓節
    '2026-04-06', // 兒童節及民族掃墓節
    '2026-05-01', // 勞動節
    '2026-06-19', // 端午節
    '2026-09-25', // 中秋節
    '2026-09-28', // 孔子誕辰紀念日／教師節
    '2026-10-09', // 國慶日
    '2026-10-10', // 國慶日
    '2026-10-25', // 臺灣光復暨金門古寧頭大捷紀念日
    '2026-10-26', // 臺灣光復暨金門古寧頭大捷紀念日
    '2026-12-25', // 行憲紀念日
  ]),
  2027: new Set([
    '2027-01-01', // 中華民國開國紀念日
    '2027-02-02', // 市場無交易，僅辦理結算交割作業
    '2027-02-03', // 市場無交易，僅辦理結算交割作業
    '2027-02-04', // 農曆除夕及春節
    '2027-02-05', // 農曆除夕及春節
    '2027-02-06', // 農曆除夕及春節
    '2027-02-07', // 農曆除夕及春節
    '2027-02-08', // 農曆除夕及春節
    '2027-02-09', // 農曆除夕及春節
    '2027-02-10', // 農曆除夕及春節
    '2027-02-28', // 和平紀念日
    '2027-03-01', // 和平紀念日
    '2027-04-04', // 兒童節及民族掃墓節
    '2027-04-05', // 兒童節及民族掃墓節
    '2027-04-06', // 兒童節及民族掃墓節
    '2027-04-30', // 勞動節
    '2027-05-01', // 勞動節
    '2027-06-09', // 端午節
    '2027-09-15', // 中秋節
    '2027-09-28', // 孔子誕辰紀念日／教師節
    '2027-10-10', // 國慶日
    '2027-10-11', // 國慶日
    '2027-10-25', // 臺灣光復暨金門古寧頭大捷紀念日
    '2027-12-24', // 行憲紀念日
    '2027-12-25', // 行憲紀念日
    '2027-12-31', // 117年中華民國開國紀念日
  ]),
}

export class TaiwanStockService {
  // 台股交易時間：週一至週五 09:00-13:30
  private static readonly TRADING_START_HOUR = 9
  private static readonly TRADING_START_MINUTE = 0
  private static readonly TRADING_END_HOUR = 13
  private static readonly TRADING_END_MINUTE = 30

  /**
   * 休市日曆是否涵蓋這一天所在的年度。
   * 未涵蓋的年度只能判斷週末，國定假日會被當成交易日，呼叫端應提醒使用者。
   */
  static isCalendarCovered(date: Date): boolean {
    return date.getFullYear() in MARKET_HOLIDAYS
  }

  /**
   * 檢查指定日期是否為台股交易日。
   * 年度不在休市日曆內時只排除週末（見 isCalendarCovered）。
   */
  static isTradingDay(date: Date): boolean {
    const dayOfWeek = date.getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) return false
    return !MARKET_HOLIDAYS[date.getFullYear()]?.has(this.formatDateISO(date))
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
    /** false：休市日曆未涵蓋這個年度，只判斷了週末 */
    calendarCovered: boolean
  } {
    const now = new Date(date)
    const calendarCovered = this.isCalendarCovered(now)
    // 日曆沒有涵蓋時把限制寫進訊息，不讓使用者以為國定假日也判斷過了
    const caveat = calendarCovered
      ? ''
      : `（休市日曆尚未涵蓋 ${now.getFullYear()} 年，僅判斷週末，國定假日請以證交所公告為準）`

    if (!this.isTradingDay(now)) {
      const nextTradingDay = this.getNextTradingDay(now)
      return {
        isOpen: false,
        status: 'closed',
        message: `今日休市，下個交易日為 ${this.formatDate(nextTradingDay)}${caveat}`,
        nextTradingDay,
        calendarCovered,
      }
    }

    const hour = now.getHours()
    const minute = now.getMinutes()
    const currentTime = hour * 100 + minute

    if (currentTime < 900) {
      return {
        isOpen: false,
        status: 'pre_market',
        message: `尚未開盤，交易時間 09:00-13:30${caveat}`,
        calendarCovered,
      }
    } else if (currentTime >= 900 && currentTime <= 1330) {
      return {
        isOpen: true,
        status: 'trading',
        message: `交易時間中${caveat}`,
        calendarCovered,
      }
    } else {
      const nextTradingDay = this.getNextTradingDay(now)
      return {
        isOpen: false,
        status: 'post_market',
        message: `今日交易結束，下個交易日為 ${this.formatDate(nextTradingDay)}${caveat}`,
        nextTradingDay,
        calendarCovered,
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
