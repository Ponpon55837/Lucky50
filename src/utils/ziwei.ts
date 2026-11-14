/**
 * 紫微斗數安星（純函式）
 *
 * 依農曆生月、生日、生時與生年干排出十二宮、五行局、十四主星與四顆輔星，並提供四化查詢。
 * 各步驟都是地支環上的索引運算，整張命盤 O(1)。
 * 範圍：只安十四主星與左輔、右弼、文昌、文曲；不含亮度（廟旺利陷）與其餘雜曜。
 */
import {
  branchAt,
  branchIndex,
  nayinElement,
  tigerStem,
  wrap,
  type Branch,
  type ElementKey,
  type Stem,
} from './ganzhi'

export const MAIN_STARS = [
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
] as const
export type MainStar = (typeof MAIN_STARS)[number]

export type AssistStar = '左輔' | '右弼' | '文昌' | '文曲'
export type Star = MainStar | AssistStar

const MAIN_STAR_SET: ReadonlySet<string> = new Set(MAIN_STARS)

export function isMainStar(star: Star): star is MainStar {
  return MAIN_STAR_SET.has(star)
}

/** 十二宮，自命宮起逆布 */
export const PALACES = [
  '命宮',
  '兄弟宮',
  '夫妻宮',
  '子女宮',
  '財帛宮',
  '疾厄宮',
  '遷移宮',
  '交友宮',
  '官祿宮',
  '田宅宮',
  '福德宮',
  '父母宮',
] as const
export type PalaceName = (typeof PALACES)[number]

/** 寅宮的地支序；安命、安紫微都從寅起算 */
const YIN = 2

/** 納音五行對應的局數：水二、木三、金四、土五、火六 */
const BUREAU_NUMBER: Readonly<Record<ElementKey, number>> = {
  water: 2,
  wood: 3,
  metal: 4,
  earth: 5,
  fire: 6,
}

/** 紫微星系逆行、天府星系順行，數字為相對於領頭星的宮位差 */
const ZIWEI_GROUP: ReadonlyArray<readonly [MainStar, number]> = [
  ['紫微', 0],
  ['天機', -1],
  ['太陽', -3],
  ['武曲', -4],
  ['天同', -5],
  ['廉貞', -8],
]
const TIANFU_GROUP: ReadonlyArray<readonly [MainStar, number]> = [
  ['天府', 0],
  ['太陰', 1],
  ['貪狼', 2],
  ['巨門', 3],
  ['天相', 4],
  ['天梁', 5],
  ['七殺', 6],
  ['破軍', 10],
]

export interface ZiWeiInput {
  /** 農曆生年天干（以正月初一為界） */
  yearStem: Stem
  /** 農曆生月 1–12 */
  lunarMonth: number
  /** 農曆生日 1–30 */
  lunarDay: number
  hourBranch: Branch
}

export interface ZiWeiPalace {
  name: PalaceName
  stem: Stem
  branch: Branch
  stars: Star[]
}

export interface ZiWeiChart {
  /** 十二宮，索引與 PALACES 相同（0 為命宮） */
  palaces: ZiWeiPalace[]
  bodyBranch: Branch
  bureau: { element: ElementKey; number: number }
  /** 各星所在宮位在 palaces 中的索引 */
  starPalace: ReadonlyMap<Star, number>
}

/**
 * 紫微星所在地支序。
 * 生日補上最小的 x 使其可被局數整除，商為 q；自寅宮順數 q 位後，x 為偶數再順進 x 位，奇數則逆退 x 位。
 */
export function ziWeiPosition(bureauNumber: number, lunarDay: number): number {
  const borrowed = wrap(-lunarDay, bureauNumber)
  const quotient = (lunarDay + borrowed) / bureauNumber
  return wrap(YIN + quotient - 1 + (borrowed % 2 === 0 ? borrowed : -borrowed), 12)
}

export function buildZiWeiChart({
  yearStem,
  lunarMonth,
  lunarDay,
  hourBranch,
}: ZiWeiInput): ZiWeiChart {
  const monthOffset = lunarMonth - 1
  const hour = branchIndex(hourBranch)

  // 命宮：寅宮起正月，順數到生月，再逆數到生時；身宮則順數到生時
  const life = wrap(YIN + monthOffset - hour, 12)
  const lifeBranch = branchAt(life)
  const bodyBranch = branchAt(YIN + monthOffset + hour)

  // 五行局：命宮干支的納音
  const element = nayinElement({ stem: tigerStem(yearStem, lifeBranch), branch: lifeBranch })
  const bureau = { element, number: BUREAU_NUMBER[element] }

  const palaces: ZiWeiPalace[] = PALACES.map((name, index) => {
    const branch = branchAt(life - index)
    return { name, stem: tigerStem(yearStem, branch), branch, stars: [] }
  })
  const starPalace = new Map<Star, number>()
  const place = (star: Star, branchPosition: number) => {
    const index = wrap(life - branchPosition, 12)
    palaces[index].stars.push(star)
    starPalace.set(star, index)
  }

  const ziWei = ziWeiPosition(bureau.number, lunarDay)
  for (const [star, offset] of ZIWEI_GROUP) place(star, ziWei + offset)
  // 天府與紫微以寅申為軸對稱
  const tianFu = YIN * 2 - ziWei
  for (const [star, offset] of TIANFU_GROUP) place(star, tianFu + offset)

  // 左輔辰起正月順行、右弼戌起正月逆行；文曲辰起子時順行、文昌戌起子時逆行
  place('左輔', 4 + monthOffset)
  place('右弼', 10 - monthOffset)
  place('文曲', 4 + hour)
  place('文昌', 10 - hour)

  return { palaces, bodyBranch, bureau, starPalace }
}

/** 某宮的主星；空宮借對宮主星 */
export function mainStarsOf(
  chart: ZiWeiChart,
  palaceIndex: number
): { stars: MainStar[]; borrowed: boolean } {
  const own = chart.palaces[palaceIndex].stars.filter(isMainStar)
  if (own.length > 0) return { stars: own, borrowed: false }
  return {
    stars: chart.palaces[wrap(palaceIndex + 6, 12)].stars.filter(isMainStar),
    borrowed: true,
  }
}

// ── 四化 ──

export const TRANSFORMATIONS = ['化祿', '化權', '化科', '化忌'] as const
export type Transformation = (typeof TRANSFORMATIONS)[number]

/** 十干四化，依序為祿、權、科、忌 */
const TRANSFORMATION_STARS: Readonly<Record<Stem, readonly [Star, Star, Star, Star]>> = {
  甲: ['廉貞', '破軍', '武曲', '太陽'],
  乙: ['天機', '天梁', '紫微', '太陰'],
  丙: ['天同', '天機', '文昌', '廉貞'],
  丁: ['太陰', '天同', '天機', '巨門'],
  戊: ['貪狼', '太陰', '右弼', '天機'],
  己: ['武曲', '貪狼', '天梁', '文曲'],
  庚: ['太陽', '武曲', '太陰', '天同'],
  辛: ['巨門', '太陽', '文曲', '文昌'],
  壬: ['天梁', '紫微', '左輔', '武曲'],
  癸: ['破軍', '巨門', '太陰', '貪狼'],
}

export interface StarTransformation {
  type: Transformation
  star: Star
  /** 該星所在宮位在 palaces 中的索引 */
  palaceIndex: number
}

/** 某天干引動的四化及其落宮（生年干為本命四化，流日干為流日四化） */
export function transformationsOf(chart: ZiWeiChart, stem: Stem): StarTransformation[] {
  return TRANSFORMATION_STARS[stem].map((star, index) => ({
    type: TRANSFORMATIONS[index],
    star,
    palaceIndex: chart.starPalace.get(star)!,
  }))
}
