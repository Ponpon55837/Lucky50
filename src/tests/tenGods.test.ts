import { describe, it, expect } from 'vitest'
// @ts-expect-error - lunar-javascript doesn't have TypeScript definitions
import { Solar } from 'lunar-javascript'
import { s2t } from 'chinese-s2t'
import { buildBirthChart } from '@/services/engines/birthChart'
import { parseGanZhi } from '@/utils/ganzhi'
import {
  PILLAR_KEYS,
  calculateFourPillarsTenGods,
  countTenGods,
  dayMasterStrength,
  favorableGroups,
  findDominantTenGods,
  getTenGodRelation,
  inferInvestmentPersonality,
  tenGodGroup,
  tenGodOf,
  type FourPillars,
} from '@/utils/tenGods'

const pillarsOf = (year: string, month: string, day: string, hour: string): FourPillars => ({
  year: parseGanZhi(year)!,
  month: parseGanZhi(month)!,
  day: parseGanZhi(day)!,
  hour: parseGanZhi(hour)!,
})

describe('十神', () => {
  it('以甲木為日主的十神', () => {
    const gods = [...'甲乙丙丁戊己庚辛壬癸'].map(stem => tenGodOf('甲', stem as never))
    expect(gods).toEqual([
      '比肩',
      '劫財',
      '食神',
      '傷官',
      '偏財',
      '正財',
      '七殺',
      '正官',
      '偏印',
      '正印',
    ])
  })

  it('非天干回傳 null', () => {
    expect(getTenGodRelation('甲', '?')).toBeNull()
    expect(getTenGodRelation('甲', '己')).toBe('正財')
  })

  it('十神五類', () => {
    expect(tenGodGroup('劫財')).toBe('peer')
    expect(tenGodGroup('傷官')).toBe('output')
    expect(tenGodGroup('正財')).toBe('wealth')
    expect(tenGodGroup('七殺')).toBe('officer')
    expect(tenGodGroup('偏印')).toBe('resource')
  })

  it('四柱十神與函式庫排盤一致', () => {
    const births: Array<[string, string, number, number, number, number]> = [
      ['1995-06-15', '08:30', 1995, 6, 15, 8],
      ['1988-01-03', '21:10', 1988, 1, 3, 21],
      ['2001-12-25', '00:40', 2001, 12, 25, 0],
      ['1976-09-09', '15:05', 1976, 9, 9, 15],
    ]
    for (const [birthDate, birthTime, y, m, d, h] of births) {
      const eightChar = Solar.fromYmdHms(y, m, d, h, Number(birthTime.slice(3)), 0)
        .getLunar()
        .getEightChar()
      const gods = calculateFourPillarsTenGods(buildBirthChart({ birthDate, birthTime }).pillars)

      expect(gods.year.stem).toBe(s2t(eightChar.getYearShiShenGan()))
      expect(gods.month.stem).toBe(s2t(eightChar.getMonthShiShenGan()))
      expect(gods.hour.stem).toBe(s2t(eightChar.getTimeShiShenGan()))
      expect(gods.day.stem).toBeNull()
      expect(gods.year.branch).toBe(s2t(eightChar.getYearShiShenZhi()[0]))
      expect(gods.month.branch).toBe(s2t(eightChar.getMonthShiShenZhi()[0]))
      expect(gods.day.branch).toBe(s2t(eightChar.getDayShiShenZhi()[0]))
      expect(gods.hour.branch).toBe(s2t(eightChar.getTimeShiShenZhi()[0]))
    }
  })

  it('統計七個位置並找出最旺十神', () => {
    const gods = calculateFourPillarsTenGods(pillarsOf('甲寅', '甲寅', '甲寅', '甲寅'))
    const counts = countTenGods(gods)
    expect(counts.get('比肩')).toBe(7)
    expect(findDominantTenGods(counts)).toEqual(['比肩'])
    expect(PILLAR_KEYS.every(key => gods[key].branch === '比肩')).toBe(true)
  })
})

describe('日主旺衰', () => {
  it('通根得令為身強，喜食傷財官', () => {
    const strength = dayMasterStrength(pillarsOf('甲寅', '甲寅', '甲寅', '甲寅'))
    expect(strength.strong).toBe(true)
    expect(strength.inSeason).toBe(true)
    expect([...favorableGroups(true)]).toEqual(['output', 'wealth', 'officer'])
  })

  it('失令無助為身弱，喜印比', () => {
    const strength = dayMasterStrength(pillarsOf('庚申', '庚申', '甲申', '庚申'))
    expect(strength.strong).toBe(false)
    expect(strength.inSeason).toBe(false)
    // 只有四個申中的壬水（中氣 0.3）生扶：0.3 × (1 + 3 + 1 + 1)
    expect(strength.support).toBeCloseTo(1.8)
    expect([...favorableGroups(false)]).toEqual(['resource', 'peer'])
  })

  it('地支依藏干比例計入', () => {
    // 丁火日主：乙、甲兩干生扶 2；亥中甲 0.3；午月丁 0.7×3；辰中乙 0.3
    const strength = dayMasterStrength(pillarsOf('乙亥', '壬午', '丁丑', '甲辰'))
    expect(strength.support).toBeCloseTo(4.7)
    expect(strength.strong).toBe(true)
  })
})

describe('投資性格', () => {
  it('依最旺十神所屬風格判斷', () => {
    const personality = inferInvestmentPersonality(
      calculateFourPillarsTenGods(pillarsOf('庚申', '庚申', '甲申', '庚申'))
    )
    expect(personality.dominantGods).toEqual(['七殺'])
    expect(personality.style).toBe('active')
    expect(personality.description).toContain('積極交易型')
  })
})
