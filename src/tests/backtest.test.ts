import { describe, it, expect } from 'vitest'
import { fortuneCorrelation, runBacktest, type BacktestDay } from '@/utils/backtest'

/** 連續交易日（跳過日曆換算的細節，每天一筆） */
const series = (closes: number[], scores: number[]): BacktestDay[] =>
  closes.map((close, i) => ({
    date: `2026-01-${String(i + 1).padStart(2, '0')}`,
    close,
    score: scores[i],
  }))

describe('runBacktest', () => {
  it('收盤價為 0 或缺漏的資料列略過，不產生 NaN', () => {
    const scores = [80, 80, 80, 80]
    const dirty = runBacktest(series([100, 0, Number.NaN, 110], scores))!
    const clean = runBacktest([
      { date: '2026-01-01', close: 100, score: 80 },
      { date: '2026-01-04', close: 110, score: 80 },
    ])!
    expect(dirty).toEqual(clean)
    expect(dirty.buyHold.totalReturn).toBe(10)
    const { high } = fortuneCorrelation(series([100, 0, 110], [80, 80, 80]))
    expect(high).toMatchObject({ days: 1, averageReturn: 10 })
  })

  it('資料不足兩天回傳 null', () => {
    expect(runBacktest([])).toBeNull()
    expect(runBacktest(series([100], [80]))).toBeNull()
  })

  it('買入持有的累積報酬即首尾價差', () => {
    const result = runBacktest(series([100, 110, 99, 121], [80, 80, 80, 80]))!
    expect(result.buyHold.totalReturn).toBe(21)
    // 110 → 99 回落 10%
    expect(result.buyHold.maxDrawdown).toBe(10)
    expect(result.buyHold.trades).toBe(3)
    expect(result.buyHold.winRate).toBe(67)
  })

  it('農民曆策略只賺到達標日的漲跌', () => {
    // 第二天漲 10%（達標）、第三天跌 10%（未達標，空手避開）、第四天漲 20%（達標）
    const result = runBacktest(series([100, 110, 99, 118.8], [50, 60, 59, 75]))!
    expect(result.lunar.totalReturn).toBe(32)
    expect(result.lunar.maxDrawdown).toBe(0)
    expect(result.lunar.trades).toBe(2)
    expect(result.lunar.winRate).toBe(100)
    expect(result.buyHold.totalReturn).toBe(18.8)
  })

  it('達標日若下跌，策略照樣賠錢，不會被美化', () => {
    const result = runBacktest(series([100, 90, 81], [80, 80, 80]))!
    expect(result.lunar.totalReturn).toBe(-19)
    expect(result.lunar.winRate).toBe(0)
    expect(result.lunar.annualReturn).toBeLessThan(0)
  })

  it('定期定額以市值除以累計投入計算', () => {
    // 100 買 1 單位、50 買 2 單位：共投入 2，持有 0.03 單位 × 50 = 1.5，虧 25%
    const result = runBacktest(series([100, 50], [80, 80]))!
    expect(result.dca.totalReturn).toBe(-25)
    expect(result.buyHold.totalReturn).toBe(-50)
  })

  it('價格不動時波動為零，夏普比率為 0', () => {
    const result = runBacktest(series([100, 100, 100], [80, 80, 80]))!
    expect(result.buyHold).toMatchObject({ totalReturn: 0, sharpeRatio: 0, maxDrawdown: 0 })
  })
})

describe('fortuneCorrelation', () => {
  it('依分數分組統計當日漲跌', () => {
    // 報酬：+10%（高）、-10%（低）、+20%（高）、0%（中）
    const stats = fortuneCorrelation(series([100, 110, 99, 118.8, 118.8], [50, 80, 30, 75, 50]))
    expect(stats.high).toEqual({ days: 2, share: 50, averageReturn: 15, upRate: 100 })
    expect(stats.low).toEqual({ days: 1, share: 25, averageReturn: -10, upRate: 0 })
    expect(stats.medium).toEqual({ days: 1, share: 25, averageReturn: 0, upRate: 0 })
  })

  it('沒有樣本的區間回傳 null', () => {
    const stats = fortuneCorrelation(series([100, 110], [80, 80]))
    expect(stats.low).toEqual({ days: 0, share: 0, averageReturn: null, upRate: null })
  })
})
