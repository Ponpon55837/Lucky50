# 錯誤處理系統使用指南

本專案實作了統一的錯誤處理系統，提供一致的錯誤處理、記錄和用戶通知機制。

## 📦 核心組件

### 1. 錯誤類型定義 (`src/types/error.ts`)

定義了完整的錯誤類型系統：

- **ErrorSeverity**: 錯誤嚴重程度 (INFO, WARNING, ERROR, CRITICAL)
- **ErrorCategory**: 錯誤類別 (NETWORK, API, VALIDATION, AUTH 等)
- **AppError**: 應用錯誤介面
- **ApplicationError**: 自定義錯誤類別
- **ErrorCodes**: 預定義錯誤代碼
- **ErrorMessages**: 中文友善錯誤訊息

### 2. 錯誤處理 Composable (`src/composables/useErrorHandler.ts`)

提供統一的錯誤處理邏輯。

### 3. 錯誤 UI 組件

- **ErrorBoundary.vue**: 全域錯誤邊界組件
- **ErrorModal.vue**: 錯誤 Modal 組件

---

## 🚀 使用方式

### 基本用法

```vue
<script setup lang="ts">
import { useErrorHandler } from '@/composables/useErrorHandler'

const { handleError, handleAsyncError } = useErrorHandler()

// 處理同步錯誤
function handleClick() {
  try {
    // 可能出錯的代碼
    throw new Error('Something went wrong')
  } catch (error) {
    handleError(error)
  }
}

// 處理非同步錯誤
async function fetchData() {
  const data = await handleAsyncError(async () => {
    const response = await fetch('/api/data')
    return response.json()
  })

  if (data) {
    // 處理數據
  }
}
</script>
```

### 在 Service 中使用

```typescript
// src/services/myService.ts
import { ApplicationError, ErrorCodes, ErrorCategory, ErrorSeverity } from '@/types/error'

export class MyService {
  static async fetchData() {
    try {
      const response = await fetch('/api/data')

      if (!response.ok) {
        throw new ApplicationError({
          code: ErrorCodes.API_ERROR,
          message: '資料獲取失敗',
          details: `HTTP ${response.status}`,
          severity: ErrorSeverity.ERROR,
          category: ErrorCategory.API,
          metadata: { status: response.status },
        })
      }

      return await response.json()
    } catch (error) {
      // 如果是 ApplicationError，直接拋出
      if (error instanceof ApplicationError) {
        throw error
      }

      // 包裝未知錯誤
      throw new ApplicationError({
        code: ErrorCodes.UNKNOWN_ERROR,
        message: '發生未知錯誤',
        severity: ErrorSeverity.ERROR,
        category: ErrorCategory.UNKNOWN,
        originalError: error,
      })
    }
  }
}
```

### 在 Pinia Store 中使用

```typescript
// src/stores/myStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useErrorHandler } from '@/composables/useErrorHandler'

export const useMyStore = defineStore('myStore', () => {
  const { handleError, handleAsyncError } = useErrorHandler()
  const data = ref(null)
  const loading = ref(false)

  async function fetchData() {
    loading.value = true

    const result = await handleAsyncError(
      async () => {
        const response = await fetch('/api/data')
        return response.json()
      },
      {
        displayType: 'toast',
        showToUser: true,
      }
    )

    if (result) {
      data.value = result
    }

    loading.value = false
  }

  return { data, loading, fetchData }
})
```

### 使用 Error Boundary

在 App.vue 或需要的地方包裹組件：

```vue
<template>
  <ErrorBoundary @error="onError" @retry="onRetry">
    <RouterView />
  </ErrorBoundary>
</template>

<script setup lang="ts">
import ErrorBoundary from '@/components/ErrorBoundary.vue'

function onError(error: Error) {
  console.error('Caught error:', error)
}

function onRetry() {
  // 重試邏輯
  location.reload()
}
</script>
```

### 使用 Error Modal

```vue
<template>
  <button @click="showError">觸發錯誤</button>

  <ErrorModal
    v-model="showModal"
    title="操作失敗"
    message="無法完成此操作，請稍後再試"
    :details="errorDetails"
    :show-details="true"
    :actions="actions"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ErrorModal from '@/components/ErrorModal.vue'

const showModal = ref(false)
const errorDetails = ref('')

const actions = [
  {
    label: '重試',
    type: 'primary' as const,
    action: async () => {
      // 重試邏輯
      console.log('重試...')
    },
  },
  {
    label: '取消',
    type: 'secondary' as const,
    action: () => {
      console.log('取消')
    },
  },
]

function showError() {
  errorDetails.value = 'Error stack trace here...'
  showModal.value = true
}
</script>
```

### 自定義錯誤顯示選項

```typescript
const { handleError } = useErrorHandler()

handleError(error, {
  showToUser: true, // 是否顯示給用戶
  displayType: 'modal', // 顯示方式: 'toast' | 'modal' | 'inline'
  autoCloseDuration: 0, // 自動關閉時間 (0 = 不關閉)
  retryable: true, // 是否可重試
  retryAction: async () => {
    // 重試動作
    await fetchData()
  },
})
```

### 包裝函數自動處理錯誤

```typescript
const { withErrorHandler } = useErrorHandler()

// 包裝同步函數
const safeFunction = withErrorHandler((param: string) => {
  // 可能出錯的代碼
  return processData(param)
})

// 包裝非同步函數
const safeAsyncFunction = withErrorHandler(async (id: number) => {
  const data = await fetchData(id)
  return data
})

// 使用
const result = safeFunction('test')
const asyncResult = await safeAsyncFunction(123)
```

### 查詢錯誤歷史

```typescript
const {
  getErrors,
  getLatestError,
  getErrorsByCategory,
  getErrorsBySeverity,
  clearErrors,
  errorStats,
} = useErrorHandler()

// 取得所有錯誤
const allErrors = getErrors()

// 取得最新錯誤
const latestError = getLatestError()

// 按類別過濾
const apiErrors = getErrorsByCategory(ErrorCategory.API)

// 按嚴重程度過濾
const criticalErrors = getErrorsBySeverity(ErrorSeverity.CRITICAL)

// 清除所有錯誤
clearErrors()

// 錯誤統計
console.log(errorStats.value)
// { total: 10, critical: 1, errors: 5, warnings: 3, info: 1 }
```

---

## 📋 錯誤代碼參考

### 網路錯誤 (NET_xxx)

- `NET_001`: 網路連線異常
- `NET_002`: 網路連線逾時
- `NET_003`: 目前處於離線狀態

### API 錯誤 (API_xxx)

- `API_001`: API 請求失敗
- `API_002`: API 請求逾時
- `API_404`: 找不到請求的資源
- `API_500`: 伺服器發生錯誤
- `API_429`: 請求次數過多

### 驗證錯誤 (VAL_xxx)

- `VAL_001`: 輸入資料驗證失敗
- `VAL_002`: 此欄位為必填
- `VAL_003`: 輸入格式不正確
- `VAL_004`: 輸入值超出允許範圍

### 認證錯誤 (AUTH_xxx)

- `AUTH_001`: 請先登入
- `AUTH_002`: 登入資訊無效
- `AUTH_003`: 登入已過期

### 權限錯誤 (PERM_xxx)

- `PERM_001`: 您沒有權限執行此操作

### 業務邏輯錯誤 (BIZ_xxx)

- `BIZ_001`: 操作失敗
- `BIZ_404`: 找不到相關資料
- `BIZ_400`: 資料無效

### 系統錯誤 (SYS_xxx)

- `SYS_001`: 系統發生錯誤
- `SYS_999`: 發生未知錯誤

---

## 🎯 最佳實踐

### 1. 在 Service 層拋出結構化錯誤

```typescript
// ❌ 不好的做法
throw new Error('API failed')

// ✅ 好的做法
throw new ApplicationError({
  code: ErrorCodes.API_ERROR,
  message: ErrorMessages[ErrorCodes.API_ERROR],
  severity: ErrorSeverity.ERROR,
  category: ErrorCategory.API,
  details: '詳細錯誤資訊',
  metadata: { endpoint: '/api/data', method: 'GET' },
})
```

### 2. 在組件中統一處理錯誤

```typescript
// ❌ 不好的做法
try {
  await someAction()
} catch (error) {
  console.error(error)
  alert('發生錯誤')
}

// ✅ 好的做法
const { handleAsyncError } = useErrorHandler()
await handleAsyncError(async () => {
  await someAction()
})
```

### 3. 為不同嚴重程度使用不同的顯示方式

```typescript
// INFO/WARNING: 使用 toast
handleError(error, { displayType: 'toast' })

// ERROR: 使用 toast 或 inline
handleError(error, { displayType: 'toast' })

// CRITICAL: 使用 modal，不自動關閉
handleError(error, {
  displayType: 'modal',
  autoCloseDuration: 0,
})
```

### 4. 提供重試機制

```typescript
handleError(error, {
  retryable: true,
  retryAction: async () => {
    await refetch()
  },
})
```

---

## 🧪 測試

為錯誤處理編寫測試：

```typescript
import { describe, it, expect, vi } from 'vitest'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { ApplicationError, ErrorCodes, ErrorSeverity, ErrorCategory } from '@/types/error'

describe('useErrorHandler', () => {
  it('should handle application errors', () => {
    const { handleError, getLatestError } = useErrorHandler()

    const error = new ApplicationError({
      code: ErrorCodes.API_ERROR,
      message: 'Test error',
      severity: ErrorSeverity.ERROR,
      category: ErrorCategory.API,
    })

    handleError(error, { showToUser: false })

    const latestError = getLatestError()
    expect(latestError?.code).toBe(ErrorCodes.API_ERROR)
  })
})
```

---

## 📝 待辦事項

未來可以考慮整合：

- [ ] Sentry 錯誤追蹤
- [ ] 錯誤報告功能
- [ ] 自動重試機制
- [ ] 離線錯誤佇列
- [ ] 更詳細的錯誤分析
