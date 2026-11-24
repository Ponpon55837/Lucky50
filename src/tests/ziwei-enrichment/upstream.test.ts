import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { s2t } from 'chinese-s2t'
import { describe, expect, it } from 'vitest'
import { EARTHLY_BRANCHES, HEAVENLY_STEMS, type Branch, type Stem } from '@/utils/ganzhi'
import { ASSIST_STARS, MAIN_STARS, MINOR_STARS } from '@/utils/ziwei'
import type { BirthInput } from '@/services/engines/birthChart'
import type { ZiWeiChartSnapshot } from '@/services/ziwei-enrichment/types'
import { natalSnapshot, referenceSamples } from './fixtures'

interface ReferenceInput {
  year: number
  month: number
  day: number
  hour: number
  gender: 'male'
}

interface ReferenceStar {
  name: string
  brightnessRaw?: string
}

interface ReferencePalace {
  branch: number
  stem: number
  name: string
  stars: ReferenceStar[]
  borrowedFromBranch?: number
  borrowedStars?: string[]
}

interface ReferenceChart {
  mingGongBranch: number
  shenGongBranch: number
  wuxingJu: number
  palaces: ReferencePalace[]
  lunarInfo: { yearStem: number }
}

interface ReferenceBatch {
  BRANCHES: Branch[]
  STEMS: Stem[]
  SI_HUA_TABLE: Record<number, string[]>
  charts: ReferenceChart[]
}

type ComparedValue = string | number | null | readonly (string | null)[]

interface Difference {
  field: string
  subject: string
  lucky: ComparedValue
  reference: ComparedValue
}

const checkedStars: ReadonlySet<string> = new Set([...MAIN_STARS, ...ASSIST_STARS, ...MINOR_STARS])
const referenceRoot = process.env.LUCKY50_ZIWEI_REFERENCE
const referenceCommit = '39c0abd3b8dac609975dddfadd4d4e1d3a978deb'

function referenceInput({ birthDate, birthTime }: BirthInput): ReferenceInput {
  const [year, month, day] = birthDate.split('-').map(Number)
  const hour = Math.floor((Number(birthTime.slice(0, 2)) + 1) / 2) % EARTHLY_BRANCHES.length
  return { year, month, day, hour, gender: 'male' }
}

function normalizePalaceName(name: string): string {
  if (name === '仆役') return '交友宮'
  const traditional = s2t(name)
  return traditional.endsWith('宮') ? traditional : `${traditional}宮`
}

function normalizeStarName(name: string): string {
  if (name === '咸池') return name
  return s2t(name)
}

function compareChart(
  lucky: ZiWeiChartSnapshot,
  reference: ReferenceChart,
  constants: ReferenceBatch
): Difference[] {
  const { BRANCHES, STEMS, SI_HUA_TABLE } = constants
  const starLocations = new Map<string, { branch: Branch; brightness: string | null }>()
  const differences: Difference[] = []
  function compare(field: string, subject: string, own: ComparedValue, other: ComparedValue) {
    if (JSON.stringify(own) !== JSON.stringify(other)) {
      differences.push({ field, subject, lucky: own, reference: other })
    }
  }

  compare('lifeBranch', '命宮', lucky.lifeBranch, BRANCHES[reference.mingGongBranch])
  compare('bodyBranch', '身宮', lucky.bodyBranch, BRANCHES[reference.shenGongBranch])
  compare('bureau', '五行局', lucky.bureau.number, reference.wuxingJu)

  expect(reference.palaces.map(palace => BRANCHES[palace.branch]).sort()).toEqual(
    [...EARTHLY_BRANCHES].sort()
  )
  for (const palace of reference.palaces) {
    const branch = BRANCHES[palace.branch]
    const own = lucky.palaces[branch]
    compare(
      'palaceIdentities',
      branch,
      [own.name, own.stem],
      [normalizePalaceName(palace.name), STEMS[palace.stem]]
    )
    const fromBranch =
      palace.borrowedFromBranch === undefined ? null : BRANCHES[palace.borrowedFromBranch]
    compare(
      'borrowing',
      branch,
      [own.borrowed?.fromBranch ?? null, ...[...(own.borrowed?.stars ?? [])].sort()],
      [fromBranch, ...(palace.borrowedStars ?? []).map(normalizeStarName).sort()]
    )
    for (const star of palace.stars) {
      const name = normalizeStarName(star.name)
      if (checkedStars.has(name)) {
        expect(starLocations.has(name), name).toBe(false)
        starLocations.set(name, {
          branch,
          brightness: star.brightnessRaw ? s2t(star.brightnessRaw) : null,
        })
      }
    }
  }

  for (const branch of EARTHLY_BRANCHES) {
    for (const star of lucky.palaces[branch].stars) {
      const actual = starLocations.get(star.name)
      if (!actual) {
        compare('missingStars', star.name, branch, null)
      } else if (actual.branch !== branch) {
        compare('placements', star.name, branch, actual.branch)
      } else {
        compare('brightness', `${star.name}@${branch}`, star.brightness, actual.brightness)
      }
    }
  }

  const referenceTransformations = SI_HUA_TABLE[reference.lunarInfo.yearStem].map(normalizeStarName)
  for (const [
    index,
    { type, star, palaceBranch },
  ] of lucky.natalTransformations.entries.entries()) {
    const expected = referenceTransformations[index]
    compare(
      'transformations',
      type,
      [star, palaceBranch],
      [expected, starLocations.get(expected)?.branch ?? null]
    )
  }

  return differences
}

describe.skipIf(!referenceRoot)('與指定版本 ziwei-doushu 比對', () => {
  it('重現各組盤例的相容及差異欄位', () => {
    const root = resolve(referenceRoot!)
    expect(
      execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
    ).toBe(referenceCommit)
    const inputs = Object.values(referenceSamples).flat().map(referenceInput)
    const batch = JSON.parse(
      execFileSync(
        resolve(root, 'node_modules/.bin/tsx'),
        ['scripts/generate-ziwei-reference.mjs', root],
        { input: JSON.stringify(inputs), encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }
      )
    ) as ReferenceBatch
    expect(batch.BRANCHES).toEqual(EARTHLY_BRANCHES)
    expect(batch.STEMS).toEqual(HEAVENLY_STEMS)
    expect(batch.charts).toHaveLength(inputs.length)
    let chartIndex = 0
    const reports = Object.entries(referenceSamples).map(([group, inputs]) => {
      const charts = inputs.map(input => {
        const reference = batch.charts[chartIndex++]
        const lucky = natalSnapshot(input)
        expect(HEAVENLY_STEMS[reference.lunarInfo.yearStem]).toBe(
          lucky.natalTransformations.sourceStem
        )
        return { input, differences: compareChart(lucky, reference, batch) }
      })
      return { group, charts }
    })
    const outputPath = process.env.LUCKY50_ZIWEI_DIFF
    if (outputPath) {
      writeFileSync(outputPath, JSON.stringify(reports, null, 2) + '\n', { flag: 'wx' })
    }

    const results = reports.map(({ group, charts }) => {
      const counts: Record<string, number> = {}
      const movedStars = new Set<string>()
      for (const { differences } of charts) {
        const fields = new Set<string>()
        for (const { field, subject } of differences) {
          fields.add(field)
          if (field === 'placements') movedStars.add(subject)
        }
        for (const field of fields) counts[field] = (counts[field] ?? 0) + 1
      }
      return {
        group,
        total: charts.length,
        counts,
        movedStars: [...movedStars].sort(),
        differencesSha256: createHash('sha256').update(JSON.stringify(charts)).digest('hex'),
      }
    })
    expect(results).toMatchSnapshot()
  }, 60_000)
})
