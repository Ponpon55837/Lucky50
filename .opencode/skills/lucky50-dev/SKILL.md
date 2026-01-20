---
name: lucky50-dev
description: Lucky50 專案開發規範與最佳實踐指南
license: MIT
compatibility: opencode
metadata:
  version: '1.0.0'
  updated: '2026-01-19'
  language: zh-TW
  project: Lucky50
---

# Lucky50 專案開發規範與技能指南

## 何時使用我

當你需要在 Lucky50 專案中進行以下操作時使用此 skill：

- 新增或修改 Vue 3 組件
- 開發 Pinia Store 或 Composables
- 整合 Three.js 或 Chart.js 視覺化功能
- 處理 API 服務層開發
- 實作錯誤處理機制
- 確認代碼是否符合專案規範

**重要**：所有代碼修改前必須閱讀此規範，確保符合專案的技術棧和風格要求。

---

## 🎯 核心原則

### 1. 技術棧固定原則

**絕對禁止**擅自引入新的技術棧或替換現有技術。本專案技術選型已經確定：

- **前端框架**: Vue 3 (Composition API) + TypeScript
- **狀態管理**: Pinia + pinia-plugin-persistedstate
- **路由**: Vue Router 4
- **樣式**: Tailwind CSS (禁止 CSS-in-JS、styled-components)
- **建置工具**: Vite
- **視覺化**: Three.js (3D) + Chart.js (圖表)
- **HTTP 客戶端**: Axios
- **日期處理**: date-fns (禁止 moment.js)
- **套件管理**: pnpm (禁止 npm、yarn)

### 2. 中文優先原則

- 所有用戶可見的文字必須使用**繁體中文 (zh-TW)**
- Commit 訊息必須使用中文
- 註解和文檔必須使用中文
- 變數名稱使用英文，但註解用中文說明

### 3. 類型安全原則

- 所有代碼必須通過 TypeScript 嚴格模式檢查
- 禁止使用 `any` 類型（除非萬不得已）
- 優先使用 `interface` 定義物件結構
- 只在 Union Types 時使用 `type`

### 4. 代碼品質原則

- 必須通過 ESLint 檢查（無 errors 和 warnings）
- 每次修改後立即驗證代碼正確性
- 大型修改（超過 300 行）必須事先確認

---

## 📁 Vue 組件開發規範

### 核心規則：檔案結構順序

**這是最容易被忽略但最重要的規範！**

#### 規則 1: 有樣式的組件

```vue
<!-- ✅ 正確：<style> → <script> → <template> -->
<style scoped>
.container {
  @apply p-4 rounded-lg bg-card-bg;
}
</style>

<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)
</script>

<template>
  <div class="container">
    {{ count }}
  </div>
</template>
```

#### 規則 2: 無樣式的組件

```vue
<!-- ✅ 正確：<script> → <template> -->
<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)
</script>

<template>
  <div class="p-4">
    {{ count }}
  </div>
</template>
```

#### ❌ 錯誤示範

```vue
<!-- ❌ 錯誤：不要使用 <template> → <script> → <style> 順序 -->
<template>
  <div>...</div>
</template>

<script setup lang="ts">
// ...
</script>

<style scoped>
// ...
</style>
```

### script setup 內部結構順序

```vue
<script setup lang="ts">
// 1. Imports
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import type { UserProfile } from '@/types'

// 2. Types & Interfaces (僅限於本檔案使用的型別)
interface Props {
  title: string
  count?: number
}

interface Emits {
  (e: 'update', value: number): void
  (e: 'close'): void
}

// 3. Props & Emits
const props = withDefaults(defineProps<Props>(), {
  count: 0,
})

const emit = defineEmits<Emits>()

// 4. Composables / Stores
const router = useRouter()
const userStore = useUserStore()

// 5. Reactive State
const loading = ref(false)
const data = ref<string[]>([])

// 6. Computed Properties
const displayText = computed(() => `${props.title}: ${props.count}`)

// 7. Methods
const handleClick = () => {
  emit('update', props.count + 1)
}

const fetchData = async () => {
  loading.value = true
  try {
    // ...
  } finally {
    loading.value = false
  }
}

// 8. Watchers
watch(
  () => props.count,
  newVal => {
    console.log('count changed:', newVal)
  }
)

// 9. Lifecycle Hooks
onMounted(() => {
  fetchData()
})
</script>
```

### Import 順序規範

```typescript
// 1. Vue 核心
import { ref, computed, watch, onMounted } from 'vue'

// 2. Vue 生態 (Router / Pinia)
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'

// 3. 外部函式庫
import * as THREE from 'three'
import { format } from 'date-fns'
import axios from 'axios'

// 4. Composables
import { useTheme } from '@/composables/useTheme'
import { useToast } from '@/composables/useToast'

// 5. 組件
import FortuneCard from '@/components/FortuneCard.vue'
import PriceChart from '@/components/charts/PriceChart.vue'

// 6. Services
import { lunarService } from '@/services/lunar'
import { finmindService } from '@/services/finmind'

// 7. Types (使用 type import)
import type { UserProfile, ETFData, FortuneData } from '@/types'

// 8. Utils
import { formatCurrency, formatDate } from '@/utils/format'
```

---

## 🎨 Tailwind CSS 開發規範

### 基本原則

1. **禁止使用 inline styles**（除非是動態計算的值）
2. **禁止使用 CSS-in-JS 庫**
3. **優先使用 Tailwind 工具類**
4. **自定義樣式放在 `<style scoped>` 中**

### 主題色系統

```vue
<template>
  <!-- 使用 CSS 變數實現深色/淺色主題切換 -->
  <div class="bg-app-bg text-primary-text">
    <div class="bg-card-bg p-4 rounded-lg">
      <h1 class="text-accent-gold">標題</h1>
      <p class="text-secondary-text">說明文字</p>
    </div>
  </div>
</template>
```

**可用的主題相關 class**:

- 背景: `bg-app-bg`, `bg-card-bg`, `bg-surface-bg`
- 文字: `text-primary-text`, `text-secondary-text`, `text-accent-text`
- 邊框: `border-border-light`, `border-border-medium`
- 強調色: `text-accent-gold`, `bg-accent-gold`
- 狀態色: `text-success`, `text-warning`, `text-error`, `text-info`

### 響應式設計 (Mobile First)

```vue
<template>
  <!-- ✅ 正確：從小螢幕開始定義 -->
  <div
    class="
      w-full px-4 py-2 text-sm
      sm:px-6 sm:text-base
      md:px-8 md:py-4
      lg:max-w-7xl lg:mx-auto lg:px-12 lg:py-6 lg:text-lg
    "
  >
    <h1 class="text-xl sm:text-2xl md:text-3xl lg:text-4xl">響應式標題</h1>

    <!-- Grid 響應式佈局 -->
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

**斷點**:

- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

---

## 🗂️ TypeScript 型別定義規範

### 優先使用 interface

```typescript
// ✅ 正確：物件結構使用 interface
export interface UserProfile {
  name: string
  birthDate: string
  birthTime: string
  zodiac: string
  element: string
  luckyColors: string[]
  luckyNumbers: number[]
}

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
```

### 何時使用 type

```typescript
// ✅ 正確：Union types 使用 type
export type Theme = 'light' | 'dark'
export type InvestmentAction = 'BUY' | 'HOLD' | 'SELL'
export type ChartType = 'line' | 'bar' | 'candlestick'
export type Element = 'metal' | 'wood' | 'water' | 'fire' | 'earth'
```

---

## 🔄 Pinia 狀態管理規範

### Store 定義 (Setup Store 模式)

```typescript
// stores/user.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserProfile } from '@/types'

export const useUserStore = defineStore(
  'user',
  () => {
    // === State ===
    const profile = ref<UserProfile | null>(null)
    const isLoggedIn = ref(false)

    // === Getters (使用 computed) ===
    const userName = computed(() => profile.value?.name || '訪客')
    const userElement = computed(() => profile.value?.element || '未知')

    // === Actions ===
    const setProfile = (newProfile: UserProfile) => {
      profile.value = newProfile
      isLoggedIn.value = true
    }

    const logout = () => {
      profile.value = null
      isLoggedIn.value = false
    }

    // === Return ===
    return {
      profile,
      isLoggedIn,
      userName,
      userElement,
      setProfile,
      logout,
    }
  },
  {
    // === 持久化配置 ===
    persist: {
      key: 'lucky50-user',
      storage: localStorage,
      paths: ['profile', 'isLoggedIn'],
    },
  }
)
```

---

## 🛠️ Composables 開發規範

### Composable 命名與結構

```typescript
// composables/useToast.ts
import { ref, readonly } from 'vue'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastMessage {
  id: string
  type: ToastType
  message: string
  duration?: number
}

// === 全域狀態（單例模式） ===
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

  return {
    toasts: readonly(toasts),
    show,
    remove,
  }
}
```

### Composable 使用原則

1. **使用 `use` 前綴命名**
2. **檔案名稱使用 camelCase**
3. **放置於 `src/composables/` 目錄**
4. **全域狀態使用單例模式**
5. **返回值使用 `readonly` 包裝**

---

## 🌐 API 服務層開發規範

### Service 層實作 (單例模式)

```typescript
// services/finmind.ts
import axios, { type AxiosInstance } from 'axios'
import type { ETFData } from '@/types'

export class FinMindService {
  private static instance: FinMindService
  private axios: AxiosInstance

  private constructor() {
    this.axios = axios.create({
      baseURL: 'https://api.finmindtrade.com/api/v4',
      timeout: 10000,
    })
  }

  static getInstance(): FinMindService {
    if (!this.instance) {
      this.instance = new FinMindService()
    }
    return this.instance
  }

  async getETFData(stockId: string, startDate: string, endDate: string): Promise<ETFData[]> {
    try {
      const response = await this.axios.get('/data', {
        params: {
          dataset: 'TaiwanStockPrice',
          data_id: stockId,
          start_date: startDate,
          end_date: endDate,
        },
      })

      return response.data.data.map((item: any) => ({
        date: item.date,
        open: item.open,
        high: item.max,
        low: item.min,
        close: item.close,
        volume: item.Trading_Volume,
      }))
    } catch (error) {
      console.error('Failed to fetch ETF data:', error)
      throw error
    }
  }
}

export const finmindService = FinMindService.getInstance()
```

---

## ⚠️ 錯誤處理規範

使用統一錯誤處理系統，詳見 `docs/ERROR_HANDLING.md`。

### 在組件中處理錯誤

```vue
<script setup lang="ts">
import { useErrorHandler } from '@/composables/useErrorHandler'
import { useFortuneStore } from '@/stores/fortune'

const fortuneStore = useFortuneStore()
const { withErrorHandler } = useErrorHandler()

// 使用 withErrorHandler 包裝
const loadFortune = withErrorHandler(async () => {
  await fortuneStore.fetchFortune('2024-01-01')
})
</script>
```

---

## 🎭 Three.js 3D 開發規範

### Three.js 開發原則

1. **在 `onMounted` 中初始化場景**
2. **在 `onBeforeUnmount` 中清理資源**（重要！防止記憶體洩漏）
3. **使用 `requestAnimationFrame` 進行動畫**
4. **響應式處理視窗大小變化**
5. **使用 TWEEN.js 實現平滑動畫**
6. **注意記憶體管理**：dispose geometry、material、texture
7. **限制 `devicePixelRatio`**：`Math.min(window.devicePixelRatio, 2)`

---

## 📊 Chart.js 圖表開發規範

### Chart.js 開發原則

1. **註冊需要的組件**（避免引入整個 Chart.js）
2. **支援深色/淺色主題**（使用 `useTheme`）
3. **使用 computed 動態生成配置**
4. **關閉 `maintainAspectRatio`**，手動控制高度
5. **優化效能**：大數據集時設定 `pointRadius: 0`

---

## 📝 Git Commit 規範

### Commit 訊息格式

```bash
<type>: <subject>

<body>

<footer>
```

### Type 類型

- `feat`: 新功能
- `fix`: 修復 bug
- `docs`: 文檔修改
- `style`: 程式碼格式修改（不影響功能）
- `refactor`: 重構（不新增功能也不修復 bug）
- `perf`: 性能優化
- `test`: 測試相關
- `chore`: 建置工具或輔助工具修改

---

## 🚫 禁止事項清單

### 絕對禁止的套件

❌ **不要使用以下套件或建議安裝**:

- React、Next.js、Angular 等其他框架
- Redux、Zustand、Recoil（已使用 Pinia）
- styled-components、emotion、CSS-in-JS 庫（已使用 Tailwind CSS）
- Vue 2 語法或 Options API（使用 Vue 3 Composition API）
- Material-UI、Ant Design、Element Plus 等 UI 框架
- moment.js（使用 date-fns）
- jQuery
- Bootstrap

### 絕對禁止的寫法

❌ **Options API**、**直接修改 Props**、**在 computed 中修改狀態**、**使用 any 類型**、**使用 npm 或 yarn**

---

## ✅ 開發前檢查清單

在開始修改代碼前，請確認：

- [ ] 已閱讀並理解本 SKILL.md 文件
- [ ] 了解專案的技術棧和架構
- [ ] 確認修改不會引入新的依賴
- [ ] 知道如何使用 pnpm 管理套件
- [ ] 了解 Vue 組件的檔案結構順序規範
- [ ] 了解 TypeScript 嚴格模式要求

## ✅ 提交前檢查清單

在提交代碼前，必須確認：

- [ ] 所有 Vue 組件遵循正確的檔案結構順序
- [ ] 沒有 ESLint errors 和 warnings
- [ ] 沒有 TypeScript 編譯錯誤
- [ ] 所有用戶可見文字使用繁體中文
- [ ] Commit 訊息使用中文並符合格式
- [ ] 已測試修改的功能正常運作

---

## 📚 參考文檔

- **專案規範**: `.github/copilot-instructions.md`
- **錯誤處理**: `docs/ERROR_HANDLING.md`
- **README**: `README.md`
- **Vue 3 文檔**: https://vuejs.org
- **Pinia 文檔**: https://pinia.vuejs.org
- **Tailwind CSS 文檔**: https://tailwindcss.com

---

**重要提醒**: 本文件是專案開發的核心指南，所有開發者和 AI 助手在修改代碼時必須嚴格遵守。
