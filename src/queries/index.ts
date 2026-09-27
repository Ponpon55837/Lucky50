/**
 * Pinia Colada 查詢定義
 *
 * 所有非同步資料（ETF 行情、農民曆、整合運勢）統一由 Pinia Colada 的 query cache 管理：
 * - 以 key 階層做快取與失效（invalidateQueries({ key: ['fortune'] }) 一次清掉所有運勢）
 * - 同 key 並發請求自動去重，staleTime 內直接回傳快取
 * - 服務層以動態 import 載入，避免將 lunar-javascript / axios / 命理引擎打包進 main chunk
 */
import { defineQueryOptions } from '@pinia/colada'
import type { ETFData } from '@/types'
import type { LunarData, InvestmentAdvice } from '@/services/lunar'
import type { IntegratedFortuneData, UserProfileCompat } from '@/services/integratedFortune'
import { toLocalDateString } from '@/utils/date'
import { fnv1a, profileHash } from '@/utils/hash'

const MINUTE = 60 * 1000
const ENGINE_SETTINGS_STORAGE_KEY = 'lucky50-engine-settings'

/** 查詢鍵工廠：集中管理，確保失效時前綴一致 */
export const queryKeys = {
  etf: {
    root: ['etf'] as const,
    range: (startDate: string, endDate: string) => ['etf', '0050', startDate, endDate] as const,
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
export const etfRangeQuery = defineQueryOptions(
  ({ startDate, endDate }: { startDate: string; endDate: string }) => ({
    key: queryKeys.etf.range(startDate, endDate),
    query: async (): Promise<ETFData[]> => {
      const { FinMindService } = await import('@/services/finmind')
      return FinMindService.getETFData(startDate, endDate)
    },
    staleTime: 10 * MINUTE,
    gcTime: 30 * MINUTE,
  })
)

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

/** 計算以今天為終點、往前 days 天的日期範圍 */
export function dateRangeFromToday(days: number, now: Date = new Date()) {
  return {
    startDate: toLocalDateString(new Date(now.getTime() - days * 24 * MINUTE * 60)),
    endDate: toLocalDateString(now),
  }
}
