import { describe, it, expect, beforeEach } from 'vitest'
import { FengShuiEngine } from '@/services/engines/fengShui'
import type { UserProfileCompat } from '@/services/integratedFortune'
import type { LunarData } from '@/services/lunar'
import type { PersonalBaZi, ElementsEnergy } from '@/types'

describe('FengShuiEngine', () => {
  let engine: FengShuiEngine

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
    engine = new FengShuiEngine()
  })

  it('should have correct metadata', () => {
    expect(engine.name).toBe('風水方位')
    expect(engine.version).toBe('1.0.0')
  })

  it('should calculate feng shui results', () => {
    const result = engine.calculate(
      mockProfile,
      new Date('2024-06-15'),
      mockLunarData,
      mockBaZi,
      mockElements
    )

    expect(result.engineId).toBe('feng-shui')
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
    expect(result.confidence).toBe(0.65)
    expect(result.summary).toBeTruthy()
    expect(result.luckyDirection).toBeTruthy()
    expect(result.avoidDirection).toBeTruthy()
  })

  it('should have lucky and avoid directions', () => {
    const result = engine.calculate(
      mockProfile,
      new Date('2024-06-15'),
      mockLunarData,
      mockBaZi,
      mockElements
    )

    const details = result.details as Record<string, unknown>
    expect(details.luckyDirections).toBeDefined()
    expect(details.avoidDirections).toBeDefined()
    expect(details.dailyFortune).toBeDefined()

    const lucky = details.luckyDirections as Array<{ direction: string; score: number }>
    expect(lucky.length).toBeGreaterThan(0)
    expect(lucky[0].score).toBeGreaterThan(0)
  })

  it('should calculate daily fortune', () => {
    const result = engine.calculate(
      mockProfile,
      new Date('2024-06-15'),
      mockLunarData,
      mockBaZi,
      mockElements
    )

    const details = result.details as Record<string, unknown>
    const daily = details.dailyFortune as {
      stem: string
      branch: string
      element: string
      overallScore: number
      advice: string
    }

    expect(daily.stem).toBeTruthy()
    expect(daily.branch).toBeTruthy()
    expect(daily.element).toBeTruthy()
    expect(daily.overallScore).toBeGreaterThanOrEqual(20)
    expect(daily.overallScore).toBeLessThanOrEqual(95)
    expect(daily.advice).toBeTruthy()
  })

  it('should produce different results for different dates', () => {
    const result1 = engine.calculate(
      mockProfile,
      new Date('2024-06-15'),
      mockLunarData,
      mockBaZi,
      mockElements
    )
    const result2 = engine.calculate(
      mockProfile,
      new Date('2024-06-16'),
      mockLunarData,
      mockBaZi,
      mockElements
    )

    // 不同日期應產生不同的流日干支
    const details1 = result1.details as Record<string, unknown>
    const details2 = result2.details as Record<string, unknown>
    const daily1 = details1.dailyFortune as { stem: string; branch: string }
    const daily2 = details2.dailyFortune as { stem: string; branch: string }

    // 相鄰兩天的天干應不同（除非跨旬）
    expect(daily1.branch).not.toBe(daily2.branch)
  })

  it('should support enable/disable and weight', () => {
    expect(engine.isEnabled()).toBe(true)
    engine.setEnabled(false)
    expect(engine.isEnabled()).toBe(false)

    expect(engine.getWeight()).toBe(15)
    engine.setWeight(30)
    expect(engine.getWeight()).toBe(30)
  })
})
