/**
 * 農民曆推算工具（純函式）
 *
 * 時辰吉凶、五行旺衰、交易日吉凶與每日籤詩都在這裡計算，
 * 元件只負責呈現。所有查表皆為 O(1)，整體計算量與時辰數（12）或交易日數成線性。
 */
import {
  BRANCH_RELATION_LABEL,
  EARTHLY_BRANCHES,
  ELEMENT_CYCLE,
  ELEMENT_LABEL,
  branchElement,
  branchIndex,
  branchRelation,
  clashOf,
  controls,
  hiddenStems,
  hourStem,
  isBranch,
  parentOf,
  parseGanZhi,
  stemElement,
  wrap,
  zodiacBranch,
  type Branch,
  type BranchRelation,
  type ElementKey,
  type GanZhi,
} from './ganzhi'

// ── 時辰 ──

/** 子時跨日（23:00 起），其餘每個時辰往後推兩小時 */
export function hourRangeOf(branch: Branch): { start: number; end: number } {
  const start = (branchIndex(branch) * 2 + 23) % 24
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

// ── 黃道黑道十二神 ──

/** 自青龍起順排的十二神 */
const DAY_OFFICERS = [
  '青龍',
  '明堂',
  '天刑',
  '朱雀',
  '金匱',
  '天德',
  '白虎',
  '玉堂',
  '天牢',
  '玄武',
  '司命',
  '勾陳',
] as const
export type DayOfficer = (typeof DAY_OFFICERS)[number]

/** 青龍、明堂、金匱、天德、玉堂、司命為黃道，其餘為黑道 */
const YELLOW_PATH: ReadonlySet<DayOfficer> = new Set([
  '青龍',
  '明堂',
  '金匱',
  '天德',
  '玉堂',
  '司命',
])

export interface HourOfficer {
  name: DayOfficer
  /** 黃道為吉 */
  auspicious: boolean
}

/**
 * 某日某時辰的值時神。
 * 口訣「子午青龍起在申，卯酉之日又在寅，寅申須從子上起，巳亥在午不須論，
 * 唯有辰戌歸辰位，丑未原從戌上尋」：青龍起始支每兩位一跳，六日一循環，
 * 其餘十一神依序順排，因此直接以索引算出，O(1)。
 */
export function hourOfficer(dayBranch: Branch, hour: Branch): HourOfficer {
  const dragonStart = ((branchIndex(dayBranch) % 6) * 2 + 8) % 12
  const name = DAY_OFFICERS[wrap(branchIndex(hour) - dragonStart, 12)]
  return { name, auspicious: YELLOW_PATH.has(name) }
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
  /** 時干支，例如「庚午」 */
  ganZhi: string
  range: string
  /** 值時神，例如「司命」 */
  officer: DayOfficer
  omen: Omen
  inMarket: boolean
  /** 一句話建議 */
  advice: string
  /** 吉凶由來，例如「司命黃道」 */
  reason: string
}

const HOUR_ADVICE: Readonly<Record<Omen, { market: string; offMarket: string }>> = {
  good: { market: '適合分批買進', offMarket: '適合檢視投資計畫' },
  bad: { market: '避免追價與重押', offMarket: '別在這時做投資決定' },
  neutral: { market: '照原本計畫操作即可', offMarket: '休息，不必看盤' },
}

/** 黃道黑道為主（±2），本命合害為輔（±1）；合計達 ±2 才定吉凶 */
const OFFICER_WEIGHT = 2
const OMEN_THRESHOLD = 2

function judgeHour(
  hour: Branch,
  dayBranch: Branch,
  officer: HourOfficer,
  zodiac: string,
  own: Branch | null
): { omen: Omen; reason: string } {
  // 沖最重：日破之時與沖本命之時，通書一律不取
  if (clashOf(hour) === dayBranch) {
    return { omen: 'bad', reason: `日破，與日支${dayBranch}相沖` }
  }
  if (own !== null && clashOf(hour) === own) {
    return { omen: 'bad', reason: `沖生肖${zodiac}` }
  }

  const path = `${officer.name}${officer.auspicious ? '黃道' : '黑道'}`
  let score = officer.auspicious ? OFFICER_WEIGHT : -OFFICER_WEIGHT
  let personal = ''
  if (own !== null) {
    const relation = branchRelation(own, hour)
    if (relation === 'sixHarmony' || relation === 'threeHarmony') {
      score += 1
      personal = `與生肖${zodiac}${BRANCH_RELATION_LABEL[relation]}`
    } else if (relation === 'harm') {
      score -= 1
      personal = `與生肖${zodiac}相害`
    }
  }

  const omen: Omen = score >= OMEN_THRESHOLD ? 'good' : score <= -OMEN_THRESHOLD ? 'bad' : 'neutral'
  return { omen, reason: personal ? `${path}，${personal}` : path }
}

/**
 * 推算某日十二時辰的吉凶。
 * 依序看：日破與沖本命（凶）、黃道黑道十二神、時支與本命生肖的合害。
 * 生肖不明時只看前兩項。
 */
export function buildHourWheel(zodiac: string, dayGanZhi: string): HourSlot[] {
  const day = parseGanZhi(dayGanZhi)
  if (!day) return []
  const own = zodiacBranch(zodiac)

  return EARTHLY_BRANCHES.map(branch => {
    const officer = hourOfficer(day.branch, branch)
    const { omen, reason } = judgeHour(branch, day.branch, officer, zodiac, own)
    const inMarket = overlapsMarket(branch)
    return {
      branch,
      ganZhi: `${hourStem(day.stem, branch)}${branch}`,
      range: formatHourRange(branch),
      officer: officer.name,
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
  const season = ELEMENT_CYCLE.indexOf(branchElement(monthBranch))
  // 相生環上相對於當令五行的位移 → 旺衰
  const byOffset: readonly Strength[] = ['旺', '相', '死', '囚', '休']
  const result = {} as Record<ElementKey, Strength>
  ELEMENT_CYCLE.forEach((key, index) => {
    result[key] = byOffset[(index - season + 5) % 5]
  })
  return result
}

/** 命盤佔八成、流日佔兩成 */
const NATAL_SHARE = 0.8

function tallyElements(
  pillars: readonly GanZhi[],
  share: number,
  into: Record<ElementKey, number>
) {
  if (pillars.length === 0) return
  // 每柱天干一份、地支藏干合計一份
  const unit = share / (pillars.length * 2)
  for (const { stem, branch } of pillars) {
    into[stemElement(stem)] += unit
    for (const hidden of hiddenStems(branch)) {
      into[stemElement(hidden.stem)] += unit * hidden.weight
    }
  }
}

/**
 * 五行能量分佈（百分比）：命盤四柱的天干與地支藏干，加上流日干支的引動。
 * 地支依本氣、中氣、餘氣的比例拆給各藏干。
 */
export function elementEnergy(
  natal: readonly GanZhi[],
  day: GanZhi | null
): Record<ElementKey, number> {
  const energy: Record<ElementKey, number> = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 }
  tallyElements(natal, day ? NATAL_SHARE : 1, energy)
  if (day) tallyElements([day], 1 - NATAL_SHARE, energy)
  for (const key of ELEMENT_CYCLE) energy[key] = Math.round(energy[key] * 100)
  return energy
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

/** 宜忌是否提到交易類事項 */
function mentionsTrade(items: readonly string[]): boolean {
  return items.some(item => TRADE_FRIENDLY.has(item))
}

/** 日支是否沖使用者生肖；生肖未設定或日支格式不對時為否 */
export function clashesZodiac(dayBranch: string, zodiac: string): boolean {
  const own = zodiacBranch(zodiac)
  return own !== null && isBranch(dayBranch) && clashOf(dayBranch) === own
}

/**
 * 判斷某日對使用者的投資吉凶：
 * 日支沖生肖或忌交易類事項為凶；宜交易類事項為吉；其餘為平。
 */
export function classifyTradingDay({ yi, ji, dayBranch, zodiac }: DayOmenInput): Omen {
  if (clashesZodiac(dayBranch, zodiac) || mentionsTrade(ji)) return 'bad'
  if (mentionsTrade(yi)) return 'good'
  return 'neutral'
}

// ── 擇日評分 ──

/** 分數的一項由來，例如「值日青龍黃道 +10」 */
export interface ScoreFactor {
  label: string
  delta: number
}

/** 不吉不凶的基準分；所有加減項都由此出發 */
export const BASE_SCORE = 50
const MIN_SCORE = 5
const MAX_SCORE = 95

/** 分數取整並限制在 5–95，不出現絕對的滿分或零分 */
export function clampScore(score: number): number {
  return Math.max(MIN_SCORE, Math.min(MAX_SCORE, Math.round(score)))
}

/** 把各項加減分套到基準分上 */
export function applyFactors(factors: readonly ScoreFactor[]): number {
  let score = BASE_SCORE
  for (const factor of factors) score += factor.delta
  return clampScore(score)
}

/**
 * 建除十二神的擇日用法，取自口訣
 * 「建滿平收黑，除危定執黃，成開皆可用，閉破不相當」。
 */
const ESTABLISHMENT_DELTA: Readonly<Record<string, number>> = {
  成: 12,
  開: 12,
  除: 8,
  危: 8,
  定: 8,
  執: 8,
  建: -8,
  滿: -8,
  平: -8,
  收: -8,
  閉: -14,
  破: -14,
}

/** 日支（或太歲）與本命年支各種關係的加減分 */
const DAY_RELATION_DELTA: Readonly<Record<BranchRelation, number>> = {
  clash: -18,
  sixHarmony: 10,
  threeHarmony: 8,
  harm: -6,
  same: 0,
  none: 0,
}
const TAI_SUI_DELTA: Readonly<Record<BranchRelation, number>> = {
  clash: -5,
  same: -3,
  harm: -2,
  sixHarmony: 3,
  threeHarmony: 3,
  none: 0,
}
const TAI_SUI_LABEL: Readonly<Record<BranchRelation, string>> = {
  clash: '沖太歲',
  same: '值太歲',
  harm: '害太歲',
  sixHarmony: '與太歲六合',
  threeHarmony: '與太歲三合',
  none: '',
}

export interface DayQualityInput {
  /** 值日天神，例如「青龍」 */
  tianShen: string
  /** 值日天神吉凶：「吉」為黃道，「凶」為黑道 */
  tianShenLuck: string
  /** 建除十二神，例如「成」 */
  zhiXing: string
  yi: readonly string[]
  ji: readonly string[]
  dayBranch: string
  /** 流年地支（太歲） */
  yearBranch: string
  /** 使用者生肖；留空則只看日子本身 */
  zodiac: string
}

/**
 * 擇日評分：值日天神黃黑道、建除十二神、交易類宜忌，
 * 再加上日支與流年太歲對本命年支的沖合害。每一項都列在 factors 供畫面說明。
 */
export function assessTradingDay(input: DayQualityInput): ScoreFactor[] {
  const factors: ScoreFactor[] = []
  const add = (label: string, delta: number) => {
    if (delta !== 0) factors.push({ label, delta })
  }

  if (input.tianShenLuck === '吉') add(`值日${input.tianShen}黃道`, 10)
  else if (input.tianShenLuck === '凶') add(`值日${input.tianShen}黑道`, -10)

  add(`建除值「${input.zhiXing}」`, ESTABLISHMENT_DELTA[input.zhiXing] ?? 0)

  if (mentionsTrade(input.ji)) add('忌交易類事項', -12)
  else if (mentionsTrade(input.yi)) add('宜交易類事項', 12)

  const own = zodiacBranch(input.zodiac)
  if (own !== null) {
    if (isBranch(input.dayBranch)) {
      const relation = branchRelation(own, input.dayBranch)
      add(
        `日支${input.dayBranch}與生肖${input.zodiac}${BRANCH_RELATION_LABEL[relation]}`,
        DAY_RELATION_DELTA[relation]
      )
    }
    if (isBranch(input.yearBranch)) {
      const relation = branchRelation(own, input.yearBranch)
      add(TAI_SUI_LABEL[relation], TAI_SUI_DELTA[relation])
    }
  }
  return factors
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

/** 建議門檻：75 以上買進、60 以上續抱、40 以上觀望，其餘減碼 */
export const BUY_THRESHOLD = 75
export const HOLD_THRESHOLD = 60
export const OBSERVE_THRESHOLD = 40

export function recommendationFromScore(score: number): Recommendation {
  if (score >= BUY_THRESHOLD) return 'BUY'
  if (score >= HOLD_THRESHOLD) return 'HOLD'
  if (score >= OBSERVE_THRESHOLD) return 'OBSERVE'
  return 'SELL'
}

export type RiskLevel = 'low' | 'medium' | 'high'

export const RECOMMENDATION_RISK: Readonly<Record<Recommendation, RiskLevel>> = {
  BUY: 'low',
  HOLD: 'medium',
  OBSERVE: 'medium',
  SELL: 'high',
}
