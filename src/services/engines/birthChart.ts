// @ts-expect-error - lunar-javascript doesn't have TypeScript definitions
import { Solar } from 'lunar-javascript'
import {
  ELEMENT_LABEL,
  hourBranch,
  nayinElement,
  parseGanZhi,
  zodiacOf,
  type Branch,
  type ElementKey,
  type GanZhi,
  type ZodiacAnimal,
} from '@/utils/ganzhi'
import { PILLAR_KEYS, type FourPillars } from '@/utils/tenGods'
import { getLuckyColors, getLuckyNumbers, type Element } from '@/utils/zodiac'
import type { PersonalBaZi } from '@/types'

/** 建立命盤所需的出生資料 */
export interface BirthInput {
  birthDate: string
  birthTime: string
}

export interface BirthChart {
  /**
   * 年柱以立春為界，月柱以節氣為界。
   * 晚子時採流派 2：日柱在午夜換日，時柱從 23:00 起用次日子時的干支。
   */
  pillars: FourPillars
  /** 農曆年干支（以正月初一為界），生肖、納音與紫微斗數以此為準 */
  lunarYear: GanZhi
  /**
   * 農曆生月 1–12；閏月前半歸本月、後半歸次月。
   * 晚子時出生者使用當日的農曆月日。
   */
  lunarMonth: number
  lunarDay: number
  hourBranch: Branch
  zodiac: ZodiacAnimal
  /** 本命五行：農曆年柱的納音 */
  element: ElementKey
}

interface EightChar {
  getYear(): string
  getMonth(): string
  getDay(): string
  getTime(): string
}

interface LunarBirth {
  getEightChar(): EightChar
  getYearInGanZhi(): string
  getMonth(): number
  getDay(): number
}

/** 未填出生時間時以正午計 */
const DEFAULT_HOUR = 12
const CACHE_LIMIT = 32
const cache = new Map<string, BirthChart>()

function parseBirthDate(birthDate: string): { year: number; month: number; day: number } {
  if (!birthDate) throw new Error('出生日期不能為空')
  const [year, month, day] = birthDate.split('-').map(Number)
  // 用 Date 回推一次，擋掉 2 月 31 日這類不存在的日期
  const probe = new Date(Date.UTC(2000, month - 1, day))
  probe.setUTCFullYear(year)
  const valid =
    Number.isInteger(year) &&
    probe.getUTCFullYear() === year &&
    probe.getUTCMonth() === month - 1 &&
    probe.getUTCDate() === day
  if (!valid) throw new Error(`無效的出生日期: ${birthDate}`)
  if (year < 1900 || year > 2100) throw new Error(`出生年份超出範圍 (1900-2100): ${year}`)
  return { year, month, day }
}

function parseBirthTime(birthTime: string): { hour: number; minute: number } {
  const match = /^(\d{1,2}):(\d{2})/.exec(birthTime ?? '')
  if (!match) return { hour: DEFAULT_HOUR, minute: 0 }
  const hour = Number(match[1])
  const minute = Number(match[2])
  return hour < 24 && minute < 60 ? { hour, minute } : { hour: DEFAULT_HOUR, minute: 0 }
}

function requireGanZhi(text: string): GanZhi {
  const ganZhi = parseGanZhi(text)
  if (!ganZhi) throw new Error(`無法解析干支: ${text}`)
  return ganZhi
}

/** 閏月（以負數表示）前十五日歸本月，之後歸次月 */
function normalizeLunarMonth(month: number, day: number): number {
  if (month > 0) return month
  const base = -month
  return day <= 15 ? base : (base % 12) + 1
}

function computeBirthChart({ birthDate, birthTime }: BirthInput): BirthChart {
  const { year, month, day } = parseBirthDate(birthDate)
  const { hour, minute } = parseBirthTime(birthTime)
  const lunar = Solar.fromYmdHms(year, month, day, hour, minute, 0).getLunar() as LunarBirth
  const eightChar = lunar.getEightChar()

  const texts = [eightChar.getYear(), eightChar.getMonth(), eightChar.getDay(), eightChar.getTime()]
  const pillars = Object.fromEntries(
    PILLAR_KEYS.map((key, index) => [key, requireGanZhi(texts[index])])
  ) as unknown as FourPillars

  const lunarYear = requireGanZhi(lunar.getYearInGanZhi())
  return {
    pillars,
    lunarYear,
    lunarMonth: normalizeLunarMonth(lunar.getMonth(), lunar.getDay()),
    lunarDay: lunar.getDay(),
    hourBranch: hourBranch(hour),
    zodiac: zodiacOf(lunarYear.branch),
    element: nayinElement(lunarYear),
  }
}

/**
 * 依出生日期與時間建立命盤，供所有引擎與卡片共用。
 * 同一組出生資料只算一次；超過上限時淘汰最早放入的。
 */
export function buildBirthChart(input: BirthInput): BirthChart {
  const key = `${input.birthDate}|${input.birthTime}`
  const cached = cache.get(key)
  if (cached) return cached

  const chart = computeBirthChart(input)
  if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value!)
  cache.set(key, chart)
  return chart
}

export interface BirthProfile {
  zodiac: string
  element: Element
  luckyColors: string[]
  luckyNumbers: number[]
}

/** 由出生日期推算生肖、本命五行與對應的幸運色、幸運數字，供個人設定儲存 */
export function deriveBirthProfile(birthDate: string): BirthProfile {
  const chart = buildBirthChart({ birthDate, birthTime: '' })
  const element = ELEMENT_LABEL[chart.element] as Element
  return {
    zodiac: chart.zodiac,
    element,
    luckyColors: getLuckyColors(element),
    luckyNumbers: getLuckyNumbers(element),
  }
}

const ganZhiText = ({ stem, branch }: GanZhi) => `${stem}${branch}`

/** 命盤的文字摘要，隨運勢結果一併輸出 */
export function toPersonalBaZi(chart: BirthChart): PersonalBaZi {
  return {
    yearGanZhi: ganZhiText(chart.pillars.year),
    monthGanZhi: ganZhiText(chart.pillars.month),
    dayGanZhi: ganZhiText(chart.pillars.day),
    hourGanZhi: ganZhiText(chart.pillars.hour),
    zodiac: chart.zodiac,
    element: ELEMENT_LABEL[chart.element],
  }
}

/** 0–100 分轉成一個字的強弱描述，介面上不直接顯示分數 */
export function energyWord(score: number): '強' | '中' | '弱' {
  if (score >= 70) return '強'
  if (score >= 50) return '中'
  return '弱'
}
