// @ts-ignore
import { Solar } from 'lunar-javascript'
import { perfMonitor } from '@/utils/performance'
import type { UserProfile, FortuneData } from '@/types'

// 天干地支修正值映射表 - 提取為常數以提高性能
const GAN_MODIFIERS = Object.freeze({
  '甲': { wood: 20 }, '乙': { wood: 15 },
  '丙': { fire: 20 }, '丁': { fire: 15 },
  '戊': { earth: 20 }, '己': { earth: 15 },
  '庚': { metal: 20 }, '辛': { metal: 15 },
  '壬': { water: 20 }, '癸': { water: 15 }
} as const)

const ZHI_MODIFIERS = Object.freeze({
  '子': { water: 15 }, '午': { fire: 15 },
  '卯': { wood: 15 }, '酉': { metal: 15 },
  '寅': { wood: 10 }, '申': { metal: 10 },
  '巳': { fire: 10 }, '亥': { water: 10 },
  '辰': { earth: 10 }, '戌': { earth: 10 },
  '丑': { earth: 10 }, '未': { earth: 10 }
} as const)

// 交易時段常數
const TRADING_TIMES = Object.freeze([
  '開盤時段(09:00-09:30)', '早盤時段(09:30-10:30)', 
  '上午中段(10:30-11:30)', '午前時段(11:30-12:30)',
  '收盤前段(12:30-13:00)', '尾盤時段(13:00-13:30)'
])

const AVOID_TIMES = Object.freeze([
  '開盤波動(09:00-09:15)', '午前震盪(11:45-12:15)', 
  '尾盤急殺(13:15-13:30)', '早盤追高(09:15-09:45)',
  '中段整理(10:45-11:15)', '收盤恐慌(13:00-13:30)'
])

// 生肖投資加成映射表
const ZODIAC_BONUS_MAP = Object.freeze({
  '鼠': 5, '牛': 8, '虎': 3, '兔': 6,
  '龍': 10, '蛇': 7, '馬': 4, '羊': 2,
  '猴': 9, '雞': 6, '狗': 5, '豬': 8
} as const)

// 線性同餘發生器參數 - 更好的隨機性
const LCG_A = 1664525
const LCG_C = 1013904223
const LCG_M = 2 ** 32

export class FortuneService {
  // 緩存已計算的運勢數據
  private static fortuneCache = new Map<string, FortuneData>()
  
  /**
   * 獲取緩存鍵
   */
  private static getCacheKey(profile: UserProfile, date: Date): string {
    const dateStr = date.toISOString().split('T')[0]
    return `${profile.name}_${profile.birthDate}_${profile.birthTime}_${dateStr}`
  }

  /**
   * 創建基於日期和用戶資料的種子 - 優化哈希算法
   */
  private static createSeed(date: Date, profile: UserProfile): number {
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '')
    const profileStr = `${profile.name}${profile.birthDate.replace(/-/g, '')}${profile.birthTime.replace(':', '')}`
    
    // 使用 FNV-1a 哈希算法，比簡單的 string hashing 更好
    let hash = 2166136261
    const combined = dateStr + profileStr
    
    for (let i = 0; i < combined.length; i++) {
      hash ^= combined.charCodeAt(i)
      hash = (hash * 16777619) >>> 0 // 確保32位無符號整數
    }
    
    return hash
  }

  /**
   * 優化的線性同餘生成器
   */
  private static seededRandom(seed: number): () => number {
    let state = seed
    return (): number => {
      state = (LCG_A * state + LCG_C) >>> 0 // 使用無符號右移確保32位
      return state / LCG_M
    }
  }

  /**
   * 計算每日運勢 - 添加緩存機制和性能監控
   */
  static calculateDailyFortune(profile: UserProfile, date: Date): FortuneData {
    return perfMonitor.measureSync('calculateDailyFortune', () => {
      // 檢查緩存
      const cacheKey = this.getCacheKey(profile, date)
      const cached = this.fortuneCache.get(cacheKey)
      if (cached) {
        return cached
      }

      const lunar = Solar.fromDate(date).getLunar()
      const seed = this.createSeed(date, profile)

      // 並行計算各項數據以提高性能
      const elements = perfMonitor.measureSync('calculateElements', () => 
        this.calculateElements(lunar, seed)
      )
      const overallScore = this.calculateOverallScore(elements)
      const investmentScore = this.calculateInvestmentScore(elements, profile, seed)
      const recommendation = this.generateRecommendation(investmentScore, overallScore)
      
      const fortuneData: FortuneData = {
        date: date.toISOString().split('T')[0],
        overallScore: Math.round(overallScore),
        investmentScore: Math.round(investmentScore),
        recommendation,
        advice: this.generateAdvice(investmentScore),
        luckyTime: this.calculateLuckyTime(seed),
        avoidTime: this.calculateAvoidTime(seed),
        elements
      }

      // 緩存結果，限制緩存大小
      if (this.fortuneCache.size >= 100) {
        const iterator = this.fortuneCache.keys()
        const firstKey = iterator.next().value
        if (firstKey) {
          this.fortuneCache.delete(firstKey)
        }
      }
      this.fortuneCache.set(cacheKey, fortuneData)

      return fortuneData
    })
  }

  /**
   * 優化的五行能量計算
   */
  private static calculateElements(lunar: any, seed: number): { metal: number; wood: number; water: number; fire: number; earth: number } {
    const dayGan = lunar.getDayGan()
    const dayZhi = lunar.getDayZhi()
    const monthGan = lunar.getMonthGan()
    const monthZhi = lunar.getMonthZhi()

    const random = this.seededRandom(seed)

    // 使用對象解構和展開語法優化性能
    const baseValues = { metal: 50, wood: 50, water: 50, fire: 50, earth: 50 }

    // 批量應用修正值
    this.applyModifiers(baseValues, GAN_MODIFIERS[dayGan as keyof typeof GAN_MODIFIERS], 1)
    this.applyModifiers(baseValues, ZHI_MODIFIERS[dayZhi as keyof typeof ZHI_MODIFIERS], 1)
    this.applyModifiers(baseValues, GAN_MODIFIERS[monthGan as keyof typeof GAN_MODIFIERS], 0.5)
    this.applyModifiers(baseValues, ZHI_MODIFIERS[monthZhi as keyof typeof ZHI_MODIFIERS], 0.5)

    // 使用函數式編程優化隨機波動計算
    return Object.fromEntries(
      Object.entries(baseValues).map(([element, value]) => [
        element,
        Math.round(Math.max(10, Math.min(100, value + (random() - 0.5) * 20)))
      ])
    ) as { metal: number; wood: number; water: number; fire: number; earth: number }
  }

  /**
   * 應用修正值的輔助方法
   */
  private static applyModifiers(
    baseValues: { [key: string]: number }, 
    modifiers: { [key: string]: number } | undefined, 
    multiplier: number
  ): void {
    if (!modifiers) return
    
    Object.entries(modifiers).forEach(([element, modifier]) => {
      baseValues[element] += modifier * multiplier
    })
  }

  /**
   * 優化的總體運勢分數計算
   */
  private static calculateOverallScore(elements: { metal: number; wood: number; water: number; fire: number; earth: number }): number {
    const values = Object.values(elements)
    const total = values.reduce((sum, val) => sum + val, 0)
    const average = total / values.length
    
    // 使用更高效的方差計算
    const variance = values.reduce((acc, val) => acc + Math.pow(val - average, 2), 0) / values.length

    // 平衡度分數和平均值分數的加權組合
    const balanceScore = Math.max(0, 100 - variance)
    const averageScore = 100 - Math.abs(average - 65)
    
    return (balanceScore + averageScore) * 0.5
  }

  /**
   * 優化的投資運勢計算
   */
  private static calculateInvestmentScore(elements: any, profile: UserProfile, seed: number): number {
    let score = this.calculateOverallScore(elements)
    
    // 使用預計算的生肖加成
    const zodiacBonus = ZODIAC_BONUS_MAP[profile.zodiac as keyof typeof ZODIAC_BONUS_MAP] || 0
    score += zodiacBonus
    
    // 優化隨機調整
    const random = this.seededRandom(seed + 1000)
    const randomBonus = (random() - 0.5) * 10
    score += randomBonus
    
    return Math.max(0, Math.min(100, score))
  }

  /**
   * 快速建議生成
   */
  private static generateRecommendation(investmentScore: number, overallScore: number): 'BUY' | 'HOLD' | 'SELL' {
    const combinedScore = (investmentScore + overallScore) * 0.5
    
    return combinedScore >= 70 ? 'BUY' 
         : combinedScore >= 40 ? 'HOLD' 
         : 'SELL'
  }

  /**
   * 優化的投資建議文字生成
   */
  private static generateAdvice(investmentScore: number): string {
    const adviceMap = {
      high: '今日財運亨通，適合積極投資。建議在台股開盤時段（09:00-13:30）把握進場機會。',
      medium: '今日運勢平穩，可考慮適量投資。建議觀察台股開盤後走勢再決定進場時機。',
      low: '今日運勢一般，建議保持觀望。如有台股持倉建議持有，避免盤中頻繁交易。',
      poor: '今日運勢較弱，不宜投資。建議等待台股收盤後檢視，尋找更好的進場時機。'
    }

    return investmentScore >= 80 ? adviceMap.high
         : investmentScore >= 60 ? adviceMap.medium
         : investmentScore >= 40 ? adviceMap.low
         : adviceMap.poor
  }

  /**
   * 使用預計算時段的幸運時辰計算
   */
  private static calculateLuckyTime(seed: number): string {
    const random = this.seededRandom(seed + 2000)
    return TRADING_TIMES[Math.floor(random() * TRADING_TIMES.length)]
  }

  /**
   * 使用預計算時段的避免時辰計算
   */
  private static calculateAvoidTime(seed: number): string {
    const random = this.seededRandom(seed + 3000)
    return AVOID_TIMES[Math.floor(random() * AVOID_TIMES.length)]
  }

  /**
   * 清理緩存的公共方法
   */
  static clearCache(): void {
    this.fortuneCache.clear()
  }

  /**
   * 獲取緩存狀態
   */
  static getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.fortuneCache.size,
      maxSize: 100
    }
  }
}