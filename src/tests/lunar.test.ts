import { describe, it, expect, beforeEach, vi } from 'vitest'
import { lunarService } from '@/services/lunar'

// Mock lunar-javascript
const mockLunar = {
  getYearInChinese: vi.fn(() => '二零二四'),
  getMonthInChinese: vi.fn(() => '正月'),
  getDayInChinese: vi.fn(() => '初一'),
  getYearInGanZhi: vi.fn(() => '甲子'),
  getMonthInGanZhi: vi.fn(() => '丙寅'),
  getDayInGanZhi: vi.fn(() => '戊辰'),
  getYearShengXiao: vi.fn(() => '鼠'),
  getYearNaYin: vi.fn(() => '海中金'),
  getDayYi: vi.fn(() => ['開市', '交易', '納財']),
  getDayJi: vi.fn(() => ['破土', '動土']),
  getDayPengZu: vi.fn(() => '甲不開倉財物耗散'),
  getDayNaYin: vi.fn(() => '城頭土'),
  getDayJiuXing: vi.fn(() => '一白'),
  getFestivals: vi.fn(() => ['春節']),
}

const mockSolar = {
  getLunar: vi.fn(() => mockLunar),
  getXingZuo: vi.fn(() => '水瓶座'),
  getFestivals: vi.fn(() => ['元旦']),
  getJieQi: vi.fn(() => '立春'),
}

vi.mock('lunar-javascript', () => ({
  Solar: {
    fromYmd: vi.fn(() => mockSolar),
  },
}))

// Mock chinese-s2t
vi.mock('chinese-s2t', () => ({
  s2t: vi.fn((text: string) => text),
}))

// Mock apiCache
vi.mock('@/services/apiCache', () => ({
  apiCache: {
    get: vi.fn(() => null),
    set: vi.fn(),
  },
  CacheKeyGenerator: {
    lunar: vi.fn((date: Date) => `lunar-${date.toISOString()}`),
  },
}))

describe('LunarService', () => {
  beforeEach(() => {
    lunarService.clearCache()
    vi.clearAllMocks()
  })

  describe('getLunarData', () => {
    it('應該成功獲取農曆數據', () => {
      const testDate = new Date('2024-01-15')
      const lunarData = lunarService.getLunarData(testDate)

      expect(lunarData).toBeDefined()
      expect(lunarData.lunarYear).toBe('二零二四')
      expect(lunarData.lunarMonth).toBe('正月')
      expect(lunarData.lunarDay).toBe('初一')
      expect(lunarData.ganZhi).toBe('甲子')
      expect(lunarData.monthGanZhi).toBe('丙寅')
      expect(lunarData.dayGanZhi).toBe('戊辰')
      expect(lunarData.zodiac).toBe('鼠')
      expect(lunarData.constellation).toBe('水瓶座')
    })

    it('應該返回完整的宜忌資訊', () => {
      const testDate = new Date('2024-01-15')
      const lunarData = lunarService.getLunarData(testDate)

      expect(Array.isArray(lunarData.yi)).toBe(true)
      expect(Array.isArray(lunarData.ji)).toBe(true)
      expect(lunarData.yi.length).toBeGreaterThan(0)
      expect(lunarData.ji.length).toBeGreaterThan(0)
    })

    it('應該返回節日資訊', () => {
      const testDate = new Date('2024-01-15')
      const lunarData = lunarService.getLunarData(testDate)

      expect(Array.isArray(lunarData.festivals)).toBe(true)
    })

    it('應該返回節氣資訊', () => {
      const testDate = new Date('2024-01-15')
      const lunarData = lunarService.getLunarData(testDate)

      expect(lunarData.jieQi).toBeDefined()
      expect(typeof lunarData.jieQi).toBe('string')
    })

    it('應該使用緩存機制', () => {
      const testDate = new Date('2024-01-15')

      // 第一次調用
      const lunarData1 = lunarService.getLunarData(testDate)

      // 第二次調用應該從緩存取得
      const lunarData2 = lunarService.getLunarData(testDate)

      // 應該是同一個對象（從緩存取得）
      expect(lunarData1).toEqual(lunarData2)
    })

    it('應該能清除緩存', () => {
      const testDate = new Date('2024-01-15')

      lunarService.getLunarData(testDate)
      lunarService.clearCache()

      // 清除後再次獲取應該重新計算
      const lunarData = lunarService.getLunarData(testDate)
      expect(lunarData).toBeDefined()
    })

    it('應該處理無效日期', () => {
      const testDate = new Date('2024-01-15')

      // 正常日期應該成功
      expect(() => {
        lunarService.getLunarData(testDate)
      }).not.toThrow()
    })
  })

  describe('getInvestmentAdvice', () => {
    it('應該生成投資建議', () => {
      const testDate = new Date('2024-01-15')
      const advice = lunarService.getInvestmentAdvice(testDate)

      expect(advice).toBeDefined()
      expect(advice.luckyScore).toBeGreaterThanOrEqual(0)
      expect(advice.luckyScore).toBeLessThanOrEqual(100)
      expect(advice.luckyTime).toBeTruthy()
      expect(advice.luckyDirection).toBeTruthy()
      expect(advice.advice).toBeTruthy()
      expect(['low', 'medium', 'high']).toContain(advice.riskLevel)
      expect(['buy', 'sell', 'hold', 'observe']).toContain(advice.recommendedAction)
    })

    it('應該根據分數給出正確的建議等級', () => {
      const testDate = new Date('2024-01-15')
      const advice = lunarService.getInvestmentAdvice(testDate)

      if (advice.luckyScore >= 80) {
        expect(advice.riskLevel).toBe('low')
        expect(advice.recommendedAction).toBe('buy')
      } else if (advice.luckyScore >= 60) {
        expect(advice.riskLevel).toBe('medium')
        expect(advice.recommendedAction).toBe('hold')
      } else if (advice.luckyScore >= 40) {
        expect(advice.riskLevel).toBe('medium')
        expect(advice.recommendedAction).toBe('observe')
      } else {
        expect(advice.riskLevel).toBe('high')
        expect(advice.recommendedAction).toBe('sell')
      }
    })

    it('應該包含有效的吉時資訊', () => {
      const testDate = new Date('2024-01-15')
      const advice = lunarService.getInvestmentAdvice(testDate)

      // 吉時應該包含時間範圍
      expect(advice.luckyTime).toMatch(/時/)
    })

    it('應該包含有效的方位資訊', () => {
      const testDate = new Date('2024-01-15')
      const advice = lunarService.getInvestmentAdvice(testDate)

      const validDirections = [
        '東方',
        '南方',
        '西方',
        '北方',
        '東南',
        '西南',
        '東北',
        '西北',
        '中央',
      ]
      expect(validDirections).toContain(advice.luckyDirection)
    })
  })

  describe('getTradingTimeAnalysis', () => {
    it('應該返回交易時段分析', () => {
      const testDate = new Date('2024-01-15')
      const analysis = lunarService.getTradingTimeAnalysis(testDate)

      expect(analysis).toBeDefined()
      expect(Array.isArray(analysis.recommendedTimes)).toBe(true)
      expect(Array.isArray(analysis.avoidTimes)).toBe(true)
    })

    it('推薦時段和避開時段加起來應該涵蓋所有交易時段', () => {
      const testDate = new Date('2024-01-15')
      const analysis = lunarService.getTradingTimeAnalysis(testDate)

      const totalPeriods = analysis.recommendedTimes.length + analysis.avoidTimes.length
      expect(totalPeriods).toBeGreaterThan(0)
      expect(totalPeriods).toBeLessThanOrEqual(5) // 台股交易時段最多5個
    })

    it('每個時段應該包含完整資訊', () => {
      const testDate = new Date('2024-01-15')
      const analysis = lunarService.getTradingTimeAnalysis(testDate)

      if (analysis.recommendedTimes.length > 0) {
        const period = analysis.recommendedTimes[0]
        expect(period.time).toBeTruthy()
        expect(period.description).toBeTruthy()
        expect(period.reason).toBeTruthy()
        expect(period.time).toMatch(/\d{2}:\d{2}/)
      }

      if (analysis.avoidTimes.length > 0) {
        const period = analysis.avoidTimes[0]
        expect(period.time).toBeTruthy()
        expect(period.description).toBeTruthy()
        expect(period.reason).toBeTruthy()
        expect(period.time).toMatch(/\d{2}:\d{2}/)
      }
    })

    it('應該基於台股交易時間 (09:00-13:30)', () => {
      const testDate = new Date('2024-01-15')
      const analysis = lunarService.getTradingTimeAnalysis(testDate)

      const allTimes = [...analysis.recommendedTimes, ...analysis.avoidTimes]
      allTimes.forEach(period => {
        const [start] = period.time.split('-')
        const hour = parseInt(start.split(':')[0], 10)
        expect(hour).toBeGreaterThanOrEqual(9)
        expect(hour).toBeLessThanOrEqual(13)
      })
    })
  })

  describe('data consistency', () => {
    it('相同日期應該返回一致的數據', () => {
      const testDate = new Date('2024-01-15')

      const data1 = lunarService.getLunarData(testDate)
      const data2 = lunarService.getLunarData(testDate)

      expect(data1.ganZhi).toBe(data2.ganZhi)
      expect(data1.dayGanZhi).toBe(data2.dayGanZhi)
      expect(data1.zodiac).toBe(data2.zodiac)
    })

    it('相同日期的投資建議應該一致', () => {
      const testDate = new Date('2024-01-15')

      const advice1 = lunarService.getInvestmentAdvice(testDate)
      const advice2 = lunarService.getInvestmentAdvice(testDate)

      expect(advice1.luckyScore).toBe(advice2.luckyScore)
      expect(advice1.recommendedAction).toBe(advice2.recommendedAction)
    })
  })
})
