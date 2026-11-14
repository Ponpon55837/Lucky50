// @ts-expect-error - lunar-javascript doesn't have TypeScript definitions
import { Solar } from 'lunar-javascript'
import { s2t } from 'chinese-s2t'

/** 二十四節氣，自立春起依序排列 */
export const SOLAR_TERMS = [
  '立春',
  '雨水',
  '驚蟄',
  '春分',
  '清明',
  '穀雨',
  '立夏',
  '小滿',
  '芒種',
  '夏至',
  '小暑',
  '大暑',
  '立秋',
  '處暑',
  '白露',
  '秋分',
  '寒露',
  '霜降',
  '立冬',
  '小雪',
  '大雪',
  '冬至',
  '小寒',
  '大寒',
] as const

export type SolarTerm = (typeof SOLAR_TERMS)[number]

/** 二分二至與四立：圓盤上固定標示的方位節氣 */
export const SEASON_MARKERS: readonly SolarTerm[] = [
  '立春',
  '春分',
  '立夏',
  '夏至',
  '立秋',
  '秋分',
  '立冬',
  '冬至',
]

// lunar-javascript 的節氣名稱為簡體，且少數字（如「谷」）簡繁對應不唯一，以表格補正
const NAME_FIX: Readonly<Record<string, SolarTerm>> = { 谷雨: '穀雨' }

/** 簡體或繁體節氣名稱 → 索引（自立春起 0–23）；非節氣回傳 -1 */
export function solarTermIndex(name: string): number {
  const traditional = NAME_FIX[name] ?? s2t(name)
  return SOLAR_TERMS.indexOf(traditional as SolarTerm)
}

const DAY_MS = 86_400_000

/** 以當地日期計算兩天相差的天數（忽略時分秒與日光節約） */
export function daysBetween(from: Date, to: Date): number {
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())
  const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate())
  return Math.round((b - a) / DAY_MS)
}

export interface SolarTermProgress {
  /** 目前所在節氣（最近一次交節） */
  current: SolarTerm
  currentIndex: number
  currentDate: Date
  next: SolarTerm
  nextDate: Date
  /** 交節後第幾天（交節當天為 0） */
  daysIn: number
  /** 距離下個節氣的天數 */
  daysLeft: number
  /** 在本節氣內的進度 0–1 */
  fraction: number
}

interface JieQiLike {
  getName(): string
  getSolar(): { getYear(): number; getMonth(): number; getDay(): number }
}

const toDate = (jieQi: JieQiLike) => {
  const solar = jieQi.getSolar()
  return new Date(solar.getYear(), solar.getMonth() - 1, solar.getDay())
}

/** 依日期取得所在節氣與到下個節氣的進度（以交節日為界，交節當天算新節氣） */
export function solarTermProgress(date: Date): SolarTermProgress | null {
  const lunar = Solar.fromDate(date).getLunar()
  const prev: JieQiLike = lunar.getPrevJieQi(true)
  const next: JieQiLike = lunar.getNextJieQi(true)
  const currentIndex = solarTermIndex(prev.getName())
  const nextIndex = solarTermIndex(next.getName())
  if (currentIndex < 0 || nextIndex < 0) return null

  const currentDate = toDate(prev)
  const nextDate = toDate(next)
  const span = Math.max(1, daysBetween(currentDate, nextDate))
  const daysIn = daysBetween(currentDate, date)
  return {
    current: SOLAR_TERMS[currentIndex],
    currentIndex,
    currentDate,
    next: SOLAR_TERMS[nextIndex],
    nextDate,
    daysIn,
    daysLeft: daysBetween(date, nextDate),
    fraction: Math.min(1, Math.max(0, daysIn / span)),
  }
}
