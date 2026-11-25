import { describe, it, expect } from 'vitest'
import { fortuneCorrelation, runBacktest, type BacktestDay } from '@/utils/backtest'

const NO_COSTS = { commissionBps: 0, sellTaxBps: 0, slippageBps: 0 }

/** 連續交易日（跳過日曆換算的細節，每天一筆） */
const series = (closes: number[], scores: number[], opens = closes): BacktestDay[] =>
  closes.map((close, i) => ({
    date: `2026-01-${String(i + 1).padStart(2, '0')}`,
    open: opens[i],
    close,
    score: scores[i],
  }))

describe('runBacktest', () => {
  it('缺開盤不變更持倉、有收盤則繼續估值；缺收盤時略過該日', () => {
    const days = series(
      [500, 100, 120, Number.NaN, 165, 180],
      [80, 80, 10, 10, 80, 10],
      [0, 100, 0, 999, 150, Number.NaN]
    )
    const result = runBacktest(days, NO_COSTS)!
    expect(result).toMatchObject({
      unexecutableDays: 4,
      firstDate: '2026-01-02',
      lastDate: '2026-01-06',
    })
    expect(result.lunar).toEqual(result.buyHold)
    expect(result.lunar).toMatchObject({ totalReturn: 80, trades: 4, orders: 1 })
    expect(result.dca).toMatchObject({ totalReturn: 50, orders: 2 })
  })

  it('空手時缺開盤不會以收盤價進場', () => {
    const result = runBacktest(series([100, 120, 150], [10, 80, 10], [100, 0, 150]), NO_COSTS)!
    expect(result.lunar).toMatchObject({ totalReturn: 0, trades: 0, orders: 0 })
    expect(result.buyHold.totalReturn).toBe(50)
  })

  it('資料不足兩天回傳 null', () => {
    expect(runBacktest([])).toBeNull()
    expect(runBacktest(series([100], [80]))).toBeNull()
    expect(runBacktest(series([100, 110], [80, 80], [100, 0]))).toBeNull()
  })

  it('首日依開盤價進場，達標日連續持有的結果和買入持有相同', () => {
    const result = runBacktest(series([110, 99, 121], [80, 80, 80], [100, 110, 99]), NO_COSTS)!
    expect(result.lunar).toEqual(result.buyHold)
    expect(result.buyHold.totalReturn).toBe(21)
    // 110 → 99 回落 10%
    expect(result.buyHold.maxDrawdown).toBe(10)
    expect(result.buyHold.trades).toBe(3)
    expect(result.buyHold.orders).toBe(1)
    expect(result.buyHold.winRate).toBe(67)
  })

  it('先前的部位承受隔夜漲跌，當天的訊號決定開盤後持倉', () => {
    // 空手、150→165 進場、165→198 續抱、198→132 退場、220→242 再進場。
    const days = series([100, 165, 198, 150, 242], [50, 60, 80, 59, 75], [100, 150, 180, 132, 220])
    const result = runBacktest(days, NO_COSTS)!
    expect(result.lunar).toMatchObject({
      totalReturn: -3.2,
      maxDrawdown: 33.3,
      trades: 4,
      orders: 3,
      winRate: 75,
    })
    expect(result.buyHold.totalReturn).toBe(142)
  })

  it('達標日若下跌，策略照樣賠錢，不會被美化', () => {
    const result = runBacktest(series([100, 90, 81], [80, 80, 80]), NO_COSTS)!
    expect(result.lunar.totalReturn).toBe(-19)
    expect(result.lunar.winRate).toBe(0)
    expect(result.lunar.annualReturn).toBeLessThan(0)
  })

  it('定期定額在每次開盤等額投入，以期末市值除以累計投入', () => {
    // 開盤投入 1/100 + 1/50 單位，共投入 2，期末市值為 1.8。
    const result = runBacktest(series([110, 60], [80, 80], [100, 50]))!
    expect(result.dca).toMatchObject({ grossTotalReturn: -10, totalReturn: -10.1, orders: 2 })
    expect(result.buyHold).toMatchObject({ grossTotalReturn: -40, totalReturn: -40.1, orders: 1 })
  })

  it('手續費只在成交時扣除，ETF 證交稅僅在賣出時，期末未額外賣出', () => {
    const result = runBacktest(series([100, 100, 100, 100], [80, 10, 80, 80]))!
    expect(result.costs).toEqual({ commissionBps: 14.25, sellTaxBps: 10, slippageBps: 0 })
    // 農民曆兩次買入、一次賣出；買入持有單次買入，定期定額的每筆新資金各扣一次。
    expect(result.lunar).toMatchObject({ totalReturn: -0.5, grossTotalReturn: 0, orders: 3 })
    expect(result.buyHold).toMatchObject({ totalReturn: -0.1, grossTotalReturn: 0, orders: 1 })
    expect(result.dca).toMatchObject({ totalReturn: -0.1, grossTotalReturn: 0, orders: 4 })
  })

  it('滑價在買入與賣出使用相反方向', () => {
    const days = series([100, 100], [80, 10])
    const result = runBacktest(days, { ...NO_COSTS, slippageBps: 100 })!
    expect(result.lunar).toMatchObject({ grossTotalReturn: 0, totalReturn: -2 })
    expect(result.buyHold).toMatchObject({ grossTotalReturn: 0, totalReturn: -1 })
    expect(() => runBacktest(days, { slippageBps: -1 })).toThrow(RangeError)
  })

  it('價格不動時波動為零，夏普比率為 0', () => {
    const result = runBacktest(series([100, 100, 100], [80, 80, 80]), NO_COSTS)!
    expect(result.buyHold).toMatchObject({ totalReturn: 0, sharpeRatio: 0, maxDrawdown: 0 })
  })
})

describe('fortuneCorrelation', () => {
  it('收盤價缺漏時略過，相關性統計不需要開盤價', () => {
    const { high } = fortuneCorrelation(series([100, 0, 110], [80, 80, 80], [0, 0, 0]))
    expect(high).toMatchObject({ days: 1, averageReturn: 10 })
  })

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
