import type { MetaphysicsEngine, MetaphysicsResult } from './types'
import type { UserProfileCompat } from '@/services/integratedFortune'
import type { LunarData } from '@/services/lunar'
import type { PersonalBaZi, ElementsEnergy } from '@/types'

// 14 主星
export type ZiWeiStar =
  | '紫微'
  | '天機'
  | '太陽'
  | '武曲'
  | '天同'
  | '廉貞'
  | '天府'
  | '太陰'
  | '貪狼'
  | '巨門'
  | '天相'
  | '天梁'
  | '七殺'
  | '破軍'

// 三星宮位
export type ZiWeiPalace = '命宮' | '財帛宮' | '事業宮'

// 星曜投資屬性
const STAR_INVESTMENT_ATTRIBUTE: Record<
  ZiWeiStar,
  {
    style: string
    risk: 'low' | 'medium' | 'high'
    strength: number
  }
> = {
  紫微: { style: '領導決策型', risk: 'medium', strength: 90 },
  天機: { style: '謀略規劃型', risk: 'low', strength: 70 },
  太陽: { style: '積極外向型', risk: 'high', strength: 85 },
  武曲: { style: '執行力強型', risk: 'medium', strength: 80 },
  天同: { style: '穩健保守型', risk: 'low', strength: 60 },
  廉貞: { style: '冒險突破型', risk: 'high', strength: 75 },
  天府: { style: '穩健守成型', risk: 'low', strength: 85 },
  太陰: { style: '細膩觀察型', risk: 'low', strength: 65 },
  貪狼: { style: '多變靈活型', risk: 'high', strength: 80 },
  巨門: { style: '分析批判型', risk: 'medium', strength: 70 },
  天相: { style: '協調平衡型', risk: 'low', strength: 65 },
  天梁: { style: '長線佈局型', risk: 'low', strength: 75 },
  七殺: { style: '果斷行動型', risk: 'high', strength: 90 },
  破軍: { style: '開創突破型', risk: 'high', strength: 85 },
}

// 從生日計算紫微星位置（簡化版）
// 使用農曆月日作為索引
function calculateZiWeiPosition(lunarMonth: number, lunarDay: number): number {
  // 簡化：以農曆月日計算紫微星在12宮中的位置
  const total = lunarMonth * 2 + Math.floor(lunarDay / 15)
  return total % 12
}

// 根據紫微星位置推算14主星分佈
function distributeStars(ziWeiPos: number): Record<ZiWeiPalace, ZiWeiStar[]> {
  const allStars: ZiWeiStar[] = [
    '紫微',
    '天機',
    '太陽',
    '武曲',
    '天同',
    '廉貞',
    '天府',
    '太陰',
    '貪狼',
    '巨門',
    '天相',
    '天梁',
    '七殺',
    '破軍',
  ]

  // 簡化分配：每宮分配3-5顆星
  const palace: Record<ZiWeiPalace, ZiWeiStar[]> = {
    命宮: [],
    財帛宮: [],
    事業宮: [],
  }

  const palaces: ZiWeiPalace[] = ['命宮', '財帛宮', '事業宮']

  for (let i = 0; i < allStars.length; i++) {
    const palaceIdx = (ziWeiPos + i) % 3
    palace[palaces[palaceIdx]].push(allStars[i])
  }

  return palace
}

// 計算宮位投資分數
function calculatePalaceScore(
  stars: ZiWeiStar[],
  palaceType: ZiWeiPalace
): { score: number; dominantStar: ZiWeiStar; risk: string } {
  if (stars.length === 0) {
    return { score: 50, dominantStar: '紫微', risk: 'medium' }
  }

  // 計算平均強度
  let totalStrength = 0
  let dominantStar = stars[0]
  let maxStrength = 0
  let totalRisk = 0

  for (const star of stars) {
    const attr = STAR_INVESTMENT_ATTRIBUTE[star]
    totalStrength += attr.strength
    if (attr.strength > maxStrength) {
      maxStrength = attr.strength
      dominantStar = star
    }
    totalRisk += attr.risk === 'high' ? 2 : attr.risk === 'medium' ? 1 : 0
  }

  const avgStrength = totalStrength / stars.length
  const avgRisk = totalRisk / stars.length
  const riskLabel = avgRisk >= 1.5 ? '高風險' : avgRisk >= 0.5 ? '中風險' : '低風險'

  // 根據宮位類型調整分數
  let score = Math.round(avgStrength)
  if (palaceType === '財帛宮') {
    score = Math.round(score * 1.1) // 財帛宮加成
  } else if (palaceType === '事業宮') {
    score = Math.round(score * 0.9) // 事業宮稍微保守
  }

  return {
    score: Math.min(100, Math.max(0, score)),
    dominantStar,
    risk: riskLabel,
  }
}

export class ZiWeiEngine implements MetaphysicsEngine {
  readonly engineId = 'zi-wei'
  readonly name = '紫微斗數'
  readonly description = '基於紫微斗數十四主星的簡化投資分析'
  readonly version = '1.0.0'

  private enabled = true
  private weight = 20

  calculate(
    _profile: UserProfileCompat,
    _date: Date,
    lunarData: LunarData,
    _personalBaZi: PersonalBaZi,
    _elements: ElementsEnergy
  ): MetaphysicsResult {
    // 解析農曆月日
    const lunarMonth = this.parseLunarMonth(lunarData.lunarMonth)
    const lunarDay = this.parseLunarDay(lunarData.lunarDay)

    const ziWeiPos = calculateZiWeiPosition(lunarMonth, lunarDay)
    const palaces = distributeStars(ziWeiPos)

    const lifeResult = calculatePalaceScore(palaces.命宮, '命宮')
    const wealthResult = calculatePalaceScore(palaces.財帛宮, '財帛宮')
    const careerResult = calculatePalaceScore(palaces.事業宮, '事業宮')

    // 綜合分數：命宮40% + 財帛宮35% + 事業宮25%
    const overallScore = Math.round(
      lifeResult.score * 0.4 + wealthResult.score * 0.35 + careerResult.score * 0.25
    )

    // 找出最強宮位的主星
    const dominantStars = [
      {
        palace: '命宮',
        star: lifeResult.dominantStar,
        score: lifeResult.score,
        risk: lifeResult.risk,
      },
      {
        palace: '財帛宮',
        star: wealthResult.dominantStar,
        score: wealthResult.score,
        risk: wealthResult.risk,
      },
      {
        palace: '事業宮',
        star: careerResult.dominantStar,
        score: careerResult.score,
        risk: careerResult.risk,
      },
    ].sort((a, b) => b.score - a.score)

    const topStar = dominantStars[0]
    const starAttr = STAR_INVESTMENT_ATTRIBUTE[topStar.star as ZiWeiStar]

    return {
      engineId: 'zi-wei',
      engineName: this.name,
      score: overallScore,
      confidence: 0.6,
      summary: `命主星「${topStar.star}」（${starAttr.style}），投資風險偏好：${topStar.risk}`,
      personality: starAttr.style,
      details: {
        palaces: {
          命宮: { stars: palaces.命宮, ...lifeResult },
          財帛宮: { stars: palaces.財帛宮, ...wealthResult },
          事業宮: { stars: palaces.事業宮, ...careerResult },
        },
        dominantStar: topStar.star,
        investmentStyle: starAttr.style,
        riskProfile: topStar.risk,
      } as Record<string, unknown>,
      metadata: {
        ziWeiPosition: ziWeiPos,
        lunarMonth,
        lunarDay,
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

  // 解析農曆月（中文數字 → 數字）
  private parseLunarMonth(monthStr: string): number {
    const monthMap: Record<string, number> = {
      正月: 1,
      二月: 2,
      三月: 3,
      四月: 4,
      五月: 5,
      六月: 6,
      七月: 7,
      八月: 8,
      九月: 9,
      十月: 10,
      冬月: 11,
      臘月: 12,
      十一月: 11,
      十二月: 12,
    }
    return monthMap[monthStr] || 1
  }

  // 解析農曆日（中文數字 → 數字）
  private parseLunarDay(dayStr: string): number {
    const dayMap: Record<string, number> = {
      初一: 1,
      初二: 2,
      初三: 3,
      初四: 4,
      初五: 5,
      初六: 6,
      初七: 7,
      初八: 8,
      初九: 9,
      初十: 10,
      十一: 11,
      十二: 12,
      十三: 13,
      十四: 14,
      十五: 15,
      十六: 16,
      十七: 17,
      十八: 18,
      十九: 19,
      二十: 20,
      廿一: 21,
      廿二: 22,
      廿三: 23,
      廿四: 24,
      廿五: 25,
      廿六: 26,
      廿七: 27,
      廿八: 28,
      廿九: 29,
      三十: 30,
    }
    return dayMap[dayStr] || 15
  }
}
