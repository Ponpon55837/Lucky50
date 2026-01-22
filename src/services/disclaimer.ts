import type { DisclaimerLevel, EnhancedFortuneData } from '@/types'

export class DisclaimerService {
  // 免責聲明模板庫
  private static readonly DISCLAIMER_TEMPLATES = {
    low: [
      '本系統提供的運勢分析僅供參考，不構成任何投資建議。',
      '市場存在波動風險，投資決策應基於個人財務狀況和專業建議。',
    ],
    medium: [
      '本系統運勢分析基於傳統農民曆理論，僅供娛樂參考使用。',
      '投資有風險，過往績效不保證未來表現，請謹慎評估。',
      '建議在做出投資決定前，諮詢專業理財顧問。',
    ],
    high: [
      '⚠️ 重要提醒：本系統所有分析結果均不構成投資建議或買賣推薦。',
      '0050 ETF 價格波動可能導致本金損失，投資前請充分了解產品風險。',
      '運勢分析僅為傳統文化元素，與實際投資表現無直接關聯。',
      '請勿根據本系統分析做出重大財務決策，應基於個人風險承受能力。',
    ],
    critical: [
      '🚨 重要免責聲明：本系統提供之所有內容，包括但不限於運勢分析、投資建議等，均不構成任何形式的投資建議。',
      '投資涉及風險，本金可能遭受損失。0050 ETF 價格受多種因素影響，歷史表現不保證未來結果。',
      '本系統採用傳統農民曆、生肖、五行等文化元素進行分析，這些方法缺乏科學驗證，僅供文化娛樂參考。',
      '使用者應充分了解自身財務狀況、投資目標和風險承受能力，並在必要時尋求獨立專業意見。',
      '本系統開發團隊不對因使用本系統資訊所造成的任何直接或間接損失承擔責任。',
      '如無法理解或同意本免責聲明，請立即停止使用本系統。',
    ],
  } as const

  /**
   * 根據投資建議強度決定免責聲明級別
   */
  private static determineDisclaimerLevel(
    investmentScore: number,
    recommendation: 'BUY' | 'HOLD' | 'SELL'
  ): DisclaimerLevel['level'] {
    // 買進建議需要更強的免責聲明
    if (recommendation === 'BUY') {
      return investmentScore >= 80 ? 'critical' : 'high'
    }

    // 賣出建議也需要較強的免責聲明
    if (recommendation === 'SELL') {
      return 'medium'
    }

    // 持有建議使用中等強度
    return investmentScore >= 60 ? 'medium' : 'low'
  }

  /**
   * 生成免責聲明內容
   */
  private static generateDisclaimerMessages(
    level: DisclaimerLevel['level'],
    investmentScore: number
  ): string[] {
    const baseMessages: string[] = [...this.DISCLAIMER_TEMPLATES[level]]

    // 根據分數添加特定訊息
    if (investmentScore >= 80) {
      baseMessages.push('高運勢分數僅代表演算法計算結果，不保證實際投資表現。')
    }

    if (investmentScore <= 40) {
      baseMessages.push('低運勢分數不應作為避開投資機會的唯一依據。')
    }

    return baseMessages
  }

  /**
   * 判斷是否需要用戶確認
   */
  private static requiresAcknowledgment(
    level: DisclaimerLevel['level'],
    _recommendation: 'BUY' | 'HOLD' | 'SELL'
  ): boolean {
    // 只有買進建議且高運勢時需要明確確認
    return level === 'critical' || level === 'high'
  }

  /**
   * 創建免責聲明對象
   */
  static createDisclaimer(
    investmentScore: number,
    recommendation: 'BUY' | 'HOLD' | 'SELL'
  ): DisclaimerLevel {
    const level = this.determineDisclaimerLevel(investmentScore, recommendation)
    const messages = this.generateDisclaimerMessages(level, investmentScore)
    const requiresAcknowledgment = this.requiresAcknowledgment(level, recommendation)

    return {
      level,
      messages,
      requiresAcknowledgment,
    }
  }

  /**
   * 為運勢數據添加免責聲明
   */
  static enhanceFortuneData(fortuneData: EnhancedFortuneData): EnhancedFortuneData {
    fortuneData.disclaimer = this.createDisclaimer(
      fortuneData.investmentScore,
      fortuneData.recommendation
    )

    return fortuneData
  }

  /**
   * 檢查是否需要強制顯示免責聲明
   */
  static shouldForceDisplay(disclaimer: DisclaimerLevel, lastAcknowledgment?: string): boolean {
    if (!disclaimer.requiresAcknowledgment) {
      return false
    }

    // 如果沒有確認記錄，強制顯示
    if (!lastAcknowledgment) {
      return true
    }

    // 如果超過7天未確認，強制顯示
    const lastAck = new Date(lastAcknowledgment)
    const now = new Date()
    const daysSinceAck = (now.getTime() - lastAck.getTime()) / (1000 * 60 * 60 * 24)

    return daysSinceAck > 7
  }

  /**
   * 取得用戶確認狀態
   */
  static getUserAcknowledgmentStatus(
    userId: string,
    disclaimerLevel: DisclaimerLevel['level']
  ): string | null {
    const key = `disclaimer_ack_${userId}_${disclaimerLevel}`
    return localStorage.getItem(key)
  }

  /**
   * 儲存用戶確認狀態
   */
  static saveUserAcknowledgment(userId: string, disclaimerLevel: DisclaimerLevel['level']): void {
    const key = `disclaimer_ack_${userId}_${disclaimerLevel}`
    const timestamp = new Date().toISOString()
    localStorage.setItem(key, timestamp)
  }
}
