# Copilot Instructions - Lucky50 農民曆智慧投資系統

## 專案概述

這是一個使用 Vue 3 + Vite + TypeScript 建立的農民曆智慧投資系統，結合傳統農民曆智慧與現代金融科技，提供 0050 ETF 投資建議。專案特色包含 3D 視覺化、PWA 功能、深色/淺色主題切換和即時數據分析。請嚴格遵守以下指引。

## 此文件的介紹

- 本文件是為了幫助 GitHub Copilot 和各種 AI 工具更容易理解此倉庫的上下文。
- 在實施新功能時，請以這裡示範的技術選擇、設計方針和模組結構為前提。
- 若有不確定之處,請探索倉庫的檔案，並詢問使用者「這是這樣的意思嗎?」

## 前提條件

- 回應必須使用**繁體中文 (zh-TW)**。
- 在進行變更時，如果變更量有可能超過 300 行，請事先確認「這個指示的變更量可能會超過 300 行，您是否要執行？」
- 對於大的變更，首先制定計畫，然後告訴使用者「我打算這樣進行計畫。」如果使用者要求修正計畫，請進行調整後再提議。

## 允許使用的套件

### 核心依賴

- **Vue**: `^3.4.0` - 使用 Composition API
- **Vite**: `^4.5.0` - 建構工具
- **TypeScript**: `^5.9.2`
- **Vue Router**: `^4.2.5` - 路由管理
- **Pinia**: `^3.0.3` - 狀態管理
- **pinia-plugin-persistedstate**: `^4.5.0` - Pinia 持久化插件
- **Tailwind CSS**: `^3.3.5` - 樣式框架
- **Three.js**: `^0.158.0` - 3D 視覺化
- **@tweenjs/tween.js**: `^25.0.0` - 動畫庫

### 圖表與資料視覺化

- **Chart.js**: `^4.4.0` - 圖表庫
- **vue-chartjs**: `^5.3.0` - Vue Chart.js 整合

### 日期與農曆處理

- **date-fns**: `^2.30.0` - 日期處理工具
- **lunar-javascript**: `^1.6.12` - 農曆計算
- **@vuepic/vue-datepicker**: `^11.0.2` - 日期選擇器

### 工具庫

- **axios**: `^1.6.0` - HTTP 客戶端
- **chinese-s2t**: `^1.0.0` - 繁簡轉換

### PWA 支援

- **vite-plugin-pwa**: `^1.0.3` - PWA 插件

### 開發依賴

- `@types/node`, `@types/three`
- `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`
- `@vitejs/plugin-vue`
- `eslint`, `eslint-plugin-vue`
- `postcss`, `autoprefixer`
- `prettier`: `^3.0.3` - 程式碼格式化
- `vue-tsc`: `^1.8.27` - TypeScript 類型檢查
- `terser`: `^5.44.0` - 程式碼壓縮

## 嚴格禁止的套件

❌ **不要使用以下套件或建議安裝**：

- React、Next.js、Angular 等其他框架
- Redux、Redux Toolkit、Zustand、Recoil（已使用 Pinia）
- styled-components、emotion、CSS-in-JS 庫（已使用 Tailwind CSS）
- Vue 2 語法或 Options API（使用 Vue 3 Composition API）
- Material-UI、Ant Design、Element Plus 等 UI 框架（使用 Tailwind CSS）
- moment.js（使用 date-fns）
- jQuery
- Bootstrap

## 必須遵守的寫法

### 1. Vue 3 檔案結構順序

**所有 Vue 單文件元件（SFC）必須遵循以下順序：`<style>` → `<script>` → `<template>`**

✅ **正確寫法**：

```vue
<style scoped>
.container {
  @apply p-4 rounded-lg bg-card-bg;
}

.button {
  @apply px-4 py-2 rounded-lg transition-colors;
}
</style>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

// Props 定義
interface Props {
  title: string
  count?: number
}

const props = withDefaults(defineProps<Props>(), {
  count: 0,
})

// Emits 定義
interface Emits {
  (e: 'update', value: number): void
  (e: 'close'): void
}

const emit = defineEmits<Emits>()

// 響應式狀態
const loading = ref(false)
const data = ref<string[]>([])

// 計算屬性
const displayText = computed(() => `${props.title}: ${props.count}`)

// 方法
const handleClick = () => {
  emit('update', props.count + 1)
}

// 生命週期
onMounted(() => {
  console.log('Component mounted')
})
</script>

<template>
  <div class="container">
    <h1>{{ displayText }}</h1>
    <button @click="handleClick" class="button">增加</button>
  </div>
</template>
```

❌ **錯誤寫法 - 不要使用其他順序**：

```vue
<!-- 不要將 script 放在最前面 -->
<script setup lang="ts">
// ...
</script>

<template>// ...</template>

<style scoped>
// ...
</style>
```

**檔案結構原則**：

1. **`<style scoped>`** - 樣式定義永遠放在最前面
2. **`<script setup lang="ts">`** - TypeScript 邏輯放在中間
3. **`<template>`** - HTML 模板放在最後

### 2. Vue 3 Composition API 規則

❌ **禁止使用 Options API**：

```vue
<!-- 不要使用這種寫法 -->
<script>
export default {
  data() {
    return {
      count: 0,
    }
  },
  methods: {
    increment() {
      this.count++
    },
  },
}
</script>
```

### 2. 狀態管理方針

本專案使用 **Pinia** 進行全局狀態管理，所有 store 定義都在 `src/stores/` 目錄中。

#### 定義 Pinia Store

✅ **正確寫法（Setup Store 模式）**：

```typescript
// stores/user.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserProfile } from '@/types'

export const useUserStore = defineStore(
  'user',
  () => {
    // State
    const profile = ref<UserProfile | null>(null)
    const isLoggedIn = ref(false)

    // Getters
    const userName = computed(() => profile.value?.name || '訪客')
    const userElement = computed(() => profile.value?.element || '未知')

    // Actions
    const setProfile = (newProfile: UserProfile) => {
      profile.value = newProfile
      isLoggedIn.value = true
    }

    const logout = () => {
      profile.value = null
      isLoggedIn.value = false
    }

    return {
      // State
      profile,
      isLoggedIn,
      // Getters
      userName,
      userElement,
      // Actions
      setProfile,
      logout,
    }
  },
  {
    // 持久化配置
    persist: {
      key: 'lucky50-user',
      storage: localStorage,
      paths: ['profile', 'isLoggedIn'], // 只持久化指定欄位
    },
  }
)
```

#### 在元件中使用 Store

```vue
<script setup lang="ts">
import { useUserStore } from '@/stores/user'
import { useDashboardStore } from '@/stores/dashboard'

const userStore = useUserStore()
const dashboardStore = useDashboardStore()

// 直接存取狀態和方法
const userName = computed(() => userStore.userName)

const handleLogin = () => {
  userStore.setProfile({
    name: '測試用戶',
    birthDate: '1990-01-01',
    // ...
  })
}
</script>

<template>
  <div>
    <p>歡迎，{{ userName }}</p>
    <button @click="handleLogin">登入</button>
  </div>
</template>
```

#### 持久化狀態管理

使用 `pinia-plugin-persistedstate` 實現持久化：

✅ **持久化配置**：

```typescript
// main.ts
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

// stores/dashboard.ts - 完整持久化
export const useDashboardStore = defineStore(
  'dashboard',
  () => {
    // ... store 邏輯
  },
  {
    persist: true, // 持久化所有狀態
  }
)

// stores/analytics.ts - 部分持久化
export const useAnalyticsStore = defineStore(
  'analytics',
  () => {
    // ... store 邏輯
  },
  {
    persist: {
      key: 'lucky50-analytics',
      storage: sessionStorage, // 可選擇 localStorage 或 sessionStorage
      paths: ['selectedStockId', 'timeRange'], // 只持久化指定欄位
    },
  }
)
```

**持久化注意事項**：

- 使用 `lucky50-` 前綴作為 localStorage key
- 大型資料集（如圖表資料）不應持久化
- 敏感資料應加密或不持久化

❌ **不要使用**：

- Vuex
- 其他狀態管理方案
- 直接操作 localStorage（應透過 Pinia 持久化插件）

### 3. 路由管理

本專案使用 **Vue Router 4**。

✅ **路由定義**：

```typescript
// router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/Home.vue'),
    meta: {
      title: '首頁 - 農民曆智慧投資',
      description: '結合傳統農民曆智慧與現代金融科技的投資建議系統',
    },
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: {
      title: '投資儀表板',
      requiresAuth: false,
    },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// 路由守衛
router.beforeEach((to, from, next) => {
  // 更新頁面標題
  document.title = (to.meta.title as string) || '農民曆智慧投資'
  next()
})

export default router
```

#### 在元件中使用路由

```vue
<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const navigateToDashboard = () => {
  router.push({ name: 'dashboard' })
}

const currentPath = computed(() => route.path)
</script>
```

### 4. Tailwind CSS 樣式

本專案使用 Tailwind CSS，並有自定義主題色系。

✅ **正確寫法**：

```vue
<template>
  <div
    class="
      flex items-center justify-center p-4 
      bg-card-bg text-primary-text 
      rounded-lg shadow-md
      hover:shadow-lg transition-all duration-300
    "
  >
    <h1 class="text-2xl font-bold text-accent-gold">標題</h1>
  </div>
</template>
```

#### 自定義主題色

專案已在 `tailwind.config.js` 定義的主題色：

```javascript
// tailwind.config.js
colors: {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e3a8a',
    900: '#1e293b',
  },
  accent: {
    gold: '#f59e0b',
    'gold-light': '#fbbf24',
    'gold-dark': '#d97706',
  },
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
}

// 動態色彩（支援深色模式）
backgroundColor: {
  'app-bg': 'var(--app-bg)',
  'card-bg': 'var(--card-bg)',
  'surface-bg': 'var(--surface-bg)',
}

textColor: {
  'primary-text': 'var(--primary-text)',
  'secondary-text': 'var(--secondary-text)',
  'accent-text': 'var(--accent-text)',
}
```

**使用範例**：

```vue
<template>
  <div class="bg-app-bg text-primary-text min-h-screen">
    <div class="bg-card-bg p-6 rounded-lg">
      <h2 class="text-accent-gold">金色標題</h2>
      <p class="text-secondary-text">說明文字</p>
      <button class="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg">
        按鈕
      </button>
    </div>
  </div>
</template>
```

#### RWD 響應式設計

所有元件必須支援響應式設計，採用 **Mobile First** 原則：

✅ **RWD 正確寫法**：

```vue
<template>
  <div
    class="
      w-full px-4 py-2 text-sm
      sm:px-6 sm:text-base
      md:px-8 md:py-4
      lg:max-w-7xl lg:mx-auto lg:px-12 lg:py-6 lg:text-lg
    "
  >
    <h1 class="text-xl font-bold sm:text-2xl md:text-3xl lg:text-4xl">響應式標題</h1>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
      <!-- 卡片內容 -->
    </div>

    <!-- 手機版顯示，桌面版隱藏 -->
    <div class="block lg:hidden">手機版導航</div>

    <!-- 桌面版顯示，手機版隱藏 -->
    <div class="hidden lg:block">桌面版導航</div>
  </div>
</template>
```

**RWD 開發原則**：

1. 採用 **Mobile First** 設計（預設樣式為手機版）
2. 使用斷點前綴漸進增強（`sm:`、`md:`、`lg:`、`xl:`、`2xl:`）
3. 確保桌面版有適當的最大寬度（`max-w-*`）和置中（`mx-auto`）
4. 文字大小、間距、佈局都要有響應式變化
5. 圖片使用適當的尺寸和載入策略

❌ **不要使用**：

- inline styles（除非是動態計算的值）
- CSS Modules
- scoped style 中的全域樣式覆蓋
- `!important`（應透過 Tailwind 層級控制）

### 5. 深色/淺色主題系統

專案使用 Composable 實現主題切換。

✅ **主題系統實作**：

```typescript
// composables/useTheme.ts
import { ref, computed, watch, readonly } from 'vue'

export type Theme = 'light' | 'dark'

const THEME_KEY = 'lucky50-theme'

// 全域主題狀態（單例模式）
const theme = ref<Theme>((localStorage.getItem(THEME_KEY) as Theme) || 'dark')

export const useTheme = () => {
  const isDark = computed(() => theme.value === 'dark')
  const isLight = computed(() => theme.value === 'light')

  const toggleTheme = () => {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  const setTheme = (newTheme: Theme) => {
    theme.value = newTheme
  }

  // 監聽主題變化，更新 localStorage 和 document 類別
  watch(
    theme,
    newTheme => {
      localStorage.setItem(THEME_KEY, newTheme)

      // 更新 document 的 class
      if (typeof document !== 'undefined') {
        document.documentElement.classList.remove('light', 'dark')
        document.documentElement.classList.add(newTheme)

        // 更新 meta theme-color
        const metaTheme = document.querySelector('meta[name="theme-color"]')
        if (metaTheme) {
          metaTheme.setAttribute('content', newTheme === 'dark' ? '#1e3a8a' : '#ffffff')
        }
      }
    },
    { immediate: true }
  )

  return {
    theme: readonly(theme),
    isDark,
    isLight,
    toggleTheme,
    setTheme,
  }
}
```

#### 在元件中使用主題

```vue
<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'

const { theme, isDark, toggleTheme } = useTheme()
</script>

<template>
  <button
    @click="toggleTheme"
    class="p-2 rounded-lg bg-card-bg hover:bg-surface-bg transition-colors"
  >
    <span v-if="isDark">🌙 深色模式</span>
    <span v-else>☀️ 淺色模式</span>
  </button>
</template>
```

### 6. TypeScript 嚴格模式與型別定義

所有程式碼必須符合 TypeScript 嚴格模式，並遵循以下型別定義規範。

#### 優先使用 interface

✅ **正確寫法 - 使用 interface**：

```typescript
// types/index.ts

// 使用者資料
export interface UserProfile {
  name: string
  birthDate: string
  birthTime: string
  zodiac: string
  element: string
  luckyColors: string[]
  luckyNumbers: number[]
}

// 運勢資料
export interface FortuneData {
  date: string
  overallScore: number
  investmentScore: number
  recommendation: 'BUY' | 'HOLD' | 'SELL'
  advice: string
  luckyTime: string
  avoidTime: string
  elements: {
    metal: number
    wood: number
    water: number
    fire: number
    earth: number
  }
}

// ETF 資料
export interface ETFData {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  change: number
  changePercent: number
}

// 元件 Props
export interface ChartProps {
  data: ETFData[]
  loading?: boolean
  height?: number
}
```

#### 何時使用 type

只在以下情況使用 `type`：

```typescript
// Union types
export type Theme = 'light' | 'dark'
export type InvestmentAction = 'BUY' | 'HOLD' | 'SELL'
export type ChartType = 'line' | 'bar' | 'candlestick'

// 元素類型
export type Element = 'metal' | 'wood' | 'water' | 'fire' | 'earth'

// 複雜聯合型別
export type ApiResponse<T> = { success: true; data: T } | { success: false; error: string }
```

**型別定義原則**：

1. **優先 interface** - 物件結構、類別定義、元件 Props
2. **描述性命名** - `UserProfile` 而非 `UP`，`ETFData` 而非 `ED`
3. **避免 any** - 使用 `unknown` 或具體類型
4. **統一放置** - 所有型別定義放在 `src/types/index.ts`
5. **匯出型別** - 所有型別都應匯出供其他模組使用

#### Vue 3 專屬型別

```typescript
// 元件實例類型
import type { ComponentPublicInstance } from 'vue'
import type MyComponent from './MyComponent.vue'

type MyComponentInstance = ComponentPublicInstance<typeof MyComponent>

// Ref 類型
import type { Ref, ComputedRef } from 'vue'

const count: Ref<number> = ref(0)
const doubled: ComputedRef<number> = computed(() => count.value * 2)

// Props 和 Emits 型別
interface Props {
  title: string
  count?: number
}

interface Emits {
  (e: 'update', value: number): void
  (e: 'close'): void
}
```

❌ **避免的寫法**：

```typescript
// ❌ 不要使用 type 定義物件結構
type UserData = {
  name: string
}

// ❌ 不要使用模糊的名稱
interface P {
  t: string
}

// ❌ 不要使用 any
function process(data: any) {}

// ❌ 不要忘記匯出
interface InternalType {} // 應加上 export
```

### 7. Composables 自定義 Hook

本專案使用 Composables 模式封裝可重用邏輯。

✅ **Composable 範例**：

```typescript
// composables/useToast.ts
import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastMessage {
  id: string
  type: ToastType
  message: string
  duration?: number
}

const toasts = ref<ToastMessage[]>([])

export const useToast = () => {
  const show = (type: ToastType, message: string, duration = 3000) => {
    const id = `toast-${Date.now()}-${Math.random()}`
    toasts.value.push({ id, type, message, duration })

    setTimeout(() => {
      remove(id)
    }, duration)
  }

  const remove = (id: string) => {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }

  const success = (message: string, duration?: number) => {
    show('success', message, duration)
  }

  const error = (message: string, duration?: number) => {
    show('error', message, duration)
  }

  const warning = (message: string, duration?: number) => {
    show('warning', message, duration)
  }

  const info = (message: string, duration?: number) => {
    show('info', message, duration)
  }

  return {
    toasts: readonly(toasts),
    show,
    remove,
    success,
    error,
    warning,
    info,
  }
}
```

#### 在元件中使用 Composable

```vue
<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const toast = useToast()

const handleSave = async () => {
  try {
    await saveData()
    toast.success('儲存成功')
  } catch (error) {
    toast.error('儲存失敗，請稍後再試')
  }
}
</script>
```

**Composable 命名規則**：

- 使用 `use` 前綴（如 `useTheme`、`useToast`）
- 檔案名稱使用 camelCase（如 `useTheme.ts`）
- 放置於 `src/composables/` 目錄

### 8. 資料獲取與 API 呼叫

本專案使用 **axios** 進行 API 呼叫，Service 層位於 `src/services/` 目錄。

✅ **Service 層實作**：

```typescript
// services/finmind.ts
import axios from 'axios'
import type { ETFData } from '@/types'

const FINMIND_BASE_URL = 'https://api.finmindtrade.com/api/v4'

export class FinMindService {
  private static instance: FinMindService

  static getInstance(): FinMindService {
    if (!this.instance) {
      this.instance = new FinMindService()
    }
    return this.instance
  }

  async getETFData(stockId: string, startDate: string, endDate: string): Promise<ETFData[]> {
    try {
      const response = await axios.get(`${FINMIND_BASE_URL}/data`, {
        params: {
          dataset: 'TaiwanStockPrice',
          data_id: stockId,
          start_date: startDate,
          end_date: endDate,
        },
        timeout: 10000,
      })

      if (response.data.status !== 200) {
        throw new Error('API 回應錯誤')
      }

      return response.data.data.map((item: any) => ({
        date: item.date,
        open: item.open,
        high: item.max,
        low: item.min,
        close: item.close,
        volume: item.Trading_Volume,
        change: item.close - item.open,
        changePercent: ((item.close - item.open) / item.open) * 100,
      }))
    } catch (error) {
      console.error('Failed to fetch ETF data:', error)
      throw error
    }
  }
}

// 單例匯出
export const finmindService = FinMindService.getInstance()
```

#### 在 Store 中使用 Service

```typescript
// stores/investment.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { finmindService } from '@/services/finmind'
import type { ETFData } from '@/types'

export const useInvestmentStore = defineStore('investment', () => {
  const etfData = ref<ETFData[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchETFData = async (stockId: string, startDate: string, endDate: string) => {
    loading.value = true
    error.value = null

    try {
      const data = await finmindService.getETFData(stockId, startDate, endDate)
      etfData.value = data
    } catch (err) {
      error.value = err instanceof Error ? err.message : '資料載入失敗'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    etfData,
    loading,
    error,
    fetchETFData,
  }
})
```

#### 在元件中使用

```vue
<script setup lang="ts">
import { onMounted } from 'vue'
import { useInvestmentStore } from '@/stores/investment'
import { useToast } from '@/composables/useToast'

const investmentStore = useInvestmentStore()
const toast = useToast()

onMounted(async () => {
  try {
    await investmentStore.fetchETFData('0050', '2024-01-01', '2024-12-31')
  } catch (error) {
    toast.error('資料載入失敗')
  }
})
</script>

<template>
  <div>
    <div v-if="investmentStore.loading">載入中...</div>
    <div v-else-if="investmentStore.error">{{ investmentStore.error }}</div>
    <div v-else>
      <!-- 顯示資料 -->
    </div>
  </div>
</template>
```

**API 呼叫原則**：

- 使用 Service 層封裝 API 邏輯
- Service 使用單例模式
- 在 Store 中處理資料狀態
- 統一錯誤處理
- 設定適當的 timeout

### 9. Three.js 3D 視覺化

專案使用 Three.js 進行 3D 視覺化。

✅ **Three.js 元件範例**：

```vue
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as THREE from 'three'
import { TWEEN } from '@tweenjs/tween.js'

interface Props {
  data: number[]
  autoRotate?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  autoRotate: true,
})

const containerRef = ref<HTMLDivElement>()
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let animationId: number

const initThreeJS = () => {
  if (!containerRef.value) return

  // 場景
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0f172a)

  // 相機
  const width = containerRef.value.clientWidth
  const height = containerRef.value.clientHeight
  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
  camera.position.z = 5

  // 渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(window.devicePixelRatio)
  containerRef.value.appendChild(renderer.domElement)

  // 添加物體
  const geometry = new THREE.BoxGeometry()
  const material = new THREE.MeshBasicMaterial({ color: 0x3b82f6 })
  const cube = new THREE.Mesh(geometry, material)
  scene.add(cube)

  // 動畫循環
  const animate = () => {
    animationId = requestAnimationFrame(animate)
    TWEEN.update()

    if (props.autoRotate) {
      cube.rotation.x += 0.01
      cube.rotation.y += 0.01
    }

    renderer.render(scene, camera)
  }

  animate()
}

const cleanup = () => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  if (renderer && containerRef.value) {
    containerRef.value.removeChild(renderer.domElement)
    renderer.dispose()
  }
}

onMounted(() => {
  initThreeJS()
})

onBeforeUnmount(() => {
  cleanup()
})

// 監聽資料變化
watch(
  () => props.data,
  () => {
    // 更新 3D 視覺化
  }
)
</script>

<template>
  <div ref="containerRef" class="w-full h-full" />
</template>
```

**Three.js 開發原則**：

- 在 `onMounted` 中初始化場景
- 在 `onBeforeUnmount` 中清理資源
- 使用 `requestAnimationFrame` 進行動畫
- 響應式處理視窗大小變化
- 注意記憶體管理和效能優化

### 10. Chart.js 圖表元件

專案使用 Chart.js + vue-chartjs 進行圖表繪製。

✅ **圖表元件範例**：

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
} from 'chart.js'
import type { ETFData } from '@/types'

// 註冊 Chart.js 元件
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

interface Props {
  data: ETFData[]
  height?: number
}

const props = withDefaults(defineProps<Props>(), {
  height: 300,
})

const chartData = computed<ChartData<'line'>>(() => ({
  labels: props.data.map(d => d.date),
  datasets: [
    {
      label: '收盤價',
      data: props.data.map(d => d.close),
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
    },
  ],
}))

const chartOptions = computed<ChartOptions<'line'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top',
    },
    tooltip: {
      mode: 'index',
      intersect: false,
    },
  },
  scales: {
    x: {
      display: true,
      title: {
        display: true,
        text: '日期',
      },
    },
    y: {
      display: true,
      title: {
        display: true,
        text: '價格',
      },
    },
  },
}))
</script>

<template>
  <div :style="{ height: `${height}px` }">
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>
```

### 11. 路徑別名

使用 `@/` 作為 `src/` 的別名：

```typescript
// ✅ 正確的引入方式
import { useUserStore } from '@/stores/user'
import FortuneCard from '@/components/FortuneCard.vue'
import { UserProfile } from '@/types'
import { lunarService } from '@/services/lunar'
import { formatDate } from '@/utils/dateHelper'
```

```typescript
// vite.config.ts 配置
import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
})
```

### 12. PWA 功能

專案使用 `vite-plugin-pwa` 實現 PWA 功能。

✅ **PWA 配置**：

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.finmindtrade\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'finmind-api',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 天
              },
            },
          },
        ],
      },
      manifest: {
        name: '農民曆智慧投資',
        short_name: 'Lucky50',
        description: '結合傳統農民曆智慧與現代金融科技的投資建議系統',
        theme_color: '#3B82F6',
        background_color: '#0f172a',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
})
```

### 13. 套件管理器

✅ **必須使用 pnpm**：

```bash
pnpm add package-name
pnpm remove package-name
pnpm install
pnpm dev
pnpm build
```

❌ **不要使用**：

```bash
npm install
yarn add
```

### 14. 性能最佳化

#### Vue 元件最佳化

```vue
<script setup lang="ts">
import { computed, shallowRef } from 'vue'

// 使用 shallowRef 處理大型物件（如圖表資料）
const chartData = shallowRef<ETFData[]>([])

// 使用 computed 快取計算結果
const sortedData = computed(() => {
  return [...chartData.value].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
})
</script>

<template>
  <!-- 使用 v-once 處理靜態內容 -->
  <div v-once>
    <h1>靜態標題</h1>
  </div>

  <!-- 使用 v-memo 優化列表渲染 -->
  <div v-for="item in sortedData" :key="item.date" v-memo="[item.date, item.close]">
    {{ item.date }}: {{ item.close }}
  </div>
</template>
```

#### 路由層級程式碼分割

```typescript
// router/index.ts
const routes = [
  {
    path: '/dashboard',
    name: 'dashboard',
    // 使用動態 import 實現程式碼分割
    component: () => import('@/views/Dashboard.vue'),
  },
  {
    path: '/analytics',
    name: 'analytics',
    component: () => import('@/views/Analytics.vue'),
  },
]
```

#### 圖片最佳化

```vue
<template>
  <!-- 使用 lazy loading -->
  <img src="@/assets/logo.png" alt="Logo" loading="lazy" />

  <!-- 使用 LazyImage 元件 -->
  <LazyImage :src="imageUrl" :alt="imageAlt" />
</template>
```

## 專案結構規範

```
src/
├── assets/                       # 靜態資源
│   ├── critical.css              # 關鍵 CSS
│   └── style.css                 # 全域樣式
├── components/                   # Vue 元件
│   ├── FortuneCard.vue           # 運勢卡片
│   ├── FortuneOrb.vue            # 運勢球體
│   ├── LunarCalendarCard.vue     # 農曆卡片
│   ├── ThemeToggle.vue           # 主題切換
│   ├── charts/                   # 圖表元件
│   │   ├── ElementRadarChart.vue # 五行雷達圖
│   │   ├── PriceChart.vue        # 價格圖表
│   │   └── VolumeChart.vue       # 成交量圖表
│   ├── layout/                   # 版面元件
│   │   ├── Footer.vue
│   │   ├── Footer_fixed.vue
│   │   └── NavBar.vue
│   ├── three/                    # Three.js 3D 元件
│   │   ├── Fortune3DVisualization.vue
│   │   ├── Lunar3DVisualization.vue
│   │   ├── Stock3DVisualization.vue
│   │   └── Technical3DVisualization.vue
│   └── ui/                       # UI 元件
│       ├── LazyImage.vue
│       ├── Loading.vue
│       ├── Toast.vue
│       └── ToastContainer.vue
├── composables/                  # Composables
│   ├── useTheme.ts               # 主題切換
│   └── useToast.ts               # Toast 通知
├── router/                       # 路由
│   └── index.ts
├── services/                     # API Service 層
│   ├── apiCache.ts               # API 快取
│   ├── finmind.ts                # FinMind API
│   ├── fortune.ts                # 運勢服務
│   ├── integratedFortune.ts      # 整合運勢
│   ├── lunar.ts                  # 農曆服務
│   └── taiwanStock.ts            # 台股服務
├── stores/                       # Pinia Stores
│   ├── analytics.ts              # 分析資料
│   ├── dashboard.ts              # 儀表板
│   ├── investment.ts             # 投資資料
│   └── user.ts                   # 使用者資料
├── types/                        # TypeScript 型別
│   ├── chinese-s2t.d.ts          # 繁簡轉換型別宣告
│   └── index.ts                  # 主要型別定義
├── utils/                        # 工具函式
│   ├── performance.ts            # 性能監控
│   ├── preloader.ts              # 資源預載入
│   └── three-scene.ts            # Three.js 場景工具
├── views/                        # 頁面元件
│   ├── Analytics.vue             # 數據分析頁
│   ├── Dashboard.vue             # 儀表板頁
│   ├── Home.vue                  # 首頁
│   └── Profile.vue               # 個人設定頁
├── App.vue                       # 根元件
└── main.ts                       # 應用入口
```

## 程式碼風格與規範

### 引入順序規範

```vue
<script setup lang="ts">
// 1. Vue 核心
import { ref, computed, watch, onMounted } from 'vue'

// 2. Vue Router / Pinia
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'

// 3. 外部函式庫
import * as THREE from 'three'
import { format } from 'date-fns'

// 4. Composables
import { useTheme } from '@/composables/useTheme'
import { useToast } from '@/composables/useToast'

// 5. 元件
import FortuneCard from '@/components/FortuneCard.vue'
import PriceChart from '@/components/charts/PriceChart.vue'

// 6. Services
import { lunarService } from '@/services/lunar'

// 7. Types
import type { UserProfile, ETFData } from '@/types'

// 8. Utils
import { formatCurrency } from '@/utils/format'
</script>
```

### 註解規範

```typescript
/**
 * 計算投資建議分數
 * @param fortune - 運勢資料
 * @param etfData - ETF 資料
 * @returns 建議分數 (0-100)
 */
function calculateAdviceScore(fortune: FortuneData, etfData: ETFData[]): number {
  // 計算運勢權重
  const fortuneWeight = fortune.investmentScore * 0.4

  // 計算技術指標權重
  const technicalWeight = calculateTechnical(etfData) * 0.6

  // TODO: 加入更多指標
  return fortuneWeight + technicalWeight
}

// FIXME: 此處效能需要優化
function inefficientFunction() {
  // ...
}
```

### Vue 元件結構順序

```vue
<script setup lang="ts">
// 1. Imports
import { ref, computed } from 'vue'

// 2. Types & Interfaces
interface Props {
  title: string
}

// 3. Props & Emits
const props = defineProps<Props>()
const emit = defineEmits<{ (e: 'update'): void }>()

// 4. Composables / Stores
const toast = useToast()

// 5. Reactive State
const count = ref(0)

// 6. Computed
const doubled = computed(() => count.value * 2)

// 7. Methods
const increment = () => {
  count.value++
}

// 8. Lifecycle
onMounted(() => {
  console.log('mounted')
})

// 9. Watchers
watch(count, newVal => {
  console.log(newVal)
})
</script>

<template>
  <!-- Template 內容 -->
</template>

<style scoped>
/* Scoped 樣式 */
</style>
```

## 反模式與最佳實踐

### 應避免的模式

❌ **直接修改 Props**：

```vue
<script setup lang="ts">
const props = defineProps<{ count: number }>()

// ❌ 錯誤：不要直接修改 props
const increment = () => {
  props.count++ // 這會報錯！
}

// ✅ 正確：使用 emit 通知父元件
const emit = defineEmits<{ (e: 'update', value: number): void }>()
const increment = () => {
  emit('update', props.count + 1)
}
</script>
```

❌ **在 computed 中修改狀態**：

```typescript
// ❌ 錯誤
const doubled = computed(() => {
  count.value++ // 不要在 computed 中修改狀態！
  return count.value * 2
})

// ✅ 正確
const doubled = computed(() => count.value * 2)
```

❌ **過度使用 watch**：

```typescript
// ❌ 錯誤：這應該用 computed
const doubled = ref(0)
watch(count, newVal => {
  doubled.value = newVal * 2
})

// ✅ 正確：使用 computed
const doubled = computed(() => count.value * 2)
```

## 安全性與隱私

### 環境變數管理

```bash
# .env
VITE_APP_TITLE=農民曆智慧投資
VITE_API_BASE_URL=https://api.example.com
```

```typescript
// 在程式碼中使用
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
const appTitle = import.meta.env.VITE_APP_TITLE
```

**環境變數規則**：

- 環境變數必須使用 `VITE_` 前綴才能在客戶端存取
- 不要將敏感資訊（如 API key）放在環境變數中
- 使用 `.env.local` 存放本地開發環境變數（不應提交到版控）

### XSS 防護

```vue
<template>
  <!-- ✅ Vue 自動轉義 -->
  <div>{{ userInput }}</div>

  <!-- ❌ 危險：v-html 可能導致 XSS -->
  <div v-html="userInput"></div>

  <!-- ✅ 如果必須使用 v-html，先清理內容 -->
  <div v-html="sanitizedHtml"></div>
</template>

<script setup lang="ts">
import DOMPurify from 'dompurify'

const userInput = ref('<script>alert("XSS")</script>')
const sanitizedHtml = computed(() => DOMPurify.sanitize(userInput.value))
</script>
```

## 新增套件流程

在建議新增任何套件之前，請先確認：

1. ✅ 該功能是否可以用現有套件實現？
2. ✅ 是否可以用原生 JavaScript/TypeScript 實現？
3. ✅ 該套件是否與現有技術棧相容？
4. ✅ 是否真的需要這個套件？
5. ✅ 套件的維護狀態和社群活躍度如何？
6. ✅ 套件的體積和性能影響如何？

如果確實需要新套件，請明確說明理由並等待用戶確認。

## 範例：完整的頁面元件

```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useDashboardStore } from '@/stores/dashboard'
import { useTheme } from '@/composables/useTheme'
import { useToast } from '@/composables/useToast'
import FortuneCard from '@/components/FortuneCard.vue'
import PriceChart from '@/components/charts/PriceChart.vue'
import Loading from '@/components/ui/Loading.vue'
import type { ETFData } from '@/types'

// Stores & Composables
const dashboardStore = useDashboardStore()
const { isDark } = useTheme()
const toast = useToast()

// State
const loading = ref(true)

// Computed
const etfData = computed(() => dashboardStore.etfData)
const hasData = computed(() => etfData.value.length > 0)

// Methods
const loadData = async () => {
  loading.value = true
  try {
    await dashboardStore.fetchDashboardData()
    toast.success('資料載入成功')
  } catch (error) {
    toast.error('資料載入失敗，請稍後再試')
    console.error('Failed to load dashboard data:', error)
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="min-h-screen bg-app-bg text-primary-text">
    <!-- Header -->
    <header class="sticky top-0 z-10 bg-card-bg shadow-md">
      <div class="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <h1 class="text-2xl font-bold sm:text-3xl lg:text-4xl">投資儀表板</h1>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <!-- Loading State -->
      <Loading v-if="loading" class="my-12" />

      <!-- No Data State -->
      <div
        v-else-if="!hasData"
        class="flex flex-col items-center justify-center py-12 text-secondary-text"
      >
        <p class="text-lg">暫無資料</p>
        <button
          @click="loadData"
          class="mt-4 px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
        >
          重新載入
        </button>
      </div>

      <!-- Data Display -->
      <div v-else class="space-y-6">
        <!-- Fortune Card -->
        <FortuneCard />

        <!-- Charts -->
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div class="bg-card-bg p-4 rounded-lg shadow-md sm:p-6">
            <h2 class="text-lg font-semibold mb-4 sm:text-xl">價格走勢</h2>
            <PriceChart :data="etfData" :height="300" />
          </div>

          <div class="bg-card-bg p-4 rounded-lg shadow-md sm:p-6">
            <h2 class="text-lg font-semibold mb-4 sm:text-xl">成交量</h2>
            <VolumeChart :data="etfData" :height="300" />
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* 如需額外樣式可在此添加 */
</style>
```

## 總結

請嚴格遵守以上指引，不要建議或使用專案中未包含的套件和寫法。保持程式碼簡潔、一致，並符合以下核心原則：

1. **Vue 3 Composition API** - 使用 `<script setup>` 語法
2. **Pinia** - 狀態管理與持久化
3. **Vue Router 4** - 路由管理
4. **Tailwind CSS** - 響應式設計與深色模式
5. **TypeScript** - 嚴格模式與型別安全
6. **Three.js** - 3D 視覺化
7. **Chart.js** - 資料視覺化
8. **pnpm** - 套件管理器
9. **PWA** - 漸進式 Web 應用
10. **性能優化** - shallowRef、computed、程式碼分割

開發時始終考慮：型別安全、響應式設計、性能優化、使用者體驗、可維護性。

---

**專案技術棧總覽**：

- ⚡️ Vue 3 + Vite + TypeScript
- 🎨 Tailwind CSS + 深色模式
- 🔄 Pinia + 持久化
- 📱 PWA 支援
- 📊 Chart.js + Three.js
- 🗓️ 農曆計算 + 運勢分析
- 💰 FinMind API + 台股資料
