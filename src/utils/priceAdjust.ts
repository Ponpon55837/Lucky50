/**
 * 還原股價（純函數）
 *
 * 分割與除息都會讓股價在生效日出現與買賣無關的缺口：1 拆 4 當天價格剩四分之一，
 * 除息當天參考價少掉配息金額。直接拿原始價算均線或報酬，會把這些缺口當成下跌。
 * 這裡採向前還原：最新價格不動，把生效日之前的價格乘上「調整後參考價 ÷ 調整前收盤價」，
 * 多次調整的係數連乘。
 */
import { TaiwanStockService } from '@/services/taiwanStock'
import type { ETFData } from '@/types'
import { fromLocalDateString, toLocalDateString } from '@/utils/date'

export interface PriceAdjustment {
  /** 生效日（除息日或分割後恢復交易日），ISO 日期 */
  date: string
  kind: 'split' | 'dividend'
  /** 生效日之前的價格要乘上的係數 */
  factor: number
  /** 事件資料記載的前一交易日收盤價與生效日參考價 */
  beforePrice?: number
  referencePrice?: number
}

/** 0050 於 2025-06-18 恢復交易（1 拆 4）；除權息資料無法取得時使用證交所公告。 */
export const KNOWN_SPLITS: readonly PriceAdjustment[] = [
  { date: '2025-06-18', kind: 'split', factor: 1 / 4, beforePrice: 188.65, referencePrice: 47.16 },
]

/** 0050 分割前最後交易日。6 月 11 至 17 日為該檔 ETF 停止交易，並非全市場休市。 */
// https://www.twse.com.tw/zh/ETFortune/announcement?company=A00005&date=20250617&fund=0050&seq=1&type=other
export const SPLIT_0050_PREVIOUS_TRADE = '2025-06-10'

export type PriceAdjustmentCheck = Pick<PriceAdjustment, 'date' | 'kind'> &
  (
    | {
        status: 'matched' | 'mismatch'
        previousDate: string
        previousClose: number
        beforePrice: number
      }
    | { status: 'unverified' }
  )

/** 以元為單位，事件價保留小數點後兩位所允許的最大四捨五入誤差。 */
const PRICE_ROUNDING_TOLERANCE = 0.005

type TradingBar = Pick<ETFData, 'date' | 'close' | 'volume'>

const isTrade = (bar: TradingBar | undefined): bar is TradingBar =>
  !!bar &&
  Number.isFinite(bar.close) &&
  bar.close > 0 &&
  Number.isFinite(bar.volume) &&
  bar.volume > 0

/**
 * 核對落在原始日 K 範圍內的事件前收盤價。輸入為依日期遞增的 0050 實際行情。
 * 沒有生效日或緊鄰的前一交易日行情時無法核對；不能用更早的收盤價判定不一致。
 */
export function reconcilePriceAdjustments(
  bars: readonly TradingBar[],
  adjustments: readonly PriceAdjustment[]
): PriceAdjustmentCheck[] {
  if (bars.length === 0) return []
  const firstDate = bars[0].date
  const lastDate = bars[bars.length - 1].date
  const indices = new Map(bars.map((bar, index) => [bar.date, index]))
  return adjustments
    .filter(({ date }) => date >= firstDate && date <= lastDate)
    .map(({ date, kind, beforePrice }): PriceAdjustmentCheck => {
      const unverified = { date, kind, status: 'unverified' } as const
      const index = indices.get(date)
      if (index === undefined || index === 0 || !isTrade(bars[index])) return unverified
      const previous = bars[index - 1]
      if (
        !isTrade(previous) ||
        beforePrice === undefined ||
        !Number.isFinite(beforePrice) ||
        beforePrice <= 0
      )
        return unverified

      // 日曆沒有涵蓋的年份只會略過週末。未見的平日一律當作資料缺口。
      const previousDay = fromLocalDateString(previous.date)
      const adjacent =
        kind === 'split' && date === KNOWN_SPLITS[0].date
          ? previous.date === SPLIT_0050_PREVIOUS_TRADE
          : TaiwanStockService.isTradingDay(previousDay) &&
            toLocalDateString(TaiwanStockService.getNextTradingDay(previousDay)) === date
      if (!adjacent) return unverified

      const epsilon = Number.EPSILON * Math.max(previous.close, beforePrice)
      const matches = Math.abs(previous.close - beforePrice) <= PRICE_ROUNDING_TOLERANCE + epsilon
      return {
        date,
        kind,
        status: matches ? 'matched' : 'mismatch',
        previousDate: previous.date,
        previousClose: previous.close,
        beforePrice,
      }
    })
}

export const hasPriceAdjustmentMismatch = (checks: readonly PriceAdjustmentCheck[]): boolean =>
  checks.some(check => check.status === 'mismatch')

/** 供技術指標與回測共用的事件核對說明。 */
export function formatPriceAdjustmentCheck(check: PriceAdjustmentCheck): string {
  const kind = check.kind === 'split' ? '分割' : '除息'
  if (check.status === 'unverified')
    return `${check.date} ${kind}未核對（缺相鄰交易日或事件前收）。`
  if (check.status === 'matched') return ''
  return `${check.date} ${kind}待查：事件前收 ${check.beforePrice} 元，${check.previousDate} 日 K 收盤 ${check.previousClose} 元。`
}

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
 * 套用行情範圍內的還原係數。bars 需依日期遞增；由最新一筆往回掃，係數隨著經過的生效日累乘。
 * 分割同時把成交量換算成分割後的股數；除息不影響成交量。不需調整的 K 棒原樣回傳。
 */
export function adjustBars(
  bars: readonly ETFData[],
  adjustments: readonly PriceAdjustment[]
): ETFData[] {
  if (bars.length === 0) return []
  const firstDate = bars[0].date
  const lastDate = bars[bars.length - 1].date
  const ordered = adjustments
    .filter(({ date }) => date > firstDate && date <= lastDate)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
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
