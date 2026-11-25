/**
 * Pinia Colada 查詢定義
 *
 * 所有非同步資料（ETF 行情、農民曆、整合運勢）統一由 Pinia Colada 的 query cache 管理：
 * - 以 key 階層做快取與失效（invalidateQueries({ key: ['fortune'] }) 一次清掉所有運勢）
 * - 同 key 並發請求自動去重，staleTime 內直接回傳快取
 * - 服務層以動態 import 載入，避免將 lunar-javascript / axios / 命理引擎打包進 main chunk
 */
import { defineQueryOptions, type QueryCache } from '@pinia/colada'
import type { LunarData, InvestmentAdvice } from '@/services/lunar'
import type { IntegratedFortuneData, UserProfileCompat } from '@/services/integratedFortune'
import {
  getCachedMarketSnapshot,
  isMarketOffline,
  marketDateRange,
  saveMarketSnapshot,
  type MarketRange,
  type MarketSnapshot,
} from '@/services/marketHistory'
import { ENGINE_SETTINGS_STORAGE_KEY } from '@/services/engines/settings'
import { toLocalDateString } from '@/utils/date'
import { fnv1a, profileHash } from '@/utils/hash'
import type { PriceAdjustment } from '@/utils/priceAdjust'

const MINUTE = 60 * 1000

/** 查詢鍵工廠：集中管理，確保失效時前綴一致 */
export const queryKeys = {
  etf: {
    root: ['etf'] as const,
    range: (startDate: string, endDate: string) => ['etf', '0050', startDate, endDate] as const,
    adjustments: ['etf', '0050', 'adjustments'] as const,
  },
  lunar: {
    root: ['lunar'] as const,
    day: (day: string) => ['lunar', day] as const,
  },
  fortune: {
    root: ['fortune'] as const,
    day: (profile: string, day: string, engines: string) =>
      ['fortune', profile, day, engines] as const,
  },
}

/** 引擎設定指紋：設定變動 → 查詢鍵改變 → 自動重新計算，不需手動清快取 */
export function engineSettingsFingerprint(): string {
  try {
    return fnv1a(localStorage.getItem(ENGINE_SETTINGS_STORAGE_KEY) ?? 'default')
  } catch {
    return 'default'
  }
}

/** 0050 ETF 行情（依日期範圍） */
const etfRangeQuery = defineQueryOptions(({ startDate, endDate }: MarketRange) => ({
  key: queryKeys.etf.range(startDate, endDate),
  query: async (): Promise<MarketSnapshot> => {
    const { FinMindService } = await import('@/services/finmind')
    return FinMindService.getMarketHistory(startDate, endDate)
  },
  staleTime: 10 * MINUTE,
  gcTime: 30 * MINUTE,
}))

type MarketLoadResult =
  { data: MarketSnapshot; status: 'current' | 'cached' } | { data: null; status: 'unavailable' }

/** 本機快取只在離線或查詢失敗時使用，避免把快取記成新的來源回應。 */
export async function loadMarketRange(
  queryCache: QueryCache,
  range: MarketRange,
  force = false,
  lookbackDays?: number
): Promise<MarketLoadResult> {
  if (!isMarketOffline()) {
    const entry = queryCache.ensure(etfRangeQuery(range))
    try {
      const state = force ? await queryCache.fetch(entry) : await queryCache.refresh(entry)
      if (state.status === 'success') {
        saveMarketSnapshot(state.data, lookbackDays)
        return { data: state.data, status: 'current' }
      }
    } catch {
      // 查詢失敗時只讀取曾成功驗證的行情。
    }
  }

  const cached = getCachedMarketSnapshot(range, lookbackDays)
  return cached ? { data: cached, status: 'cached' } : { data: null, status: 'unavailable' }
}

/** 0050 的分割與除息還原係數：一年只變動兩次，快取半天 */
export const priceAdjustmentsQuery = defineQueryOptions({
  key: queryKeys.etf.adjustments,
  query: async (): Promise<PriceAdjustment[]> => {
    const { FinMindService } = await import('@/services/finmind')
    return FinMindService.getPriceAdjustments()
  },
  staleTime: 12 * 60 * MINUTE,
  gcTime: 12 * 60 * MINUTE,
})

export interface LunarQueryData {
  lunarData: LunarData
  investmentAdvice: InvestmentAdvice
}

/** 農民曆：同一天結果固定，永不過期 */
export const lunarDayQuery = defineQueryOptions((date: Date) => ({
  key: queryKeys.lunar.day(toLocalDateString(date)),
  query: async (): Promise<LunarQueryData> => {
    const { lunarService } = await import('@/services/lunar')
    return {
      lunarData: lunarService.getLunarData(date),
      investmentAdvice: lunarService.getInvestmentAdvice(date),
    }
  },
  staleTime: Infinity,
  gcTime: 60 * MINUTE,
}))

/** 整合運勢：鍵 = 個人資料雜湊 + 日期 + 引擎設定指紋 */
export const integratedFortuneQuery = defineQueryOptions(
  ({ profile, date }: { profile: UserProfileCompat; date: Date }) => ({
    key: queryKeys.fortune.day(
      profileHash(profile),
      toLocalDateString(date),
      engineSettingsFingerprint()
    ),
    query: async (): Promise<IntegratedFortuneData> => {
      const { IntegratedFortuneService } = await import('@/services/integratedFortune')
      return IntegratedFortuneService.calculateIntegratedFortune(profile, date)
    },
    staleTime: 30 * MINUTE,
    gcTime: 60 * MINUTE,
  })
)

/** 以臺灣當地日期為終點的行情區間。 */
export const dateRangeFromToday = marketDateRange
