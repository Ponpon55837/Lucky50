---
name: code-standards
description: 程式碼規範與開發最佳實踐 - Vue 3、TypeScript、Git 工作流程、專案架構標準
license: MIT
compatibility: opencode
metadata:
  version: '1.2.0'
  updated: '2026-01-20'
  language: zh-TW
  project: Lucky50
---

# 程式碼規範與開發最佳實踐指南

## ⚠️ 開始前必讀

**在開始任何程式碼修改之前，必須先完成以下檢查：**

### 1. 🔴 確認分支狀態（最重要！）

```bash
# 檢查當前分支
git branch

# 如果在 main 分支，必須立即建立新分支
git checkout -b <type>/<developer-name>/<feature-description>
```

**❌ 絕對禁止直接在 main 分支修改代碼！**

**✅ 正確流程**：

1. 從 main 建立新分支
2. 在新分支上進行修改
3. 提交並推送
4. 建立 Pull Request
5. 等待 code review 和合併

### 2. 📖 載入相關 skills

在開始開發前，確認你已經載入並理解以下 skills：

- **git-workflow**：分支命名和 Git 工作流程
- **lucky50-dev**：本文件，開發規範

### 3. 💡 規劃變更

- 明確知道要修改什麼
- 了解修改的影響範圍
- 確認不會引入新的依賴

## 何時使用此 code-standards skill

當您需要進行以下操作時，GitHub Copilot 會自動載入此技能：

- **🔴 任何程式碼修改前**（必讀核心原則和檔案結構規範）
- 新增或修改 Vue 3 組件
- 開發 Pinia Store 或 Composables
- 整合 Three.js 或 Chart.js 視覺化功能
- 處理 API 服務層開發
- 實作錯誤處理機制
- 確認代碼是否符合專案規範
- 執行開發測試流程
- 提交代碼前的檢查

**AI 觸發關鍵詞**：`code-standards`、`coding`、`development`、`規範`、`開發`、`最佳實踐`、`程式碼品質`

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

### 2. 繁體中文語境原則 🔴 重要

本專案所有文件、註解、說明都必須使用**繁體中文語境**撰寫，這不僅僅是語言的翻譯，更是思維方式的轉換。

#### 文件與說明的語言規範

**強制使用繁體中文的項目：**

- ✅ 所有用戶可見的文字（UI、訊息、提示）
- ✅ Commit 訊息和 PR 描述
- ✅ 代碼註解和 JSDoc
- ✅ 專案文檔（README.md、SKILL.md、AGENTS.md 等）
- ✅ 錯誤訊息和日誌輸出
- ✅ 測試描述（`describe`、`it` 的文字）

**可使用英文的項目：**

- ✅ 變數名稱、函數名稱、類別名稱
- ✅ 套件名稱、import 路徑
- ✅ 技術術語保留原文（如 Composition API、Reactive、Store）

#### 繁體中文語境書寫原則

**❌ 錯誤範例（直接翻譯）：**

```typescript
// 這個函數用於處理用戶登錄
function handleLogin() {
  // 驗證輸入
  // 發送請求
  // 處理響應
}
```

**✅ 正確範例（中文語境）：**

```typescript
// 處理使用者登入流程
function handleLogin() {
  // 驗證使用者輸入的帳號密碼格式
  // 向後端發送登入請求
  // 依據回應結果更新登入狀態
}
```

**差異說明：**

1. **用詞選擇**：「用戶」→「使用者」（更符合台灣用語習慣）
2. **描述方式**：「驗證輸入」→「驗證使用者輸入的帳號密碼格式」（更具體、更完整）
3. **動詞使用**：「處理響應」→「依據回應結果更新登入狀態」（描述具體動作）

#### 專業術語的中文化建議

| 英文術語   | ❌ 直譯  | ✅ 推薦用語         | 說明                       |
| ---------- | -------- | ------------------- | -------------------------- |
| Component  | 組件     | 組件                | 可接受                     |
| Props      | 屬性     | Props / 屬性        | 技術術語可保留原文         |
| State      | 狀態     | 狀態                | 可接受                     |
| Store      | 存儲     | Store / 狀態倉庫    | 技術術語可保留原文         |
| Hook       | 鉤子     | Hook / 鉤子函數     | 建議保留原文               |
| Composable | 可組合的 | Composable          | 保留原文                   |
| Reactive   | 反應式的 | Reactive / 響應式   | 技術術語可保留原文         |
| User       | 用戶     | 使用者              | 台灣習慣用「使用者」       |
| Login      | 登錄     | 登入                | 台灣用「登入」而非「登錄」 |
| Logout     | 登出     | 登出                | 可接受                     |
| Callback   | 回調     | 回呼函數 / Callback | 台灣習慣「回呼」           |
| Handler    | 處理器   | 處理函數 / Handler  | 描述具體功能更佳           |
| Response   | 響應     | 回應                | 台灣用「回應」             |
| Request    | 請求     | 請求                | 可接受                     |

#### Commit 訊息範例

**❌ 錯誤範例：**

```
feat: add user login function
fix: fix login bug
docs: update README
```

**✅ 正確範例：**

```
feat: 新增使用者登入功能
fix: 修復登入頁面驗證錯誤
docs: 更新 README 安裝說明
```

#### 文檔撰寫風格

**採用清晰、親切但專業的語氣：**

- ✅ 使用「我們」、「您」等代詞營造親和力
- ✅ 使用條列式說明提高可讀性
- ✅ 適時使用 emoji 強調重點（但不過度）
- ✅ 技術術語首次出現時可用「技術術語（中文解釋）」格式
- ❌ 避免生硬的機器翻譯感
- ❌ 避免過度口語或網路用語

**範例：**

```markdown
## 如何開始使用

我們使用 pnpm 作為套件管理工具。如果您還沒有安裝，請先執行：

​`bash
npm install -g pnpm
​`

安裝完成後，在專案根目錄執行以下指令即可啟動開發伺服器：

​`bash
pnpm install  # 安裝相依套件
pnpm dev      # 啟動開發模式
​`

開發伺服器會在 `http://localhost:5173` 啟動，您可以在瀏覽器中開啟這個網址查看專案。
```

#### AI 助手特別注意事項

**當協助 Lucky50 專案開發時，AI 助手必須：**

1. ✅ 所有回應都使用繁體中文
2. ✅ 使用台灣用語習慣（如「使用者」而非「用戶」）
3. ✅ 註解和說明採用完整句子，而非片段關鍵字
4. ✅ 技術術語保留英文時，適時加上中文說明
5. ✅ 代碼範例中的註解、字串都使用繁體中文
6. ✅ 錯誤訊息和日誌輸出使用繁體中文
7. ❌ 不直接進行逐字翻譯，而是用中文思維重新表達

**範例對話：**

```
使用者：幫我建立一個按鈕組件

AI：好的，我會為您建立一個符合 Lucky50 規範的按鈕組件。這個組件將：

- 使用 Composition API 搭配 <script setup>
- 支援多種樣式變體（primary、secondary、danger）
- 接受 disabled 狀態
- 發送 click 事件給父組件

讓我開始建立 Button.vue 組件...
```

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

## 🧪 開發測試流程

### ⚠️ 重要：每次修改後必須運行測試

**這是強制性的規則，任何程式碼修改後都必須立即測試！**

#### 為什麼要立即測試？

1. **及早發現錯誤**: 在錯誤累積之前就發現問題
2. **避免連鎖錯誤**: 防止在錯誤的基礎上繼續修改
3. **確保功能正常**: 保證每個變更都不會破壞現有功能
4. **節省時間**: 立即修正比事後修正更容易

#### 測試流程

**每次修改檔案後，立即執行以下步驟：**

```bash
# 1. 清除可能佔用的 port
lsof -ti:5173 | xargs kill -9 2>/dev/null

# 2. 等待 port 釋放
sleep 2

# 3. 啟動開發伺服器 (Vite 預設 port 5173)
pnpm dev
```

**檢查項目：**

1. ✅ 專案能否成功啟動（無編譯錯誤）
2. ✅ 瀏覽器能否正常訪問 http://localhost:5173
3. ✅ 頁面能否正常顯示（無執行錯誤）
4. ✅ 修改的功能是否正常運作
5. ✅ 相關功能是否受到影響

**如果測試失敗：**

- 🛑 **立即停止**繼續修改
- 🔍 檢查錯誤訊息（瀏覽器 Console 和終端機）
- 🔧 修正問題
- ✅ 重新測試直到通過

#### 完成所有修改後的完整測試

在完成所有任務後，進行完整的測試：

```bash
# 1. 清除 port
lsof -ti:5173 | xargs kill -9 2>/dev/null
sleep 2

# 2. 啟動開發伺服器
pnpm dev

# 3. 完整功能測試
```

**完整測試清單：**

- [ ] 首頁能正常載入
- [ ] 用戶資料輸入功能正常
- [ ] 農民曆運勢計算正常顯示
- [ ] ETF 推薦系統正常運作
- [ ] 3D 視覺化（Three.js）正常渲染
- [ ] 圖表（Chart.js）正常顯示
- [ ] 投資建議功能正常
- [ ] 主題切換（深色/淺色）功能正常
- [ ] 所有頁面切換正常
- [ ] 無瀏覽器 Console 錯誤
- [ ] 無 TypeScript 編譯錯誤
- [ ] 無 ESLint 警告（重要的）

#### 提交前的最終檢查

**⚠️ 絕不直接推送到遠端！**

**🔥 重要：任何變更都必須包含 README.md 更新！**（參考 `.opencode/skills/github/README.md`）

完成所有修改和測試後：

1. ✅ 確認所有功能測試通過
2. ✅ 確認無編譯錯誤
3. ✅ 確認無執行錯誤
4. ✅ **執行 README.md 強制維護流程：**
   - 🔍 檢查受影響的 README 檔案
   - 📝 立即更新對應區段
   - ✅ 完整驗證更新內容
   - 🚨 **絕不單獨提交 README.md！**
5. ✅ 運行 ESLint 檢查：`pnpm lint`
6. ✅ 運行 TypeScript 檢查：`pnpm type-check`（如果有配置）
7. ✅ **驗證 README.md 更新內容：**
   - 檢查所有新增功能都有說明
   - 確認安裝/運行指令正確
   - 驗證目錄結構是最新的
   - 測試所有連結有效性
8. 📝 準備變更說明（包含 README.md 更新）
9. ⏸️ **等待使用者檢查**
10. ✅ 使用者確認後才能推送

```bash
# ❌ 錯誤：直接推送
git push origin branch-name

# ✅ 正確：等待確認後才推送
# 1. 提交到本地
git add .
git commit -m "描述變更內容"

# 2. 告知使用者已完成，等待檢查
# 3. 使用者確認無誤後，才執行推送
git push origin branch-name
```

#### 測試失敗的處理流程

```
修改程式碼
    ↓
執行測試 (pnpm dev)
    ↓
測試失敗？
    ↓
 是 → 檢查錯誤 → 修正問題 → 重新測試
    ↓
測試通過
    ↓
繼續下一個修改
```

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

### 程式碼規範

- [ ] 所有 Vue 組件遵循正確的檔案結構順序（`<style>` → `<script>` → `<template>` 或 `<script>` → `<template>`）
- [ ] 使用 interface 定義物件結構，type 只用於 Union Types
- [ ] 避免使用 any，使用 unknown 或具體型別
- [ ] 使用 Tailwind CSS 而非 inline styles
- [ ] 路徑使用 `@/` 別名
- [ ] 元件大小不超過 200 行
- [ ] 列表渲染使用唯一 key
- [ ] Import 順序正確
- [ ] 使用 pnpm 管理套件
- [ ] 符合響應式設計原則（Mobile First）

### 測試驗證

- [ ] 每次修改後都已運行 `pnpm dev` 測試
- [ ] 所有功能測試都已通過
- [ ] 完整功能測試已完成
- [ ] 無 TypeScript 編譯錯誤
- [ ] 無瀏覽器 Console 錯誤
- [ ] 已運行 `pnpm lint` 且無 errors 和 warnings
- [ ] 已在本地確認所有功能正常

### 代碼品質

- [ ] 沒有 ESLint errors 和 warnings
- [ ] 沒有 TypeScript 編譯錯誤
- [ ] 所有用戶可見文字使用繁體中文
- [ ] 註解使用中文
- [ ] Commit 訊息使用中文並符合格式

### 提交流程

- [ ] 已提交到本地分支
- [ ] **已通知使用者檢查**
- [ ] **等待使用者確認**
- [ ] 確認後才推送到遠端

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
