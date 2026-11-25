import { describe, expect, it } from 'vitest'
import { atr, cci, rsi } from '@/utils/indicators'
import { adjustBars } from '@/utils/priceAdjust'
import { ETF_0050_ADJUSTMENTS, ETF_0050_BARS } from './fixtures/etf0050'
import reference from './fixtures/etf0050-talib.json'

const bars = adjustBars(ETF_0050_BARS, ETF_0050_ADJUSTMENTS)
const ABSOLUTE_TOLERANCE = 1e-8

describe('TA-Lib Python 0.6.8／C 0.6.4 逐日對照', () => {
  it('參考序列使用相同的 320 根 0050 日 K', () => {
    expect(bars).toHaveLength(320)
    expect(reference.rows.map(row => row[0])).toEqual(bars.map(bar => bar.date))
  })

  it.each([
    { name: 'ATR(14)', series: atr(bars, 14), column: 1, warmup: 14 },
    { name: 'CCI(20)', series: cci(bars, 20), column: 2, warmup: 19 },
    {
      name: 'RSI(6)',
      series: rsi(
        bars.map(bar => bar.close),
        6
      ),
      column: 3,
      warmup: 6,
    },
  ])('$name 暖機位置相同，逐日絕對誤差不超過 1e-8', ({ series, column, warmup }) => {
    expect(series).toHaveLength(reference.rows.length)
    expect(series.findIndex(value => value !== null)).toBe(warmup)
    reference.rows.forEach((row, index) => {
      const expected = row[column]
      const value = series[index]
      if (expected === null) {
        expect(value, String(row[0])).toBeNull()
      } else {
        expect(value, String(row[0])).not.toBeNull()
        expect(Math.abs(Number(value) - Number(expected)), String(row[0])).toBeLessThanOrEqual(
          ABSOLUTE_TOLERANCE
        )
      }
    })
  })

  it('收盤連續持平時仍保留暖機期，TA-Lib 回傳 0，Lucky50 採中性值 50', () => {
    const { close, length, values } = reference.flatRsi6
    const actual = rsi(Array<number>(length).fill(close), 6)
    expect(values).toEqual([...Array(6).fill(null), ...Array(length - 6).fill(0)])
    expect(actual).toEqual([...Array(6).fill(null), ...Array(length - 6).fill(50)])
  })
})
