import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDashboardStore } from '@/stores/dashboard'

vi.mock('@/services/lunar', () => ({
  lunarService: {
    getLunarData: vi.fn(() => ({
      lunarYear: '2024',
      lunarMonth: '十二月',
      lunarDay: '初五',
      ganZhi: '甲子月 甲子日',
      monthGanZhi: '甲子',
      dayGanZhi: '甲子',
      zodiac: '鼠',
      constellation: '摩羯座',
      naYin: '海中金',
      jieQi: '',
      festivals: [],
      yi: ['開市', '交易'],
      ji: ['搬家', '出行'],
      direction: { auspicious: '正東' },
    })),
    getInvestmentAdvice: vi.fn(() => ({
      luckyScore: 75,
      advice: '今日運勢不錯',
      luckyTime: ['09:00-11:00'],
      avoidTime: ['13:00-15:00'],
    })),
    clearCache: vi.fn(),
  },
}))

vi.mock('@/services/integratedFortune', () => ({
  IntegratedFortuneService: {
    calculateIntegratedFortune: vi.fn(() =>
      Promise.resolve({
        overallScore: 80,
        investmentScore: 75,
        recommendation: 'BUY' as const,
        advice: '適合投資',
        luckyTime: ['09:00-11:00'],
        avoidTime: ['13:00-15:00'],
        elements: { metal: 50, wood: 60, water: 40, fire: 30, earth: 45 },
        date: '2024-01-15',
      })
    ),
    clearCache: vi.fn(),
  },
}))

vi.mock('@/services/finmind', () => ({
  FinMindService: {
    checkAPIStatus: vi.fn(() => Promise.resolve(true)),
    getETFData: vi.fn(() =>
      Promise.resolve([
        {
          date: '2024-01-15',
          open: 132,
          high: 134,
          low: 131,
          close: 133.5,
          volume: 25000000,
          change: 1.5,
          changePercent: 1.13,
        },
        {
          date: '2024-01-16',
          open: 133.5,
          high: 135,
          low: 132.8,
          close: 134.2,
          volume: 28000000,
          change: 0.7,
          changePercent: 0.52,
        },
      ])
    ),
  },
}))

describe('useDashboardStore', () => {
  let store: ReturnType<typeof useDashboardStore>

  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    store = useDashboardStore()
  })

  describe('initial state', () => {
    it('所有資料初始為 null/空', () => {
      expect(store.lunarData).toBeNull()
      expect(store.investmentAdvice).toBeNull()
      expect(store.integratedFortune).toBeNull()
      expect(store.etfData).toEqual([])
      expect(store.loading).toBe(false)
      expect(store.lunarError).toBeNull()
      expect(store.fortuneError).toBeNull()
      expect(store.etfError).toBeNull()
    })

    it('currentDate 為有效 Date', () => {
      expect(store.currentDate).toBeInstanceOf(Date)
    })
  })

  describe('computed properties', () => {
    it('formattedCurrentDate 為字串', () => {
      expect(typeof store.formattedCurrentDate).toBe('string')
    })

    it('latestPrice 初始為 null', () => {
      expect(store.latestPrice).toBeNull()
    })

    it('priceChange 初始為 0', () => {
      expect(store.priceChange).toBe(0)
    })

    it('priceChangePercent 初始為 0', () => {
      expect(store.priceChangePercent).toBe(0)
    })

    it('unifiedInvestmentScore 初始為 50', () => {
      expect(store.unifiedInvestmentScore).toBe(50)
    })
  })

  describe('loadLunarData', () => {
    it('成功載入農民曆資料', async () => {
      await store.loadLunarData(new Date('2024-01-15'))
      expect(store.lunarData).not.toBeNull()
      expect(store.lunarData!.lunarDay).toBe('初五')
      expect(store.investmentAdvice).not.toBeNull()
      expect(store.lunarLoading).toBe(false)
    })

    it('載入後設 loading 為 false', async () => {
      await store.loadLunarData()
      expect(store.lunarLoading).toBe(false)
    })
  })

  describe('loadIntegratedFortune', () => {
    const userProfile = {
      name: '用戶',
      birthDate: '1990-01-01',
      birthTime: '10:30',
      zodiac: '鼠',
      element: '金',
      luckyColors: [],
      luckyNumbers: [],
    }

    it('缺少 userProfile 拋出錯誤', async () => {
      await expect(store.loadIntegratedFortune(null)).rejects.toThrow('使用者資料不存在')
    })

    it('缺少姓名拋出錯誤', async () => {
      await expect(
        store.loadIntegratedFortune({
          name: '',
          birthDate: '1990-01-01',
          birthTime: '10:30',
          zodiac: '鼠',
          element: '金',
          luckyColors: [],
          luckyNumbers: [],
        })
      ).rejects.toThrow('用戶資料不完整')
    })

    it('成功載入整合運勢', async () => {
      await store.loadIntegratedFortune(userProfile, new Date('2024-01-15'))
      expect(store.integratedFortune).not.toBeNull()
      expect(store.integratedFortune!.investmentScore).toBe(75)
      expect(store.fortuneLoading).toBe(false)
    })
  })

  describe('loadETFData', () => {
    it('成功載入 ETF 資料', async () => {
      await store.loadETFData()
      expect(store.etfData.length).toBeGreaterThan(0)
      expect(store.etfLoading).toBe(false)
    })

    it('載入後 recompute computed', async () => {
      await store.loadETFData()
      expect(store.latestPrice).not.toBeNull()
      expect(store.latestPrice!.close).toBe(134.2)
    })
  })

  describe('loadAllData', () => {
    it('並行載入所有資料', async () => {
      const userProfile = {
        name: '用戶',
        birthDate: '1990-01-01',
        birthTime: '10:30',
        zodiac: '鼠',
        element: '金',
        luckyColors: [],
        luckyNumbers: [],
      }
      await store.loadAllData(userProfile, new Date('2024-01-15'))
      expect(store.lunarData).not.toBeNull()
      expect(store.integratedFortune).not.toBeNull()
      expect(store.etfData.length).toBeGreaterThan(0)
      expect(store.loading).toBe(false)
    })

    it('不傳 userProfile 時不載入運勢', async () => {
      await store.loadAllData(null)
      expect(store.lunarData).not.toBeNull()
      expect(store.integratedFortune).toBeNull()
    })
  })

  describe('clearAllData', () => {
    it('清除所有資料和錯誤', async () => {
      await store.loadAllData(null, new Date('2024-01-15'))
      store.clearAllData()
      expect(store.lunarData).toBeNull()
      expect(store.etfData).toEqual([])
      expect(store.lunarError).toBeNull()
    })
  })

  describe('setETFData', () => {
    it('直接設定 ETF 資料', () => {
      store.setETFData([
        {
          date: '2024-01-15',
          open: 132,
          high: 134,
          low: 131,
          close: 133,
          volume: 1000,
          change: 0,
          changePercent: 0,
        },
      ])
      expect(store.etfData).toHaveLength(1)
    })
  })
})
