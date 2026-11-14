import { describe, it, expect, beforeEach, vi } from 'vitest'
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
