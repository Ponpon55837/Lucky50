import type { MetaphysicsEngine, MetaphysicsResult } from './types'
import type { UserProfileCompat } from '@/services/integratedFortune'
import type { LunarData } from '@/services/lunar'
import type { PersonalBaZi, ElementsEnergy } from '@/types'

export class ClassicFortuneEngine implements MetaphysicsEngine {
  readonly engineId = 'classic'
  readonly name = '經典命理'
  readonly description = '經典運勢計算（五行能量 + 生肖 + 干支）'
  readonly version = '1.0.0'

  private weight = 30
  private enabled = true

  calculate(
    _profile: UserProfileCompat,
    _date: Date,
    _lunarData: LunarData,
    _personalBaZi: PersonalBaZi,
    _elements: ElementsEnergy
  ): MetaphysicsResult {
    // 經典引擎不產生額外分數，它的貢獻已直接在 IntegratedFortuneService 中計算
    // 這裡只提供基礎建議
    return {
      engineName: this.name,
      score: 50,
      advice: ['經典五行分析已納入計算'],
    }
  }

  getWeight(): number {
    return this.weight
  }

  setWeight(weight: number): void {
    this.weight = Math.max(0, Math.min(100, weight))
  }

  isEnabled(): boolean {
    return this.enabled
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }
}
