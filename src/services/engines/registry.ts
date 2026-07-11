import type { MetaphysicsEngine, MetaphysicsResult, MetaphysicsEngineSettings } from './types'
import type { UserProfileCompat } from '@/services/integratedFortune'
import type { LunarData } from '@/services/lunar'
import type { PersonalBaZi, ElementsEnergy } from '@/types'

const SETTINGS_STORAGE_KEY = 'lucky50-engine-settings'

// 預設引擎權重
const DEFAULT_WEIGHTS: Record<string, number> = {
  classic: 30,
  'bazi-ten-gods': 25,
  'zi-wei': 20,
  'feng-shui': 15,
}

export class MetaphysicsEngineRegistry {
  private engines = new Map<string, MetaphysicsEngine>()
  private engineIdMap = new Map<string, string>() // engineId → engine.name
  private settings = new Map<string, MetaphysicsEngineSettings>()

  /**
   * 註冊命理引擎
   */
  register(engine: MetaphysicsEngine): void {
    if (this.engines.has(engine.name)) {
      console.warn(`MetaphysicsEngineRegistry - 引擎 ${engine.name} 已存在，將被覆蓋`)
    }
    this.engines.set(engine.name, engine)
    this.engineIdMap.set(engine.engineId, engine.name)

    // 設定預設值（如果尚未有設定）
    if (!this.settings.has(engine.engineId)) {
      this.settings.set(engine.engineId, {
        enabled: true,
        weight: DEFAULT_WEIGHTS[engine.engineId] || 10,
      })
    }

    const setting = this.settings.get(engine.engineId)!
    engine.setEnabled(setting.enabled)
    engine.setWeight(setting.weight)

    console.log(
      `MetaphysicsEngineRegistry - 註冊引擎: ${engine.engineId} (${engine.name}) weight: ${setting.weight}`
    )
  }

  /**
   * 依 engineId 取得引擎
   */
  getEngineById(engineId: string): MetaphysicsEngine | undefined {
    const name = this.engineIdMap.get(engineId)
    return name ? this.engines.get(name) : undefined
  }

  /**
   * 取得所有已註冊引擎
   */
  getEngines(): MetaphysicsEngine[] {
    return Array.from(this.engines.values())
  }

  /**
   * 取得所有啟用的引擎
   */
  getActiveEngines(): MetaphysicsEngine[] {
    return this.getEngines().filter(e => e.isEnabled())
  }

  /**
   * 設定引擎啟用狀態（by engineId）
   */
  setEngineEnabled(engineId: string, enabled: boolean): void {
    const engine = this.getEngineById(engineId)
    if (engine) {
      engine.setEnabled(enabled)
      const setting = this.settings.get(engineId) || { enabled: true, weight: 10 }
      setting.enabled = enabled
      this.settings.set(engineId, setting)
    }
  }

  /**
   * 設定引擎權重（by engineId）
   */
  setEngineWeight(engineId: string, weight: number): void {
    const engine = this.getEngineById(engineId)
    if (engine) {
      const clampedWeight = Math.max(0, Math.min(100, weight))
      engine.setWeight(clampedWeight)
      const setting = this.settings.get(engineId) || { enabled: true, weight: 10 }
      setting.weight = clampedWeight
      this.settings.set(engineId, setting)
    }
  }

  /**
   * 取得所有引擎設定
   */
  getSettings(): Record<string, MetaphysicsEngineSettings> {
    const result: Record<string, MetaphysicsEngineSettings> = {}
    this.settings.forEach((value, key) => {
      result[key] = { ...value }
    })
    return result
  }

  /**
   * 套用設定（by engineId）
   */
  applySettings(settings: Record<string, MetaphysicsEngineSettings>): void {
    Object.entries(settings).forEach(([engineId, setting]) => {
      this.setEngineEnabled(engineId, setting.enabled)
      this.setEngineWeight(engineId, setting.weight)
    })
  }

  /**
   * 從 localStorage 載入設定並套用至所有已註冊引擎
   */
  loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, { enabled: boolean; weight: number }>
        this.applySettings(parsed)
        console.log('MetaphysicsEngineRegistry - 已從 localStorage 載入設定')
      }
    } catch {
      // 使用預設值
      console.warn('MetaphysicsEngineRegistry - 載入設定失敗，使用預設值')
    }
  }

  /**
   * 執行所有啟用的引擎並聚合結果
   */
  calculateAll(
    profile: UserProfileCompat,
    date: Date,
    lunarData: LunarData,
    personalBaZi: PersonalBaZi,
    elements: ElementsEnergy
  ): MetaphysicsResult[] {
    const activeEngines = this.getActiveEngines()
    const results: MetaphysicsResult[] = []

    for (const engine of activeEngines) {
      try {
        const result = engine.calculate(profile, date, lunarData, personalBaZi, elements)
        results.push(result)
      } catch (error) {
        console.error(`MetaphysicsEngineRegistry - 引擎 ${engine.engineId} 計算錯誤:`, error)
      }
    }

    return results
  }

  /**
   * 計算加權總分
   */
  calculateWeightedScore(results: MetaphysicsResult[]): number {
    if (results.length === 0) return 0

    let totalWeight = 0
    let weightedSum = 0

    for (const result of results) {
      // 依 engineId 找引擎權重
      const engineId = result.engineId || ''
      const engine = this.getEngineById(engineId)
      if (engine) {
        const weight = engine.getWeight()
        weightedSum += result.score * weight
        totalWeight += weight
      }
    }

    return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0
  }

  /**
   * 聚合引擎結果中的建議、警告、機會
   */
  aggregateAdvice(results: MetaphysicsResult[]): {
    warnings: string[]
    opportunities: string[]
    luckyDirection: string
    avoidDirection: string
  } {
    const warnings: string[] = []
    const opportunities: string[] = []
    let luckyDirection = ''
    let avoidDirection = ''

    for (const result of results) {
      if (result.warnings) warnings.push(...result.warnings)
      if (result.opportunities) opportunities.push(...result.opportunities)
      if (result.luckyDirection && !luckyDirection) luckyDirection = result.luckyDirection
      if (result.avoidDirection && !avoidDirection) avoidDirection = result.avoidDirection
    }

    return { warnings, opportunities, luckyDirection, avoidDirection }
  }

  /**
   * 清除所有引擎和設定
   */
  clear(): void {
    this.engines.clear()
    this.engineIdMap.clear()
    this.settings.clear()
  }
}

// 單例實例
export const metaphysicsRegistry = new MetaphysicsEngineRegistry()
