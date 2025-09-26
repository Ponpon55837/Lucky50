import { defineStore } from 'pinia'
import { ref, computed, shallowRef } from 'vue'
import { lunarService } from '@/services/lunar'
import { IntegratedFortuneService } from '@/services/integratedFortune'
import { FinMindService } from '@/services/finmind'
import { useUserStore } from '@/stores/user'
import type { LunarData, InvestmentAdvice } from '@/services/lunar'
import type { IntegratedFortuneData, UserProfileCompat } from '@/services/integratedFortune'
import type { ETFData } from '@/types'

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
  // ===== 狀態 =====
  
  // 農民曆相關狀態
  const lunarData = shallowRef<LunarData | null>(null)
  const investmentAdvice = shallowRef<InvestmentAdvice | null>(null)
  
  // 整合運勢狀態
  const integratedFortune = shallowRef<IntegratedFortuneData | null>(null)
  
  // ETF資料狀態
  const etfData = shallowRef<ETFData[]>([])
  
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
    if (etfData.value.length === 0) return null
    return etfData.value[etfData.value.length - 1]
  })

  // 價格變化
  const priceChange = computed(() => {
    if (etfData.value.length < 2) return 0
    const current = etfData.value[etfData.value.length - 1]
    const previous = etfData.value[etfData.value.length - 2]
    return current.close - previous.close
  })

  // 價格變化百分比
  const priceChangePercent = computed(() => {
    if (etfData.value.length < 2) return 0
    const current = etfData.value[etfData.value.length - 1]
    const previous = etfData.value[etfData.value.length - 2]
    return ((current.close - previous.close) / previous.close) * 100
  })

  // 價格變化顏色
  const priceChangeColor = computed(() => {
    const change = priceChange.value
    return change > 0 ? 'text-green-400' : change < 0 ? 'text-red-400' : 'text-gray-400'
  })

  // ===== 方法 =====

  // 載入農民曆資料
  const loadLunarData = async (date: Date = new Date()) => {
    try {
      lunarLoading.value = true
      lunarError.value = null
      currentDate.value = date

      console.log('DashboardStore - 載入農民曆資料，日期:', date.toLocaleDateString('zh-TW'))
      
      // 載入農民曆資料
      lunarData.value = lunarService.getLunarData(date)
      
      // 載入投資建議
      investmentAdvice.value = lunarService.getInvestmentAdvice(date)

      console.log('DashboardStore - 農民曆資料載入完成')
    } catch (error) {
      console.error('載入農民曆資料失敗:', error)
      lunarError.value = '載入農民曆資料失敗'
      throw error
    } finally {
      lunarLoading.value = false
    }
  }

  // 載入整合運勢資料
  const loadIntegratedFortune = async (date: Date = new Date()) => {
    const userStore = useUserStore()
    
    if (!userStore.profile) {
      fortuneError.value = '請先設定個人資料'
      throw new Error('使用者資料不存在')
    }

    try {
      fortuneLoading.value = true
      fortuneError.value = null
      currentDate.value = date

      console.log('DashboardStore - 載入整合運勢資料，日期:', date.toLocaleDateString('zh-TW'))

      // 轉換用戶資料格式以符合新介面
      const profileCompat: UserProfileCompat = {
        name: userStore.profile.name,
        birthDate: userStore.profile.birthDate,
        birthTime: userStore.profile.birthTime || '12:00',
        zodiac: userStore.profile.zodiac,
        element: userStore.profile.element,
        luckyColors: [...userStore.profile.luckyColors],
        luckyNumbers: [...userStore.profile.luckyNumbers],
      }

      integratedFortune.value = await IntegratedFortuneService.calculateIntegratedFortune(
        profileCompat,
        date
      )

      console.log('DashboardStore - 整合運勢資料載入完成，投資分數:', integratedFortune.value.investmentScore)
    } catch (error) {
      console.error('載入整合運勢資料失敗:', error)
      fortuneError.value = '載入運勢資料失敗'
      throw error
    } finally {
      fortuneLoading.value = false
    }
  }

  // 載入ETF資料
  const loadETFData = async () => {
    try {
      etfLoading.value = true
      etfError.value = null

      console.log('DashboardStore - 開始載入ETF資料')

      // 檢查API狀態
      const apiStatus = await FinMindService.checkAPIStatus()
      if (!apiStatus) {
        console.warn('FinMind API 無法連接，將使用備用數據')
      }

      // 計算日期範圍
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      try {
        const data = await FinMindService.getETFData(startDate, endDate)
        console.log('DashboardStore - 成功載入 ETF 資料:', data.length, '筆')
        
        if (data.length > 0) {
          console.log('DashboardStore - 第一筆資料:', data[0])
          console.log('DashboardStore - 最後一筆資料:', data[data.length - 1])
          etfData.value = data
        } else {
          throw new Error('沒有獲得ETF資料')
        }
      } catch (apiError) {
        console.error('ETF 數據載入失敗:', apiError)
        etfError.value = '無法載入ETF資料，使用測試數據'
        
        // 使用測試數據
        const testData: ETFData[] = [
          {
            date: '2024-01-15',
            open: 132.0,
            high: 134.0,
            low: 131.0,
            close: 133.5,
            volume: 25000000,
            change: 1.5,
            changePercent: 1.13,
          },
          {
            date: '2024-01-16',
            open: 133.5,
            high: 135.0,
            low: 132.8,
            close: 134.2,
            volume: 28000000,
            change: 0.7,
            changePercent: 0.52,
          },
          {
            date: '2024-01-17',
            open: 134.2,
            high: 134.8,
            low: 133.0,
            close: 133.8,
            volume: 22000000,
            change: -0.4,
            changePercent: -0.3,
          },
        ]
        console.log('DashboardStore - 使用測試數據:', testData)
        etfData.value = testData
      }

    } catch (error) {
      console.error('載入ETF資料失敗:', error)
      etfError.value = '載入ETF資料失敗'
      throw error
    } finally {
      etfLoading.value = false
    }
  }

  // 載入所有資料
  const loadAllData = async (date: Date = new Date()) => {
    try {
      loading.value = true
      
      // 清除快取
      lunarService.clearCache()
      IntegratedFortuneService.clearCache()

      console.log('DashboardStore - 開始載入所有資料')

      // 載入用戶資料
      const userStore = useUserStore()
      userStore.loadProfile()

      // 並行載入所有資料
      await Promise.allSettled([
        loadLunarData(date),
        loadIntegratedFortune(date).catch(error => {
          // 如果整合運勢載入失敗，不影響其他資料的使用
          console.warn('整合運勢載入失敗，將僅使用農民曆資料:', error)
        }),
        loadETFData().catch(error => {
          // ETF資料載入失敗也不影響其他功能
          console.warn('ETF資料載入失敗:', error)
        })
      ])

      console.log('DashboardStore - 所有資料載入完成')
    } catch (error) {
      console.error('載入資料失敗:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 重新整理資料
  const refreshData = async () => {
    return loadAllData(currentDate.value)
  }

  // 設置日期並重新載入資料
  const setDateAndReload = async (date: Date) => {
    currentDate.value = date
    return loadAllData(date)
  }

  // 設置ETF資料 (兼容舊的investment store)
  const setETFData = (data: ETFData[]) => {
    etfData.value = data
    console.log('DashboardStore - ETF資料已設置:', data.length, '筆')
  }

  // 清除所有資料
  const clearAllData = () => {
    lunarData.value = null
    integratedFortune.value = null
    investmentAdvice.value = null
    etfData.value = []
    clearAllErrors()
  }

  // 清除所有錯誤狀態
  const clearAllErrors = () => {
    lunarError.value = null
    fortuneError.value = null
    etfError.value = null
  }

  // 重試載入整合運勢
  const retryIntegratedFortune = () => {
    return loadIntegratedFortune(currentDate.value)
  }

  // 重試載入ETF資料
  const retryETFData = () => {
    return loadETFData()
  }

  return {
    // 狀態
    lunarData,
    integratedFortune,
    investmentAdvice,
    etfData,
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
    loadAllData,
    refreshData,
    setDateAndReload,
    setETFData,
    clearAllData,
    clearAllErrors,
    retryIntegratedFortune,
    retryETFData,

    // 工具函數 (re-export)
    formatDate,
    formatVolume,
  }
})