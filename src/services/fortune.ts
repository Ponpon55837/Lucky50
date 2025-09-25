// @ts-ignore
import { Solar } from 'lunar-javascript'
import { UserProfile, FortuneData } from '../types'

export class FortuneService {
  /**
   * 創建基於日期和用戶資料的種子
   */
  private static createSeed(date: Date, profile: UserProfile): number {
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '')
    const profileStr = profile.name + profile.birthDate.replace(/-/g, '') + profile.birthTime.replace(':', '')
    
    // 創建一個簡單的雜湊
    let seed = 0
    const combined = dateStr + profileStr
    for (let i = 0; i < combined.length; i++) {
      seed = ((seed << 5) - seed + combined.charCodeAt(i)) & 0xffffffff
    }
    return Math.abs(seed)
  }

  /**
   * 基於種子的隨機數生成器 (Seeded Random)
   */
  private static seededRandom(seed: number): () => number {
    let state = seed
    return () => {
      state = (state * 9301 + 49297) % 233280
      return state / 233280
    }
  }

  /**
   * 計算每日運勢
   */
  static calculateDailyFortune(profile: UserProfile, date: Date): FortuneData {
    const lunar = Solar.fromDate(date).getLunar()

    // 創建基於日期和用戶資料的種子
    const seed = this.createSeed(date, profile)

    // 計算五行相生相剋
    const elements = this.calculateElements(lunar, seed)
    
    // 計算總體運勢分數
    const overallScore = this.calculateOverallScore(elements)
    
    // 計算投資運勢
    const investmentScore = this.calculateInvestmentScore(elements, profile, seed)
    
    // 生成投資建議
    const recommendation = this.generateRecommendation(investmentScore, overallScore)
    
    return {
      date: date.toISOString().split('T')[0],
      overallScore: Math.round(overallScore),
      investmentScore: Math.round(investmentScore),
      recommendation,
      advice: this.generateAdvice(investmentScore),
      luckyTime: this.calculateLuckyTime(seed),
      avoidTime: this.calculateAvoidTime(seed),
      elements
    }
  }

  /**
   * 計算五行能量
   */
  private static calculateElements(lunar: any, seed: number) {
    // 獲取日期的天干地支
    const dayGan = lunar.getDayGan()
    const dayZhi = lunar.getDayZhi()
    const monthGan = lunar.getMonthGan()
    const monthZhi = lunar.getMonthZhi()

    // 創建基於種子的隨機數生成器
    const random = this.seededRandom(seed)

    // 五行基礎值
    const baseValues = {
      metal: 50,
      wood: 50,
      water: 50,
      fire: 50,
      earth: 50
    }

    // 根據天干地支調整五行
    const ganModifiers: { [key: string]: { [key: string]: number } } = {
      '甲': { wood: 20 }, '乙': { wood: 15 },
      '丙': { fire: 20 }, '丁': { fire: 15 },
      '戊': { earth: 20 }, '己': { earth: 15 },
      '庚': { metal: 20 }, '辛': { metal: 15 },
      '壬': { water: 20 }, '癸': { water: 15 }
    }

    const zhiModifiers: { [key: string]: { [key: string]: number } } = {
      '子': { water: 15 }, '午': { fire: 15 },
      '卯': { wood: 15 }, '酉': { metal: 15 },
      '寅': { wood: 10 }, '申': { metal: 10 },
      '巳': { fire: 10 }, '亥': { water: 10 },
      '辰': { earth: 10 }, '戌': { earth: 10 },
      '丑': { earth: 10 }, '未': { earth: 10 }
    }

    // 應用修正值
    Object.entries(ganModifiers[dayGan] || {}).forEach(([element, modifier]) => {
      baseValues[element as keyof typeof baseValues] += modifier
    })

    Object.entries(zhiModifiers[dayZhi] || {}).forEach(([element, modifier]) => {
      baseValues[element as keyof typeof baseValues] += modifier
    })

    Object.entries(ganModifiers[monthGan] || {}).forEach(([element, modifier]) => {
      baseValues[element as keyof typeof baseValues] += modifier * 0.5
    })

    Object.entries(zhiModifiers[monthZhi] || {}).forEach(([element, modifier]) => {
      baseValues[element as keyof typeof baseValues] += modifier * 0.5
    })

    // 使用固定種子的隨機波動（±10）
    const result = {
      metal: Math.round(Math.max(10, Math.min(100, baseValues.metal + (random() - 0.5) * 20))),
      wood: Math.round(Math.max(10, Math.min(100, baseValues.wood + (random() - 0.5) * 20))),
      water: Math.round(Math.max(10, Math.min(100, baseValues.water + (random() - 0.5) * 20))),
      fire: Math.round(Math.max(10, Math.min(100, baseValues.fire + (random() - 0.5) * 20))),
      earth: Math.round(Math.max(10, Math.min(100, baseValues.earth + (random() - 0.5) * 20)))
    }

    return result
  }

    /**
   * 計算總體運勢分數
   */
  private static calculateOverallScore(elements: { metal: number, wood: number, water: number, fire: number, earth: number }): number {
    // 計算五行平衡度
    const values = [elements.metal, elements.wood, elements.water, elements.fire, elements.earth]
    const total = values.reduce((a: number, b: number) => a + b, 0)
    const average = total / 5
    const variance = values.reduce((acc: number, val: number) => 
      acc + Math.pow(val - average, 2), 0) / 5

    // 平衡度越低分數越高（方差越小越好）
    const balanceScore = Math.max(0, 100 - variance)
    
    // 平均值影響（接近65分最佳）
    const averageScore = 100 - Math.abs(average - 65)
    
    return (balanceScore + averageScore) / 2
  }

  /**
   * 計算投資運勢
   */
  private static calculateInvestmentScore(elements: any, profile: UserProfile, seed: number): number {
    // 根據個人生肖和五行計算投資運勢
    let score = this.calculateOverallScore(elements)
    
    // 根據生肖調整
    const zodiacBonus = this.getZodiacInvestmentBonus(profile.zodiac)
    score += zodiacBonus
    
    // 使用固定種子添加一些隨機性
    const random = this.seededRandom(seed + 1000) // 不同的種子偏移
    const randomBonus = (random() - 0.5) * 10 // ±5分的隨機調整
    score += randomBonus
    
    return Math.round(Math.max(0, Math.min(100, score)))
  }

  /**
   * 生成投資建議
   */
  private static generateRecommendation(investmentScore: number, overallScore: number): 'BUY' | 'HOLD' | 'SELL' {
    const combinedScore = (investmentScore + overallScore) / 2
    
    if (combinedScore >= 70) return 'BUY'
    if (combinedScore >= 40) return 'HOLD'
    return 'SELL'
  }

  /**
   * 生成投資建議文字
   */
  private static generateAdvice(investmentScore: number): string {
    if (investmentScore >= 80) {
      return '今日財運亨通，適合積極投資。建議在台股開盤時段（09:00-13:30）把握進場機會。'
    } else if (investmentScore >= 60) {
      return '今日運勢平穩，可考慮適量投資。建議觀察台股開盤後走勢再決定進場時機。'
    } else if (investmentScore >= 40) {
      return '今日運勢一般，建議保持觀望。如有台股持倉建議持有，避免盤中頻繁交易。'
    } else {
      return '今日運勢較弱，不宜投資。建議等待台股收盤後檢視，尋找更好的進場時機。'
    }
  }

  /**
   * 計算幸運時辰（台股交易時間 09:00-13:30）
   */
  private static calculateLuckyTime(seed: number): string {
    // 台股交易時間內的推薦買入時間點
    const tradingTimes = [
      '開盤時段(09:00-09:30)', '早盤時段(09:30-10:30)', 
      '上午中段(10:30-11:30)', '午前時段(11:30-12:30)',
      '收盤前段(12:30-13:00)', '尾盤時段(13:00-13:30)'
    ]
    
    const random = this.seededRandom(seed + 2000)
    return tradingTimes[Math.floor(random() * tradingTimes.length)]
  }

  /**
   * 計算不宜時辰（台股交易時間內避免交易的時段）
   */
  private static calculateAvoidTime(seed: number): string {
    // 台股交易時間內相對不宜交易的時間點
    const avoidTimes = [
      '開盤波動(09:00-09:15)', '午前震盪(11:45-12:15)', 
      '尾盤急殺(13:15-13:30)', '早盤追高(09:15-09:45)',
      '中段整理(10:45-11:15)', '收盤恐慌(13:00-13:30)'
    ]
    
    const random = this.seededRandom(seed + 3000)
    return avoidTimes[Math.floor(random() * avoidTimes.length)]
  }

  /**
   * 獲取生肖投資加成
   */
  private static getZodiacInvestmentBonus(zodiac: string): number {
    const bonusMap: { [key: string]: number } = {
      '鼠': 5, '牛': 8, '虎': 3, '兔': 6,
      '龍': 10, '蛇': 7, '馬': 4, '羊': 2,
      '猴': 9, '雞': 6, '狗': 5, '豬': 8
    }
    
    return bonusMap[zodiac] || 0
  }
}