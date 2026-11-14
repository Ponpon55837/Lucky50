import { describe, it, expect } from 'vitest'
import {
  BaziTenGodsEngine,
  ClassicFortuneEngine,
  ENGINE_LIST,
  FengShuiEngine,
  ZiWeiEngine,
  type MetaphysicsEngine,
} from '@/services/engines'
import {
  JIA_WU_DAY,
  PIG_PROFILE,
  RAT_PROFILE,
  consecutiveDays,
  makeEngineInput,
} from './helpers/engineInput'

const ENGINES: MetaphysicsEngine[] = [
  new ClassicFortuneEngine(),
  new BaziTenGodsEngine(),
  new ZiWeiEngine(),
  new FengShuiEngine(),
]

describe('所有引擎的共同性質', () => {
  it('基本資料與預設權重來自引擎目錄', () => {
    expect(
      ENGINES.map(engine => ({
        id: engine.engineId,
        name: engine.name,
        description: engine.description,
        version: engine.version,
        defaultWeight: engine.getWeight(),
      }))
    ).toEqual(ENGINE_LIST)
  })

  it('權重限制在 0–100，可停用', () => {
    const engine = new ClassicFortuneEngine()
    engine.setWeight(150)
    expect(engine.getWeight()).toBe(100)
    engine.setWeight(-5)
    expect(engine.getWeight()).toBe(0)
    engine.setEnabled(false)
    expect(engine.isEnabled()).toBe(false)
  })

  it.each(ENGINES)('$name：分數落在 5–95，且等於基準分加各項加減', engine => {
    for (const date of consecutiveDays(30)) {
      const result = engine.calculate(makeEngineInput(PIG_PROFILE, date))
      const sum = 50 + result.factors!.reduce((total, factor) => total + factor.delta, 0)
      expect(result.score).toBe(Math.max(5, Math.min(95, sum)))
      expect(result.engineId).toBe(engine.engineId)
    }
  })

  it.each(ENGINES)('$name：分數會隨日子變化，不是固定值', engine => {
    const scores = consecutiveDays(30).map(
      date => engine.calculate(makeEngineInput(PIG_PROFILE, date)).score
    )
    expect(new Set(scores).size).toBeGreaterThanOrEqual(3)
  })

  it.each(ENGINES)('$name：相同輸入得到相同結果', engine => {
    expect(engine.calculate(makeEngineInput())).toEqual(engine.calculate(makeEngineInput()))
  })

  it('不同的人在同一天分數不同', () => {
    const differs = ENGINES.filter(
      engine =>
        engine.calculate(makeEngineInput(PIG_PROFILE)).score !==
        engine.calculate(makeEngineInput(RAT_PROFILE)).score
    )
    expect(differs.length).toBeGreaterThanOrEqual(3)
  })
})

describe('ClassicFortuneEngine', () => {
  const engine = new ClassicFortuneEngine()

  it('甲午日屬豬：青龍黃道、建除危、宜開市，無沖合', () => {
    const result = engine.calculate(makeEngineInput(PIG_PROFILE, JIA_WU_DAY))
    expect(result.score).toBe(80)
    expect(result.factors).toEqual([
      { label: '值日青龍黃道', delta: 10 },
      { label: '建除值「危」', delta: 8 },
      { label: '宜交易類事項', delta: 12 },
    ])
    expect(result.warnings).toBeUndefined()
  })

  it('甲午日屬鼠：日沖本命又沖太歲，並提出警示', () => {
    const result = engine.calculate(makeEngineInput(RAT_PROFILE, JIA_WU_DAY))
    expect(result.score).toBe(57)
    expect(result.warnings).toEqual(['今日午日沖生肖鼠，不宜做重大投資決定。'])
  })
})

describe('BaziTenGodsEngine', () => {
  const engine = new BaziTenGodsEngine()

  it('丁火身強逢甲午日：印比皆忌，日支丑午相害', () => {
    const result = engine.calculate(makeEngineInput(PIG_PROFILE, JIA_WU_DAY))
    expect(result.factors).toEqual([
      { label: '流日天干甲（正印）屬印星，為忌', delta: -15 },
      { label: '流日地支午（比肩）屬比劫，為忌', delta: -10 },
      { label: '流日地支午與日支丑相害', delta: -5 },
    ])
    expect(result.score).toBe(20)
    expect(result.details).toMatchObject({ strong: true, favorable: ['食傷', '財星', '官殺'] })
  })

  it('同一命盤逢財星日加分', () => {
    // 2026-11-23 為辛丑日：辛為丁火的偏財
    const result = engine.calculate(makeEngineInput(PIG_PROFILE, new Date(2026, 10, 23, 10)))
    expect(result.factors![0]).toEqual({ label: '流日天干辛（偏財）屬財星，為喜', delta: 15 })
  })

  it('附上投資性格', () => {
    const result = engine.calculate(makeEngineInput())
    expect(result.personality).toContain('您的投資性格偏向')
    expect(result.summary).toContain('日主丁身強')
  })
})

describe('ZiWeiEngine', () => {
  const engine = new ZiWeiEngine()

  it('列出命、財、官、遷四宮與五行局', () => {
    const { details } = engine.calculate(makeEngineInput())
    const palaces = (details as { palaces: Array<{ name: string }> }).palaces
    expect(palaces.map(palace => palace.name)).toEqual(['命宮', '財帛宮', '官祿宮', '遷移宮'])
    expect((details as { bureau: string }).bureau).toMatch(/^[水木金土火][二三四五六]局$/)
  })

  it('流日四化每十天循環：日干相同則分數相同', () => {
    const days = consecutiveDays(20)
    for (let i = 0; i < 10; i++) {
      expect(engine.calculate(makeEngineInput(PIG_PROFILE, days[i])).score).toBe(
        engine.calculate(makeEngineInput(PIG_PROFILE, days[i + 10])).score
      )
    }
  })

  it('財帛宮無主星時，借來的對宮財星不算坐守', () => {
    for (let month = 1; month <= 12; month++) {
      for (let day = 1; day <= 28; day += 3) {
        const birthDate = `1990-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        const result = engine.calculate(makeEngineInput({ ...PIG_PROFILE, birthDate }))
        const wealth = (
          result.details as { palaces: Array<{ name: string; borrowed: boolean }> }
        ).palaces.find(palace => palace.name === '財帛宮')!
        const seated = result.factors!.some(factor => factor.label.endsWith('坐財帛宮'))
        if (wealth.borrowed) expect(seated).toBe(false)
      }
    }
  })

  it('同一張命盤重複計算結果一致', () => {
    const first = engine.calculate(makeEngineInput())
    expect(engine.calculate(makeEngineInput())).toEqual(first)
  })

  it('加減項都落在命財官遷', () => {
    const { factors } = engine.calculate(makeEngineInput())
    for (const factor of factors!) {
      expect(factor.label).toMatch(/命宮|財帛宮|官祿宮|遷移宮/)
    }
  })
})

describe('FengShuiEngine', () => {
  const engine = new FengShuiEngine()
  type Notes = {
    luckyDirections: Array<{ direction: string }>
    avoidDirections: Array<{ direction: string }>
  }

  it('神位落在三煞方時不列為吉方', () => {
    // 2026-11-14 壬辰日：財神、喜神都在正南，而申子辰日煞南
    const input = makeEngineInput(PIG_PROFILE, new Date(2026, 10, 14, 10))
    expect(input.today).toMatchObject({ caiShen: '正南', sha: '南' })
    const { luckyDirections, avoidDirections } = engine.calculate(input).details as Notes
    expect(avoidDirections.map(note => note.direction)).toContain('正南')
    expect(luckyDirections.map(note => note.direction)).not.toContain('正南')
  })

  it('整年下來，主要吉方從不與凶方相同', () => {
    for (const date of consecutiveDays(365)) {
      const result = engine.calculate(makeEngineInput(PIG_PROFILE, date))
      if (result.luckyDirection) expect(result.luckyDirection).not.toBe(result.avoidDirection)
    }
  })

  it('甲午日（沙中金）對山頭火命：我剋為財，生肖亥居北逢三煞', () => {
    const result = engine.calculate(makeEngineInput(PIG_PROFILE, JIA_WU_DAY))
    expect(result.factors).toEqual([
      { label: '日納音金為本命所剋，我剋為財火', delta: 10 },
      { label: '本命生肖豬居北，正逢三煞方', delta: -8 },
    ])
    expect(result.score).toBe(52)
  })

  it('方位取自當日神位與三煞方', () => {
    const input = makeEngineInput()
    const result = engine.calculate(input)
    expect(result.luckyDirection).toBe(input.today.caiShen)
    expect(result.avoidDirection).toBe('正北')
    expect(result.luckyElements).toEqual(['wood', 'fire'])
    expect(result.avoidElements).toEqual(['water'])
  })
})
