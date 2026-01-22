import type { UserEmpowerment } from '@/types'

export class UserEmpowermentService {
  private static readonly STORAGE_KEY = 'lucky50_user_empowerment'

  // 預設設定
  private static readonly DEFAULT_SETTINGS: UserEmpowerment = {
    adjustableWeights: {
      zodiacWeight: 0.3, // 生肖影響權重
      lunarWeight: 0.5, // 農民曆影響權重
      marketWeight: 0.2, // 市場數據影響權重
      personalWeight: 0.3, // 個人八字影響權重
      seasonalWeight: 0.2, // 季節性因素影響權重
    },
    riskTolerance: 'moderate',
    customSettings: {
      enableFortuneAnalysis: true,
      enableEducationalContent: true,
      enableDisclaimerReminder: true,
      showAdvancedFeatures: false,
      preferredLanguage: 'zh-TW',
      notificationFrequency: 'daily',
      dataRetentionDays: 30,
    },
  }

  /**
   * 獲取用戶設定
   */
  static getUserSettings(): UserEmpowerment {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        const settings = JSON.parse(stored)
        // 合併預設設定，確保所有欄位都存在
        return this.mergeWithDefaults(settings)
      }
    } catch (error) {
      console.warn('Failed to load user settings:', error)
    }

    return { ...this.DEFAULT_SETTINGS }
  }

  /**
   * 儲存用戶設定
   */
  static saveUserSettings(settings: Partial<UserEmpowerment>): void {
    try {
      const currentSettings = this.getUserSettings()
      const updatedSettings = {
        ...currentSettings,
        ...settings,
        adjustableWeights: {
          ...currentSettings.adjustableWeights,
          ...settings.adjustableWeights,
        },
        customSettings: {
          ...currentSettings.customSettings,
          ...settings.customSettings,
        },
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedSettings))
    } catch (error) {
      console.error('Failed to save user settings:', error)
    }
  }

  /**
   * 重置為預設設定
   */
  static resetToDefaults(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY)
    } catch (error) {
      console.error('Failed to reset user settings:', error)
    }
  }

  /**
   * 驗證權重設定
   */
  static validateWeights(weights: UserEmpowerment['adjustableWeights']): boolean {
    const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0)
    return Math.abs(total - 1.0) < 0.01 // 允許 0.01 的誤差
  }

  /**
   * 正規化權重（確保總和為1）
   */
  static normalizeWeights(
    weights: UserEmpowerment['adjustableWeights']
  ): UserEmpowerment['adjustableWeights'] {
    const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0)
    if (total === 0) return { ...this.DEFAULT_SETTINGS.adjustableWeights }

    const normalized: UserEmpowerment['adjustableWeights'] = {}
    Object.entries(weights).forEach(([key, value]) => {
      normalized[key] = value / total
    })

    return normalized
  }

  /**
   * 獲取權重建議
   */
  static getWeightRecommendations(
    riskTolerance: UserEmpowerment['riskTolerance']
  ): UserEmpowerment['adjustableWeights'] {
    const recommendations = {
      conservative: {
        zodiacWeight: 0.2,
        lunarWeight: 0.3,
        marketWeight: 0.4,
        personalWeight: 0.2,
        seasonalWeight: 0.1,
      },
      moderate: {
        zodiacWeight: 0.3,
        lunarWeight: 0.5,
        marketWeight: 0.2,
        personalWeight: 0.3,
        seasonalWeight: 0.2,
      },
      aggressive: {
        zodiacWeight: 0.4,
        lunarWeight: 0.6,
        marketWeight: 0.1,
        personalWeight: 0.4,
        seasonalWeight: 0.3,
      },
    }

    return recommendations[riskTolerance] || recommendations.moderate
  }

  /**
   * 獲取風險承受度說明
   */
  static getRiskToleranceDescription(risk: UserEmpowerment['riskTolerance']): string {
    const descriptions = {
      conservative: '保守型：偏好穩健策略，重視資本保全，適合低風險投資組合。',
      moderate: '穩健型：平衡風險與回報，可接受適度波動，追求長期穩定成長。',
      aggressive: '積極型：願意承擔較高風險以追求更高回報，能承受較大市場波動。',
    }

    return descriptions[risk] || descriptions.moderate
  }

  /**
   * 檢查設定是否已修改
   */
  static isModified(): boolean {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return !!stored
    } catch {
      return false
    }
  }

  /**
   * 匯出設定
   */
  static exportSettings(): string {
    const settings = this.getUserSettings()
    return JSON.stringify(settings, null, 2)
  }

  /**
   * 匯入設定
   */
  static importSettings(settingsJson: string): boolean {
    try {
      const settings = JSON.parse(settingsJson)

      // 驗證設定格式
      if (!this.validateImportedSettings(settings)) {
        throw new Error('Invalid settings format')
      }

      // 正規化權重
      if (settings.adjustableWeights) {
        settings.adjustableWeights = this.normalizeWeights(settings.adjustableWeights)
      }

      this.saveUserSettings(settings)
      return true
    } catch (error) {
      console.error('Failed to import settings:', error)
      return false
    }
  }

  /**
   * 驗證匯入的設定
   */
  private static validateImportedSettings(settings: unknown): boolean {
    if (!settings || typeof settings !== 'object') return false

    const settingsObj = settings as Record<string, unknown>

    // 檢查必要的結構
    if (settingsObj.adjustableWeights && typeof settingsObj.adjustableWeights === 'object') {
      const weights = settingsObj.adjustableWeights as Record<string, unknown>
      const requiredWeights = [
        'zodiacWeight',
        'lunarWeight',
        'marketWeight',
        'personalWeight',
        'seasonalWeight',
      ]
      return requiredWeights.every(
        weight =>
          typeof weights[weight] === 'number' &&
          (weights[weight] as number) >= 0 &&
          (weights[weight] as number) <= 1
      )
    }

    return true
  }

  /**
   * 合併預設設定
   */
  private static mergeWithDefaults(settings: unknown): UserEmpowerment {
    const settingsObj = settings as Partial<UserEmpowerment>
    return {
      adjustableWeights: {
        ...this.DEFAULT_SETTINGS.adjustableWeights,
        ...settingsObj.adjustableWeights,
      },
      riskTolerance: settingsObj.riskTolerance || this.DEFAULT_SETTINGS.riskTolerance,
      customSettings: {
        ...this.DEFAULT_SETTINGS.customSettings,
        ...settingsObj.customSettings,
      },
    }
  }

  /**
   * 獲取功能啟用狀態
   */
  static isFeatureEnabled(feature: keyof UserEmpowerment['customSettings']): boolean {
    const settings = this.getUserSettings()
    return !!settings.customSettings[feature]
  }

  /**
   * 切換功能啟用狀態
   */
  static toggleFeature(feature: keyof UserEmpowerment['customSettings']): void {
    const settings = this.getUserSettings()
    const currentValue = !!settings.customSettings[feature]

    this.saveUserSettings({
      customSettings: {
        [feature]: !currentValue,
      },
    })
  }
}
