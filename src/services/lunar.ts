// @ts-ignore
import { Solar, Lunar } from 'lunar-javascript'

export interface LunarData {
  // 基本日期資訊
  lunarYear: string
  lunarMonth: string
  lunarDay: string
  
  // 天干地支
  ganZhi: string
  monthGanZhi: string
  dayGanZhi: string
  
  // 生肖星座
  zodiac: string
  constellation: string
  naYin: string
  
  // 節氣節日
  jieQi: string
  festivals: string[]
  
  // 宜忌
  yi: string[]
  ji: string[]
  
  // 其他資訊
  pengZu: string
  naYinDay: string
  jiuXing: string
}

export interface InvestmentAdvice {
  luckyScore: number
  luckyTime: string
  luckyDirection: string
  advice: string
  riskLevel: 'low' | 'medium' | 'high'
  recommendedAction: 'buy' | 'sell' | 'hold' | 'observe'
}

class LunarService {
  private cache = new Map<string, LunarData>()
  
  // 簡繁轉換映射表
  private simplifiedToTraditional: { [key: string]: string } = {
    // 常用宜忌詞彙
    '开市': '開市',
    '纳财': '納財',
    '求财': '求財',
    '开光': '開光',
    '塑绘': '塑繪',
    '斋醮': '齋醮',
    '剃头': '剃頭',
    '纳采': '納采',
    '问名': '問名',
    '纳吉': '納吉',
    '纳征': '納徵',
    '请期': '請期',
    '亲迎': '親迎',
    '合帐': '合帳',
    '动土': '動土',
    '竖柱': '豎柱',
    '开池': '開池',
    '补垣': '補垣',
    '坏垣': '壞垣',
    '栽种': '栽種',
    '牧养': '牧養',
    '纳畜': '納畜',
    '渔猎': '漁獵',
    '教牛马': '教牛馬',
    '启攒': '啟攢',
    '谢土': '謝土',
    '订盟': '訂盟',
    '会亲友': '會親友',
    '进人口': '進人口',
    '安门': '安門',
    '安床': '安床', 
    '余事勿取': '餘事勿取',
    '诸事不宜': '諸事不宜',
    '行丧': '行喪',
    // 節氣相關
    '惊蛰': '驚蟄',
    '谷雨': '穀雨',
    '小满': '小滿',
    '芒种': '芒種',
    '处暑': '處暑',
    // 其他常用字
    '为': '為',
    '让': '讓',
    '从': '從',
    '来': '來',
    '这': '這',
    '会': '會',
    '与': '與',
    '对': '對',
  }
  
  // 簡繁轉換方法
  private convertToTraditional(text: string): string {
    if (!text) return text
    
    let result = text
    for (const [simplified, traditional] of Object.entries(this.simplifiedToTraditional)) {
      result = result.replace(new RegExp(simplified, 'g'), traditional)
    }
    return result
  }
  
  // 轉換字串陣列為繁體中文
  private convertArrayToTraditional(array: string[]): string[] {
    return array.map(item => this.convertToTraditional(item))
  }
  
  getLunarData(date: Date = new Date()): LunarData {
    const targetDate = new Date(date.getTime())
    const cacheKey = `${targetDate.getFullYear()}-${targetDate.getMonth()}-${targetDate.getDate()}`
    
    if (this.cache.has(cacheKey)) {
      console.log('LunarService - 使用快取資料:', cacheKey)
      return this.cache.get(cacheKey)!
    }

    try {
      const solar = Solar.fromYmd(targetDate.getFullYear(), targetDate.getMonth() + 1, targetDate.getDate())
      const lunar = solar.getLunar()
      
      const lunarData: LunarData = {
        lunarYear: lunar.getYearInChinese(),
        lunarMonth: lunar.getMonthInChinese(),
        lunarDay: lunar.getDayInChinese(),
        ganZhi: lunar.getYearInGanZhi(),
        monthGanZhi: lunar.getMonthInGanZhi(),
        dayGanZhi: lunar.getDayInGanZhi(),
        zodiac: lunar.getYearShengXiao(),
        constellation: this.getSafeString(solar, 'getXingZuo'),
        naYin: this.getSafeString(lunar, 'getYearNaYin'),
        jieQi: this.getJieQi(solar),
        festivals: this.getFestivals(lunar, solar),
        yi: this.getSafeArray(lunar, 'getDayYi'),
        ji: this.getSafeArray(lunar, 'getDayJi'),
        pengZu: this.getSafeString(lunar, 'getDayPengZu'),
        naYinDay: this.getSafeString(lunar, 'getDayNaYin'),
        jiuXing: this.getSafeString(lunar, 'getDayJiuXing')
      }
      
      this.cache.set(cacheKey, lunarData)
      return lunarData
      
    } catch (error) {
      console.error('LunarService - 農民曆計算錯誤:', error)
      console.log('錯誤詳情:', {
        date: targetDate,
        dateString: targetDate.toString(),
        isoString: targetDate.toISOString()
      })
      
      // 嘗試重新計算，使用不同的方法
      try {
        console.log('LunarService - 嘗試重新計算農民曆...')
        const solar = Solar.fromYmd(targetDate.getFullYear(), targetDate.getMonth() + 1, targetDate.getDate())
        const lunar = solar.getLunar()
        
        const retryData: LunarData = {
          lunarYear: lunar.getYearInChinese(),
          lunarMonth: lunar.getMonthInChinese(),
          lunarDay: lunar.getDayInChinese(),
          ganZhi: lunar.getYearInGanZhi(),
          monthGanZhi: lunar.getMonthInGanZhi(),
          dayGanZhi: lunar.getDayInGanZhi(),
          zodiac: lunar.getYearShengXiao(),
          constellation: this.getSafeString(solar, 'getXingZuo'),
          naYin: this.getSafeString(lunar, 'getYearNaYin'),
          jieQi: this.getJieQi(solar),
          festivals: [],
          yi: this.getSafeArray(lunar, 'getDayYi'),
          ji: this.getSafeArray(lunar, 'getDayJi'),
          pengZu: this.getSafeString(lunar, 'getDayPengZu'),
          naYinDay: this.getSafeString(lunar, 'getDayNaYin'),
          jiuXing: this.getSafeString(lunar, 'getDayJiuXing')
        }
        
        console.log('LunarService - 重試成功:', retryData)
        this.cache.set(cacheKey, retryData)
        return retryData
        
      } catch (retryError) {
        console.error('LunarService - 重試也失敗:', retryError)
        // 拋出錯誤，不返回錯誤的預設值
        throw new Error(`無法計算農民曆資料: ${error}`)
      }
    }
  }
  
  private getFestivals(lunar: any, solar: any): string[] {
    const festivals: string[] = []
    
    try {
      // 農曆節日
      const lunarFestivals = lunar.getFestivals()
      if (lunarFestivals && lunarFestivals.length > 0) {
        festivals.push(...lunarFestivals)
      }
      
      // 陽曆節日
      const solarFestivals = solar.getFestivals()
      if (solarFestivals && solarFestivals.length > 0) {
        festivals.push(...solarFestivals)
      }
    } catch (error) {
      console.warn('LunarService - 取得節日資訊錯誤:', error)
    }
    
    return festivals
  }
  
  private getJieQi(solar: any): string {
    try {
      // 嘗試不同的節氣方法名稱
      if (typeof solar.getJieQi === 'function') {
        return solar.getJieQi() || ''
      }
      if (typeof solar.getJieQiName === 'function') {
        return solar.getJieQiName() || ''
      }
      if (typeof solar.getJie === 'function') {
        return solar.getJie() || ''
      }
      // 如果都沒有，返回空字串
      return ''
    } catch (error) {
      console.warn('LunarService - 取得節氣資訊錯誤:', error)
      return ''
    }
  }
  
  private getSafeString(obj: any, methodName: string): string {
    try {
      if (obj && typeof obj[methodName] === 'function') {
        const result = obj[methodName]()
        return this.convertToTraditional(result || '')
      }
      return ''
    } catch (error) {
      console.warn(`LunarService - 呼叫 ${methodName} 錯誤:`, error)
      return ''
    }
  }
  
  private getSafeArray(obj: any, methodName: string): string[] {
    try {
      if (obj && typeof obj[methodName] === 'function') {
        const result = obj[methodName]()
        const array = Array.isArray(result) ? result : []
        return this.convertArrayToTraditional(array)
      }
      return []
    } catch (error) {
      console.warn(`LunarService - 呼叫 ${methodName} 錯誤:`, error)
      return []
    }
  }
  
  getInvestmentAdvice(date: Date = new Date()): InvestmentAdvice {
    const lunarData = this.getLunarData(date)
    
    // 基於天干地支計算投資建議
    const ganZhiScore = this.calculateGanZhiScore(lunarData.ganZhi, lunarData.dayGanZhi)
    const yiJiScore = this.calculateYiJiScore(lunarData.yi, lunarData.ji)
    
    const luckyScore = Math.round((ganZhiScore + yiJiScore) / 2)
    
    const advice = this.generateAdvice(luckyScore, lunarData)
    
    return {
      luckyScore,
      luckyTime: this.getLuckyTime(lunarData.dayGanZhi),
      luckyDirection: this.getLuckyDirection(lunarData.dayGanZhi),
      advice: advice.text,
      riskLevel: advice.riskLevel,
      recommendedAction: advice.action
    }
  }
  
  // 新增：獲取詳細的交易時段分析
  getTradingTimeAnalysis(date: Date = new Date()): {
    recommendedTimes: Array<{time: string, description: string, reason: string}>
    avoidTimes: Array<{time: string, description: string, reason: string}>
  } {
    const lunarData = this.getLunarData(date)
    const dayGan = lunarData.dayGanZhi[0]
    
    // 獲取吉時
    const luckyHours = this.getLuckyHours(dayGan)
    
    // 台灣股市交易時間：09:00-13:30
    const tradingHours = [
      { time: '09:00-10:00', hour: '巳', name: '巳時', description: '早盤交易' },
      { time: '10:00-11:00', hour: '巳', name: '巳時', description: '上午盤中' },
      { time: '11:00-12:00', hour: '午', name: '午時', description: '午盤交易' },
      { time: '12:00-13:00', hour: '午', name: '午時', description: '午盤後段' },
      { time: '13:00-13:30', hour: '未', name: '未時', description: '收盤交易' }
    ]
    
    const recommendedTimes = []
    const avoidTimes = []
    
    for (const period of tradingHours) {
      const isLucky = luckyHours.includes(period.hour)
      const reason = isLucky 
        ? `${period.name}為今日吉時，適合進場操作`
        : `${period.name}為今日平時或凶時，宜謹慎觀望`
      
      if (isLucky) {
        recommendedTimes.push({
          time: period.time,
          description: period.description,
          reason
        })
      } else {
        avoidTimes.push({
          time: period.time,
          description: period.description,
          reason
        })
      }
    }
    
    return { recommendedTimes, avoidTimes }
  }
  
  // 新增：獲取吉時地支
  private getLuckyHours(dayGan: string): string[] {
    // 根據日干計算吉時，這個是傳統的時辰吉凶計算
    const luckyHourMap: { [key: string]: string[] } = {
      '甲': ['子', '卯', '午', '酉'], // 甲日：子卯午酉吉
      '乙': ['丑', '辰', '未', '戌'], // 乙日：辰戌丑未吉
      '丙': ['寅', '巳', '申', '亥'], // 丙日：寅申巳亥吉
      '丁': ['卯', '午', '酉', '子'], // 丁日：卯酉子午吉
      '戊': ['辰', '未', '戌', '丑'], // 戊日：辰戌丑未吉
      '己': ['巳', '申', '亥', '寅'], // 己日：巳亥寅申吉
      '庚': ['午', '酉', '子', '卯'], // 庚日：午子卯酉吉
      '辛': ['未', '戌', '丑', '辰'], // 辛日：未丑辰戌吉
      '壬': ['申', '亥', '寅', '巳'], // 壬日：申寅巳亥吉
      '癸': ['酉', '子', '卯', '午']  // 癸日：酉卯午子吉
    }
    
    return luckyHourMap[dayGan] || []
  }
  
  private calculateGanZhiScore(yearGanZhi: string, dayGanZhi: string): number {
    // 簡化的天干地支吉凶評分
    const luckyGan = ['甲', '乙', '丙', '丁', '戊']
    const luckyZhi = ['子', '寅', '卯', '午', '未', '酉']
    
    let score = 50 // 基礎分數
    
    if (luckyGan.includes(yearGanZhi[0])) score += 10
    if (luckyZhi.includes(yearGanZhi[1])) score += 10
    if (luckyGan.includes(dayGanZhi[0])) score += 15
    if (luckyZhi.includes(dayGanZhi[1])) score += 15
    
    return Math.min(100, Math.max(0, score))
  }
  
  private calculateYiJiScore(yi: string[], ji: string[]): number {
    const investmentYi = ['開市', '交易', '立券', '納財', '求財']
    const investmentJi = ['破財', '大耗', '劫煞', '災煞']
    
    let score = 50
    
    yi.forEach(item => {
      if (investmentYi.some(lucky => item.includes(lucky))) {
        score += 10
      }
    })
    
    ji.forEach(item => {
      if (investmentJi.some(unlucky => item.includes(unlucky))) {
        score -= 15
      }
    })
    
    return Math.min(100, Math.max(0, score))
  }
  
  private generateAdvice(score: number, lunarData: LunarData): {
    text: string
    riskLevel: 'low' | 'medium' | 'high'
    action: 'buy' | 'sell' | 'hold' | 'observe'
  } {
    if (score >= 80) {
      return {
        text: `今日${lunarData.ganZhi}，天時地利，適合積極投資。建議把握機會進場。`,
        riskLevel: 'low',
        action: 'buy'
      }
    } else if (score >= 60) {
      return {
        text: `今日運勢平穩，適合持有現有部位，小量加減碼。`,
        riskLevel: 'medium',
        action: 'hold'
      }
    } else if (score >= 40) {
      return {
        text: `今日宜觀望，避免大額交易，可考慮減少風險部位。`,
        riskLevel: 'medium',
        action: 'observe'
      }
    } else {
      return {
        text: `今日運勢不佳，建議減倉避險，暫停新投資計畫。`,
        riskLevel: 'high',
        action: 'sell'
      }
    }
  }
  
  private getLuckyTime(dayGanZhi: string): string {
    // 基於日干支推算吉時
    const timeMap: { [key: string]: string } = {
      '甲': '卯時 (05:00-07:00)',
      '乙': '辰時 (07:00-09:00)',
      '丙': '午時 (11:00-13:00)',
      '丁': '未時 (13:00-15:00)',
      '戊': '申時 (15:00-17:00)',
      '己': '酉時 (17:00-19:00)',
      '庚': '戌時 (19:00-21:00)',
      '辛': '亥時 (21:00-23:00)',
      '壬': '子時 (23:00-01:00)',
      '癸': '丑時 (01:00-03:00)'
    }
    
    return timeMap[dayGanZhi[0]] || '午時 (11:00-13:00)'
  }
  
  private getLuckyDirection(dayGanZhi: string): string {
    const directionMap: { [key: string]: string } = {
      '甲': '東方',
      '乙': '東南',
      '丙': '南方',
      '丁': '西南',
      '戊': '中央',
      '己': '中央',
      '庚': '西方',
      '辛': '西北',
      '壬': '北方',
      '癸': '東北'
    }
    
    return directionMap[dayGanZhi[0]] || '東方'
  }
  
  clearCache(): void {
    console.log('LunarService - 清除快取')
    this.cache.clear()
  }
}

export const lunarService = new LunarService()