import { describe, it, expect } from 'vitest'
import {
  atr,
  bias,
  bollinger,
  cci,
  dmi,
  ema,
  isSortedByDate,
  isValidBar,
  macd,
  monthsBefore,
  obv,
  parabolicSar,
  periodReturn,
  rangePosition,
  rsi,
  sma,
  stochasticKD,
  williamsR,
  type Series,
} from '@/utils/indicators'
import type { ETFData } from '@/types'

const bar = (
  date: string,
  close: number,
  high = close,
  low = close,
  volume = 1000,
  open = close
): ETFData => ({ date, open, high, low, close, volume, change: 0, changePercent: 0 })

const day = (i: number) => {
  const date = new Date(Date.UTC(2024, 0, 1 + i))
  return date.toISOString().slice(0, 10)
}
const series = (closes: number[]) => closes.map((c, i) => bar(day(i), c, c + 1, c - 1))

/** 固定種子的亂數（LCG），讓隨機走勢每次都一樣 */
function randomWalk(length: number, seed = 7): ETFData[] {
  let state = seed
  const next = () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
  let close = 100
  return Array.from({ length }, (_, i) => {
    const open = close
    close = Math.max(1, close + (next() - 0.5) * 4)
    const high = Math.max(open, close) + next() * 2
    const low = Math.min(open, close) - next() * 2
    return bar(day(i), close, high, low, Math.round(next() * 1e6) + 1, open)
  })
}

const WALK = randomWalk(120)
const WALK_CLOSES = WALK.map(item => item.close)

/** 逐一比對兩條序列：null 的位置要相同，數值要相近 */
function expectSeriesClose(actual: Series, expected: Series, digits = 8) {
  expect(actual).toHaveLength(expected.length)
  expected.forEach((value, i) => {
    if (value === null) expect(actual[i]).toBeNull()
    else expect(actual[i]).toBeCloseTo(value, digits)
  })
}

const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length

/** 每個視窗重新走訪一次的對照寫法 */
function windowed(length: number, period: number, compute: (start: number, end: number) => number) {
  return Array.from({ length }, (_, i) => (i < period - 1 ? null : compute(i - period + 1, i)))
}

describe('isSortedByDate／isValidBar', () => {
  it('isSortedByDate 偵測排序狀態', () => {
    expect(isSortedByDate(series([1, 2, 3]))).toBe(true)
    expect(isSortedByDate([bar('2024-01-02', 1), bar('2024-01-01', 1)])).toBe(false)
  })

  it('isValidBar 排除缺值（0、NaN）與高低顛倒的 K 棒', () => {
    expect(isValidBar(bar('2024-01-01', 100, 101, 99))).toBe(true)
    expect(isValidBar(bar('2024-01-01', 0))).toBe(false)
    expect(isValidBar(bar('2024-01-01', NaN))).toBe(false)
    expect(isValidBar(bar('2024-01-01', 100, 99, 101))).toBe(false)
  })
})

describe('均線', () => {
  it('sma 手算：暖機期為 null', () => {
    expect(sma([1, 2, 3, 4, 5], 3)).toEqual([null, null, 2, 3, 4])
    expect(sma([1, 2], 3)).toEqual([null, null])
    expect(sma([], 3)).toEqual([])
  })

  it('sma 視窗累加與每個視窗重算一致', () => {
    const expected = windowed(WALK.length, 20, (start, end) =>
      mean(WALK_CLOSES.slice(start, end + 1))
    )
    expectSeriesClose(sma(WALK_CLOSES, 20), expected)
  })

  it('ema 手算：以前 period 筆平均為起點，α = 2 ÷ (period + 1)', () => {
    // 起點 (1+2+3)/3 = 2；α = 0.5 → 2 + 0.5×(4−2) = 3 → 3 + 0.5×(5−3) = 4
    expect(ema([1, 2, 3, 4, 5], 3)).toEqual([null, null, 2, 3, 4])
    expect(ema([1, 2], 3)).toEqual([null, null])
  })

  it('ema 持平序列維持原值', () => {
    expect(ema(Array(30).fill(42), 12).at(-1)).toBeCloseTo(42)
  })

  it('bias 是收盤價偏離均線的百分比', () => {
    // 均線 (10+10+13)/3 = 11，(13−11)/11 = 18.18%
    expect(bias([10, 10, 13], 3).at(-1)).toBeCloseTo(18.1818, 3)
    expect(bias([10, 10], 3)).toEqual([null, null])
  })
})

describe('rsi（Wilder 平滑）', () => {
  // Wilder 平滑的常見範例數列（14 日）
  const closes = [
    44.34, 44.09, 44.15, 43.61, 44.33, 44.83, 45.1, 45.42, 45.84, 46.08, 45.89, 46.03, 45.61, 46.28,
    46.28, 46.0, 46.03, 46.41, 46.22, 45.64, 46.21,
  ]

  it('第一個值手算：前 14 筆漲幅合計 3.34、跌幅合計 1.40', () => {
    const result = rsi(closes, 14)
    expect(result.slice(0, 14)).toEqual(Array(14).fill(null))
    expect(result[14]).toBeCloseTo((100 * 3.34) / (3.34 + 1.4), 6)
    expect(result[14]).toBeCloseTo(70.46, 2)
  })

  it('後續值以 1/14 遞迴平滑，與總和形式的寫法一致', () => {
    // 另一種寫法：先列出每日漲跌，再用 avg = (前一日 avg × 13 + 當日) ÷ 14
    const period = 14
    const gains = closes.map((close, i) => (i === 0 ? 0 : Math.max(close - closes[i - 1], 0)))
    const losses = closes.map((close, i) => (i === 0 ? 0 : Math.max(closes[i - 1] - close, 0)))
    let avgGain = mean(gains.slice(1, period + 1))
    let avgLoss = mean(losses.slice(1, period + 1))
    const expected: Series = Array(period).fill(null)
    expected.push(100 - 100 / (1 + avgGain / avgLoss))
    for (let i = period + 1; i < closes.length; i++) {
      avgGain = (avgGain * (period - 1) + gains[i]) / period
      avgLoss = (avgLoss * (period - 1) + losses[i]) / period
      expected.push(100 - 100 / (1 + avgGain / avgLoss))
    }
    expectSeriesClose(rsi(closes, period), expected)
    expect(
      rsi(closes, period)
        .slice(15)
        .map(value => Number(value?.toFixed(2)))
    ).toEqual([66.25, 66.48, 69.35, 66.29, 57.92, 62.88])
  })

  it('邊界：資料不足為 null、全漲 100、全跌 0、持平 50', () => {
    expect(rsi([1, 2, 3], 6)).toEqual([null, null, null])
    expect(rsi([1, 2, 3, 4, 5, 6, 7], 6).at(-1)).toBe(100)
    expect(rsi([7, 6, 5, 4, 3, 2, 1], 6).at(-1)).toBe(0)
    expect(rsi(Array(10).fill(10), 6).at(-1)).toBe(50)
  })
})

describe('macd', () => {
  it('DIF、訊號線、柱三條序列的暖機期與關係', () => {
    const { dif, signal, histogram } = macd(WALK_CLOSES)
    // DIF 要等 26 日 EMA，訊號線再等 9 個 DIF
    expect(dif[24]).toBeNull()
    expect(dif[25]).not.toBeNull()
    expect(signal[32]).toBeNull()
    expect(signal[33]).not.toBeNull()
    expect(histogram[32]).toBeNull()

    const fast = ema(WALK_CLOSES, 12)
    const slow = ema(WALK_CLOSES, 26)
    for (let i = 33; i < WALK.length; i++) {
      expect(dif[i]).toBeCloseTo(fast[i]! - slow[i]!, 10)
      expect(histogram[i]).toBeCloseTo(dif[i]! - signal[i]!, 10)
    }
    // 訊號線起點是前 9 個 DIF 的平均
    expect(signal[33]).toBeCloseTo(mean(dif.slice(25, 34) as number[]), 10)
  })

  it('持平為 0、上升趨勢 DIF 為正、資料不足全為 null', () => {
    const flat = macd(Array(60).fill(42))
    expect(flat.dif.at(-1)).toBeCloseTo(0)
    expect(flat.histogram.at(-1)).toBeCloseTo(0)
    expect(macd(Array.from({ length: 60 }, (_, i) => 100 + i)).dif.at(-1)).toBeGreaterThan(0)
    const short = macd([1, 2, 3])
    expect(short.dif).toEqual([null, null, null])
    expect(short.signal).toEqual([null, null, null])
  })
})

describe('bollinger', () => {
  it('手算：中軌為均線，上下軌加減 2 倍母體標準差', () => {
    // [2,4,4,4,5,5,7,9] 平均 5、母體標準差 2
    const { middle, upper, lower } = bollinger([2, 4, 4, 4, 5, 5, 7, 9], 8, 2)
    expect(middle.at(-1)).toBeCloseTo(5)
    expect(upper.at(-1)).toBeCloseTo(9)
    expect(lower.at(-1)).toBeCloseTo(1)
    expect(middle.slice(0, 7)).toEqual(Array(7).fill(null))
  })

  it('視窗累加與每個視窗重算一致', () => {
    const period = 20
    const deviation = (start: number, end: number) => {
      const slice = WALK_CLOSES.slice(start, end + 1)
      const average = mean(slice)
      return Math.sqrt(mean(slice.map(value => (value - average) ** 2)))
    }
    const { upper, lower } = bollinger(WALK_CLOSES, period, 2)
    expectSeriesClose(
      upper,
      windowed(
        WALK.length,
        period,
        (s, e) => mean(WALK_CLOSES.slice(s, e + 1)) + 2 * deviation(s, e)
      ),
      6
    )
    expectSeriesClose(
      lower,
      windowed(
        WALK.length,
        period,
        (s, e) => mean(WALK_CLOSES.slice(s, e + 1)) - 2 * deviation(s, e)
      ),
      6
    )
  })

  it('持平時上下軌重合', () => {
    const { upper, lower } = bollinger(Array(20).fill(100))
    expect(upper.at(-1)).toBe(100)
    expect(lower.at(-1)).toBe(100)
  })
})

describe('stochasticKD／williamsR', () => {
  const highest = (start: number, end: number) =>
    Math.max(...WALK.slice(start, end + 1).map(item => item.high))
  const lowest = (start: number, end: number) =>
    Math.min(...WALK.slice(start, end + 1).map(item => item.low))

  it('KD 單調佇列結果與每個視窗重掃的暴力解一致', () => {
    const period = 9
    let k = 50
    let d = 50
    const expectedK: Series = []
    const expectedD: Series = []
    WALK.forEach((item, i) => {
      if (i < period - 1) {
        expectedK.push(null)
        expectedD.push(null)
        return
      }
      const hi = highest(i - period + 1, i)
      const lo = lowest(i - period + 1, i)
      const rsv = ((item.close - lo) / (hi - lo)) * 100
      k = (2 / 3) * k + rsv / 3
      d = (2 / 3) * d + k / 3
      expectedK.push(k)
      expectedD.push(d)
    })
    const result = stochasticKD(WALK)
    expectSeriesClose(result.k, expectedK)
    expectSeriesClose(result.d, expectedD)
  })

  it('KD 手算第一個值：RSV 100 → K = 50×2/3 + 100/3，D = 50×2/3 + K/3', () => {
    // 9 根 K 棒收在區間最高點
    const data = Array.from({ length: 9 }, (_, i) => bar(day(i), 10 + i, 10 + i, 9 + i))
    const { k, d } = stochasticKD(data)
    expect(k.slice(0, 8)).toEqual(Array(8).fill(null))
    expect(k[8]).toBeCloseTo(66.6667, 3)
    expect(d[8]).toBeCloseTo(55.5556, 3)
  })

  it('KD 持平（沒有高低差）時 RSV 視為 50，K、D 維持 50', () => {
    const { k, d } = stochasticKD(Array.from({ length: 12 }, (_, i) => bar(day(i), 100)))
    expect(k.at(-1)).toBe(50)
    expect(d.at(-1)).toBe(50)
  })

  it('KD 資料不足全為 null', () => {
    expect(stochasticKD(series([1, 2, 3])).k).toEqual([null, null, null])
  })

  it('威廉 %R 與暴力解一致，且等於 RSV − 100', () => {
    const period = 14
    const expected = windowed(WALK.length, period, (start, end) => {
      const hi = highest(start, end)
      const lo = lowest(start, end)
      return ((hi - WALK[end].close) / (hi - lo)) * -100
    })
    expectSeriesClose(williamsR(WALK, period), expected)
  })

  it('威廉 %R 手算：收在最高為 0、收在最低為 −100、持平為 −50', () => {
    const top = Array.from({ length: 14 }, (_, i) => bar(day(i), 10 + i, 10 + i, 9 + i))
    expect(williamsR(top).at(-1)).toBeCloseTo(0)
    const bottom = Array.from({ length: 14 }, (_, i) => bar(day(i), 30 - i, 31 - i, 30 - i))
    expect(williamsR(bottom).at(-1)).toBeCloseTo(-100)
    expect(williamsR(Array.from({ length: 14 }, (_, i) => bar(day(i), 100))).at(-1)).toBe(-50)
  })
})

describe('cci', () => {
  it('樹狀陣列版本與每個視窗重算平均絕對差的暴力解一致', () => {
    const period = 20
    const typical = WALK.map(item => (item.high + item.low + item.close) / 3)
    const expected = windowed(WALK.length, period, (start, end) => {
      const slice = typical.slice(start, end + 1)
      const average = mean(slice)
      const deviation = mean(slice.map(value => Math.abs(value - average)))
      return (typical[end] - average) / (0.015 * deviation)
    })
    expectSeriesClose(cci(WALK, period), expected, 6)
  })

  it('手算：典型價 [1,2,3,4,10]，平均 4、平均絕對差 2.4', () => {
    const data = [1, 2, 3, 4, 10].map((price, i) => bar(day(i), price))
    // (10 − 4) ÷ (0.015 × 2.4) = 166.67
    expect(cci(data, 5).at(-1)).toBeCloseTo(166.6667, 3)
    expect(cci(data, 5).slice(0, 4)).toEqual([null, null, null, null])
  })

  it('有重複數值、持平時不出錯：持平為 0', () => {
    expect(cci(Array.from({ length: 25 }, (_, i) => bar(day(i), 100))).at(-1)).toBe(0)
  })
})

describe('atr／dmi', () => {
  const trueRanges = WALK.map((item, i) =>
    i === 0
      ? 0
      : Math.max(
          item.high - item.low,
          Math.abs(item.high - WALK[i - 1].close),
          Math.abs(item.low - WALK[i - 1].close)
        )
  )

  it('ATR 手算：真實波幅取三者最大，前 period 筆平均後 Wilder 平滑', () => {
    const data = [
      bar(day(0), 10, 11, 9),
      bar(day(1), 12, 13, 11), // TR = max(2, |13−10|, |11−10|) = 3
      bar(day(2), 11, 12, 10), // TR = max(2, |12−12|, |10−12|) = 2
      bar(day(3), 15, 16, 11), // TR = max(5, |16−11|, |11−11|) = 5
    ]
    const result = atr(data, 2)
    expect(result[0]).toBeNull()
    expect(result[1]).toBeNull()
    expect(result[2]).toBeCloseTo(2.5) // (3 + 2) ÷ 2
    expect(result[3]).toBeCloseTo(3.75) // (2.5 × 1 + 5) ÷ 2
  })

  it('ATR 與總和形式的寫法一致', () => {
    const period = 14
    let value = mean(trueRanges.slice(1, period + 1))
    const expected: Series = Array(period).fill(null)
    expected.push(value)
    for (let i = period + 1; i < WALK.length; i++) {
      value = (value * (period - 1) + trueRanges[i]) / period
      expected.push(value)
    }
    expectSeriesClose(atr(WALK, period), expected)
  })

  it('DMI 與 Wilder 原始的累加形式（S = S − S/n + x）一致', () => {
    const period = 14
    const plusMoves = WALK.map((item, i) => {
      if (i === 0) return 0
      const up = item.high - WALK[i - 1].high
      const down = WALK[i - 1].low - item.low
      return up > down && up > 0 ? up : 0
    })
    const minusMoves = WALK.map((item, i) => {
      if (i === 0) return 0
      const up = item.high - WALK[i - 1].high
      const down = WALK[i - 1].low - item.low
      return down > up && down > 0 ? down : 0
    })
    const sum = (values: number[]) => values.reduce((total, value) => total + value, 0)
    let rangeSum = sum(trueRanges.slice(1, period + 1))
    let plusSum = sum(plusMoves.slice(1, period + 1))
    let minusSum = sum(minusMoves.slice(1, period + 1))
    const expectedPlus: Series = Array(period).fill(null)
    const expectedMinus: Series = Array(period).fill(null)
    const dx: number[] = []
    for (let i = period; i < WALK.length; i++) {
      if (i > period) {
        rangeSum = rangeSum - rangeSum / period + trueRanges[i]
        plusSum = plusSum - plusSum / period + plusMoves[i]
        minusSum = minusSum - minusSum / period + minusMoves[i]
      }
      const plus = (100 * plusSum) / rangeSum
      const minus = (100 * minusSum) / rangeSum
      expectedPlus.push(plus)
      expectedMinus.push(minus)
      dx.push((100 * Math.abs(plus - minus)) / (plus + minus))
    }
    const expectedAdx: Series = Array(2 * period - 1).fill(null)
    let adx = mean(dx.slice(0, period))
    expectedAdx.push(adx)
    for (let i = period; i < dx.length; i++) {
      adx = (adx * (period - 1) + dx[i]) / period
      expectedAdx.push(adx)
    }

    const result = dmi(WALK, period)
    expectSeriesClose(result.plusDi, expectedPlus)
    expectSeriesClose(result.minusDi, expectedMinus)
    expectSeriesClose(result.adx, expectedAdx)
  })

  it('一路上漲：+DI 大於 −DI、−DI 為 0、ADX 為 100', () => {
    const data = Array.from({ length: 40 }, (_, i) => bar(day(i), 10 + i, 11 + i, 9 + i))
    const { plusDi, minusDi, adx } = dmi(data, 14)
    expect(plusDi.at(-1)).toBeGreaterThan(0)
    expect(minusDi.at(-1)).toBe(0)
    expect(adx.at(-1)).toBeCloseTo(100)
  })

  it('持平：ATR 0、±DI 0、ADX 0，不出現 NaN', () => {
    const data = Array.from({ length: 40 }, (_, i) => bar(day(i), 100))
    expect(atr(data).at(-1)).toBe(0)
    const { plusDi, minusDi, adx } = dmi(data)
    expect(plusDi.at(-1)).toBe(0)
    expect(minusDi.at(-1)).toBe(0)
    expect(adx.at(-1)).toBe(0)
  })

  it('資料不足全為 null', () => {
    expect(atr(series([1, 2, 3]))).toEqual([null, null, null])
    expect(dmi(series([1, 2, 3])).adx).toEqual([null, null, null])
  })
})

describe('parabolicSar', () => {
  it('手算上行段：SAR 往最高價靠近、不高於前兩日低點，加速因子每創新高加 0.02', () => {
    const data = [
      bar(day(0), 10, 10.5, 9.5),
      bar(day(1), 11, 11.5, 10.5),
      bar(day(2), 12, 12.5, 11.5),
      bar(day(3), 13, 13.5, 12.5),
    ]
    const { value, rising } = parabolicSar(data)
    expect(value[0]).toBeNull()
    expect(rising[0]).toBeNull()
    // 第二根中價較高 → 上行，SAR 起點為第一根低點 9.5，極值 11.5
    expect(value[1]).toBe(9.5)
    expect(rising[1]).toBe(true)
    // 9.5 + 0.02 × (11.5 − 9.5) = 9.54，但不得高於前兩日低點（9.5）→ 9.5；創新高 12.5，加速因子變 0.04
    expect(value[2]).toBeCloseTo(9.5)
    // 9.5 + 0.04 × (12.5 − 9.5) = 9.62（低於前兩日低點 10.5、11.5，不受限）
    expect(value[3]).toBeCloseTo(9.62)
    expect(rising[3]).toBe(true)
  })

  it('跌破 SAR 時翻轉：SAR 跳到先前的最高價，方向改為下行', () => {
    const data = [
      bar(day(0), 10, 10.5, 9.5),
      bar(day(1), 11, 11.5, 10.5),
      bar(day(2), 12, 12.5, 11.5),
      bar(day(3), 8, 9, 7),
    ]
    const { value, rising } = parabolicSar(data)
    expect(rising[3]).toBe(false)
    expect(value[3]).toBe(12.5)
  })

  it('上行時 SAR 在最低價之下、下行時在最高價之上（翻轉當日除外）', () => {
    const { value, rising } = parabolicSar(WALK)
    for (let i = 2; i < WALK.length; i++) {
      if (rising[i] !== rising[i - 1]) continue
      if (rising[i]) expect(value[i]!).toBeLessThanOrEqual(WALK[i].low)
      else expect(value[i]!).toBeGreaterThanOrEqual(WALK[i].high)
    }
  })

  it('資料不足兩根時全為 null', () => {
    expect(parabolicSar([bar(day(0), 10)]).value).toEqual([null])
    expect(parabolicSar([]).value).toEqual([])
  })
})

describe('obv', () => {
  it('收漲加量、收跌減量、平盤不動', () => {
    const data = [
      bar(day(0), 10, 10, 10, 100),
      bar(day(1), 11, 11, 11, 200),
      bar(day(2), 11, 11, 11, 300),
      bar(day(3), 9, 9, 9, 400),
    ]
    expect(obv(data)).toEqual([0, 200, 200, -200])
    expect(obv([])).toEqual([])
  })
})

describe('相對位置', () => {
  it('monthsBefore 跨年、月底不存在的日期退到該月最後一天', () => {
    expect(monthsBefore('2026-11-13', 1)).toBe('2026-10-13')
    expect(monthsBefore('2026-01-15', 1)).toBe('2025-12-15')
    expect(monthsBefore('2026-03-31', 1)).toBe('2026-02-28')
    expect(monthsBefore('2024-03-31', 1)).toBe('2024-02-29')
    expect(monthsBefore('2026-11-13', 12)).toBe('2025-11-13')
  })

  const monthly = [
    bar('2026-08-13', 80, 82, 78),
    bar('2026-09-11', 90, 95, 88),
    bar('2026-10-12', 100, 120, 99),
    bar('2026-10-14', 105, 106, 104),
    bar('2026-11-13', 110, 111, 109),
  ]

  it('periodReturn 以 N 個月前（休市則往前找）的收盤價為基準', () => {
    // 一個月前是 10-13，沒有交易 → 取 10-12 的 100
    expect(periodReturn(monthly, 1)).toBeCloseTo(10)
    // 三個月前 08-13 的 80
    expect(periodReturn(monthly, 3)).toBeCloseTo(37.5)
  })

  it('periodReturn 資料沒有涵蓋到那一天時為 null', () => {
    expect(periodReturn(monthly, 6)).toBeNull()
    expect(periodReturn([], 1)).toBeNull()
  })

  it('rangePosition 取期間內（不含起算日當天）的最高、最低價與目前位置', () => {
    // 一個月：10-12 之後的 K 棒 → 高 111、低 104，收 110 → (110−104)/(111−104)
    const range = rangePosition(monthly, 1)
    expect(range).toEqual({ high: 111, low: 104, position: expect.closeTo(85.714, 2) })
  })

  it('rangePosition 資料未涵蓋整段期間時為 null', () => {
    expect(rangePosition(monthly, 12)).toBeNull()
    expect(rangePosition([])).toBeNull()
  })
})
