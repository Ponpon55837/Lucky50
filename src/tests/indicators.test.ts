import { describe, it, expect } from 'vitest'
import {
  isSortedByDate,
  dailyReturns,
  meanAndVariance,
  maxDrawdown,
  bucketReturns,
  rsi,
  ema,
  macd,
  bollingerPosition,
  stochasticKD,
} from '@/utils/indicators'
import type { ETFData } from '@/types'

const bar = (date: string, close: number, high = close, low = close): ETFData => ({
  date,
  open: close,
  high,
  low,
  close,
  volume: 1000,
  change: 0,
  changePercent: 0,
})

const day = (i: number) => `2024-01-${String(i + 1).padStart(2, '0')}`
const series = (closes: number[]) => closes.map((c, i) => bar(day(i), c, c + 1, c - 1))

// 暴力解：每個視窗重新掃描最高/最低，用來驗證單調佇列版本
function bruteForceKD(data: ETFData[], period = 9) {
  let k = 50
  let d = 50
  for (let i = period - 1; i < data.length; i++) {
    let hi = -Infinity
    let lo = Infinity
    for (let j = i - period + 1; j <= i; j++) {
      hi = Math.max(hi, data[j].high)
      lo = Math.min(lo, data[j].low)
    }
    const rsv = hi > lo ? ((data[i].close - lo) / (hi - lo)) * 100 : 50
    k = (2 / 3) * k + rsv / 3
    d = (2 / 3) * d + k / 3
  }
  return { k, d }
}

describe('indicators', () => {
  it('isSortedByDate 偵測排序狀態', () => {
    expect(isSortedByDate(series([1, 2, 3]))).toBe(true)
    expect(isSortedByDate([bar('2024-01-02', 1), bar('2024-01-01', 1)])).toBe(false)
    expect(isSortedByDate([])).toBe(true)
  })

  it('dailyReturns 略過無效收盤價', () => {
    const r = dailyReturns([bar('a', 100), bar('b', 110), bar('c', 0), bar('d', 50)])
    expect(r).toHaveLength(1)
    expect(r[0]).toBeCloseTo(10)
  })

  it('meanAndVariance 與兩次掃描結果一致', () => {
    const values = [1.5, -2, 3.25, 0, 7, -1.1]
    const mean = values.reduce((a, b) => a + b, 0) / values.length
    const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length
    const res = meanAndVariance(values)
    expect(res.mean).toBeCloseTo(mean, 10)
    expect(res.variance).toBeCloseTo(variance, 10)
    expect(meanAndVariance([])).toEqual({ mean: 0, variance: 0 })
  })

  it('maxDrawdown 找出最大峰谷跌幅', () => {
    // 峰 120 → 谷 90 = 25%
    expect(maxDrawdown(series([100, 120, 110, 90, 130, 125]))).toBeCloseTo(25)
    expect(maxDrawdown(series([1, 2, 3]))).toBe(0)
    expect(maxDrawdown([])).toBe(0)
  })

  it('bucketReturns 單次掃描分桶', () => {
    expect(bucketReturns([1, 0.3, 0, -0.2, -0.5, -2])).toEqual({
      excellent: 1,
      good: 1,
      average: 3,
      poor: 1,
    })
  })

  it('rsi 邊界：資料不足 / 全漲 / 持平', () => {
    expect(rsi([1, 2, 3], 14)).toBe(50)
    expect(
      rsi(
        Array.from({ length: 14 }, (_, i) => i),
        14
      )
    ).toBe(100)
    expect(rsi(Array(14).fill(10), 14)).toBe(50)
  })

  it('ema 常數序列回傳常數，macd 為 0', () => {
    expect(ema(Array(30).fill(42), 12)).toBeCloseTo(42)
    expect(macd(Array(30).fill(42))).toBeCloseTo(0)
    expect(ema([], 12)).toBe(0)
  })

  it('macd 上升趨勢為正', () => {
    expect(macd(Array.from({ length: 40 }, (_, i) => 100 + i))).toBeGreaterThan(0)
  })

  it('bollingerPosition 判斷突破', () => {
    expect(bollingerPosition([...Array(19).fill(100), 200])).toBe('upper')
    expect(bollingerPosition([...Array(19).fill(100), 0])).toBe('lower')
    expect(bollingerPosition(Array(20).fill(100))).toBe('中軌')
  })

  it('stochasticKD 單調佇列結果與暴力解一致', () => {
    const closes = [50, 52, 49, 55, 60, 58, 57, 61, 63, 59, 62, 66, 64, 60, 58, 61, 65, 70, 68, 67]
    const data = closes.map((c, i) => bar(day(i), c, c + (i % 3), c - (i % 4)))
    const fast = stochasticKD(data)
    const slow = bruteForceKD(data)
    expect(fast.k).toBeCloseTo(slow.k, 10)
    expect(fast.d).toBeCloseTo(slow.d, 10)
    expect(fast.k).toBeGreaterThanOrEqual(0)
    expect(fast.d).toBeLessThanOrEqual(100)
  })

  it('stochasticKD 資料不足回傳 50/50', () => {
    expect(stochasticKD(series([1, 2, 3]))).toEqual({ k: 50, d: 50 })
  })
})
