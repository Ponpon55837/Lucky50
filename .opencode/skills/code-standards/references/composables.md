# Composables 開發詳細規範

## 🔧 核心 Composables

### 定義規範

```typescript
// 標準結構
export function useComposableName(options?: Options) {
  // 1. 定義狀態
  const state = ref(initialState)

  // 2. 定義計算屬性
  const computedState = computed(() => derivedState(state.value))

  // 3. 定義方法
  const methods = {
    /* ... */
  }

  // 4. 定義生命週期清理
  const cleanup = () => {
    /* cleanup logic */
  }

  // 5. 處理生命週期
  onMounted(() => {
    // 初始化邏輯
  })

  onUnmounted(() => {
    cleanup()
  })

  return {
    state: readonly(state),
    computedState,
    ...methods,
  }
}
```

### 命名規範

- **前綴**: `use`（必需）
- **描述性**: 名稱應清楚描述功能
- **駝峰命名**: 使用 camelCase（`useUserProfile`）
- **功能單一**: 每個 composable 專注一個功能

## 📋 狀態管理 Composables

### useAuth

```typescript
import { ref, computed } from 'vue'
import { authApi } from '@/services/auth'
import type { User, AuthState } from '@/types'

export function useAuth() {
  // 狀態
  const user = ref<User | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // 計算屬性
  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  // 方法
  const login = async (credentials: LoginCredentials): Promise<void> => {
    isLoading.value = true
    error.value = null

    try {
      const response = await authApi.login(credentials)
      user.value = response.data
    } catch (err) {
      error.value = err.message
    } finally {
      isLoading.value = false
    }
  }

  const logout = (): void => {
    user.value = null
    error.value = null
  }

  const checkAuth = async (): Promise<boolean> => {
    try {
      const response = await authApi.checkAuth()
      user.value = response.data
      return true
    } catch {
      return false
    }
  }

  // 返回響應式對象
  return {
    user: readonly(user),
    isLoading: readonly(isLoading),
    error: readonly(error),
    isAuthenticated,
    isAdmin,
    login,
    logout,
    checkAuth,
  }
}
```

### useLocalStorage

```typescript
import { ref, watch } from 'vue'

export function useLocalStorage<T>(key: string, defaultValue: T) {
  // 狀態
  const value = ref<T>(defaultValue)

  // 從 localStorage 讀取
  const loadValue = () => {
    try {
      const item = localStorage.getItem(key)
      if (item) {
        value.value = JSON.parse(item)
      }
    } catch (error) {
      console.error(`從 localStorage 讀取時發生錯誤: ${error}`)
    }
  }

  // 儲存到 localStorage
  const saveValue = (newValue: T) => {
    try {
      localStorage.setItem(key, JSON.stringify(newValue))
    } catch (error) {
      console.error(`儲存到 localStorage 時發生錯誤: ${error}`)
    }
  }

  // 雙向監聽
  watch(
    value,
    newValue => {
      saveValue(newValue)
    },
    { deep: true }
  )

  // 初始化
  loadValue()

  return {
    value: readonly(value),
    saveValue,
    loadValue,
  }
}
```

### useDebounce

```typescript
import { ref } from 'vue'

export function useDebounce<T extends (...args: any[]) => any>(func: T, wait: number = 300) {
  const timeoutId = ref<NodeJS.Timeout>()

  const debouncedFunc = (...args: Parameters<T>) => {
    // 執行前清理
    if (timeoutId.value) {
      clearTimeout(timeoutId.value)
    }

    timeoutId.value = setTimeout(() => {
      return func(...args)
    }, wait)
  }

  return debouncedFunc
}
```

### useInfiniteScroll

```typescript
import { ref, onMounted, onUnmounted } from 'vue'

export function useInfiniteScroll(callback?: (scrollDirection: 'up' | 'down') => void) {
  const isScrolling = ref(false)
  const scrollDirection = ref<'up' | 'down'>('down')
  const lastScrollY = ref(0)

  const handleScroll = () => {
    const currentScrollY = window.scrollY
    const newDirection = currentScrollY > lastScrollY.value ? 'down' : 'up'

    if (isScrolling.value && scrollDirection.value !== newDirection) {
      isScrolling.value = false
    }

    isScrolling.value = true
    scrollDirection.value = newDirection
    lastScrollY.value = currentScrollY

    if (callback) {
      callback(scrollDirection.value)
    }
  }

  onMounted(() => {
    window.addEventListener('scroll', handleScroll)
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
  })

  return {
    isScrolling: readonly(isScrolling),
    scrollDirection: readonly(scrollDirection),
  }
}
```

## 🎯 實用 Composables

### useToggle

```typescript
import { ref, computed } from 'vue'

export function useToggle(initialState = false) {
  const state = ref(initialState)

  const toggle = () => {
    state.value = !state.value
  }

  const setTrue = () => {
    state.value = true
  }

  const setFalse = () => {
    state.value = false
  }

  return {
    state: readonly(state),
    toggle,
    setTrue,
    setFalse,
    isActive: computed(() => state.value),
    isInactive: computed(() => !state.value),
  }
}
```

### useCounter

```typescript
import { ref, computed } from 'vue'

export function useCounter(initialValue = 0) {
  const count = ref(initialValue)

  const increment = () => {
    count.value++
  }

  const decrement = () => {
    count.value--
  }

  const reset = () => {
    count.value = initialValue
  }

  const double = computed(() => count.value * 2)
  const isEven = computed(() => count.value % 2 === 0)
  const isOdd = computed(() => !isEven.value)

  return {
    count: readonly(count),
    increment,
    decrement,
    reset,
    double,
    isEven,
    isOdd,
  }
}
```

### useClipboard

```typescript
import { ref } from 'vue'

export function useClipboard() {
  const text = ref('')
  const isSupported = ref(false)
  const error = ref<string | null>(null)

  const copyToClipboard = async (value: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(value)
      text.value = value
      isSupported.value = true
      error.value = null
      return true
    } catch (err) {
      error.value = err.message
      isSupported.value = false
      return false
    }
  }

  const pasteFromClipboard = async (): Promise<string | null> => {
    try {
      const clipboardText = await navigator.clipboard.readText()
      text.value = clipboardText
      isSupported.value = true
      error.value = null
      return clipboardText
    } catch (err) {
      error.value = err.message
      isSupported.value = false
      return null
    }
  }

  return {
    text: readonly(text),
    isSupported: readonly(isSupported),
    error: readonly(error),
    copyToClipboard,
    pasteFromClipboard,
  }
}
```

## 🎯 業務邏輯 Composables

### useApiCall

```typescript
import { ref } from 'vue'
import type { ApiResponse } from '@/types'

export function useApiCall<T>(apiCall: () => Promise<ApiResponse<T>>) {
  const data = ref<T | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const execute = async (...args: Parameters<typeof apiCall>) => {
    loading.value = true
    error.value = null

    try {
      const response = await apiCall(...args)
      data.value = response.data
    } catch (err) {
      error.value = err.message
      data.value = null
    } finally {
      loading.value = false
    }
  }

  return {
    data: readonly(data),
    loading: readonly(loading),
    error: readonly(error),
    execute,
  }
}
```

### useEventListener

```typescript
import { onMounted, onUnmounted } from 'vue'

export function useEventListener(
  target: EventTarget,
  event: string,
  handler: (event: Event) => void,
  options?: AddEventListenerOptions
) {
  onMounted(() => {
    target.addEventListener(event, handler, options)
  })

  onUnmounted(() => {
    target.removeEventListener(event, handler, options)
  })
}
```

## 🎯 Lucky50 專案特化

### useLunarCalendar

```typescript
import { ref, computed } from 'vue'
import { lunarCalendarApi } from '@/services/lunarCalendar'
import type { LunarInfo, AuspiciousInfo } from '@/types'

export function useLunarCalendar() {
  const currentDate = ref(new Date())
  const lunarInfo = ref<LunarInfo | null>(null)
  const auspiciousInfo = ref<AuspiciousInfo | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // 計算屬性
  const formattedDate = computed(() => {
    return currentDate.value.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  })

  const isAuspiciousDay = computed(() => {
    return auspiciousInfo.value?.overallAuspicious ?? false
  })

  // 方法
  const fetchLunarInfo = async (date: Date) => {
    isLoading.value = true
    error.value = null

    try {
      const [lunarData, auspiciousData] = await Promise.all([
        lunarCalendarApi.getLunarDate(date),
        lunarCalendarApi.getAuspiciousInfo(date),
      ])

      lunarInfo.value = lunarData
      auspiciousInfo.value = auspiciousData
    } catch (err) {
      error.value = err.message
    } finally {
      isLoading.value = false
    }
  }

  const setDate = (date: Date) => {
    currentDate.value = date
    fetchLunarInfo(date)
  }

  // 初始化
  fetchLunarInfo(currentDate.value)

  return {
    currentDate: readonly(currentDate),
    lunarInfo: readonly(lunarInfo),
    auspiciousInfo: readonly(auspiciousInfo),
    isLoading: readonly(isLoading),
    error: readonly(error),
    formattedDate,
    isAuspiciousDay,
    setDate,
    fetchLunarInfo,
  }
}
```

### useInvestmentAnalysis

```typescript
import { ref, computed } from 'vue'
import { investmentApi } from '@/services/investment'
import type { StockData, TechnicalIndicator } from '@/types'

export function useInvestmentAnalysis() {
  const stockData = ref<StockData[]>([])
  const technicalIndicators = ref<TechnicalIndicator[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // 計算屬性
  const latestPrice = computed(() => {
    return stockData.value[0]?.price ?? 0
  })

  const priceChange = computed(() => {
    if (stockData.value.length < 2) return 0
    const latest = stockData.value[0].price
    const previous = stockData.value[1].price
    return ((latest - previous) / previous) * 100
  })

  const isMarketOpen = computed(() => {
    const now = new Date()
    const hour = now.getHours()
    const day = now.getDay()

    // 台股交易時間：週一至週五 9:00-13:30
    return day >= 1 && day <= 5 && hour >= 9 && hour < 13.5
  })

  // 方法
  const fetchStockData = async (symbol: string) => {
    isLoading.value = true
    error.value = null

    try {
      const data = await investmentApi.getStockData(symbol)
      stockData.value = data
    } catch (err) {
      error.value = err.message
    } finally {
      isLoading.value = false
    }
  }

  const fetchTechnicalIndicators = async (symbol: string) => {
    isLoading.value = true
    error.value = null

    try {
      const indicators = await investmentApi.getTechnicalIndicators(symbol)
      technicalIndicators.value = indicators
    } catch (err) {
      error.value = err.message
    } finally {
      isLoading.value = false
    }
  }

  return {
    stockData: readonly(stockData),
    technicalIndicators: readonly(technicalIndicators),
    isLoading: readonly(isLoading),
    error: readonly(error),
    latestPrice,
    priceChange,
    isMarketOpen,
    fetchStockData,
    fetchTechnicalIndicators,
  }
}
```

---

## 📋 最佳實踐

### 所有 composables 都應該：

1. **使用 `readonly()` 保護內部狀態**
2. **提供清晰的類型定義**
3. **處理清理工作**
4. **遵循單一職責原則**
5. **包含適當的錯誤處理**
6. **使用繁體中文註解和變數命名（適用於 Lucky50 專案）**

### 命名慣例

- 使用描述性的名稱：`useUserProfile` 而非 `useUser`
- 包含數據類型：`useStringStorage`、`useBooleanState`
- 表達意圖：`useDebouncedSearch` 而非 `useSearch`

### 測試指南

```typescript
import { describe, it, expect } from 'vitest'
import { useCounter } from '@/composables/useCounter'

describe('useCounter', () => {
  it('應該正確初始化計數器', () => {
    const { count } = useCounter(5)
    expect(count.value).toBe(5)
  })

  it('應該正確遞增', () => {
    const { count, increment } = useCounter()
    increment()
    expect(count.value).toBe(1)
  })

  it('應該正確重置', () => {
    const { count, increment, reset } = useCounter(0)
    increment()
    increment()
    reset()
    expect(count.value).toBe(0)
  })
})
```
