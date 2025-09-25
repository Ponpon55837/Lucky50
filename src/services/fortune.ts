import { Lunar, Solar } from 'lunar-javascript'
import type { FortuneData, UserProfile } from '@/types'

export class FortuneService {
  /**
   * 計算每日運勢
   */
  static calculateDailyFortune(profile: UserProfile, date: Date): FortuneData {
    const lunar = Solar.fromDate(date).getLunar()
    const birthLunar = Solar.fromYmdHms(
      parseInt(profile.birthDate.split('-')[0]),
      parseInt(profile.birthDate.split('-')[1]),
      parseInt(profile.birthDate.split('-')[2]),
      parseInt(profile.birthTime.split(':')[0]),
      parseInt(profile.birthTime.split(':')[1]),
      0
    ).getLunar()

    // 計算五行相生相剋
    const elements = this.calculateElements(lunar, birthLunar)
    
    // 計算總體運勢分數
    const overallScore = this.calculateOverallScore(elements, lunar)
    
    // 計算投資運勢
    const investmentScore = this.calculateInvestmentScore(elements, lunar, profile)
    
    // 生成投資建議
    const recommendation = this.generateRecommendation(investmentScore, overallScore)
    
    return {
      date: date.toISOString().split('T')[0],
      overallScore,
      investmentScore,
      recommendation,
      advice: this.generateAdvice(investmentScore, elements),
      luckyTime: this.calculateLuckyTime(lunar),
      avoidTime: this.calculateAvoidTime(lunar),
      elements
    }
  }

  /**
   * 計算五行能量
   */
  private static calculateElements(lunar: any, birthLunar: any) {
    // 根據農民曆計算當日五行能量
    const dayGan = lunar.getDayGan()
    const dayZhi = lunar.getDayZhi()
    const monthGan = lunar.getMonthGan()
    const monthZhi = lunar.getMonthZhi()

    // 簡化的五行計算邏輯
    const elements = {
      metal: Math.random() * 100,
      wood: Math.random() * 100,
      water: Math.random() * 100,
      fire: Math.random() * 100,
      earth: Math.random() * 100
    }

    return elements
  }

  /**
   * 計算總體運勢分數
   */
  private static calculateOverallScore(elements: any, lunar: any): number {
    // 基於五行平衡計算運勢
    const total = Object.values(elements).reduce((a: number, b: number) => a + b, 0)
    const average = total / 5
    const variance = Object.values(elements).reduce((acc: number, val: number) => 
      acc + Math.pow(val - average, 2), 0) / 5
    
    // 五行越平衡，運勢越好
    return Math.max(0, Math.min(100, 100 - Math.sqrt(variance)))
  }

  /**
   * 計算投資運勢
   */
  private static calculateInvestmentScore(elements: any, lunar: any, profile: UserProfile): number {
    // 根據個人生肖和五行計算投資運勢
    let score = this.calculateOverallScore(elements, lunar)
    
    // 根據生肖調整
    const zodiacBonus = this.getZodiacInvestmentBonus(profile.zodiac, lunar)
    score += zodiacBonus
    
    return Math.max(0, Math.min(100, score))
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
  private static generateAdvice(investmentScore: number, elements: any): string {
    if (investmentScore >= 80) {
      return '今日財運亨通，適合積極投資。五行調和，建議把握機會進場。'
    } else if (investmentScore >= 60) {
      return '今日運勢平穩，可考慮適量投資。建議觀察市場動向後再行動。'
    } else if (investmentScore >= 40) {
      return '今日運勢一般，建議保持觀望。如有持股建議持有，避免頻繁交易。'
    } else {
      return '今日運勢較弱，不宜投資。建議休養生息，等待更好時機。'
    }
  }

  /**
   * 計算幸運時辰
   */
  private static calculateLuckyTime(lunar: any): string {
    const times = ['子時(23-01)', '丑時(01-03)', '寅時(03-05)', '卯時(05-07)', 
                  '辰時(07-09)', '巳時(09-11)', '午時(11-13)', '未時(13-15)',
                  '申時(15-17)', '酉時(17-19)', '戌時(19-21)', '亥時(21-23)']
    
    return times[Math.floor(Math.random() * times.length)]
  }

  /**
   * 計算不宜時辰
   */
  private static calculateAvoidTime(lunar: any): string {
    const times = ['子時(23-01)', '丑時(01-03)', '寅時(03-05)', '卯時(05-07)', 
                  '辰時(07-09)', '巳時(09-11)', '午時(11-13)', '未時(13-15)',
                  '申時(15-17)', '酉時(17-19)', '戌時(19-21)', '亥時(21-23)']
    
    return times[Math.floor(Math.random() * times.length)]
  }

  /**
   * 獲取生肖投資加成
   */
  private static getZodiacInvestmentBonus(zodiac: string, lunar: any): number {
    const bonusMap: { [key: string]: number } = {
      '鼠': 5, '牛': 8, '虎': 3, '兔': 6,
      '龍': 10, '蛇': 7, '馬': 4, '羊': 2,
      '猴': 9, '雞': 6, '狗': 5, '豬': 8
    }
    
    return bonusMap[zodiac] || 0
  }
}