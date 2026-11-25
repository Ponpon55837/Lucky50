import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAnalyticsStore } from '@/stores/analytics'
import type { ETFData } from '@/types'
import { KNOWN_SPLITS } from '@/utils/priceAdjust'
import { ETF_0050_BARS } from './fixtures/etf0050'

const { getMarketHistory, getPriceAdjustments } = vi.hoisted(() => ({
  getMarketHistory: vi.fn(),
  getPriceAdjustments: vi.fn(),
}))
vi.mock('@/services/finmind', () => ({
  FinMindService: { getMarketHistory, getPriceAdjustments },
}))

function mockTechnicalBars(bars: ETFData[]) {
  getMarketHistory.mockImplementation(async (startDate: string, endDate: string) => ({
    bars,
    range: { startDate, endDate },
    provenance: {
      source: 'FinMind',
      asOf: bars[bars.length - 1].date,
      fetchedAt: new Date().toISOString(),
    },
  }))
}

const mockETFData: ETFData[] = [
  {
    date: '2025-06-01',
    open: 130,
    high: 132,
    low: 129,
    close: 131,
    volume: 1000000,
    change: 1,
    changePercent: 0.77,
  },
  {
    date: '2025-06-02',
    open: 131,
    high: 133,
    low: 130,
    close: 132,
    volume: 1100000,
    change: 1,
    changePercent: 0.76,
  },
  {
    date: '2025-06-03',
    open: 132,
    high: 134,
    low: 131,
    close: 133,
    volume: 900000,
    change: 1,
    changePercent: 0.76,
  },
  {
    date: '2025-06-04',
    open: 133,
    high: 135,
    low: 132,
    close: 134,
    volume: 1200000,
    change: 1,
    changePercent: 0.75,
  },
  {
    date: '2025-06-05',
    open: 134,
    high: 136,
    low: 133,
    close: 135,
    volume: 1300000,
    change: 1,
    changePercent: 0.75,
  },
]

describe('useAnalyticsStore', () => {
  let store: ReturnType<typeof useAnalyticsStore>

  beforeEach(() => {
    vi.resetAllMocks()
    setActivePinia(createPinia())
    store = useAnalyticsStore()
  })

  afterEach(() => vi.useRealTimers())

  describe('getPeriodDays', () => {
    it('回傳對應天數', () => {
      expect(store.getPeriodDays('1個月')).toBe(30)
      expect(store.getPeriodDays('3個月')).toBe(90)
      expect(store.getPeriodDays('6個月')).toBe(180)
      expect(store.getPeriodDays('1年')).toBe(365)
      expect(store.getPeriodDays('3年')).toBe(1095)
      expect(store.getPeriodDays('5年')).toBe(1825)
    })

    it('未知期間回傳預設 30 天', () => {
      expect(store.getPeriodDays('未知')).toBe(30)
    })
  })

  describe('getAdjustedEtfData', () => {
    it('空陣列回傳空陣列', () => {
      expect(store.getAdjustedEtfData([])).toEqual([])
    })

    it('2025/6/18 前的資料進行 1拆4 調整', () => {
      const data: ETFData[] = [
        {
          date: '2025-06-17',
          open: 400,
          high: 410,
          low: 395,
          close: 405,
          volume: 1000000,
          change: 5,
          changePercent: 1.25,
        },
        {
          date: '2025-06-19',
          open: 105,
          high: 108,
          low: 103,
          close: 107,
          volume: 3000000,
          change: 2,
          changePercent: 1.9,
        },
      ]
      const adjusted = store.getAdjustedEtfData(data)
      expect(adjusted[0].close).toBe(405 / 4)
      expect(adjusted[0].volume).toBe(1000000 * 4)
      expect(adjusted[1].close).toBe(107)
      expect(adjusted[1].volume).toBe(3000000)
    })

    it('排序後再回傳', () => {
      const data: ETFData[] = [
        {
          date: '2025-06-03',
          open: 133,
          high: 134,
          low: 131,
          close: 133,
          volume: 900000,
          change: 0,
          changePercent: 0,
        },
        {
          date: '2025-06-01',
          open: 130,
          high: 132,
          low: 129,
          close: 131,
          volume: 1000000,
          change: 0,
          changePercent: 0,
        },
      ]
      const adjusted = store.getAdjustedEtfData(data)
      expect(adjusted[0].date).toBe('2025-06-01')
      expect(adjusted[1].date).toBe('2025-06-03')
    })
  })

  describe('除息還原', () => {
    const bars: ETFData[] = [
      { ...mockETFData[0], date: '2026-07-20', close: 100 },
      { ...mockETFData[1], date: '2026-07-21', close: 98 },
    ]

    it('載入前只還原分割，dividendAdjusted 為 false', () => {
      expect(store.dividendAdjusted).toBe(false)
      expect(store.getAdjustedEtfData(bars)[0].close).toBe(100)
    })

    it('載入除權息資料後套用除息係數，同一份資料的快取跟著失效', async () => {
      store.getAdjustedEtfData(bars)
      getPriceAdjustments.mockResolvedValue([
        ...KNOWN_SPLITS,
        { date: '2026-07-21', kind: 'dividend', factor: 0.98 },
      ])

      await store.loadPriceAdjustments()

      expect(store.dividendAdjusted).toBe(true)
      const adjusted = store.getAdjustedEtfData(bars)
      expect(adjusted[0].close).toBeCloseTo(98)
      expect(adjusted[1].close).toBe(98)
    })

    it('強制載入可刷新相同筆數的除息資料，策略快取也會跟著失效', async () => {
      getPriceAdjustments
        .mockResolvedValueOnce([{ date: '2026-07-21', kind: 'dividend', factor: 0.98 }])
        .mockResolvedValueOnce([{ date: '2026-07-21', kind: 'dividend', factor: 0.95 }])
      const score = () => 80

      await store.loadPriceAdjustments()
      const first = await store.analyzeStrategies(bars, score, 'same')
      await store.loadPriceAdjustments(true)
      const revised = await store.analyzeStrategies(bars, score, 'same')

      expect(store.getAdjustedEtfData(bars)[0].close).toBe(95)
      expect(revised.backtest?.buyHold.totalReturn).not.toBe(first.backtest?.buyHold.totalReturn)
    })

    it('事件前收與實際日 K 不一致時暫停已還原行情和回測', async () => {
      store.adjustments = [{ date: '2026-07-21', kind: 'dividend', factor: 0.98, beforePrice: 105 }]

      expect(store.getPriceAdjustmentChecks(bars)).toMatchObject([
        { date: '2026-07-21', status: 'mismatch', previousClose: 100, beforePrice: 105 },
      ])
      expect(store.getAdjustedEtfData(bars)).toEqual([])
      const { backtest } = await store.analyzeStrategies(bars, () => 80, 'same')
      expect(backtest).toBeNull()
    })

    it('重新取得除息資料失敗時標出既有係數的擷取時間', async () => {
      getPriceAdjustments.mockResolvedValueOnce([
        { date: '2026-07-21', kind: 'dividend', factor: 0.98 },
      ])
      await store.loadPriceAdjustments()
      getPriceAdjustments.mockRejectedValueOnce(new Error('Network error'))
      await store.loadPriceAdjustments(true)
      expect(store.adjustmentState).toBe('cached')
      expect(store.adjustmentLabel).toContain('更新失敗')
      expect(store.getAdjustedEtfData(bars)[0].close).toBe(98)
    })

    it('除權息資料抓不到時維持只還原分割並標示', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      getPriceAdjustments.mockRejectedValue(new Error('Network error'))

      await store.loadPriceAdjustments()

      expect(store.dividendAdjusted).toBe(false)
      expect(store.adjustments).toEqual(KNOWN_SPLITS)
    })
  })

  describe('technicalSnapshot', () => {
    it('尚未載入時各值為 null', () => {
      expect(store.technicalState).toBe('idle')
      expect(store.technicalSnapshot.date).toBeNull()
      expect(store.technicalSnapshot.kd.k).toBeNull()
    })

    it('事件前收不一致時保留待查資訊，暫停顯示技術指標', async () => {
      store.adjustments = [{ date: '2026-07-21', kind: 'dividend', factor: 0.98, beforePrice: 100 }]
      mockTechnicalBars(ETF_0050_BARS)

      await store.loadTechnicalBars()

      expect(store.technicalAdjustmentChecks).toMatchObject([
        { date: '2026-07-21', status: 'mismatch', previousClose: 99.2, beforePrice: 100 },
      ])
      expect(store.technicalSnapshot.close).toBeNull()
    })

    it('行情從事件當天開始時標示未核對，仍以現有日 K 計算指標', async () => {
      store.adjustments = [
        { date: '2026-07-21', kind: 'dividend', factor: 98.6 / 99.2, beforePrice: 99.2 },
      ]
      mockTechnicalBars(ETF_0050_BARS.filter(bar => bar.date >= '2026-07-21'))

      await store.loadTechnicalBars()

      expect(store.technicalAdjustmentChecks).toEqual([
        { date: '2026-07-21', kind: 'dividend', status: 'unverified' },
      ])
      expect(store.technicalSnapshot.close).toBe(102.5)
    })

    it('載入成功後以還原後的日 K 計算', async () => {
      mockTechnicalBars(ETF_0050_BARS)

      await store.loadTechnicalBars()

      expect(store.technicalState).toBe('ready')
      expect(store.technicalSnapshot.date).toBe('2026-11-13')
      expect(store.technicalSnapshot.kd.k).toBeCloseTo(71.1, 1)
      // 固定抓 800 天，不跟著分析區間走
      const [startDate, endDate] = getMarketHistory.mock.calls[0]
      expect((Date.parse(endDate) - Date.parse(startDate)) / 86_400_000).toBe(800)
    })

    it('行情抓不到時標記 failed，不產生假數值', async () => {
      vi.setSystemTime(new Date('2020-01-02T04:00:00Z'))
      vi.spyOn(console, 'error').mockImplementation(() => {})
      getMarketHistory.mockRejectedValue(new Error('Network error'))

      await store.loadTechnicalBars()

      expect(store.technicalState).toBe('failed')
      expect(store.technicalSnapshot.close).toBeNull()
    })
  })

  describe('analyzeStrategies', () => {
    const always = (score: number) => () => score

    it('空資料時回測為 null、各區間沒有樣本', async () => {
      const { backtest, correlation } = await store.analyzeStrategies([], always(80), 'day')
      expect(backtest).toBeNull()
      expect(correlation.high).toEqual({ days: 0, share: 0, averageReturn: null, upRate: null })
    })

    it('分數全數達標時，農民曆策略等同買入持有', async () => {
      const { backtest } = await store.analyzeStrategies(mockETFData, always(80), 'all-in')
      expect(backtest!.lunar).toEqual(backtest!.buyHold)
    })

    it('分數全數未達標時空手，報酬為 0', async () => {
      const { backtest } = await store.analyzeStrategies(mockETFData, always(10), 'all-out')
      expect(backtest!.lunar).toMatchObject({ totalReturn: 0, maxDrawdown: 0, trades: 0 })
    })

    it('相同資料與評分依據只計算一次，計算途中的重複要求也共用', async () => {
      const scoreOf = vi.fn(() => 80)
      const [first, concurrent] = await Promise.all([
        store.analyzeStrategies(mockETFData, scoreOf, 'same'),
        store.analyzeStrategies(mockETFData, scoreOf, 'same'),
      ])
      expect(concurrent).toBe(first)
      expect(await store.analyzeStrategies(mockETFData, scoreOf, 'same')).toBe(first)
      expect(scoreOf).toHaveBeenCalledTimes(mockETFData.length)
    })

    it('日期和收盤價未改但中間開盤價修訂時重新計算', async () => {
      const data = mockETFData.map(row => ({ ...row }))
      const scoreOf = (date: string) => (date === data[2].date ? 80 : 10)
      const first = await store.analyzeStrategies(data, scoreOf, 'same')
      data[2].open = 130
      const revised = await store.analyzeStrategies(data, scoreOf, 'same')

      expect(revised.backtest?.buyHold).toEqual(first.backtest?.buyHold)
      expect(revised.backtest?.lunar.totalReturn).toBeGreaterThan(first.backtest!.lunar.totalReturn)
    })

    it('相同行情與訊號套用不同交易成本時重新計算', async () => {
      const first = await store.analyzeStrategies(mockETFData, always(80), 'same')
      const revised = await store.analyzeStrategies(mockETFData, always(80), 'same', {
        commissionBps: 0,
      })

      expect(revised.backtest?.buyHold.totalReturn).toBeGreaterThan(
        first.backtest!.buyHold.totalReturn
      )
      expect(revised.backtest?.buyHold.grossTotalReturn).toBe(
        first.backtest?.buyHold.grossTotalReturn
      )
    })

    it('評分依據改變或清除快取後重新計算', async () => {
      const first = await store.analyzeStrategies(mockETFData, always(80), 'a')
      expect(await store.analyzeStrategies(mockETFData, always(10), 'b')).not.toBe(first)
      const second = await store.analyzeStrategies(mockETFData, always(80), 'a')
      store.clearStrategyCache()
      expect(await store.analyzeStrategies(mockETFData, always(80), 'a')).not.toBe(second)
    })

    it('評分失敗時不留快取，下次重新計算', async () => {
      const failing = () => {
        throw new Error('評分失敗')
      }
      await expect(store.analyzeStrategies(mockETFData, failing, 'broken')).rejects.toThrow()
      const { backtest } = await store.analyzeStrategies(mockETFData, always(80), 'broken')
      expect(backtest).not.toBeNull()
    })
  })

  describe('selectedPeriod', () => {
    it('預設為 1個月', () => {
      expect(store.selectedPeriod).toBe('1個月')
    })

    it('setSelectedPeriod 更新期間', () => {
      store.setSelectedPeriod('1年')
      expect(store.selectedPeriod).toBe('1年')
    })
  })
})
