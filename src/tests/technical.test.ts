import { describe, it, expect } from 'vitest'
import { ETF_0050_ADJUSTMENTS, ETF_0050_BARS } from './fixtures/etf0050'
import { adjustBars } from '@/utils/priceAdjust'
import {
  MISSING,
  bollingerPercent,
  bollingerZone,
  buildTechnicalSnapshot,
  compositeSignal,
  formatLots,
  formatSigned,
  formatValue,
  kdCross,
  movingAverage,
  technicalReadings,
  type TechnicalSnapshot,
} from '@/utils/technical'
import type { ETFData } from '@/types'

const REAL = buildTechnicalSnapshot(adjustBars(ETF_0050_BARS, ETF_0050_ADJUSTMENTS))
const EMPTY = buildTechnicalSnapshot([])

/** 以實際快照為底，覆寫部分欄位來組出各種情境 */
const withValues = (overrides: Partial<TechnicalSnapshot>): TechnicalSnapshot => ({
  ...REAL,
  ...overrides,
})

const flatBars = (length: number): ETFData[] =>
  Array.from({ length }, (_, i) => ({
    date: new Date(Date.UTC(2025, 0, 1 + i)).toISOString().slice(0, 10),
    open: 100,
    high: 100,
    low: 100,
    close: 100,
    volume: 1000,
    change: 0,
    changePercent: 0,
  }))

describe('buildTechnicalSnapshot：0050 實際行情（2026-11-13）', () => {
  // 對照 toalpha.tw/stock/0050/technical 同一天顯示的數值
  it('KD(9,3,3) 與外部數值一致：K 71.1、D 52.8', () => {
    expect(REAL.date).toBe('2026-11-13')
    expect(REAL.close).toBe(102.5)
    expect(REAL.kd.k).toBeCloseTo(71.1, 1)
    expect(REAL.kd.d).toBeCloseTo(52.8, 1)
  })

  it('MACD(12,26,9) 與外部數值一致：DIF −2.57、MACD −2.55、柱 −0.02', () => {
    expect(REAL.macd.dif).toBeCloseTo(-2.57, 2)
    expect(REAL.macd.signal).toBeCloseTo(-2.55, 2)
    expect(REAL.macd.histogram).toBeCloseTo(-0.02, 2)
  })

  it('均線與外部數值一致：MA5 100.8、MA20 103.7、MA60 107.4', () => {
    expect(movingAverage(REAL, 5)).toBeCloseTo(100.8, 1)
    expect(movingAverage(REAL, 20)).toBeCloseTo(103.7, 1)
    expect(movingAverage(REAL, 60)).toBeCloseTo(107.4, 1)
    expect(movingAverage(REAL, 7)).toBeNull()
  })

  it('各指標落在定義的值域內', () => {
    expect(REAL.rsi.short).toBeGreaterThan(0)
    expect(REAL.rsi.long).toBeLessThan(100)
    expect(REAL.williamsR).toBeLessThanOrEqual(0)
    expect(REAL.williamsR).toBeGreaterThanOrEqual(-100)
    expect(REAL.atr).toBeGreaterThan(0)
    expect(REAL.bollinger.upper!).toBeGreaterThan(REAL.bollinger.lower!)
    expect(REAL.range52w!.position).toBeGreaterThanOrEqual(0)
    expect(REAL.range52w!.position).toBeLessThanOrEqual(100)
    expect(REAL.returns.map(item => item.months)).toEqual([1, 3, 6, 12])
    expect(REAL.returns.every(item => item.value !== null)).toBe(true)
  })

  it('還原除息後的一年報酬高於未還原（配息被算回來）', () => {
    const raw = buildTechnicalSnapshot(ETF_0050_BARS)
    expect(REAL.returns[3].value!).toBeGreaterThan(raw.returns[3].value!)
    // 最近 60 日內沒有除息，短天期指標不受影響
    expect(raw.kd.k).toBeCloseTo(REAL.kd.k!, 6)
  })
})

describe('buildTechnicalSnapshot：邊界', () => {
  it('沒有資料時所有數值為 null', () => {
    expect(EMPTY.date).toBeNull()
    expect(EMPTY.bars).toBe(0)
    expect(EMPTY.close).toBeNull()
    expect(EMPTY.kd).toEqual({ k: null, d: null, previousK: null, previousD: null })
    expect(EMPTY.macd.dif).toBeNull()
    expect(EMPTY.sar).toEqual({ value: null, rising: null })
    expect(EMPTY.range52w).toBeNull()
    expect(EMPTY.returns.every(item => item.value === null)).toBe(true)
    expect(EMPTY.ma.every(item => item.value === null)).toBe(true)
  })

  it('資料不足時只有算得出來的指標有值', () => {
    const snapshot = buildTechnicalSnapshot(adjustBars(ETF_0050_BARS.slice(-15), []))
    expect(movingAverage(snapshot, 5)).not.toBeNull()
    expect(snapshot.kd.k).not.toBeNull()
    expect(snapshot.rsi.short).not.toBeNull()
    expect(movingAverage(snapshot, 20)).toBeNull()
    expect(snapshot.macd.dif).toBeNull()
    expect(snapshot.dmi.adx).toBeNull()
    expect(snapshot.cci).toBeNull()
    expect(snapshot.range52w).toBeNull()
  })

  it('價格持平時不出現 NaN', () => {
    const snapshot = buildTechnicalSnapshot(flatBars(260))
    expect(snapshot.kd.k).toBe(50)
    expect(snapshot.rsi.long).toBe(50)
    expect(snapshot.macd.histogram).toBeCloseTo(0)
    expect(snapshot.cci).toBe(0)
    expect(snapshot.atr).toBe(0)
    expect(snapshot.dmi.adx).toBe(0)
    expect(snapshot.bias.short).toBe(0)
    expect(bollingerPercent(snapshot)).toBeNull()
    expect(JSON.stringify(snapshot)).not.toContain('NaN')
  })

  it('剔除開高低收缺值的 K 棒', () => {
    const broken = { ...ETF_0050_BARS[100], close: 0 }
    const bars = [...ETF_0050_BARS.slice(0, 100), broken, ...ETF_0050_BARS.slice(101)]
    expect(buildTechnicalSnapshot(bars).bars).toBe(ETF_0050_BARS.length - 1)
  })
})

describe('顯示格式', () => {
  it('缺值一律顯示「–」', () => {
    expect(formatValue(null)).toBe(MISSING)
    expect(formatSigned(null, 1, '%')).toBe(MISSING)
    expect(formatLots(null)).toBe(MISSING)
  })

  it('數值格式', () => {
    expect(formatValue(71.05, 1)).toBe('71.0')
    expect(formatSigned(1.234)).toBe('+1.23')
    expect(formatSigned(-8.81, 1, '%')).toBe('-8.8%')
    expect(formatSigned(0)).toBe('0.00')
    expect(formatLots(128607213)).toBe('12.9 萬張')
    expect(formatLots(1234567)).toBe('1,235 張')
  })
})

describe('判讀', () => {
  it('bollingerZone 依收盤價與上下軌判斷，算不出通道時為 null', () => {
    const bands = { upper: 110, middle: 100, lower: 90 }
    expect(bollingerZone(withValues({ close: 111, bollinger: bands }))).toBe('upper')
    expect(bollingerZone(withValues({ close: 89, bollinger: bands }))).toBe('lower')
    expect(bollingerZone(withValues({ close: 100, bollinger: bands }))).toBe('middle')
    expect(bollingerPercent(withValues({ close: 95, bollinger: bands }))).toBeCloseTo(25)
    expect(bollingerZone(EMPTY)).toBeNull()
  })

  it('kdCross 只在當天發生交叉時回報', () => {
    expect(kdCross({ k: 55, d: 50, previousK: 45, previousD: 48 })).toBe('golden')
    expect(kdCross({ k: 45, d: 50, previousK: 55, previousD: 52 })).toBe('death')
    expect(kdCross({ k: 60, d: 50, previousK: 55, previousD: 48 })).toBeNull()
    expect(kdCross({ k: 60, d: 50, previousK: null, previousD: null })).toBeNull()
  })

  it('technicalReadings 每項都有名稱、數值、狀態與白話說明', () => {
    const readings = technicalReadings(REAL)
    expect(readings.map(item => item.key)).toEqual([
      'kd',
      'macd',
      'rsi',
      'bollinger',
      'sar',
      'dmi',
      'bias',
      'williams',
      'cci',
      'atr',
      'obv',
      'volume',
    ])
    for (const reading of readings) {
      expect(reading.name).not.toBe('')
      expect(reading.description).not.toBe('')
      expect(reading.state).not.toBe('資料不足')
      expect(reading.values.every(value => value.text !== MISSING)).toBe(true)
    }
    const kd = readings[0]
    expect(kd.params).toBe('9, 3, 3')
    expect(kd.values.map(value => value.text)).toEqual(['71.1', '52.8'])
    expect(kd.state).toBe('K 在 D 之上')
  })

  it('沒有資料時數值顯示「–」、狀態為資料不足', () => {
    for (const reading of technicalReadings(EMPTY)) {
      expect(reading.state).toBe('資料不足')
      expect(reading.tone).toBe('ink')
      expect(reading.values.every(value => value.text === MISSING)).toBe(true)
    }
  })

  it('KD 狀態標出當日交叉與高低檔', () => {
    const [golden] = technicalReadings(
      withValues({ kd: { k: 85, d: 80, previousK: 70, previousD: 75 } })
    )
    expect(golden.state).toBe('K 今日向上穿過 D（黃金交叉），位於 80 以上高檔')
    expect(golden.tone).toBe('rise')
    const [death] = technicalReadings(
      withValues({ kd: { k: 15, d: 20, previousK: 30, previousD: 25 } })
    )
    expect(death.state).toBe('K 今日向下穿過 D（死亡交叉），位於 20 以下低檔')
    expect(death.tone).toBe('fall')
  })

  it('RSI、DMI 狀態依參考線判讀', () => {
    const find = (snapshot: TechnicalSnapshot, key: string) =>
      technicalReadings(snapshot).find(item => item.key === key)!
    expect(find(withValues({ rsi: { short: 90, long: 75 } }), 'rsi').tone).toBe('rise')
    expect(find(withValues({ rsi: { short: 10, long: 25 } }), 'rsi').tone).toBe('fall')
    expect(find(withValues({ dmi: { plusDi: 30, minusDi: 10, adx: 15 } }), 'dmi').state).toBe(
      'ADX 低於 20，沒有明顯趨勢'
    )
    expect(find(withValues({ dmi: { plusDi: 30, minusDi: 10, adx: 25 } }), 'dmi').tone).toBe('rise')
  })
})

describe('compositeSignal', () => {
  const bullish = withValues({
    close: 110,
    ma: [
      { period: 20, value: 105 },
      { period: 60, value: 100 },
    ],
    macd: { dif: 1, signal: 0.5, histogram: 0.5, previousHistogram: 0.4 },
    kd: { k: 70, d: 60, previousK: 65, previousD: 58 },
    rsi: { short: 65, long: 60 },
    dmi: { plusDi: 30, minusDi: 15, adx: 28 },
    sar: { value: 100, rising: true },
  })

  it('0050 實際行情：逐項列出依據，5 項偏空、2 項偏多 → 偏空', () => {
    const signal = compositeSignal(REAL)
    expect(signal.votes.map(vote => [vote.key, vote.vote])).toEqual([
      ['price', -1],
      ['trend', -1],
      ['macd', -1],
      ['kd', 1],
      ['rsi', -1],
      ['dmi', -1],
      ['sar', 1],
    ])
    expect(signal).toMatchObject({ label: '偏空', score: -3, bullish: 2, bearish: 5, neutral: 0 })
    expect(signal.votes[0].reading).toBe('收盤 102.50 低於 20 日均線 103.69')
    expect(signal.votes[3].reading).toBe('K 71.1 高於 D 52.8')
  })

  it('七項全部偏多 → 偏多', () => {
    expect(compositeSignal(bullish)).toMatchObject({ label: '偏多', score: 7, bullish: 7 })
  })

  it('多空相抵未達門檻 → 中性', () => {
    const mixed = withValues({
      ...bullish,
      kd: { k: 50, d: 60, previousK: 55, previousD: 62 },
      rsi: { short: 40, long: 45 },
      sar: { value: 120, rising: false },
    })
    expect(compositeSignal(mixed)).toMatchObject({
      label: '中性',
      score: 1,
      bullish: 4,
      bearish: 3,
    })
  })

  it('ADX 低於 20 時 DMI 投中立票', () => {
    const signal = compositeSignal(
      withValues({ ...bullish, dmi: { plusDi: 30, minusDi: 15, adx: 12 } })
    )
    expect(signal.votes.find(vote => vote.key === 'dmi')).toMatchObject({
      vote: 0,
      reading: 'ADX 12.0 低於 20，沒有明顯趨勢',
    })
    expect(signal.neutral).toBe(1)
  })

  it('算得出來的項目不足時不下結論', () => {
    const signal = compositeSignal(EMPTY)
    expect(signal.label).toBe('資料不足')
    expect(signal.votes.every(vote => vote.vote === null && vote.reading === '資料不足')).toBe(true)

    // 15 根 K 棒只有 KD、RSI、SAR 三項算得出來
    const short = compositeSignal(buildTechnicalSnapshot(ETF_0050_BARS.slice(-15)))
    expect(short.label).toBe('資料不足')
    expect(short.votes.filter(vote => vote.vote !== null)).toHaveLength(3)
  })
})
