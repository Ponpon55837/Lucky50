import { describe, it, expect, beforeEach } from 'vitest'
import { BaziTenGodsEngine } from '@/services/engines/baziTenGods'
import type { UserProfileCompat } from '@/services/integratedFortune'
import type { LunarData } from '@/services/lunar'
import type { PersonalBaZi, ElementsEnergy } from '@/types'

describe('BaziTenGodsEngine', () => {
  let engine: BaziTenGodsEngine

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
    engine = new BaziTenGodsEngine()
  })

  it('should have correct metadata', () => {
    expect(engine.name).toBe('八字十神')
    expect(engine.version).toBe('1.0.0')
  })

  it('should calculate ten gods distribution', () => {
    const result = engine.calculate(
      mockProfile,
      new Date('2024-01-15'),
      mockLunarData,
      mockBaZi,
      mockElements
    )

    expect(result.engineId).toBe('bazi-ten-gods')
    expect(result.score).toBeGreaterThanOrEqual(30)
    expect(result.score).toBeLessThanOrEqual(80)
    expect(result.confidence).toBe(0.7)
    expect(result.summary).toBeTruthy()
    expect(result.personality).toBeTruthy()
  })

  it('should return valid metadata with gan-zhi', () => {
    const result = engine.calculate(
      mockProfile,
      new Date('2024-01-15'),
      mockLunarData,
      mockBaZi,
      mockElements
    )

    expect(result.metadata).toBeDefined()
    expect(result.metadata!.yearGanZhi).toBe('庚午')
    expect(result.metadata!.monthGanZhi).toBe('辛巳')
  })

  it('should support enable/disable and weight', () => {
    expect(engine.isEnabled()).toBe(true)
    engine.setEnabled(false)
    expect(engine.isEnabled()).toBe(false)

    expect(engine.getWeight()).toBe(25)
    engine.setWeight(50)
    expect(engine.getWeight()).toBe(50)
    engine.setWeight(150)
    expect(engine.getWeight()).toBe(100)
    engine.setWeight(-10)
    expect(engine.getWeight()).toBe(0)
  })

  it('should return consistent results for same input', () => {
    const result1 = engine.calculate(
      mockProfile,
      new Date('2024-01-15'),
      mockLunarData,
      mockBaZi,
      mockElements
    )
    const result2 = engine.calculate(
      mockProfile,
      new Date('2024-01-15'),
      mockLunarData,
      mockBaZi,
      mockElements
    )

    expect(result1.score).toBe(result2.score)
    expect(result1.summary).toBe(result2.summary)
  })
})
