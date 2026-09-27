/**
 * 技術指標與統計演算法（純函數，無副作用）
 *
 * 全部以單次線性掃描 O(n) 實作，避免 filter/map/reduce 串接造成的多次走訪與中間陣列配置：
 * - 報酬率統計：Welford 線上演算法一次求平均與變異數
 * - 最大回撤：單調追蹤歷史高點（Best Time to Buy and Sell Stock 同型）
 * - KD 指標：單調雙端佇列求滑動視窗最大/最小值（LeetCode 239 Sliding Window Maximum）
 * - 布林通道：固定視窗的累加和與平方和
 */
import type { ETFData } from '@/types'

/** 是否已依日期遞增排序 — O(n) 檢查，已排序時可跳過 O(n log n) 排序 */
export function isSortedByDate(data: readonly ETFData[]): boolean {
  for (let i = 1; i < data.length; i++) {
    if (data[i - 1].date > data[i].date) return false
  }
  return true
}

/** 相鄰收盤價的日報酬率（%），略過無效值 */
export function dailyReturns(data: readonly ETFData[]): number[] {
  const out: number[] = []
  for (let i = 1; i < data.length; i++) {
    const prev = data[i - 1].close
    const cur = data[i].close
    if (prev > 0 && cur) {
      const r = ((cur - prev) / prev) * 100
      if (Number.isFinite(r)) out.push(r)
    }
  }
  return out
}

/** Welford 線上演算法：單次掃描求平均與母體變異數，數值穩定 */
export function meanAndVariance(values: readonly number[]): { mean: number; variance: number } {
  let mean = 0
  let m2 = 0
  for (let i = 0; i < values.length; i++) {
    const delta = values[i] - mean
    mean += delta / (i + 1)
    m2 += delta * (values[i] - mean)
  }
  return { mean, variance: values.length > 0 ? m2 / values.length : 0 }
}

/** 最大回撤（%）：單次掃描維護歷史高點 */
export function maxDrawdown(data: readonly ETFData[]): number {
  let peak = data[0]?.close || 0
  let mdd = 0
  for (let i = 0; i < data.length; i++) {
    const c = data[i].close
    if (c > peak) peak = c
    else if (peak > 0) {
      const dd = ((peak - c) / peak) * 100
      if (dd > mdd) mdd = dd
    }
  }
  return mdd
}

/** 報酬率分桶計數：單次掃描取代四次 filter */
export function bucketReturns(returns: readonly number[]) {
  let excellent = 0
  let good = 0
  let average = 0
  let poor = 0
  for (const r of returns) {
    if (r > 0.5) excellent++
    else if (r > 0) good++
    else if (r >= -0.5) average++
    else poor++
  }
  return { excellent, good, average, poor }
}

/** 最近 period 期的簡易 RSI（平均漲幅 / 平均跌幅），單次掃描 */
export function rsi(prices: readonly number[], period = 14): number {
  if (prices.length < period) return 50
  const start = prices.length - period
  let gain = 0
  let loss = 0
  for (let i = start + 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1]
    if (diff > 0) gain += diff
    else loss -= diff
  }
  if (loss === 0) return gain === 0 ? 50 : 100
  return 100 - 100 / (1 + gain / loss)
}

/** 指數移動平均（以第一筆價格為種子），回傳最後一期的 EMA */
export function ema(prices: readonly number[], period: number): number {
  if (prices.length === 0) return 0
  const alpha = 2 / (period + 1)
  let value = prices[0]
  for (let i = 1; i < prices.length; i++) {
    value = alpha * prices[i] + (1 - alpha) * value
  }
  return value
}

/** MACD 快慢線差（DIF = EMA12 − EMA26） */
export function macd(prices: readonly number[], fast = 12, slow = 26): number {
  return ema(prices, fast) - ema(prices, slow)
}

/** 布林通道位置：最近 period 期的平均 ± k 倍標準差 */
export function bollingerPosition(
  prices: readonly number[],
  period = 20,
  k = 2
): 'upper' | 'lower' | '中軌' {
  const n = Math.min(period, prices.length)
  if (n === 0) return '中軌'
  let sum = 0
  let sumSq = 0
  for (let i = prices.length - n; i < prices.length; i++) {
    sum += prices[i]
    sumSq += prices[i] * prices[i]
  }
  const mean = sum / n
  const std = Math.sqrt(Math.max(0, sumSq / n - mean * mean))
  const current = prices[prices.length - 1]
  if (current > mean + k * std) return 'upper'
  if (current < mean - k * std) return 'lower'
  return '中軌'
}

/**
 * 隨機指標 KD（台股慣用 9-3-3 參數）
 *
 * RSV 需要每個 period 視窗的最高價/最低價。以單調雙端佇列維護滑動視窗極值，
 * 每個索引最多進出佇列各一次，整體 O(n)，而非每個視窗重算的 O(n·k)。
 */
export function stochasticKD(data: readonly ETFData[], period = 9): { k: number; d: number } {
  let k = 50
  let d = 50
  if (data.length < period) return { k, d }

  // 以固定大小陣列 + head/tail 指標實作雙端佇列，避免 Array.shift 的 O(n)
  const maxQ = new Int32Array(data.length)
  const minQ = new Int32Array(data.length)
  let maxHead = 0
  let maxTail = 0
  let minHead = 0
  let minTail = 0

  for (let i = 0; i < data.length; i++) {
    while (maxTail > maxHead && data[maxQ[maxTail - 1]].high <= data[i].high) maxTail--
    maxQ[maxTail++] = i
    while (minTail > minHead && data[minQ[minTail - 1]].low >= data[i].low) minTail--
    minQ[minTail++] = i

    // 移除已滑出視窗的索引
    if (maxQ[maxHead] <= i - period) maxHead++
    if (minQ[minHead] <= i - period) minHead++

    if (i >= period - 1) {
      const highest = data[maxQ[maxHead]].high
      const lowest = data[minQ[minHead]].low
      const range = highest - lowest
      const rsv = range > 0 ? ((data[i].close - lowest) / range) * 100 : 50
      k = (2 / 3) * k + (1 / 3) * rsv
      d = (2 / 3) * d + (1 / 3) * k
    }
  }
  return { k, d }
}
