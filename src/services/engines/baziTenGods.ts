import type { MetaphysicsEngine, MetaphysicsResult } from './types'
import type { UserProfileCompat } from '@/services/integratedFortune'
import type { LunarData } from '@/services/lunar'
import type { PersonalBaZi, ElementsEnergy } from '@/types'
import {
  calculateFourPillarsTenGods,
  countTenGods,
  findDominantTenGods,
  inferInvestmentPersonality,
  TEN_GODS_INVESTMENT_STYLE,
} from '@/utils/tenGods'

// 八字十神引擎：基於四柱推斷投資性格
export class BaziTenGodsEngine implements MetaphysicsEngine {
  readonly engineId = 'bazi-ten-gods'
  readonly name = '八字十神'
  readonly description = '基於八字四柱的十神分析，推斷投資性格與風格'
  readonly version = '1.0.0'

  private enabled = true
  private weight = 25

  calculate(
    _profile: UserProfileCompat,
    _date: Date,
    _lunarData: LunarData,
    personalBaZi: PersonalBaZi,
    _elements: ElementsEnergy
  ): MetaphysicsResult {
    const distribution = calculateFourPillarsTenGods(
      personalBaZi.yearGanZhi,
      personalBaZi.monthGanZhi,
      personalBaZi.dayGanZhi,
      personalBaZi.hourGanZhi
    )

    const counts = countTenGods(distribution)
    const dominantGods = findDominantTenGods(counts)
    const personality = inferInvestmentPersonality(distribution)

    const maxCount = Math.max(...Object.values(counts))
    const concentration = maxCount / 4
    const score = Math.round(30 + concentration * 50)

    const summary = dominantGods.map(god => `${god}(${TEN_GODS_INVESTMENT_STYLE[god]})`).join('、')

    return {
      engineId: 'bazi-ten-gods',
      engineName: this.name,
      score,
      confidence: 0.7,
      summary: `${personality.description} 主要十神：${summary}`,
      personality: personality.description,
      details: {
        distribution,
        counts,
        dominantGods: [...dominantGods],
        investmentStyle: personality.style,
        investmentDescription: personality.description,
      } as Record<string, unknown>,
      metadata: {
        yearGanZhi: personalBaZi.yearGanZhi,
        monthGanZhi: personalBaZi.monthGanZhi,
        dayGanZhi: personalBaZi.dayGanZhi,
        hourGanZhi: personalBaZi.hourGanZhi,
      } as Record<string, unknown>,
    }
  }

  getWeight(): number {
    return this.weight
  }

  setWeight(w: number): void {
    this.weight = Math.max(0, Math.min(100, w))
  }

  isEnabled(): boolean {
    return this.enabled
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }
}
