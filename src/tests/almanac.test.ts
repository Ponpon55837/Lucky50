import { describe, it, expect } from 'vitest'
import {
  EARTHLY_BRANCHES,
  VERSES,
  buildHourWheel,
  classifyTradingDay,
  clashAnimal,
  clashOf,
  controls,
  describeElements,
  parentOf,
  drawLot,
  formatHourRange,
  gradeFromScore,
  overlapsMarket,
  primaryMarketSlotIndex,
  seasonalStrength,
  toChineseNumber,
  tradeItemsFirst,
  zodiacBranch,
  type LotGrade,
} from '@/utils/almanac'

describe('地支與時辰', () => {
  it('六沖：子午、巳亥相沖', () => {
    expect(clashOf('子')).toBe('午')
    expect(clashOf('亥')).toBe('巳')
  })

  it('子時跨日、巳時為 09–11', () => {
    expect(formatHourRange('子')).toBe('23:00–01:00')
    expect(formatHourRange('巳')).toBe('09:00–11:00')
  })

  it('只有巳、午、未與台股交易時段重疊', () => {
    const inMarket = EARTHLY_BRANCHES.filter(overlapsMarket)
    expect(inMarket).toEqual(['巳', '午', '未'])
  })

  it('生肖轉地支', () => {
    expect(zodiacBranch('馬')).toBe('午')
    expect(zodiacBranch('未知')).toBeNull()
  })
})

describe('buildHourWheel', () => {
  it('回傳十二時辰且順序固定', () => {
    const wheel = buildHourWheel('馬', '辰')
    expect(wheel.map(slot => slot.branch)).toEqual([...EARTHLY_BRANCHES])
  })

  it('三合為吉、生肖沖害為凶、日支相沖為凶', () => {
    const wheel = buildHourWheel('馬', '辰')
    const omen = (branch: string) => wheel.find(slot => slot.branch === branch)!.omen
    expect(omen('寅')).toBe('good')
    expect(omen('子')).toBe('bad')
    expect(omen('戌')).toBe('bad') // 辰日沖戌，凶優先於三合
    expect(omen('卯')).toBe('neutral')
  })

  it('未知生肖時全部為平或日沖', () => {
    const wheel = buildHourWheel('?', '?')
    expect(wheel.every(slot => slot.omen === 'neutral')).toBe(true)
  })
})

describe('seasonalStrength', () => {
  it('亥月：水旺、木相、金休、土囚、火死', () => {
    expect(seasonalStrength('亥')).toEqual({
      water: '旺',
      wood: '相',
      metal: '休',
      earth: '囚',
      fire: '死',
    })
  })

  it('午月：火旺、土相、木休、水囚、金死', () => {
    expect(seasonalStrength('午')).toEqual({
      fire: '旺',
      earth: '相',
      wood: '休',
      water: '囚',
      metal: '死',
    })
  })

  it('非地支回傳 null', () => {
    expect(seasonalStrength('X')).toBeNull()
  })
})

describe('classifyTradingDay', () => {
  const base = { yi: [], ji: [], dayBranch: '辰', zodiac: '馬' }

  it('宜交易類事項為吉', () => {
    expect(classifyTradingDay({ ...base, yi: ['祭祀', '納財'] })).toBe('good')
  })

  it('日支沖生肖為凶，即使宜交易', () => {
    expect(classifyTradingDay({ ...base, yi: ['交易'], dayBranch: '子' })).toBe('bad')
  })

  it('忌開市為凶', () => {
    expect(classifyTradingDay({ ...base, ji: ['開市'] })).toBe('bad')
  })

  it('其他為平', () => {
    expect(classifyTradingDay(base)).toBe('neutral')
  })
})

describe('籤詩', () => {
  it('分數對應籤等', () => {
    const cases: Array<[number, LotGrade]> = [
      [95, '上吉'],
      [80, '上吉'],
      [72, '中吉'],
      [50, '小吉'],
      [40, '平'],
      [10, '小凶'],
    ]
    for (const [score, grade] of cases) expect(gradeFromScore(score)).toBe(grade)
  })

  it('每首籤詩都是四句七言', () => {
    for (const verses of Object.values(VERSES)) {
      for (const verse of verses) {
        expect(verse).toHaveLength(4)
        for (const line of verse) expect([...line]).toHaveLength(7)
      }
    }
  })

  it('同一種子抽到同一支籤；重搖只換籤詩、不換籤等', () => {
    const first = drawLot(72, 1234)
    expect(drawLot(72, 1234)).toEqual(first)
    const again = drawLot(72, 1234, 1)
    expect(again.grade).toBe(first.grade)
    expect(again.verse).not.toEqual(first.verse)
  })

  it('籤號落在 1–60', () => {
    for (let seed = 0; seed < 200; seed += 7) {
      const { number } = drawLot(60, seed)
      expect(number).toBeGreaterThanOrEqual(1)
      expect(number).toBeLessThanOrEqual(60)
    }
  })

  it('中文數字', () => {
    expect(toChineseNumber(1)).toBe('一')
    expect(toChineseNumber(10)).toBe('十')
    expect(toChineseNumber(17)).toBe('十七')
    expect(toChineseNumber(27)).toBe('二十七')
    expect(toChineseNumber(60)).toBe('六十')
  })
})

describe('describeElements', () => {
  const winter = seasonalStrength('亥')!

  it('本命火在冬月偏弱，木相能生火，姓名屬木為助力', () => {
    const reading = describeElements(winter, 'fire', 'wood')
    expect(reading.headline).toBe('水當令，你的火偏弱')
    expect(reading.details.some(line => line.includes('木能生火'))).toBe(true)
    expect(reading.details.some(line => line.includes('姓名屬木，正好幫你一把'))).toBe(true)
  })

  it('姓名五行剋本命時提醒克制', () => {
    const reading = describeElements(winter, 'fire', 'water')
    expect(reading.details.some(line => line.includes('今天更要克制'))).toBe(true)
  })

  it('沒有本命五行時只回傳月令', () => {
    expect(describeElements(winter, null, null).headline).toBe('水當令')
  })

  it('本命當令時為正旺', () => {
    expect(describeElements(winter, 'water', null).headline).toBe('水當令，你的水正旺')
  })
})

describe('相生相剋', () => {
  it('木生火、水剋火', () => {
    expect(parentOf('fire')).toBe('wood')
    expect(controls('water')).toBe('fire')
  })
})

describe('tradeItemsFirst', () => {
  it('交易相關排前面，其餘保持原順序', () => {
    expect(tradeItemsFirst(['祭祀', '納財', '出行', '交易'])).toEqual([
      '納財',
      '交易',
      '祭祀',
      '出行',
    ])
  })
})

describe('clashAnimal', () => {
  it('只取被沖生肖', () => {
    expect(clashAnimal('(丙戌)狗')).toBe('狗')
    expect(clashAnimal('')).toBe('')
  })
})

describe('primaryMarketSlotIndex', () => {
  it('優先選開盤時段的吉時', () => {
    const wheel = buildHourWheel('馬', '辰')
    expect(wheel[primaryMarketSlotIndex(wheel)].branch).toBe('午')
  })

  it('開盤時段沒有吉時時選第一個開盤時辰', () => {
    const wheel = buildHourWheel('?', '?')
    expect(wheel[primaryMarketSlotIndex(wheel)].branch).toBe('巳')
  })
})
