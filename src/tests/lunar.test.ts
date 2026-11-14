import { describe, it, expect, beforeEach } from 'vitest'
import { lunarService } from '@/services/lunar'

describe('LunarService', () => {
  beforeEach(() => {
    lunarService.clearCache()
  })

  describe('getLunarData', () => {
    it('回傳當日農民曆（繁體）', () => {
      const data = lunarService.getLunarData(new Date(2026, 10, 16, 10))
      expect(data).toMatchObject({
        ganZhi: '丙午',
        dayGanZhi: '甲午',
        zodiac: '馬',
        tianShen: '青龍',
        tianShenLuck: '吉',
        zhiXing: '危',
        sha: '北',
        caiShen: '東北',
        naYinDay: '沙中金',
        chongDesc: '(戊子)鼠',
      })
      expect(data.yi).toContain('開市')
      expect(data.yi).toContain('納財')
      expect(data.pengZu).toContain('甲不開倉')
      expect(data.jiuXing).not.toBe('')
    })

    it('節氣當天回傳節氣名稱，其餘為空字串', () => {
      expect(lunarService.getLunarData(new Date(2026, 10, 7)).jieQi).toBe('立冬')
      expect(lunarService.getLunarData(new Date(2026, 10, 16)).jieQi).toBe('')
    })

    it('以本地日期為快取鍵：同一天任何時刻都是同一份資料', () => {
      const midnight = lunarService.getLunarData(new Date(2026, 10, 16, 0, 30))
      const night = lunarService.getLunarData(new Date(2026, 10, 16, 23, 30))
      expect(night).toBe(midnight)
    })

    it('凌晨查詢不會取到前一天（UTC 日期）的資料', () => {
      const previousNight = lunarService.getLunarData(new Date(2026, 10, 15, 23, 59))
      const earlyMorning = lunarService.getLunarData(new Date(2026, 10, 16, 0, 1))
      expect(previousNight.dayGanZhi).toBe('癸巳')
      expect(earlyMorning.dayGanZhi).toBe('甲午')
    })

    it('清除快取後重新計算', () => {
      const date = new Date(2026, 10, 16)
      const first = lunarService.getLunarData(date)
      lunarService.clearCache()
      const second = lunarService.getLunarData(date)
      expect(second).not.toBe(first)
      expect(second).toEqual(first)
    })

    it('拒絕無效或超出範圍的日期', () => {
      expect(() => lunarService.getLunarData(new Date('invalid'))).toThrow('無效的日期參數')
      expect(() => lunarService.getLunarData(new Date(1800, 0, 1))).toThrow('年份超出範圍')
    })
  })

  describe('getInvestmentAdvice', () => {
    it('只看日子本身：甲午日青龍黃道、建除危、宜開市', () => {
      const advice = lunarService.getInvestmentAdvice(new Date(2026, 10, 16))
      expect(advice).toMatchObject({
        luckyScore: 80,
        recommendation: 'BUY',
        riskLevel: 'low',
        luckyDirection: '東北',
      })
      expect(advice.factors.map(factor => factor.delta)).toEqual([10, 8, 12])
    })

    it('不同日子分數不同', () => {
      const scores = Array.from(
        { length: 30 },
        (_, i) => lunarService.getInvestmentAdvice(new Date(2026, 10, 1 + i)).luckyScore
      )
      expect(new Set(scores).size).toBeGreaterThan(3)
    })
  })
})
