import type { MetaphysicsEngine, MetaphysicsResult } from './types'
import type { UserProfileCompat } from '@/services/integratedFortune'
import type { LunarData } from '@/services/lunar'
import type { PersonalBaZi, ElementsEnergy } from '@/types'

// 八卦方位對應
const TRIGRAM_DIRECTIONS: Record<string, { direction: string; element: string; angle: number }> = {
  乾: { direction: '西北', element: 'metal', angle: 315 },
  兌: { direction: '西方', element: 'metal', angle: 270 },
  離: { direction: '南方', element: 'fire', angle: 180 },
  震: { direction: '東方', element: 'wood', angle: 90 },
  巽: { direction: '東南', element: 'wood', angle: 135 },
  坎: { direction: '北方', element: 'water', angle: 0 },
  艮: { direction: '東北', element: 'earth', angle: 45 },
  坤: { direction: '西南', element: 'earth', angle: 225 },
}

// 五行相生
const GENERATES: Record<string, string> = {
  wood: 'fire',
  fire: 'earth',
  earth: 'metal',
  metal: 'water',
  water: 'wood',
}

// 流日天干地支（簡化：以日期偏移計算）
const TEN_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const TWELVE_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

// 天干五行
const STEM_ELEMENT: Record<string, string> = {
  甲: 'wood',
  乙: 'wood',
  丙: 'fire',
  丁: 'fire',
  戊: 'earth',
  己: 'earth',
  庚: 'metal',
  辛: 'metal',
  壬: 'water',
  癸: 'water',
}

// 地支五行
const BRANCH_ELEMENT: Record<string, string> = {
  子: 'water',
  丑: 'earth',
  寅: 'wood',
  卯: 'wood',
  辰: 'earth',
  巳: 'fire',
  午: 'fire',
  未: 'earth',
  申: 'metal',
  酉: 'metal',
  戌: 'earth',
  亥: 'water',
}

// 生肖配對（六合）
const ZODIAC_SIX_HARMONY: Record<string, string> = {
  鼠: '牛',
  虎: '豬',
  兔: '狗',
  龍: '雞',
  蛇: '猴',
  馬: '羊',
  牛: '鼠',
  豬: '虎',
  狗: '兔',
  雞: '龍',
  猴: '蛇',
  羊: '馬',
}

// 生肖三合
const ZODIAC_THREE_HARMONY: Record<string, string[]> = {
  鼠: ['猴', '龍'],
  牛: ['蛇', '雞'],
  虎: ['馬', '狗'],
  兔: ['羊', '豬'],
  龍: ['猴', '鼠'],
  蛇: ['雞', '牛'],
  馬: ['狗', '虎'],
  羊: ['豬', '兔'],
  猴: ['鼠', '龍'],
  雞: ['牛', '蛇'],
  狗: ['虎', '馬'],
  豬: ['兔', '羊'],
}

// 生肖六沖
const ZODIAC_SIX_CLASH: Record<string, string> = {
  鼠: '馬',
  牛: '羊',
  虎: '猴',
  兔: '雞',
  龍: '狗',
  蛇: '豬',
  馬: '鼠',
  羊: '牛',
  猴: '虎',
  雞: '兔',
  狗: '龍',
  豬: '蛇',
}

// 五行中文對應
const ELEMENT_LABEL: Record<string, string> = {
  wood: '木',
  fire: '火',
  earth: '土',
  metal: '金',
  water: '水',
}

// 計算流日干支
function calculateDailyGanZhi(date: Date): { stem: string; branch: string } {
  // 簡化：以 2024-01-01 (甲子日) 為基準
  const base = new Date(2024, 0, 1)
  const diff = Math.floor((date.getTime() - base.getTime()) / (1000 * 60 * 60 * 24))
  const stemIdx = ((diff % 10) + 10) % 10
  const branchIdx = ((diff % 12) + 12) % 12
  return { stem: TEN_STEMS[stemIdx], branch: TWELVE_BRANCHES[branchIdx] }
}

// 計算增強方位（考慮五行、生肖、流日）
function calculateEnhancedDirection(
  personalBaZi: PersonalBaZi,
  lunarData: LunarData,
  date: Date
): {
  luckyDirections: Array<{ direction: string; reason: string; score: number }>
  avoidDirections: Array<{ direction: string; reason: string }>
  dailyFortune: {
    stem: string
    branch: string
    element: string
    favorableElements: string[]
    unfavorableElements: string[]
    overallScore: number
    advice: string
  }
} {
  const dayElement = STEM_ELEMENT[personalBaZi.dayGanZhi[0]] || 'earth'
  const userElement = personalBaZi.element
  const dailyGZ = calculateDailyGanZhi(date)
  const dailyElement = STEM_ELEMENT[dailyGZ.stem]

  // 計算每個方位的分數
  const directionScores: Array<{
    direction: string
    trigram: string
    score: number
    reason: string
  }> = []

  for (const [trigram, info] of Object.entries(TRIGRAM_DIRECTIONS)) {
    let score = 50
    const reasons: string[] = []

    // 五行相生加分
    if (GENERATES[dayElement] === info.element) {
      score += 20
      reasons.push(`日干${ELEMENT_LABEL[dayElement]}生${ELEMENT_LABEL[info.element]}`)
    }
    if (GENERATES[info.element] === dayElement) {
      score += 15
      reasons.push(`${ELEMENT_LABEL[info.element]}生日干`)
    }

    // 同五行加分
    if (dayElement === info.element) {
      score += 10
      reasons.push('同五行')
    }

    // 生肖合沖
    const userZodiac = lunarData.zodiac
    const harmony = ZODIAC_SIX_HARMONY[userZodiac]
    const clashes = ZODIAC_SIX_CLASH[userZodiac]
    if (harmony && info.element === BRANCH_ELEMENT[harmony]) {
      score += 10
      reasons.push('六合加成')
    }
    if (clashes && info.element === BRANCH_ELEMENT[clashes]) {
      score -= 20
      reasons.push('六沖減分')
    }

    directionScores.push({
      direction: info.direction,
      trigram,
      score: Math.max(0, Math.min(100, score)),
      reason: reasons.join('、') || '基本方位',
    })
  }

  // 排序取吉方
  directionScores.sort((a, b) => b.score - a.score)
  const luckyDirections = directionScores.slice(0, 3).map(d => ({
    direction: d.direction,
    reason: d.reason,
    score: d.score,
  }))

  // 凶方
  const avoidDirections = directionScores.slice(-2).map(d => ({
    direction: d.direction,
    reason: '能量較弱或相剋',
  }))

  // 流日吉凶
  const favorableElements = [GENERATES[dailyElement], dailyElement]
  const unfavorableElements = [
    Object.entries(GENERATES).find(([_, v]) => v === dailyElement)?.[0] || '',
    Object.entries(GENERATES).find(([k, _]) => k === dailyElement)?.[0] || '',
  ]

  // 流日分數
  let dailyScore = 60
  if (dailyElement === userElement) dailyScore += 15
  if (GENERATES[dailyElement] === userElement) dailyScore += 10
  if (GENERATES[userElement] === dailyElement) dailyScore += 5

  const zodiacHarmony = ZODIAC_THREE_HARMONY[lunarData.zodiac] || []
  if (zodiacHarmony.includes(lunarData.zodiac)) dailyScore += 5

  dailyScore = Math.max(20, Math.min(95, dailyScore))

  const advice =
    dailyScore >= 75
      ? '今日能量充沛，適合積極行動'
      : dailyScore >= 55
        ? '今日能量平穩，適合穩健操作'
        : '今日能量較弱，建議保守觀望'

  return {
    luckyDirections,
    avoidDirections,
    dailyFortune: {
      stem: dailyGZ.stem,
      branch: dailyGZ.branch,
      element: dailyElement,
      favorableElements,
      unfavorableElements: unfavorableElements.filter(Boolean),
      overallScore: dailyScore,
      advice,
    },
  }
}

export class FengShuiEngine implements MetaphysicsEngine {
  readonly engineId = 'feng-shui'
  readonly name = '風水方位'
  readonly description = '基於五行、生肖、流日的風水方位與吉凶分析'
  readonly version = '1.0.0'

  private enabled = true
  private weight = 15

  calculate(
    _profile: UserProfileCompat,
    date: Date,
    lunarData: LunarData,
    personalBaZi: PersonalBaZi,
    _elements: ElementsEnergy
  ): MetaphysicsResult {
    const analysis = calculateEnhancedDirection(personalBaZi, lunarData, date)

    const overallScore = Math.round(
      (analysis.luckyDirections.reduce((sum, d) => sum + d.score, 0) /
        analysis.luckyDirections.length) *
        0.6 +
        analysis.dailyFortune.overallScore * 0.4
    )

    return {
      engineId: 'feng-shui',
      engineName: this.name,
      score: overallScore,
      confidence: 0.65,
      summary: `吉方：${analysis.luckyDirections.map(d => d.direction).join('、')}，流日${analysis.dailyFortune.stem}${analysis.dailyFortune.branch}（${ELEMENT_LABEL[analysis.dailyFortune.element] || analysis.dailyFortune.element}）`,
      details: {
        luckyDirections: analysis.luckyDirections,
        avoidDirections: analysis.avoidDirections,
        dailyFortune: analysis.dailyFortune,
      } as Record<string, unknown>,
      luckyDirection: analysis.luckyDirections[0]?.direction,
      avoidDirection: analysis.avoidDirections[0]?.direction,
      luckyElements: analysis.dailyFortune.favorableElements,
      avoidElements: analysis.dailyFortune.unfavorableElements,
      metadata: {
        dailyGanZhi: `${analysis.dailyFortune.stem}${analysis.dailyFortune.branch}`,
        dailyElement: analysis.dailyFortune.element,
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
