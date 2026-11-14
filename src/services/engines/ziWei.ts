import { ELEMENT_LABEL, parseGanZhi, type Stem } from '@/utils/ganzhi'
import {
  PALACES,
  buildZiWeiChart,
  mainStarsOf,
  transformationsOf,
  type MainStar,
  type Transformation,
  type ZiWeiChart,
} from '@/utils/ziwei'
import type { RiskLevel, ScoreFactor } from '@/utils/almanac'
import { BaseEngine, describeFactor } from './base'
import { ENGINE_CATALOG } from './settings'
import type { BirthChart } from './birthChart'
import type { EngineInput, MetaphysicsResult } from './types'

/** 十四主星的投資風格與風險傾向（星性的白話解讀，不參與計分） */
const STAR_STYLE: Readonly<Record<MainStar, { style: string; risk: RiskLevel }>> = {
  紫微: { style: '領導決策型', risk: 'medium' },
  天機: { style: '謀略規劃型', risk: 'low' },
  太陽: { style: '積極外向型', risk: 'high' },
  武曲: { style: '執行力強型', risk: 'medium' },
  天同: { style: '穩健保守型', risk: 'low' },
  廉貞: { style: '冒險突破型', risk: 'high' },
  天府: { style: '穩健守成型', risk: 'low' },
  太陰: { style: '細膩觀察型', risk: 'low' },
  貪狼: { style: '多變靈活型', risk: 'high' },
  巨門: { style: '分析批判型', risk: 'medium' },
  天相: { style: '協調平衡型', risk: 'low' },
  天梁: { style: '長線佈局型', risk: 'low' },
  七殺: { style: '果斷行動型', risk: 'high' },
  破軍: { style: '開創突破型', risk: 'high' },
}

const RISK_LABEL: Readonly<Record<RiskLevel, string>> = {
  low: '低風險',
  medium: '中風險',
  high: '高風險',
}

const LIFE = PALACES.indexOf('命宮')
const WEALTH = PALACES.indexOf('財帛宮')
const TRAVEL = PALACES.indexOf('遷移宮')
const CAREER = PALACES.indexOf('官祿宮')

/** 三方四正對投資的影響比重：財帛最重，命宮、官祿、遷移遞減 */
const PALACE_WEIGHT: ReadonlyMap<number, number> = new Map([
  [WEALTH, 1],
  [LIFE, 0.8],
  [CAREER, 0.6],
  [TRAVEL, 0.4],
])
const KEY_PALACES = [LIFE, WEALTH, CAREER, TRAVEL] as const

/** 四化的力量：本命四化是底色，流日四化是當天的引動 */
const NATAL_DELTA: Readonly<Record<Transformation, number>> = {
  化祿: 12,
  化權: 8,
  化科: 5,
  化忌: -12,
}
const DAILY_DELTA: Readonly<Record<Transformation, number>> = {
  化祿: 15,
  化權: 8,
  化科: 5,
  化忌: -15,
}

/** 財星坐財帛宮 */
const WEALTH_STARS: ReadonlySet<MainStar> = new Set(['武曲', '太陰', '天府'])
const WEALTH_STAR_DELTA = 6

function transformationFactors(
  chart: ZiWeiChart,
  stem: Stem,
  source: string,
  deltas: Readonly<Record<Transformation, number>>
): ScoreFactor[] {
  const factors: ScoreFactor[] = []
  for (const { type, star, palaceIndex } of transformationsOf(chart, stem)) {
    const weight = PALACE_WEIGHT.get(palaceIndex)
    if (weight === undefined) continue
    factors.push({
      label: `${source}${star}${type}入${PALACES[palaceIndex]}`,
      delta: Math.round(deltas[type] * weight),
    })
  }
  return factors
}

/** 本命盤與由它決定的加減項、宮位說明；與日期無關，同一張命盤只算一次 */
interface NatalReading {
  chart: ZiWeiChart
  factors: readonly ScoreFactor[]
  summary: string
  personality: string | undefined
  details: Record<string, unknown>
}

function readNatal(birth: BirthChart): NatalReading {
  const yearStem = birth.lunarYear.stem
  const chart = buildZiWeiChart({
    yearStem,
    lunarMonth: birth.lunarMonth,
    lunarDay: birth.lunarDay,
    hourBranch: birth.hourBranch,
  })

  const natal = transformationsOf(chart, yearStem)
  const factors = transformationFactors(chart, yearStem, '生年', NATAL_DELTA)
  // 空宮借來的對宮主星不算坐守，不加分
  const wealth = mainStarsOf(chart, WEALTH)
  if (!wealth.borrowed) {
    for (const star of wealth.stars) {
      if (WEALTH_STARS.has(star)) {
        factors.push({ label: `財星${star}坐財帛宮`, delta: WEALTH_STAR_DELTA })
      }
    }
  }

  const palaces = KEY_PALACES.map(index => {
    const palace = chart.palaces[index]
    const { stars, borrowed } = mainStarsOf(chart, index)
    return {
      name: palace.name,
      ganZhi: `${palace.stem}${palace.branch}`,
      stars,
      borrowed,
      transformations: natal.filter(t => t.palaceIndex === index).map(t => `${t.star}${t.type}`),
    }
  })

  const life = palaces[0]
  const style = life.stars[0] ? STAR_STYLE[life.stars[0]] : null
  const bureau = `${ELEMENT_LABEL[chart.bureau.element]}${'〇一二三四五六'[chart.bureau.number]}局`
  const lifeText = life.stars.length > 0 ? life.stars.join('、') : '無主星'

  return {
    chart,
    factors,
    summary: `${bureau}，命宮${life.ganZhi}，${life.borrowed ? '命無正曜，借對宮' : '主星'}${lifeText}`,
    personality: style?.style,
    details: {
      bureau,
      lifeStars: life.stars,
      lifeBorrowed: life.borrowed,
      investmentStyle: style?.style ?? '',
      riskProfile: style ? RISK_LABEL[style.risk] : '',
      palaces,
    },
  }
}

/** 紫微斗數：排出本命盤，以本命與流日四化落入命、財、官、遷的情形評分 */
export class ZiWeiEngine extends BaseEngine {
  constructor() {
    super(ENGINE_CATALOG.ziWei)
  }

  /** 命盤物件由 buildBirthChart 共用，以它為鍵；命盤被回收時這裡跟著釋放 */
  private natalCache = new WeakMap<BirthChart, NatalReading>()

  private natalOf(birth: BirthChart): NatalReading {
    let natal = this.natalCache.get(birth)
    if (!natal) {
      natal = readNatal(birth)
      this.natalCache.set(birth, natal)
    }
    return natal
  }

  calculate({ today, chart: birth }: EngineInput): MetaphysicsResult {
    const natal = this.natalOf(birth)
    const day = parseGanZhi(today.dayGanZhi)
    const factors = day
      ? [
          ...natal.factors,
          ...transformationFactors(natal.chart, day.stem, `流日${day.stem}干`, DAILY_DELTA),
        ]
      : [...natal.factors]

    return this.result(factors, {
      summary: natal.summary,
      personality: natal.personality,
      advice: factors.map(describeFactor),
      details: natal.details,
    })
  }
}
