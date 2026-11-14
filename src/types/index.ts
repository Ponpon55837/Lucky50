export interface UserProfile {
  /** 姓氏（支援複姓） */
  surname: string
  /** 名字 */
  givenName: string
  /** 完整姓名（自動組合 = surname + givenName） */
  name: string
  birthDate: string
  birthTime: string
  zodiac: string
  element: string
  /** 姓名學五行（由姓名筆畫計算） */
  nameElement: string
  /** 姓名學總筆畫數 */
  nameStrokes: number
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
}

// 五行能量型別
export interface ElementsEnergy {
  metal: number
  wood: number
  water: number
  fire: number
  earth: number
}

// 回測結果型別
export interface StrategyResult {
  /** 期間累積報酬（%） */
  totalReturn: number
  /** 年化報酬（%） */
  annualReturn: number
  /** 最大回撤（%，正值） */
  maxDrawdown: number
  sharpeRatio: number
  /** 持有日中收紅的比例（%） */
  winRate: number
  /** 持有的交易日數 */
  trades: number
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
