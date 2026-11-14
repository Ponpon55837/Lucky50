/**
 * 策略回測與運勢相關性（純函式）
 *
 * 以實際收盤價逐日模擬，不套用任何假設的加成。每個函式都是單趟 O(n)。
 * 農民曆當天的分數在開盤前就已確定，所以「當天分數達標就持有當天」沒有偷看未來的問題。
 */
import { HOLD_THRESHOLD, recommendationFromScore } from './almanac'
import type { BacktestResults, StrategyResult } from '@/types'

/** 回測的一個交易日：收盤價與當天的投資分數 */
export interface BacktestDay {
  date: string
  close: number
  score: number
}

const TRADING_DAYS_PER_YEAR = 252
/** 夏普比率採用的無風險年利率（%） */
const RISK_FREE_RATE = 2
const MS_PER_DAY = 24 * 60 * 60 * 1000

const round = (value: number, digits: number) => Number(value.toFixed(digits))

/** 日曆天數換算年數；不足一年按比例年化，滿一年用複合年成長率 */
function annualize(totalReturn: number, calendarDays: number): number {
  if (calendarDays <= 0) return totalReturn
  const years = calendarDays / 365
  if (years < 1) return (totalReturn * 365) / calendarDays
  return totalReturn > -1 ? Math.pow(1 + totalReturn, 1 / years) - 1 : -1
}

/**
 * 由逐日報酬率彙整績效。
 * inMarket[i] 為該日是否持有；勝率只計持有的日子。
 */
function summarize(
  returns: readonly number[],
  inMarket: readonly boolean[],
  calendarDays: number
): StrategyResult {
  let equity = 1
  let peak = 1
  let maxDrawdown = 0
  let sum = 0
  let sumSquares = 0
  let held = 0
  let wins = 0

  for (let i = 0; i < returns.length; i++) {
    const r = returns[i]
    equity *= 1 + r
    if (equity > peak) peak = equity
    else maxDrawdown = Math.max(maxDrawdown, (peak - equity) / peak)
    sum += r
    sumSquares += r * r
    if (inMarket[i]) {
      held++
      if (r > 0) wins++
    }
  }

  const count = returns.length
  const mean = count > 0 ? sum / count : 0
  const variance = count > 1 ? (sumSquares - count * mean * mean) / (count - 1) : 0
  const volatility = Math.sqrt(Math.max(variance, 0) * TRADING_DAYS_PER_YEAR) * 100
  const totalReturn = equity - 1
  const annualReturn = annualize(totalReturn, calendarDays) * 100

  return {
    totalReturn: round(totalReturn * 100, 1),
    annualReturn: round(annualReturn, 1),
    maxDrawdown: round(maxDrawdown * 100, 1),
    sharpeRatio: volatility > 0 ? round((annualReturn - RISK_FREE_RATE) / volatility, 2) : 0,
    winRate: held > 0 ? Math.round((wins / held) * 100) : 0,
    trades: held,
  }
}

/** 收盤價必須是正數才能算報酬率；停牌或缺漏的資料列略過 */
function tradable(days: readonly BacktestDay[]): readonly BacktestDay[] {
  const valid = (day: BacktestDay) => Number.isFinite(day.close) && day.close > 0
  return days.every(valid) ? days : days.filter(valid)
}

function calendarDaysBetween(first: string, last: string): number {
  return Math.round((Date.parse(last) - Date.parse(first)) / MS_PER_DAY)
}

/**
 * 比較三種策略：
 * - 農民曆策略：只在當天投資分數達續抱門檻時持有，其餘空手
 * - 買入持有：全程持有
 * - 定期定額：每個交易日投入等額資金，以「市值 ÷ 累計投入」的變化計算績效
 * 資料不足兩天時回傳 null。
 */
export function runBacktest(input: readonly BacktestDay[]): BacktestResults | null {
  const days = tradable(input)
  if (days.length < 2) return null

  const marketReturns: number[] = []
  const lunarReturns: number[] = []
  const lunarHeld: boolean[] = []
  const dcaReturns: number[] = []
  const always: boolean[] = []

  let units = 1 / days[0].close
  let invested = 1
  let previousRatio = 1

  for (let i = 1; i < days.length; i++) {
    const r = days[i].close / days[i - 1].close - 1
    const held = days[i].score >= HOLD_THRESHOLD
    marketReturns.push(r)
    lunarReturns.push(held ? r : 0)
    lunarHeld.push(held)
    always.push(true)

    // 定期定額：今天再投入一筆，以今日收盤評價全部部位
    units += 1 / days[i].close
    invested += 1
    const ratio = (units * days[i].close) / invested
    dcaReturns.push(ratio / previousRatio - 1)
    previousRatio = ratio
  }

  const calendarDays = calendarDaysBetween(days[0].date, days[days.length - 1].date)
  return {
    lunar: summarize(lunarReturns, lunarHeld, calendarDays),
    buyHold: summarize(marketReturns, always, calendarDays),
    dca: summarize(dcaReturns, always, calendarDays),
  }
}

export type FortuneBand = 'high' | 'medium' | 'low'

export interface BandStats {
  /** 落在此區間的交易日數 */
  days: number
  /** 佔全部交易日的百分比 */
  share: number
  /** 當日平均漲跌幅（%）；沒有樣本時為 null */
  averageReturn: number | null
  /** 當日收紅的比例（%）；沒有樣本時為 null */
  upRate: number | null
}

/** 分數所屬區間：買進門檻以上為高，減碼門檻以下為低，其餘為中 */
function bandOf(score: number): FortuneBand {
  const recommendation = recommendationFromScore(score)
  if (recommendation === 'BUY') return 'high'
  return recommendation === 'SELL' ? 'low' : 'medium'
}

/** 各分數區間的交易日數、當日平均漲跌幅與收紅比例 */
export function fortuneCorrelation(input: readonly BacktestDay[]): Record<FortuneBand, BandStats> {
  const days = tradable(input)
  const tally: Record<FortuneBand, { days: number; sum: number; up: number }> = {
    high: { days: 0, sum: 0, up: 0 },
    medium: { days: 0, sum: 0, up: 0 },
    low: { days: 0, sum: 0, up: 0 },
  }
  for (let i = 1; i < days.length; i++) {
    const r = days[i].close / days[i - 1].close - 1
    const band = tally[bandOf(days[i].score)]
    band.days++
    band.sum += r
    if (r > 0) band.up++
  }

  const total = Math.max(days.length - 1, 1)
  const stats = (band: FortuneBand): BandStats => {
    const { days: count, sum, up } = tally[band]
    return {
      days: count,
      share: Math.round((count / total) * 100),
      averageReturn: count > 0 ? round((sum / count) * 100, 2) : null,
      upRate: count > 0 ? Math.round((up / count) * 100) : null,
    }
  }
  return { high: stats('high'), medium: stats('medium'), low: stats('low') }
}
