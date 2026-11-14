/**
 * 干支與五行的共用基礎（純函式）
 *
 * 天干、地支、五行的對應與生剋沖合都集中在這裡，其他模組一律由此取用。
 * 天干與五行在各自的環上等距排列，所以關係判斷都用索引運算完成，O(1) 且不需要逐對列表。
 */

// ── 天干、地支 ──

export const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const
export type Stem = (typeof HEAVENLY_STEMS)[number]

export const EARTHLY_BRANCHES = [
  '子',
  '丑',
  '寅',
  '卯',
  '辰',
  '巳',
  '午',
  '未',
  '申',
  '酉',
  '戌',
  '亥',
] as const
export type Branch = (typeof EARTHLY_BRANCHES)[number]

const STEM_INDEX: ReadonlyMap<string, number> = new Map(
  HEAVENLY_STEMS.map((stem, index) => [stem, index])
)
const BRANCH_INDEX: ReadonlyMap<string, number> = new Map(
  EARTHLY_BRANCHES.map((branch, index) => [branch, index])
)

export function isStem(value: string): value is Stem {
  return STEM_INDEX.has(value)
}

export function isBranch(value: string): value is Branch {
  return BRANCH_INDEX.has(value)
}

export function stemIndex(stem: Stem): number {
  return STEM_INDEX.get(stem)!
}

export function branchIndex(branch: Branch): number {
  return BRANCH_INDEX.get(branch)!
}

/** 取餘數並保證落在 0..size-1 */
export function wrap(value: number, size: number): number {
  return ((value % size) + size) % size
}

export function branchAt(index: number): Branch {
  return EARTHLY_BRANCHES[wrap(index, 12)]
}

export function stemAt(index: number): Stem {
  return HEAVENLY_STEMS[wrap(index, 10)]
}

export interface GanZhi {
  stem: Stem
  branch: Branch
}

/** 解析「甲子」這類干支字串；格式不對回傳 null */
export function parseGanZhi(text: string): GanZhi | null {
  const stem = text.charAt(0)
  const branch = text.charAt(1)
  return isStem(stem) && isBranch(branch) ? { stem, branch } : null
}

/** 六十甲子序（甲子為 0）。由 n ≡ 干 (mod 10)、n ≡ 支 (mod 12) 解出 */
export function sexagenaryIndex({ stem, branch }: GanZhi): number {
  return wrap(6 * stemIndex(stem) - 5 * branchIndex(branch), 60)
}

// ── 五行 ──

export type ElementKey = 'wood' | 'fire' | 'earth' | 'metal' | 'water'

/** 相生順序：木 → 火 → 土 → 金 → 水 → 木 */
export const ELEMENT_CYCLE: readonly ElementKey[] = ['wood', 'fire', 'earth', 'metal', 'water']

export const ELEMENT_LABEL: Readonly<Record<ElementKey, string>> = {
  wood: '木',
  fire: '火',
  earth: '土',
  metal: '金',
  water: '水',
}

const ELEMENT_INDEX: ReadonlyMap<ElementKey, number> = new Map(
  ELEMENT_CYCLE.map((key, index) => [key, index])
)
const ELEMENT_BY_LABEL: ReadonlyMap<string, ElementKey> = new Map(
  ELEMENT_CYCLE.map(key => [ELEMENT_LABEL[key], key])
)

export function elementFromLabel(label: string): ElementKey | null {
  return ELEMENT_BY_LABEL.get(label) ?? null
}

/** 甲乙木、丙丁火、戊己土、庚辛金、壬癸水：天干每兩位換一行，正好是相生順序 */
export function stemElement(stem: Stem): ElementKey {
  return ELEMENT_CYCLE[stemIndex(stem) >> 1]
}

/** 甲丙戊庚壬為陽，乙丁己辛癸為陰 */
export function isYangStem(stem: Stem): boolean {
  return stemIndex(stem) % 2 === 0
}

const BRANCH_ELEMENT: Readonly<Record<Branch, ElementKey>> = {
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

export function branchElement(branch: Branch): ElementKey {
  return BRANCH_ELEMENT[branch]
}

/** 以「我」為主體看另一個五行：同我、我生、我剋、剋我、生我 */
export type ElementRelation = 'same' | 'generates' | 'controls' | 'controlledBy' | 'generatedBy'

const RELATION_BY_OFFSET: readonly ElementRelation[] = [
  'same',
  'generates',
  'controls',
  'controlledBy',
  'generatedBy',
]

/** 相生環上的位移決定關係：差 1 為我生、差 2 為我剋、差 3 為剋我、差 4 為生我 */
export function elementRelation(self: ElementKey, other: ElementKey): ElementRelation {
  return RELATION_BY_OFFSET[wrap(ELEMENT_INDEX.get(other)! - ELEMENT_INDEX.get(self)!, 5)]
}

function elementAtOffset(element: ElementKey, offset: number): ElementKey {
  return ELEMENT_CYCLE[wrap(ELEMENT_INDEX.get(element)! + offset, 5)]
}

/** 我生者 */
export function childOf(element: ElementKey): ElementKey {
  return elementAtOffset(element, 1)
}

/** 我剋者 */
export function controls(element: ElementKey): ElementKey {
  return elementAtOffset(element, 2)
}

/** 剋我者 */
export function controllerOf(element: ElementKey): ElementKey {
  return elementAtOffset(element, 3)
}

/** 生我者 */
export function parentOf(element: ElementKey): ElementKey {
  return elementAtOffset(element, 4)
}

// ── 地支關係 ──

/** 六沖：地支環上相隔六位 */
export function clashOf(branch: Branch): Branch {
  return branchAt(branchIndex(branch) + 6)
}

export type BranchRelation = 'same' | 'clash' | 'sixHarmony' | 'threeHarmony' | 'harm' | 'none'

/**
 * 兩地支的關係。
 * 六沖差六位；六合（子丑、寅亥、卯戌、辰酉、巳申、午未）序數和 ≡ 1 (mod 12)；
 * 三合（申子辰、亥卯未、寅午戌、巳酉丑）差四位；六害（子未、丑午、寅巳、卯辰、申亥、酉戌）序數和 ≡ 7。
 * 這四種關係的條件互斥，不會同時成立。
 */
export function branchRelation(a: Branch, b: Branch): BranchRelation {
  const i = branchIndex(a)
  const j = branchIndex(b)
  if (i === j) return 'same'
  const gap = wrap(j - i, 12)
  if (gap === 6) return 'clash'
  if (gap % 4 === 0) return 'threeHarmony'
  const sum = (i + j) % 12
  if (sum === 1) return 'sixHarmony'
  if (sum === 7) return 'harm'
  return 'none'
}

export const BRANCH_RELATION_LABEL: Readonly<Record<BranchRelation, string>> = {
  same: '同支',
  clash: '相沖',
  sixHarmony: '六合',
  threeHarmony: '三合',
  harm: '相害',
  none: '',
}

// ── 天干關係 ──

export type StemRelation = 'same' | 'combine' | 'clash' | 'none'

/**
 * 天干五合（甲己、乙庚、丙辛、丁壬、戊癸）相隔五位；
 * 天干相沖（甲庚、乙辛、丙壬、丁癸）相隔六位，戊己居中不沖。
 */
export function stemRelation(a: Stem, b: Stem): StemRelation {
  const i = stemIndex(a)
  const j = stemIndex(b)
  if (i === j) return 'same'
  const gap = Math.abs(i - j)
  if (gap === 5) return 'combine'
  if (gap === 6) return 'clash'
  return 'none'
}

// ── 藏干 ──

const HIDDEN_STEMS: Readonly<Record<Branch, readonly Stem[]>> = {
  子: ['癸'],
  丑: ['己', '癸', '辛'],
  寅: ['甲', '丙', '戊'],
  卯: ['乙'],
  辰: ['戊', '乙', '癸'],
  巳: ['丙', '庚', '戊'],
  午: ['丁', '己'],
  未: ['己', '丁', '乙'],
  申: ['庚', '壬', '戊'],
  酉: ['辛'],
  戌: ['戊', '辛', '丁'],
  亥: ['壬', '甲'],
}

/** 本氣、中氣、餘氣的力量比例，依藏干個數而定 */
const HIDDEN_WEIGHTS: readonly (readonly number[])[] = [[], [1], [0.7, 0.3], [0.6, 0.3, 0.1]]

export interface WeightedStem {
  stem: Stem
  weight: number
}

const WEIGHTED_HIDDEN_STEMS = Object.fromEntries(
  EARTHLY_BRANCHES.map(branch => {
    const stems = HIDDEN_STEMS[branch]
    const weights = HIDDEN_WEIGHTS[stems.length]
    return [branch, stems.map((stem, index) => ({ stem, weight: weights[index] }))]
  })
) as unknown as Readonly<Record<Branch, readonly WeightedStem[]>>

/** 地支藏干，依本氣、中氣、餘氣排序並附力量比例（合計為 1） */
export function hiddenStems(branch: Branch): readonly WeightedStem[] {
  return WEIGHTED_HIDDEN_STEMS[branch]
}

/** 地支本氣 */
export function mainStem(branch: Branch): Stem {
  return HIDDEN_STEMS[branch][0]
}

// ── 納音 ──

/** 六十甲子每兩位共一個納音，依序為海中金、爐中火、大林木…… */
const NAYIN_ELEMENTS: readonly ElementKey[] = Array.from(
  '金火木土金火水土金木水土火木水金火木土金火水土金木水土火木水',
  label => ELEMENT_BY_LABEL.get(label)!
)

/** 干支的納音五行 */
export function nayinElement(ganZhi: GanZhi): ElementKey {
  return NAYIN_ELEMENTS[sexagenaryIndex(ganZhi) >> 1]
}

// ── 遁干與時辰 ──

/** 一天 24 小時對應的時支：23 點起為子時，每兩小時一支 */
export function hourBranch(hour: number): Branch {
  return branchAt(Math.floor((hour + 1) / 2))
}

/** 五鼠遁：甲己日起甲子時，乙庚日起丙子時……由日干推時干 */
export function hourStem(dayStem: Stem, branch: Branch): Stem {
  return stemAt(stemIndex(dayStem) * 2 + branchIndex(branch))
}

/** 五虎遁：甲己年起丙寅，乙庚年起戊寅……由年干推各宮（月）的天干 */
export function tigerStem(yearStem: Stem, branch: Branch): Stem {
  return stemAt(stemIndex(yearStem) * 2 + 2 + wrap(branchIndex(branch) - 2, 12))
}

// ── 生肖 ──

export const ZODIAC_ANIMALS = [
  '鼠',
  '牛',
  '虎',
  '兔',
  '龍',
  '蛇',
  '馬',
  '羊',
  '猴',
  '雞',
  '狗',
  '豬',
] as const
export type ZodiacAnimal = (typeof ZODIAC_ANIMALS)[number]

const ZODIAC_INDEX: ReadonlyMap<string, number> = new Map(
  ZODIAC_ANIMALS.map((animal, index) => [animal, index])
)

/** 生肖對應地支（繁體） */
export function zodiacBranch(zodiac: string): Branch | null {
  const index = ZODIAC_INDEX.get(zodiac)
  return index === undefined ? null : EARTHLY_BRANCHES[index]
}

export function zodiacOf(branch: Branch): ZodiacAnimal {
  return ZODIAC_ANIMALS[branchIndex(branch)]
}
