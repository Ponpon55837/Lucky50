import { describe, it, expect } from 'vitest'
import { getElementFromName, getKangxiStrokes } from '@/utils/nameStrokes'

describe('getKangxiStrokes', () => {
  it('部首以原形計：氵算水四畫、艹算艸六畫、阝分阜八畫與邑七畫', () => {
    expect(getKangxiStrokes('江')).toBe(7) // 水 4 + 3
    expect(getKangxiStrokes('蔡')).toBe(17) // 艸 6 + 11
    expect(getKangxiStrokes('陳')).toBe(16) // 阜 8 + 8
    expect(getKangxiStrokes('鄭')).toBe(19) // 邑 7 + 12
    expect(getKangxiStrokes('珍')).toBe(10) // 玉 5 + 5
  })

  it('部首本身用實際筆畫', () => {
    expect(getKangxiStrokes('王')).toBe(4)
    expect(getKangxiStrokes('玉')).toBe(5)
    expect(getKangxiStrokes('水')).toBe(4)
  })

  it('常見姓氏', () => {
    const expected: Record<string, number> = {
      林: 8,
      黃: 12,
      張: 11,
      李: 7,
      吳: 7,
      劉: 15,
      楊: 13,
      許: 11,
      謝: 17,
      郭: 15,
      葉: 15,
      蘇: 22,
      羅: 20,
    }
    for (const [char, strokes] of Object.entries(expected)) {
      expect(getKangxiStrokes(char), char).toBe(strokes)
    }
  })

  it('數字依數值計', () => {
    expect([...'一二三四五六七八九十'].map(getKangxiStrokes)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ])
  })

  it('非漢字查不到筆畫', () => {
    expect(getKangxiStrokes('A')).toBe(0)
    expect(getKangxiStrokes('。')).toBe(0)
  })
})

describe('getElementFromName', () => {
  it('筆畫加總取尾數對應五行', () => {
    // 陳 16 + 大 3 + 文 4 = 23 → 尾數 3 屬火
    expect(getElementFromName('陳大文')).toEqual({
      element: '火',
      totalStrokes: 23,
      unknownChars: [],
    })
    expect(getElementFromName('林').element).toBe('金')
    expect(getElementFromName('王玉').element).toBe('水') // 4 + 5 = 9
  })

  it('去除前後空白', () => {
    expect(getElementFromName('  林  ').totalStrokes).toBe(8)
  })

  it('空字串沒有五行', () => {
    expect(getElementFromName('')).toEqual({ element: '', totalStrokes: 0, unknownChars: [] })
  })

  it('查不到的字列出並不計入', () => {
    expect(getElementFromName('林A')).toEqual({
      element: '金',
      totalStrokes: 8,
      unknownChars: ['A'],
    })
  })
})
