// @ts-expect-error - lunar-javascript doesn't have TypeScript definitions
import { Solar } from 'lunar-javascript'
import { perfMonitor } from '@/utils/performance'

import type {
  UserProfile,
  FortuneData,
  EnhancedFortuneData,
  LunarObject,
  DisclaimerLevel,
} from '@/types'

// 安全的時間解析函數
const parseHourSafe = (timeString: string | undefined): number => {
  if (!timeString) return 0
  const parts = timeString.split(':')
  const hour = parts[0] ? parseInt(parts[0], 10) : 0
  return isNaN(hour) ? 0 : hour
}

// 天干地支修正值映射表 - 提取為常數以提高性能
const GAN_MODIFIERS = Object.freeze({
  甲: { wood: 20 },
  乙: { wood: 15 },
  丙: { fire: 20 },
  丁: { fire: 15 },
  戊: { earth: 20 },
  己: { earth: 15 },
  庚: { metal: 20 },
  辛: { metal: 15 },
  壬: { water: 20 },
  癸: { water: 15 },
} as const)

const ZHI_MODIFIERS = Object.freeze({
  子: { water: 15 },
  午: { fire: 15 },
  卯: { wood: 15 },
  酉: { metal: 15 },
  寅: { wood: 10 },
  申: { metal: 10 },
  巳: { fire: 10 },
  亥: { water: 10 },
  辰: { earth: 10 },
  戌: { earth: 10 },
  丑: { earth: 10 },
  未: { earth: 10 },
} as const)

// 台股交易時段 (09:00-13:30) 細分時段
const TRADING_PERIODS = Object.freeze([
  { name: '開盤搶進', time: '09:00-09:30', description: '適合搶進強勢股' },
  { name: '早盤選股', time: '09:30-10:00', description: '適合觀察選股' },
  { name: '上午中段', time: '10:00-10:30', description: '適合逢低買入' },
  { name: '盤中整理', time: '10:30-11:00', description: '適合觀察整理' },
  { name: '午前加碼', time: '11:00-11:30', description: '適合加碼投資' },
  { name: '盤整觀望', time: '11:30-12:00', description: '適合觀望等待' },
  { name: '午後佈局', time: '12:00-12:30', description: '適合佈局進場' },
  { name: '收盤前段', time: '12:30-13:00', description: '適合短線操作' },
  { name: '尾盤衝刺', time: '13:00-13:30', description: '適合尾盤衝刺' },
])

// 需要避開的時段
const AVOID_PERIODS = Object.freeze([
  { name: '開盤震盪', time: '09:00-09:15', description: '開盤價格震盪劇烈' },
  { name: '早盤追高', time: '09:45-10:15', description: '容易追高套牢' },
  { name: '中場休息', time: '10:45-11:15', description: '交易量萎縮整理' },
  { name: '午前賣壓', time: '11:45-12:15', description: '獲利了結賣壓' },
  { name: '尾盤殺跌', time: '13:15-13:30', description: '尾盤容易殺跌' },
])

// 生肖對應的吉時地支
const ZODIAC_TO_LUCKY_ZHI = Object.freeze({
  鼠: ['子', '申', '辰'],
  牛: ['丑', '巳', '酉'],
  虎: ['寅', '午', '戌'],
  兔: ['卯', '亥', '未'],
  龍: ['辰', '子', '申'],
  蛇: ['巳', '酉', '丑'],
  馬: ['午', '戌', '寅'],
  羊: ['未', '卯', '亥'],
  猴: ['申', '辰', '子'],
  雞: ['酉', '丑', '巳'],
  狗: ['戌', '寅', '午'],
  豬: ['亥', '未', '卯'],
})

// 地支對應台股交易時間（9:00-13:30）
const ZHI_TO_TRADING_TIME = Object.freeze({
  巳: { hour: 9, period: '09:00-11:00' }, // 巳時 09:00-11:00
  午: { hour: 11, period: '11:00-13:00' }, // 午時 11:00-13:00
  未: { hour: 13, period: '13:00-13:30' }, // 未時 13:00-13:30（部分）
})

// 生肖投資加成映射表
const ZODIAC_BONUS_MAP = Object.freeze({
  鼠: 5,
  牛: 8,
  虎: 3,
  兔: 6,
  龍: 10,
  蛇: 7,
  馬: 4,
  羊: 2,
  猴: 9,
  雞: 6,
  狗: 5,
  豬: 8,
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
      // 驗證日期
      if (!date || isNaN(date.getTime())) {
        throw new Error('無效的日期')
      }

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
        luckyTime: this.calculateLuckyTime(profile, lunar, seed),
        avoidTime: this.calculateAvoidTime(profile, lunar, seed),
        elements,
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
  private static calculateElements(
    lunar: LunarObject,
    seed: number
  ): { metal: number; wood: number; water: number; fire: number; earth: number } {
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
        Math.round(Math.max(10, Math.min(100, value + (random() - 0.5) * 20))),
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
  private static calculateOverallScore(elements: {
    metal: number
    wood: number
    water: number
    fire: number
    earth: number
  }): number {
    const values = Object.values(elements)
    const total = values.reduce((sum, val) => sum + val, 0)
    const average = total / values.length

    // 使用更高效的方差計算
    const variance =
      values.reduce((acc, val) => acc + Math.pow(val - average, 2), 0) / values.length

    // 平衡度分數和平均值分數的加權組合
    const balanceScore = Math.max(0, 100 - variance)
    const averageScore = 100 - Math.abs(average - 65)

    return (balanceScore + averageScore) * 0.5
  }

  /**
   * 優化的投資運勢計算
   */
  private static calculateInvestmentScore(
    elements: { metal: number; wood: number; water: number; fire: number; earth: number },
    profile: UserProfile,
    seed: number
  ): number {
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
  private static generateRecommendation(
    investmentScore: number,
    overallScore: number
  ): 'BUY' | 'HOLD' | 'SELL' {
    const combinedScore = (investmentScore + overallScore) * 0.5

    return combinedScore >= 70 ? 'BUY' : combinedScore >= 40 ? 'HOLD' : 'SELL'
  }

  /**
   * 優化的投資建議文字生成
   */
  private static generateAdvice(investmentScore: number): string {
    const adviceMap = {
      high: '今日財運亨通，適合積極投資。建議在台股開盤時段（09:00-13:30）把握進場機會。',
      medium: '今日運勢平穩，可考慮適量投資。建議觀察台股開盤後走勢再決定進場時機。',
      low: '今日運勢一般，建議保持觀望。如有台股持倉建議持有，避免盤中頻繁交易。',
      poor: '今日運勢較弱，不宜投資。建議等待台股收盤後檢視，尋找更好的進場時機。',
    }

    return investmentScore >= 80
      ? adviceMap.high
      : investmentScore >= 60
        ? adviceMap.medium
        : investmentScore >= 40
          ? adviceMap.low
          : adviceMap.poor
  }

  /**
   * 根據農民曆和生肖計算吉利交易時段
   */
  private static calculateLuckyTime(
    profile: UserProfile,
    lunar: LunarObject,
    seed: number
  ): string {
    const random = this.seededRandom(seed + 2000)

    // 取得生肖對應的吉利地支
    const luckyZhi = ZODIAC_TO_LUCKY_ZHI[profile.zodiac as keyof typeof ZODIAC_TO_LUCKY_ZHI] || []

    // 找出在台股交易時間內的吉利時段
    const availablePeriods: (typeof TRADING_PERIODS)[0][] = []

    luckyZhi.forEach(zhi => {
      const tradingTime = ZHI_TO_TRADING_TIME[zhi as keyof typeof ZHI_TO_TRADING_TIME]
      if (tradingTime) {
        // 根據地支對應的時間找出相關的交易時段
        TRADING_PERIODS.forEach(period => {
          const timeParts = period.time.split('-')
          const startTimePart = timeParts[0]
          if (startTimePart) {
            const startHourStr = startTimePart.split(':')[0]
            const startHour = startHourStr ? parseInt(startHourStr, 10) : 9
            const zhiHour = tradingTime.hour

            // 如果交易時段在吉利時辰範圍內，加入候選
            if (!isNaN(startHour) && Math.abs(startHour - zhiHour) <= 1) {
              availablePeriods.push(period)
            }
          }
        })
      }
    })

    // 如果沒有找到對應的吉利時段，從所有交易時段中選擇
    const targetPeriods = availablePeriods.length > 0 ? availablePeriods : TRADING_PERIODS

    // 結合農民曆因素
    const dayGan = lunar.getDayGan()
    const dayZhi = lunar.getDayZhi()

    // 根據天干地支調整選擇權重
    let selectedPeriod
    if (dayGan === '甲' || dayGan === '乙' || dayZhi === '寅' || dayZhi === '卯') {
      // 木旺日，選擇上午時段
      const morningPeriods = targetPeriods.filter(p => {
        const hour = parseHourSafe(p.time)
        return hour >= 9 && hour <= 11
      })
      selectedPeriod =
        morningPeriods[Math.floor(random() * morningPeriods.length)] || targetPeriods[0]
    } else if (dayGan === '丙' || dayGan === '丁' || dayZhi === '巳' || dayZhi === '午') {
      // 火旺日，選擇中午時段
      const noonPeriods = targetPeriods.filter(p => {
        const hour = parseHourSafe(p.time)
        return hour >= 11 && hour <= 13
      })
      selectedPeriod = noonPeriods[Math.floor(random() * noonPeriods.length)] || targetPeriods[0]
    } else {
      // 其他情況隨機選擇
      selectedPeriod = targetPeriods[Math.floor(random() * targetPeriods.length)]
    }

    return `${selectedPeriod.time} (${selectedPeriod.name})`
  }

  /**
   * 根據農民曆和生肖計算需要避開的交易時段
   */
  private static calculateAvoidTime(
    profile: UserProfile,
    lunar: LunarObject,
    seed: number
  ): string {
    const random = this.seededRandom(seed + 3000)

    // 取得與生肖相沖的地支
    const conflictZhi = this.getConflictZhi(profile.zodiac)

    // 找出在台股交易時間內需要避開的時段
    const avoidPeriods: (typeof AVOID_PERIODS)[0][] = []

    conflictZhi.forEach(zhi => {
      const tradingTime = ZHI_TO_TRADING_TIME[zhi as keyof typeof ZHI_TO_TRADING_TIME]
      if (tradingTime) {
        // 根據地支對應的時間找出相關的避開時段
        AVOID_PERIODS.forEach(period => {
          const timeParts = period.time.split('-')
          const startTimePart = timeParts[0]
          if (startTimePart) {
            const startHourStr = startTimePart.split(':')[0]
            const startHour = startHourStr ? parseInt(startHourStr, 10) : 9
            const zhiHour = tradingTime.hour

            // 如果避開時段在相沖時辰範圍內，加入候選
            if (!isNaN(startHour) && Math.abs(startHour - zhiHour) <= 1) {
              avoidPeriods.push(period)
            }
          }
        })
      }
    })

    // 如果沒有找到對應的避開時段，從所有避開時段中選擇
    const targetPeriods = avoidPeriods.length > 0 ? avoidPeriods : AVOID_PERIODS

    // 結合農民曆因素
    const dayGan = lunar.getDayGan()
    const dayZhi = lunar.getDayZhi()

    // 根據天干地支調整避開時段
    let selectedPeriod
    if (dayGan === '庚' || dayGan === '辛' || dayZhi === '申' || dayZhi === '酉') {
      // 金旺日,避開下午時段
      const afternoonPeriods = targetPeriods.filter(p => {
        const hour = parseHourSafe(p.time)
        return hour >= 12
      })
      selectedPeriod =
        afternoonPeriods[Math.floor(random() * afternoonPeriods.length)] || targetPeriods[0]
    } else if (dayGan === '壬' || dayGan === '癸' || dayZhi === '子' || dayZhi === '亥') {
      // 水旺日，避開早盤時段
      const earlyPeriods = targetPeriods.filter(p => {
        const hour = parseHourSafe(p.time)
        return hour <= 10
      })
      selectedPeriod = earlyPeriods[Math.floor(random() * earlyPeriods.length)] || targetPeriods[0]
    } else {
      // 其他情況隨機選擇
      selectedPeriod = targetPeriods[Math.floor(random() * targetPeriods.length)]
    }

    return `${selectedPeriod.time} (${selectedPeriod.name})`
  }

  /**
   * 取得與生肖相沖的地支
   */
  private static getConflictZhi(zodiac: string): string[] {
    const conflictMap: { [key: string]: string[] } = {
      鼠: ['午'],
      牛: ['未'],
      虎: ['申'],
      兔: ['酉'],
      龍: ['戌'],
      蛇: ['亥'],
      馬: ['子'],
      羊: ['丑'],
      猴: ['寅'],
      雞: ['卯'],
      狗: ['辰'],
      豬: ['巳'],
    }

    return conflictMap[zodiac] || []
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
      maxSize: 100,
    }
  }

  /**
   * 計算增強版運勢數據（包含 Claude 憲法應用）
   */
  static calculateEnhancedFortune(profile: UserProfile, date: Date): EnhancedFortuneData {
    const baseFortune = this.calculateDailyFortune(profile, date)

    // 創建透明度資訊
    const transparency: EnhancedFortuneData['transparency'] = {
      algorithmExplanation: this.getAlgorithmExplanation(),
      dataSourceDisclosure: [
        'FinMind API - 台灣金融數據開源平台',
        'lunar-javascript - 農民曆計算函式庫',
        '傳統八字五行理論',
        '生肖運勢對照表',
      ],
      limitations: [
        '運勢計算基於傳統文化，缺乏科學驗證',
        '市場受多種因素影響，歷史表現不保證未來結果',
        '個人運勢分析不考慮實際財務狀況',
        '僅適用於台股 0050 ETF，不建議用於其他投資標的',
      ],
      confidenceLevel: Math.min(95, 60 + baseFortune.overallScore * 0.3),
      lastUpdated: new Date().toISOString(),
    }

    // 添加免責聲明
    const disclaimer: DisclaimerLevel = {
      level: baseFortune.investmentScore > 60 ? 'medium' : 'high',
      messages: [
        '本投資建議僅供參考，不構成投資建議',
        '投資有風險，請謹慎評估自身財務狀況',
        '建議諮詢專業理財顧問',
      ],
      requiresAcknowledgment: baseFortune.investmentScore < 40,
    }

    // 添加教育內容
    const educationalContent = this.generateEducationalContent(baseFortune)

    return {
      ...baseFortune,
      disclaimer,
      transparency,
      educationalContent,
    }
  }

  /**
   * 獲取演算法說明
   */
  private static getAlgorithmExplanation(): string {
    return `運勢計算演算法結合以下元素：
1. **農民曆分析**：根據指定日期的天干地支計算五行能量
2. **個人八字**：結合使用者出生年月日時分析個人特質
3. **生肖相性**：根據生肖屬性計算吉利時段
4. **五行平衡**：計算金木水火土五行的平衡度
5. **加權評分**：綜合各項因素計算總體運勢和投資分數

計算公式：
總體運勢 = (五行平衡度 + 平均值分數) × 0.5
投資運勢 = 總體運勢 + 生肖加成 + 隨機波動

注意：此演算法僅供文化娛樂參考，不具備科學預測能力。`
  }

  /**
   * 生成教育內容
   */
  private static generateEducationalContent(
    fortune: FortuneData
  ): EnhancedFortuneData['educationalContent'] {
    const content: EnhancedFortuneData['educationalContent'] = []

    // 農民曆知識
    content.push({
      category: 'lunar-calendar',
      title: '今日農民曆解讀',
      content: `今天是 ${fortune.date}，根據農民曆，五行能量分別為：
金: ${fortune.elements.metal} | 木: ${fortune.elements.wood} | 水: ${fortune.elements.water} | 火: ${fortune.elements.fire} | 土: ${fortune.elements.earth}

五行平衡度影響整體運勢，當各元素數值接近時，代表運勢較為穩定。`,
      difficulty: 'beginner',
      relatedTopics: ['五行理論', '農民曆基礎'],
    })

    // 投資知識
    content.push({
      category: 'investment',
      title: '0050 ETF 基礎認識',
      content:
        '元大台灣50ETF(0050)追蹤台灣50指數，包含台灣市值最大的50家公司。是台灣最主流的ETF之一，適合長期投資和定期定額。',
      difficulty: 'beginner',
      relatedTopics: ['ETF基礎', '台灣股市'],
    })

    // 風險管理
    if (fortune.investmentScore <= 40) {
      content.push({
        category: 'risk-management',
        title: '低運勢日投資策略',
        content:
          '運勢較低時建議：1. 避免重大投資決策 2. 專注研究分析 3. 保持現金部位 4. 回顧投資策略。記住，市場機會隨時存在，不急於一時。',
        difficulty: 'intermediate',
        relatedTopics: ['風險控制', '情緒管理'],
      })
    }

    return content
  }
}
