import { describe, it, expect } from 'vitest'
// @ts-expect-error - lunar-javascript doesn't have TypeScript definitions
import { Solar } from 'lunar-javascript'
import {
  SEASON_MARKERS,
  SOLAR_TERMS,
  daysBetween,
  solarTermIndex,
  solarTermProgress,
} from '@/utils/solarTerms'

describe('solarTermIndex', () => {
  it('簡體與繁體名稱都能對應', () => {
    expect(solarTermIndex('立春')).toBe(0)
    expect(solarTermIndex('惊蛰')).toBe(2)
    expect(solarTermIndex('谷雨')).toBe(5)
    expect(solarTermIndex('穀雨')).toBe(5)
    expect(solarTermIndex('大寒')).toBe(23)
    expect(solarTermIndex('中秋')).toBe(-1)
  })

  it('lunar-javascript 節氣表的每個名稱都對應得到', () => {
    const table: Record<string, unknown> = Solar.fromYmd(2026, 6, 1).getLunar().getJieQiTable()
    const names = Object.keys(table).filter(name => /^\p{Script=Han}+$/u.test(name))
    expect(names.length).toBe(24)
    for (const name of names) expect(solarTermIndex(name)).toBeGreaterThanOrEqual(0)
  })

  it('方位節氣都在表中', () => {
    for (const name of SEASON_MARKERS) expect(SOLAR_TERMS).toContain(name)
  })
})

describe('daysBetween', () => {
  it('以日期計算，不受時分影響', () => {
    expect(daysBetween(new Date(2026, 10, 7, 23, 0), new Date(2026, 10, 8, 1, 0))).toBe(1)
    expect(daysBetween(new Date(2026, 10, 14), new Date(2026, 10, 7))).toBe(-7)
  })
})

describe('solarTermProgress', () => {
  it('節氣之間：立冬後第 7 天、距小雪 8 天', () => {
    const progress = solarTermProgress(new Date(2026, 10, 14))!
    expect(progress.current).toBe('立冬')
    expect(progress.next).toBe('小雪')
    expect(progress.daysIn).toBe(7)
    expect(progress.daysLeft).toBe(8)
    expect(progress.fraction).toBeCloseTo(7 / 15)
  })

  it('交節當天算新節氣', () => {
    const progress = solarTermProgress(new Date(2026, 10, 7))!
    expect(progress.current).toBe('立冬')
    expect(progress.daysIn).toBe(0)
    expect(progress.fraction).toBe(0)
  })

  it('穀雨以繁體回傳', () => {
    expect(solarTermProgress(new Date(2026, 3, 25))!.current).toBe('穀雨')
  })
})
