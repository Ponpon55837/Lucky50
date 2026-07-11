import type { UserProfileCompat } from '@/services/integratedFortune'
import type { LunarData } from '@/services/lunar'
import type { PersonalBaZi, ElementsEnergy } from '@/types'

// 命理引擎計算結果
export interface MetaphysicsResult {
  /** 引擎 ID */
  engineId?: string
  /** 引擎名稱 */
  engineName: string
  /** 對運勢分數的貢獻 (0-100) */
  score: number
  /** 計算信心度 (0-1) */
  confidence?: number
  /** 結果摘要 */
  summary?: string
  /** 詳細資料 */
  details?: Record<string, unknown>
  /** 附加資訊 */
  metadata?: Record<string, unknown>
  /** 五行能量調整 */
  elementAdjustments?: Partial<ElementsEnergy>
  /** 幸運方位 */
  luckyDirection?: string
  /** 避開方位 */
  avoidDirection?: string
  /** 幸運元素 */
  luckyElements?: string[]
  /** 避開元素 */
  avoidElements?: string[]
  /** 具體建議 */
  advice?: string[]
  /** 性格/風格描述（十神/紫微用） */
  personality?: string
  /** 特殊警示 */
  warnings?: string[]
  /** 機會提醒 */
  opportunities?: string[]
  /** 投資建議調整 */
  investmentAdjustment?: {
    recommendation?: 'BUY' | 'SELL' | 'HOLD' | 'OBSERVE'
    riskLevel?: 'low' | 'medium' | 'high'
    scoreAdjustment?: number
  }
}

// 命理引擎介面
export interface MetaphysicsEngine {
  /** 引擎唯一 ID（用於 localStorage 設定對照） */
  readonly engineId: string
  /** 引擎顯示名稱 */
  readonly name: string
  /** 引擎描述 */
  readonly description: string
  /** 引擎版本 */
  readonly version: string

  /**
   * 執行命理計算
   * @param profile 使用者資料
   * @param date 計算日期
   * @param lunarData 農民曆資料
   * @param personalBaZi 個人八字
   * @param elements 當前五行能量
   */
  calculate(
    profile: UserProfileCompat,
    date: Date,
    lunarData: LunarData,
    personalBaZi: PersonalBaZi,
    elements: ElementsEnergy
  ): MetaphysicsResult

  /** 取得引擎權重 (0-100) */
  getWeight(): number
  /** 設定引擎權重 */
  setWeight(weight: number): void
  /** 引擎是否啟用 */
  isEnabled(): boolean
  /** 設定引擎啟用狀態 */
  setEnabled(enabled: boolean): void
}

// 命理引擎設定
export interface MetaphysicsEngineSettings {
  enabled: boolean
  weight: number
}

// 完整的命理設定
export interface MetaphysicsSettings {
  engines: Record<string, MetaphysicsEngineSettings>
}
