/**
 * 錯誤類型定義和分類系統
 * 提供統一的錯誤處理架構
 */

/**
 * 錯誤嚴重程度
 */
export enum ErrorSeverity {
  /** 資訊性訊息 - 不影響功能 */
  INFO = 'info',
  /** 警告 - 可能影響部分功能 */
  WARNING = 'warning',
  /** 錯誤 - 影響當前操作 */
  ERROR = 'error',
  /** 嚴重錯誤 - 影響整個應用 */
  CRITICAL = 'critical',
}

/**
 * 錯誤類別
 */
export enum ErrorCategory {
  /** 網路相關錯誤 */
  NETWORK = 'network',
  /** API 相關錯誤 */
  API = 'api',
  /** 驗證相關錯誤 */
  VALIDATION = 'validation',
  /** 認證相關錯誤 */
  AUTHENTICATION = 'auth',
  /** 權限相關錯誤 */
  AUTHORIZATION = 'authorization',
  /** 業務邏輯錯誤 */
  BUSINESS = 'business',
  /** 資料相關錯誤 */
  DATA = 'data',
  /** 系統相關錯誤 */
  SYSTEM = 'system',
  /** 未知錯誤 */
  UNKNOWN = 'unknown',
}

/**
 * 應用錯誤介面
 */
export interface AppError {
  /** 錯誤代碼 */
  code: string
  /** 錯誤訊息 (給用戶看的) */
  message: string
  /** 錯誤詳情 (給開發者看的) */
  details?: string
  /** 錯誤嚴重程度 */
  severity: ErrorSeverity
  /** 錯誤類別 */
  category: ErrorCategory
  /** 時間戳記 */
  timestamp: number
  /** 原始錯誤 */
  originalError?: Error | unknown
  /** 錯誤發生的路徑 */
  path?: string
  /** 相關的元數據 */
  metadata?: Record<string, unknown>
}

/**
 * 錯誤顯示選項
 */
export interface ErrorDisplayOptions {
  /** 是否顯示給用戶 */
  showToUser: boolean
  /** 顯示方式: toast (輕量提示), modal (彈窗), inline (內嵌) */
  displayType: 'toast' | 'modal' | 'inline'
  /** 自動關閉時間 (毫秒), 0 表示不自動關閉 */
  autoCloseDuration?: number
  /** 是否可重試 */
  retryable?: boolean
  /** 重試動作 */
  retryAction?: () => void | Promise<void>
  /** 自定義動作 */
  customActions?: Array<{
    label: string
    action: () => void | Promise<void>
  }>
}

/**
 * 應用錯誤類別 (自定義 Error 類)
 */
export class ApplicationError extends Error implements AppError {
  code: string
  severity: ErrorSeverity
  category: ErrorCategory
  timestamp: number
  originalError?: Error | unknown
  path?: string
  details?: string
  metadata?: Record<string, unknown>

  constructor(options: {
    code: string
    message: string
    details?: string
    severity?: ErrorSeverity
    category?: ErrorCategory
    originalError?: Error | unknown
    path?: string
    metadata?: Record<string, unknown>
  }) {
    super(options.message)
    this.name = 'ApplicationError'
    this.code = options.code
    this.details = options.details
    this.severity = options.severity || ErrorSeverity.ERROR
    this.category = options.category || ErrorCategory.UNKNOWN
    this.timestamp = Date.now()
    this.originalError = options.originalError
    this.path = options.path
    this.metadata = options.metadata

    // 保持正確的 prototype chain
    Object.setPrototypeOf(this, ApplicationError.prototype)
  }
}

/**
 * 預定義的錯誤代碼
 */
export const ErrorCodes = {
  // 網路錯誤 (NET_xxx)
  NETWORK_ERROR: 'NET_001',
  NETWORK_TIMEOUT: 'NET_002',
  NETWORK_OFFLINE: 'NET_003',

  // API 錯誤 (API_xxx)
  API_ERROR: 'API_001',
  API_TIMEOUT: 'API_002',
  API_NOT_FOUND: 'API_404',
  API_SERVER_ERROR: 'API_500',
  API_RATE_LIMIT: 'API_429',

  // 驗證錯誤 (VAL_xxx)
  VALIDATION_ERROR: 'VAL_001',
  VALIDATION_REQUIRED: 'VAL_002',
  VALIDATION_FORMAT: 'VAL_003',
  VALIDATION_RANGE: 'VAL_004',

  // 認證錯誤 (AUTH_xxx)
  AUTH_REQUIRED: 'AUTH_001',
  AUTH_INVALID: 'AUTH_002',
  AUTH_EXPIRED: 'AUTH_003',

  // 權限錯誤 (PERM_xxx)
  PERMISSION_DENIED: 'PERM_001',

  // 業務邏輯錯誤 (BIZ_xxx)
  BUSINESS_ERROR: 'BIZ_001',
  DATA_NOT_FOUND: 'BIZ_404',
  DATA_INVALID: 'BIZ_400',

  // 系統錯誤 (SYS_xxx)
  SYSTEM_ERROR: 'SYS_001',
  UNKNOWN_ERROR: 'SYS_999',
} as const

/**
 * 錯誤訊息映射 (中文友善訊息)
 */
export const ErrorMessages: Record<string, string> = {
  // 網路錯誤
  [ErrorCodes.NETWORK_ERROR]: '網路連線異常，請檢查您的網路狀態',
  [ErrorCodes.NETWORK_TIMEOUT]: '網路連線逾時，請稍後再試',
  [ErrorCodes.NETWORK_OFFLINE]: '目前處於離線狀態，請檢查網路連線',

  // API 錯誤
  [ErrorCodes.API_ERROR]: 'API 請求失敗，請稍後再試',
  [ErrorCodes.API_TIMEOUT]: 'API 請求逾時，請稍後再試',
  [ErrorCodes.API_NOT_FOUND]: '找不到請求的資源',
  [ErrorCodes.API_SERVER_ERROR]: '伺服器發生錯誤，請稍後再試',
  [ErrorCodes.API_RATE_LIMIT]: '請求次數過多，請稍後再試',

  // 驗證錯誤
  [ErrorCodes.VALIDATION_ERROR]: '輸入資料驗證失敗',
  [ErrorCodes.VALIDATION_REQUIRED]: '此欄位為必填',
  [ErrorCodes.VALIDATION_FORMAT]: '輸入格式不正確',
  [ErrorCodes.VALIDATION_RANGE]: '輸入值超出允許範圍',

  // 認證錯誤
  [ErrorCodes.AUTH_REQUIRED]: '請先登入',
  [ErrorCodes.AUTH_INVALID]: '登入資訊無效',
  [ErrorCodes.AUTH_EXPIRED]: '登入已過期，請重新登入',

  // 權限錯誤
  [ErrorCodes.PERMISSION_DENIED]: '您沒有權限執行此操作',

  // 業務邏輯錯誤
  [ErrorCodes.BUSINESS_ERROR]: '操作失敗',
  [ErrorCodes.DATA_NOT_FOUND]: '找不到相關資料',
  [ErrorCodes.DATA_INVALID]: '資料無效',

  // 系統錯誤
  [ErrorCodes.SYSTEM_ERROR]: '系統發生錯誤',
  [ErrorCodes.UNKNOWN_ERROR]: '發生未知錯誤',
}
