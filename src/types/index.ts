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
  /** 扣除交易成本後的期間累積報酬（%） */
  totalReturn: number
  /** 未扣除交易成本的期間累積報酬（%） */
  grossTotalReturn: number
  /** 年化報酬（%） */
  annualReturn: number
  /** 最大回撤（%，正值） */
  maxDrawdown: number
  sharpeRatio: number
  /** 有持倉曝險的交易日中，策略淨報酬為正的比例（%） */
  winRate: number
  /** 有持倉曝險的交易日數，含開盤賣出前仍持有的日子 */
  trades: number
  /** 買入與賣出的合計次數 */
  orders: number
}

export interface BacktestCosts {
  /** 各邊券商手續費，以基點表示（1 基點 = 0.01%） */
  commissionBps: number
  /** 賣出時的 ETF 證交稅，以基點表示 */
  sellTaxBps: number
  /** 各邊向不利方向的開盤成交價滑價，以基點表示 */
  slippageBps: number
}

export interface BacktestResults {
  lunar: StrategyResult
  buyHold: StrategyResult
  dca: StrategyResult
  costs: BacktestCosts
  /** 開盤或收盤價缺漏而無法執行交易的資料列數 */
  unexecutableDays: number
  firstDate: string
  lastDate: string
}

// FinMind API 相關型別
export interface FinMindDataItem {
  date: string
  stock_id?: string
  open: string | number
  max?: string | number
  high?: string | number
  min?: string | number
  low?: string | number
  close: string | number
  Trading_Volume?: string | number
  volume?: string | number
  /** 對前一交易日收盤的漲跌 */
  spread?: string | number
}

/** FinMind TaiwanStockSplitPrice：分割前收盤價與分割後參考價 */
export interface FinMindSplitItem {
  date: string
  stock_id?: string
  before_price: number
  after_price: number
}

/** FinMind TaiwanStockDividendResult：除權息前收盤價與除權息參考價 */
export interface FinMindDividendResultItem {
  date: string
  stock_id?: string
  before_price: number
  reference_price: number
}

export interface FinMindAPIResponse {
  status: number
  data: FinMindDataItem[]
  msg?: string
}
