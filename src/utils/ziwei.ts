/**
 * 紫微斗數安星（純函式）
 *
 * 依農曆生月、生日、生時與生年干排出十二宮、五行局、十四主星與四顆輔星，並提供四化查詢。
 * 各步驟都是地支環上的索引運算，整張命盤 O(1)。
 * 範圍：十四主星、十四顆輔星與煞星、三十二顆雜曜，以及主星與昌曲火鈴羊陀的亮度（廟旺得利平不陷）。
 * 不含需要性別的星（天傷、天使、博士十二神）與流年諸星。
 * 亮度各派略有出入，這裡採用與開源排盤庫 iztro 相同的一套，並在測試中逐盤比對。
 */
import {
  branchAt,
  branchIndex,
  nayinElement,
  stemIndex,
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

/** 六吉星、祿存天馬與六煞星 */
export const ASSIST_STARS = [
  '左輔',
  '右弼',
  '文昌',
  '文曲',
  '天魁',
  '天鉞',
  '祿存',
  '天馬',
  '擎羊',
  '陀羅',
  '火星',
  '鈴星',
  '地空',
  '地劫',
] as const
export type AssistStar = (typeof ASSIST_STARS)[number]

/** 雜曜：只作參考，不參與四化 */
export const MINOR_STARS = [
  '紅鸞',
  '天喜',
  '華蓋',
  '咸池',
  '孤辰',
  '寡宿',
  '龍池',
  '鳳閣',
  '天哭',
  '天虛',
  '天德',
  '月德',
  '天空',
  '破碎',
  '蜚廉',
  '天官',
  '天福',
  '天廚',
  '天才',
  '天壽',
  '解神',
  '天姚',
  '天刑',
  '陰煞',
  '天月',
  '天巫',
  '三台',
  '八座',
  '恩光',
  '天貴',
  '台輔',
  '封誥',
] as const
export type MinorStar = (typeof MINOR_STARS)[number]

/** 主星與輔星；宮位的 stars 只放這兩類 */
export type Star = MainStar | AssistStar

/** 六煞星 */
export const MALEFIC_STARS: ReadonlySet<Star> = new Set([
  '擎羊',
  '陀羅',
  '火星',
  '鈴星',
  '地空',
  '地劫',
])

// ── 亮度 ──

export const BRIGHTNESS_LEVELS = ['廟', '旺', '得', '利', '平', '不', '陷'] as const
export type Brightness = (typeof BRIGHTNESS_LEVELS)[number]

/** 各星在十二地支（子起）的亮度；全形空白表示該星不會落在那一支 */
const BRIGHTNESS_TABLE: Readonly<Partial<Record<Star, string>>> = {
  紫微: '平廟旺旺得旺廟廟旺旺得旺',
  天機: '廟陷得旺利平廟陷得旺利平',
  太陽: '陷不旺廟旺旺旺得得平不陷',
  武曲: '旺廟得利廟平旺廟得利廟平',
  天同: '旺不利平平廟陷不旺平平廟',
  廉貞: '平利廟平利陷平利廟平利陷',
  天府: '廟廟廟得廟得旺廟得旺廟得',
  太陰: '廟廟旺陷陷陷不不利旺旺廟',
  貪狼: '旺廟平利廟陷旺廟平利廟陷',
  巨門: '旺不廟廟陷旺旺不廟廟陷旺',
  天相: '廟廟廟陷得得廟得廟陷得得',
  天梁: '廟旺廟廟廟陷廟旺陷得廟陷',
  七殺: '旺廟廟旺廟平旺廟廟旺廟平',
  破軍: '廟旺得陷旺平廟旺得陷旺平',
  文昌: '得廟陷利得廟陷利得廟陷利',
  文曲: '得廟平旺得廟陷旺得廟陷旺',
  火星: '陷得廟利陷得廟利陷得廟利',
  鈴星: '陷得廟利陷得廟利陷得廟利',
  擎羊: '陷廟　陷廟　陷廟　陷廟　',
  陀羅: '　廟陷　廟陷　廟陷　廟陷',
}

const BRIGHTNESS_SET: ReadonlySet<string> = new Set(BRIGHTNESS_LEVELS)

/** 某星落在某地支的亮度；該星不論亮度時為 null */
export function brightnessOf(star: Star, branch: Branch): Brightness | null {
  const level = BRIGHTNESS_TABLE[star]?.charAt(branchIndex(branch))
  return level !== undefined && BRIGHTNESS_SET.has(level) ? (level as Brightness) : null
}

/** 廟、旺為入廟得地；不、陷為失地落陷 */
export function isBright(brightness: Brightness | null): boolean {
  return brightness === '廟' || brightness === '旺'
}

export function isDim(brightness: Brightness | null): boolean {
  return brightness === '不' || brightness === '陷'
}

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

// ── 年干、年支系諸星的落宮（數字為地支序，子為 0） ──

/** 祿存隨年干：甲寅、乙卯、丙戊巳、丁己午、庚申、辛酉、壬亥、癸子；擎羊在其前一位、陀羅在後一位 */
const LU_CUN = [2, 3, 5, 6, 5, 6, 8, 9, 11, 0] as const
/** 天魁、天鉞隨年干：甲戊庚牛羊、乙己鼠猴鄉、丙丁豬雞位、壬癸兔蛇藏、六辛逢馬虎 */
const TIAN_KUI = [1, 0, 11, 11, 1, 0, 1, 6, 3, 3] as const
const TIAN_YUE = [7, 8, 9, 9, 7, 8, 7, 2, 5, 5] as const
const TIAN_GUAN = [7, 4, 5, 2, 3, 9, 11, 9, 10, 6] as const
const TIAN_FU = [9, 8, 0, 11, 3, 2, 6, 5, 6, 5] as const
const TIAN_CHU = [5, 6, 0, 5, 6, 8, 2, 6, 9, 11] as const

/**
 * 以下四組隨年支的三合局（申子辰、巳酉丑、寅午戌、亥卯未）而定，以「年支序 mod 4」取值。
 * 天馬在三合局首字的對沖；火星、鈴星是起子時的宮位；華蓋為墓庫、咸池為沐浴。
 */
const TIAN_MA = [2, 11, 8, 5] as const
const HUO_XING_START = [2, 3, 1, 9] as const
const LING_XING_START = [10, 10, 3, 10] as const
const HUA_GAI = [4, 1, 10, 7] as const
const XIAN_CHI = [9, 6, 3, 0] as const

/** 孤辰、寡宿隨年支的三會方（亥子丑、寅卯辰、巳午未、申酉戌） */
const GU_CHEN = [2, 5, 8, 11] as const
const GUA_SU = [10, 1, 4, 7] as const

const PO_SUI = [5, 1, 9] as const
const FEI_LIAN = [8, 9, 10, 5, 6, 7, 2, 3, 4, 11, 0, 1] as const

// ── 月系雜曜 ──

const JIE_SHEN = [8, 10, 0, 2, 4, 6] as const
const YIN_SHA = [2, 0, 10, 8, 6, 4] as const
const TIAN_YUE_ILLNESS = [10, 5, 4, 2, 7, 3, 11, 7, 2, 6, 10, 2] as const
const TIAN_WU = [5, 8, 2, 11] as const

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
  /** 農曆生年地支 */
  yearBranch: Branch
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
  /** 主星與輔星 */
  stars: Star[]
  /** 雜曜 */
  minorStars: MinorStar[]
}

export interface ZiWeiChart {
  /** 十二宮，索引與 PALACES 相同（0 為命宮） */
  palaces: ZiWeiPalace[]
  bodyBranch: Branch
  bureau: { element: ElementKey; number: number }
  /** 各星（含雜曜）所在宮位在 palaces 中的索引 */
  starPalace: ReadonlyMap<Star | MinorStar, number>
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
  yearBranch,
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
    return { name, stem: tigerStem(yearStem, branch), branch, stars: [], minorStars: [] }
  })
  const starPalace = new Map<Star | MinorStar, number>()
  const palaceAt = (branchPosition: number) => wrap(life - branchPosition, 12)
  const place = (star: Star, branchPosition: number) => {
    const index = palaceAt(branchPosition)
    palaces[index].stars.push(star)
    starPalace.set(star, index)
  }
  const placeMinor = (star: MinorStar, branchPosition: number) => {
    const index = palaceAt(branchPosition)
    palaces[index].minorStars.push(star)
    starPalace.set(star, index)
  }

  const ziWei = ziWeiPosition(bureau.number, lunarDay)
  for (const [star, offset] of ZIWEI_GROUP) place(star, ziWei + offset)
  // 天府與紫微以寅申為軸對稱
  const tianFu = YIN * 2 - ziWei
  for (const [star, offset] of TIANFU_GROUP) place(star, tianFu + offset)

  // 左輔辰起正月順行、右弼戌起正月逆行；文曲辰起子時順行、文昌戌起子時逆行
  const zuoFu = 4 + monthOffset
  const youBi = 10 - monthOffset
  const wenQu = 4 + hour
  const wenChang = 10 - hour
  place('左輔', zuoFu)
  place('右弼', youBi)
  place('文昌', wenChang)
  place('文曲', wenQu)

  // 年干系：天魁天鉞、祿存與夾祿的羊陀
  const stem = stemIndex(yearStem)
  place('天魁', TIAN_KUI[stem])
  place('天鉞', TIAN_YUE[stem])
  place('祿存', LU_CUN[stem])
  place('擎羊', LU_CUN[stem] + 1)
  place('陀羅', LU_CUN[stem] - 1)

  // 年支系：天馬；火星、鈴星自起點順數到生時
  const year = branchIndex(yearBranch)
  const trine = year % 4
  place('天馬', TIAN_MA[trine])
  place('火星', HUO_XING_START[trine] + hour)
  place('鈴星', LING_XING_START[trine] + hour)

  // 時系：地空自亥逆數到生時、地劫順數
  place('地空', 11 - hour)
  place('地劫', 11 + hour)

  // ── 雜曜 ──
  // 年支系
  placeMinor('紅鸞', 3 - year)
  placeMinor('天喜', 9 - year)
  placeMinor('華蓋', HUA_GAI[trine])
  placeMinor('咸池', XIAN_CHI[trine])
  const season = Math.floor(((year + 1) % 12) / 3)
  placeMinor('孤辰', GU_CHEN[season])
  placeMinor('寡宿', GUA_SU[season])
  placeMinor('龍池', 4 + year)
  placeMinor('鳳閣', 10 - year)
  placeMinor('天哭', 6 - year)
  placeMinor('天虛', 6 + year)
  placeMinor('天德', 9 + year)
  placeMinor('月德', 5 + year)
  placeMinor('天空', year + 1)
  placeMinor('破碎', PO_SUI[year % 3])
  placeMinor('蜚廉', FEI_LIAN[year])
  // 年干系
  placeMinor('天官', TIAN_GUAN[stem])
  placeMinor('天福', TIAN_FU[stem])
  placeMinor('天廚', TIAN_CHU[stem])
  // 天才自命宮、天壽自身宮起子，順數到生年支
  placeMinor('天才', life + year)
  placeMinor('天壽', YIN + monthOffset + hour + year)
  // 月系
  placeMinor('解神', JIE_SHEN[monthOffset >> 1])
  placeMinor('天姚', 1 + monthOffset)
  placeMinor('天刑', 9 + monthOffset)
  placeMinor('陰煞', YIN_SHA[monthOffset % 6])
  placeMinor('天月', TIAN_YUE_ILLNESS[monthOffset])
  placeMinor('天巫', TIAN_WU[monthOffset % 4])
  // 日系：三台、八座由左輔、右弼起初一；恩光、天貴由文昌、文曲起初一後退一位
  const dayOffset = lunarDay - 1
  placeMinor('三台', zuoFu + dayOffset)
  placeMinor('八座', youBi - dayOffset)
  placeMinor('恩光', wenChang + dayOffset - 1)
  placeMinor('天貴', wenQu + dayOffset - 1)
  // 時系
  placeMinor('台輔', 6 + hour)
  placeMinor('封誥', 2 + hour)

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

/** 某星在命盤中的亮度 */
export function starBrightness(chart: ZiWeiChart, star: Star): Brightness | null {
  const palaceIndex = chart.starPalace.get(star)
  return palaceIndex === undefined ? null : brightnessOf(star, chart.palaces[palaceIndex].branch)
}
