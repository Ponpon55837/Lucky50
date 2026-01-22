// @ts-expect-error - lunar-javascript doesn't have TypeScript definitions
import { Solar } from 'lunar-javascript'
import { lunarService } from '@/services/lunar'
import { TaiwanStockService } from './taiwanStock'
import type { LunarData } from '@/services/lunar'
import type { PersonalBaZi, ElementsEnergy } from '@/types'

export interface UserProfileCompat {
  name: string
  birthDate: string
  birthTime: string
  zodiac: string
  element: string
  luckyColors: readonly string[]
  luckyNumbers: readonly number[]
}

// 內部型別定義
interface FortuneScores {
  overallScore: number
  investmentScore: number
  wealthScore: number
  healthScore: number
}

// 整合運勢資料介面
export interface IntegratedFortuneData {
  // 基本資訊
  date: Date
  lunarData: LunarData

  // 個人八字資訊
  personalBaZi: {
    yearGanZhi: string
    monthGanZhi: string
    dayGanZhi: string
    hourGanZhi: string
    zodiac: string
    element: string
    naYin: string
  }

  // 運勢分數
  overallScore: number
  investmentScore: number
  wealthScore: number
  healthScore: number

  // 五行能量分析
  elements: {
    wood: number
    fire: number
    earth: number
    metal: number
    water: number
  }

  // 投資建議
  recommendation: 'BUY' | 'SELL' | 'HOLD' | 'OBSERVE'
  advice: string
  riskLevel: 'low' | 'medium' | 'high'

  // 時間建議（傳統時辰）
  luckyTime: string
  avoidTime: string

  // 台股交易相關
  stockTradingStatus: {
    isOpen: boolean
    status: 'closed' | 'pre_market' | 'trading' | 'post_market'
    message: string
    nextTradingDay?: Date
  }
  bestTradingHours: Array<{ time: string; reason: string }>
  avoidTradingHours: Array<{ time: string; reason: string }>
  tradingDayInfo: {
    isToday: boolean
    tradingDay: Date
  }

  // 方位建議
  luckyDirection: string
  avoidDirection: string

  // 顏色和數字
  luckyColors: string[]
  luckyNumbers: number[]

  // 宜忌事項
  suitable: string[]
  forbidden: string[]

  // 特殊提醒
  warnings: string[]
  opportunities: string[]
}

// 天干地支對五行的影響
const GAN_ELEMENTS = Object.freeze({
  甲: 'wood',
  乙: 'wood',
  丙: 'fire',
  丁: 'fire',
  戊: 'earth',
  己: 'earth',
  庚: 'metal',
  辛: 'metal',
  壬: 'water',
  癸: 'water',
} as const)

const ZHI_ELEMENTS = Object.freeze({
  子: 'water',
  丑: 'earth',
  寅: 'wood',
  卯: 'wood',
  辰: 'earth',
  巳: 'fire',
  午: 'fire',
  未: 'earth',
  申: 'metal',
  酉: 'metal',
  戌: 'earth',
  亥: 'water',
} as const)

// 五行相生相剋關係 (保留供未來使用)
/* eslint-disable @typescript-eslint/no-unused-vars */
const ELEMENT_RELATIONS = Object.freeze({
  wood: { generates: 'fire', destroys: 'earth', generatedBy: 'water', destroyedBy: 'metal' },
  fire: { generates: 'earth', destroys: 'metal', generatedBy: 'wood', destroyedBy: 'water' },
  earth: { generates: 'metal', destroys: 'water', generatedBy: 'fire', destroyedBy: 'wood' },
  metal: { generates: 'water', destroys: 'wood', generatedBy: 'earth', destroyedBy: 'fire' },
  water: { generates: 'wood', destroys: 'fire', generatedBy: 'metal', destroyedBy: 'earth' },
} as const)

// 生肖配對關係 (保留供未來使用)
/* eslint-disable @typescript-eslint/no-unused-vars */
const ZODIAC_COMPATIBILITY = {
  鼠: { best: ['龍', '猴'], good: ['牛'], avoid: ['馬', '羊'] },
  牛: { best: ['蛇', '雞'], good: ['鼠'], avoid: ['羊', '馬'] },
  虎: { best: ['馬', '狗'], good: ['豬'], avoid: ['猴', '蛇'] },
  兔: { best: ['羊', '豬'], good: ['狗'], avoid: ['雞', '龍'] },
  龍: { best: ['鼠', '猴'], good: ['雞'], avoid: ['狗', '兔'] },
  蛇: { best: ['牛', '雞'], good: ['猴'], avoid: ['豬', '虎'] },
  馬: { best: ['虎', '狗'], good: ['羊'], avoid: ['鼠', '牛'] },
  羊: { best: ['兔', '豬'], good: ['馬'], avoid: ['牛', '鼠'] },
  猴: { best: ['鼠', '龍'], good: ['蛇'], avoid: ['虎', '豬'] },
  雞: { best: ['牛', '蛇'], good: ['龍'], avoid: ['兔', '狗'] },
  狗: { best: ['虎', '馬'], good: ['兔'], avoid: ['龍', '雞'] },
  豬: { best: ['兔', '羊'], good: ['虎'], avoid: ['蛇', '猴'] },
} as const

// 時辰對照表
const HOUR_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

export class IntegratedFortuneService {
  private static cache = new Map<string, IntegratedFortuneData>()

  /**
   * 清除快取
   */
  static clearCache(): void {
    this.cache.clear()
    console.log('IntegratedFortuneService - 快取已清除')
  }

  /**
   * 計算整合運勢
   */
  static async calculateIntegratedFortune(
    profile: UserProfileCompat,
    date: Date = new Date()
  ): Promise<IntegratedFortuneData> {
    const cacheKey = `${profile.birthDate}-${date.toISOString().split('T')[0]}`

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!
    }

    // 獲取農民曆資料
    const lunarData = lunarService.getLunarData(date)
    console.log('IntegratedFortuneService - 農民曆資料:', {
      date: date.toLocaleDateString('zh-TW'),
      ganZhi: lunarData.ganZhi,
      lunarMonth: lunarData.lunarMonth,
      lunarDay: lunarData.lunarDay,
      zodiac: lunarData.zodiac,
    })

    // 計算個人八字
    const personalBaZi = this.calculatePersonalBaZi(profile, date)

    // 計算五行能量（包含個人設定的五行屬性）
    const elements = this.calculateElementEnergy(personalBaZi, lunarData, profile)

    // 計算各項運勢分數
    const scores = this.calculateFortuneScores(personalBaZi, lunarData, elements)

    // 生成投資建議
    const investmentAdvice = this.generateInvestmentAdvice(
      personalBaZi,
      lunarData,
      elements,
      scores
    )

    // 計算時間分析
    const timeAnalysis = this.calculateTimeAnalysis(personalBaZi, lunarData)

    // 計算台股交易分析
    const stockTradingAnalysis = this.calculateStockTradingAnalysis(personalBaZi, lunarData, date)

    // 計算方位建議
    const directionAnalysis = this.calculateDirectionAnalysis(personalBaZi, lunarData)

    // 生成宜忌建議
    const activitiesAnalysis = this.generateActivitiesAdvice(personalBaZi, lunarData)

    // 生成特殊提醒
    const specialAdvice = this.generateSpecialAdvice(personalBaZi, lunarData, elements)

    const fortuneData: IntegratedFortuneData = {
      date,
      lunarData,
      personalBaZi,
      ...scores,
      elements,
      ...investmentAdvice,
      ...timeAnalysis,
      ...stockTradingAnalysis,
      ...directionAnalysis,
      luckyColors: this.calculateLuckyColors(personalBaZi, lunarData),
      luckyNumbers: this.calculateLuckyNumbers(personalBaZi, lunarData),
      ...activitiesAnalysis,
      ...specialAdvice,
    }

    this.cache.set(cacheKey, fortuneData)
    return fortuneData
  }

  /**
   * 計算個人八字
   */
  private static calculatePersonalBaZi(profile: UserProfileCompat, _date: Date) {
    if (!profile.birthDate) {
      throw new Error('出生日期不能為空')
    }

    const birthDate = new Date(profile.birthDate)

    // 驗證日期是否有效
    if (isNaN(birthDate.getTime())) {
      throw new Error(`無效的出生日期: ${profile.birthDate}`)
    }

    // 驗證年份是否在合理範圍內 (1900-2100)
    const year = birthDate.getFullYear()
    if (year < 1900 || year > 2100) {
      throw new Error(`出生年份超出範圍 (1900-2100): ${year}`)
    }

    const solar = Solar.fromDate(birthDate)
    const lunar = solar.getLunar()

    // 解析出生時間
    const birthHour = this.parseBirthTime(profile.birthTime)

    return {
      yearGanZhi: lunar.getYearInGanZhi(),
      monthGanZhi: lunar.getMonthInGanZhi(),
      dayGanZhi: lunar.getDayInGanZhi(),
      hourGanZhi: this.calculateHourGanZhi(lunar.getDayInGanZhi(), birthHour),
      zodiac: profile.zodiac,
      element: profile.element,
      naYin: lunar.getYearNaYin(),
    }
  }

  /**
   * 計算五行能量
   */
  private static calculateElementEnergy(
    personalBaZi: PersonalBaZi,
    lunarData: LunarData,
    profile?: UserProfileCompat
  ): ElementsEnergy {
    const elements = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 }

    // 個人設定的五行屬性（最重要的基礎）
    if (profile?.element) {
      const userElement = this.mapElementToEnglish(profile.element)
      if (userElement && Object.prototype.hasOwnProperty.call(elements, userElement)) {
        elements[userElement as keyof typeof elements] += 30 // 個人本命五行占最大權重
      }
    }

    // 個人八字的五行影響
    const yearGan = personalBaZi.yearGanZhi[0]
    const yearZhi = personalBaZi.yearGanZhi[1]
    const dayGan = personalBaZi.dayGanZhi[0]
    const dayZhi = personalBaZi.dayGanZhi[1]

    // 天干影響
    if (GAN_ELEMENTS[yearGan as keyof typeof GAN_ELEMENTS]) {
      elements[GAN_ELEMENTS[yearGan as keyof typeof GAN_ELEMENTS] as keyof typeof elements] += 20
    }
    if (GAN_ELEMENTS[dayGan as keyof typeof GAN_ELEMENTS]) {
      elements[GAN_ELEMENTS[dayGan as keyof typeof GAN_ELEMENTS] as keyof typeof elements] += 25
    }

    // 地支影響
    if (ZHI_ELEMENTS[yearZhi as keyof typeof ZHI_ELEMENTS]) {
      elements[ZHI_ELEMENTS[yearZhi as keyof typeof ZHI_ELEMENTS] as keyof typeof elements] += 15
    }
    if (ZHI_ELEMENTS[dayZhi as keyof typeof ZHI_ELEMENTS]) {
      elements[ZHI_ELEMENTS[dayZhi as keyof typeof ZHI_ELEMENTS] as keyof typeof elements] += 20
    }

    // 當日農民曆的五行影響
    const todayGan = lunarData.dayGanZhi[0]
    const todayZhi = lunarData.dayGanZhi[1]

    if (GAN_ELEMENTS[todayGan as keyof typeof GAN_ELEMENTS]) {
      elements[GAN_ELEMENTS[todayGan as keyof typeof GAN_ELEMENTS] as keyof typeof elements] += 10
    }
    if (ZHI_ELEMENTS[todayZhi as keyof typeof ZHI_ELEMENTS]) {
      elements[ZHI_ELEMENTS[todayZhi as keyof typeof ZHI_ELEMENTS] as keyof typeof elements] += 10
    }

    // 正規化到 0-100
    const total = Object.values(elements).reduce((sum, val) => sum + val, 0)
    if (total > 0) {
      Object.keys(elements).forEach(key => {
        elements[key as keyof typeof elements] = Math.round(
          (elements[key as keyof typeof elements] / total) * 100
        )
      })
    }

    return elements
  }

  /**
   * 將中文五行屬性轉換為英文
   */
  private static mapElementToEnglish(chineseElement: string): string | null {
    const elementMap: Record<string, string> = {
      金: 'metal',
      木: 'wood',
      水: 'water',
      火: 'fire',
      土: 'earth',
    }
    return elementMap[chineseElement] || null
  }

  /**
   * 計算運勢分數
   */
  private static calculateFortuneScores(
    personalBaZi: PersonalBaZi,
    lunarData: LunarData,
    elements: ElementsEnergy
  ) {
    let overallScore = 50
    let investmentScore = 50
    let wealthScore = 50
    let healthScore = 50

    // 基於五行平衡計算
    const elementValues = Object.values(elements) as number[]
    const maxElement = Math.max(...elementValues)
    const minElement = Math.min(...elementValues)
    const balance = 100 - (maxElement - minElement)

    overallScore += Math.round(balance * 0.3)

    // 生肖年運影響 (簡化版本，避免 TypeScript 複雜類型問題)
    const currentYearZodiac = lunarData.zodiac
     
    const _personalZodiac = personalBaZi.zodiac // 保留供未來使用

    // 簡化的生肖配對邏輯
    const goodMatches = ['龍', '猴', '蛇', '雞', '馬', '狗', '羊', '豬']
    const badMatches = ['鼠', '牛', '虎', '兔']

    if (goodMatches.includes(currentYearZodiac)) {
      overallScore += 15
      investmentScore += 20
      wealthScore += 15
    } else if (badMatches.includes(currentYearZodiac)) {
      overallScore -= 10
      investmentScore -= 15
      wealthScore -= 10
    }

    // 天干地支相合相沖影響
    const dayGanMatch = this.checkGanZhiCompatibility(personalBaZi.dayGanZhi, lunarData.dayGanZhi)
    overallScore += dayGanMatch * 10
    investmentScore += dayGanMatch * 15

    // 農民曆宜忌影響
    if (
      lunarData.yi.includes('交易') ||
      lunarData.yi.includes('開市') ||
      lunarData.yi.includes('求財')
    ) {
      investmentScore += 20
      wealthScore += 15
    }
    if (
      lunarData.ji.includes('交易') ||
      lunarData.ji.includes('開市') ||
      lunarData.ji.includes('求財')
    ) {
      investmentScore -= 20
      wealthScore -= 15
    }

    // 確保分數在合理範圍內
    overallScore = Math.max(10, Math.min(95, overallScore))
    investmentScore = Math.max(10, Math.min(95, investmentScore))
    wealthScore = Math.max(10, Math.min(95, wealthScore))
    healthScore = Math.max(10, Math.min(95, healthScore))

    return { overallScore, investmentScore, wealthScore, healthScore }
  }

  /**
   * 生成投資建議
   */
  private static generateInvestmentAdvice(
    _personalBaZi: PersonalBaZi,
    _lunarData: LunarData,
    elements: ElementsEnergy,
    scores: FortuneScores
  ) {
    let recommendation: 'BUY' | 'SELL' | 'HOLD' | 'OBSERVE' = 'HOLD'
    let advice = ''
    let riskLevel: 'low' | 'medium' | 'high' = 'medium'

    // 基於投資分數決定建議
    if (scores.investmentScore >= 75) {
      recommendation = 'BUY'
      advice = '今日投資運勢佳，適合積極布局。'
      riskLevel = 'low'
    } else if (scores.investmentScore >= 60) {
      recommendation = 'HOLD'
      advice = '運勢平穩，建議維持現有部位。'
      riskLevel = 'medium'
    } else if (scores.investmentScore >= 40) {
      recommendation = 'OBSERVE'
      advice = '運勢略顯不穩，建議觀望等待時機。'
      riskLevel = 'medium'
    } else {
      recommendation = 'SELL'
      advice = '今日投資運勢不佳，建議避險為主。'
      riskLevel = 'high'
    }

    // 根據五行關係調整建議
    const dominantElement = Object.entries(elements).reduce(
      (max, [key, value]) =>
        (value as number) > max.value ? { element: key, value: value as number } : max,
      { element: '', value: 0 }
    ).element

    // 加入具體的五行建議
    switch (dominantElement) {
      case 'wood':
        advice += ' 木旺之日，利於成長股投資。'
        break
      case 'fire':
        advice += ' 火旺之日，適合積極操作。'
        break
      case 'earth':
        advice += ' 土旺之日，宜穩健投資。'
        break
      case 'metal':
        advice += ' 金旺之日，利於價值投資。'
        break
      case 'water':
        advice += ' 水旺之日，宜靈活調配。'
        break
    }

    return { recommendation, advice, riskLevel }
  }

  /**
   * 計算台股交易分析
   */
  private static calculateStockTradingAnalysis(
    personalBaZi: PersonalBaZi,
    _lunarData: LunarData,
    date: Date
  ) {
    // 獲取台股交易狀態（檢查當前時間和日期）
    const stockTradingStatus = TaiwanStockService.getTradingStatus(date)

    // 計算傳統吉時兇時
    const luckyZhi = this.getLuckyZhiForZodiac(personalBaZi.zodiac)
    const avoidZhi = this.getAvoidZhiForZodiac(personalBaZi.zodiac)

    // 轉換為時間範圍
    const luckyHours = luckyZhi.map(zhi => this.zhiToTimeRange(zhi))
    const avoidHours = avoidZhi.map(zhi => this.zhiToTimeRange(zhi))

    // 獲取建議的台股交易時段（僅當天）
    const tradingPeriods = TaiwanStockService.getRecommendedTradingPeriods(
      luckyHours,
      avoidHours,
      date
    )

    // 計算下個交易日（用於交易日提醒）
    const nextTradingDay =
      stockTradingStatus.nextTradingDay ||
      (TaiwanStockService.isTradingDay(date) ? date : TaiwanStockService.getNextTradingDay(date))

    return {
      stockTradingStatus,
      bestTradingHours: tradingPeriods.recommended,
      avoidTradingHours: tradingPeriods.avoid,
      tradingDayInfo: {
        isToday: TaiwanStockService.isTradingDay(date) && this.isSameDay(date, new Date()),
        tradingDay: nextTradingDay,
      },
    }
  }

  /**
   * 檢查兩個日期是否為同一天
   */
  private static isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    )
  }

  /**
   * 計算時間分析
   */
  private static calculateTimeAnalysis(personalBaZi: PersonalBaZi, lunarData: LunarData) {
    const zodiac = personalBaZi.zodiac

    // 根據生肖計算吉時
    const luckyZhi = this.getLuckyZhiForZodiac(zodiac)
    const avoidZhi = this.getAvoidZhiForZodiac(zodiac)

    const luckyTime = this.zhiToTimeRange(luckyZhi[0])
    const avoidTime = this.zhiToTimeRange(avoidZhi[0])

    // 計算最佳交易時段（結合台股交易時間）
    const bestTradingHours = this.calculateBestTradingHours(personalBaZi, lunarData)

    return { luckyTime, avoidTime, bestTradingHours }
  }

  /**
   * 計算方位分析
   */
  private static calculateDirectionAnalysis(personalBaZi: PersonalBaZi, _lunarData: LunarData) {
    // 根據天干地支計算吉方
    const dayGan = personalBaZi.dayGanZhi[0]
    const dayZhi = personalBaZi.dayGanZhi[1]

    const luckyDirection = this.calculateLuckyDirection(dayGan, dayZhi)
    const avoidDirection = this.calculateAvoidDirection(dayGan, dayZhi)

    return { luckyDirection, avoidDirection }
  }

  /**
   * 生成活動建議
   */
  private static generateActivitiesAdvice(_personalBaZi: PersonalBaZi, lunarData: LunarData) {
    const suitable = [...lunarData.yi]
    const forbidden = [...lunarData.ji]

    // 根據個人八字調整宜忌
    // 這裡可以加入更多個性化的宜忌建議

    return { suitable, forbidden }
  }

  /**
   * 生成特殊建議
   */
  private static generateSpecialAdvice(
    _personalBaZi: PersonalBaZi,
    lunarData: LunarData,
    elements: ElementsEnergy
  ) {
    const warnings: string[] = []
    const opportunities: string[] = []

    // 檢查五行失衡
    const elementValues = Object.values(elements) as number[]
    const maxElement = Math.max(...elementValues)
    const minElement = Math.min(...elementValues)

    if (maxElement - minElement > 60) {
      warnings.push('今日五行能量失衡，建議謹慎投資決策。')
    }

    // 檢查節氣影響
    if (lunarData.jieQi) {
      opportunities.push(`${lunarData.jieQi}節氣，適合調整投資策略。`)
    }

    // 檢查節日影響
    if (lunarData.festivals.length > 0) {
      lunarData.festivals.forEach(festival => {
        if (festival.includes('財神') || festival.includes('開市')) {
          opportunities.push(`${festival}，利於財運投資。`)
        }
      })
    }

    return { warnings, opportunities }
  }

  // 輔助方法們
  private static parseBirthTime(birthTime: string): number {
    // 解析出生時間，返回小時數
    if (!birthTime) return 12 // 默認中午

    const timeMatch = birthTime.match(/(\d{1,2}):?(\d{0,2})/)
    if (timeMatch) {
      const hour = timeMatch[1] ? parseInt(timeMatch[1], 10) : 0
      const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0
      if (isNaN(hour) || isNaN(minute)) return 12
      return hour + minute / 60
    }

    return 12
  }

  private static calculateHourGanZhi(dayGanZhi: string, hour: number): string {
    // 計算時辰干支
    const zhiIndex = Math.floor((hour + 1) / 2) % 12
    const zhi = HOUR_ZHI[zhiIndex]

    // 根據日干推算時干
    const dayGan = dayGanZhi[0]
    const ganIndex = '甲乙丙丁戊己庚辛壬癸'.indexOf(dayGan)
    const hourGanIndex = (ganIndex * 2 + zhiIndex) % 10
    const hourGan = '甲乙丙丁戊己庚辛壬癸'[hourGanIndex]

    return hourGan + zhi
  }

  private static checkGanZhiCompatibility(baziGanZhi: string, todayGanZhi: string): number {
    // 檢查干支相合相沖關係，返回 -2 到 2 的分數
    // 這裡簡化處理，實際可以更詳細
    if (baziGanZhi === todayGanZhi) return 2
    if (baziGanZhi[0] === todayGanZhi[0] || baziGanZhi[1] === todayGanZhi[1]) return 1
    return 0
  }

  private static getLuckyZhiForZodiac(zodiac: string): string[] {
    const zodiacToZhi: { [key: string]: string[] } = {
      鼠: ['子', '申', '辰'],
      牛: ['丑', '巳', '酉'],
      虎: ['寅', '午', '戌'],
      兔: ['卯', '亥', '未'],
      龍: ['辰', '子', '申'],
      蛇: ['巳', '酉', '丑'],
      馬: ['午', '寅', '戌'],
      羊: ['未', '卯', '亥'],
      猴: ['申', '子', '辰'],
      雞: ['酉', '巳', '丑'],
      狗: ['戌', '寅', '午'],
      豬: ['亥', '卯', '未'],
    }

    return zodiacToZhi[zodiac] || ['午']
  }

  private static getAvoidZhiForZodiac(zodiac: string): string[] {
    const zodiacToAvoid: { [key: string]: string[] } = {
      鼠: ['午', '未'],
      牛: ['未', '午'],
      虎: ['申', '巳'],
      兔: ['酉', '辰'],
      龍: ['戌', '卯'],
      蛇: ['亥', '寅'],
      馬: ['子', '丑'],
      羊: ['丑', '子'],
      猴: ['寅', '亥'],
      雞: ['卯', '戌'],
      狗: ['辰', '酉'],
      豬: ['巳', '申'],
    }

    return zodiacToAvoid[zodiac] || ['子']
  }

  private static zhiToTimeRange(zhi: string): string {
    const zhiToTime: { [key: string]: string } = {
      子: '23:00-01:00',
      丑: '01:00-03:00',
      寅: '03:00-05:00',
      卯: '05:00-07:00',
      辰: '07:00-09:00',
      巳: '09:00-11:00',
      午: '11:00-13:00',
      未: '13:00-15:00',
      申: '15:00-17:00',
      酉: '17:00-19:00',
      戌: '19:00-21:00',
      亥: '21:00-23:00',
    }

    return zhiToTime[zhi] || '11:00-13:00'
  }

  private static calculateBestTradingHours(
    personalBaZi: PersonalBaZi,
    _lunarData: LunarData
  ): string[] {
    // 計算交易時段內的最佳時間
    const tradingHours = []
    const luckyZhi = this.getLuckyZhiForZodiac(personalBaZi.zodiac)

    // 交易時段內的時辰：巳(09:00-11:00), 午(11:00-13:00), 未(13:00-15:00)
    const tradingZhi = ['巳', '午', '未']

    for (const zhi of tradingZhi) {
      if (luckyZhi.includes(zhi)) {
        tradingHours.push(this.zhiToTimeRange(zhi))
      }
    }

    // 如果沒有吉時在交易時段，選擇相對較好的時段
    if (tradingHours.length === 0) {
      tradingHours.push('10:00-11:00') // 默認推薦時段
    }

    return tradingHours
  }

  private static calculateLuckyDirection(dayGan: string, _dayZhi: string): string {
    // 根據天干地支計算吉方
    const ganToDirection: { [key: string]: string } = {
      甲: '東方',
      乙: '東南',
      丙: '南方',
      丁: '南方',
      戊: '中央',
      己: '中央',
      庚: '西方',
      辛: '西方',
      壬: '北方',
      癸: '北方',
    }

    return ganToDirection[dayGan] || '東方'
  }

  private static calculateAvoidDirection(dayGan: string, _dayZhi: string): string {
    // 根據天干地支計算凶方
    const ganToAvoid: { [key: string]: string } = {
      甲: '西方',
      乙: '西北',
      丙: '北方',
      丁: '北方',
      戊: '東方',
      己: '東方',
      庚: '東方',
      辛: '東南',
      壬: '南方',
      癸: '南方',
    }

    return ganToAvoid[dayGan] || '西方'
  }

  private static calculateLuckyColors(personalBaZi: PersonalBaZi, _lunarData: LunarData): string[] {
    const element = personalBaZi.element
    const elementToColors: { [key: string]: string[] } = {
      wood: ['綠色', '青色', '蘭色'],
      fire: ['紅色', '橙色', '紫色'],
      earth: ['黃色', '咖啡色', '土色'],
      metal: ['白色', '金色', '銀色'],
      water: ['黑色', '藍色', '灰色'],
    }

    return elementToColors[element] || ['藍色', '黑色']
  }

  private static calculateLuckyNumbers(
    personalBaZi: PersonalBaZi,
    _lunarData: LunarData
  ): number[] {
    const element = personalBaZi.element
    const elementToNumbers: { [key: string]: number[] } = {
      wood: [3, 8],
      fire: [2, 7],
      earth: [5, 0],
      metal: [4, 9],
      water: [1, 6],
    }

    const baseNumbers = elementToNumbers[element] || [1, 6]

    // 加入一些變化
    const luckyNumbers = [...baseNumbers]
    baseNumbers.forEach(num => {
      if (num < 5) luckyNumbers.push(num + 10)
      if (num > 5) luckyNumbers.push(num + 20)
    })

    return luckyNumbers.slice(0, 6)
  }
}
