import { describe, it, expect } from 'vitest'
// @ts-expect-error - lunar-javascript doesn't have TypeScript definitions
import { Solar } from 'lunar-javascript'
import { s2t } from 'chinese-s2t'
import {
  VERSES,
  applyFactors,
  assessTradingDay,
  buildHourWheel,
  classifyTradingDay,
  clashAnimal,
  describeElements,
  drawLot,
  elementEnergy,
  formatHourRange,
  gradeFromScore,
  hourOfficer,
  overlapsMarket,
  primaryMarketSlotIndex,
  recommendationFromScore,
  seasonalStrength,
  toChineseNumber,
  tradeItemsFirst,
  type LotGrade,
} from '@/utils/almanac'
import { EARTHLY_BRANCHES, parseGanZhi } from '@/utils/ganzhi'

describe('時辰', () => {
  it('子時跨日、巳時為 09–11', () => {
    expect(formatHourRange('子')).toBe('23:00–01:00')
    expect(formatHourRange('巳')).toBe('09:00–11:00')
  })

  it('只有巳、午、未與台股交易時段重疊', () => {
    const inMarket = EARTHLY_BRANCHES.filter(overlapsMarket)
    expect(inMarket).toEqual(['巳', '午', '未'])
  })
})

describe('黃道黑道十二神', () => {
  it('子午日青龍起申', () => {
    expect(hourOfficer('午', '申')).toEqual({ name: '青龍', auspicious: true })
    expect(hourOfficer('子', '酉')).toEqual({ name: '明堂', auspicious: true })
    expect(hourOfficer('午', '巳')).toEqual({ name: '玄武', auspicious: false })
  })

  it('連續六十天、每個時辰都與通書（lunar-javascript）一致', () => {
    for (let offset = 0; offset < 60; offset++) {
      const lunar = Solar.fromYmd(2026, 11, 1).next(offset).getLunar()
      const dayBranch = lunar.getDayZhi()
      // getTimes() 含早子與晚子共十三筆，取前十二筆
      for (const time of lunar.getTimes().slice(0, 12)) {
        const officer = hourOfficer(dayBranch, time.getZhi())
        expect(officer.name).toBe(s2t(time.getTianShen()))
        expect(officer.auspicious).toBe(time.getTianShenLuck() === '吉')
      }
    }
  })
})

describe('buildHourWheel', () => {
  const omens = (zodiac: string, dayGanZhi: string) =>
    Object.fromEntries(buildHourWheel(zodiac, dayGanZhi).map(slot => [slot.branch, slot]))

  it('回傳十二時辰並附時干支與值時神', () => {
    const wheel = buildHourWheel('豬', '甲午')
    expect(wheel.map(slot => slot.branch)).toEqual([...EARTHLY_BRANCHES])
    expect(wheel[5]).toMatchObject({ ganZhi: '己巳', officer: '玄武', range: '09:00–11:00' })
  })

  it('甲午日屬豬：巳時沖本命為凶、午時司命黃道為吉、未時黑道逢三合為平', () => {
    const slots = omens('豬', '甲午')
    expect(slots['巳']).toMatchObject({ omen: 'bad', reason: '沖生肖豬' })
    expect(slots['午']).toMatchObject({ omen: 'good', reason: '司命黃道' })
    expect(slots['未']).toMatchObject({ omen: 'neutral', reason: '勾陳黑道，與生肖豬三合' })
  })

  it('日破優先：甲午日子時與日支相沖', () => {
    expect(omens('豬', '甲午')['子']).toMatchObject({ omen: 'bad', reason: '日破，與日支午相沖' })
  })

  it('同一個人的開盤時辰吉凶會隨日子改變', () => {
    expect(omens('豬', '乙未')['午'].omen).toBe('bad') // 天牢黑道
    expect(omens('豬', '丙申')['未'].omen).toBe('good') // 玉堂黃道又三合
    expect(omens('豬', '丁酉')['午'].omen).toBe('good') // 金匱黃道

    const patterns = new Set<string>()
    for (let offset = 0; offset < 60; offset++) {
      const dayGanZhi = Solar.fromYmd(2026, 11, 1).next(offset).getLunar().getDayInGanZhi()
      patterns.add(
        buildHourWheel('豬', dayGanZhi)
          .filter(slot => slot.inMarket)
          .map(slot => slot.omen)
          .join()
      )
    }
    expect(patterns.size).toBeGreaterThanOrEqual(4)
  })

  it('黃道逢相害降為平', () => {
    // 丙申日巳時天德黃道，但寅巳相害
    expect(omens('虎', '丙申')['巳']).toMatchObject({
      omen: 'neutral',
      reason: '天德黃道，與生肖虎相害',
    })
  })

  it('生肖不明時只看黃黑道與日破', () => {
    const slots = omens('?', '甲午')
    expect(slots['巳'].omen).toBe('bad')
    expect(slots['巳'].reason).toBe('玄武黑道')
    expect(slots['申'].omen).toBe('good')
  })

  it('日干支無效時回傳空陣列', () => {
    expect(buildHourWheel('豬', '?')).toEqual([])
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
    const wheel = buildHourWheel('豬', '甲午')
    expect(wheel[primaryMarketSlotIndex(wheel)].branch).toBe('午')
  })

  it('開盤時段沒有吉時時選第一個開盤時辰', () => {
    // 屬鼠逢甲午日：巳時黑道、午時沖本命、未時黑道又相害
    const wheel = buildHourWheel('鼠', '甲午')
    expect(wheel[primaryMarketSlotIndex(wheel)].branch).toBe('巳')
    expect(primaryMarketSlotIndex([])).toBe(0)
  })
})

describe('擇日評分', () => {
  const day = {
    tianShen: '青龍',
    tianShenLuck: '吉',
    zhiXing: '危',
    yi: ['開市', '納財'],
    ji: ['上樑'],
    dayBranch: '午',
    yearBranch: '午',
    zodiac: '',
  }

  it('不看個人時只計值日天神、建除與宜忌', () => {
    const factors = assessTradingDay(day)
    expect(factors).toEqual([
      { label: '值日青龍黃道', delta: 10 },
      { label: '建除值「危」', delta: 8 },
      { label: '宜交易類事項', delta: 12 },
    ])
    expect(applyFactors(factors)).toBe(80)
  })

  it('日支與太歲沖本命時扣分', () => {
    const factors = assessTradingDay({ ...day, zodiac: '鼠' })
    expect(factors).toContainEqual({ label: '日支午與生肖鼠相沖', delta: -18 })
    expect(factors).toContainEqual({ label: '沖太歲', delta: -5 })
    expect(applyFactors(factors)).toBe(57)
  })

  it('黑道、破日、忌交易', () => {
    const factors = assessTradingDay({
      ...day,
      tianShen: '白虎',
      tianShenLuck: '凶',
      zhiXing: '破',
      ji: ['交易'],
    })
    expect(applyFactors(factors)).toBe(50 - 10 - 14 - 12)
  })

  it('分數限制在 5–95', () => {
    expect(applyFactors([{ label: 'x', delta: 100 }])).toBe(95)
    expect(applyFactors([{ label: 'x', delta: -100 }])).toBe(5)
  })

  it('分數對應建議', () => {
    expect([80, 75, 60, 40, 39].map(recommendationFromScore)).toEqual([
      'BUY',
      'BUY',
      'HOLD',
      'OBSERVE',
      'SELL',
    ])
  })
})

describe('elementEnergy', () => {
  const pillars = ['乙亥', '壬午', '丁丑', '甲辰'].map(text => parseGanZhi(text)!)
  const total = (energy: Record<string, number>) =>
    Object.values(energy).reduce((sum, value) => sum + value, 0)

  it('命盤與流日合計約為 100', () => {
    const energy = elementEnergy(pillars, parseGanZhi('甲午'))
    expect(Math.abs(total(energy) - 100)).toBeLessThanOrEqual(2)
  })

  it('流日干支會改變分佈', () => {
    const wood = elementEnergy(pillars, parseGanZhi('甲寅'))
    const metal = elementEnergy(pillars, parseGanZhi('庚申'))
    expect(wood.wood).toBeGreaterThan(metal.wood)
    expect(metal.metal).toBeGreaterThan(wood.metal)
  })

  it('純木命盤木佔全部', () => {
    const energy = elementEnergy([parseGanZhi('甲寅')!, parseGanZhi('乙卯')!], null)
    expect(energy.wood).toBeGreaterThan(80)
  })
})
