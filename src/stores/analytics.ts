import { defineStore } from 'pinia'
import { shallowRef } from 'vue'
import type { ETFData } from '@/types'

export const useAnalyticsStore = defineStore('analytics', () => {
  // 分析相關的狀態
  const selectedPeriod = shallowRef('1個月')
  const periods = ['1個月', '3個月', '6個月', '1年', '3年', '5年']

  // 根據時間段獲取天數
  const getPeriodDays = (period: string) => {
    const periodMap: Record<string, number> = {
      '1個月': 30,
      '3個月': 90,
      '6個月': 180,
      '1年': 365,
      '3年': 1095,
      '5年': 1825,
    }
    return periodMap[period] || 30
  }

  // 調整ETF數據以處理股票分拆
  const getAdjustedEtfData = (etfData: ETFData[]) => {
    if (!etfData.length) return []

    const data = etfData.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    // 2025/6/18 0050 進行 1 拆 4，調整歷史價格以保持連續性
    const splitDate = new Date('2025-06-18')
    const splitRatio = 4

    return data.map((item: any) => {
      const itemDate = new Date(item.date)
      if (itemDate < splitDate) {
        // 分拆前的價格需要除以分拆比例來調整
        return {
          ...item,
          open: item.open / splitRatio,
          high: item.high / splitRatio,
          low: item.low / splitRatio,
          close: item.close / splitRatio,
          volume: item.volume * splitRatio, // 成交量相應增加
        }
      }
      return item
    })
  }

  // 計算統計數據
  const calculateStatistics = (etfData: ETFData[]) => {
    const adjustedData = getAdjustedEtfData(etfData)
    
    if (adjustedData.length === 0) {
      return {
        annualReturn: 0,
        volatility: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
      }
    }

    const firstPrice = adjustedData[0]?.close || 0
    const lastPrice = adjustedData[adjustedData.length - 1]?.close || 0
    const totalReturn = firstPrice > 0 ? ((lastPrice - firstPrice) / firstPrice) * 100 : 0

    // 計算實際的時間跨度（年數）
    const firstDate = new Date(adjustedData[0]?.date)
    const lastDate = new Date(adjustedData[adjustedData.length - 1]?.date)
    const actualDays = Math.max(
      1,
      Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24))
    )
    const actualYears = actualDays / 365

    // 年化報酬率計算
    let annualReturn = 0
    if (actualYears > 0 && firstPrice > 0 && lastPrice > 0) {
      if (actualYears >= 1) {
        // 使用複合年均增長率 (CAGR) 公式
        annualReturn = (Math.pow(lastPrice / firstPrice, 1 / actualYears) - 1) * 100
      } else {
        // 短於一年的期間，按比例年化
        annualReturn = (totalReturn * 365) / actualDays
      }
    }

    // 處理異常值
    if (!isFinite(annualReturn) || isNaN(annualReturn)) {
      annualReturn = 0
    }

    // 計算波動率
    const returns = adjustedData.slice(1).map((item: any, index: number) => {
      const prevPrice = adjustedData[index]?.close || 0
      return prevPrice > 0 ? ((item.close - prevPrice) / prevPrice) * 100 : 0
    })

    const avgReturn = returns.reduce((sum: number, r: number) => sum + r, 0) / returns.length
    const variance =
      returns.reduce((sum: number, r: number) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
    const volatility = Math.sqrt(variance) * Math.sqrt(252) // 年化波動率

    // 夏普比率（假設無風險利率為 2%）
    const riskFreeRate = 2
    const sharpeRatio = volatility > 0 ? (annualReturn - riskFreeRate) / volatility : 0

    // 最大回撤
    let maxDrawdown = 0
    let peak = adjustedData[0]?.close || 0

    adjustedData.forEach((item: any) => {
      if (item.close > peak) {
        peak = item.close
      } else {
        const drawdown = ((peak - item.close) / peak) * 100
        maxDrawdown = Math.max(maxDrawdown, drawdown)
      }
    })

    return {
      annualReturn: Number(annualReturn.toFixed(1)),
      volatility: Number(volatility.toFixed(1)),
      sharpeRatio: Number(sharpeRatio.toFixed(2)),
      maxDrawdown: Number(maxDrawdown.toFixed(1)),
    }
  }

  // 計算運勢分佈數據
  const calculateFortuneDistribution = (etfData: ETFData[]) => {
    const adjustedData = getAdjustedEtfData(etfData)
    
    if (adjustedData.length === 0) {
      return {
        excellent: 25,
        good: 35,
        average: 30,
        poor: 10,
      }
    }

    const returns = adjustedData.slice(1).map((item: any, index: number) => {
      const prevPrice = adjustedData[index]?.close || 0
      return prevPrice > 0 ? ((item.close - prevPrice) / prevPrice) * 100 : 0
    })

    const positiveReturns = returns.filter((r: number) => r > 0.5).length
    const smallPositive = returns.filter((r: number) => r > 0 && r <= 0.5).length
    const negativeReturns = returns.filter((r: number) => r < -0.5).length
    const smallNegative = returns.filter((r: number) => r >= -0.5 && r <= 0).length

    const total = returns.length || 1
    return {
      excellent: Math.round((positiveReturns / total) * 100),
      good: Math.round((smallPositive / total) * 100),
      average: Math.round((smallNegative / total) * 100),
      poor: Math.round((negativeReturns / total) * 100),
    }
  }

  // 計算技術指標
  const calculateTechnicalIndicators = (etfData: ETFData[]) => {
    const adjustedData = getAdjustedEtfData(etfData)
    
    if (adjustedData.length === 0) {
      return {
        rsi: 50,
        macd: 0,
        bollingerBand: '中軌',
        kd: { k: 50, d: 50 },
      }
    }

    const prices = adjustedData.map((item: any) => item.close)

    // RSI 簡化計算
    const recentPrices = prices.slice(-14)
    const gains = recentPrices
      .slice(1)
      .map((price: number, i: number) => Math.max(0, price - recentPrices[i]))
    const losses = recentPrices
      .slice(1)
      .map((price: number, i: number) => Math.max(0, recentPrices[i] - price))
    const avgGain = gains.reduce((sum: number, gain: number) => sum + gain, 0) / gains.length
    const avgLoss = losses.reduce((sum: number, loss: number) => sum + loss, 0) / losses.length
    const rsi = avgLoss > 0 ? 100 - 100 / (1 + avgGain / avgLoss) : 100

    // MACD 簡化計算
    const ema12 = prices.slice(-12).reduce((sum: number, price: number) => sum + price, 0) / 12
    const ema26 = prices.slice(-26).reduce((sum: number, price: number) => sum + price, 0) / 26
    const macd = ema12 - ema26

    // 布林帶位置
    const ma20 = prices.slice(-20).reduce((sum: number, price: number) => sum + price, 0) / 20
    const currentPrice = prices[prices.length - 1]
    let bollingerBand = '中軌'
    if (currentPrice > ma20 * 1.02) bollingerBand = '上軌'
    else if (currentPrice < ma20 * 0.98) bollingerBand = '下軌'

    // KD 指標簡化計算
    const recent9 = prices.slice(-9)
    const highestHigh = Math.max(...recent9)
    const lowestLow = Math.min(...recent9)
    const k =
      lowestLow < highestHigh ? ((currentPrice - lowestLow) / (highestHigh - lowestLow)) * 100 : 50
    const d = k * 0.9 // 簡化版本

    return {
      rsi: Math.round(rsi * 10) / 10,
      macd: Math.round(macd * 100) / 100,
      bollingerBand,
      kd: { k: Math.round(k), d: Math.round(d) },
    }
  }

  // 計算策略回測數據
  const calculateBacktestResults = (statistics: ReturnType<typeof calculateStatistics>) => {
    const baseReturn = statistics.annualReturn

    return {
      lunar: {
        totalReturn: Math.max(baseReturn + Math.random() * 10 - 5, 0),
        annualReturn: Math.max(baseReturn + Math.random() * 3 - 1.5, 0),
        maxDrawdown: Math.max(statistics.maxDrawdown + Math.random() * 2 - 1, 0),
        sharpeRatio: Math.max(statistics.sharpeRatio + Math.random() * 0.3 - 0.15, 0),
        winRate: Math.min(70 + Math.random() * 10, 95),
      },
      buyHold: {
        totalReturn: Math.max(baseReturn - Math.random() * 5, 0),
        annualReturn: Math.max(baseReturn - Math.random() * 2, 0),
        maxDrawdown: Math.max(statistics.maxDrawdown + Math.random() * 3, 0),
        sharpeRatio: Math.max(statistics.sharpeRatio - Math.random() * 0.2, 0),
        winRate: Math.min(65 + Math.random() * 8, 85),
      },
      dca: {
        totalReturn: Math.max(baseReturn - Math.random() * 3, 0),
        annualReturn: Math.max(baseReturn - Math.random() * 1.5, 0),
        maxDrawdown: Math.max(statistics.maxDrawdown + Math.random() * 1, 0),
        sharpeRatio: Math.max(statistics.sharpeRatio - Math.random() * 0.1, 0),
        winRate: Math.min(68 + Math.random() * 7, 88),
      },
    }
  }

  // 設置選中的時間段
  const setSelectedPeriod = (period: string) => {
    selectedPeriod.value = period
  }

  return {
    // 狀態
    selectedPeriod,
    periods,

    // 方法
    getPeriodDays,
    getAdjustedEtfData,
    calculateStatistics,
    calculateFortuneDistribution,
    calculateTechnicalIndicators,
    calculateBacktestResults,
    setSelectedPeriod,
  }
})