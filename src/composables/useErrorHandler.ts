import { ref, computed } from 'vue'
import { ErrorCategory, ErrorSeverity } from '@/types/error'
import type { AppError } from '@/types/error'
import { useToast } from '@/composables/useToast'

export interface ErrorAction {
  label: string
  action: () => void
  variant?: 'primary' | 'secondary' | 'danger'
}

export interface ErrorHandlerOptions {
  showToast?: boolean
  logToConsole?: boolean
  customActions?: ErrorAction[]
}

export function useErrorHandler() {
  const currentError = ref<AppError | null>(null)
  const isErrorVisible = ref(false)

  // 計算屬性
  const errorTitle = computed(() => {
    if (!currentError.value) return ''
    return getErrorTitle(currentError.value.category)
  })

  const errorMessage = computed(() => {
    if (!currentError.value) return ''
    return currentError.value.message
  })

  const errorSeverity = computed(() => {
    if (!currentError.value) return 'info'
    return currentError.value.severity
  })

  const canRecover = computed(() => {
    return currentError.value?.severity !== ErrorSeverity.CRITICAL
  })

  // 錯誤處理方法
  const handleError = (error: Error | AppError, options: ErrorHandlerOptions = {}) => {
    const { showToast = true, logToConsole = true } = options

    // 標準化錯誤物件
    const appError = normalizeError(error)
    currentError.value = appError

    // 記錄到控制台
    if (logToConsole) {
      logError(appError)
    }

    // 顯示錯誤（根據選項）
    if (showToast) {
      showErrorToast(appError)
    }

    // 自動顯示錯誤對話框（對於嚴重錯誤）
    if (appError.severity === ErrorSeverity.ERROR || appError.severity === ErrorSeverity.CRITICAL) {
      showErrorModal()
    }

    return appError
  }

  const handleAsyncError = async <T>(
    asyncFn: () => Promise<T>,
    options: ErrorHandlerOptions = {}
  ): Promise<T | null> => {
    try {
      return await asyncFn()
    } catch (error) {
      handleError(error as Error, options)
      return null
    }
  }

  const withErrorHandler = <T>(fn: () => T, options: ErrorHandlerOptions = {}): T | null => {
    try {
      return fn()
    } catch (error) {
      handleError(error as Error, options)
      return null
    }
  }

  // UI 控制方法
  const showErrorModal = () => {
    isErrorVisible.value = true
  }

  const hideErrorModal = () => {
    isErrorVisible.value = false
    currentError.value = null
  }

  const clearError = () => {
    currentError.value = null
    isErrorVisible.value = false
  }

  // 重試機制
  const retry = async <T>(fn: () => Promise<T>, maxRetries = 3, delay = 1000): Promise<T> => {
    let lastError: Error

    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error as Error

        if (i === maxRetries) {
          handleError(lastError, {
            showToast: true,
            customActions: [
              {
                label: '重試',
                action: () => retry(fn, maxRetries, delay),
                variant: 'primary',
              },
            ],
          })
          throw lastError
        }

        // 等待後重試
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)))
      }
    }

    throw lastError!
  }

  return {
    // 狀態
    currentError,
    isErrorVisible,

    // 計算屬性
    errorTitle,
    errorMessage,
    errorSeverity,
    canRecover,

    // 方法
    handleError,
    handleAsyncError,
    withErrorHandler,
    showErrorModal,
    hideErrorModal,
    clearError,
    retry,
  }
}

// 輔助函數
function normalizeError(error: Error | AppError): AppError {
  if (isAppError(error)) {
    return error
  }

  return {
    code: 'SYS_999',
    message: error.message || '發生未知錯誤',
    timestamp: Date.now(),
    originalError: error,
    severity: ErrorSeverity.ERROR,
    category: ErrorCategory.UNKNOWN,
  }
}

function isAppError(error: unknown): error is AppError {
  return !!(
    error &&
    typeof error === 'object' &&
    'code' in error &&
    'message' in error &&
    'severity' in error
  )
}

function getErrorTitle(category: ErrorCategory): string {
  const titles: Record<ErrorCategory, string> = {
    [ErrorCategory.NETWORK]: '網路連線錯誤',
    [ErrorCategory.API]: 'API 錯誤',
    [ErrorCategory.AUTHENTICATION]: '身份驗證失敗',
    [ErrorCategory.AUTHORIZATION]: '權限不足',
    [ErrorCategory.VALIDATION]: '資料驗證錯誤',
    [ErrorCategory.BUSINESS]: '業務邏輯錯誤',
    [ErrorCategory.DATA]: '資料錯誤',
    [ErrorCategory.SYSTEM]: '系統錯誤',
    [ErrorCategory.UNKNOWN]: '未知錯誤',
  }
  return titles[category] || '錯誤'
}

function logError(error: AppError) {
  console.group(`🚨 ${getErrorTitle(error.category)}`)
  console.error('錯誤代碼:', error.code)
  console.error('錯誤訊息:', error.message)
  if (error.details) {
    console.error('詳細資訊:', error.details)
  }
  if (error.originalError) {
    console.error('原始錯誤:', error.originalError)
  }
  console.groupEnd()
}

function showErrorToast(error: AppError) {
  const toast = useToast()
  toast.error(getErrorTitle(error.category), error.message)
}
