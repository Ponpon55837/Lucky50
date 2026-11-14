/**
 * 技術指標（純函數，無副作用）
 *
 * 參數預設值採台灣券商軟體慣例：KD(9,3,3)、MACD(12,26,9)、RSI(6,12)、布林(20,2)、
 * SAR(0.02,0.2)、DMI／ADX(14)、乖離率(20,60)、威廉 %R(14)、CCI(20)、ATR(14)。
 *
 * 每個指標回傳與輸入等長的序列，暖機期（資料還不夠算出第一個值）一律是 null，
 * 不用 50 或 0 之類的假值充數。全部單趟掃描：
 * - 均線、布林：視窗累加和與平方和，O(n)
 * - KD、威廉 %R：單調雙端佇列求滑動視窗極值，O(n)
 * - RSI、ATR、DMI：Wilder 平滑（遞迴），O(n)
 * - CCI 的平均絕對差：樹狀陣列維護視窗內的個數與總和，O(n log n)
 */
import type { ETFData } from '@/types'

/** 指標序列：暖機期為 null */
export type Series = (number | null)[]

type Bars = readonly ETFData[]

const emptySeries = (length: number): Series => new Array<number | null>(length).fill(null)

/** 是否已依日期遞增排序 — O(n) 檢查，已排序時可跳過 O(n log n) 排序 */
export function isSortedByDate(data: Bars): boolean {
  for (let i = 1; i < data.length; i++) {
    if (data[i - 1].date > data[i].date) return false
  }
  return true
}

/** 開高低收皆為正數的 K 棒；停牌或來源缺值（解析成 0 或 NaN）的日子不能拿來算指標 */
export function isValidBar(bar: ETFData): boolean {
  return bar.open > 0 && bar.low > 0 && bar.close > 0 && bar.high >= bar.low
}

// ── 均線 ──

/** 簡單移動平均：視窗累加，前 period − 1 筆為 null */
export function sma(values: readonly number[], period: number): Series {
  const out = emptySeries(values.length)
  let sum = 0
  for (let i = 0; i < values.length; i++) {
    sum += values[i]
    if (i >= period) sum -= values[i - period]
    if (i >= period - 1) out[i] = sum / period
  }
  return out
}

/**
 * 指數移動平均：α = 2 ÷ (period + 1)，以前 period 筆的簡單平均為起點。
 * 起點的選法在資料夠長（數倍於 period）之後不影響結果。
 */
export function ema(values: readonly number[], period: number): Series {
  const out = emptySeries(values.length)
  if (values.length < period) return out
  const alpha = 2 / (period + 1)
  let value = 0
  for (let i = 0; i < period; i++) value += values[i]
  value /= period
  out[period - 1] = value
  for (let i = period; i < values.length; i++) {
    value += alpha * (values[i] - value)
    out[i] = value
  }
  return out
}

/** 乖離率（%）：收盤價偏離 period 日均線的百分比 */
export function bias(closes: readonly number[], period: number): Series {
  const average = sma(closes, period)
  return average.map((mean, i) => (mean ? ((closes[i] - mean) / mean) * 100 : null))
}

// ── 動能 ──

/**
 * RSI（Wilder 平滑）：前 period 筆漲跌的平均作為起點，之後每日以 1 ÷ period 遞迴平滑。
 * 第一個值出現在索引 period；區間內完全沒有漲跌時為 50。
 */
export function rsi(closes: readonly number[], period: number): Series {
  const out = emptySeries(closes.length)
  let gain = 0
  let loss = 0
  for (let i = 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1]
    const up = diff > 0 ? diff : 0
    const down = diff < 0 ? -diff : 0
    if (i <= period) {
      gain += up / period
      loss += down / period
    } else {
      gain += (up - gain) / period
      loss += (down - loss) / period
    }
    if (i >= period) out[i] = gain + loss === 0 ? 50 : (100 * gain) / (gain + loss)
  }
  return out
}

export interface MacdSeries {
  /** 快線：EMA(fast) − EMA(slow) */
  dif: Series
  /** 訊號線（台灣習稱 MACD 線）：DIF 的 EMA(signal) */
  signal: Series
  /** 柱狀體：DIF − 訊號線 */
  histogram: Series
}

/** MACD：DIF、訊號線、柱狀體三條序列 */
export function macd(closes: readonly number[], fast = 12, slow = 26, signal = 9): MacdSeries {
  const fastLine = ema(closes, fast)
  const slowLine = ema(closes, slow)
  const dif = emptySeries(closes.length)
  const difValues: number[] = []
  for (let i = 0; i < closes.length; i++) {
    const quick = fastLine[i]
    const slack = slowLine[i]
    if (quick === null || slack === null) continue
    dif[i] = quick - slack
    difValues.push(quick - slack)
  }

  // DIF 從索引 offset 才開始有值，訊號線對這段做 EMA 後再對齊回原本的索引
  const offset = closes.length - difValues.length
  const signalValues = ema(difValues, signal)
  const signalLine = emptySeries(closes.length)
  const histogram = emptySeries(closes.length)
  signalValues.forEach((value, i) => {
    if (value === null) return
    signalLine[offset + i] = value
    histogram[offset + i] = difValues[i] - value
  })
  return { dif, signal: signalLine, histogram }
}

// ── 通道 ──

export interface BollingerSeries {
  middle: Series
  upper: Series
  lower: Series
}

/** 布林通道：中軌為 period 日均線，上下軌加減 k 倍母體標準差；視窗累加和與平方和 */
export function bollinger(closes: readonly number[], period = 20, k = 2): BollingerSeries {
  const middle = emptySeries(closes.length)
  const upper = emptySeries(closes.length)
  const lower = emptySeries(closes.length)
  let sum = 0
  let sumSq = 0
  for (let i = 0; i < closes.length; i++) {
    sum += closes[i]
    sumSq += closes[i] * closes[i]
    if (i >= period) {
      sum -= closes[i - period]
      sumSq -= closes[i - period] * closes[i - period]
    }
    if (i >= period - 1) {
      const mean = sum / period
      const deviation = Math.sqrt(Math.max(0, sumSq / period - mean * mean))
      middle[i] = mean
      upper[i] = mean + k * deviation
      lower[i] = mean - k * deviation
    }
  }
  return { middle, upper, lower }
}

// ── 滑動視窗極值 ──

/**
 * 滑動視窗最大值（sign = 1）或最小值（sign = −1）。
 * 單調雙端佇列：每個索引最多進出佇列各一次，整體 O(n)。
 * 佇列用固定大小陣列加頭尾指標實作，避免 Array.shift 的 O(n)。
 */
function rollingExtreme(values: readonly number[], period: number, sign: 1 | -1): Series {
  const out = emptySeries(values.length)
  const queue = new Int32Array(values.length)
  let head = 0
  let tail = 0
  for (let i = 0; i < values.length; i++) {
    while (tail > head && sign * values[queue[tail - 1]] <= sign * values[i]) tail--
    queue[tail++] = i
    if (queue[head] <= i - period) head++
    if (i >= period - 1) out[i] = values[queue[head]]
  }
  return out
}

/** 最近 period 根 K 棒的最高價與最低價 */
function rollingRange(data: Bars, period: number): { highest: Series; lowest: Series } {
  return {
    highest: rollingExtreme(
      data.map(bar => bar.high),
      period,
      1
    ),
    lowest: rollingExtreme(
      data.map(bar => bar.low),
      period,
      -1
    ),
  }
}

/** 收盤價在區間 [lowest, highest] 的位置（0–100）；區間沒有高低差時視為中間 */
const positionInRange = (close: number, lowest: number, highest: number): number =>
  highest > lowest ? ((close - lowest) / (highest - lowest)) * 100 : 50

export interface KdSeries {
  k: Series
  d: Series
}

/**
 * 隨機指標 KD(9,3,3)：RSV 為收盤價在最近 period 日高低區間的位置，
 * K = 前一日 K × (1 − 1/smoothK) + RSV ÷ smoothK，D 以同樣方式平滑 K；K、D 起始值 50。
 */
export function stochasticKD(data: Bars, period = 9, smoothK = 3, smoothD = 3): KdSeries {
  const kLine = emptySeries(data.length)
  const dLine = emptySeries(data.length)
  const { highest, lowest } = rollingRange(data, period)
  let k = 50
  let d = 50
  for (let i = 0; i < data.length; i++) {
    const high = highest[i]
    const low = lowest[i]
    if (high === null || low === null) continue
    const rsv = positionInRange(data[i].close, low, high)
    k += (rsv - k) / smoothK
    d += (k - d) / smoothD
    kLine[i] = k
    dLine[i] = d
  }
  return { k: kLine, d: dLine }
}

/** 威廉指標 %R：0 貼近區間高點、−100 貼近區間低點（與 RSV 同概念、方向相反） */
export function williamsR(data: Bars, period = 14): Series {
  const { highest, lowest } = rollingRange(data, period)
  return data.map((bar, i) => {
    const high = highest[i]
    const low = lowest[i]
    return high === null || low === null ? null : positionInRange(bar.close, low, high) - 100
  })
}

// ── CCI ──

/** 樹狀陣列（Fenwick tree）：單點加值、前綴和，皆 O(log n) */
class FenwickTree {
  private readonly tree: Float64Array

  constructor(size: number) {
    this.tree = new Float64Array(size + 1)
  }

  add(index: number, delta: number): void {
    for (let i = index + 1; i < this.tree.length; i += i & -i) this.tree[i] += delta
  }

  /** 索引 0 到 count − 1 的總和 */
  prefix(count: number): number {
    let total = 0
    for (let i = count; i > 0; i -= i & -i) total += this.tree[i]
    return total
  }
}

/** sorted 中小於等於 target 的元素個數 */
function countAtMost(sorted: Float64Array, target: number): number {
  let low = 0
  let high = sorted.length
  while (low < high) {
    const mid = (low + high) >>> 1
    if (sorted[mid] <= target) low = mid + 1
    else high = mid
  }
  return low
}

/**
 * 滑動視窗的平均絕對差：Σ|x − 平均| ÷ period。
 * 平均每個視窗都不同，沒辦法單純累加；改把數值離散化後用兩棵樹狀陣列記錄視窗內
 * 「小於等於平均的個數與總和」，每個視窗 O(log n) 就能拆成平均以下與以上兩段相加。
 */
function rollingMeanDeviation(values: readonly number[], period: number): Series {
  const out = emptySeries(values.length)
  const sorted = Float64Array.from(new Set(values)).sort()
  const ranks = values.map(value => countAtMost(sorted, value) - 1)
  const counts = new FenwickTree(sorted.length)
  const sums = new FenwickTree(sorted.length)
  let total = 0
  for (let i = 0; i < values.length; i++) {
    counts.add(ranks[i], 1)
    sums.add(ranks[i], values[i])
    total += values[i]
    if (i >= period) {
      counts.add(ranks[i - period], -1)
      sums.add(ranks[i - period], -values[i - period])
      total -= values[i - period]
    }
    if (i >= period - 1) {
      const mean = total / period
      const rank = countAtMost(sorted, mean)
      const countBelow = counts.prefix(rank)
      const sumBelow = sums.prefix(rank)
      const below = mean * countBelow - sumBelow
      const above = total - sumBelow - mean * (period - countBelow)
      out[i] = Math.max(0, (below + above) / period)
    }
  }
  return out
}

/** CCI：典型價（高＋低＋收）÷ 3 偏離其均值幾個「平均絕對差」，再除以常數 0.015 */
export function cci(data: Bars, period = 20): Series {
  const typical = data.map(bar => (bar.high + bar.low + bar.close) / 3)
  const mean = sma(typical, period)
  const deviation = rollingMeanDeviation(typical, period)
  return typical.map((price, i) => {
    const average = mean[i]
    const spread = deviation[i]
    if (average === null || spread === null) return null
    return spread > 0 ? (price - average) / (0.015 * spread) : 0
  })
}

// ── 波動與趨勢強度 ──

/** 真實波幅：當日高低差，與前一日收盤價到當日高、低的距離，三者取最大 */
function trueRange(bar: ETFData, previousClose: number): number {
  return Math.max(
    bar.high - bar.low,
    Math.abs(bar.high - previousClose),
    Math.abs(bar.low - previousClose)
  )
}

/** ATR（Wilder 平滑）：平均真實波幅，單位與股價相同；第一個值出現在索引 period */
export function atr(data: Bars, period = 14): Series {
  const out = emptySeries(data.length)
  let value = 0
  for (let i = 1; i < data.length; i++) {
    const range = trueRange(data[i], data[i - 1].close)
    value += i <= period ? range / period : (range - value) / period
    if (i >= period) out[i] = value
  }
  return out
}

export interface DmiSeries {
  plusDi: Series
  minusDi: Series
  adx: Series
}

/**
 * DMI／ADX（Wilder）：+DI、−DI 是向上、向下動向占真實波幅的百分比，
 * ADX 是兩者差距（DX）的平滑，只表示趨勢強弱、不分方向。
 * ±DI 第一個值在索引 period，ADX 在索引 2 × period − 1。
 */
export function dmi(data: Bars, period = 14): DmiSeries {
  const plusDi = emptySeries(data.length)
  const minusDi = emptySeries(data.length)
  const adx = emptySeries(data.length)
  let range = 0
  let plus = 0
  let minus = 0
  let strength = 0
  for (let i = 1; i < data.length; i++) {
    const up = data[i].high - data[i - 1].high
    const down = data[i - 1].low - data[i].low
    const plusMove = up > down && up > 0 ? up : 0
    const minusMove = down > up && down > 0 ? down : 0
    const span = trueRange(data[i], data[i - 1].close)
    if (i <= period) {
      range += span / period
      plus += plusMove / period
      minus += minusMove / period
    } else {
      range += (span - range) / period
      plus += (plusMove - plus) / period
      minus += (minusMove - minus) / period
    }
    if (i < period) continue

    const plusValue = range > 0 ? (100 * plus) / range : 0
    const minusValue = range > 0 ? (100 * minus) / range : 0
    plusDi[i] = plusValue
    minusDi[i] = minusValue
    const total = plusValue + minusValue
    const dx = total > 0 ? (100 * Math.abs(plusValue - minusValue)) / total : 0
    strength += i < 2 * period ? dx / period : (dx - strength) / period
    if (i >= 2 * period - 1) adx[i] = strength
  }
  return { plusDi, minusDi, adx }
}

export interface SarSeries {
  value: Series
  /** true：上行（SAR 在 K 棒下方）；false：下行 */
  rising: (boolean | null)[]
}

/**
 * 拋物線轉向指標 SAR：往極值（上行時的最高價、下行時的最低價）逐日靠近，
 * 加速因子從 step 開始，每創一次新極值加 step，上限 maxStep；價格穿過 SAR 就翻轉。
 * 起始方向以前兩根 K 棒的中價比較決定，第一個值出現在索引 1。
 */
export function parabolicSar(data: Bars, step = 0.02, maxStep = 0.2): SarSeries {
  const value = emptySeries(data.length)
  const direction = new Array<boolean | null>(data.length).fill(null)
  if (data.length < 2) return { value, rising: direction }

  let rising = data[1].high + data[1].low >= data[0].high + data[0].low
  let sar = rising ? data[0].low : data[0].high
  let extreme = rising ? data[1].high : data[1].low
  let factor = step
  value[1] = sar
  direction[1] = rising

  for (let i = 2; i < data.length; i++) {
    const { high, low } = data[i]
    sar += factor * (extreme - sar)
    if (rising) {
      // SAR 不得高於前兩日的最低價
      sar = Math.min(sar, data[i - 1].low, data[i - 2].low)
      if (low < sar) {
        rising = false
        sar = extreme
        extreme = low
        factor = step
      } else if (high > extreme) {
        extreme = high
        factor = Math.min(factor + step, maxStep)
      }
    } else {
      sar = Math.max(sar, data[i - 1].high, data[i - 2].high)
      if (high > sar) {
        rising = true
        sar = extreme
        extreme = high
        factor = step
      } else if (low < extreme) {
        extreme = low
        factor = Math.min(factor + step, maxStep)
      }
    }
    value[i] = sar
    direction[i] = rising
  }
  return { value, rising: direction }
}

// ── 量 ──

/** OBV 能量潮：收漲把當日成交量加上去、收跌減掉，平盤不動；從 0 開始累積 */
export function obv(data: Bars): number[] {
  const out = new Array<number>(data.length)
  let total = 0
  for (let i = 0; i < data.length; i++) {
    if (i > 0) {
      if (data[i].close > data[i - 1].close) total += data[i].volume
      else if (data[i].close < data[i - 1].close) total -= data[i].volume
    }
    out[i] = total
  }
  return out
}

// ── 相對位置 ──

/** ISO 日期往前推 months 個月；目標月份沒有那一天時退到該月最後一天 */
export function monthsBefore(date: string, months: number): string {
  const [year, month, day] = date.split('-').map(Number)
  const index = year * 12 + (month - 1) - months
  const targetYear = Math.floor(index / 12)
  const targetMonth = index - targetYear * 12
  const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate()
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${targetYear}-${pad(targetMonth + 1)}-${pad(Math.min(day, lastDay))}`
}

/** 日期小於等於 target 的最後一根 K 棒索引（資料需依日期遞增）；沒有則為 −1 */
function lastIndexOnOrBefore(data: Bars, target: string): number {
  let low = 0
  let high = data.length
  while (low < high) {
    const mid = (low + high) >>> 1
    if (data[mid].date <= target) low = mid + 1
    else high = mid
  }
  return low - 1
}

/**
 * 最近 months 個月的報酬率（%）：以 months 個月前（當天休市則往前找最近的交易日）的收盤價為基準。
 * 資料沒有涵蓋到那一天時回傳 null，不拿較短的期間充數。
 */
export function periodReturn(data: Bars, months: number): number | null {
  const last = data.at(-1)
  if (!last) return null
  const base = data[lastIndexOnOrBefore(data, monthsBefore(last.date, months))]
  return base ? (last.close / base.close - 1) * 100 : null
}

export interface RangePosition {
  high: number
  low: number
  /** 最新收盤價在區間內的位置（0–100） */
  position: number
}

/** 最近 months 個月（預設 12 個月，即 52 週）的最高、最低價與目前位置；資料未涵蓋整段期間時為 null */
export function rangePosition(data: Bars, months = 12): RangePosition | null {
  const last = data.at(-1)
  if (!last) return null
  const start = lastIndexOnOrBefore(data, monthsBefore(last.date, months))
  if (start < 0) return null
  let high = -Infinity
  let low = Infinity
  for (let i = start + 1; i < data.length; i++) {
    if (data[i].high > high) high = data[i].high
    if (data[i].low < low) low = data[i].low
  }
  return { high, low, position: positionInRange(last.close, low, high) }
}
