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

  // 香港天文台 2024 年曆：立春 2/4 16:27（UTC+8），正月初一 2/10。
  // https://www.hko.gov.hk/tc/gts/astron2024/files/HKO_almanac_2024.pdf
  // 2/4、2/9、2/10 的 JDN 為 2460345、2460350、2460351。
  // 以 (JDN + 49) % 60（甲子起算 0）核對日柱，月干與時干查天文台表四及表五。
  // https://www.hko.gov.hk/tc/gts/time/stemsandbranches.htm
  // Lucky50 沿用流派 2：晚子時日柱取當日，時柱取次日子時的干支。
  // https://6tail.cn/calendar/lunar.bazi.html
  it.each([
    ['2024-02-04', '16:26', '癸卯 乙丑 戊戌 庚申', { stem: '癸', branch: '卯' }, 12, 25],
    ['2024-02-04', '16:28', '甲辰 丙寅 戊戌 庚申', { stem: '癸', branch: '卯' }, 12, 25],
    ['2024-02-09', '22:59', '甲辰 丙寅 癸卯 癸亥', { stem: '癸', branch: '卯' }, 12, 30],
    ['2024-02-09', '23:00', '甲辰 丙寅 癸卯 甲子', { stem: '癸', branch: '卯' }, 12, 30],
    ['2024-02-10', '00:00', '甲辰 丙寅 甲辰 甲子', { stem: '甲', branch: '辰' }, 1, 1],
  ])(
    '立春或晚子時邊界 %s %s 的四柱為 %s',
    (birthDate, birthTime, expectedPillars, lunarYear, lunarMonth, lunarDay) => {
      const chart = buildBirthChart({ birthDate, birthTime })
      const { yearGanZhi, monthGanZhi, dayGanZhi, hourGanZhi } = toPersonalBaZi(chart)

      expect([yearGanZhi, monthGanZhi, dayGanZhi, hourGanZhi].join(' ')).toBe(expectedPillars)
      expect(chart).toMatchObject({ lunarYear, lunarMonth, lunarDay })
    }
  )

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
