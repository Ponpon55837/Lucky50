import { lunarService } from '@/services/lunar'
import { fortuneHistoryStore } from '@/services/fortuneStore'
import {
  BASE_SCORE,
  RECOMMENDATION_RISK,
  clampScore,
  elementEnergy,
  recommendationFromScore,
  type Recommendation,
  type RiskLevel,
} from '@/utils/almanac'
import { toLocalDateString } from '@/utils/date'
import { ELEMENT_CYCLE, parseGanZhi, type ElementKey } from '@/utils/ganzhi'
import { profileHash } from '@/utils/hash'
import { PILLAR_KEYS } from '@/utils/tenGods'
import { metaphysicsRegistry } from './engines'
import { buildBirthChart, toPersonalBaZi } from './engines/birthChart'
import type { LunarData } from '@/services/lunar'
import type { ElementsEnergy, PersonalBaZi } from '@/types'
import type { MetaphysicsResult } from './engines/types'

export interface UserProfileCompat {
  name: string
  birthDate: string
  birthTime: string
  zodiac: string
  element: string
  nameElement: string
  nameStrokes: number
  luckyColors: readonly string[]
  luckyNumbers: readonly number[]
}

export interface IntegratedFortuneData {
  date: Date
  lunarData: LunarData
  personalBaZi: PersonalBaZi

  /** 整體運勢：各引擎平均與五行均衡度的綜合 */
  overallScore: number
  /** 投資運勢：各引擎依權重加權後，還原到單一引擎的起伏尺度 */
  investmentScore: number
  /** 五行能量分佈（百分比） */
  elements: ElementsEnergy

  recommendation: Recommendation
  advice: string
  riskLevel: RiskLevel

  luckyDirection: string
  avoidDirection: string

  warnings: string[]
  opportunities: string[]

  enginesResults: MetaphysicsResult[]
  /** 引擎加權分數；沒有啟用任何引擎時為 0 */
  engineWeightedScore: number
}

const ADVICE_TEXT: Readonly<Record<Recommendation, string>> = {
  BUY: '今日投資運勢佳，適合積極布局。',
  HOLD: '運勢平穩，建議維持現有部位。',
  OBSERVE: '運勢略顯不穩，建議觀望等待時機。',
  SELL: '今日投資運勢不佳，建議避險為主。',
}

const DOMINANT_ELEMENT_TEXT: Readonly<Record<ElementKey, string>> = {
  wood: '木旺之日，利於成長股投資。',
  fire: '火旺之日，適合積極操作。',
  earth: '土旺之日，宜穩健投資。',
  metal: '金旺之日，利於價值投資。',
  water: '水旺之日，宜靈活調配。',
}

/** 整體運勢中引擎平均所佔比重，其餘為五行均衡度（中和為貴） */
const ENGINE_SHARE = 0.7
/** 最旺與最弱五行相差超過此值視為失衡 */
const IMBALANCE_THRESHOLD = 60

/** 單趟找出最旺的五行與旺弱差距 */
function summarizeElements(elements: ElementsEnergy): {
  dominant: ElementKey
  imbalance: number
} {
  let dominant: ElementKey = ELEMENT_CYCLE[0]
  let min = Infinity
  for (const key of ELEMENT_CYCLE) {
    if (elements[key] > elements[dominant]) dominant = key
    if (elements[key] < min) min = elements[key]
  }
  return { dominant, imbalance: elements[dominant] - min }
}

export class IntegratedFortuneService {
  /**
   * 計算整合運勢並寫入歷史。
   * 結果的快取由查詢層（Pinia Colada）負責，鍵含個人資料、日期與引擎設定，這裡不另外快取。
   */
  static async calculateIntegratedFortune(
    profile: UserProfileCompat,
    date: Date = new Date()
  ): Promise<IntegratedFortuneData> {
    metaphysicsRegistry.loadFromStorage()
    const fortune = this.computeFortune(profile, date)
    this.recordFortuneHistory(profile, fortune)
    return fortune
  }

  /** 純計算：不讀設定、不寫歷史，回測逐日評分時使用 */
  static computeFortune(profile: UserProfileCompat, date: Date): IntegratedFortuneData {
    const lunarData = lunarService.getLunarData(date)
    const chart = buildBirthChart(profile)
    const elements = elementEnergy(
      PILLAR_KEYS.map(key => chart.pillars[key]),
      parseGanZhi(lunarData.dayGanZhi)
    )
    const { dominant, imbalance } = summarizeElements(elements)

    const enginesResults = metaphysicsRegistry.calculateAll({
      profile,
      date,
      today: lunarData,
      chart,
    })
    const { weighted, spread } = metaphysicsRegistry.summarizeScores(enginesResults)
    // 沒有啟用任何引擎時，退回只看日子本身的分數
    const investmentScore = clampScore(
      weighted === null
        ? lunarService.getInvestmentAdvice(date).luckyScore
        : BASE_SCORE + (weighted - BASE_SCORE) * spread
    )
    const engineAverage =
      enginesResults.length > 0
        ? enginesResults.reduce((sum, result) => sum + result.score, 0) / enginesResults.length
        : investmentScore
    const overallScore = clampScore(
      engineAverage * ENGINE_SHARE + (100 - imbalance) * (1 - ENGINE_SHARE)
    )

    const recommendation = recommendationFromScore(investmentScore)
    const engineAdvice = metaphysicsRegistry.aggregateAdvice(enginesResults)
    const avoidDirection =
      engineAdvice.avoidDirection || (lunarData.sha ? `正${lunarData.sha}` : '')
    // 財神落在凶方時不列吉方，避免同一個方位既吉又凶
    const fallbackLucky = lunarData.caiShen === avoidDirection ? '' : lunarData.caiShen
    const warnings = [...engineAdvice.warnings]
    if (imbalance > IMBALANCE_THRESHOLD) warnings.unshift('今日五行能量失衡，建議謹慎投資決策。')

    return {
      date,
      lunarData,
      personalBaZi: toPersonalBaZi(chart),
      overallScore,
      investmentScore,
      elements,
      recommendation,
      advice: `${ADVICE_TEXT[recommendation]} ${DOMINANT_ELEMENT_TEXT[dominant]}`,
      riskLevel: RECOMMENDATION_RISK[recommendation],
      luckyDirection: engineAdvice.luckyDirection || fallbackLucky,
      avoidDirection,
      warnings,
      opportunities: [...this.seasonalOpportunities(lunarData), ...engineAdvice.opportunities],
      enginesResults,
      engineWeightedScore: weighted ?? 0,
    }
  }

  private static seasonalOpportunities(lunarData: LunarData): string[] {
    const opportunities: string[] = []
    if (lunarData.jieQi) opportunities.push(`今日${lunarData.jieQi}，適合檢視投資配置。`)
    for (const festival of lunarData.festivals) {
      if (festival.includes('財神') || festival.includes('開市')) {
        opportunities.push(`${festival}，利於財運投資。`)
      }
    }
    return opportunities
  }

  /** 自動記錄運勢到 IndexedDB（非阻塞，失敗靜默） */
  private static recordFortuneHistory(
    profile: UserProfileCompat,
    fortune: IntegratedFortuneData
  ): void {
    const enginesResults = fortune.enginesResults.map(result => ({
      engineId: result.engineId,
      engineName: result.engineName,
      score: result.score,
      weight: metaphysicsRegistry.getEngineById(result.engineId)?.getWeight() ?? 0,
    }))

    fortuneHistoryStore
      .append({
        id: Date.now(),
        date: toLocalDateString(fortune.date),
        timestamp: Date.now(),
        overallScore: fortune.overallScore,
        investmentScore: fortune.investmentScore,
        recommendation: fortune.recommendation === 'OBSERVE' ? 'HOLD' : fortune.recommendation,
        elements: fortune.elements,
        lunarSummary: fortune.advice,
        enginesResults,
        engineWeightedScore: fortune.engineWeightedScore,
        userProfileHash: profileHash(profile),
      })
      .catch(() => {})
  }
}
