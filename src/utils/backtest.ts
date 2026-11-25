/**
 * 策略回測與運勢相關性（純函式）
 *
 * 農民曆分數在開盤前已確定；訊號只能在當天開盤改變持倉，隔夜報酬屬於前一日的部位。
 */
import { HOLD_THRESHOLD, recommendationFromScore } from './almanac'
import type { BacktestCosts, BacktestResults, StrategyResult } from '@/types'

/** 回測的一個交易日：開盤價、收盤價與當天開盤前可得的投資分數 */
export interface BacktestDay {
  date: string
  open: number
  close: number
  score: number
}

export const DEFAULT_BACKTEST_COSTS: Readonly<BacktestCosts> = {
  commissionBps: 14.25,
  sellTaxBps: 10,
  slippageBps: 0,
}

const BPS_PER_UNIT = 10_000
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
 * inMarket[i] 為該日是否曾有持倉曝險；省略時表示每天都持有。
 */
function summarize(
  returns: readonly number[],
  calendarDays: number,
  grossEquity: number,
  orders: number,
  inMarket?: readonly boolean[]
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
    if (inMarket?.[i] ?? true) {
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
    grossTotalReturn: round((grossEquity - 1) * 100, 1),
    annualReturn: round(annualReturn, 1),
    maxDrawdown: round(maxDrawdown * 100, 1),
    sharpeRatio:
      volatility > 0
        ? round((mean * TRADING_DAYS_PER_YEAR * 100 - RISK_FREE_RATE) / volatility, 2)
        : 0,
    winRate: held > 0 ? Math.round((wins / held) * 100) : 0,
    trades: held,
    orders,
  }
}

const validPrice = (price: number) => Number.isFinite(price) && price > 0

function calendarDaysBetween(first: string, last: string): number {
  return Math.round((Date.parse(last) - Date.parse(first)) / MS_PER_DAY)
}

/**
 * 日 K 需依日期遞增。三種策略從第一個可交易日的開盤開始，到最後一筆有效收盤估值。
 * 定期定額每次開盤投入等額新資金，以「市值 ÷ 累計投入」的變化計算績效。
 * 缺開盤時不執行委託，有效收盤仍可估值；缺收盤時略過該日。可交易日不足兩天時回傳 null。
 */
export function runBacktest(
  input: readonly BacktestDay[],
  overrides: Partial<BacktestCosts> = {}
): BacktestResults | null {
  const costs = { ...DEFAULT_BACKTEST_COSTS, ...overrides }
  const commission = costs.commissionBps / BPS_PER_UNIT
  const sellTax = costs.sellTaxBps / BPS_PER_UNIT
  const slippage = costs.slippageBps / BPS_PER_UNIT
  if (
    ![commission, sellTax, slippage].every(rate => Number.isFinite(rate) && rate >= 0) ||
    commission + sellTax >= 1 ||
    slippage >= 1
  ) {
    throw new RangeError('Invalid backtest trading costs')
  }
  const buyFactor = 1 / ((1 + slippage) * (1 + commission))
  const sellFactor = (1 - slippage) * (1 - commission - sellTax)

  const marketReturns: number[] = []
  const lunarReturns: number[] = []
  const lunarExposure: boolean[] = []
  const dcaReturns: number[] = []
  let firstDay: BacktestDay | undefined
  let lastDate = ''
  let previousClose = 0
  let unexecutableDays = 0
  let lunarHeld: boolean = false
  let lunarOrders = 0
  let lunarGrossEquity = 1
  let grossUnits = 0
  let contributions = 0
  let dcaGrossEquity = 1
  let previousDcaEquity = 1

  for (const day of input) {
    const { date, open, close, score } = day
    const hasOpen = validPrice(open)
    const hasClose = validPrice(close)
    if (!hasOpen || !hasClose) unexecutableDays++
    if (!hasClose || (!firstDay && !hasOpen)) continue

    const first = firstDay === undefined
    if (first) {
      firstDay = day
      previousClose = open
    }
    const marketFactor = close / previousClose
    marketReturns.push(marketFactor * (first ? buyFactor : 1) - 1)

    const heldOvernight: boolean = lunarHeld
    // 缺開盤價時，當天沿用既有部位。持倉變動的報酬以實際開盤價切割。
    if (hasOpen) lunarHeld = score >= HOLD_THRESHOLD
    let grossFactor = lunarHeld ? marketFactor : 1
    let feeFactor = 1
    if (lunarHeld !== heldOvernight) {
      lunarOrders++
      if (lunarHeld) {
        grossFactor = close / open
        feeFactor = buyFactor
      } else {
        grossFactor = open / previousClose
        feeFactor = sellFactor
      }
    }
    lunarGrossEquity *= grossFactor
    lunarReturns.push(grossFactor * feeFactor - 1)
    lunarExposure.push(heldOvernight || lunarHeld)

    if (hasOpen) {
      grossUnits += 1 / open
      contributions++
    }
    dcaGrossEquity = (grossUnits * close) / contributions
    const dcaEquity = dcaGrossEquity * buyFactor
    dcaReturns.push(dcaEquity / previousDcaEquity - 1)
    previousDcaEquity = dcaEquity

    previousClose = close
    lastDate = date
  }

  if (!firstDay || contributions < 2) return null
  const calendarDays = calendarDaysBetween(firstDay.date, lastDate)
  return {
    lunar: summarize(lunarReturns, calendarDays, lunarGrossEquity, lunarOrders, lunarExposure),
    buyHold: summarize(marketReturns, calendarDays, previousClose / firstDay.open, 1),
    dca: summarize(dcaReturns, calendarDays, dcaGrossEquity, contributions),
    costs,
    unexecutableDays,
    firstDate: firstDay.date,
    lastDate,
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

/** 各分數區間的交易日數、收盤對前一日收盤的平均漲跌幅與收紅比例 */
export function fortuneCorrelation(
  input: readonly Pick<BacktestDay, 'date' | 'close' | 'score'>[]
): Record<FortuneBand, BandStats> {
  const days = input.filter(day => validPrice(day.close))
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
