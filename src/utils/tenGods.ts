/**
 * 八字十神（純函式）
 *
 * 十神是日主（日干）與其他干支的五行生剋加上陰陽異同：
 * 同我為比劫、我生為食傷、我剋為財、剋我為官殺、生我為印；同性為偏、異性為正。
 */
import {
  elementRelation,
  hiddenStems,
  isStem,
  isYangStem,
  mainStem,
  stemElement,
  type ElementRelation,
  type GanZhi,
  type Stem,
} from './ganzhi'

export type TenGodName =
  '比肩' | '劫財' | '食神' | '傷官' | '偏財' | '正財' | '七殺' | '正官' | '偏印' | '正印'

/** 十神五類：比劫、食傷、財、官殺、印 */
export type TenGodGroup = 'peer' | 'output' | 'wealth' | 'officer' | 'resource'

export const TEN_GOD_GROUP_LABEL: Readonly<Record<TenGodGroup, string>> = {
  peer: '比劫',
  output: '食傷',
  wealth: '財星',
  officer: '官殺',
  resource: '印星',
}

/** 各五行關係對應的十神：[陰陽相同, 陰陽相異] */
const GODS_BY_RELATION: Readonly<
  Record<ElementRelation, { group: TenGodGroup; gods: readonly [TenGodName, TenGodName] }>
> = {
  same: { group: 'peer', gods: ['比肩', '劫財'] },
  generates: { group: 'output', gods: ['食神', '傷官'] },
  controls: { group: 'wealth', gods: ['偏財', '正財'] },
  controlledBy: { group: 'officer', gods: ['七殺', '正官'] },
  generatedBy: { group: 'resource', gods: ['偏印', '正印'] },
}

const GROUP_BY_GOD = new Map<TenGodName, TenGodGroup>(
  Object.values(GODS_BY_RELATION).flatMap(({ group, gods }) => gods.map(god => [god, group]))
)

export function tenGodGroup(god: TenGodName): TenGodGroup {
  return GROUP_BY_GOD.get(god)!
}

/** 以日主看另一個天干的十神 */
export function tenGodOf(dayMaster: Stem, other: Stem): TenGodName {
  const { gods } = GODS_BY_RELATION[elementRelation(stemElement(dayMaster), stemElement(other))]
  return gods[isYangStem(dayMaster) === isYangStem(other) ? 0 : 1]
}

/** 字串版本：任一方不是天干時回傳 null */
export function getTenGodRelation(dayMaster: string, otherStem: string): TenGodName | null {
  return isStem(dayMaster) && isStem(otherStem) ? tenGodOf(dayMaster, otherStem) : null
}

// ── 四柱十神 ──

export const PILLAR_KEYS = ['year', 'month', 'day', 'hour'] as const
export type PillarKey = (typeof PILLAR_KEYS)[number]
export type FourPillars = Readonly<Record<PillarKey, GanZhi>>

export interface PillarGods {
  /** 天干十神；日柱天干即日主，為 null */
  stem: TenGodName | null
  /** 地支本氣的十神 */
  branch: TenGodName
}

export type FourPillarsGods = Readonly<Record<PillarKey, PillarGods>>

export function calculateFourPillarsTenGods(pillars: FourPillars): FourPillarsGods {
  const dayMaster = pillars.day.stem
  const gods = {} as Record<PillarKey, PillarGods>
  for (const key of PILLAR_KEYS) {
    const { stem, branch } = pillars[key]
    gods[key] = {
      stem: key === 'day' ? null : tenGodOf(dayMaster, stem),
      branch: tenGodOf(dayMaster, mainStem(branch)),
    }
  }
  return gods
}

/** 統計命盤七個位置（三個天干加四個地支本氣）的十神次數 */
export function countTenGods(gods: FourPillarsGods): Map<TenGodName, number> {
  const counts = new Map<TenGodName, number>()
  const add = (god: TenGodName | null) => {
    if (god) counts.set(god, (counts.get(god) ?? 0) + 1)
  }
  for (const key of PILLAR_KEYS) {
    add(gods[key].stem)
    add(gods[key].branch)
  }
  return counts
}

/** 出現最多次的十神（可能並列） */
export function findDominantTenGods(counts: ReadonlyMap<TenGodName, number>): TenGodName[] {
  let max = 0
  for (const count of counts.values()) max = Math.max(max, count)
  return [...counts].filter(([, count]) => count === max).map(([god]) => god)
}

// ── 日主旺衰與喜忌 ──

/** 月令佔三份，其餘三支與三干各一份 */
const MONTH_BRANCH_WEIGHT = 3
const STRENGTH_TOTAL = MONTH_BRANCH_WEIGHT + 3 + 3

export interface DayMasterStrength {
  /** 生扶日主的力量（印與比劫） */
  support: number
  total: number
  /** 月令本氣是否生扶日主 */
  inSeason: boolean
  strong: boolean
}

/**
 * 以得令、得地、得勢衡量日主強弱：
 * 生扶（同我、生我）的力量過半為身強，否則為身弱。地支依藏干比例計入。
 */
export function dayMasterStrength(pillars: FourPillars): DayMasterStrength {
  const dayMaster = stemElement(pillars.day.stem)
  const supports = (stem: Stem) => {
    const relation = elementRelation(dayMaster, stemElement(stem))
    return relation === 'same' || relation === 'generatedBy'
  }

  let support = 0
  for (const key of PILLAR_KEYS) {
    const { stem, branch } = pillars[key]
    if (key !== 'day' && supports(stem)) support += 1
    const branchWeight = key === 'month' ? MONTH_BRANCH_WEIGHT : 1
    for (const hidden of hiddenStems(branch)) {
      if (supports(hidden.stem)) support += branchWeight * hidden.weight
    }
  }

  return {
    support,
    total: STRENGTH_TOTAL,
    inSeason: supports(mainStem(pillars.month.branch)),
    strong: support * 2 > STRENGTH_TOTAL,
  }
}

const STRONG_FAVORS: ReadonlySet<TenGodGroup> = new Set(['output', 'wealth', 'officer'])
const WEAK_FAVORS: ReadonlySet<TenGodGroup> = new Set(['resource', 'peer'])

/** 身強喜洩耗剋（食傷、財、官殺），身弱喜生扶（印、比劫） */
export function favorableGroups(strong: boolean): ReadonlySet<TenGodGroup> {
  return strong ? STRONG_FAVORS : WEAK_FAVORS
}

// ── 投資性格 ──

export const TEN_GODS_INVESTMENT_STYLE: Readonly<Record<TenGodName, string>> = {
  比肩: '獨立自主型，偏好自主決策',
  劫財: '競爭積極型，善於把握機會',
  食神: '穩健規劃型，注重長期佈局',
  傷官: '創意突破型，善於逆向思考',
  偏財: '積極交易型，偏好短線操作',
  正財: '穩健持有型，注重價值投資',
  七殺: '風險偏好型，敢於大膽佈局',
  正官: '紀律守規型，遵循投資紀律',
  偏印: '研究分析型，重視數據決策',
  正印: '學習成長型，持續精進投資',
}

export type InvestmentStyle = 'active' | 'conservative' | 'analytical' | 'creative'

export const INVESTMENT_STYLE_LABEL: Readonly<Record<InvestmentStyle, string>> = {
  active: '積極交易',
  conservative: '穩健持有',
  analytical: '研究分析',
  creative: '創意突破',
}

export const TEN_GODS_STYLE_MAP: Readonly<Record<TenGodName, InvestmentStyle>> = {
  比肩: 'conservative',
  劫財: 'active',
  食神: 'conservative',
  傷官: 'creative',
  偏財: 'active',
  正財: 'conservative',
  七殺: 'active',
  正官: 'conservative',
  偏印: 'analytical',
  正印: 'analytical',
}

export interface InvestmentPersonality {
  dominantGods: TenGodName[]
  style: InvestmentStyle
  description: string
}

/** 由十神分佈推斷投資性格：各十神的次數累加到所屬風格，取最高者 */
export function inferInvestmentPersonality(gods: FourPillarsGods): InvestmentPersonality {
  const counts = countTenGods(gods)
  const dominantGods = findDominantTenGods(counts)

  const weights = new Map<InvestmentStyle, number>()
  let style: InvestmentStyle = 'conservative'
  let best = 0
  for (const [god, count] of counts) {
    const key = TEN_GODS_STYLE_MAP[god]
    const weight = (weights.get(key) ?? 0) + count
    weights.set(key, weight)
    if (weight > best) {
      best = weight
      style = key
    }
  }

  return {
    dominantGods,
    style,
    description: `您的投資性格偏向「${INVESTMENT_STYLE_LABEL[style]}型」。${TEN_GODS_INVESTMENT_STYLE[dominantGods[0]]}。`,
  }
}
