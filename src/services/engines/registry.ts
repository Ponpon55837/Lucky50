import { BaziTenGodsEngine } from './baziTenGods'
import { ClassicFortuneEngine } from './classic'
import { FengShuiEngine } from './fengShui'
import { ENGINE_SETTINGS_STORAGE_KEY } from './settings'
import { ZiWeiEngine } from './ziWei'
import type {
  EngineInput,
  MetaphysicsEngine,
  MetaphysicsEngineSettings,
  MetaphysicsResult,
} from './types'

export interface AggregatedAdvice {
  warnings: string[]
  opportunities: string[]
  luckyDirection: string
  avoidDirection: string
}

export class MetaphysicsEngineRegistry {
  /** 以 engineId 為鍵；Map 保留註冊順序 */
  private engines = new Map<string, MetaphysicsEngine>()

  /** 註冊命理引擎；同 ID 的引擎會被取代 */
  register(engine: MetaphysicsEngine): void {
    this.engines.set(engine.engineId, engine)
  }

  getEngineById(engineId: string): MetaphysicsEngine | undefined {
    return this.engines.get(engineId)
  }

  getEngines(): MetaphysicsEngine[] {
    return [...this.engines.values()]
  }

  getActiveEngines(): MetaphysicsEngine[] {
    return this.getEngines().filter(engine => engine.isEnabled())
  }

  setEngineEnabled(engineId: string, enabled: boolean): void {
    this.engines.get(engineId)?.setEnabled(enabled)
  }

  setEngineWeight(engineId: string, weight: number): void {
    this.engines.get(engineId)?.setWeight(weight)
  }

  getSettings(): Record<string, MetaphysicsEngineSettings> {
    const settings: Record<string, MetaphysicsEngineSettings> = {}
    for (const [engineId, engine] of this.engines) {
      settings[engineId] = { enabled: engine.isEnabled(), weight: engine.getWeight() }
    }
    return settings
  }

  /** 套用設定；來源可能是手動改過的 localStorage，欄位缺漏或型別不對的部分略過 */
  applySettings(settings: Record<string, Partial<MetaphysicsEngineSettings>>): void {
    if (typeof settings !== 'object' || settings === null) return
    for (const [engineId, setting] of Object.entries(settings)) {
      if (typeof setting?.enabled === 'boolean') this.setEngineEnabled(engineId, setting.enabled)
      if (typeof setting?.weight === 'number') this.setEngineWeight(engineId, setting.weight)
    }
  }

  /** 從 localStorage 載入設定；讀不到或格式錯誤時沿用目前設定 */
  loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(ENGINE_SETTINGS_STORAGE_KEY)
      if (stored) this.applySettings(JSON.parse(stored))
    } catch (error) {
      console.warn('MetaphysicsEngineRegistry - 載入設定失敗，沿用目前設定', error)
    }
  }

  /** 執行所有啟用的引擎；單一引擎失敗不影響其他引擎 */
  calculateAll(input: EngineInput): MetaphysicsResult[] {
    const results: MetaphysicsResult[] = []
    for (const engine of this.getActiveEngines()) {
      try {
        results.push(engine.calculate(input))
      } catch (error) {
        console.error(`MetaphysicsEngineRegistry - 引擎 ${engine.engineId} 計算錯誤:`, error)
      }
    }
    return results
  }

  /**
   * 依引擎權重彙整分數。
   * weighted 為加權平均；沒有可計權重的結果時為 null。
   * 多個引擎平均後，分數的起伏會縮小成約 1/√n（n 為有效引擎數 (Σw)²/Σw²），
   * spread 即 √n，用來把平均後的偏離還原到與單一引擎相同的尺度。
   */
  summarizeScores(results: readonly MetaphysicsResult[]): {
    weighted: number | null
    spread: number
  } {
    let totalWeight = 0
    let squaredWeight = 0
    let weightedSum = 0
    for (const result of results) {
      const weight = this.engines.get(result.engineId)?.getWeight() ?? 0
      weightedSum += result.score * weight
      totalWeight += weight
      squaredWeight += weight * weight
    }
    if (totalWeight === 0) return { weighted: null, spread: 1 }
    return {
      weighted: Math.round(weightedSum / totalWeight),
      spread: totalWeight / Math.sqrt(squaredWeight),
    }
  }

  /** 依引擎權重計算加權平均；沒有可計權重的結果時回傳 null */
  calculateWeightedScore(results: readonly MetaphysicsResult[]): number | null {
    return this.summarizeScores(results).weighted
  }

  /** 彙整各引擎的警示與機會；方位取第一個有提供的引擎 */
  aggregateAdvice(results: readonly MetaphysicsResult[]): AggregatedAdvice {
    const advice: AggregatedAdvice = {
      warnings: [],
      opportunities: [],
      luckyDirection: '',
      avoidDirection: '',
    }
    for (const result of results) {
      if (result.warnings) advice.warnings.push(...result.warnings)
      if (result.opportunities) advice.opportunities.push(...result.opportunities)
      advice.luckyDirection ||= result.luckyDirection ?? ''
      advice.avoidDirection ||= result.avoidDirection ?? ''
    }
    return advice
  }

  clear(): void {
    this.engines.clear()
  }
}

/** 建立含四個內建引擎的註冊表 */
export function createDefaultRegistry(): MetaphysicsEngineRegistry {
  const registry = new MetaphysicsEngineRegistry()
  registry.register(new ClassicFortuneEngine())
  registry.register(new BaziTenGodsEngine())
  registry.register(new ZiWeiEngine())
  registry.register(new FengShuiEngine())
  return registry
}

export const metaphysicsRegistry = createDefaultRegistry()
