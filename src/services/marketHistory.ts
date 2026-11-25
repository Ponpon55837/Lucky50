import type { ETFData } from '@/types'

export interface MarketRange {
  startDate: string
  endDate: string
}

export interface MarketProvenance {
  source: 'FinMind'
  asOf: string
  fetchedAt: string
}

export interface MarketSnapshot {
  range: MarketRange
  bars: ETFData[]
  provenance: MarketProvenance
}

export type MarketStatus = 'idle' | 'current' | 'cached' | 'unavailable'

const tradingDateFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Taipei',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export function marketDateRange(days: number, now: Date = new Date()): MarketRange {
  const endDate = tradingDateFormat.format(now)
  const start = new Date(`${endDate}T00:00:00Z`)
  start.setUTCDate(start.getUTCDate() - days)
  return { startDate: start.toISOString().slice(0, 10), endDate }
}

export function isIsoDay(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().startsWith(value)
}

export function isValidBar(bar: ETFData, range: MarketRange): boolean {
  return (
    isIsoDay(bar.date) &&
    bar.date >= range.startDate &&
    bar.date <= range.endDate &&
    [bar.open, bar.high, bar.low, bar.close].every(price => Number.isFinite(price) && price > 0) &&
    bar.low <= Math.min(bar.open, bar.close) &&
    bar.high >= Math.max(bar.open, bar.close) &&
    Number.isSafeInteger(bar.volume) &&
    bar.volume >= 0 &&
    Number.isFinite(bar.change) &&
    Number.isFinite(bar.changePercent)
  )
}

export const isMarketOffline = () => typeof navigator !== 'undefined' && navigator.onLine === false

const STORAGE_PREFIX = 'lucky50-finmind-0050-v1:'
const MAX_SNAPSHOTS = 8 // 六種分析期間、800 天技術指標與一組自訂範圍
const memory = new Map<string, MarketSnapshot>()

function cacheKey({ startDate, endDate }: MarketRange, lookbackDays?: number): string {
  return `${STORAGE_PREFIX}${lookbackDays === undefined ? `${startDate}/${endDate}` : `${lookbackDays}d`}`
}

function isValidSnapshot(snapshot: MarketSnapshot): boolean {
  const { bars, range, provenance } = snapshot
  const fetchedAt = new Date(provenance.fetchedAt)
  return (
    provenance.source === 'FinMind' &&
    typeof provenance.fetchedAt === 'string' &&
    Number.isFinite(fetchedAt.getTime()) &&
    fetchedAt.toISOString() === provenance.fetchedAt &&
    isIsoDay(range.startDate) &&
    isIsoDay(range.endDate) &&
    Array.isArray(bars) &&
    bars.length > 0 &&
    provenance.asOf === bars[bars.length - 1].date &&
    bars.every((bar, idx) => isValidBar(bar, range) && (idx === 0 || bars[idx - 1].date < bar.date))
  )
}

function readSnapshot(key: string): MarketSnapshot | null {
  const inMemory = memory.get(key)
  if (inMemory) return inMemory

  try {
    const value = localStorage.getItem(key)
    if (!value) return null
    const snapshot = JSON.parse(value) as MarketSnapshot
    return isValidSnapshot(snapshot) ? snapshot : null
  } catch {
    // 儲存空間可能被封鎖，或舊資料已損毀。
    return null
  }
}

export function saveMarketSnapshot(snapshot: MarketSnapshot, lookbackDays?: number): void {
  const key = cacheKey(snapshot.range, lookbackDays)
  const previous = readSnapshot(key)
  if (previous && previous.provenance.fetchedAt >= snapshot.provenance.fetchedAt) return

  memory.delete(key)
  memory.set(key, snapshot)
  const oldest = memory.keys().next().value
  if (oldest && memory.size > MAX_SNAPSHOTS) memory.delete(oldest)

  try {
    localStorage.setItem(key, JSON.stringify(snapshot))
    const entries: { key: string; fetchedAt: string }[] = []
    for (let index = 0; index < localStorage.length; index++) {
      const candidate = localStorage.key(index)
      if (!candidate?.startsWith(STORAGE_PREFIX)) continue
      const cached = readSnapshot(candidate)
      entries.push({ key: candidate, fetchedAt: cached?.provenance.fetchedAt ?? '' })
    }
    entries.sort((a, b) => b.fetchedAt.localeCompare(a.fetchedAt))
    for (const entry of entries.slice(MAX_SNAPSHOTS)) localStorage.removeItem(entry.key)
  } catch {
    // 無法寫入 localStorage 時仍保留本次開啟頁面的快取。
  }
}

export function getCachedMarketSnapshot(
  range: MarketRange,
  lookbackDays?: number
): MarketSnapshot | null {
  const snapshot = readSnapshot(cacheKey(range, lookbackDays))
  if (
    !snapshot ||
    snapshot.range.startDate > range.startDate ||
    snapshot.range.endDate > range.endDate
  )
    return null
  if (snapshot.range.startDate === range.startDate) return snapshot

  const bars = snapshot.bars.filter(bar => bar.date >= range.startDate && bar.date <= range.endDate)
  if (!bars.length) return null
  return {
    ...snapshot,
    bars,
    provenance: { ...snapshot.provenance, asOf: bars[bars.length - 1].date },
  }
}

const fetchTimeFormat = new Intl.DateTimeFormat('zh-TW', {
  timeZone: 'Asia/Taipei',
  dateStyle: 'short',
  timeStyle: 'short',
  hourCycle: 'h23',
})

export function formatMarketFetchTime(value: string): string {
  return `${fetchTimeFormat.format(new Date(value))}（臺灣時間）`
}
