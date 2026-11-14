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
