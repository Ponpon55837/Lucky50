import { describe, expect, it } from 'vitest'
import { buildBirthChart } from '@/services/engines/birthChart'
import { lunarService } from '@/services/lunar'
import { adaptZiWeiChart } from '@/services/ziwei-enrichment/adaptChart'
import {
  resolveFlowCalendar,
  resolveFlowMonth,
} from '@/services/ziwei-enrichment/flows/calendarContext'
import { buildZiWeiTransformationLayers } from '@/services/ziwei-enrichment/flows/transformations'
import { fromLocalDateString } from '@/utils/date'
import { EARTHLY_BRANCHES, HEAVENLY_STEMS } from '@/utils/ganzhi'
import { buildZiWeiChart, transformationsOf } from '@/utils/ziwei'
import { referenceSamples } from './fixtures'

const birth = buildBirthChart({ birthDate: '1990-05-15', birthTime: '16:00' })
const chart = buildZiWeiChart({
  yearStem: birth.lunarYear.stem,
  yearBranch: birth.lunarYear.branch,
  lunarMonth: birth.lunarMonth,
  lunarDay: birth.lunarDay,
  hourBranch: birth.hourBranch,
})

function on(date: string) {
  return buildZiWeiTransformationLayers(chart, birth.lunarYear.stem, fromLocalDateString(date))
}

describe('四化曆法時間層', () => {
  it.each([
    ['2024-02-03', 2023, '癸', 12, '乙'],
    ['2024-02-04', 2023, '癸', 12, '乙'],
    ['2024-02-09', 2023, '癸', 12, '乙'],
    ['2024-02-10', 2024, '甲', 1, '丙'],
    ['2023-01-21', 2022, '壬', 12, '癸'],
    ['2023-01-22', 2023, '癸', 1, '甲'],
  ])('%s 依農曆年界與五虎遁定流年和流月', (date, lunarYear, yearStem, month, monthStem) => {
    const result = on(date)
    expect(result).toMatchObject({ date, lunarYear, effectiveMonth: month })
    expect(result.layers.year.sourceStem).toBe(yearStem)
    expect(result.layers.month.sourceStem).toBe(monthStem)
  })

  it.each([
    ['2023-04-05', 15, 2, '乙'],
    ['2023-04-06', 16, 3, '丙'],
    ['2025-08-08', 15, 6, '癸'],
    ['2025-08-09', 16, 7, '甲'],
  ])('%s 閏月按第十五日和第十六日分界', (date, lunarDay, effectiveMonth, stem) => {
    const result = on(date)
    expect(result).toMatchObject({ isLeapMonth: true, lunarDay, effectiveMonth })
    expect(result.layers.month.sourceStem).toBe(stem)
  })

  it('閏十二月後半借次年年干排流月正月', () => {
    expect(resolveFlowMonth('癸', -12, 15)).toMatchObject({
      month: 12,
      stem: '乙',
      nextYear: false,
    })
    expect(resolveFlowMonth('癸', -12, 16)).toMatchObject({ month: 1, stem: '丙', nextYear: true })
    expect(resolveFlowMonth('癸', 12, 16)).toMatchObject({ month: 12, stem: '乙', nextYear: false })
  })

  it('每個年干的正月皆符合五虎遁起寅', () => {
    expect(HEAVENLY_STEMS.map(stem => resolveFlowMonth(stem, 1, 1).stem)).toEqual([
      '丙',
      '戊',
      '庚',
      '壬',
      '甲',
      '丙',
      '戊',
      '庚',
      '壬',
      '甲',
    ])
  })

  it.each([new Date(NaN), new Date(1899, 0, 1), new Date(2101, 0, 1)])(
    '拒絕不支援的日期 %s',
    date => {
      expect(() => resolveFlowCalendar(date)).toThrow(RangeError)
    }
  )

  it('整組年界及閏月盤例的流日四化與既有日干四化一致', () => {
    for (const { birthDate } of [...referenceSamples.yearBoundary, ...referenceSamples.leapMonth]) {
      const date = fromLocalDateString(birthDate)
      const dayStem = lunarService.getLunarData(date).dayGanZhi.charAt(0)
      const result = on(birthDate).layers.day
      expect(result.sourceStem).toBe(dayStem)
      expect(result.entries).toEqual(
        transformationsOf(chart, result.sourceStem).map(({ type, star, palaceIndex }) => ({
          type,
          star,
          palaceBranch: chart.palaces[palaceIndex].branch,
        }))
      )
    }
  })

  it('跨年切換後再選回原日期，四層結果確定且本命層維持相同', () => {
    const earlier = on('2024-02-09')
    const later = on('2024-02-10')
    expect(earlier.layers.natal).toEqual(
      adaptZiWeiChart(chart, birth.lunarYear.stem).natalTransformations
    )
    expect(later.layers.natal).toEqual(earlier.layers.natal)
    expect(later.layers.year.entries.map(entry => entry.star)).toEqual([
      '廉貞',
      '破軍',
      '武曲',
      '太陽',
    ])
    expect(later.layers.month.entries.map(entry => entry.star)).toEqual([
      '天同',
      '天機',
      '文昌',
      '廉貞',
    ])
    expect(later.layers.year).not.toEqual(earlier.layers.year)
    expect(later.layers.month).not.toEqual(earlier.layers.month)
    expect(later.layers.day).not.toEqual(earlier.layers.day)
    for (const layer of Object.values(later.layers)) {
      expect(layer.entries).toHaveLength(4)
      expect(layer.entries.every(entry => EARTHLY_BRANCHES.includes(entry.palaceBranch))).toBe(true)
    }
    expect(on('2024-02-09')).toEqual(earlier)
  })
})
