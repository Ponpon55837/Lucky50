/**
 * 統一錯誤處理 Composable
 * 提供全域錯誤處理、記錄和用戶通知功能
 */

import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import type { AppError, ErrorDisplayOptions, ApplicationError } from '@/types/error'
import { ErrorSeverity, ErrorCategory, ErrorCodes, ErrorMessages } from '@/types/error'
import { useToast } from '@/composables/useToast'

/**
 * 錯誤處理器實例
 */
class ErrorHandler {
  private errors = ref<AppError[]>([])
  private readonly maxErrors = 50 // 最多保存 50 個錯誤
  private toast = useToast()

  /**
   * 處理錯誤
   */
  handle(
    error: Error | ApplicationError | unknown,
    options?: Partial<ErrorDisplayOptions>
  ): AppError {
    const appError = this.normalizeError(error)
    this.recordError(appError)

    // 決定如何顯示錯誤
    const displayOptions = this.getDisplayOptions(appError, options)

    if (displayOptions.showToUser) {
      this.displayError(appError, displayOptions)
    }

    // 開發環境下在 console 輸出詳細錯誤
    if (import.meta.env.DEV) {
      console.error('[ErrorHandler]', {
        error: appError,
        originalError: appError.originalError,
      })
    }

    return appError
  }

  /**
   * 將任意錯誤轉換為 AppError
   */
  private normalizeError(error: Error | ApplicationError | unknown): AppError {
    // 如果已經是 ApplicationError，直接返回
    if (this.isApplicationError(error)) {
      return error
    }

    // 如果是標準 Error
    if (error instanceof Error) {
      return {
        code: ErrorCodes.SYSTEM_ERROR,
        message: error.message || ErrorMessages[ErrorCodes.SYSTEM_ERROR],
        details: error.stack,
        severity: ErrorSeverity.ERROR,
        category: ErrorCategory.SYSTEM,
        timestamp: Date.now(),
        originalError: error,
      }
    }

    // 處理 Axios 錯誤
    if (this.isAxiosError(error)) {
      return this.handleAxiosError(error)
    }

    // 處理未知錯誤
    return {
      code: ErrorCodes.UNKNOWN_ERROR,
      message: ErrorMessages[ErrorCodes.UNKNOWN_ERROR],
      details: String(error),
      severity: ErrorSeverity.ERROR,
      category: ErrorCategory.UNKNOWN,
      timestamp: Date.now(),
      originalError: error,
    }
  }

  /**
   * 檢查是否為 ApplicationError
   */
  private isApplicationError(error: unknown): error is ApplicationError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      'message' in error &&
      'severity' in error &&
      'category' in error
    )
  }

  /**
   * 檢查是否為 Axios 錯誤
   */
  private isAxiosError(error: unknown): error is {
    response?: { status: number; data?: unknown }
    request?: unknown
    message: string
  } {
    return (
      typeof error === 'object' && error !== null && ('response' in error || 'request' in error)
    )
  }

  /**
   * 處理 Axios 錯誤
   */
  private handleAxiosError(error: {
    response?: { status: number; data?: unknown }
    request?: unknown
    message: string
  }): AppError {
    // 有響應，但狀態碼不是 2xx
    if (error.response) {
      const status = error.response.status

      if (status === 404) {
        return {
          code: ErrorCodes.API_NOT_FOUND,
          message: ErrorMessages[ErrorCodes.API_NOT_FOUND],
          severity: ErrorSeverity.WARNING,
          category: ErrorCategory.API,
          timestamp: Date.now(),
          originalError: error,
          metadata: { status, data: error.response.data },
        }
      }

      if (status === 429) {
        return {
          code: ErrorCodes.API_RATE_LIMIT,
          message: ErrorMessages[ErrorCodes.API_RATE_LIMIT],
          severity: ErrorSeverity.WARNING,
          category: ErrorCategory.API,
          timestamp: Date.now(),
          originalError: error,
          metadata: { status },
        }
      }

      if (status >= 500) {
        return {
          code: ErrorCodes.API_SERVER_ERROR,
          message: ErrorMessages[ErrorCodes.API_SERVER_ERROR],
          severity: ErrorSeverity.ERROR,
          category: ErrorCategory.API,
          timestamp: Date.now(),
          originalError: error,
          metadata: { status },
        }
      }

      return {
        code: ErrorCodes.API_ERROR,
        message: ErrorMessages[ErrorCodes.API_ERROR],
        severity: ErrorSeverity.ERROR,
        category: ErrorCategory.API,
        timestamp: Date.now(),
        originalError: error,
        metadata: { status },
      }
    }

    // 請求已發出但沒有收到響應
    if (error.request) {
      return {
        code: ErrorCodes.NETWORK_TIMEOUT,
        message: ErrorMessages[ErrorCodes.NETWORK_TIMEOUT],
        severity: ErrorSeverity.ERROR,
        category: ErrorCategory.NETWORK,
        timestamp: Date.now(),
        originalError: error,
      }
    }

    // 請求配置錯誤
    return {
      code: ErrorCodes.NETWORK_ERROR,
      message: ErrorMessages[ErrorCodes.NETWORK_ERROR],
      severity: ErrorSeverity.ERROR,
      category: ErrorCategory.NETWORK,
      timestamp: Date.now(),
      originalError: error,
    }
  }

  /**
   * 記錄錯誤
   */
  private recordError(error: AppError): void {
    this.errors.value.unshift(error)

    // 限制錯誤數量
    if (this.errors.value.length > this.maxErrors) {
      this.errors.value = this.errors.value.slice(0, this.maxErrors)
    }
  }

  /**
   * 取得顯示選項
   */
  private getDisplayOptions(
    error: AppError,
    customOptions?: Partial<ErrorDisplayOptions>
  ): ErrorDisplayOptions {
    // 預設選項
    const defaultOptions: ErrorDisplayOptions = {
      showToUser: true,
      displayType: 'toast',
      autoCloseDuration: 5000,
      retryable: false,
    }

    // 根據錯誤嚴重程度調整預設選項
    if (error.severity === ErrorSeverity.CRITICAL) {
      defaultOptions.displayType = 'modal'
      defaultOptions.autoCloseDuration = 0 // 不自動關閉
    } else if (error.severity === ErrorSeverity.INFO) {
      defaultOptions.autoCloseDuration = 3000
    }

    // 網路錯誤可重試
    if (error.category === ErrorCategory.NETWORK) {
      defaultOptions.retryable = true
    }

    return { ...defaultOptions, ...customOptions }
  }

  /**
   * 顯示錯誤給用戶
   */
  private displayError(error: AppError, options: ErrorDisplayOptions): void {
    switch (options.displayType) {
      case 'toast':
        this.displayToast(error, options)
        break
      case 'modal':
        // Modal 顯示將在後續實作
        console.warn('[ErrorHandler] Modal display not implemented yet')
        this.displayToast(error, options) // 暫時用 toast
        break
      case 'inline':
        // Inline 顯示不在這裡處理，由組件自行處理
        break
    }
  }

  /**
   * 使用 Toast 顯示錯誤
   */
  private displayToast(error: AppError, _options: ErrorDisplayOptions): void {
    const { toast } = this

    switch (error.severity) {
      case ErrorSeverity.INFO:
        toast.info(error.message)
        break
      case ErrorSeverity.WARNING:
        toast.warning(error.message)
        break
      case ErrorSeverity.ERROR:
        toast.error(error.message)
        break
      case ErrorSeverity.CRITICAL:
        toast.error(`嚴重錯誤: ${error.message}`)
        break
    }
  }

  /**
   * 取得所有錯誤
   */
  getErrors(): AppError[] {
    return this.errors.value
  }

  /**
   * 清除所有錯誤
   */
  clearErrors(): void {
    this.errors.value = []
  }

  /**
   * 取得最新的錯誤
   */
  getLatestError(): AppError | null {
    return this.errors.value[0] || null
  }

  /**
   * 根據類別過濾錯誤
   */
  getErrorsByCategory(category: ErrorCategory): AppError[] {
    return this.errors.value.filter(error => error.category === category)
  }

  /**
   * 根據嚴重程度過濾錯誤
   */
  getErrorsBySeverity(severity: ErrorSeverity): AppError[] {
    return this.errors.value.filter(error => error.severity === severity)
  }
}

// 單例模式
const errorHandler = new ErrorHandler()

/**
 * 使用錯誤處理器的 Composable
 */
export function useErrorHandler() {
  const route = useRoute()

  /**
   * 處理錯誤
   */
  const handleError = (
    error: Error | ApplicationError | unknown,
    options?: Partial<ErrorDisplayOptions>
  ): AppError => {
    // 添加路徑資訊
    const errorWithPath =
      error instanceof Error
        ? error
        : new Error(error instanceof Object ? JSON.stringify(error) : String(error))

    if (errorWithPath instanceof Error && !('path' in errorWithPath)) {
      Object.assign(errorWithPath, { path: route.path })
    }

    return errorHandler.handle(errorWithPath, options)
  }

  /**
   * 處理非同步錯誤
   */
  const handleAsyncError = async <T>(
    asyncFn: () => Promise<T>,
    options?: Partial<ErrorDisplayOptions>
  ): Promise<T | null> => {
    try {
      return await asyncFn()
    } catch (error) {
      handleError(error, options)
      return null
    }
  }

  /**
   * 包裝函數，自動處理錯誤
   */
  const withErrorHandler = <T extends (...args: Parameters<T>) => ReturnType<T>>(
    fn: T,
    errorOptions?: Partial<ErrorDisplayOptions>
  ): ((...args: Parameters<T>) => ReturnType<T> | null) => {
    return (...args: Parameters<T>) => {
      try {
        const result = fn(...args)
        // 如果返回 Promise，處理 async 錯誤
        if (result instanceof Promise) {
          return result.catch(error => {
            handleError(error, errorOptions)
            return null
          }) as ReturnType<T>
        }
        return result
      } catch (error) {
        handleError(error, errorOptions)
        return null
      }
    }
  }

  /**
   * 錯誤統計
   */
  const errorStats = computed(() => {
    const errors = errorHandler.getErrors()
    return {
      total: errors.length,
      critical: errors.filter(e => e.severity === ErrorSeverity.CRITICAL).length,
      errors: errors.filter(e => e.severity === ErrorSeverity.ERROR).length,
      warnings: errors.filter(e => e.severity === ErrorSeverity.WARNING).length,
      info: errors.filter(e => e.severity === ErrorSeverity.INFO).length,
    }
  })

  return {
    // 錯誤處理
    handleError,
    handleAsyncError,
    withErrorHandler,

    // 錯誤查詢
    getErrors: () => errorHandler.getErrors(),
    getLatestError: () => errorHandler.getLatestError(),
    getErrorsByCategory: (category: ErrorCategory) => errorHandler.getErrorsByCategory(category),
    getErrorsBySeverity: (severity: ErrorSeverity) => errorHandler.getErrorsBySeverity(severity),

    // 錯誤管理
    clearErrors: () => errorHandler.clearErrors(),

    // 統計資訊
    errorStats,

    // 常數
    ErrorSeverity,
    ErrorCategory,
    ErrorCodes,
    ErrorMessages,
  }
}
