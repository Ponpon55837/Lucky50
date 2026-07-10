import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { ErrorCategory, ErrorSeverity } from '@/types/error'
import type { AppError } from '@/types/error'

describe('useErrorHandler', () => {
  let handler: ReturnType<typeof useErrorHandler>

  beforeEach(() => {
    handler = useErrorHandler()
    vi.clearAllMocks()
    vi.spyOn(console, 'group').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'groupEnd').mockImplementation(() => {})
  })

  describe('initial state', () => {
    it('currentError 為 null', () => {
      expect(handler.currentError.value).toBeNull()
    })

    it('isErrorVisible 為 false', () => {
      expect(handler.isErrorVisible.value).toBe(false)
    })

    it('canRecover 為 true', () => {
      expect(handler.canRecover.value).toBe(true)
    })
  })

  describe('handleError', () => {
    it('處理 Error 物件', () => {
      const error = new Error('測試錯誤')
      const result = handler.handleError(error)
      expect(result.code).toBe('SYS_999')
      expect(result.message).toBe('測試錯誤')
      expect(result.severity).toBe(ErrorSeverity.ERROR)
      expect(result.category).toBe(ErrorCategory.UNKNOWN)
    })

    it('處理 AppError 物件', () => {
      const appError: AppError = {
        code: 'API_001',
        message: 'API 錯誤',
        timestamp: Date.now(),
        severity: ErrorSeverity.WARNING,
        category: ErrorCategory.API,
      }
      const result = handler.handleError(appError)
      expect(result.code).toBe('API_001')
    })

    it('嚴重錯誤自動顯示 modal', () => {
      const appError: AppError = {
        code: 'SYS_001',
        message: '嚴重錯誤',
        timestamp: Date.now(),
        severity: ErrorSeverity.CRITICAL,
        category: ErrorCategory.SYSTEM,
      }
      handler.handleError(appError)
      expect(handler.isErrorVisible.value).toBe(true)
    })

    it('不重要錯誤不顯示 modal', () => {
      const appError: AppError = {
        code: 'VAL_001',
        message: '驗證錯誤',
        timestamp: Date.now(),
        severity: ErrorSeverity.WARNING,
        category: ErrorCategory.VALIDATION,
      }
      handler.handleError(appError)
      expect(handler.isErrorVisible.value).toBe(false)
    })

    it('可關閉 log', () => {
      const error = new Error('測試')
      handler.handleError(error, { logToConsole: false })
      expect(console.error).not.toHaveBeenCalled()
    })
  })

  describe('handleAsyncError', () => {
    it('成功時回傳結果', async () => {
      const result = await handler.handleAsyncError(async () => 'success')
      expect(result).toBe('success')
    })

    it('失敗時回傳 null', async () => {
      const result = await handler.handleAsyncError(async () => {
        throw new Error('失敗')
      })
      expect(result).toBeNull()
      expect(handler.currentError.value).not.toBeNull()
    })
  })

  describe('withErrorHandler', () => {
    it('成功時回傳結果', () => {
      const result = handler.withErrorHandler(() => 42)
      expect(result).toBe(42)
    })

    it('失敗時回傳 null', () => {
      const result = handler.withErrorHandler(() => {
        throw new Error('同步錯誤')
      })
      expect(result).toBeNull()
    })
  })

  describe('error computed properties', () => {
    it('errorTitle 回傳正確標題', () => {
      const appError: AppError = {
        code: 'NET_001',
        message: '網路錯誤',
        timestamp: Date.now(),
        severity: ErrorSeverity.ERROR,
        category: ErrorCategory.NETWORK,
      }
      handler.handleError(appError)
      expect(handler.errorTitle.value).toBe('網路連線錯誤')
    })
  })

  describe('clearError', () => {
    it('清除錯誤狀態', () => {
      handler.handleError(new Error('test'))
      handler.clearError()
      expect(handler.currentError.value).toBeNull()
      expect(handler.isErrorVisible.value).toBe(false)
    })
  })

  describe('retry', () => {
    it('成功時不回拋', async () => {
      const fn = vi.fn().mockResolvedValue('ok')
      const result = await handler.retry(fn)
      expect(result).toBe('ok')
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('最終失敗時回拋', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('持續失敗'))
      await expect(handler.retry(fn, 1, 1)).rejects.toThrow('持續失敗')
      expect(fn).toHaveBeenCalledTimes(2)
    })
  })
})
