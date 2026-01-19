export interface UserProfile {
  name: string
  birthDate: string
  birthTime: string
  zodiac: string
  element: string
  luckyColors: string[]
  luckyNumbers: number[]
}

export interface FortuneData {
  date: string
  overallScore: number
  investmentScore: number
  recommendation: 'BUY' | 'HOLD' | 'SELL'
  advice: string
  luckyTime: string
  avoidTime: string
  elements: {
    metal: number
    wood: number
    water: number
    fire: number
    earth: number
  }
}

export interface ETFData {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  change: number
  changePercent: number
}

export interface MarketSentiment {
  bullish: number
  bearish: number
  neutral: number
  confidence: number
}

export interface InvestmentRecommendation {
  action: 'BUY' | 'HOLD' | 'SELL'
  confidence: number
  targetPrice: number
  stopLoss: number
  reasoning: string[]
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
}

// 八字相關型別
export interface PersonalBaZi {
  yearGanZhi: string
  monthGanZhi: string
  dayGanZhi: string
  hourGanZhi: string
  zodiac: string
  element: string
  naYin: string
}

// 五行能量型別
export interface ElementsEnergy {
  metal: number
  wood: number
  water: number
  fire: number
  earth: number
}

// lunar-javascript 庫的型別定義
export interface LunarObject {
  getFestivals(): string[]
  getJieQi?(): string
  getJieQiName?(): string
  getDayGan(): string
  getDayZhi(): string
  getMonthGan(): string
  getMonthZhi(): string
  getYearGan(): string
  getYearZhi(): string
  getHourGan?(): string
  getHourZhi?(): string
  [key: string]: unknown
}

export interface SolarObject {
  getFestivals(): string[]
  getXingZuo(): string
  getLunar(): LunarObject
  [key: string]: unknown
}

// 回測結果型別
export interface StrategyResult {
  totalReturn: number
  annualReturn: number
  maxDrawdown: number
  sharpeRatio: number
  winRate: number
  trades?: number
  avgReturn?: number
}

export interface BacktestResults {
  lunar: StrategyResult
  buyHold: StrategyResult
  dca: StrategyResult
}

// FinMind API 相關型別
export interface FinMindDataItem {
  date: string
  open: string
  max?: string
  high?: string
  min?: string
  low?: string
  close: string
  Trading_Volume?: string
  volume?: string
}

export interface FinMindAPIResponse {
  status: number
  data: FinMindDataItem[]
  msg?: string
}
