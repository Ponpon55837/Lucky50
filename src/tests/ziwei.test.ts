import { describe, it, expect } from 'vitest'
import { EARTHLY_BRANCHES, HEAVENLY_STEMS, branchIndex } from '@/utils/ganzhi'
import {
  MAIN_STARS,
  PALACES,
  buildZiWeiChart,
  isMainStar,
  mainStarsOf,
  transformationsOf,
  ziWeiPosition,
  type Star,
} from '@/utils/ziwei'

const branchOf = (chart: ReturnType<typeof buildZiWeiChart>, star: Star) =>
  chart.palaces[chart.starPalace.get(star)!].branch

describe('紫微星位置', () => {
  it('各局初一的紫微位置', () => {
    const at = (bureau: number, day: number) => EARTHLY_BRANCHES[ziWeiPosition(bureau, day)]
    expect(at(2, 1)).toBe('丑')
    expect(at(3, 1)).toBe('辰')
    expect(at(4, 1)).toBe('亥')
    expect(at(5, 1)).toBe('午')
    expect(at(6, 1)).toBe('酉')
  })

  it('生日可被局數整除時自寅宮順數', () => {
    expect(EARTHLY_BRANCHES[ziWeiPosition(2, 2)]).toBe('寅')
    expect(EARTHLY_BRANCHES[ziWeiPosition(3, 3)]).toBe('寅')
    expect(EARTHLY_BRANCHES[ziWeiPosition(6, 30)]).toBe('午')
  })
})

describe('排盤', () => {
  // 庚年正月初一子時：命宮在寅，戊寅納音城頭土，土五局
  const chart = buildZiWeiChart({ yearStem: '庚', lunarMonth: 1, lunarDay: 1, hourBranch: '子' })

  it('命宮、身宮與五行局', () => {
    expect(chart.palaces[0]).toMatchObject({ name: '命宮', stem: '戊', branch: '寅' })
    expect(chart.bodyBranch).toBe('寅')
    expect(chart.bureau).toEqual({ element: 'earth', number: 5 })
  })

  it('十二宮自命宮逆布', () => {
    expect(chart.palaces.map(palace => palace.name)).toEqual([...PALACES])
    expect(chart.palaces.map(palace => palace.branch).join('')).toBe('寅丑子亥戌酉申未午巳辰卯')
  })

  it('紫微在午、天府在戌，其餘主星依序排布', () => {
    expect(branchOf(chart, '紫微')).toBe('午')
    expect(branchOf(chart, '天機')).toBe('巳')
    expect(branchOf(chart, '太陽')).toBe('卯')
    expect(branchOf(chart, '武曲')).toBe('寅')
    expect(branchOf(chart, '天同')).toBe('丑')
    expect(branchOf(chart, '廉貞')).toBe('戌')
    expect(branchOf(chart, '天府')).toBe('戌')
    expect(branchOf(chart, '太陰')).toBe('亥')
    expect(branchOf(chart, '貪狼')).toBe('子')
    expect(branchOf(chart, '巨門')).toBe('丑')
    expect(branchOf(chart, '天相')).toBe('寅')
    expect(branchOf(chart, '天梁')).toBe('卯')
    expect(branchOf(chart, '七殺')).toBe('辰')
    expect(branchOf(chart, '破軍')).toBe('申')
  })

  it('輔星：正月子時左輔文曲在辰、右弼文昌在戌', () => {
    expect(branchOf(chart, '左輔')).toBe('辰')
    expect(branchOf(chart, '文曲')).toBe('辰')
    expect(branchOf(chart, '右弼')).toBe('戌')
    expect(branchOf(chart, '文昌')).toBe('戌')
  })

  it('三月辰時命宮在子', () => {
    const other = buildZiWeiChart({ yearStem: '甲', lunarMonth: 3, lunarDay: 10, hourBranch: '辰' })
    expect(other.palaces[0].branch).toBe('子')
  })

  it('任何生辰都恰好安十四主星，紫微天府對寅申軸對稱、七殺與天府對宮', () => {
    const expectedStars = [...MAIN_STARS].sort().join()
    // 共 7,200 張命盤；只記錄不符合的，避免逐張呼叫 expect 拖慢測試
    const violations: string[] = []
    for (const yearStem of HEAVENLY_STEMS) {
      for (let lunarMonth = 1; lunarMonth <= 12; lunarMonth++) {
        for (const lunarDay of [1, 7, 15, 23, 30]) {
          for (const hourBranch of EARTHLY_BRANCHES) {
            const each = buildZiWeiChart({ yearStem, lunarMonth, lunarDay, hourBranch })
            const placed = each.palaces
              .flatMap(palace => palace.stars)
              .filter(isMainStar)
              .sort()
              .join()
            const ziWei = branchIndex(branchOf(each, '紫微'))
            const tianFu = branchIndex(branchOf(each, '天府'))
            const qiSha = branchIndex(branchOf(each, '七殺'))
            const valid =
              placed === expectedStars &&
              (ziWei + tianFu) % 12 === 4 &&
              (qiSha - tianFu + 12) % 12 === 6
            if (!valid) violations.push(`${yearStem}年${lunarMonth}月${lunarDay}日${hourBranch}時`)
          }
        }
      }
    }
    expect(violations).toEqual([])
  })
})

describe('空宮與四化', () => {
  it('空宮借對宮主星', () => {
    // 上面的命盤中，酉宮（疾厄宮）與未宮（交友宮）沒有主星
    const chart = buildZiWeiChart({ yearStem: '庚', lunarMonth: 1, lunarDay: 1, hourBranch: '子' })
    const empty = chart.palaces.findIndex(palace => !palace.stars.some(isMainStar))
    expect(empty).toBeGreaterThanOrEqual(0)
    const { stars, borrowed } = mainStarsOf(chart, empty)
    expect(borrowed).toBe(true)
    expect(stars).toEqual(chart.palaces[(empty + 6) % 12].stars.filter(isMainStar))
    expect(mainStarsOf(chart, 0)).toEqual({ stars: ['武曲', '天相'], borrowed: false })
  })

  it('庚干四化：太陽化祿、武曲化權、太陰化科、天同化忌', () => {
    const chart = buildZiWeiChart({ yearStem: '庚', lunarMonth: 1, lunarDay: 1, hourBranch: '子' })
    const transformed = transformationsOf(chart, '庚')
    expect(transformed.map(item => `${item.star}${item.type}`)).toEqual([
      '太陽化祿',
      '武曲化權',
      '太陰化科',
      '天同化忌',
    ])
    // 武曲在命宮
    expect(transformed[1].palaceIndex).toBe(0)
    for (const item of transformed) {
      expect(chart.palaces[item.palaceIndex].stars).toContain(item.star)
    }
  })
})
