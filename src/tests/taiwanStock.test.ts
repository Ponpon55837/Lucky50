import { describe, it, expect } from 'vitest'
import { TaiwanStockService } from '@/services/taiwanStock'

describe('TaiwanStockService', () => {
  describe('isTradingDay', () => {
    it('週一至週五為交易日', () => {
      expect(TaiwanStockService.isTradingDay(new Date('2024-01-02'))).toBe(true) // 週二
      expect(TaiwanStockService.isTradingDay(new Date('2024-01-03'))).toBe(true) // 週三
      expect(TaiwanStockService.isTradingDay(new Date('2024-01-04'))).toBe(true) // 週四
      expect(TaiwanStockService.isTradingDay(new Date('2024-01-05'))).toBe(true) // 週五
    })

    it('週末為非交易日', () => {
      expect(TaiwanStockService.isTradingDay(new Date('2024-01-06'))).toBe(false) // 週六
      expect(TaiwanStockService.isTradingDay(new Date('2024-01-07'))).toBe(false) // 週日
    })

    it('2024年國定假日為非交易日', () => {
      expect(TaiwanStockService.isTradingDay(new Date('2024-01-01'))).toBe(false) // 元旦
      expect(TaiwanStockService.isTradingDay(new Date('2024-02-28'))).toBe(false) // 和平紀念日
      expect(TaiwanStockService.isTradingDay(new Date('2024-10-10'))).toBe(false) // 國慶日
    })

    it('2025年國定假日為非交易日', () => {
      expect(TaiwanStockService.isTradingDay(new Date('2025-01-01'))).toBe(false) // 元旦
      expect(TaiwanStockService.isTradingDay(new Date('2025-10-10'))).toBe(false) // 國慶日
    })

    it('2024年春節期間為非交易日', () => {
      expect(TaiwanStockService.isTradingDay(new Date('2024-02-08'))).toBe(false)
      expect(TaiwanStockService.isTradingDay(new Date('2024-02-09'))).toBe(false)
      expect(TaiwanStockService.isTradingDay(new Date('2024-02-10'))).toBe(false)
      expect(TaiwanStockService.isTradingDay(new Date('2024-02-11'))).toBe(false)
      expect(TaiwanStockService.isTradingDay(new Date('2024-02-12'))).toBe(false)
    })
  })

  describe('休市日曆：依證交所公告', () => {
    const closed = (day: string) => TaiwanStockService.isTradingDay(new Date(`${day}T10:00:00`))

    it('春節前僅辦理結算交割的兩天不交易', () => {
      expect(closed('2024-02-06')).toBe(false)
      expect(closed('2024-02-07')).toBe(false)
      expect(closed('2025-01-23')).toBe(false)
      expect(closed('2025-01-24')).toBe(false)
      expect(closed('2026-02-12')).toBe(false)
      expect(closed('2026-02-13')).toBe(false)
    })

    it('春節前最後交易日與春節後開始交易日是交易日', () => {
      expect(closed('2025-01-22')).toBe(true)
      expect(closed('2025-02-03')).toBe(true)
      expect(closed('2026-02-11')).toBe(true)
      expect(closed('2026-02-23')).toBe(true)
      expect(closed('2027-02-01')).toBe(true)
      expect(closed('2027-02-11')).toBe(true)
    })

    it('2025 年的補假與新增國定假日', () => {
      expect(closed('2025-05-30')).toBe(false) // 端午節補假
      expect(closed('2025-09-29')).toBe(false) // 教師節補假
      expect(closed('2025-10-24')).toBe(false) // 光復節補假
      expect(closed('2025-12-25')).toBe(false) // 行憲紀念日
    })

    it('2026 年休市日', () => {
      for (const day of [
        '2026-01-01',
        '2026-02-16',
        '2026-02-20',
        '2026-02-27',
        '2026-04-03',
        '2026-04-06',
        '2026-05-01',
        '2026-06-19',
        '2026-09-25',
        '2026-09-28',
        '2026-10-09',
        '2026-10-26',
        '2026-12-25',
      ]) {
        expect(closed(day), day).toBe(false)
      }
      expect(closed('2026-01-02')).toBe(true)
      expect(closed('2026-11-13')).toBe(true)
    })

    it('2027 年休市日', () => {
      for (const day of [
        '2027-01-01',
        '2027-02-02',
        '2027-02-10',
        '2027-03-01',
        '2027-04-05',
        '2027-04-06',
        '2027-04-30',
        '2027-06-09',
        '2027-09-15',
        '2027-09-28',
        '2027-10-11',
        '2027-10-25',
        '2027-12-24',
        '2027-12-31',
      ]) {
        expect(closed(day), day).toBe(false)
      }
      expect(closed('2027-01-04')).toBe(true)
    })
  })

  describe('超出休市日曆涵蓋的年度', () => {
    it('isCalendarCovered 標示日曆是否涵蓋', () => {
      expect(TaiwanStockService.isCalendarCovered(new Date('2024-06-03T10:00:00'))).toBe(true)
      expect(TaiwanStockService.isCalendarCovered(new Date('2027-06-03T10:00:00'))).toBe(true)
      expect(TaiwanStockService.isCalendarCovered(new Date('2028-06-01T10:00:00'))).toBe(false)
      expect(TaiwanStockService.isCalendarCovered(new Date('2023-06-01T10:00:00'))).toBe(false)
    })

    it('只判斷週末，並在狀態與訊息中標示未涵蓋', () => {
      // 2028-01-01 是週六、2028-01-03 是週一
      expect(TaiwanStockService.isTradingDay(new Date('2028-01-01T10:00:00'))).toBe(false)
      const status = TaiwanStockService.getTradingStatus(new Date('2028-01-03T10:00:00'))
      expect(status.status).toBe('trading')
      expect(status.calendarCovered).toBe(false)
      expect(status.message).toContain('休市日曆尚未涵蓋 2028 年')
    })

    it('涵蓋的年度不加註', () => {
      const status = TaiwanStockService.getTradingStatus(new Date('2026-11-13T10:00:00'))
      expect(status.calendarCovered).toBe(true)
      expect(status.message).toBe('交易時間中')
    })
  })

  describe('isInTradingHours', () => {
    it('非交易日回傳 false', () => {
      const sunday = new Date('2024-01-07T10:00:00')
      expect(TaiwanStockService.isInTradingHours(sunday)).toBe(false)
    })

    it('開盤前回傳 false', () => {
      const beforeOpen = new Date('2024-01-02T08:59:00')
      expect(TaiwanStockService.isInTradingHours(beforeOpen)).toBe(false)
    })

    it('交易時間中回傳 true', () => {
      const duringTrading = new Date('2024-01-02T10:30:00')
      expect(TaiwanStockService.isInTradingHours(duringTrading)).toBe(true)
    })

    it('收盤後回傳 false', () => {
      const afterClose = new Date('2024-01-02T13:31:00')
      expect(TaiwanStockService.isInTradingHours(afterClose)).toBe(false)
    })

    it('收盤競價邊界(13:30) 為交易時間', () => {
      const closing = new Date('2024-01-02T13:30:00')
      expect(TaiwanStockService.isInTradingHours(closing)).toBe(true)
    })
  })

  describe('getNextTradingDay', () => {
    it('週五的下個交易日為週一', () => {
      const friday = new Date('2024-01-05')
      const next = TaiwanStockService.getNextTradingDay(friday)
      expect(next.getDay()).toBe(1) // 週一
      expect(next.getDate()).toBe(8)
    })

    it('假日後的下個交易日為非假日', () => {
      const holiday = new Date('2024-01-01') // 元旦
      const next = TaiwanStockService.getNextTradingDay(holiday)
      expect(TaiwanStockService.isTradingDay(next)).toBe(true)
      expect(next.getDate()).toBe(2)
    })

    it('春節後的下個交易日', () => {
      const lastSpringFestival = new Date('2024-02-14') // 春節最後一天
      const next = TaiwanStockService.getNextTradingDay(lastSpringFestival)
      expect(TaiwanStockService.isTradingDay(next)).toBe(true)
    })
  })

  describe('getTradingStatus', () => {
    it('非交易日回傳 closed', () => {
      const sunday = new Date('2024-01-07T10:00:00')
      const status = TaiwanStockService.getTradingStatus(sunday)
      expect(status.isOpen).toBe(false)
      expect(status.status).toBe('closed')
      expect(status.nextTradingDay).toBeDefined()
    })

    it('交易時間中回傳 trading', () => {
      const trading = new Date('2024-01-02T10:30:00')
      const status = TaiwanStockService.getTradingStatus(trading)
      expect(status.isOpen).toBe(true)
      expect(status.status).toBe('trading')
    })

    it('開盤前回傳 pre_market', () => {
      const preMarket = new Date('2024-01-02T08:30:00')
      const status = TaiwanStockService.getTradingStatus(preMarket)
      expect(status.isOpen).toBe(false)
      expect(status.status).toBe('pre_market')
    })

    it('收盤後回傳 post_market', () => {
      const postMarket = new Date('2024-01-02T14:00:00')
      const status = TaiwanStockService.getTradingStatus(postMarket)
      expect(status.isOpen).toBe(false)
      expect(status.status).toBe('post_market')
    })
  })
})
