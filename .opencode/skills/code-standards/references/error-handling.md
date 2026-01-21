# 錯誤處理規範

## 🚨 錯誤處理策略

### 錯誤分類

```typescript
// src/types/errors.ts
export enum ErrorType {
  // API 錯誤
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',

  // 業務邏輯錯誤
  BUSINESS_ERROR = 'BUSINESS_ERROR',
  DATA_ERROR = 'DATA_ERROR',
  CONFIG_ERROR = 'CONFIG_ERROR',

  // 系統錯誤
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  MEMORY_ERROR = 'MEMORY_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',

  // 使用者錯誤
  USER_ERROR = 'USER_ERROR',
  INPUT_ERROR = 'INPUT_ERROR',
}

export interface AppError {
  type: ErrorType
  code: string
  message: string
  details?: any
  timestamp: Date
  stack?: string
  userMessage?: string
  recoverable?: boolean
}

export class CustomError extends Error {
  public readonly type: ErrorType
  public readonly code: string
  public readonly details?: any
  public readonly userMessage?: string
  public readonly recoverable: boolean
  public readonly timestamp: Date

  constructor(
    type: ErrorType,
    code: string,
    message: string,
    options: {
      details?: any
      userMessage?: string
      recoverable?: boolean
      cause?: Error
    } = {}
  ) {
    super(message)
    this.type = type
    this.code = code
    this.details = options.details
    this.userMessage = options.userMessage || message
    this.recoverable = options.recoverable ?? true
    this.timestamp = new Date()

    if (options.cause) {
      this.cause = options.cause
    }
  }
}
```

## 🎯 全域錯誤處理

### Vue 錯誤處理

```typescript
// src/plugins/errorHandler.ts
import { App } from 'vue'
import { ErrorHandler } from '@/utils/errorHandler'
import type { AppError } from '@/types/errors'

export function setupGlobalErrorHandler(app: App) {
  // Vue 錯誤處理
  app.config.errorHandler = (error, instance, info) => {
    console.error('Vue Error:', error, info)

    const appError: AppError = {
      type: ErrorType.SYSTEM_ERROR,
      code: 'VUE_ERROR',
      message: error.message,
      details: { error, instance, info },
      timestamp: new Date(),
      userMessage: '應用程式發生錯誤，請重新整理頁面',
    }

    ErrorHandler.handle(appError)
  }

  // 未捕獲的 Promise 錯誤
  window.addEventListener('unhandledrejection', event => {
    console.error('Unhandled Promise Rejection:', event.reason)

    const appError: AppError = {
      type: ErrorType.SYSTEM_ERROR,
      code: 'PROMISE_REJECTION',
      message: event.reason?.message || '未知 Promise 錯誤',
      details: { reason: event.reason },
      timestamp: new Date(),
      userMessage: '操作失敗，請稍後重試',
    }

    ErrorHandler.handle(appError)
    event.preventDefault()
  })

  // 全域 JavaScript 錯誤
  window.addEventListener('error', event => {
    console.error('Global Error:', event.error)

    const appError: AppError = {
      type: ErrorType.SYSTEM_ERROR,
      code: 'GLOBAL_ERROR',
      message: event.error?.message || '全域錯誤',
      details: { error: event.error, filename: event.filename, lineno: event.lineno },
      timestamp: new Date(),
      userMessage: '應用程式發生錯誤，請重新整理頁面',
    }

    ErrorHandler.handle(appError)
  })
}
```

### 錯誤處理器

```typescript
// src/utils/errorHandler.ts
import { toast } from 'vue-sonner' // 或其他通知庫
import type { AppError, ErrorType } from '@/types/errors'
import { ErrorLogger } from '@/utils/errorLogger'
import { ErrorReporter } from '@/utils/errorReporter'

export class ErrorHandler {
  private static logger = new ErrorLogger()
  private static reporter = new ErrorReporter()

  static async handle(error: AppError | Error | any): Promise<void> {
    try {
      // 標準化錯誤物件
      const appError = this.normalizeError(error)

      // 記錄錯誤
      await this.logError(appError)

      // 報告錯誤（如果需要）
      if (this.shouldReport(appError)) {
        await this.reportError(appError)
      }

      // 顯示使用者訊息
      this.showUserMessage(appError)

      // 執行恢復操作
      if (appError.recoverable) {
        await this.recover(appError)
      }
    } catch (handlerError) {
      console.error('Error in error handler:', handlerError)
    }
  }

  private static normalizeError(error: any): AppError {
    if (this.isAppError(error)) {
      return error
    }

    if (error.isAxiosError) {
      return this.normalizeApiError(error)
    }

    return {
      type: ErrorType.SYSTEM_ERROR,
      code: 'UNKNOWN_ERROR',
      message: error.message || '未知錯誤',
      timestamp: new Date(),
      userMessage: '發生未知錯誤，請稍後重試',
      recoverable: true,
      stack: error.stack,
    }
  }

  private static isAppError(error: any): error is AppError {
    return error.type && error.code && error.timestamp
  }

  private static normalizeApiError(error: any): AppError {
    const status = error.response?.status
    const data = error.response?.data

    let type: ErrorType
    let code: string
    let userMessage: string
    let recoverable = true

    switch (status) {
      case 401:
        type = ErrorType.AUTHENTICATION_ERROR
        code = 'UNAUTHORIZED'
        userMessage = '身份驗證失敗，請重新登入'
        recoverable = false
        break
      case 403:
        type = ErrorType.AUTHORIZATION_ERROR
        code = 'FORBIDDEN'
        userMessage = '權限不足，無法執行此操作'
        break
      case 404:
        type = ErrorType.NOT_FOUND_ERROR
        code = 'NOT_FOUND'
        userMessage = '請求的資源不存在'
        break
      case 422:
        type = ErrorType.VALIDATION_ERROR
        code = 'VALIDATION_FAILED'
        userMessage = data?.message || '輸入資料有誤'
        break
      case 429:
        type = ErrorType.API_ERROR
        code = 'RATE_LIMIT_EXCEEDED'
        userMessage = '請求過於頻繁，請稍後再試'
        recoverable = true
        break
      case 500:
        type = ErrorType.SYSTEM_ERROR
        code = 'SERVER_ERROR'
        userMessage = '伺服器錯誤，請稍後重試'
        recoverable = true
        break
      default:
        type = ErrorType.NETWORK_ERROR
        code = 'NETWORK_ERROR'
        userMessage = '網路連線錯誤，請檢查網路狀態'
    }

    return {
      type,
      code,
      message: data?.message || error.message,
      details: {
        status,
        data,
        config: error.config,
      },
      timestamp: new Date(),
      userMessage,
      recoverable,
      stack: error.stack,
    }
  }

  private static async logError(error: AppError): Promise<void> {
    await this.logger.log({
      type: error.type,
      code: error.code,
      message: error.message,
      details: error.details,
      stack: error.stack,
      timestamp: error.timestamp,
      userAgent: navigator.userAgent,
      url: window.location.href,
    })
  }

  private static shouldReport(error: AppError): boolean {
    // 不報告的錯誤類型
    const doNotReport = [ErrorType.VALIDATION_ERROR, ErrorType.USER_ERROR, ErrorType.INPUT_ERROR]

    return !doNotReport.includes(error.type)
  }

  private static async reportError(error: AppError): Promise<void> {
    await this.reporter.report(error)
  }

  private static showUserMessage(error: AppError): void {
    if (error.userMessage) {
      // 根據錯誤嚴重程度選擇通知類型
      if (error.type === ErrorType.SYSTEM_ERROR) {
        toast.error(error.userMessage)
      } else if (error.type === ErrorType.AUTHENTICATION_ERROR) {
        toast.warning(error.userMessage)
      } else {
        toast.info(error.userMessage)
      }
    }
  }

  private static async recover(error: AppError): Promise<void> {
    switch (error.type) {
      case ErrorType.AUTHENTICATION_ERROR:
        // 重新導向至登入頁面
        window.location.href = '/login'
        break

      case ErrorType.NETWORK_ERROR:
        // 嘗試重新連線
        if (error.recoverable) {
          // 實作重新連線邏輯
          console.log('嘗試重新連線...')
        }
        break

      default:
        // 一般恢復邏輯
        console.log('執行恢復操作...')
    }
  }
}
```

## 🎥 錯誤邊界組件

### Vue 錯誤邊界

```vue
<!-- src/components/ErrorBoundary.vue -->
<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'
import type { AppError } from '@/types/errors'
import { ErrorHandler } from '@/utils/errorHandler'

interface Props {
  fallback?: string
  showRetry?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  fallback: '組件載入失敗',
  showRetry: true,
})

const hasError = ref(false)
const error = ref<AppError | null>(null)
const retryCount = ref(0)

onErrorCaptured((err: Error, instance, info) => {
  console.error('ErrorBoundary captured error:', err, info)

  const appError: AppError = {
    type: 'SYSTEM_ERROR' as any,
    code: 'COMPONENT_ERROR',
    message: err.message,
    details: { instance, info },
    timestamp: new Date(),
    userMessage: '組件載入失敗',
    recoverable: true,
    stack: err.stack,
  }

  error.value = appError
  hasError.value = true

  // 處理錯誤
  ErrorHandler.handle(appError)

  // 阻止錯誤向上傳播
  return false
})

const retry = () => {
  hasError.value = false
  error.value = null
  retryCount.value++
}
</script>

<template>
  <div v-if="hasError" class="error-boundary">
    <div class="error-content">
      <h3 class="error-title">🚨 發生錯誤</h3>
      <p class="error-message">{{ error?.userMessage || fallback }}</p>

      <div v-if="retryCount > 0" class="retry-info">已重試 {{ retryCount }} 次</div>

      <div v-if="showRetry" class="error-actions">
        <button @click="retry" class="retry-button">重新載入</button>
      </div>
    </div>
  </div>

  <slot v-else />
</template>

<style scoped>
.error-boundary {
  @apply flex items-center justify-center p-8 min-h-[200px] bg-red-50 border border-red-200 rounded-lg;
}

.error-content {
  @apply text-center;
}

.error-title {
  @apply text-lg font-semibold text-red-800 mb-2;
}

.error-message {
  @apply text-red-600 mb-4;
}

.retry-info {
  @apply text-sm text-gray-500 mb-4;
}

.error-actions {
  @apply space-x-2;
}

.retry-button {
  @apply px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors;
}
</style>
```

## 📝 錯誤日誌記錄

### 錯誤記錄器

```typescript
// src/utils/errorLogger.ts
export interface ErrorLog {
  type: string
  code: string
  message: string
  details?: any
  stack?: string
  timestamp: Date
  userAgent: string
  url: string
  userId?: string
}

export class ErrorLogger {
  private logs: ErrorLog[] = []
  private maxLogs = 100

  async log(entry: Omit<ErrorLog, 'timestamp' | 'userAgent' | 'url'>): Promise<void> {
    const log: ErrorLog = {
      ...entry,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    }

    // 添加到記憶體日誌
    this.addToMemory(log)

    // 儲存到本地儲存
    await this.saveToLocalStorage(log)

    // 發送到日誌服務（如果配置）
    await this.sendToLogService(log)
  }

  private addToMemory(log: ErrorLog): void {
    this.logs.push(log)

    // 限制記憶體中的日誌數量
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }
  }

  private async saveToLocalStorage(log: ErrorLog): Promise<void> {
    try {
      const existingLogs = this.getStoredLogs()
      existingLogs.push(log)

      // 限制本地儲存的日誌數量
      if (existingLogs.length > 500) {
        existingLogs.splice(0, existingLogs.length - 500)
      }

      localStorage.setItem('error_logs', JSON.stringify(existingLogs))
    } catch (error) {
      console.error('Failed to save error log to localStorage:', error)
    }
  }

  private getStoredLogs(): ErrorLog[] {
    try {
      const stored = localStorage.getItem('error_logs')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  private async sendToLogService(log: ErrorLog): Promise<void> {
    // 只有在生產環境才發送到日誌服務
    if (import.meta.env.PROD) {
      try {
        await fetch('/api/logs/errors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(log),
        })
      } catch (error) {
        console.error('Failed to send error log to service:', error)
      }
    }
  }

  getLogs(limit?: number): ErrorLog[] {
    return limit ? this.logs.slice(-limit) : this.logs
  }

  clearLogs(): void {
    this.logs = []
    localStorage.removeItem('error_logs')
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }
}
```

## 📊 錯誤報告

### 錯誤報告器

```typescript
// src/utils/errorReporter.ts
import type { AppError } from '@/types/errors'

export interface ErrorReport {
  error: AppError
  context: {
    userAgent: string
    url: string
    timestamp: string
    userId?: string
    sessionId: string
  }
  environment: {
    appVersion: string
    buildTime: string
    nodeEnv: string
  }
}

export class ErrorReporter {
  private sessionId: string

  constructor() {
    this.sessionId = this.generateSessionId()
  }

  async report(error: AppError): Promise<void> {
    if (!this.shouldReport(error)) {
      return
    }

    const report: ErrorReport = {
      error,
      context: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        sessionId: this.sessionId,
      },
      environment: {
        appVersion: import.meta.env.VITE_APP_VERSION || 'unknown',
        buildTime: import.meta.env.VITE_BUILD_TIME || 'unknown',
        nodeEnv: import.meta.env.MODE,
      },
    }

    await this.sendReport(report)
  }

  private shouldReport(error: AppError): boolean {
    // 開發環境不報告
    if (import.meta.env.DEV) {
      return false
    }

    // 不報告的使用者錯誤
    const doNotReport = ['VALIDATION_ERROR', 'USER_ERROR', 'INPUT_ERROR']

    return !doNotReport.includes(error.code)
  }

  private async sendReport(report: ErrorReport): Promise<void> {
    try {
      // 發送到錯誤追蹤服務（如 Sentry）
      await fetch('/api/errors/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(report),
      })
    } catch (error) {
      console.error('Failed to send error report:', error)
    }
  }

  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }
}
```

## 🎯 Lucky50 專案特化錯誤

### 農民曆錯誤

```typescript
// src/errors/lunarErrors.ts
export class LunarCalendarError extends CustomError {
  constructor(code: string, message: string, userMessage?: string) {
    super(ErrorType.BUSINESS_ERROR, `LUNAR_${code}`, message, { userMessage })
  }
}

export class InvalidDateError extends LunarCalendarError {
  constructor(date: string) {
    super('INVALID_DATE', `Invalid date: ${date}`, '輸入的日期格式錯誤，請使用 YYYY-MM-DD 格式')
  }
}

export class DateRangeError extends LunarCalendarError {
  constructor(startDate: string, endDate: string) {
    super(
      'DATE_RANGE_ERROR',
      `Invalid date range: ${startDate} to ${endDate}`,
      '日期範圍錯誤，結束日期必須大於開始日期'
    )
  }
}
```

### 投資分析錯誤

```typescript
// src/errors/investmentErrors.ts
export class InvestmentError extends CustomError {
  constructor(code: string, message: string, userMessage?: string) {
    super(ErrorType.BUSINESS_ERROR, `INVESTMENT_${code}`, message, { userMessage })
  }
}

export class InvalidSymbolError extends InvestmentError {
  constructor(symbol: string) {
    super('INVALID_SYMBOL', `Invalid stock symbol: ${symbol}`, '股票代碼錯誤，請輸入正確的股票代碼')
  }
}

export class MarketClosedError extends InvestmentError {
  constructor() {
    super('MARKET_CLOSED', 'Market is closed', '目前為非交易時間，無法取得即時資料')
  }
}

export class InsufficientDataError extends InvestmentError {
  constructor(symbol: string, period: string) {
    super(
      'INSUFFICIENT_DATA',
      `Insufficient data for ${symbol} in period ${period}`,
      '指定期間的資料不足，請選擇更長的時間範圍'
    )
  }
}
```

## 📋 測試錯誤處理

### 錯誤處理測試

```typescript
// tests/utils/errorHandler.test.ts
import { describe, it, expect, vi } from 'vitest'
import { ErrorHandler } from '@/utils/errorHandler'
import { CustomError, ErrorType } from '@/types/errors'

describe('ErrorHandler', () => {
  it('應該正確處理自定義錯誤', async () => {
    const error = new CustomError(
      ErrorType.VALIDATION_ERROR,
      'VALIDATION_FAILED',
      'Validation failed',
      { userMessage: '輸入資料有誤' }
    )

    const toastSpy = vi.spyOn(toast, 'info')

    await ErrorHandler.handle(error)

    expect(toastSpy).toHaveBeenCalledWith('輸入資料有誤')
  })

  it('應該正確處理 API 錯誤', async () => {
    const apiError = {
      isAxiosError: true,
      response: {
        status: 404,
        data: { message: 'Not found' },
      },
    }

    const toastSpy = vi.spyOn(toast, 'error')

    await ErrorHandler.handle(apiError)

    expect(toastSpy).toHaveBeenCalledWith('請求的資源不存在')
  })

  it('應該正確處理一般錯誤', async () => {
    const error = new Error('Generic error')

    const toastSpy = vi.spyOn(toast, 'error')

    await ErrorHandler.handle(error)

    expect(toastSpy).toHaveBeenCalledWith('發生未知錯誤，請稍後重試')
  })
})
```

---

## 📋 最佳實踐總結

1. **統一錯誤類型**：使用列舉定義所有錯誤類型
2. **自定義錯誤類別**：繼承 Error 類別，提供更多資訊
3. **全域錯誤處理**：捕獲所有未處理的錯誤
4. **使用者友好訊息**：提供清晰的中文錯誤訊息
5. **錯誤記錄**：完整記錄錯誤資訊用於除錯
6. **錯誤報告**：生產環境發送錯誤報告
7. **錯誤邊界**：使用 Vue 錯誤邊界防止應用程式崩潰
8. **恢復機制**：提供錯誤恢復選項
9. **繁體中文**：所有使用者訊息使用繁體中文
