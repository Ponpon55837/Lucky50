import { defineStore } from 'pinia'
import { ref, computed, shallowRef } from 'vue'
import type { LunarData, InvestmentAdvice } from '@/services/lunar'
import type { IntegratedFortuneData, UserProfileCompat } from '@/services/integratedFortune'
import {
  isMarketOffline,
  type MarketRange,
  type MarketSnapshot,
  type MarketStatus,
} from '@/services/marketHistory'
import { useQueryCache } from '@pinia/colada'
import {
  loadMarketRange,
  lunarDayQuery,
  integratedFortuneQuery,
  dateRangeFromToday,
  queryKeys,
} from '@/queries'

// 儀表板預設顯示最近 30 天行情
const DASHBOARD_ETF_DAYS = 30

// 工具函數 - 直接在 store 中定義
const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(date)
}

const formatVolume = (volume: number): string => {
  if (volume >= 1_000_000) return `${(volume / 1_000_000).toFixed(1)}M`
  if (volume >= 1_000) return `${(volume / 1_000).toFixed(1)}K`
  return volume.toString()
}

export const useDashboardStore = defineStore('dashboard', () => {
  // Pinia Colada query cache：負責快取、去重與失效；本 store 只保留畫面需要的衍生狀態
  const queryCache = useQueryCache()

  /**
   * 執行查詢：force=false 時 staleTime 內直接回傳快取（refresh），force=true 時強制重新抓取（fetch）
   */
  const runQuery = async <T>(
    options: Parameters<typeof queryCache.ensure<T>>[0],
    force = false
  ): Promise<T> => {
    const entry = queryCache.ensure(options)
    const state = force ? await queryCache.fetch(entry) : await queryCache.refresh(entry)
    if (state.status === 'error') throw state.error
    return state.data as T
  }

  // 每類資源的請求序號：只接受最後一次請求的結果，避免快速切換日期時舊回應覆蓋新資料
  const requestSeq = { lunar: 0, fortune: 0, etf: 0 }

  // ===== 狀態 =====

  // 農民曆相關狀態
  const lunarData = shallowRef<LunarData | null>(null)
  const investmentAdvice = shallowRef<InvestmentAdvice | null>(null)

  // 整合運勢狀態
  const integratedFortune = shallowRef<IntegratedFortuneData | null>(null)

  // ETF資料狀態
  const etfSnapshot = shallowRef<MarketSnapshot | null>(null)
  const etfData = computed(() => etfSnapshot.value?.bars ?? [])
  const etfProvenance = computed(() => etfSnapshot.value?.provenance ?? null)
  const etfStatus = ref<MarketStatus>('idle')
  let selectedMarketRange: (MarketRange & { lookbackDays?: number }) | undefined

  // 日期狀態
  const currentDate = ref(new Date())

  // 載入狀態
  const loading = ref(false)
  const lunarLoading = ref(false)
  const fortuneLoading = ref(false)
  const etfLoading = ref(false)

  // 錯誤狀態
  const lunarError = ref<string | null>(null)
  const fortuneError = ref<string | null>(null)
  const etfError = ref<string | null>(null)

  // ===== 計算屬性 =====

  // 統一的投資分數
  const unifiedInvestmentScore = computed(() => {
    // 優先使用整合運勢的投資分數
    if (integratedFortune.value?.investmentScore != null) {
      return integratedFortune.value.investmentScore
    }
    // 備用：使用投資建議的分數
    if (investmentAdvice.value?.luckyScore != null) {
      return investmentAdvice.value.luckyScore
    }
    return 50 // 預設分數
  })

  // 格式化當前日期
  const formattedCurrentDate = computed(() => {
    return formatDate(currentDate.value)
  })

  // ETF最新價格資料
  const latestPrice = computed(() => {
    const data = etfData.value
    return data.length > 0 ? data[data.length - 1] : null
  })

  // 價格變化只計算一次，供 priceChange / priceChangePercent 共用
  const priceMetrics = computed(() => {
    const data = etfData.value
    if (data.length < 2) return { change: 0, percent: 0 }
    const current = data[data.length - 1].close
    const previous = data[data.length - 2].close
    const change = current - previous
    return { change, percent: previous ? (change / previous) * 100 : 0 }
  })

  const priceChange = computed(() => priceMetrics.value.change)
  const priceChangePercent = computed(() => priceMetrics.value.percent)

  // 價格變化顏色（台股慣例：漲紅跌綠）
  const priceChangeColor = computed(() => {
    const change = priceChange.value
    return change > 0 ? 'text-rise' : change < 0 ? 'text-fall' : 'text-ink-3'
  })

  // ===== 方法 =====

  // 載入農民曆資料
  const loadLunarData = async (date: Date = new Date(), force = false) => {
    const seq = ++requestSeq.lunar
    try {
      lunarLoading.value = true
      lunarError.value = null
      currentDate.value = date

      const result = await runQuery(lunarDayQuery(date), force)
      if (seq !== requestSeq.lunar) return
      lunarData.value = result.lunarData
      investmentAdvice.value = result.investmentAdvice
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('載入農民曆資料失敗:', errorMessage)
      lunarError.value = '載入農民曆資料失敗'
      throw error
    } finally {
      lunarLoading.value = false
    }
  }

  // 載入整合運勢資料
  const loadIntegratedFortune = async (
    userProfile: UserProfileCompat | null,
    date: Date = new Date(),
    force = false
  ) => {
    if (!userProfile) {
      fortuneError.value = '請先設定個人資料'
      throw new Error('使用者資料不存在')
    }

    // 驗證 userProfile 必要欄位
    if (!userProfile.name || !userProfile.birthDate || !userProfile.birthTime) {
      const missingFields = []
      if (!userProfile.name) missingFields.push('姓名')
      if (!userProfile.birthDate) missingFields.push('出生日期')
      if (!userProfile.birthTime) missingFields.push('出生時間')
      const errorMsg = `用戶資料不完整，缺少: ${missingFields.join(', ')}`
      console.error('DashboardStore - ' + errorMsg, userProfile)
      fortuneError.value = errorMsg
      throw new Error(errorMsg)
    }

    // 驗證出生日期是否有效
    const birthDate = new Date(userProfile.birthDate)
    if (isNaN(birthDate.getTime())) {
      const errorMsg = `無效的出生日期: ${userProfile.birthDate}`
      console.error('DashboardStore - ' + errorMsg)
      fortuneError.value = errorMsg
      throw new Error(errorMsg)
    }

    const seq = ++requestSeq.fortune
    try {
      fortuneLoading.value = true
      fortuneError.value = null
      currentDate.value = date

      const result = await runQuery(integratedFortuneQuery({ profile: userProfile, date }), force)
      if (seq !== requestSeq.fortune) return
      integratedFortune.value = result
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('載入整合運勢資料失敗:', errorMessage)
      fortuneError.value = '載入運勢資料失敗'
      throw error
    } finally {
      fortuneLoading.value = false
    }
  }

  /** 載入選取範圍的 0050 日 K，範圍切換時立即移除舊資料。 */
  const loadETFRange = async (
    startDate: string,
    endDate: string,
    force = false,
    lookbackDays?: number
  ) => {
    const seq = ++requestSeq.etf
    const changedRange =
      selectedMarketRange?.startDate !== startDate || selectedMarketRange.endDate !== endDate
    selectedMarketRange = { startDate, endDate, lookbackDays }
    if (changedRange) {
      etfSnapshot.value = null
      etfStatus.value = 'idle'
      etfError.value = null
    }
    etfLoading.value = true

    try {
      const { data, status } = await loadMarketRange(
        queryCache,
        { startDate, endDate },
        force,
        lookbackDays
      )
      if (seq !== requestSeq.etf) return
      etfSnapshot.value = data
      etfStatus.value = status
      etfError.value =
        status === 'unavailable'
          ? isMarketOffline()
            ? '目前離線，這段期間尚無 0050 行情快取。'
            : '目前無法取得這段期間的 0050 行情。'
          : null
    } finally {
      if (seq === requestSeq.etf) etfLoading.value = false
    }
  }

  // 載入 ETF 資料（儀表板預設 30 天）
  const loadETFData = (force = false) => {
    const { startDate, endDate } = dateRangeFromToday(DASHBOARD_ETF_DAYS)
    return loadETFRange(startDate, endDate, force, DASHBOARD_ETF_DAYS)
  }

  // 載入所有資料
  const loadAllData = async (
    userProfile: UserProfileCompat | null = null,
    date: Date = new Date(),
    force = false
  ) => {
    try {
      loading.value = true
      // 查詢鍵已包含日期，切換日期自然命中不同快取，不需手動清除服務層快取
      currentDate.value = date

      // 並行載入所有資料
      await Promise.allSettled([
        loadLunarData(date, force),
        userProfile
          ? loadIntegratedFortune(userProfile, date, force).catch((error: unknown) => {
              // 如果整合運勢載入失敗，不影響其他資料的使用
              const errorMessage = error instanceof Error ? error.message : String(error)
              console.warn('整合運勢載入失敗，將僅使用農民曆資料:', errorMessage)
            })
          : Promise.resolve(),
        loadETFData(force).catch((error: unknown) => {
          // ETF資料載入失敗也不影響其他功能
          const errorMessage = error instanceof Error ? error.message : String(error)
          console.warn('ETF資料載入失敗:', errorMessage)
        }),
      ])
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('載入資料失敗:', errorMessage)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 重新整理資料：略過 staleTime 強制重新抓取
  const refreshData = async (userProfile: UserProfileCompat | null = null) => {
    return loadAllData(userProfile, currentDate.value, true)
  }

  // 使所有運勢查詢失效（例如命理引擎設定變更後）
  const invalidateFortune = () => queryCache.invalidateQueries({ key: queryKeys.fortune.root })

  // 設置日期並重新載入資料
  const setDateAndReload = async (userProfile: UserProfileCompat | null, date: Date) => {
    currentDate.value = date
    return loadAllData(userProfile, date)
  }

  // 清除所有資料
  const clearAllData = () => {
    lunarData.value = null
    integratedFortune.value = null
    investmentAdvice.value = null
    requestSeq.etf++
    etfSnapshot.value = null
    etfStatus.value = 'idle'
    etfLoading.value = false
    selectedMarketRange = undefined
    clearAllErrors()
  }

  // 清除所有錯誤狀態
  const clearAllErrors = () => {
    lunarError.value = null
    fortuneError.value = null
    etfError.value = null
  }

  // 重試載入整合運勢
  const retryIntegratedFortune = (userProfile: UserProfileCompat | null) => {
    return userProfile
      ? loadIntegratedFortune(userProfile, currentDate.value, true)
      : Promise.reject('無用戶資料')
  }

  // 重試目前選取的行情期間；相對期間重新以臺灣今日日期為終點。
  const retryETFData = () => {
    if (!selectedMarketRange) return loadETFData(true)
    const { lookbackDays } = selectedMarketRange
    const { startDate, endDate } =
      lookbackDays === undefined ? selectedMarketRange : dateRangeFromToday(lookbackDays)
    return loadETFRange(startDate, endDate, true, lookbackDays)
  }

  return {
    // 狀態
    lunarData,
    integratedFortune,
    investmentAdvice,
    etfData,
    etfStatus,
    etfProvenance,
    currentDate,
    loading,
    lunarLoading,
    fortuneLoading,
    etfLoading,
    lunarError,
    fortuneError,
    etfError,

    // 計算屬性
    unifiedInvestmentScore,
    formattedCurrentDate,
    latestPrice,
    priceChange,
    priceChangePercent,
    priceChangeColor,

    // 方法
    loadLunarData,
    loadIntegratedFortune,
    loadETFData,
    loadETFRange,
    loadAllData,
    invalidateFortune,
    refreshData,
    setDateAndReload,
    clearAllData,
    clearAllErrors,
    retryIntegratedFortune,
    retryETFData,

    // 工具函數 (re-export)
    formatDate,
    formatVolume,
  }
})
