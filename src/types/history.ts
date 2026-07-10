/**
 * 運勢歷史記錄型別定義
 * 提供結構化的運勢計算歷史，支援 IndexedDB 持久化
 */

/**
 * 運勢歷史記錄
 */
export interface FortuneRecord {
  /** 記錄 ID（時間戳） */
  id: number
  /** 運勢計算日期（YYYY-MM-DD） */
  date: string
  /** 計算時間戳 */
  timestamp: number
  /** 總體運勢分數 */
  overallScore: number
  /** 投資運勢分數 */
  investmentScore: number
  /** 投資建議 */
  recommendation: 'BUY' | 'HOLD' | 'SELL'
  /** 五行能量 */
  elements: {
    metal: number
    wood: number
    water: number
    fire: number
    earth: number
  }
  /** 農民曆摘要 */
  lunarSummary?: string
  /** 用戶資料雜湊值（用於區分不同用戶的記錄） */
  userProfileHash: string
}

/**
 * 歷史查詢選項
 */
export interface HistoryQueryOptions {
  /** 頁碼（0-indexed） */
  pageIndex: number
  /** 每頁筆數 */
  pageSize: number
  /** 關鍵字搜尋 */
  keyword?: string
  /** 日期範圍 */
  dateRange?: { start: string; end: string }
  /** 分數範圍 */
  scoreRange?: { min: number; max: number }
  /** 推薦類型篩選 */
  recommendation?: 'BUY' | 'HOLD' | 'SELL'
  /** 排序欄位 */
  sortBy?: 'date' | 'score'
  /** 是否降序 */
  sortDesc?: boolean
}

/**
 * 歷史查詢結果
 */
export interface HistoryQueryResult {
  /** 查詢結果記錄 */
  records: FortuneRecord[]
  /** 總筆數 */
  total: number
  /** 當前頁碼 */
  pageIndex: number
  /** 每頁筆數 */
  pageSize: number
}

/**
 * 歷史統計資訊
 */
export interface HistoryStats {
  /** 總記錄數 */
  totalRecords: number
  /** 日期範圍 */
  dateRange: { earliest: string; latest: string } | null
  /** 平均分數 */
  averageScore: number
  /** 推薦分佈 */
  recommendationDistribution: {
    BUY: number
    HOLD: number
    SELL: number
  }
}
