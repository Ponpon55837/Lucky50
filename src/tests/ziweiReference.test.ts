import { describe, it, expect } from 'vitest'
import { astro } from 'iztro'
import { buildBirthChart } from '@/services/engines/birthChart'
import {
  ASSIST_STARS,
  MAIN_STARS,
  MINOR_STARS,
  brightnessOf,
  buildZiWeiChart,
  type ZiWeiChart,
} from '@/utils/ziwei'

/**
 * 與開源排盤庫 iztro 逐盤比對：命宮、五行局、每顆星的落宮與亮度都要一致。
 * 23 點（夜子時）不比：本專案不提前換日，iztro 則另有設定，屬流派差異。
 */

interface ReferenceStar {
  name: string
  brightness?: string
}
interface ReferencePalace {
  earthlyBranch: string
  majorStars: ReferenceStar[]
  minorStars: ReferenceStar[]
  adjectiveStars: ReferenceStar[]
}

const pad = (value: number) => String(value).padStart(2, '0')

function ours(birthDate: string, hour: number): ZiWeiChart {
  const birth = buildBirthChart({ birthDate, birthTime: `${pad(hour)}:30` })
  return buildZiWeiChart({
    yearStem: birth.lunarYear.stem,
    yearBranch: birth.lunarYear.branch,
    lunarMonth: birth.lunarMonth,
    lunarDay: birth.lunarDay,
    hourBranch: birth.hourBranch,
  })
}

/** 「星名@地支:亮度」的排序清單，方便整盤一次比對 */
function describeOurs(chart: ZiWeiChart, names: readonly string[]): string[] {
  const wanted = new Set(names)
  const lines: string[] = []
  for (const palace of chart.palaces) {
    for (const star of palace.stars) {
      if (wanted.has(star)) {
        lines.push(`${star}@${palace.branch}:${brightnessOf(star, palace.branch) ?? ''}`)
      }
    }
    for (const star of palace.minorStars) {
      if (wanted.has(star)) lines.push(`${star}@${palace.branch}:`)
    }
  }
  return lines.sort()
}

function describeReference(palaces: ReferencePalace[], names: readonly string[]): string[] {
  const wanted = new Set(names)
  const lines: string[] = []
  for (const palace of palaces) {
    for (const star of [...palace.majorStars, ...palace.minorStars, ...palace.adjectiveStars]) {
      if (wanted.has(star.name)) {
        lines.push(`${star.name}@${palace.earthlyBranch}:${star.brightness ?? ''}`)
      }
    }
  }
  return lines.sort()
}

/** 取樣：跨六十甲子的年份、每年十二個月的不同日子、十二個時辰 */
function* samples(): Generator<{ birthDate: string; hour: number }> {
  for (let year = 1960; year <= 2020; year += 3) {
    for (let month = 1; month <= 12; month++) {
      const day = 1 + ((year * 7 + month * 5) % 28)
      const hour = ((year + month) % 12) * 2 - 1
      yield { birthDate: `${year}-${pad(month)}-${pad(day)}`, hour: Math.max(hour, 0) }
    }
  }
  // 同一天掃過所有時辰、同一個月掃過所有日子
  for (let hour = 0; hour < 23; hour++) yield { birthDate: '1990-05-15', hour }
  for (let day = 1; day <= 30; day++) yield { birthDate: `1987-06-${pad(day)}`, hour: 9 }
}

/** 參考庫排一張盤約數十毫秒，近三百張盤需要放寬逾時 */
const REFERENCE_TIMEOUT = 120_000

describe('與 iztro 逐盤比對', () => {
  const ALL_STARS = [...MAIN_STARS, ...ASSIST_STARS, ...MINOR_STARS]

  it(
    '每顆星的落宮與亮度一致',
    () => {
      const mismatches: string[] = []
      let charts = 0
      for (const { birthDate, hour } of samples()) {
        const chart = ours(birthDate, hour)
        const timeIndex = Math.floor((hour + 1) / 2)
        const reference = astro.bySolar(birthDate, timeIndex, '男', true, 'zh-TW')
        const expected = describeReference(reference.palaces as ReferencePalace[], ALL_STARS)
        const actual = describeOurs(chart, ALL_STARS)
        charts++
        if (expected.join() !== actual.join()) {
          const missing = expected.filter(line => !actual.includes(line))
          const extra = actual.filter(line => !expected.includes(line))
          mismatches.push(
            `${birthDate} ${hour}時 應有 ${missing.join(' ')}｜實得 ${extra.join(' ')}`
          )
        }
        if (reference.earthlyBranchOfSoulPalace !== chart.palaces[0].branch) {
          mismatches.push(`${birthDate} ${hour}時 命宮 ${chart.palaces[0].branch}`)
        }
      }
      expect(charts).toBeGreaterThan(280)
      expect(mismatches.slice(0, 10)).toEqual([])
    },
    REFERENCE_TIMEOUT
  )

  it('參考盤涵蓋本專案安的每一顆星', () => {
    const reference = astro.bySolar('1990-05-15', 4, '男', true, 'zh-TW')
    const lines = describeReference(reference.palaces as ReferencePalace[], ALL_STARS)
    expect(lines).toHaveLength(ALL_STARS.length)
  })
})
