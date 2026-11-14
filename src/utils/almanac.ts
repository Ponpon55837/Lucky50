/**
 * 農民曆推算工具（純函式）
 *
 * 時辰吉凶、五行旺衰、交易日吉凶與每日籤詩都在這裡計算，
 * 元件只負責呈現。所有查表皆為 O(1)，整體計算量與時辰數（12）或交易日數成線性。
 */

// ── 地支與時辰 ──

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

const BRANCH_INDEX: ReadonlyMap<string, number> = new Map(
  EARTHLY_BRANCHES.map((branch, index) => [branch, index])
)

export function isBranch(value: string): value is Branch {
  return BRANCH_INDEX.has(value)
}

/** 六沖：地支環上相隔六位者相沖 */
export function clashOf(branch: Branch): Branch {
  return EARTHLY_BRANCHES[(BRANCH_INDEX.get(branch)! + 6) % 12]
}

/** 子時跨日（23:00 起），其餘每個時辰往後推兩小時 */
export function hourRangeOf(branch: Branch): { start: number; end: number } {
  const index = BRANCH_INDEX.get(branch)!
  const start = (index * 2 + 23) % 24
  return { start, end: (start + 2) % 24 }
}

const pad = (hour: number) => `${String(hour).padStart(2, '0')}:00`

export function formatHourRange(branch: Branch): string {
  const { start, end } = hourRangeOf(branch)
  return `${pad(start)}–${pad(end)}`
}

// 台股一般交易時段 09:00–13:30（以分鐘表示）
export const MARKET_OPEN_MINUTES = 9 * 60
export const MARKET_CLOSE_MINUTES = 13 * 60 + 30

/** 時辰是否與台股交易時段重疊 */
export function overlapsMarket(branch: Branch): boolean {
  const { start } = hourRangeOf(branch)
  const startMinutes = start * 60
  const endMinutes = startMinutes + 120
  return startMinutes < MARKET_CLOSE_MINUTES && endMinutes > MARKET_OPEN_MINUTES
}

// ── 生肖 ──

/** 生肖對應地支（繁體；lunarService 已將生肖轉為繁體） */
const ZODIAC_BRANCH: Readonly<Record<string, Branch>> = {
  鼠: '子',
  牛: '丑',
  虎: '寅',
  兔: '卯',
  龍: '辰',
  蛇: '巳',
  馬: '午',
  羊: '未',
  猴: '申',
  雞: '酉',
  狗: '戌',
  豬: '亥',
}

export function zodiacBranch(zodiac: string): Branch | null {
  return ZODIAC_BRANCH[zodiac] ?? null
}

/** 生肖吉時（三合） */
export const ZODIAC_LUCKY_BRANCHES: Readonly<Record<string, readonly Branch[]>> = {
  鼠: ['子', '申', '辰'],
  牛: ['丑', '巳', '酉'],
  虎: ['寅', '午', '戌'],
  兔: ['卯', '亥', '未'],
  龍: ['辰', '子', '申'],
  蛇: ['巳', '酉', '丑'],
  馬: ['午', '寅', '戌'],
  羊: ['未', '卯', '亥'],
  猴: ['申', '子', '辰'],
  雞: ['酉', '巳', '丑'],
  狗: ['戌', '寅', '午'],
  豬: ['亥', '卯', '未'],
}

/** 生肖忌時（沖、害） */
export const ZODIAC_AVOID_BRANCHES: Readonly<Record<string, readonly Branch[]>> = {
  鼠: ['午', '未'],
  牛: ['未', '午'],
  虎: ['申', '巳'],
  兔: ['酉', '辰'],
  龍: ['戌', '卯'],
  蛇: ['亥', '寅'],
  馬: ['子', '丑'],
  羊: ['丑', '子'],
  猴: ['寅', '亥'],
  雞: ['卯', '戌'],
  狗: ['辰', '酉'],
  豬: ['巳', '申'],
}

// ── 時辰輪 ──

export type Omen = 'good' | 'bad' | 'neutral'

export const OMEN_LABEL: Readonly<Record<Omen, string>> = {
  good: '吉',
  bad: '凶',
  neutral: '平',
}

export interface HourSlot {
  branch: Branch
  range: string
  omen: Omen
  inMarket: boolean
  /** 一句話建議 */
  advice: string
  /** 吉凶由來，例如「與日支相沖」 */
  reason: string
}

const HOUR_ADVICE: Readonly<Record<Omen, { market: string; offMarket: string }>> = {
  good: { market: '適合分批買進', offMarket: '適合檢視投資計畫' },
  bad: { market: '避免追價與重押', offMarket: '別在這時做投資決定' },
  neutral: { market: '照原本計畫操作即可', offMarket: '休息，不必看盤' },
}

/**
 * 推算十二時辰吉凶。
 * 規則：與日支相沖或屬生肖忌時為凶（凶優先），屬生肖三合為吉，其餘為平。
 */
export function buildHourWheel(zodiac: string, dayBranch: string): HourSlot[] {
  const lucky = new Set(ZODIAC_LUCKY_BRANCHES[zodiac] ?? [])
  const avoid = new Set(ZODIAC_AVOID_BRANCHES[zodiac] ?? [])
  const dayClash = isBranch(dayBranch) ? clashOf(dayBranch) : null

  return EARTHLY_BRANCHES.map(branch => {
    let omen: Omen = 'neutral'
    let reason = '無特別沖合'
    if (branch === dayClash) {
      omen = 'bad'
      reason = `與日支${dayBranch}相沖`
    } else if (avoid.has(branch)) {
      omen = 'bad'
      reason = `與生肖${zodiac}相沖害`
    } else if (lucky.has(branch)) {
      omen = 'good'
      reason = `與生肖${zodiac}三合`
    }

    const inMarket = overlapsMarket(branch)
    return {
      branch,
      range: formatHourRange(branch),
      omen,
      inMarket,
      advice: inMarket ? HOUR_ADVICE[omen].market : HOUR_ADVICE[omen].offMarket,
      reason,
    }
  })
}

/** 開盤時段中第一個吉時；沒有吉時則回傳第一個開盤時辰 */
export function primaryMarketSlotIndex(slots: readonly HourSlot[]): number {
  const good = slots.findIndex(slot => slot.inMarket && slot.omen === 'good')
  return good >= 0
    ? good
    : Math.max(
        0,
        slots.findIndex(slot => slot.inMarket)
      )
}

// ── 五行旺衰 ──

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

const ELEMENT_BY_LABEL: ReadonlyMap<string, ElementKey> = new Map(
  ELEMENT_CYCLE.map(key => [ELEMENT_LABEL[key], key])
)

export function elementFromLabel(label: string): ElementKey | null {
  return ELEMENT_BY_LABEL.get(label) ?? null
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

export type Strength = '旺' | '相' | '休' | '囚' | '死'

/** 旺衰由強到弱的排序值 */
export const STRENGTH_RANK: Readonly<Record<Strength, number>> = {
  旺: 4,
  相: 3,
  休: 2,
  囚: 1,
  死: 0,
}

/**
 * 依月支推算五行旺衰（月令）：
 * 當令者旺、我生者相、生我者休、剋我者囚、我剋者死。
 * 相生環上的位移固定，因此以索引運算即可，O(1)。
 */
export function seasonalStrength(monthBranch: string): Record<ElementKey, Strength> | null {
  if (!isBranch(monthBranch)) return null
  const season = ELEMENT_CYCLE.indexOf(BRANCH_ELEMENT[monthBranch])
  // 相生環上相對於當令五行的位移 → 旺衰
  const byOffset: readonly Strength[] = ['旺', '相', '死', '囚', '休']
  const result = {} as Record<ElementKey, Strength>
  ELEMENT_CYCLE.forEach((key, index) => {
    result[key] = byOffset[(index - season + 5) % 5]
  })
  return result
}

/** 相生環上「生我者」 */
export function parentOf(element: ElementKey): ElementKey {
  return ELEMENT_CYCLE[(ELEMENT_CYCLE.indexOf(element) + 4) % 5]
}

/** 相剋：我剋者在相生環上相隔兩位 */
export function controls(element: ElementKey): ElementKey {
  return ELEMENT_CYCLE[(ELEMENT_CYCLE.indexOf(element) + 2) % 5]
}

export interface ElementReading {
  headline: string
  details: string[]
}

const OWN_STRENGTH_TEXT: Readonly<Record<Strength, string>> = {
  旺: '正旺，判斷力在線',
  相: '得令相助，做事順手',
  休: '稍歇，照計畫走就好',
  囚: '受制，容易被消息牽著走',
  死: '最弱，容易被情緒帶著走',
}

/** 依月令旺衰與本命、姓名五行，寫成一句標題與幾句說明 */
export function describeElements(
  strengths: Readonly<Record<ElementKey, Strength>>,
  own: ElementKey | null,
  name: ElementKey | null
): ElementReading {
  const season = ELEMENT_CYCLE.find(key => strengths[key] === '旺')!
  const seasonLabel = ELEMENT_LABEL[season]
  if (!own) {
    return { headline: `${seasonLabel}當令`, details: ['設定生辰後，會加上你的本命五行解讀'] }
  }

  const ownLabel = ELEMENT_LABEL[own]
  const ownStrength = strengths[own]
  const details = [`本命${ownLabel}在這個月處「${ownStrength}」，${OWN_STRENGTH_TEXT[ownStrength]}`]

  const parent = parentOf(own)
  if (own !== season && STRENGTH_RANK[strengths[parent]] >= STRENGTH_RANK['相']) {
    details.push(
      `好在${ELEMENT_LABEL[parent]}正「${strengths[parent]}」，${ELEMENT_LABEL[parent]}能生${ownLabel}，靠紀律（定期定額）補回來`
    )
  }

  if (name) {
    const nameLabel = ELEMENT_LABEL[name]
    if (name === own || name === parent) {
      details.push(`姓名屬${nameLabel}，正好幫你一把`)
    } else if (controls(name) === own) {
      details.push(`姓名屬${nameLabel}，會壓住${ownLabel}，今天更要克制`)
    }
  }

  const headline =
    own === season
      ? `${seasonLabel}當令，你的${ownLabel}正旺`
      : `${seasonLabel}當令，你的${ownLabel}${STRENGTH_RANK[ownStrength] <= 1 ? '偏弱' : '平穩'}`
  return { headline, details }
}

/** 「(丙戌)狗」→「狗」：沖煞描述只取被沖的生肖，干支細節不佔版面 */
export function clashAnimal(chongDesc: string): string {
  const match = /\)\s*(\S+)$/.exec(chongDesc)
  return match ? match[1] : chongDesc
}

// ── 交易日吉凶（走勢圖上的吉印） ──

const TRADE_FRIENDLY = new Set(['交易', '開市', '納財', '立券'])

/** 交易相關事項排到前面，其餘維持原順序（穩定，O(n)） */
export function tradeItemsFirst(items: readonly string[]): string[] {
  const trade: string[] = []
  const rest: string[] = []
  for (const item of items) (TRADE_FRIENDLY.has(item) ? trade : rest).push(item)
  return trade.concat(rest)
}

export interface DayOmenInput {
  yi: readonly string[]
  ji: readonly string[]
  dayBranch: string
  zodiac: string
}

/**
 * 判斷某日對使用者的投資吉凶：
 * 日支沖生肖或忌交易類事項為凶；宜交易類事項為吉；其餘為平。
 */
export function classifyTradingDay({ yi, ji, dayBranch, zodiac }: DayOmenInput): Omen {
  const own = zodiacBranch(zodiac)
  const clashesOwner = own !== null && isBranch(dayBranch) && clashOf(dayBranch) === own
  if (clashesOwner || ji.some(item => TRADE_FRIENDLY.has(item))) return 'bad'
  if (yi.some(item => TRADE_FRIENDLY.has(item))) return 'good'
  return 'neutral'
}

// ── 每日籤 ──

export type LotGrade = '上吉' | '中吉' | '小吉' | '平' | '小凶'
export type Verse = readonly [string, string, string, string]

/** 分數門檻由高到低，第一個符合者即為籤等 */
const GRADE_THRESHOLDS: ReadonlyArray<readonly [number, LotGrade]> = [
  [80, '上吉'],
  [65, '中吉'],
  [50, '小吉'],
  [35, '平'],
]

export function gradeFromScore(score: number): LotGrade {
  for (const [threshold, grade] of GRADE_THRESHOLDS) {
    if (score >= threshold) return grade
  }
  return '小凶'
}

export const VERSES: Readonly<Record<LotGrade, readonly Verse[]>> = {
  上吉: [
    ['青龍入宅照財門', '開市交易利三分', '莫嫌今日收成小', '細水長流自成金'],
    ['春風得意馬蹄輕', '財星高照滿堂明', '順勢而為無阻礙', '穩中求進見功成'],
    ['紫氣東來福滿門', '金銀入庫自紛紛', '但留三分防風雨', '長抱方知利更真'],
  ],
  中吉: [
    ['小雨潤物枝漸長', '莫在高處追新價', '分批入市輕下注', '月圓之後見財光'],
    ['雲開半日見青天', '小舟慢行不用帆', '分批入市心安定', '漸入佳境利綿綿'],
    ['柳暗花明又一村', '財源細細自盈門', '莫因小利生貪念', '守得雲開見月輪'],
  ],
  小吉: [
    ['勢弱之時宜守成', '浮雲過眼莫心驚', '十日之內觀風向', '待到天晴再啟程'],
    ['細雨綿綿路未乾', '行人且慢莫心煩', '小量試水知深淺', '穩紮穩打保平安'],
    ['門前溪水緩緩流', '不急不躁自無憂', '定期定額依舊扣', '春來自有好收頭'],
  ],
  平: [
    ['不晴不雨半陰天', '進退之間守中間', '按兵不動觀其變', '莫為消息亂心弦'],
    ['平平淡淡又一天', '手中籌碼莫輕捐', '照表操課無須改', '靜待東風到眼前'],
    ['潮來潮去本尋常', '不必追高不必慌', '多看少做留餘地', '明朝自有好時光'],
  ],
  小凶: [
    ['風高浪急莫行船', '錢財收好莫輕言', '今日退守明日進', '留得青山在眼前'],
    ['烏雲蓋頂雨將臨', '急事緩辦保本金', '減碼避險為上策', '三日之後再觀心'],
    ['路有荊棘腳步遲', '強求反惹是非來', '不如閉門讀書去', '等待時來運自開'],
  ],
}

const DIGITS = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九']

/** 1–99 轉中文數字，例如 27 → 二十七 */
export function toChineseNumber(n: number): string {
  if (!Number.isInteger(n) || n < 1 || n > 99) return String(n)
  const tens = Math.floor(n / 10)
  const ones = n % 10
  if (tens === 0) return DIGITS[ones]
  return `${tens === 1 ? '' : DIGITS[tens]}十${DIGITS[ones]}`
}

/** 六十甲子籤 */
export const LOT_COUNT = 60

export interface FortuneLot {
  number: number
  title: string
  grade: LotGrade
  verse: Verse
}

/**
 * 抽籤：籤等由分數決定，不因重搖而改變；
 * 籤號與籤詩由當日種子決定，重搖（draw 遞增）會換一支同籤等的籤。
 */
export function drawLot(score: number, seed: number, draw = 0): FortuneLot {
  const grade = gradeFromScore(score)
  const verses = VERSES[grade]
  const base = Math.abs(Math.trunc(seed))
  const number = ((base + draw * 7) % LOT_COUNT) + 1
  return {
    number,
    title: `第${toChineseNumber(number)}籤`,
    grade,
    verse: verses[(base + draw) % verses.length],
  }
}

// ── 白話解讀 ──

export type Recommendation = 'BUY' | 'SELL' | 'HOLD' | 'OBSERVE'

export const RECOMMENDATION_TEXT: Readonly<
  Record<Recommendation, { label: string; avoid: string }>
> = {
  BUY: { label: '分批買進', avoid: '一次重押' },
  HOLD: { label: '續抱不動', avoid: '追高殺低' },
  OBSERVE: { label: '先觀望', avoid: '衝動進場' },
  SELL: { label: '減碼避險', avoid: '逆勢加碼' },
}
