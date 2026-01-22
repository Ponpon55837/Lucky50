import type { UserFeedback } from '@/types'

export interface FeedbackAnalytics {
  totalFeedbacks: number
  averagePredictionAccuracy: number
  averageAdviceHelpfulness: number
  improvementSuggestions: string[]
  commonConcerns: string[]
  feedbacksByTimeframe: {
    [timeframe: string]: number
  }
}

export class UserFeedbackService {
  private static readonly STORAGE_KEY = 'lucky50_user_feedback'
  private static readonly MAX_FEEDBACKS = 1000 // 最多儲存 1000 則回饋

  /**
   * 提交用戶回饋
   */
  static submitFeedback(feedback: Omit<UserFeedback, 'id' | 'timestamp'>): string {
    try {
      const existingFeedbacks = this.getAllFeedbacks()
      const newFeedback: UserFeedback = {
        ...feedback,
        id: this.generateFeedbackId(),
        timestamp: new Date().toISOString(),
      }

      existingFeedbacks.push(newFeedback)

      // 限制回饋數量
      if (existingFeedbacks.length > this.MAX_FEEDBACKS) {
        existingFeedbacks.splice(0, existingFeedbacks.length - this.MAX_FEEDBACKS)
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existingFeedbacks))

      // 分析回饋內容
      this.analyzeFeedbackContent(newFeedback)

      return newFeedback.id
    } catch (error) {
      console.error('Failed to submit feedback:', error)
      throw new Error('回饋提交失敗')
    }
  }

  /**
   * 獲取所有回饋
   */
  static getAllFeedbacks(): UserFeedback[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.warn('Failed to load feedbacks:', error)
      return []
    }
  }

  /**
   * 獲取特定用戶的回饋
   */
  static getUserFeedbacks(userId: string): UserFeedback[] {
    return this.getAllFeedbacks().filter(feedback => feedback.userId === userId)
  }

  /**
   * 獲取回饋分析數據
   */
  static getFeedbackAnalytics(): FeedbackAnalytics {
    const feedbacks = this.getAllFeedbacks()

    if (feedbacks.length === 0) {
      return {
        totalFeedbacks: 0,
        averagePredictionAccuracy: 0,
        averageAdviceHelpfulness: 0,
        improvementSuggestions: [],
        commonConcerns: [],
        feedbacksByTimeframe: {},
      }
    }

    const totalFeedbacks = feedbacks.length
    const averagePredictionAccuracy =
      feedbacks.reduce((sum, f) => sum + f.predictionAccuracy, 0) / totalFeedbacks
    const averageAdviceHelpfulness =
      feedbacks.reduce((sum, f) => sum + f.adviceHelpfulness, 0) / totalFeedbacks

    // 分析改善建議
    const improvementSuggestions = this.extractCommonPhrases(
      feedbacks.map(f => f.comments).filter(Boolean) as string[]
    )

    // 分析關注重點
    const commonConcerns = this.analyzeConcerns(feedbacks)

    // 按時間框架統計
    const feedbacksByTimeframe = this.groupFeedbacksByTimeframe(feedbacks)

    return {
      totalFeedbacks,
      averagePredictionAccuracy,
      averageAdviceHelpfulness,
      improvementSuggestions,
      commonConcerns,
      feedbacksByTimeframe,
    }
  }

  /**
   * 清除舊回饋（超過6個月）
   */
  static cleanupOldFeedbacks(): number {
    try {
      const feedbacks = this.getAllFeedbacks()
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

      const validFeedbacks = feedbacks.filter(feedback => {
        return new Date(feedback.timestamp) > sixMonthsAgo
      })

      const removedCount = feedbacks.length - validFeedbacks.length
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(validFeedbacks))

      return removedCount
    } catch (error) {
      console.error('Failed to cleanup old feedbacks:', error)
      return 0
    }
  }

  /**
   * 匯出回饋數據（用於分析）
   */
  static exportFeedbackData(): string {
    const analytics = this.getFeedbackAnalytics()
    return JSON.stringify(analytics, null, 2)
  }

  /**
   * 產生回饋ID
   */
  private static generateFeedbackId(): string {
    return `fb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 分析回饋內容
   */
  private static analyzeFeedbackContent(feedback: UserFeedback): void {
    if (!feedback.comments) return

    const comments = feedback.comments.toLowerCase()

    // 檢查是否包含關鍵詞
    const keywords = {
      accuracy: ['準確', '不準確', '預測', '猜測'],
      usefulness: ['有用', '沒用', '幫助', '建議'],
      transparency: ['透明', '清楚', '複雜', '不懂'],
      safety: ['風險', '安全', '警告', '免責'],
      education: ['學習', '知識', '教育', '說明'],
    }

    Object.entries(keywords).forEach(([category, words]) => {
      if (words.some(word => comments.includes(word))) {
        console.log(`Feedback categorized as ${category}:`, feedback.comments)
        // 這裡可以發送到分析服務
      }
    })
  }

  /**
   * 提取常見詞語
   */
  private static extractCommonPhrases(comments: string[]): string[] {
    if (comments.length === 0) return []

    // 簡單的詞頻分析
    const wordCount: { [word: string]: number } = {}
    const stopWords = new Set([
      '的',
      '是',
      '在',
      '了',
      '有',
      '和',
      '與',
      '或',
      '但',
      '如果',
      '就',
      '都',
      '也',
    ])

    comments.forEach(comment => {
      const words = comment
        .replace(/[，。！？；：「」【】]/g, ' ')
        .split(' ')
        .filter(word => word.length > 1 && !stopWords.has(word))

      words.forEach(word => {
        wordCount[word] = (wordCount[word] || 0) + 1
      })
    })

    // 返回出現頻率最高的詞語
    return Object.entries(wordCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word)
  }

  /**
   * 分析關注重點
   */
  private static analyzeConcerns(feedbacks: UserFeedback[]): string[] {
    const concerns: string[] = []

    feedbacks.forEach(feedback => {
      if (feedback.predictionAccuracy <= 2) {
        concerns.push('預測準確性')
      }
      if (feedback.adviceHelpfulness <= 2) {
        concerns.push('建議實用性')
      }
      if (feedback.comments && feedback.comments.includes('風險')) {
        concerns.push('風險管理')
      }
      if (feedback.comments && feedback.comments.includes('教育')) {
        concerns.push('教育內容')
      }
    })

    // 統計關注重點頻率
    const concernCount: { [concern: string]: number } = {}
    concerns.forEach(concern => {
      concernCount[concern] = (concernCount[concern] || 0) + 1
    })

    return Object.entries(concernCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([concern]) => concern)
  }

  /**
   * 按時間框架分組回饋
   */
  private static groupFeedbacksByTimeframe(feedbacks: UserFeedback[]): {
    [timeframe: string]: number
  } {
    const grouped: { [timeframe: string]: number } = {}

    feedbacks.forEach(feedback => {
      const date = new Date(feedback.timestamp)
      const timeframe = this.getTimeframe(date)
      grouped[timeframe] = (grouped[timeframe] || 0) + 1
    })

    return grouped
  }

  /**
   * 獲取時間框架標籤
   */
  private static getTimeframe(date: Date): string {
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 7) return '本週'
    if (diffDays < 30) return '本月'
    if (diffDays < 90) return '近三個月'
    return '更早'
  }

  /**
   * 獲取改善建議
   */
  static getImprovementSuggestions(): string[] {
    const analytics = this.getFeedbackAnalytics()
    const suggestions: string[] = []

    // 基於預測準確性
    if (analytics.averagePredictionAccuracy < 3) {
      suggestions.push('考慮改進運勢計算演算法，提高預測準確性')
    }

    // 基於建議有幫助程度
    if (analytics.averageAdviceHelpfulness < 3) {
      suggestions.push('優化投資建議的實用性和可操作性')
    }

    // 基於常見關注點
    analytics.commonConcerns.forEach(concern => {
      switch (concern) {
        case '預測準確性':
          suggestions.push('加強演算法透明度，解釋預測依據')
          break
        case '建議實用性':
          suggestions.push('提供更實際的投資行動建議')
          break
        case '風險管理':
          suggestions.push('強化風險警告和免責聲明')
          break
        case '教育內容':
          suggestions.push('增加更多基礎金融和農民曆知識')
          break
      }
    })

    return suggestions
  }

  /**
   * 檢查是否應該請求回饋
   */
  static shouldRequestFeedback(userId: string, fortuneDate: string): boolean {
    const userFeedbacks = this.getUserFeedbacks(userId)
    const existingFeedback = userFeedbacks.find(f => f.fortuneDate === fortuneDate)

    // 如果今天已經有回饋，不再請求
    if (existingFeedback) return false

    // 如果用戶過去7天內已有回饋，暫時不請求
    const recentFeedback = userFeedbacks.find(f => {
      const feedbackDate = new Date(f.timestamp)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      return feedbackDate > sevenDaysAgo
    })

    return !recentFeedback
  }
}
