import { afterEach, describe, expect, it, vi } from 'vitest'
import { IntegratedFortuneService } from '@/services/integratedFortune'
import { loadZiWeiPatterns } from '@/services/ziwei-enrichment/loadPatterns'
import { evaluateZiWeiPatterns } from '@/services/ziwei-enrichment/patterns/evaluate'
import type { ZiWeiPatternResult } from '@/services/ziwei-enrichment/patterns/types'
import type { ZiWeiChartSnapshot } from '@/services/ziwei-enrichment/types'
import { JIA_WU_DAY, PIG_PROFILE } from '../helpers/engineInput'
import { natalSnapshot, referenceSamples, ziFuCases } from './fixtures'

const FU_XIANG = 'fu-xiang-chao-yuan'
const YANG_LIANG = 'yang-liang-chang-lu'
const WU_TAN = 'wu-tan'
const ZI_FU = 'zi-fu-life-palace'

function snapshot(birthDate: string, birthTime: string) {
  return natalSnapshot({ birthDate, birthTime })
}

function pattern(chart: ZiWeiChartSnapshot, id: ZiWeiPatternResult['id']) {
  const match = evaluateZiWeiPatterns(chart).find(result => result.id === id)
  if (!match) throw new Error(`缺少測試格局 ${id}`)
  return match
}

describe('府相朝垣', () => {
  it('申宮為命，天府與天相分守財帛及官祿', () => {
    const result = pattern(snapshot('1950-06-21', '20:00'), FU_XIANG)
    expect(result.status).toBe('qualified')
    expect(result.required).toMatchObject([
      { id: 'life-yin-shen', matched: true, branches: ['申'] },
      {
        id: 'fu-xiang-split',
        matched: true,
        branches: ['辰', '子'],
        stars: [
          { name: '天府', branch: '子' },
          { name: '天相', branch: '辰' },
        ],
      },
    ])
    expect(result.supporting.map(entry => entry.id)).toEqual([
      'life-prosperity',
      'life-group-zuo-fu',
    ])
  })

  it('天府天相分守財官，但命宮位於未時仍不成立', () => {
    const result = pattern(snapshot('1950-07-26', '00:00'), FU_XIANG)
    expect(result.status).toBe('not-qualified')
    expect(result.required.map(entry => entry.matched)).toEqual([false, true])
    expect(result.supporting).toEqual([])
    expect(result.breaking).toEqual([])
  })

  it.each([
    ['1950-01-24', '22:00', ['life-malefics']],
    ['1968-11-08', '16:00', ['three-malefics']],
  ])('區分命宮坐煞及三方四煞門檻 %s %s', (date, time, breaking) => {
    const result = pattern(snapshot(date, time), FU_XIANG)
    expect(result.status).toBe('weakened')
    expect(result.breaking.map(entry => entry.id)).toEqual(breaking)
    expect(result.sources.map(source => source.url)).toEqual([
      expect.stringContaining('patterns-dinggui.ts#L356-L371'),
      expect.stringContaining('patterns.ts#L181-L187'),
    ])
  })
})

describe('陽梁昌祿', () => {
  it('四星會照成立，空宮借天梁時依天梁實際坐守地支回傳證據', () => {
    const chart = snapshot('1950-05-16', '00:00')
    expect(chart.palaces.辰.borrowed).toEqual({ fromBranch: '戌', stars: ['天機', '天梁'] })
    const result = pattern(chart, YANG_LIANG)
    expect(result.status).toBe('qualified')
    expect(result.required).toHaveLength(4)
    expect(result.required.every(entry => entry.matched)).toBe(true)
    expect(result.supporting).toMatchObject([
      { id: 'sun-or-liang-bright', stars: [{ name: '天梁', branch: '戌', brightness: '廟' }] },
    ])
  })

  it('圈內宮位向圈外借天梁，仍缺少一顆必要星', () => {
    const chart = snapshot('1950-02-19', '04:00')
    expect(chart.palaces.辰.borrowed).toMatchObject({ fromBranch: '戌' })
    expect(chart.palaces.辰.borrowed?.stars).toContain('天梁')
    const result = pattern(chart, YANG_LIANG)
    expect(result.status).toBe('not-qualified')
    expect(result.required.filter(entry => !entry.matched)).toMatchObject([
      { id: 'life-group-tian-liang', stars: [{ name: '天梁', branch: '戌' }] },
    ])
  })

  it('太陽落陷仍回傳四星成立的證據與實際破格星曜', () => {
    const result = pattern(snapshot('1952-06-23', '22:00'), YANG_LIANG)
    expect(result.status).toBe('weakened')
    expect(result.breaking).toMatchObject([
      { id: 'sun-fallen', stars: [{ name: '太陽', branch: '亥', brightness: '陷' }] },
    ])
  })

  it('兩顆四煞會照時標示破格，並列出兩顆星的位置', () => {
    const result = pattern(snapshot('1952-04-13', '18:00'), YANG_LIANG)
    expect(result.status).toBe('weakened')
    expect(result.breaking).toHaveLength(1)
    expect(result.breaking[0]).toMatchObject({ id: 'two-malefics' })
    expect(result.breaking[0].stars).toHaveLength(2)
  })

  it.each([null, '不'] as const)('太陽亮度 %j 不當作廟旺或落陷', brightness => {
    const chart = snapshot('1952-06-23', '22:00')
    chart.palaces.亥.stars = chart.palaces.亥.stars.map(star =>
      star.name === '太陽' ? { ...star, brightness } : star
    )
    const result = pattern(chart, YANG_LIANG)
    expect(result.status).toBe('qualified')
    expect(result.supporting.flatMap(entry => entry.stars.map(star => star.name))).not.toContain(
      '太陽'
    )
  })

  it('化科證據只出現在一致的本命四化落宮', () => {
    const chart = snapshot('1950-10-13', '12:00')
    expect(pattern(chart, YANG_LIANG).supporting).toMatchObject([
      {
        id: 'life-group-natal-ke',
        stars: [{ name: '太陰', branch: '辰', natalTransformation: '化科' }],
      },
    ])

    chart.natalTransformations.entries = chart.natalTransformations.entries.map(entry =>
      entry.type === '化科' ? { ...entry, palaceBranch: '戌' } : entry
    )
    expect(pattern(chart, YANG_LIANG).supporting).toEqual([])
  })
})

describe('武貪格', () => {
  it('武曲貪狼同坐丑宮時可會照命宮，證據保留坐守宮位', () => {
    const chart = snapshot('1950-07-26', '00:00')
    expect(chart.palaces.未.borrowed?.stars).toEqual(['武曲', '貪狼'])
    const result = pattern(chart, WU_TAN)
    expect(result.status).toBe('qualified')
    expect(result.required[0].stars).toMatchObject([
      { name: '武曲', branch: '丑' },
      { name: '貪狼', branch: '丑' },
    ])
    expect(result.supporting.map(entry => entry.id)).toEqual(['life-group-fire-bell'])
  })

  it('武曲貪狼同坐未宮但沒有會照命宮時不成立', () => {
    const result = pattern(snapshot('1950-05-16', '00:00'), WU_TAN)
    expect(result.status).toBe('not-qualified')
    expect(result.required.map(entry => entry.matched)).toEqual([true, false])
  })

  it('武貪同宮遇地空時，列出同宮實際破格證據', () => {
    const result = pattern(snapshot('1950-04-11', '20:00'), WU_TAN)
    expect(result.status).toBe('weakened')
    expect(result.breaking).toMatchObject([
      { id: 'wu-tan-malefics', stars: [{ name: '地空', branch: '丑' }] },
    ])
  })

  it('同時記錄武曲本命化祿及同宮擎羊', () => {
    const result = pattern(snapshot('1959-02-10', '06:00'), WU_TAN)
    expect(result.status).toBe('weakened')
    expect(result.supporting).toMatchObject([
      { id: 'wu-natal-lu', stars: [{ name: '武曲', branch: '未', natalTransformation: '化祿' }] },
    ])
    expect(result.breaking).toMatchObject([
      { id: 'wu-tan-malefics', stars: [{ name: '擎羊', branch: '未' }] },
    ])
  })
})

describe('紫微、天府同坐命宮', () => {
  it.each(ziFuCases)(
    '保留 $birthDate $birthTime 的實際坐守位置與借星證據',
    ({ birthDate, birthTime, matched, lifeBranch, stars, borrowedZiWei }) => {
      const chart = snapshot(birthDate, birthTime)
      const result = pattern(chart, ZI_FU)

      expect(result.status).toBe(matched ? 'qualified' : 'not-qualified')
      expect(result.required).toMatchObject([
        {
          matched,
          branches: [lifeBranch],
          stars: stars.map(([name, , branch]) => ({ name, branch })),
        },
      ])
      expect(result.borrowedLifeStars).toMatchObject(
        borrowedZiWei ? [{ name: '紫微', branch: '酉' }] : []
      )
    }
  )

  it('228 組盤例有三組同坐命宮、29 組同坐別宮、196 組分居兩宮', () => {
    const counts = { life: 0, other: 0, split: 0 }
    for (const input of Object.values(referenceSamples).flat()) {
      const chart = natalSnapshot(input)
      const palaces = Object.values(chart.palaces)
      const ziWei = palaces.find(palace => palace.stars.some(star => star.name === '紫微'))
      const tianFu = palaces.find(palace => palace.stars.some(star => star.name === '天府'))
      if (!ziWei || !tianFu) throw new Error('測試盤缺少紫微或天府')

      const placement =
        ziWei !== tianFu ? 'split' : ziWei.branch === chart.lifeBranch ? 'life' : 'other'
      counts[placement]++
      expect(pattern(chart, ZI_FU).status).toBe(
        placement === 'life' ? 'qualified' : 'not-qualified'
      )
    }
    expect(counts).toEqual({ life: 3, other: 29, split: 196 })
  })
})

describe('紫微格局載入', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('預設關閉且只接受 true', async () => {
    const chart = snapshot('1950-05-16', '16:00')
    for (const value of [undefined, 'false', '1']) {
      vi.stubEnv('VITE_ZIWEI_PATTERNS', value)
      await expect(loadZiWeiPatterns(chart)).resolves.toBeNull()
    }
  })

  it('開啟時回傳具版本及來源的格局，且不修改原命盤', async () => {
    vi.stubEnv('VITE_ZIWEI_PATTERNS', 'true')
    const chart = snapshot('1950-05-16', '16:00')
    const original = structuredClone(chart)
    const results = await loadZiWeiPatterns(chart)
    expect(results).toEqual(evaluateZiWeiPatterns(chart))
    expect(results).toHaveLength(4)
    for (const result of results ?? []) {
      expect(result.ruleVersion).toBe(1)
      expect(result.conventionId).toBe(chart.conventionId)
      expect(result.sources.length).toBeGreaterThan(0)
      for (const source of result.sources) {
        expect(source.url).toContain('39c0abd3b8dac609975dddfadd4d4e1d3a978deb')
      }
    }
    expect(chart).toEqual(original)
  })

  it('啟用並判讀紫府坐命後，整合運勢及投資分數與停用時完全一致', async () => {
    const { birthDate, birthTime } = ziFuCases[0]
    const profile = { ...PIG_PROFILE, birthDate, birthTime }
    vi.stubEnv('VITE_ZIWEI_PATTERNS', 'false')
    const baseline = IntegratedFortuneService.computeFortune(profile, JIA_WU_DAY)

    vi.stubEnv('VITE_ZIWEI_PATTERNS', 'true')
    const results = await loadZiWeiPatterns(natalSnapshot(profile))
    expect(results).toContainEqual(expect.objectContaining({ id: ZI_FU, status: 'qualified' }))
    expect(IntegratedFortuneService.computeFortune(profile, JIA_WU_DAY)).toEqual(baseline)
  })
})
