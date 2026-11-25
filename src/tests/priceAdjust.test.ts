import { describe, it, expect } from 'vitest'
import {
  adjustBars,
  dividendFactor,
  formatPriceAdjustmentCheck,
  hasPriceAdjustmentMismatch,
  reconcilePriceAdjustments,
  splitFactor,
  KNOWN_SPLITS,
  type PriceAdjustment,
} from '@/utils/priceAdjust'
import type { ETFData } from '@/types'
import { ETF_0050_BARS } from './fixtures/etf0050'

const bar = (date: string, close: number, volume = 1000): ETFData => ({
  date,
  open: close,
  high: close + 1,
  low: close - 1,
  close,
  volume,
  change: 2,
  changePercent: 1,
})

const julyDividend: PriceAdjustment = {
  date: '2026-07-21',
  kind: 'dividend',
  factor: 98.6 / 99.2,
  beforePrice: 99.2,
  referencePrice: 98.6,
}

describe('reconcilePriceAdjustments', () => {
  it('0050 分割以前一個實際交易日（6 月 10 日）核對，保留新價格的開盤跳空', () => {
    // FinMind TaiwanStockPrice 0050，2025-06-10 至 2025-06-18。
    const rawBars = [
      { ...bar('2025-06-10', 188.65, 31_483_080), open: 184.9, high: 188.9, low: 184.9 },
      { ...bar('2025-06-18', 47.57, 252_639_825), open: 47.5, high: 47.72, low: 47.14 },
    ]
    expect(reconcilePriceAdjustments(rawBars, KNOWN_SPLITS)).toEqual([
      {
        date: '2025-06-18',
        kind: 'split',
        status: 'matched',
        previousDate: '2025-06-10',
        previousClose: 188.65,
        beforePrice: 188.65,
      },
    ])
    const [before, after] = adjustBars(rawBars, KNOWN_SPLITS)
    expect(before.close).toBeCloseTo(47.1625, 8)
    expect(before.volume).toBe(rawBars[0].volume * 4)
    expect(after).toBe(rawBars[1])
  })

  it('0050 除息前收與原始日 K 核對，還原後前收對應除息參考價', () => {
    const rawBars = ETF_0050_BARS.filter(
      ({ date }) => date >= '2026-07-20' && date <= julyDividend.date
    )
    const checks = reconcilePriceAdjustments(rawBars, [julyDividend])
    expect(checks).toEqual([
      {
        date: julyDividend.date,
        kind: 'dividend',
        status: 'matched',
        previousDate: '2026-07-20',
        previousClose: 99.2,
        beforePrice: 99.2,
      },
    ])
    expect(hasPriceAdjustmentMismatch(checks)).toBe(false)
    const [before, after] = adjustBars(rawBars, [julyDividend])
    expect(before.close).toBeCloseTo(98.6, 8)
    expect(after.open).toBe(100)
    expect(after.close).toBe(102.5)
  })

  it('允許半分四捨五入誤差，超出時列出兩個來源的前收', () => {
    const rawBars = [bar('2026-07-20', 99.2), bar('2026-07-21', 102.5)]
    const [rounded, mismatched] = reconcilePriceAdjustments(rawBars, [
      { ...julyDividend, beforePrice: 99.205 },
      { ...julyDividend, beforePrice: 99.21 },
    ])
    expect(rounded.status).toBe('matched')
    expect(mismatched.status).toBe('mismatch')
    expect(hasPriceAdjustmentMismatch([mismatched])).toBe(true)
    expect(formatPriceAdjustmentCheck(mismatched)).toContain(
      '除息待查：事件前收 99.21 元，2026-07-20 日 K 收盤 99.2 元'
    )
  })

  it('涵蓋日曆的週末與休市會跳過，未提供的平日行情則不假設連續', () => {
    const rawBars = [bar('2026-06-18', 99.2), bar('2026-06-22', 102.5)]
    // 6 月 19 日為端午節，6 月 22 日為下一個交易日。
    const [holiday, missing] = reconcilePriceAdjustments(
      [...rawBars, bar('2026-06-24', 105)],
      [
        { ...julyDividend, date: '2026-06-22' },
        { ...julyDividend, date: '2026-06-24' },
      ]
    )
    expect(holiday.status).toBe('matched')
    expect(missing.status).toBe('unverified')
  })

  it('缺少生效日、前收資料或可成交量時保留未核對狀態', () => {
    const before = bar('2026-07-20', 99.2)
    const after = bar('2026-07-21', 102.5)
    const cases = [
      reconcilePriceAdjustments([before, bar('2026-07-22', 103.85)], [julyDividend]),
      reconcilePriceAdjustments([after], [julyDividend]),
      reconcilePriceAdjustments([before, after], [{ ...julyDividend, beforePrice: undefined }]),
      reconcilePriceAdjustments([{ ...before, volume: 0 }, after], [julyDividend]),
    ]
    for (const checks of cases) {
      expect(checks).toEqual([{ date: julyDividend.date, kind: 'dividend', status: 'unverified' }])
      expect(hasPriceAdjustmentMismatch(checks)).toBe(false)
    }
    expect(reconcilePriceAdjustments([before], [julyDividend])).toEqual([])
    expect(reconcilePriceAdjustments([], [julyDividend])).toEqual([])
  })
})

describe('splitFactor', () => {
  it('參考價的進位誤差取整數比例：188.65 → 47.16 視為 1 拆 4', () => {
    expect(splitFactor(188.65, 47.16)).toBe(0.25)
  })

  it('反分割（合併）回傳大於 1 的整數係數', () => {
    expect(splitFactor(5.01, 50)).toBe(10)
  })

  it('不是整數比例時保留實際比例', () => {
    expect(splitFactor(150, 100)).toBeCloseTo(1 / 1.5)
  })

  it('缺值或非正數回傳 null', () => {
    expect(splitFactor(0, 47.16)).toBeNull()
    expect(splitFactor(188.65, NaN)).toBeNull()
  })
})

describe('dividendFactor', () => {
  it('係數為除息參考價 ÷ 除息前收盤價', () => {
    expect(dividendFactor(99.2, 98.6)).toBeCloseTo(98.6 / 99.2)
  })

  it('缺值、參考價不低於收盤價時回傳 null', () => {
    expect(dividendFactor(0, 98.6)).toBeNull()
    expect(dividendFactor(99.2, 99.2)).toBeNull()
    expect(dividendFactor(99.2, NaN)).toBeNull()
  })
})

describe('adjustBars', () => {
  it('分割：生效日之前的價格乘係數、成交量換算成分割後股數，生效日當天起不動', () => {
    const bars = [bar('2025-06-17', 188), bar('2025-06-18', 47)]
    const [before, after] = adjustBars(bars, KNOWN_SPLITS)
    expect(before).toMatchObject({ open: 47, high: 47.25, low: 46.75, close: 47, volume: 4000 })
    expect(before.change).toBe(0.5)
    expect(before.changePercent).toBe(1)
    expect(after).toBe(bars[1])
  })

  it('除息：只調整價格，成交量不變', () => {
    const adjustments: PriceAdjustment[] = [{ date: '2026-07-21', kind: 'dividend', factor: 0.99 }]
    const [before, after] = adjustBars([bar('2026-07-20', 100), bar('2026-07-21', 99)], adjustments)
    expect(before.close).toBeCloseTo(99)
    expect(before.volume).toBe(1000)
    expect(after.close).toBe(99)
  })

  it('多次調整的係數連乘，且不受傳入順序影響', () => {
    const adjustments: PriceAdjustment[] = [
      { date: '2026-01-22', kind: 'dividend', factor: 0.98 },
      { date: '2025-06-18', kind: 'split', factor: 0.25 },
    ]
    const bars = [bar('2025-06-01', 200), bar('2025-12-01', 60), bar('2026-02-01', 70)]
    const result = adjustBars(bars, adjustments)
    expect(result[0].close).toBeCloseTo(200 * 0.25 * 0.98)
    expect(result[0].volume).toBe(4000)
    expect(result[1].close).toBeCloseTo(60 * 0.98)
    expect(result[1].volume).toBe(1000)
    expect(result[2]).toBe(bars[2])
  })

  it('還原後除息日前後的報酬等於「含息」報酬', () => {
    // 除息前收 100、配息 2（參考價 98），除息日收 98：實際沒有漲跌
    const factor = dividendFactor(100, 98)!
    const [before, after] = adjustBars(
      [bar('2026-07-20', 100), bar('2026-07-21', 98)],
      [{ date: '2026-07-21', kind: 'dividend', factor }]
    )
    expect(after.close / before.close - 1).toBeCloseTo(0)
  })

  it('沒有調整或空資料時原樣回傳內容，不改動傳入陣列', () => {
    const bars = [bar('2026-01-01', 100)]
    expect(adjustBars(bars, [])).toEqual(bars)
    expect(adjustBars([], KNOWN_SPLITS)).toEqual([])
    expect(bars[0].close).toBe(100)
  })

  it('資料只到生效日前時，最後一根與更早日 K 維持原始價量', () => {
    const bars = [bar('2025-06-09', 183.7), bar('2025-06-10', 188.65)]
    expect(adjustBars(bars, KNOWN_SPLITS)).toEqual(bars)
    expect(adjustBars(bars, KNOWN_SPLITS)[1]).toBe(bars[1])
  })
})
