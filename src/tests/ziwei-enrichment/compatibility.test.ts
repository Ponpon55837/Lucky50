import { describe, expect, it } from 'vitest'
import { buildBirthChart } from '@/services/engines/birthChart'
import { adaptZiWeiChart } from '@/services/ziwei-enrichment/adaptChart'
import { EARTHLY_BRANCHES, branchAt, branchIndex, parseGanZhi } from '@/utils/ganzhi'
import { ASSIST_STARS, MAIN_STARS, MINOR_STARS, buildZiWeiChart } from '@/utils/ziwei'
import { natalSnapshot } from './fixtures'

const goldenInput = { birthDate: '1990-05-15', birthTime: '16:00' }

describe('紫微斗數命盤快照', () => {
  it('固定盤例保留本命資料、亮度、空宮借星及四化落宮', () => {
    const snapshot = natalSnapshot(goldenInput)

    expect({
      schemaVersion: snapshot.schemaVersion,
      conventionId: snapshot.conventionId,
      lifeBranch: snapshot.lifeBranch,
      bodyBranch: snapshot.bodyBranch,
      bureau: snapshot.bureau,
      lifePalace: snapshot.palaces[snapshot.lifeBranch],
      borrowedPalaces: Object.values(snapshot.palaces)
        .filter(palace => palace.borrowed)
        .map(({ branch, borrowed }) => ({ branch, borrowed })),
      natalTransformations: snapshot.natalTransformations,
    }).toMatchSnapshot()
  })

  it.each([
    ['2024-02-03', '癸卯'],
    ['2024-02-04', '癸卯'],
    ['2024-02-09', '癸卯'],
    ['2024-02-10', '甲辰'],
  ])('農曆年界 %s 使用 %s 年干支', (birthDate, yearGanZhi) => {
    const input = { birthDate, birthTime: '12:00' }
    const year = parseGanZhi(yearGanZhi)
    expect(buildBirthChart(input).lunarYear).toEqual(year)
    expect(natalSnapshot(input).natalTransformations.sourceStem).toBe(year?.stem)
  })

  it.each([
    ['1984-12-07', 10, 15],
    ['1984-12-08', 11, 16],
    ['2023-04-05', 2, 15],
    ['2023-04-06', 3, 16],
    ['2025-08-08', 6, 15],
    ['2025-08-09', 7, 16],
  ])('分半閏月 %s 歸第 %i 月，保留第 %i 日', (birthDate, lunarMonth, lunarDay) => {
    expect(buildBirthChart({ birthDate, birthTime: '12:00' })).toMatchObject({
      lunarMonth,
      lunarDay,
    })
  })

  it.each(['1990-05-15', '2024-02-09', '2025-08-08'])('晚子時 %s 沿用當日子時命盤', birthDate => {
    const earlyZi = natalSnapshot({ birthDate, birthTime: '00:00' })
    for (const birthTime of ['00:59', '23:00', '23:59']) {
      expect(natalSnapshot({ birthDate, birthTime })).toEqual(earlyZi)
    }
    for (const birthTime of ['01:00', '22:59']) {
      expect(natalSnapshot({ birthDate, birthTime }).lifeBranch).not.toBe(earlyZi.lifeBranch)
    }
  })

  it.each(['', '早上', '24:00', '12:60', '-1:00', '9', '12:', '99:99', 'T12:00', '12.00'])(
    '保留缺漏或無效時間 %j 的相容行為',
    birthTime => {
      const noon = natalSnapshot({ ...goldenInput, birthTime: '12:00' })
      expect(natalSnapshot({ ...goldenInput, birthTime })).toEqual(noon)
    }
  )

  it.each([
    '',
    '1899-01-01',
    '2101-01-01',
    '2001-02-29',
    '2024-04-31',
    '2024-00-01',
    '2024-13-01',
    '2024-05-00',
    '2024-06',
    '生日',
  ])('拒絕無效生日 %j', birthDate => {
    expect(() => natalSnapshot({ ...goldenInput, birthDate })).toThrow()
  })

  it('固定合成盤的星曜唯一、借星與四化可追溯且輸出確定', () => {
    const mainStars: ReadonlySet<string> = new Set(MAIN_STARS)
    const allStars = new Set([...MAIN_STARS, ...ASSIST_STARS, ...MINOR_STARS])
    const years = [
      '庚辰',
      '辛巳',
      '壬午',
      '癸未',
      '甲申',
      '乙酉',
      '丙戌',
      '丁亥',
      '戊子',
      '己丑',
      '庚寅',
      '辛卯',
    ]
    for (const [yearIndex, year] of years.entries()) {
      const yearGanZhi = parseGanZhi(year)
      if (!yearGanZhi) throw new Error(`無效的測試年干支 ${year}`)
      const { stem, branch } = yearGanZhi
      for (let lunarMonth = 1; lunarMonth <= 12; lunarMonth++) {
        for (const [hourIndex, hourBranch] of EARTHLY_BRANCHES.entries()) {
          const lunarDay = ((yearIndex + 7 * lunarMonth + 11 * hourIndex) % 30) + 1
          const chart = buildZiWeiChart({
            yearStem: stem,
            yearBranch: branch,
            lunarMonth,
            lunarDay,
            hourBranch,
          })
          const snapshot = adaptZiWeiChart(chart, stem)
          const palaces = Object.values(snapshot.palaces)

          expect(Object.keys(snapshot.palaces).sort()).toEqual([...EARTHLY_BRANCHES].sort())
          const stars = palaces.flatMap(palace => palace.stars.map(star => star.name))
          expect(stars).toHaveLength(allStars.size)
          expect(new Set(stars)).toEqual(allStars)

          for (const palace of palaces) {
            const ownMainStars = palace.stars.filter(star => mainStars.has(star.name))
            if (ownMainStars.length > 0) {
              expect(palace.borrowed).toBeNull()
            } else {
              const opposite = branchAt(branchIndex(palace.branch) + 6)
              const oppositeMainStars = snapshot.palaces[opposite].stars
                .map(star => star.name)
                .filter(name => mainStars.has(name))
              expect(palace.borrowed).toEqual({ fromBranch: opposite, stars: oppositeMainStars })
            }
          }

          const transformations = snapshot.natalTransformations.entries
          expect(transformations.map(entry => entry.type)).toEqual(['化祿', '化權', '化科', '化忌'])
          for (const { star, palaceBranch } of transformations) {
            expect(snapshot.palaces[palaceBranch].stars.map(entry => entry.name)).toContain(star)
          }
          expect(adaptZiWeiChart(chart, stem)).toEqual(snapshot)
        }
      }
    }
  })
})
