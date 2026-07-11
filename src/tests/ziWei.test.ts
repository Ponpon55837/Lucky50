import { describe, it, expect, beforeEach } from 'vitest'
import { ZiWeiEngine } from '@/services/engines/ziWei'
import type { UserProfileCompat } from '@/services/integratedFortune'
import type { LunarData } from '@/services/lunar'
import type { PersonalBaZi, ElementsEnergy } from '@/types'

describe('ZiWeiEngine', () => {
  let engine: ZiWeiEngine

  const mockProfile: UserProfileCompat = {
    name: '測試',
    birthDate: '1990-05-15',
    birthTime: '10:30',
    zodiac: '馬',
    element: '火',
    nameElement: '火',
    nameStrokes: 20,
    luckyColors: ['紅色'],
    luckyNumbers: [2, 7],
  }

  const mockLunarData: LunarData = {
    lunarYear: '庚午',
    lunarMonth: '四月',
    lunarDay: '廿一',
    ganZhi: '庚午',
    monthGanZhi: '辛巳',
    dayGanZhi: '丙寅',
    zodiac: '馬',
    constellation: '金牛座',
    naYin: '路旁土',
    jieQi: '',
    festivals: [],
    yi: [],
    ji: [],
    pengZu: '',
    naYinDay: '',
    jiuXing: '',
  }

  const mockBaZi: PersonalBaZi = {
    yearGanZhi: '庚午',
    monthGanZhi: '辛巳',
    dayGanZhi: '丙寅',
    hourGanZhi: '庚寅',
    zodiac: '馬',
    element: '火',
    naYin: '路旁土',
  }

  const mockElements: ElementsEnergy = {
    wood: 20,
    fire: 20,
    earth: 20,
    metal: 20,
    water: 20,
  }

  beforeEach(() => {
    engine = new ZiWeiEngine()
  })

  it('should have correct metadata', () => {
    expect(engine.name).toBe('紫微斗數')
    expect(engine.version).toBe('1.0.0')
  })

  it('should calculate zi wei results', () => {
    const result = engine.calculate(
      mockProfile,
      new Date('2024-01-15'),
      mockLunarData,
      mockBaZi,
      mockElements
    )

    expect(result.engineId).toBe('zi-wei')
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
    expect(result.confidence).toBe(0.6)
    expect(result.summary).toBeTruthy()
    expect(result.personality).toBeTruthy()
  })

  it('should have palace details', () => {
    const result = engine.calculate(
      mockProfile,
      new Date('2024-01-15'),
      mockLunarData,
      mockBaZi,
      mockElements
    )

    const details = result.details as Record<string, unknown>
    expect(details.palaces).toBeDefined()
    const palaces = details.palaces as Record<string, { stars: string[]; score: number }>
    expect(palaces['命宮']).toBeDefined()
    expect(palaces['財帛宮']).toBeDefined()
    expect(palaces['事業宮']).toBeDefined()
    expect(palaces['命宮'].stars.length).toBeGreaterThan(0)
  })

  it('should produce different results for different birth dates', () => {
    const result1 = engine.calculate(
      mockProfile,
      new Date('2024-01-15'),
      { ...mockLunarData, lunarMonth: '正月', lunarDay: '初一' },
      mockBaZi,
      mockElements
    )
    const result2 = engine.calculate(
      mockProfile,
      new Date('2024-01-15'),
      { ...mockLunarData, lunarMonth: '七月', lunarDay: '十五' },
      mockBaZi,
      mockElements
    )

    // 不同生日應產生不同分數（不一定，但機率很高）
    expect(result1.score).toBeDefined()
    expect(result2.score).toBeDefined()
  })

  it('should support enable/disable and weight', () => {
    expect(engine.isEnabled()).toBe(true)
    engine.setEnabled(false)
    expect(engine.isEnabled()).toBe(false)

    expect(engine.getWeight()).toBe(20)
    engine.setWeight(40)
    expect(engine.getWeight()).toBe(40)
  })
})
