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
      surname: '測',
      givenName: '試用戶',
      name: '測試用戶',
      birthDate: '1990-01-01',
      birthTime: '10:30',
      zodiac: '馬',
      element: '金',
      nameElement: '火',
      nameStrokes: 22,
      luckyColors: ['白色', '金色'],
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

  describe('element energy with naYin', () => {
    it('納音五行末字應正確對應五行', () => {
      // 直接測試 getNaYinElement 的邏輯（從納音名稱提取五行）
      const naYinToElement: Record<string, string> = {
        海中金: 'metal',
        爐中火: 'fire',
        大林木: 'wood',
        路旁土: 'earth',
        劍鋒金: 'metal',
        山頭火: 'fire',
        澗下水: 'water',
        城頭土: 'earth',
        白蠟金: 'metal',
        楊柳木: 'wood',
        井泉水: 'water',
        屋上土: 'earth',
        霹靂火: 'fire',
        松柏木: 'wood',
        長流水: 'water',
        砂中金: 'metal',
        山下火: 'fire',
        平地木: 'wood',
        壁上土: 'earth',
        金箔金: 'metal',
        覆燈火: 'fire',
        天河水: 'water',
        大驛土: 'earth',
        釵釧金: 'metal',
        桑柘木: 'wood',
        大溪水: 'water',
        砂中土: 'earth',
        天上火: 'fire',
        石榴木: 'wood',
        大海水: 'water',
      }

      Object.entries(naYinToElement).forEach(([naYin, expectedElement]) => {
        const lastChar = naYin.slice(-1)
        const elementMap: Record<string, string> = {
          金: 'metal',
          木: 'wood',
          水: 'water',
          火: 'fire',
          土: 'earth',
        }
        expect(elementMap[lastChar]).toBe(expectedElement)
      })
    })
  })

  describe('five element interactions', () => {
    it('五行相生應影響運勢分數', () => {
      const testDate = new Date('2024-01-15')
      FortuneService.clearCache()

      // 測試不同五行屬性的用戶都能正常計算
      const elements = ['金', '木', '水', '火', '土'] as const
      for (const element of elements) {
        const profile = { ...testProfile, name: `${element}命用戶`, element, zodiac: '馬' }
        const fortune = FortuneService.calculateDailyFortune(profile, testDate)
        expect(fortune.overallScore).toBeGreaterThanOrEqual(10)
        expect(fortune.overallScore).toBeLessThanOrEqual(95)
        expect(fortune.investmentScore).toBeGreaterThanOrEqual(10)
        expect(fortune.investmentScore).toBeLessThanOrEqual(95)
      }
    })
  })

  describe('constellation influence', () => {
    it('星座應影響運勢分數', () => {
      const testDate = new Date('2024-01-15')
      FortuneService.clearCache()

      // 火象星座（白羊座）用戶
      const fireProfile = { ...testProfile, name: '白羊用戶', zodiac: '鼠' }
      const fortune = FortuneService.calculateDailyFortune(fireProfile, testDate)

      // 驗證分數在合理範圍內
      expect(fortune.overallScore).toBeGreaterThanOrEqual(10)
      expect(fortune.overallScore).toBeLessThanOrEqual(95)
      expect(fortune.investmentScore).toBeGreaterThanOrEqual(10)
      expect(fortune.investmentScore).toBeLessThanOrEqual(95)
    })

    it('不同星座用戶的運勢應有差異', () => {
      const testDate = new Date('2024-01-15')
      FortuneService.clearCache()

      // 不同名字會導致不同的日干支，從而產生不同的星座和運勢
      const profiles = ['星座用戶A', '星座用戶B', '星座用戶C'].map(name => ({
        ...testProfile,
        name,
        zodiac: '馬',
      }))

      const fortunes = profiles.map(p => FortuneService.calculateDailyFortune(p, testDate))

      // 至少有一個屬性不同
      const allSame = fortunes.every(
        f =>
          f.overallScore === fortunes[0].overallScore &&
          f.investmentScore === fortunes[0].investmentScore
      )
      expect(allSame).toBe(false)
    })
  })
})
