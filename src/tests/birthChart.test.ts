import { describe, it, expect } from 'vitest'
import {
  buildBirthChart,
  deriveBirthProfile,
  energyWord,
  toPersonalBaZi,
} from '@/services/engines/birthChart'

describe('buildBirthChart', () => {
  it('不存在的日期直接拒絕，不會被當成另一天排盤', () => {
    for (const birthDate of ['2024-02-31', '2023-02-29', '1990-13-01', '1990-04-31', 'abc']) {
      expect(() => buildBirthChart({ birthDate, birthTime: '08:30' })).toThrow('無效的出生日期')
    }
    expect(() => buildBirthChart({ birthDate: '2024-02-29', birthTime: '08:30' })).not.toThrow()
  })

  it('以節氣四柱與實際時辰建立命盤', () => {
    const chart = buildBirthChart({ birthDate: '1995-06-15', birthTime: '08:30' })
    expect(toPersonalBaZi(chart)).toEqual({
      yearGanZhi: '乙亥',
      monthGanZhi: '壬午',
      dayGanZhi: '丁丑',
      hourGanZhi: '甲辰',
      zodiac: '豬',
      element: '火',
    })
    expect(chart).toMatchObject({ lunarMonth: 5, lunarDay: 18, hourBranch: '辰' })
  })

  it('農曆年前出生，生肖算前一年', () => {
    // 1988-01-03 仍是丁卯年（兔），西元年估算會誤判為龍
    expect(buildBirthChart({ birthDate: '1988-01-03', birthTime: '12:00' }).zodiac).toBe('兔')
  })

  it('立春後、春節前：八字年柱已換，生肖與納音仍依農曆年', () => {
    const chart = buildBirthChart({ birthDate: '1988-02-10', birthTime: '12:00' })
    expect(chart.pillars.year).toEqual({ stem: '戊', branch: '辰' })
    expect(chart.lunarYear).toEqual({ stem: '丁', branch: '卯' })
    expect(chart.zodiac).toBe('兔')
    expect(chart.element).toBe('fire')
  })

  it('閏月前半歸本月、後半歸次月', () => {
    // 2025 年閏六月：8/1 為閏六月初八，8/15 為閏六月廿二
    expect(buildBirthChart({ birthDate: '2025-08-01', birthTime: '12:00' }).lunarMonth).toBe(6)
    expect(buildBirthChart({ birthDate: '2025-08-15', birthTime: '12:00' }).lunarMonth).toBe(7)
  })

  it('未填時間以正午計', () => {
    expect(buildBirthChart({ birthDate: '1995-06-15', birthTime: '' }).hourBranch).toBe('午')
  })

  it('相同出生資料回傳同一份命盤', () => {
    const input = { birthDate: '1990-05-15', birthTime: '10:30' }
    expect(buildBirthChart(input)).toBe(buildBirthChart({ ...input }))
  })

  it('拒絕無效的出生日期', () => {
    expect(() => buildBirthChart({ birthDate: '', birthTime: '' })).toThrow('出生日期不能為空')
    expect(() => buildBirthChart({ birthDate: 'abc', birthTime: '' })).toThrow('無效的出生日期')
    expect(() => buildBirthChart({ birthDate: '1800-01-01', birthTime: '' })).toThrow(
      '出生年份超出範圍'
    )
  })
})

describe('deriveBirthProfile', () => {
  it('由出生日期推算生肖、本命五行與幸運色數', () => {
    expect(deriveBirthProfile('1995-06-15')).toEqual({
      zodiac: '豬',
      element: '火',
      luckyColors: ['紅色', '橙色', '紫色'],
      luckyNumbers: [2, 7, 12, 17],
    })
  })
})

describe('energyWord', () => {
  it('分數轉強中弱', () => {
    expect(energyWord(70)).toBe('強')
    expect(energyWord(50)).toBe('中')
    expect(energyWord(49)).toBe('弱')
  })
})
