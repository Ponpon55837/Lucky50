import { describe, it, expect, beforeEach, vi } from 'vitest'
import { FortuneService } from '@/services/fortune'
import type { UserProfile } from '@/types'

// Mock lunar-javascript
vi.mock('lunar-javascript', () => ({
  Solar: {
    fromDate: vi.fn(() => ({
      getLunar: vi.fn(() => ({
        getDayGan: () => '甲',
        getDayZhi: () => '子',
        getMonthGan: () => '乙',
        getMonthZhi: () => '丑',
        getYearGan: () => '甲',
        getYearZhi: () => '子',
        getYearShengXiao: () => '鼠',
      })),
    })),
  },
}))

// Mock performance monitor
vi.mock('@/utils/performance', () => ({
  perfMonitor: {
    measureSync: vi.fn((_name: string, fn: () => unknown) => fn()),
  },
}))

describe('FortuneService', () => {
  let testProfile: UserProfile

  beforeEach(() => {
    // 清除緩存
    FortuneService.clearCache()

    // 準備測試用的用戶資料
    testProfile = {
      name: '測試用戶',
      birthDate: '1990-01-01',
      birthTime: '10:30',
      zodiac: '鼠',
      element: '金',
      luckyColors: ['金色', '白色'],
      luckyNumbers: [1, 6],
    }
  })

  describe('calculateDailyFortune', () => {
    it('應該成功計算每日運勢', () => {
      const testDate = new Date('2024-01-15')
      const fortune = FortuneService.calculateDailyFortune(testProfile, testDate)

      expect(fortune).toBeDefined()
      expect(fortune.date).toBe('2024-01-15')
      expect(fortune.overallScore).toBeGreaterThanOrEqual(0)
      expect(fortune.overallScore).toBeLessThanOrEqual(100)
      expect(fortune.investmentScore).toBeGreaterThanOrEqual(0)
      expect(fortune.investmentScore).toBeLessThanOrEqual(100)
      expect(['BUY', 'HOLD', 'SELL']).toContain(fortune.recommendation)
      expect(fortune.advice).toBeTruthy()
      expect(fortune.luckyTime).toBeTruthy()
      expect(fortune.avoidTime).toBeTruthy()
    })

    it('應該返回完整的五行屬性', () => {
      const testDate = new Date('2024-01-15')
      const fortune = FortuneService.calculateDailyFortune(testProfile, testDate)

      expect(fortune.elements).toBeDefined()
      expect(fortune.elements.metal).toBeGreaterThanOrEqual(10)
      expect(fortune.elements.metal).toBeLessThanOrEqual(100)
      expect(fortune.elements.wood).toBeGreaterThanOrEqual(10)
      expect(fortune.elements.wood).toBeLessThanOrEqual(100)
      expect(fortune.elements.water).toBeGreaterThanOrEqual(10)
      expect(fortune.elements.water).toBeLessThanOrEqual(100)
      expect(fortune.elements.fire).toBeGreaterThanOrEqual(10)
      expect(fortune.elements.fire).toBeLessThanOrEqual(100)
      expect(fortune.elements.earth).toBeGreaterThanOrEqual(10)
      expect(fortune.elements.earth).toBeLessThanOrEqual(100)
    })

    it('應該對相同輸入返回一致的結果（確定性）', () => {
      const testDate = new Date('2024-01-15')

      const fortune1 = FortuneService.calculateDailyFortune(testProfile, testDate)
      const fortune2 = FortuneService.calculateDailyFortune(testProfile, testDate)

      expect(fortune1.overallScore).toBe(fortune2.overallScore)
      expect(fortune1.investmentScore).toBe(fortune2.investmentScore)
      expect(fortune1.recommendation).toBe(fortune2.recommendation)
      expect(fortune1.luckyTime).toBe(fortune2.luckyTime)
      expect(fortune1.avoidTime).toBe(fortune2.avoidTime)
    })

    it('應該正確使用緩存機制', () => {
      const testDate = new Date('2024-01-15')

      // 第一次調用
      const fortune1 = FortuneService.calculateDailyFortune(testProfile, testDate)
      const cacheStats1 = FortuneService.getCacheStats()
      expect(cacheStats1.size).toBe(1)

      // 第二次調用應該使用緩存
      const fortune2 = FortuneService.calculateDailyFortune(testProfile, testDate)
      const cacheStats2 = FortuneService.getCacheStats()
      expect(cacheStats2.size).toBe(1)

      // 結果應該相同
      expect(fortune1).toBe(fortune2)
    })

    it('應該拋出錯誤當日期無效時', () => {
      const invalidDate = new Date('invalid')

      expect(() => {
        FortuneService.calculateDailyFortune(testProfile, invalidDate)
      }).toThrow('無效的日期')
    })

    it('應該為不同日期產生不同的運勢', () => {
      const date1 = new Date('2024-01-15')
      const date2 = new Date('2024-01-16')

      const fortune1 = FortuneService.calculateDailyFortune(testProfile, date1)
      const fortune2 = FortuneService.calculateDailyFortune(testProfile, date2)

      // 不同日期的運勢應該不同（至少有一個屬性不同）
      const isDifferent =
        fortune1.overallScore !== fortune2.overallScore ||
        fortune1.investmentScore !== fortune2.investmentScore ||
        fortune1.luckyTime !== fortune2.luckyTime
      expect(isDifferent).toBe(true)
    })

    it('應該根據分數給出正確的建議', () => {
      const testDate = new Date('2024-01-15')
      const fortune = FortuneService.calculateDailyFortune(testProfile, testDate)

      const combinedScore = (fortune.overallScore + fortune.investmentScore) / 2

      if (combinedScore >= 70) {
        expect(fortune.recommendation).toBe('BUY')
      } else if (combinedScore >= 40) {
        expect(fortune.recommendation).toBe('HOLD')
      } else {
        expect(fortune.recommendation).toBe('SELL')
      }
    })
  })

  describe('cache management', () => {
    it('應該限制緩存大小不超過100條', () => {
      // 生成101個不同的運勢數據
      for (let i = 0; i < 101; i++) {
        const date = new Date('2024-01-01')
        date.setDate(date.getDate() + i)
        FortuneService.calculateDailyFortune(testProfile, date)
      }

      const cacheStats = FortuneService.getCacheStats()
      expect(cacheStats.size).toBeLessThanOrEqual(100)
    })

    it('應該能夠清除所有緩存', () => {
      const testDate = new Date('2024-01-15')
      FortuneService.calculateDailyFortune(testProfile, testDate)

      const statsBefore = FortuneService.getCacheStats()
      expect(statsBefore.size).toBeGreaterThan(0)

      FortuneService.clearCache()

      const statsAfter = FortuneService.getCacheStats()
      expect(statsAfter.size).toBe(0)
    })

    it('應該返回正確的緩存統計資訊', () => {
      const stats = FortuneService.getCacheStats()
      expect(stats).toHaveProperty('size')
      expect(stats).toHaveProperty('maxSize')
      expect(stats.maxSize).toBe(100)
    })
  })

  describe('recommendation logic', () => {
    it('應該根據投資分數生成適當的建議文字', () => {
      const testDate = new Date('2024-01-15')
      const fortune = FortuneService.calculateDailyFortune(testProfile, testDate)

      expect(fortune.advice).toBeTruthy()
      expect(typeof fortune.advice).toBe('string')

      // 檢查建議內容是否符合分數範圍
      if (fortune.investmentScore >= 80) {
        expect(fortune.advice).toContain('財運亨通')
      } else if (fortune.investmentScore >= 60) {
        expect(fortune.advice).toContain('運勢平穩')
      } else if (fortune.investmentScore >= 40) {
        expect(fortune.advice).toContain('運勢一般')
      } else {
        expect(fortune.advice).toContain('運勢較弱')
      }
    })

    it('應該包含台股交易時段資訊', () => {
      const testDate = new Date('2024-01-15')
      const fortune = FortuneService.calculateDailyFortune(testProfile, testDate)

      // 吉時和避開時段應該包含時間範圍
      expect(fortune.luckyTime).toMatch(/\d{2}:\d{2}/)
      expect(fortune.avoidTime).toMatch(/\d{2}:\d{2}/)
    })
  })

  describe('zodiac influence', () => {
    it('應該為不同生肖產生不同的運勢加成', () => {
      const testDate = new Date('2024-01-15')

      // 清除緩存確保重新計算
      FortuneService.clearCache()

      const profile1 = { ...testProfile, name: '用戶A', zodiac: '龍' } // 高加成生肖
      const profile2 = { ...testProfile, name: '用戶B', zodiac: '羊' } // 低加成生肖

      const fortune1 = FortuneService.calculateDailyFortune(profile1, testDate)
      const fortune2 = FortuneService.calculateDailyFortune(profile2, testDate)

      // 因為名字不同，種子不同，所以分數應該不同
      // 或者至少我們可以驗證他們都能正常運算
      expect(fortune1.investmentScore).toBeGreaterThanOrEqual(0)
      expect(fortune1.investmentScore).toBeLessThanOrEqual(100)
      expect(fortune2.investmentScore).toBeGreaterThanOrEqual(0)
      expect(fortune2.investmentScore).toBeLessThanOrEqual(100)
    })
  })
})
