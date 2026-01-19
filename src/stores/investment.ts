import { defineStore } from 'pinia'
import { ref, computed, shallowRef } from 'vue'
import type { FortuneData, ETFData, InvestmentRecommendation } from '@/types'

export const useInvestmentStore = defineStore('investment', () => {
  // 使用 shallowRef 提高大數組的性能
  const etfData = shallowRef<ETFData[]>([])
  const currentFortune = shallowRef<FortuneData | null>(null)
  const recommendation = shallowRef<InvestmentRecommendation | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 優化的計算屬性，使用緩存避免重複計算
  const latestPrice = computed(() => {
    const data = etfData.value
    return data.length > 0 ? data[data.length - 1] : null
  })

  // 使用緩存的價格變化計算
  const priceMetrics = computed(() => {
    const data = etfData.value
    if (data.length < 2) {
      return { change: 0, changePercent: 0 }
    }

    const latest = data[data.length - 1]
    const previous = data[data.length - 2]
    const change = latest.close - previous.close
    const changePercent = (change / previous.close) * 100

    return { change, changePercent }
  })

  const priceChange = computed(() => priceMetrics.value.change)
  const priceChangePercent = computed(() => priceMetrics.value.changePercent)

  // 批量數據操作方法
  const setETFData = (data: ETFData[]) => {
    // 使用淺拷貝觸發響應式更新
    etfData.value = [...data]
    error.value = null
  }

  const addETFData = (data: ETFData) => {
    etfData.value = [...etfData.value, data]
  }

  // 批量添加數據
  const addMultipleETFData = (data: ETFData[]) => {
    etfData.value = [...etfData.value, ...data]
  }

  // 清除舊數據並設置新數據（性能優化）
  const replaceETFData = (data: ETFData[]) => {
    etfData.value = data
    error.value = null
  }

  const setFortune = (fortune: FortuneData) => {
    currentFortune.value = fortune
  }

  const setRecommendation = (rec: InvestmentRecommendation) => {
    recommendation.value = rec
  }

  const setLoading = (state: boolean) => {
    loading.value = state
  }

  const setError = (message: string | null) => {
    error.value = message
  }

  // 清除所有數據
  const clearData = () => {
    etfData.value = []
    currentFortune.value = null
    recommendation.value = null
    error.value = null
  }

  // 數據統計方法
  const getDataStats = () => {
    return {
      totalRecords: etfData.value.length,
      hasData: etfData.value.length > 0,
      latestDate: latestPrice.value?.date || null,
      priceRange:
        etfData.value.length > 0
          ? {
              min: Math.min(
                ...etfData.value
                  .map(d => d.low)
                  .filter((v): v is number => typeof v === 'number' && !isNaN(v))
              ),
              max: Math.max(
                ...etfData.value
                  .map(d => d.high)
                  .filter((v): v is number => typeof v === 'number' && !isNaN(v))
              ),
            }
          : null,
    }
  }

  return {
    // State
    etfData,
    currentFortune,
    recommendation,
    loading,
    error,

    // Computed
    latestPrice,
    priceChange,
    priceChangePercent,

    // Actions
    setETFData,
    addETFData,
    addMultipleETFData,
    replaceETFData,
    setFortune,
    setRecommendation,
    setLoading,
    setError,
    clearData,
    getDataStats,
  }
})
