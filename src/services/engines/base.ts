import { applyFactors, type ScoreFactor } from '@/utils/almanac'
import type { EngineMeta } from './settings'
import type { EngineInput, MetaphysicsEngine, MetaphysicsResult } from './types'

/** 引擎共用的基本資料、權重與啟用狀態 */
export abstract class BaseEngine implements MetaphysicsEngine {
  readonly engineId: string
  readonly name: string
  readonly description: string
  readonly version: string

  private enabled = true
  private weight: number

  constructor(meta: EngineMeta) {
    this.engineId = meta.id
    this.name = meta.name
    this.description = meta.description
    this.version = meta.version
    this.weight = meta.defaultWeight
  }

  abstract calculate(input: EngineInput): MetaphysicsResult

  /** 由加減項組出共同欄位，各引擎只需補上自己的說明 */
  protected result(
    factors: ScoreFactor[],
    extra: Omit<MetaphysicsResult, 'engineId' | 'engineName' | 'score' | 'factors'>
  ): MetaphysicsResult {
    return {
      engineId: this.engineId,
      engineName: this.name,
      score: applyFactors(factors),
      factors,
      ...extra,
    }
  }

  getWeight(): number {
    return this.weight
  }

  /** 非有限數值（例如設定檔殘缺）一律忽略，沿用原權重 */
  setWeight(weight: number): void {
    if (Number.isFinite(weight)) this.weight = Math.max(0, Math.min(100, weight))
  }

  isEnabled(): boolean {
    return this.enabled
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }
}

/** 加減項寫成一句話，例如「值日青龍黃道（+10）」 */
export function describeFactor({ label, delta }: ScoreFactor): string {
  return `${label}（${delta > 0 ? '+' : ''}${delta}）`
}
