import { describe, it, expect } from 'vitest'
// @ts-expect-error - lunar-javascript doesn't have TypeScript definitions
import { LunarUtil, Solar } from 'lunar-javascript'
import {
  EARTHLY_BRANCHES,
  ELEMENT_LABEL,
  HEAVENLY_STEMS,
  branchRelation,
  childOf,
  clashOf,
  controllerOf,
  controls,
  elementRelation,
  hiddenStems,
  hourBranch,
  hourStem,
  isYangStem,
  mainStem,
  nayinElement,
  parentOf,
  parseGanZhi,
  sexagenaryIndex,
  stemElement,
  stemRelation,
  tigerStem,
  zodiacBranch,
  zodiacOf,
  type BranchRelation,
} from '@/utils/ganzhi'

/** 六十甲子，JIA_ZI[0] 為甲子 */
const SIXTY: string[] = LunarUtil.JIA_ZI.slice(0, 60)

describe('干支基礎', () => {
  it('解析干支字串', () => {
    expect(parseGanZhi('甲子')).toEqual({ stem: '甲', branch: '子' })
    expect(parseGanZhi('子甲')).toBeNull()
    expect(parseGanZhi('')).toBeNull()
  })

  it('六十甲子序與函式庫一致', () => {
    SIXTY.forEach((text, index) => {
      expect(sexagenaryIndex(parseGanZhi(text)!)).toBe(index)
    })
  })

  it('天干五行與陰陽', () => {
    expect(HEAVENLY_STEMS.map(stem => ELEMENT_LABEL[stemElement(stem)]).join('')).toBe(
      '木木火火土土金金水水'
    )
    expect(HEAVENLY_STEMS.filter(isYangStem)).toEqual(['甲', '丙', '戊', '庚', '壬'])
  })

  it('生肖與地支互轉', () => {
    expect(zodiacBranch('馬')).toBe('午')
    expect(zodiacBranch('未知')).toBeNull()
    expect(zodiacOf('亥')).toBe('豬')
  })
})

describe('五行生剋', () => {
  it('木生火、木剋土、金剋木、水生木', () => {
    expect(childOf('wood')).toBe('fire')
    expect(controls('wood')).toBe('earth')
    expect(controllerOf('wood')).toBe('metal')
    expect(parentOf('wood')).toBe('water')
  })

  it('以我為主體判斷關係', () => {
    expect(elementRelation('fire', 'fire')).toBe('same')
    expect(elementRelation('fire', 'earth')).toBe('generates')
    expect(elementRelation('fire', 'metal')).toBe('controls')
    expect(elementRelation('fire', 'water')).toBe('controlledBy')
    expect(elementRelation('fire', 'wood')).toBe('generatedBy')
  })
})

describe('地支關係', () => {
  const pairs = (text: string) => text.split(' ').map(pair => [pair[0], pair[1]] as const)
  const expectAll = (text: string, relation: BranchRelation) => {
    for (const [a, b] of pairs(text)) {
      expect(branchRelation(a as never, b as never), `${a}${b}`).toBe(relation)
      expect(branchRelation(b as never, a as never), `${b}${a}`).toBe(relation)
    }
  }

  it('六沖', () => {
    expectAll('子午 丑未 寅申 卯酉 辰戌 巳亥', 'clash')
    expect(clashOf('亥')).toBe('巳')
  })

  it('六合', () => expectAll('子丑 寅亥 卯戌 辰酉 巳申 午未', 'sixHarmony'))

  it('三合', () => expectAll('申子 子辰 亥卯 卯未 寅午 午戌 巳酉 酉丑', 'threeHarmony'))

  it('六害', () => expectAll('子未 丑午 寅巳 卯辰 申亥 酉戌', 'harm'))

  it('各種關係的組數正確且互不重疊', () => {
    const counts: Record<string, number> = {}
    for (const a of EARTHLY_BRANCHES) {
      for (const b of EARTHLY_BRANCHES) {
        const relation = branchRelation(a, b)
        counts[relation] = (counts[relation] ?? 0) + 1
      }
    }
    expect(counts).toEqual({
      same: 12,
      clash: 12,
      sixHarmony: 12,
      threeHarmony: 24,
      harm: 12,
      none: 72,
    })
  })
})

describe('天干關係', () => {
  it('五合與相沖', () => {
    for (const pair of ['甲己', '乙庚', '丙辛', '丁壬', '戊癸']) {
      expect(stemRelation(pair[0] as never, pair[1] as never), pair).toBe('combine')
    }
    for (const pair of ['甲庚', '乙辛', '丙壬', '丁癸']) {
      expect(stemRelation(pair[0] as never, pair[1] as never), pair).toBe('clash')
    }
    expect(stemRelation('戊', '甲')).toBe('none')
    expect(stemRelation('甲', '甲')).toBe('same')
  })
})

describe('藏干與納音', () => {
  it('藏干與函式庫一致，比例合計為 1', () => {
    for (const branch of EARTHLY_BRANCHES) {
      const hidden = hiddenStems(branch)
      expect(hidden.map(item => item.stem)).toEqual(LunarUtil.ZHI_HIDE_GAN[branch])
      expect(hidden.reduce((sum, item) => sum + item.weight, 0)).toBeCloseTo(1)
      expect(mainStem(branch)).toBe(hidden[0].stem)
    }
  })

  it('六十甲子納音五行與函式庫一致', () => {
    for (const text of SIXTY) {
      const name: string = LunarUtil.NAYIN[text]
      expect(ELEMENT_LABEL[nayinElement(parseGanZhi(text)!)], text).toBe(name.slice(-1))
    }
  })
})

describe('遁干', () => {
  it('時支：23 點起為子時', () => {
    expect(hourBranch(23)).toBe('子')
    expect(hourBranch(0)).toBe('子')
    expect(hourBranch(8)).toBe('辰')
    expect(hourBranch(13)).toBe('未')
  })

  it('五鼠遁的時干與函式庫一致', () => {
    for (let day = 1; day <= 10; day++) {
      for (let hour = 1; hour <= 22; hour += 2) {
        const lunar = Solar.fromYmdHms(2026, 11, day, hour, 0, 0).getLunar()
        const dayStem = lunar.getDayInGanZhi().charAt(0)
        const branch = hourBranch(hour)
        expect(`${hourStem(dayStem, branch)}${branch}`).toBe(lunar.getTimeInGanZhi())
      }
    }
  })

  it('五虎遁：甲己年起丙寅、乙庚年起戊寅', () => {
    expect(tigerStem('甲', '寅')).toBe('丙')
    expect(tigerStem('己', '寅')).toBe('丙')
    expect(tigerStem('乙', '寅')).toBe('戊')
    expect(tigerStem('癸', '寅')).toBe('甲')
    expect(tigerStem('甲', '丑')).toBe('丁')
  })
})
