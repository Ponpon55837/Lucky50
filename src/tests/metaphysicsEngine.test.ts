import { describe, it, expect, beforeEach } from 'vitest'
import { MetaphysicsEngineRegistry } from '@/services/engines/registry'
import { ClassicFortuneEngine } from '@/services/engines/classic'
import type { MetaphysicsEngine, MetaphysicsResult } from '@/services/engines/types'
import type { UserProfileCompat } from '@/services/integratedFortune'
import type { LunarData } from '@/services/lunar'
import type { PersonalBaZi, ElementsEnergy } from '@/types'

// 測試用虛擬引擎
class MockEngine implements MetaphysicsEngine {
  readonly engineId: string
  readonly name: string
  readonly description = '測試引擎'
  readonly version = '1.0.0'
  private weight = 10
  private enabled = true
  private mockScore: number

  constructor(engineId: string, name?: string, score = 50) {
    this.engineId = engineId
    this.name = name || engineId
    this.mockScore = score
  }

  calculate(): MetaphysicsResult {
    return {
      engineId: this.engineId,
      engineName: this.name,
      score: this.mockScore,
      advice: ['測試建議'],
    }
  }

  getWeight(): number {
    return this.weight
  }

  setWeight(weight: number): void {
    this.weight = weight
  }

  isEnabled(): boolean {
    return this.enabled
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }
}

describe('MetaphysicsEngineRegistry', () => {
  let registry: MetaphysicsEngineRegistry

  const mockProfile: UserProfileCompat = {
    name: '測試用戶',
    birthDate: '1990-05-15',
    birthTime: '08:30',
    zodiac: '馬',
    element: '金',
    nameElement: '水',
    nameStrokes: 20,
    luckyColors: ['白色', '金色'],
    luckyNumbers: [4, 9],
  }

  const mockLunarData: LunarData = {
    lunarYear: '庚午年',
    lunarMonth: '四月',
    lunarDay: '廿一日',
    ganZhi: '庚午',
    monthGanZhi: '辛巳',
    dayGanZhi: '壬寅',
    zodiac: '馬',
    constellation: '金牛座',
    naYin: '路旁土',
    jieQi: '立夏',
    festivals: [],
    yi: ['開市', '交易'],
    ji: ['破土'],
    pengZu: '壬不汲水',
    naYinDay: '金簿金',
    jiuXing: '一白',
  }

  const mockBaZi: PersonalBaZi = {
    yearGanZhi: '庚午',
    monthGanZhi: '辛巳',
    dayGanZhi: '壬寅',
    hourGanZhi: '戊申',
    zodiac: '馬',
    element: '金',
    naYin: '路旁土',
  }

  const mockElements: ElementsEnergy = {
    wood: 20,
    fire: 15,
    earth: 10,
    metal: 35,
    water: 20,
  }

  beforeEach(() => {
    registry = new MetaphysicsEngineRegistry()
  })

  describe('引擎註冊', () => {
    it('should register an engine', () => {
      const engine = new MockEngine('test')
      registry.register(engine)
      expect(registry.getEngineById('test')).toBe(engine)
    })

    it('should register multiple engines', () => {
      registry.register(new MockEngine('engine1'))
      registry.register(new MockEngine('engine2'))
      expect(registry.getEngines()).toHaveLength(2)
    })

    it('should overwrite existing engine with same name', () => {
      registry.register(new MockEngine('test', 'test', 50))
      registry.register(new MockEngine('test', 'test', 80))
      expect(registry.getEngines()).toHaveLength(1)
    })
  })

  describe('引擎啟用/停用', () => {
    it('should enable engine by default', () => {
      const engine = new MockEngine('test')
      registry.register(engine)
      expect(engine.isEnabled()).toBe(true)
    })

    it('should disable engine', () => {
      const engine = new MockEngine('test')
      registry.register(engine)
      registry.setEngineEnabled('test', false)
      expect(engine.isEnabled()).toBe(false)
    })

    it('should only return active engines', () => {
      registry.register(new MockEngine('active'))
      registry.register(new MockEngine('inactive'))
      registry.setEngineEnabled('inactive', false)
      expect(registry.getActiveEngines()).toHaveLength(1)
      expect(registry.getActiveEngines()[0].engineId).toBe('active')
    })
  })

  describe('引擎權重', () => {
    it('should set default weight', () => {
      const engine = new MockEngine('test')
      registry.register(engine)
      expect(engine.getWeight()).toBe(10)
    })

    it('should update engine weight', () => {
      const engine = new MockEngine('test')
      registry.register(engine)
      registry.setEngineWeight('test', 50)
      expect(engine.getWeight()).toBe(50)
    })

    it('should clamp weight to 0-100', () => {
      const engine = new MockEngine('test')
      registry.register(engine)
      registry.setEngineWeight('test', 150)
      expect(engine.getWeight()).toBe(100)
      registry.setEngineWeight('test', -10)
      expect(engine.getWeight()).toBe(0)
    })
  })

  describe('結果聚合', () => {
    it('should calculate all active engines', () => {
      registry.register(new MockEngine('engine1'))
      registry.register(new MockEngine('engine2'))
      registry.setEngineEnabled('engine2', false)

      const results = registry.calculateAll(
        mockProfile,
        new Date(),
        mockLunarData,
        mockBaZi,
        mockElements
      )
      expect(results).toHaveLength(1)
      expect(results[0].engineId).toBe('engine1')
    })

    it('should calculate weighted score', () => {
      registry.register(new MockEngine('high', 'high', 80))
      registry.register(new MockEngine('low', 'low', 40))
      registry.setEngineWeight('high', 70)
      registry.setEngineWeight('low', 30)

      const results = registry.calculateAll(
        mockProfile,
        new Date(),
        mockLunarData,
        mockBaZi,
        mockElements
      )

      const weightedScore = registry.calculateWeightedScore(results)
      // (80 * 70 + 40 * 30) / (70 + 30) = (5600 + 1200) / 100 = 68
      expect(weightedScore).toBe(68)
    })

    it('should return 0 for empty results', () => {
      expect(registry.calculateWeightedScore([])).toBe(0)
    })
  })

  describe('設定管理', () => {
    it('should get current settings', () => {
      registry.register(new MockEngine('test'))
      registry.setEngineWeight('test', 50)
      registry.setEngineEnabled('test', false)

      const settings = registry.getSettings()
      expect(settings.test).toEqual({ enabled: false, weight: 50 })
    })

    it('should apply settings', () => {
      registry.register(new MockEngine('engine1'))
      registry.register(new MockEngine('engine2'))

      registry.applySettings({
        engine1: { enabled: false, weight: 80 },
        engine2: { enabled: true, weight: 20 },
      })

      const settings = registry.getSettings()
      expect(settings.engine1).toEqual({ enabled: false, weight: 80 })
      expect(settings.engine2).toEqual({ enabled: true, weight: 20 })
    })
  })

  describe('loadFromStorage', () => {
    it('should load settings from localStorage', () => {
      const key = 'lucky50-engine-settings'
      localStorage.setItem(key, JSON.stringify({ test: { enabled: false, weight: 75 } }))

      registry.register(new MockEngine('test'))
      registry.loadFromStorage()

      const engine = registry.getEngineById('test')
      expect(engine?.isEnabled()).toBe(false)
      expect(engine?.getWeight()).toBe(75)

      localStorage.removeItem(key)
    })

    it('should use defaults when localStorage is empty', () => {
      registry.register(new MockEngine('test'))
      registry.loadFromStorage()

      const engine = registry.getEngineById('test')
      expect(engine?.isEnabled()).toBe(true)

      localStorage.removeItem('lucky50-engine-settings')
    })
  })

  describe('aggregateAdvice', () => {
    it('should aggregate warnings and opportunities from results', () => {
      const results: MetaphysicsResult[] = [
        {
          engineId: 'e1',
          engineName: 'engine1',
          score: 60,
          warnings: ['警告一'],
          opportunities: ['機會一'],
          luckyDirection: '東方',
        },
        {
          engineId: 'e2',
          engineName: 'engine2',
          score: 70,
          warnings: ['警告二'],
          opportunities: ['機會二'],
          avoidDirection: '西方',
        },
      ]

      const advice = registry.aggregateAdvice(results)
      expect(advice.warnings).toEqual(['警告一', '警告二'])
      expect(advice.opportunities).toEqual(['機會一', '機會二'])
      expect(advice.luckyDirection).toBe('東方')
      expect(advice.avoidDirection).toBe('西方')
    })
  })

  describe('清除', () => {
    it('should clear all engines and settings', () => {
      registry.register(new MockEngine('test'))
      registry.clear()
      expect(registry.getEngines()).toHaveLength(0)
      expect(registry.getSettings()).toEqual({})
    })
  })
})

describe('ClassicFortuneEngine', () => {
  it('should have correct metadata', () => {
    const engine = new ClassicFortuneEngine()
    expect(engine.engineId).toBe('classic')
    expect(engine.name).toBe('經典命理')
    expect(engine.isEnabled()).toBe(true)
    expect(engine.getWeight()).toBe(30)
  })

  it('should return basic result', () => {
    const engine = new ClassicFortuneEngine()
    const result = engine.calculate(
      {} as UserProfileCompat,
      new Date(),
      {} as LunarData,
      {} as PersonalBaZi,
      {} as ElementsEnergy
    )
    expect(result.engineName).toBe('經典命理')
    expect(result.score).toBe(50)
    expect(result.advice).toContain('經典五行分析已納入計算')
  })
})
