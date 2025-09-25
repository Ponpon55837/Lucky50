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