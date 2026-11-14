import {
  ELEMENT_LABEL,
  branchIndex,
  controllerOf,
  elementRelation,
  nayinElement,
  parentOf,
  parseGanZhi,
  zodiacBranch,
  type ElementKey,
  type ElementRelation,
} from '@/utils/ganzhi'
import type { ScoreFactor } from '@/utils/almanac'
import { BaseEngine, describeFactor } from './base'
import { ENGINE_CATALOG } from './settings'
import type { EngineInput, MetaphysicsResult } from './types'

/** 八卦方位的五行：震巽木、離火、坤艮土、兌乾金、坎水 */
const DIRECTION_ELEMENT: ReadonlyArray<readonly [string, ElementKey]> = [
  ['東北', 'earth'],
  ['西南', 'earth'],
  ['東南', 'wood'],
  ['西北', 'metal'],
  ['東', 'wood'],
  ['南', 'fire'],
  ['西', 'metal'],
  ['北', 'water'],
]

/** 五行的正位；土居中央，不列方位 */
const ELEMENT_DIRECTION: Readonly<Partial<Record<ElementKey, string>>> = {
  wood: '正東',
  fire: '正南',
  metal: '正西',
  water: '正北',
}

/** 地支三會方：亥子丑北、寅卯辰東、巳午未南、申酉戌西 */
const CARDINALS = ['北', '東', '南', '西'] as const

function directionElement(direction: string): ElementKey | null {
  // 斜向在前，先比對到「東北」就不會被「東」搶走
  return DIRECTION_ELEMENT.find(([name]) => direction.includes(name))?.[1] ?? null
}

/** 日納音對本命納音：生我、同我為助，我剋為財，我生為洩，剋我為凶 */
const NAYIN_DELTA: Readonly<Record<ElementRelation, number>> = {
  generatedBy: 15,
  controls: 10,
  same: 8,
  generates: -6,
  controlledBy: -15,
}
const NAYIN_TEXT: Readonly<Record<ElementRelation, string>> = {
  generatedBy: '生本命',
  controls: '為本命所剋，我剋為財',
  same: '與本命比和',
  generates: '洩本命之氣',
  controlledBy: '剋本命',
}
const NAYIN_ADVICE: Readonly<Record<ElementRelation, string>> = {
  generatedBy: '今日氣場相生，適合積極行動',
  controls: '今日我剋為財，可把握機會',
  same: '今日氣場平和，適合穩健操作',
  generates: '今日氣場外洩，宜量力而為',
  controlledBy: '今日氣場受剋，建議保守觀望',
}

/** 財神方位五行對本命的生剋 */
const WEALTH_DIRECTION_DELTA: Readonly<Partial<Record<ElementRelation, number>>> = {
  generatedBy: 8,
  same: 5,
  controlledBy: -8,
}
const SHA_DELTA = -8

interface DirectionNote {
  direction: string
  reason: string
}

/** 同一方位只列一次，由來合併 */
function mergeDirections(entries: ReadonlyArray<readonly [string, string]>): DirectionNote[] {
  const reasons = new Map<string, string[]>()
  for (const [direction, reason] of entries) {
    if (!direction) continue
    const list = reasons.get(direction)
    if (list) list.push(reason)
    else reasons.set(direction, [reason])
  }
  return [...reasons].map(([direction, list]) => ({ direction, reason: list.join('、') }))
}

/** 風水方位：當日神位與三煞方，加上日納音對本命納音的生剋 */
export class FengShuiEngine extends BaseEngine {
  constructor() {
    super(ENGINE_CATALOG.fengShui)
  }

  calculate({ today, chart }: EngineInput): MetaphysicsResult {
    const own = chart.element
    const ownLabel = ELEMENT_LABEL[own]
    const factors: ScoreFactor[] = []

    const day = parseGanZhi(today.dayGanZhi)
    const dayElement = day ? nayinElement(day) : null
    const dayRelation = dayElement ? elementRelation(own, dayElement) : null
    if (dayElement && dayRelation) {
      factors.push({
        label: `日納音${ELEMENT_LABEL[dayElement]}${NAYIN_TEXT[dayRelation]}${ownLabel}`,
        delta: NAYIN_DELTA[dayRelation],
      })
    }

    const wealthElement = directionElement(today.caiShen)
    if (wealthElement) {
      const relation = elementRelation(own, wealthElement)
      const delta = WEALTH_DIRECTION_DELTA[relation]
      if (delta) {
        factors.push({
          label: `財神在${today.caiShen}屬${ELEMENT_LABEL[wealthElement]}，${NAYIN_TEXT[relation]}`,
          delta,
        })
      }
    }

    const ownBranch = zodiacBranch(chart.zodiac)!
    const ownCardinal = CARDINALS[Math.floor(((branchIndex(ownBranch) + 1) % 12) / 3)]
    if (today.sha === ownCardinal) {
      factors.push({
        label: `本命生肖${chart.zodiac}居${ownCardinal}，正逢三煞方`,
        delta: SHA_DELTA,
      })
    }

    const controller = controllerOf(own)
    const avoidDirections = mergeDirections([
      [today.sha ? `正${today.sha}` : '', '三煞方'],
      [ELEMENT_DIRECTION[controller] ?? '', `屬${ELEMENT_LABEL[controller]}，剋本命${ownLabel}`],
    ])
    // 神位落在凶方時以凶方為準，不再列為吉方
    const avoided = new Set(avoidDirections.map(note => note.direction))
    const luckyDirections = mergeDirections([
      [today.caiShen, '財神'],
      [today.xiShen, '喜神'],
      [today.fuShen, '福神'],
    ]).filter(note => !avoided.has(note.direction))

    return this.result(factors, {
      summary: `本命納音屬${ownLabel}，財神在${today.caiShen}，煞${today.sha}`,
      advice: factors.map(describeFactor),
      luckyDirection: luckyDirections[0]?.direction,
      avoidDirection: avoidDirections[0]?.direction,
      luckyElements: [parentOf(own), own],
      avoidElements: [controller],
      details: {
        luckyDirections,
        avoidDirections,
        dailyFortune: {
          ganZhi: today.dayGanZhi,
          element: dayElement,
          advice: dayRelation ? NAYIN_ADVICE[dayRelation] : '',
        },
      },
    })
  }
}
