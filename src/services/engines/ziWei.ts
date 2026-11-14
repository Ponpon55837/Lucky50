import { ELEMENT_LABEL, parseGanZhi, type Stem } from '@/utils/ganzhi'
import {
  MALEFIC_STARS,
  PALACES,
  brightnessOf,
  buildZiWeiChart,
  isBright,
  isDim,
  isMainStar,
  mainStarsOf,
  starBrightness,
  transformationsOf,
  type Brightness,
  type MainStar,
  type Star,
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

/**
 * 亮度對四化的影響：星曜廟旺時吉化更有力、化忌較輕；失陷時吉化打折、化忌更重。
 */
const BRIGHT_SCALE = 1.25
const DIM_SCALE = 0.75

function brightnessScale(type: Transformation, brightness: Brightness | null): number {
  const harmful = type === '化忌'
  if (isBright(brightness)) return harmful ? DIM_SCALE : BRIGHT_SCALE
  if (isDim(brightness)) return harmful ? BRIGHT_SCALE : DIM_SCALE
  return 1
}

/** 財星坐財帛宮：廟旺全額、平常減半，失陷不計 */
const WEALTH_STARS: ReadonlySet<MainStar> = new Set(['武曲', '太陰', '天府'])
const WEALTH_STAR_DELTA = 6
/** 祿存主財，坐財帛宮最直接，坐命宮次之 */
const LU_CUN_DELTA: ReadonlyMap<number, number> = new Map([
  [WEALTH, 6],
  [LIFE, 4],
])
/** 煞星坐財帛宮：廟旺時為我所用，影響輕；失陷或無亮度可言（地空、地劫）時最重 */
const MALEFIC_DELTA = -3
const MALEFIC_BRIGHT_DELTA = -1
const MALEFIC_DIM_DELTA = -4

/** 星名後面附上亮度，例如「太陰（旺）」；不論亮度的星只有星名 */
function withBrightness(star: Star, brightness: Brightness | null): string {
  return brightness ? `${star}（${brightness}）` : star
}

/** 本命盤上與四化無關的加減項：財星、祿存與煞星坐守 */
function seatedFactors(chart: ZiWeiChart): ScoreFactor[] {
  const factors: ScoreFactor[] = []
  const wealth = chart.palaces[WEALTH]

  for (const star of wealth.stars) {
    const brightness = brightnessOf(star, wealth.branch)
    const label = `${withBrightness(star, brightness)}坐財帛宮`
    if (isMainStar(star)) {
      if (WEALTH_STARS.has(star) && !isDim(brightness)) {
        factors.push({
          label: `財星${label}`,
          delta: isBright(brightness) ? WEALTH_STAR_DELTA : WEALTH_STAR_DELTA / 2,
        })
      }
    } else if (MALEFIC_STARS.has(star)) {
      let delta = MALEFIC_DELTA
      if (isBright(brightness)) delta = MALEFIC_BRIGHT_DELTA
      else if (brightness === null || isDim(brightness)) delta = MALEFIC_DIM_DELTA
      factors.push({ label: `煞星${label}`, delta })
    }
  }

  const luCunPalace = chart.starPalace.get('祿存')!
  const luCunDelta = LU_CUN_DELTA.get(luCunPalace)
  if (luCunDelta !== undefined) {
    factors.push({ label: `祿存坐${PALACES[luCunPalace]}`, delta: luCunDelta })
  }
  return factors
}

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
    const brightness = starBrightness(chart, star)
    factors.push({
      label: `${source}${withBrightness(star, brightness)}${type}入${PALACES[palaceIndex]}`,
      delta: Math.round(deltas[type] * weight * brightnessScale(type, brightness)),
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
    yearBranch: birth.lunarYear.branch,
    lunarMonth: birth.lunarMonth,
    lunarDay: birth.lunarDay,
    hourBranch: birth.hourBranch,
  })

  const natal = transformationsOf(chart, yearStem)
  // 坐守只看宮內實際有的星；空宮借來的對宮主星不算
  const factors = [
    ...transformationFactors(chart, yearStem, '生年', NATAL_DELTA),
    ...seatedFactors(chart),
  ]

  const palaces = KEY_PALACES.map(index => {
    const palace = chart.palaces[index]
    const { stars, borrowed } = mainStarsOf(chart, index)
    return {
      name: palace.name,
      ganZhi: `${palace.stem}${palace.branch}`,
      stars,
      /** 主星附亮度，例如「太陰（旺）」 */
      starLabels: stars.map(star => withBrightness(star, starBrightness(chart, star))),
      borrowed,
      assistStars: palace.stars
        .filter(star => !isMainStar(star))
        .map(star => withBrightness(star, brightnessOf(star, palace.branch))),
      minorStars: palace.minorStars,
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
