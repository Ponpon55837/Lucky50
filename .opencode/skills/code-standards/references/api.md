# API 服務層開發規範

## 🌐 API 架構設計

### 基礎配置

```typescript
// src/services/api.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { useAuth } from '@/composables/useAuth'

// API 基礎配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'
const API_TIMEOUT = 10000

class ApiClient {
  private instance: AxiosInstance

  constructor() {
    this.instance = axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // 請求攔截器
    this.instance.interceptors.request.use(
      config => {
        // 添加認證 token
        const { user } = useAuth()
        if (user.value?.token) {
          config.headers.Authorization = `Bearer ${user.value.token}`
        }

        // 添加請求 ID
        config.headers['X-Request-ID'] = this.generateRequestId()

        return config
      },
      error => {
        return Promise.reject(error)
      }
    )

    // 響應攔截器
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        return response
      },
      error => {
        this.handleApiError(error)
        return Promise.reject(error)
      }
    )
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private handleApiError(error: any) {
    if (error.response) {
      // 伺服器響應錯誤
      const { status, data } = error.response

      switch (status) {
        case 401:
          // 未授權，重新導向至登入頁面
          this.handleUnauthorized()
          break
        case 403:
          // 權限不足
          console.error('權限不足:', data.message)
          break
        case 404:
          // 資源不存在
          console.error('資源不存在:', data.message)
          break
        case 500:
          // 伺服器錯誤
          console.error('伺服器錯誤:', data.message)
          break
        default:
          console.error('API 錯誤:', data.message)
      }
    } else if (error.request) {
      // 網路錯誤
      console.error('網路錯誤:', error.message)
    } else {
      // 其他錯誤
      console.error('未知錯誤:', error.message)
    }
  }

  private handleUnauthorized() {
    const { logout } = useAuth()
    logout()
    // 重新導向至登入頁面
    window.location.href = '/login'
  }

  // HTTP 方法
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.get<T>(url, config)
    return response.data
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.post<T>(url, data, config)
    return response.data
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.put<T>(url, data, comfig)
    return response.data
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.patch<T>(url, data, config)
    return response.data
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.delete<T>(url, config)
    return response.data
  }
}

// 匯出單例
export const apiClient = new ApiClient()
```

## 📋 類型定義

### API 響應類型

```typescript
// src/types/api.ts
export interface ApiResponse<T = any> {
  success: boolean
  data: T
  message?: string
  errors?: string[]
  meta?: {
    pagination?: PaginationMeta
    timestamp: string
    requestId: string
  }
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface ApiError {
  code: string
  message: string
  details?: any
  timestamp: string
  requestId: string
}
```

### 農民曆 API 類型

```typescript
// src/types/lunar.ts
export interface LunarDate {
  solarDate: string
  lunarDate: string
  year: string
  month: string
  day: string
  zodiac: string
  element: string
  festival?: string
}

export interface AuspiciousInfo {
  overallAuspicious: boolean
  suitable: string[]
  unsuitable: string[]
  direction?: string
  timeSlots?: {
    morning: boolean
    afternoon: boolean
    evening: boolean
  }
}

export interface LunarCalendarRequest {
  date: string
  includeAuspicious?: boolean
  includeTimeSlots?: boolean
}
```

### 投資分析 API 類型

```typescript
// src/types/investment.ts
export interface StockData {
  symbol: string
  date: string
  price: number
  open: number
  high: number
  low: number
  close: number
  volume: number
  change: number
  changePercent: number
}

export interface TechnicalIndicator {
  type: 'MA' | 'RSI' | 'MACD' | 'BB' | 'KD'
  value: number | { [key: string]: number }
  signal: 'buy' | 'sell' | 'hold'
  timestamp: string
}

export interface MarketStatus {
  isOpen: boolean
  nextOpeningTime?: string
  nextClosingTime?: string
  currentSession: 'pre' | 'regular' | 'post' | 'closed'
}
```

## 🎯 服務層實作

### 農民曆服務

```typescript
// src/services/lunarCalendar.ts
import { apiClient } from './api'
import type { LunarDate, AuspiciousInfo, LunarCalendarRequest, ApiResponse } from '@/types'

export class LunarCalendarService {
  private readonly basePath = '/lunar-calendar'

  async getLunarDate(date: string): Promise<LunarDate> {
    const response = await apiClient.get<ApiResponse<LunarDate>>(`${this.basePath}/date/${date}`)
    return response.data
  }

  async getAuspiciousInfo(date: string): Promise<AuspiciousInfo> {
    const response = await apiClient.get<ApiResponse<AuspiciousInfo>>(
      `${this.basePath}/auspicious/${date}`
    )
    return response.data
  }

  async getFullCalendar(request: LunarCalendarRequest): Promise<{
    lunarDate: LunarDate
    auspiciousInfo: AuspiciousInfo
  }> {
    const response = await apiClient.post<
      ApiResponse<{
        lunarDate: LunarDate
        auspiciousInfo: AuspiciousInfo
      }>
    >(`${this.basePath}/full`, request)
    return response.data
  }

  async getLuckyHours(date: string): Promise<{
    morning: boolean
    afternoon: boolean
    evening: boolean
    recommended?: string[]
  }> {
    const response = await apiClient.get<
      ApiResponse<{
        morning: boolean
        afternoon: boolean
        evening: boolean
        recommended?: string[]
      }>
    >(`${this.basePath}/lucky-hours/${date}`)
    return response.data
  }

  async getMonthlyAuspicious(
    year: number,
    month: number
  ): Promise<{
    dates: Array<{
      date: string
      overallAuspicious: boolean
      suitable: string[]
      unsuitable: string[]
    }>
  }> {
    const response = await apiClient.get<
      ApiResponse<{
        dates: Array<{
          date: string
          overallAuspicious: boolean
          suitable: string[]
          unsuitable: string[]
        }>
      }>
    >(`${this.basePath}/monthly/${year}/${month}`)
    return response.data
  }
}

export const lunarCalendarService = new LunarCalendarService()
```

### 投資分析服務

```typescript
// src/services/investment.ts
import { apiClient } from './api'
import type { StockData, TechnicalIndicator, MarketStatus, ApiResponse } from '@/types'

export class InvestmentService {
  private readonly basePath = '/investment'

  async getStockData(
    symbol: string,
    period: '1D' | '1W' | '1M' | '3M' | '1Y' = '1M'
  ): Promise<StockData[]> {
    const response = await apiClient.get<ApiResponse<StockData[]>>(
      `${this.basePath}/stocks/${symbol}/data?period=${period}`
    )
    return response.data
  }

  async getRealTimePrice(symbol: string): Promise<{
    price: number
    change: number
    changePercent: number
    volume: number
    timestamp: string
  }> {
    const response = await apiClient.get<
      ApiResponse<{
        price: number
        change: number
        changePercent: number
        volume: number
        timestamp: string
      }>
    >(`${this.basePath}/stocks/${symbol}/realtime`)
    return response.data
  }

  async getTechnicalIndicators(
    symbol: string,
    indicators: string[] = ['MA', 'RSI', 'MACD']
  ): Promise<TechnicalIndicator[]> {
    const response = await apiClient.post<ApiResponse<TechnicalIndicator[]>>(
      `${this.basePath}/stocks/${symbol}/indicators`,
      { indicators }
    )
    return response.data
  }

  async getMarketStatus(): Promise<MarketStatus> {
    const response = await apiClient.get<ApiResponse<MarketStatus>>(
      `${this.basePath}/market/status`
    )
    return response.data
  }

  async searchStocks(query: string): Promise<
    Array<{
      symbol: string
      name: string
      type: 'stock' | 'etf' | 'fund'
      exchange: string
    }>
  > {
    const response = await apiClient.get<
      ApiResponse<
        Array<{
          symbol: string
          name: string
          type: 'stock' | 'etf' | 'fund'
          exchange: string
        }>
      >
    >(`${this.basePath}/stocks/search?q=${encodeURIComponent(query)}`)
    return response.data
  }

  async getInvestmentRecommendations(preferences: {
    riskTolerance: 'low' | 'medium' | 'high'
    investmentPeriod: 'short' | 'medium' | 'long'
    categories?: string[]
  }): Promise<{
    recommendations: Array<{
      symbol: string
      name: string
      reason: string
      confidence: number
      expectedReturn: number
    }>
  }> {
    const response = await apiClient.post<
      ApiResponse<{
        recommendations: Array<{
          symbol: string
          name: string
          reason: string
          confidence: number
          expectedReturn: number
        }>
      }>
    >(`${this.basePath}/recommendations`, preferences)
    return response.data
  }
}

export const investmentService = new InvestmentService()
```

### 認證服務

```typescript
// src/services/auth.ts
import { apiClient } from './api'
import type { User, LoginCredentials, RegisterData, ApiResponse } from '@/types'

export class AuthService {
  private readonly basePath = '/auth'

  async login(credentials: LoginCredentials): Promise<{
    user: User
    token: string
    refreshToken: string
  }> {
    const response = await apiClient.post<
      ApiResponse<{
        user: User
        token: string
        refreshToken: string
      }>
    >(`${this.basePath}/login`, credentials)
    return response.data
  }

  async register(userData: RegisterData): Promise<{
    user: User
    token: string
    refreshToken: string
  }> {
    const response = await apiClient.post<
      ApiResponse<{
        user: User
        token: string
        refreshToken: string
      }>
    >(`${this.basePath}/register`, userData)
    return response.data
  }

  async refreshToken(refreshToken: string): Promise<{
    token: string
    refreshToken: string
  }> {
    const response = await apiClient.post<
      ApiResponse<{
        token: string
        refreshToken: string
      }>
    >(`${this.basePath}/refresh`, { refreshToken })
    return response.data
  }

  async logout(): Promise<void> {
    await apiClient.post(`${this.basePath}/logout`)
  }

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<void> {
    await apiClient.post(`${this.basePath}/change-password`, data)
  }

  async resetPassword(email: string): Promise<void> {
    await apiClient.post(`${this.basePath}/reset-password`, { email })
  }

  async confirmResetPassword(data: { token: string; newPassword: string }): Promise<void> {
    await apiClient.post(`${this.basePath}/confirm-reset-password`, data)
  }
}

export const authService = new AuthService()
```

## 🔄 錯誤處理策略

### 統一錯誤處理

```typescript
// src/utils/errorHandler.ts
import { toast } from 'vue-sonner' 或其他通知庫

export interface ApiError {
  code: string
  message: string
  details?: any
  statusCode?: number
}

export class ErrorHandler {
  static handle(error: any): void {
    if (this.isApiError(error)) {
      this.handleApiError(error)
    } else if (this.isNetworkError(error)) {
      this.handleNetworkError(error)
    } else {
      this.handleUnknownError(error)
    }
  }

  private static isApiError(error: any): error is ApiError {
    return error.response || error.code
  }

  private static isNetworkError(error: any): boolean {
    return error.code === 'NETWORK_ERROR' || error.message.includes('network')
  }

  private static handleApiError(error: ApiError): void {
    const message = error.message || '發生未知錯誤'

    switch (error.statusCode) {
      case 400:
        toast.error(`請求錯誤: ${message}`)
        break
      case 401:
        toast.error('身份驗證失敗，請重新登入')
        break
      case 403:
        toast.error('權限不足')
        break
      case 404:
        toast.error('請求的資源不存在')
        break
      case 429:
        toast.error('請求過於頻繁，請稍後再試')
        break
      case 500:
        toast.error('伺服器內部錯誤')
        break
      default:
        toast.error(message)
    }
  }

  private static handleNetworkError(error: any): void {
    toast.error('網路連線錯誤，請檢查網路狀態')
  }

  private static handleUnknownError(error: any): void {
    console.error('Unknown error:', error)
    toast.error('發生未知錯誤，請稍後再試')
  }
}
```

### 重試機制

```typescript
// src/utils/retry.ts
export class RetryManager {
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: any

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error

        // 如果是最後一次嘗試，拋出錯誤
        if (attempt === maxRetries) {
          break
        }

        // 指數退避
        const waitTime = delay * Math.pow(2, attempt)
        await this.sleep(waitTime)
      }
    }

    throw lastError
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
```

## 📋 快取策略

### 快取管理

```typescript
// src/utils/cache.ts
export interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
}

export class ApiCache {
  private cache = new Map<string, CacheItem<any>>()

  set<T>(key: string, data: T, ttl: number = 300000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key)

    if (!item) {
      return null
    }

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  clear(): void {
    this.cache.clear()
  }

  delete(key: string): void {
    this.cache.delete(key)
  }
}

export const apiCache = new ApiCache()
```

### 快取裝飾器

```typescript
// src/decorators/cache.ts
export function withCache(ttl: number = 300000) {
  return function <T extends (...args: any[]) => Promise<any>>(
    target: any,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const method = descriptor.value!

    descriptor.value = async function (...args: any[]) {
      const key = `${propertyName}_${JSON.stringify(args)}`

      // 嘗試從快取獲取
      const cached = apiCache.get(key)
      if (cached) {
        return cached
      }

      // 執行原方法
      const result = await method.apply(this, args)

      // 儲存到快取
      apiCache.set(key, result, ttl)

      return result
    } as T
  }
}
```

## 📋 測試規範

### API 服務測試

```typescript
// tests/services/lunarCalendar.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { lunarCalendarService } from '@/services/lunarCalendar'
import { apiClient } from '@/services/api'

// Mock apiClient
vi.mock('@/services/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

const mockApiClient = vi.mocked(apiClient)

describe('LunarCalendarService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('應該正確獲取農曆日期', async () => {
    const mockLunarDate = {
      solarDate: '2024-01-01',
      lunarDate: '2023年十一月二十',
      year: '癸卯',
      month: '十一月',
      day: '二十',
      zodiac: '兔',
      element: '水',
    }

    mockApiClient.get.mockResolvedValue({
      data: mockLunarDate,
    })

    const result = await lunarCalendarService.getLunarDate('2024-01-01')

    expect(result).toEqual(mockLunarDate)
    expect(mockApiClient.get).toHaveBeenCalledWith('/lunar-calendar/date/2024-01-01')
  })

  it('應該正確獲取吉時宜忌資訊', async () => {
    const mockAuspiciousInfo = {
      overallAuspicious: true,
      suitable: ['祭祀', '祈福', '開市'],
      unsuitable: ['動土', '安葬', '出行'],
      direction: '東南',
      timeSlots: {
        morning: true,
        afternoon: false,
        evening: true,
      },
    }

    mockApiClient.get.mockResolvedValue({
      data: mockAuspiciousInfo,
    })

    const result = await lunarCalendarService.getAuspiciousInfo('2024-01-01')

    expect(result).toEqual(mockAuspiciousInfo)
    expect(mockApiClient.get).toHaveBeenCalledWith('/lunar-calendar/auspicious/2024-01-01')
  })
})
```

---

## 📋 最佳實踐總結

1. **統一的 API 客戶端**：使用 axios 實例統一處理所有請求
2. **完整的類型定義**：所有 API 響應和請求都應該有類型定義
3. **錯誤處理**：統一的錯誤處理機制和用戶友好的錯誤訊息
4. **重試機制**：對於網路錯誤提供自動重試
5. **快取策略**：適當的快取機制提升效能
6. **攔截器**：統一處理認證、日誌和錯誤
7. **服務分層**：按業務功能組織不同的服務類別
8. **繁體中文**：所有錯誤訊息和使用者介面文字使用繁體中文
