import { afterEach, describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDashboardStore } from '@/stores/dashboard'
import { FinMindService } from '@/services/finmind'
import { IntegratedFortuneService } from '@/services/integratedFortune'
import { lunarService } from '@/services/lunar'

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
    checkAPIStatus: vi.fn(),
    getMarketHistory: vi.fn(),
  },
}))

const getMarketHistory = vi.mocked(FinMindService.getMarketHistory)

async function mockHistory(startDate: string, endDate: string) {
  return {
    range: { startDate, endDate },
    bars: [
      {
        date: startDate,
        open: 132,
        high: 134,
        low: 131,
        close: 133.5,
        volume: 25000000,
        change: 1.5,
        changePercent: 1.13,
      },
      {
        date: endDate,
        open: 133.5,
        high: 135,
        low: 132.8,
        close: 134.2,
        volume: 28000000,
        change: 0.7,
        changePercent: 0.52,
      },
    ],
    provenance: { source: 'FinMind' as const, asOf: endDate, fetchedAt: new Date().toISOString() },
  }
}

describe('useDashboardStore', () => {
  let store: ReturnType<typeof useDashboardStore>

  beforeEach(() => {
    vi.clearAllMocks()
    getMarketHistory.mockReset().mockImplementation(mockHistory)
    setActivePinia(createPinia())
    store = useDashboardStore()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
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
      nameElement: '金',
      nameStrokes: 20,
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
          nameElement: '金',
          nameStrokes: 20,
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
        nameElement: '金',
        nameStrokes: 20,
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

  describe('行情來源與快取', () => {
    it('來源失敗且沒有相同範圍的快取時清除行情', async () => {
      await store.loadETFRange('2024-01-01', '2024-01-31')
      expect(store.etfStatus).toBe('current')
      expect(store.etfProvenance?.asOf).toBe('2024-01-31')

      getMarketHistory.mockRejectedValue(new Error('Network error'))
      await store.loadETFRange('2025-01-01', '2025-06-01')
      expect(store.etfStatus).toBe('unavailable')
      expect(store.etfProvenance).toBeNull()
      expect(store.latestPrice).toBeNull()
      expect(store.etfData).toEqual([])
      expect(store.etfError).toMatch(/無法取得/)
    })

    it('同區間更新失敗時保留原始擷取時間，恢復後更新', async () => {
      const startDate = '2025-10-01'
      const endDate = '2025-10-31'
      vi.setSystemTime(new Date('2025-11-01T05:30:00Z'))
      await store.loadETFRange(startDate, endDate)
      const provenance = store.etfProvenance

      vi.setSystemTime(new Date('2025-11-01T06:30:00Z'))
      getMarketHistory.mockRejectedValueOnce(new Error('Network error'))
      await store.retryETFData()
      expect(store.etfStatus).toBe('cached')
      expect(store.etfProvenance).toEqual(provenance)
      expect(store.etfData).toHaveLength(2)

      await store.retryETFData()
      expect(store.etfStatus).toBe('current')
      expect(store.etfProvenance?.fetchedAt).toBe('2025-11-01T06:30:00.000Z')
      expect(getMarketHistory).toHaveBeenLastCalledWith(startDate, endDate)
    })

    it('離線時只使用同一個滾動期間的快取，排除滑出區間的日 K', async () => {
      const cachedStart = '2026-07-01'
      const cachedEnd = '2026-07-31'
      await store.loadETFRange(cachedStart, cachedEnd, false, 30)
      vi.stubGlobal('navigator', { onLine: false })
      getMarketHistory.mockClear()

      await store.loadETFRange('2026-07-02', '2026-08-01', false, 30)
      expect(store.etfStatus).toBe('cached')
      expect(store.etfProvenance?.asOf).toBe(cachedEnd)
      expect(store.etfData.map(bar => bar.date)).toEqual([cachedEnd])

      await store.loadETFRange('2026-05-03', '2026-08-01', false, 90)
      expect(store.etfStatus).toBe('unavailable')
      expect(store.etfError).toMatch(/離線/)
      expect(store.etfData).toEqual([])
      expect(getMarketHistory).not.toHaveBeenCalled()
    })

    it('能從 localStorage 讀取已驗證快取並拒絕損毀資料', async () => {
      vi.stubGlobal('navigator', { onLine: false })
      const startDate = '2025-08-01'
      const endDate = '2025-08-31'
      const key = `lucky50-finmind-0050-v1:${startDate}/${endDate}`
      const saved = await mockHistory(startDate, endDate)
      localStorage.setItem(key, JSON.stringify(saved))
      await store.loadETFRange(startDate, endDate)
      expect(store.etfStatus).toBe('cached')
      expect(store.etfProvenance).toEqual(saved.provenance)

      saved.bars[0].open = 0
      localStorage.setItem(key, JSON.stringify(saved))
      await store.loadETFRange(startDate, endDate)
      expect(store.etfStatus).toBe('unavailable')
      expect(store.etfData).toEqual([])
      localStorage.removeItem(key)
    })

    it('較早送出的不同區間回應無法覆蓋新區間', async () => {
      const historical = await mockHistory('2025-04-01', '2025-04-30')
      let complete!: (value: typeof historical) => void
      getMarketHistory.mockReturnValueOnce(
        new Promise(resolve => {
          complete = resolve
        })
      )
      const initial = store.loadETFRange('2025-04-01', '2025-04-30')
      await vi.waitFor(() =>
        expect(getMarketHistory).toHaveBeenCalledWith('2025-04-01', '2025-04-30')
      )
      await store.loadETFRange('2025-06-01', '2025-06-30')
      expect(store.latestPrice?.date).toBe('2025-06-30')
      complete(historical)
      await initial
      expect(store.latestPrice?.date).toBe('2025-06-30')
    })
  })

  describe('Pinia Colada 快取', () => {
    const profile = {
      name: '用戶',
      birthDate: '1990-01-01',
      birthTime: '10:30',
      zodiac: '鼠',
      element: '金',
      nameElement: '金',
      nameStrokes: 20,
      luckyColors: [],
      luckyNumbers: [],
    }

    it('staleTime 內重複載入 ETF 只打一次 API', async () => {
      await store.loadETFData()
      await store.loadETFData()
      expect(getMarketHistory).toHaveBeenCalledTimes(1)
    })

    it('並發載入同一範圍會去重', async () => {
      await Promise.all([store.loadETFData(), store.loadETFData(), store.loadETFData()])
      expect(getMarketHistory).toHaveBeenCalledTimes(1)
    })

    it('force 重新整理會略過快取', async () => {
      await store.loadETFData()
      await store.retryETFData()
      expect(getMarketHistory).toHaveBeenCalledTimes(2)
    })

    it('不再額外呼叫 checkAPIStatus 探測請求', async () => {
      await store.loadETFData()
      expect(FinMindService.checkAPIStatus).not.toHaveBeenCalled()
    })

    it('同一天農民曆只計算一次', async () => {
      const date = new Date('2024-01-15')
      await store.loadLunarData(date)
      await store.loadLunarData(new Date('2024-01-15T18:00:00'))
      expect(lunarService.getLunarData).toHaveBeenCalledTimes(1)
    })

    it('個人資料變動產生不同查詢鍵', async () => {
      const date = new Date('2024-01-15')
      await store.loadIntegratedFortune(profile, date)
      await store.loadIntegratedFortune(profile, date)
      expect(IntegratedFortuneService.calculateIntegratedFortune).toHaveBeenCalledTimes(1)
      await store.loadIntegratedFortune({ ...profile, birthTime: '11:30' }, date)
      expect(IntegratedFortuneService.calculateIntegratedFortune).toHaveBeenCalledTimes(2)
    })

    it('引擎設定變更後查詢鍵改變，自動重新計算', async () => {
      const date = new Date('2024-01-15')
      await store.loadIntegratedFortune(profile, date)
      localStorage.setItem(
        'lucky50-engine-settings',
        JSON.stringify({ classic: { enabled: false, weight: 0 } })
      )
      await store.loadIntegratedFortune(profile, date)
      expect(IntegratedFortuneService.calculateIntegratedFortune).toHaveBeenCalledTimes(2)
      localStorage.removeItem('lucky50-engine-settings')
    })

    it('loadETFRange 載入指定範圍', async () => {
      await store.loadETFRange('2024-01-01', '2024-01-31')
      expect(getMarketHistory).toHaveBeenCalledWith('2024-01-01', '2024-01-31')
      expect(store.etfData).toHaveLength(2)
    })
  })
})
