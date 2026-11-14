/**
 * 還原股價（純函數）
 *
 * 分割與除息都會讓股價在生效日出現與買賣無關的缺口：1 拆 4 當天價格剩四分之一，
 * 除息當天參考價少掉配息金額。直接拿原始價算均線或報酬，會把這些缺口當成下跌。
 * 這裡採向前還原：最新價格不動，把生效日之前的價格乘上「調整後參考價 ÷ 調整前收盤價」，
 * 多次調整的係數連乘。
 */
import type { ETFData } from '@/types'

export interface PriceAdjustment {
  /** 生效日（除息日或分割後恢復交易日），ISO 日期 */
  date: string
  kind: 'split' | 'dividend'
  /** 生效日之前的價格要乘上的係數 */
  factor: number
}

/** 0050 於 2025-06-18 進行 1 拆 4；抓不到除權息資料時至少還原這一次 */
export const KNOWN_SPLITS: readonly PriceAdjustment[] = [
  { date: '2025-06-18', kind: 'split', factor: 1 / 4 },
]

/** 參考價四捨五入到小數兩位，換算出的比例與整數差在這個範圍內就視為整數比例 */
const WHOLE_RATIO_TOLERANCE = 0.005

/**
 * 由分割前收盤價與分割後參考價推算還原係數。
 * 參考價有進位誤差（188.65 ÷ 47.16 = 4.0002），比例貼近整數時取整數，分割前後的價格才接得起來。
 */
export function splitFactor(beforePrice: number, afterPrice: number): number | null {
  if (!(beforePrice > 0) || !(afterPrice > 0)) return null
  const forward = beforePrice / afterPrice
  if (forward >= 1) {
    const whole = Math.round(forward)
    return Math.abs(forward - whole) / whole <= WHOLE_RATIO_TOLERANCE ? 1 / whole : 1 / forward
  }
  const reverse = afterPrice / beforePrice
  const whole = Math.round(reverse)
  return Math.abs(reverse - whole) / whole <= WHOLE_RATIO_TOLERANCE ? whole : reverse
}

/** 由除息前收盤價與除息參考價推算還原係數；數值不合理（缺值、參考價不低於收盤價）時為 null */
export function dividendFactor(beforePrice: number, referencePrice: number): number | null {
  if (!(beforePrice > 0) || !(referencePrice > 0) || referencePrice >= beforePrice) return null
  return referencePrice / beforePrice
}

/**
 * 套用還原係數。bars 需依日期遞增；由最新一筆往回掃，係數隨著經過的生效日累乘，O(n + m)。
 * 分割同時把成交量換算成分割後的股數；除息不影響成交量。不需調整的 K 棒原樣回傳。
 */
export function adjustBars(
  bars: readonly ETFData[],
  adjustments: readonly PriceAdjustment[]
): ETFData[] {
  const ordered = [...adjustments].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
  const out = new Array<ETFData>(bars.length)
  let next = ordered.length - 1
  let priceFactor = 1
  let volumeFactor = 1
  for (let i = bars.length - 1; i >= 0; i--) {
    const bar = bars[i]
    while (next >= 0 && bar.date < ordered[next].date) {
      priceFactor *= ordered[next].factor
      if (ordered[next].kind === 'split') volumeFactor /= ordered[next].factor
      next--
    }
    out[i] =
      priceFactor === 1 && volumeFactor === 1
        ? bar
        : {
            ...bar,
            open: bar.open * priceFactor,
            high: bar.high * priceFactor,
            low: bar.low * priceFactor,
            close: bar.close * priceFactor,
            change: bar.change * priceFactor,
            volume: bar.volume * volumeFactor,
          }
  }
  return out
}
