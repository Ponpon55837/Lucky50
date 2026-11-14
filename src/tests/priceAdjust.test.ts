import { describe, it, expect } from 'vitest'
import {
  adjustBars,
  dividendFactor,
  splitFactor,
  KNOWN_SPLITS,
  type PriceAdjustment,
} from '@/utils/priceAdjust'
import type { ETFData } from '@/types'

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
    adjustBars(bars, [{ date: '2027-01-01', kind: 'split', factor: 0.5 }])
    expect(bars[0].close).toBe(100)
  })
})
