import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAnalyticsStore } from '@/stores/analytics'
import type { ETFData } from '@/types'

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
    setActivePinia(createPinia())
    store = useAnalyticsStore()
  })

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

  describe('calculateStatistics', () => {
    it('空資料回傳預設值', () => {
      const stats = store.calculateStatistics([])
      expect(stats.annualReturn).toBe(0)
      expect(stats.volatility).toBe(0)
      expect(stats.sharpeRatio).toBe(0)
      expect(stats.maxDrawdown).toBe(0)
    })

    it('計算年化報酬率', () => {
      const stats = store.calculateStatistics(mockETFData)
      expect(stats.annualReturn).toBeGreaterThan(0)
      expect(stats.volatility).toBeGreaterThan(0)
    })

    it('最大回撤不為負', () => {
      const stats = store.calculateStatistics(mockETFData)
      expect(stats.maxDrawdown).toBeGreaterThanOrEqual(0)
    })
  })

  describe('calculateFortuneDistribution', () => {
    it('空資料回傳預設分佈', () => {
      const dist = store.calculateFortuneDistribution([])
      expect(dist.excellent).toBe(25)
      expect(dist.good).toBe(35)
      expect(dist.average).toBe(30)
      expect(dist.poor).toBe(10)
    })

    it('計算分佈百分比加總約 100', () => {
      const dist = store.calculateFortuneDistribution(mockETFData)
      const total = dist.excellent + dist.good + dist.average + dist.poor
      expect(total).toBeGreaterThanOrEqual(90)
      expect(total).toBeLessThanOrEqual(110)
    })
  })

  describe('calculateTechnicalIndicators', () => {
    it('空資料回傳預設值', () => {
      const ind = store.calculateTechnicalIndicators([])
      expect(ind.rsi).toBe(50)
      expect(ind.macd).toBe(0)
      expect(ind.bollingerBand).toBe('中軌')
    })

    it('資料不足 14 筆時回傳預設值', () => {
      const ind = store.calculateTechnicalIndicators(mockETFData)
      expect(ind.rsi).toBe(50)
      expect(ind.macd).toBe(0)
    })
  })

  describe('calculateBacktestResults', () => {
    it('使用快取回傳相同結果', () => {
      const stats = store.calculateStatistics(mockETFData)
      const r1 = store.calculateBacktestResults(stats, mockETFData)
      const r2 = store.calculateBacktestResults(stats, mockETFData)
      expect(r1).toEqual(r2)
    })

    it('空的 ETF 資料回傳預設 backtest 結果', () => {
      const stats = store.calculateStatistics([])
      const results = store.calculateBacktestResults(stats, [])
      expect(results.lunar.totalReturn).toBe(15.8)
      expect(results.buyHold.totalReturn).toBe(12.5)
      expect(results.dca.totalReturn).toBe(11.2)
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

  describe('clearBacktestCache', () => {
    it('清除所有快取', () => {
      const stats = store.calculateStatistics(mockETFData)
      store.calculateBacktestResults(stats, mockETFData)
      store.clearBacktestCache()
    })
  })
})
