import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { FortuneData, ETFData, InvestmentRecommendation } from '@/types'

export const useInvestmentStore = defineStore('investment', () => {
  const etfData = ref<ETFData[]>([])
  const currentFortune = ref<FortuneData | null>(null)
  const recommendation = ref<InvestmentRecommendation | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const latestPrice = computed(() => {
    return etfData.value[etfData.value.length - 1] || null
  })

  const priceChange = computed(() => {
    if (etfData.value.length < 2) return 0
    const latest = etfData.value[etfData.value.length - 1]
    const previous = etfData.value[etfData.value.length - 2]
    return latest.close - previous.close
  })

  const priceChangePercent = computed(() => {
    if (etfData.value.length < 2) return 0
    const latest = etfData.value[etfData.value.length - 1]
    const previous = etfData.value[etfData.value.length - 2]
    return ((latest.close - previous.close) / previous.close) * 100
  })

  const setETFData = (data: ETFData[]) => {
    etfData.value = data
  }

  const addETFData = (data: ETFData) => {
    etfData.value.push(data)
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

  return {
    etfData,
    currentFortune,
    recommendation,
    loading,
    error,
    latestPrice,
    priceChange,
    priceChangePercent,
    setETFData,
    addETFData,
    setFortune,
    setRecommendation,
    setLoading,
    setError
  }
})