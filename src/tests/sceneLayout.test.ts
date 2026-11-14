import { describe, it, expect } from 'vitest'
import {
  CONTROL_STAR,
  bollingerZone,
  candleLayout,
  elementPillars,
  fitDistance,
  macdRatio,
  movingAverage,
  niceTicks,
  oscillatorState,
  overallSignal,
  ringPosition,
  toneOf,
} from '@/utils/sceneLayout'
import { controls, ELEMENT_CYCLE } from '@/utils/ganzhi'
import { seasonalStrength } from '@/utils/almanac'
import type { ETFData } from '@/types'

const day = (date: string, open: number, high: number, low: number, close: number, volume = 1000) =>
  ({ date, open, high, low, close, volume }) as ETFData

describe('toneOf', () => {
  it('漲紅跌綠、平盤', () => {
    expect(toneOf(1.2)).toBe('rise')
    expect(toneOf(-0.1)).toBe('fall')
    expect(toneOf(0)).toBe('flat')
  })
})

describe('fitDistance', () => {
  it('單點在視角邊緣：距離 = 偏移 / tan(半視角)', () => {
    const d = fitDistance([[0, 1, 0]], 90, 1, 1)
    expect(d).toBeCloseTo(1)
  })

  it('寬畫面由垂直方向決定、窄畫面由水平方向決定', () => {
    const box: [number, number, number][] = [
      [-4, -1, 0],
      [4, 1, 0],
    ]
    const wide = fitDistance(box, 40, 3)
    const narrow = fitDistance(box, 40, 0.5)
    expect(narrow).toBeGreaterThan(wide)
    expect(wide).toBeCloseTo((4 * 1.1) / (Math.tan((20 * Math.PI) / 180) * 3))
  })

  it('靠近相機的點需要更遠的距離', () => {
    expect(fitDistance([[1, 0, 2]], 60, 1)).toBeGreaterThan(fitDistance([[1, 0, 0]], 60, 1))
  })
})

describe('niceTicks', () => {
  it('取 1/2/5 倍數的整齊刻度', () => {
    expect(niceTicks(0, 100, 4)).toEqual([0, 50, 100])
    expect(niceTicks(97.3, 104.8, 4)).toEqual([98, 100, 102, 104])
  })

  it('沒有浮點誤差', () => {
    expect(niceTicks(0.1, 0.7, 3)).toEqual([0.2, 0.4, 0.6])
  })

  it('min 等於 max 時只回傳一個刻度，非有限值回傳空陣列', () => {
    expect(niceTicks(5, 5)).toEqual([5])
    expect(niceTicks(Number.NaN, 1)).toEqual([])
  })
})

describe('candleLayout', () => {
  const data = [
    day('2026-11-10', 100, 104, 99, 103),
    day('2026-11-11', 103, 103.5, 100, 101, 500),
    day('2026-11-12', 101, 102, 98, 101, 2000),
  ]
  const layout = candleLayout(data, { width: 6, height: 4, volumeHeight: 1 })

  it('依序等距排列並置中', () => {
    expect(layout.slot).toBe(2)
    expect(layout.bars.map(b => b.x)).toEqual([-2, 0, 2])
  })

  it('最低價在 0、最高價在 height', () => {
    expect(layout.priceToY(98)).toBe(0)
    expect(layout.priceToY(104)).toBe(4)
    const first = layout.bars[0]
    expect(first.wickBottom).toBeCloseTo(layout.priceToY(99))
    expect(first.wickBottom + first.wickHeight).toBeCloseTo(4)
  })

  it('收盤相對開盤決定色調，十字線保留最小實體', () => {
    expect(layout.bars.map(b => b.tone)).toEqual(['rise', 'fall', 'flat'])
    expect(layout.bars[2].bodyHeight).toBe(0.03)
  })

  it('成交量以最大量為滿格', () => {
    expect(layout.bars.map(b => b.volume)).toEqual([0.5, 0.25, 1])
  })

  it('空資料不出錯', () => {
    const empty = candleLayout([], { width: 6, height: 4, volumeHeight: 1 })
    expect(empty.bars).toEqual([])
    expect(empty.ticks).toEqual([])
  })
})

describe('movingAverage', () => {
  it('資料不足時為 null，之後為滑動平均', () => {
    expect(movingAverage([1, 2, 3, 4, 5], 3)).toEqual([null, null, 2, 3, 4])
  })
})

describe('ringPosition', () => {
  it('索引 0 在正後方，依俯視順時針排列', () => {
    const [x0, z0] = ringPosition(0, 4, 2)
    expect(x0).toBeCloseTo(0)
    expect(z0).toBeCloseTo(-2)
    const [x1, z1] = ringPosition(1, 4, 2)
    expect(x1).toBeCloseTo(2)
    expect(z1).toBeCloseTo(0)
  })
})

describe('elementPillars', () => {
  const energy = { wood: 10, fire: 40, earth: 20, metal: 0, water: 30 }

  it('依相生順序排列，最強者為滿高，零能量保留最小高度', () => {
    const pillars = elementPillars(energy, 'earth', seasonalStrength('亥'), 3)
    expect(pillars.map(p => p.label)).toEqual(['木', '火', '土', '金', '水'])
    expect(pillars[1].height).toBe(3)
    expect(pillars[3].height).toBe(0.08)
  })

  it('標出本命五行、關係與月令旺衰', () => {
    const pillars = elementPillars(energy, 'earth', seasonalStrength('亥'), 3)
    const earth = pillars.find(p => p.key === 'earth')!
    expect(earth.isOwn).toBe(true)
    expect(earth.relation).toBe('same')
    expect(pillars.find(p => p.key === 'fire')!.relation).toBe('generatedBy')
    // 亥月水旺
    expect(pillars.find(p => p.key === 'water')!.strength).toBe('旺')
  })

  it('沒有本命五行與月令時對應欄位為 null', () => {
    const pillars = elementPillars(energy, null, null, 3)
    expect(pillars.every(p => p.relation === null && p.strength === null && !p.isOwn)).toBe(true)
  })
})

describe('CONTROL_STAR', () => {
  it('相鄰兩點為相剋關係', () => {
    CONTROL_STAR.forEach((from, i) => {
      const to = CONTROL_STAR[(i + 1) % CONTROL_STAR.length]
      expect(controls(ELEMENT_CYCLE[from])).toBe(ELEMENT_CYCLE[to])
    })
  })
})

describe('技術指標顯示', () => {
  it('overallSignal 加總 RSI、MACD、KD 訊號', () => {
    expect(overallSignal({ rsi: 25, macd: 1, bollingerBand: '中軌', kd: { k: 60, d: 50 } })).toBe(
      '買入'
    )
    expect(overallSignal({ rsi: 75, macd: -1, bollingerBand: '中軌', kd: { k: 40, d: 50 } })).toBe(
      '賣出'
    )
    expect(overallSignal({ rsi: 50, macd: 1, bollingerBand: '中軌', kd: { k: 40, d: 50 } })).toBe(
      '持有'
    )
  })

  it('bollingerZone 正規化中英混合的回傳值', () => {
    expect(bollingerZone('upper')).toBe('upper')
    expect(bollingerZone('lower')).toBe('lower')
    expect(bollingerZone('中軌')).toBe('middle')
  })

  it('oscillatorState 依上下界判斷', () => {
    expect(oscillatorState(75, 30, 70)).toBe('超買')
    expect(oscillatorState(15, 20, 80)).toBe('超賣')
    expect(oscillatorState(50, 30, 70)).toBe('中性')
  })

  it('macdRatio 以股價百分比換算並夾在 ±1', () => {
    expect(macdRatio(1, 100)).toBeCloseTo(0.5)
    expect(macdRatio(-10, 100)).toBe(-1)
    expect(macdRatio(1, 0)).toBe(0)
  })
})
