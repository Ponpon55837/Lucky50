# Lucky50 專案開發規範與技能指南

> 本文件包含 Lucky50 農民曆智慧投資系統的所有開發規範、技能要求和最佳實踐。
> 所有 AI 助手和開發者在修改專案時必須嚴格遵守本文件的指引。

---

## 📌 文件版本

- **版本**: 1.0.0
- **更新日期**: 2026-01-19
- **適用範圍**: Lucky50 專案全部代碼

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

```vue
<!-- ❌ 錯誤：不要為了符合順序而加入空的 <style> -->
<style scoped>
/* 空的 */
</style>

<script setup lang="ts">
// ...
</script>

<template>
  <div>...</div>
</template>
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

### 動畫與過渡

```vue
<template>
  <div class="animate-fade-in hover:scale-105 transition-all duration-300">內容</div>
</template>
```

**可用動畫**:

- `animate-fade-in`: 淡入
- `animate-slide-up`: 上滑
- `animate-scale-in`: 縮放進入
- `animate-float`: 浮動效果

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

export interface ChartProps {
  data: ETFData[]
  loading?: boolean
  height?: number
}
```

### 何時使用 type

```typescript
// ✅ 正確：Union types 使用 type
export type Theme = 'light' | 'dark'
export type InvestmentAction = 'BUY' | 'HOLD' | 'SELL'
export type ChartType = 'line' | 'bar' | 'candlestick'
export type Element = 'metal' | 'wood' | 'water' | 'fire' | 'earth'

// ✅ 正確：複雜聯合型別
export type ApiResponse<T> = { success: true; data: T } | { success: false; error: string }
```

### 型別定義原則

1. **所有型別定義放在 `src/types/` 目錄**
2. **使用描述性命名**（如 `UserProfile` 而非 `UP`）
3. **避免使用 `any`**（用 `unknown` 代替）
4. **匯出所有型別**供其他模組使用
5. **為 Props 和 Emits 定義型別**

```typescript
// ❌ 錯誤
type UP = {
  // 名稱太短
  n: string // 屬性名稱不清楚
}

function process(data: any) {} // 使用 any

// ✅ 正確
export interface UserProfile {
  name: string
}

function process(data: unknown) {
  if (typeof data === 'string') {
    // 類型收窄
  }
}
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

    const fetchProfile = async (userId: string) => {
      try {
        // API 呼叫
        const data = await api.getProfile(userId)
        setProfile(data)
      } catch (error) {
        console.error('Failed to fetch profile:', error)
        throw error
      }
    }

    // === Return ===
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
      fetchProfile,
    }
  },
  {
    // === 持久化配置 ===
    persist: {
      key: 'lucky50-user',
      storage: localStorage,
      paths: ['profile', 'isLoggedIn'], // 只持久化指定欄位
    },
  }
)
```

### 在組件中使用 Store

```vue
<script setup lang="ts">
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

// ✅ 正確：直接存取
const userName = computed(() => userStore.userName)

// ✅ 正確：呼叫 actions
const handleLogin = async () => {
  try {
    await userStore.fetchProfile('123')
  } catch (error) {
    // 錯誤處理
  }
}

// ❌ 錯誤：不要解構響應式屬性（會失去響應性）
const { userName } = userStore // 錯誤！

// ✅ 如果真的要解構，使用 storeToRefs
import { storeToRefs } from 'pinia'
const { userName } = storeToRefs(userStore)
</script>
```

### 持久化配置原則

```typescript
// ✅ 完整持久化（適用於小型 store）
export const useSettingsStore = defineStore(
  'settings',
  () => {
    // ...
  },
  {
    persist: true,
  }
)

// ✅ 部分持久化（適用於大型 store）
export const useDashboardStore = defineStore(
  'dashboard',
  () => {
    const etfData = ref<ETFData[]>([]) // 不持久化（資料太大）
    const selectedDate = ref('') // 持久化
    const viewMode = ref('chart') // 持久化
    // ...
  },
  {
    persist: {
      key: 'lucky50-dashboard',
      storage: localStorage,
      paths: ['selectedDate', 'viewMode'], // 只持久化指定欄位
    },
  }
)

// ✅ 使用 sessionStorage（適用於會話級狀態）
export const useTempStore = defineStore(
  'temp',
  () => {
    // ...
  },
  {
    persist: {
      key: 'lucky50-temp',
      storage: sessionStorage,
    },
  }
)
```

**持久化注意事項**:

- 使用 `lucky50-` 前綴作為 key
- 大型資料集（如圖表資料）不應持久化
- 敏感資料應加密或不持久化
- 臨時狀態使用 sessionStorage

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
  // === 私有方法 ===
  const generateId = () => `toast-${Date.now()}-${Math.random()}`

  // === 公開方法 ===
  const show = (type: ToastType, message: string, duration = 3000) => {
    const id = generateId()
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

  // === 返回 ===
  return {
    toasts: readonly(toasts), // 只讀，防止外部修改
    show,
    remove,
    success,
    error,
    warning,
    info,
  }
}
```

### Composable 使用原則

1. **使用 `use` 前綴命名**（如 `useTheme`、`useToast`）
2. **檔案名稱使用 camelCase**（如 `useTheme.ts`）
3. **放置於 `src/composables/` 目錄**
4. **全域狀態使用單例模式**（在 composable 外部定義 ref）
5. **返回值使用 `readonly` 包裝**（防止外部修改）

---

## 🌐 API 服務層開發規範

### Service 層實作 (單例模式)

```typescript
// services/finmind.ts
import axios, { type AxiosInstance } from 'axios'
import type { ETFData } from '@/types'

const FINMIND_BASE_URL = 'https://api.finmindtrade.com/api/v4'

export class FinMindService {
  private static instance: FinMindService
  private axios: AxiosInstance

  private constructor() {
    this.axios = axios.create({
      baseURL: FINMIND_BASE_URL,
      timeout: 10000,
    })

    // 請求攔截器
    this.axios.interceptors.request.use(
      config => {
        // 可以在這裡添加 token 等
        return config
      },
      error => {
        return Promise.reject(error)
      }
    )

    // 響應攔截器
    this.axios.interceptors.response.use(
      response => response,
      error => {
        // 統一錯誤處理
        console.error('API Error:', error)
        return Promise.reject(error)
      }
    )
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

### 在 Store 中使用 Service

```typescript
// stores/investment.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { finmindService } from '@/services/finmind'
import { useErrorHandler } from '@/composables/useErrorHandler'
import type { ETFData } from '@/types'

export const useInvestmentStore = defineStore('investment', () => {
  const etfData = ref<ETFData[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const { handleAsyncError } = useErrorHandler()

  const fetchETFData = async (stockId: string, startDate: string, endDate: string) => {
    loading.value = true
    error.value = null

    try {
      const data = await finmindService.getETFData(stockId, startDate, endDate)
      etfData.value = data
    } catch (err) {
      error.value = err instanceof Error ? err.message : '資料載入失敗'
      handleAsyncError(err) // 使用錯誤處理 composable
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

### API 呼叫原則

1. **使用 Service 層封裝 API 邏輯**
2. **Service 使用單例模式**
3. **在 Store 中處理資料狀態和錯誤**
4. **統一錯誤處理**
5. **設定適當的 timeout**
6. **使用 Axios 攔截器處理通用邏輯**

---

## ⚠️ 錯誤處理規範

### 使用統一錯誤處理系統

本專案有完整的錯誤處理系統，詳見 `docs/ERROR_HANDLING.md`。

#### 在 Service 中處理錯誤

```typescript
// services/fortune.ts
import { ApplicationError, ErrorCategory, ErrorSeverity } from '@/types/error'

export class FortuneService {
  async calculateFortune(date: string): Promise<FortuneData> {
    try {
      // 驗證輸入
      if (!date) {
        throw new ApplicationError(
          'VAL_001',
          '日期不能為空',
          ErrorCategory.VALIDATION,
          ErrorSeverity.WARNING
        )
      }

      // API 呼叫
      const response = await this.api.get('/fortune', { params: { date } })
      return response.data
    } catch (error) {
      // 轉換為應用錯誤
      if (error instanceof ApplicationError) {
        throw error
      }

      throw new ApplicationError(
        'API_001',
        '運勢計算失敗',
        ErrorCategory.API,
        ErrorSeverity.ERROR,
        { originalError: error }
      )
    }
  }
}
```

#### 在 Store 中處理錯誤

```typescript
// stores/fortune.ts
import { useErrorHandler } from '@/composables/useErrorHandler'
import { fortuneService } from '@/services/fortune'

export const useFortuneStore = defineStore('fortune', () => {
  const { handleAsyncError } = useErrorHandler()

  const fetchFortune = async (date: string) => {
    try {
      const data = await fortuneService.calculateFortune(date)
      fortune.value = data
    } catch (error) {
      handleAsyncError(error) // 自動顯示錯誤訊息
      throw error
    }
  }

  return { fetchFortune }
})
```

#### 在組件中處理錯誤

```vue
<script setup lang="ts">
import { useErrorHandler } from '@/composables/useErrorHandler'
import { useFortuneStore } from '@/stores/fortune'

const fortuneStore = useFortuneStore()
const { withErrorHandler } = useErrorHandler()

// 方法 1: 使用 withErrorHandler 包裝
const loadFortune = withErrorHandler(async () => {
  await fortuneStore.fetchFortune('2024-01-01')
})

// 方法 2: 手動處理
const { handleAsyncError } = useErrorHandler()

const loadFortuneManual = async () => {
  try {
    await fortuneStore.fetchFortune('2024-01-01')
  } catch (error) {
    handleAsyncError(error)
  }
}
</script>
```

---

## 🎭 Three.js 3D 開發規範

### 基本 Three.js 組件結構

```vue
<style scoped>
.three-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>

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

// Three.js 變數
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let mesh: THREE.Mesh
let animationId: number

const initThreeJS = () => {
  if (!containerRef.value) return

  const width = containerRef.value.clientWidth
  const height = containerRef.value.clientHeight

  // === 場景 ===
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0f172a)

  // === 相機 ===
  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
  camera.position.z = 5

  // === 渲染器 ===
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  })
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  containerRef.value.appendChild(renderer.domElement)

  // === 光源 ===
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(5, 5, 5)
  scene.add(directionalLight)

  // === 添加物體 ===
  const geometry = new THREE.SphereGeometry(1, 32, 32)
  const material = new THREE.MeshStandardMaterial({
    color: 0x3b82f6,
    metalness: 0.5,
    roughness: 0.5,
  })
  mesh = new THREE.Mesh(geometry, material)
  scene.add(mesh)

  // === 動畫循環 ===
  const animate = () => {
    animationId = requestAnimationFrame(animate)

    // 更新 TWEEN
    TWEEN.update()

    // 自動旋轉
    if (props.autoRotate && mesh) {
      mesh.rotation.x += 0.01
      mesh.rotation.y += 0.01
    }

    renderer.render(scene, camera)
  }

  animate()

  // === 響應式調整 ===
  window.addEventListener('resize', handleResize)
}

const handleResize = () => {
  if (!containerRef.value) return

  const width = containerRef.value.clientWidth
  const height = containerRef.value.clientHeight

  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

const cleanup = () => {
  // 取消動畫
  if (animationId) {
    cancelAnimationFrame(animationId)
  }

  // 移除事件監聽
  window.removeEventListener('resize', handleResize)

  // 清理 Three.js 資源
  if (renderer && containerRef.value) {
    containerRef.value.removeChild(renderer.domElement)
    renderer.dispose()
  }

  if (mesh) {
    mesh.geometry.dispose()
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach(m => m.dispose())
    } else {
      mesh.material.dispose()
    }
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
  newData => {
    // 使用 TWEEN 實現平滑過渡
    if (mesh) {
      new TWEEN.Tween(mesh.scale)
        .to({ x: newData[0], y: newData[1], z: newData[2] }, 1000)
        .easing(TWEEN.Easing.Quadratic.Out)
        .start()
    }
  }
)
</script>

<template>
  <div ref="containerRef" class="three-container" />
</template>
```

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

### 基本圖表組件結構

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
  Filler,
  type ChartData,
  type ChartOptions,
} from 'chart.js'
import type { ETFData } from '@/types'
import { useTheme } from '@/composables/useTheme'

// 註冊 Chart.js 組件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface Props {
  data: ETFData[]
  height?: number
}

const props = withDefaults(defineProps<Props>(), {
  height: 300,
})

const { isDark } = useTheme()

const chartData = computed<ChartData<'line'>>(() => ({
  labels: props.data.map(d => d.date),
  datasets: [
    {
      label: '收盤價',
      data: props.data.map(d => d.close),
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
      fill: true,
      pointRadius: 0,
      pointHoverRadius: 4,
      borderWidth: 2,
    },
  ],
}))

const chartOptions = computed<ChartOptions<'line'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  plugins: {
    legend: {
      display: true,
      position: 'top',
      labels: {
        color: isDark.value ? '#e5e7eb' : '#374151',
        font: {
          size: 12,
          family: "'Noto Sans TC', sans-serif",
        },
      },
    },
    tooltip: {
      mode: 'index',
      intersect: false,
      backgroundColor: isDark.value ? '#1f2937' : '#ffffff',
      titleColor: isDark.value ? '#f3f4f6' : '#111827',
      bodyColor: isDark.value ? '#e5e7eb' : '#374151',
      borderColor: isDark.value ? '#374151' : '#e5e7eb',
      borderWidth: 1,
    },
  },
  scales: {
    x: {
      display: true,
      grid: {
        color: isDark.value ? '#374151' : '#e5e7eb',
      },
      ticks: {
        color: isDark.value ? '#9ca3af' : '#6b7280',
      },
      title: {
        display: true,
        text: '日期',
        color: isDark.value ? '#e5e7eb' : '#374151',
      },
    },
    y: {
      display: true,
      grid: {
        color: isDark.value ? '#374151' : '#e5e7eb',
      },
      ticks: {
        color: isDark.value ? '#9ca3af' : '#6b7280',
      },
      title: {
        display: true,
        text: '價格',
        color: isDark.value ? '#e5e7eb' : '#374151',
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

### Chart.js 開發原則

1. **註冊需要的組件**（避免引入整個 Chart.js）
2. **支援深色/淺色主題**（使用 `useTheme`）
3. **使用 computed 動態生成配置**
4. **關閉 `maintainAspectRatio`**，手動控制高度
5. **優化效能**：大數據集時設定 `pointRadius: 0`

---

## 🧪 測試規範

### 測試原則

1. **使用 Vitest 進行單元測試**
2. **關鍵業務邏輯必須有測試**
3. **測試檔案放在 `__tests__` 目錄或與源檔案同目錄**
4. **測試檔案命名**: `*.spec.ts` 或 `*.test.ts`

### Composable 測試示例

```typescript
// composables/__tests__/useToast.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useToast } from '../useToast'

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('should show success toast', () => {
    const { toasts, success } = useToast()

    success('測試成功')

    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0].type).toBe('success')
    expect(toasts.value[0].message).toBe('測試成功')
  })

  it('should auto remove toast after duration', () => {
    const { toasts, success } = useToast()

    success('測試成功', 3000)
    expect(toasts.value).toHaveLength(1)

    vi.advanceTimersByTime(3000)
    expect(toasts.value).toHaveLength(0)
  })
})
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

### Commit 示例

```bash
feat: 新增統一錯誤處理系統

- 建立錯誤類型定義和分類系統
- 實作錯誤處理 Composable
- 建立 Error Boundary 和 Error Modal 組件
- 新增完整使用文檔

無 lint errors，所有組件遵循專案規範
```

---

## 🚫 禁止事項清單

### 絕對禁止的套件

❌ **不要使用以下套件或建議安裝**:

- React、Next.js、Angular 等其他框架
- Redux、Redux Toolkit、Zustand、Recoil（已使用 Pinia）
- styled-components、emotion、CSS-in-JS 庫（已使用 Tailwind CSS）
- Vue 2 語法或 Options API（使用 Vue 3 Composition API）
- Material-UI、Ant Design、Element Plus 等 UI 框架（使用 Tailwind CSS）
- moment.js（使用 date-fns）
- jQuery
- Bootstrap

### 絕對禁止的寫法

❌ **Options API**:

```vue
<!-- 不要使用 -->
<script>
export default {
  data() {
    return { count: 0 }
  },
}
</script>
```

❌ **直接修改 Props**:

```typescript
// 不要這樣寫
const props = defineProps<{ count: number }>()
props.count++ // 錯誤！
```

❌ **在 computed 中修改狀態**:

```typescript
// 不要這樣寫
const doubled = computed(() => {
  count.value++ // 錯誤！
  return count.value * 2
})
```

❌ **使用 any 類型**:

```typescript
// 不要這樣寫
function process(data: any) {} // 錯誤！

// 應該這樣寫
function process(data: unknown) {
  if (typeof data === 'string') {
    // 類型收窄
  }
}
```

❌ **使用 npm 或 yarn**:

```bash
# 不要使用
npm install
yarn add

# 必須使用
pnpm install
pnpm add
```

---

## ✅ 開發前檢查清單

在開始修改代碼前，請確認：

- [ ] 已閱讀並理解本 skills.md 文件
- [ ] 已閱讀專案的 `.github/copilot-instructions.md`
- [ ] 了解專案的技術棧和架構
- [ ] 確認修改不會引入新的依賴
- [ ] 知道如何使用 pnpm 管理套件
- [ ] 了解 Vue 組件的檔案結構順序規範
- [ ] 了解 TypeScript 嚴格模式要求
- [ ] 知道如何使用 Pinia 和 Composables
- [ ] 了解錯誤處理系統的使用方式

## ✅ 提交前檢查清單

在提交代碼前，必須確認：

- [ ] 所有 Vue 組件遵循正確的檔案結構順序
- [ ] 沒有 ESLint errors 和 warnings (`pnpm run lint`)
- [ ] 沒有 TypeScript 編譯錯誤
- [ ] 所有 import 路徑使用 `@/` 別名
- [ ] 所有用戶可見文字使用繁體中文
- [ ] Commit 訊息使用中文並符合格式
- [ ] 已測試修改的功能正常運作
- [ ] 沒有引入新的依賴
- [ ] 沒有使用禁止的寫法或套件

---

## 📚 參考文檔

- **專案規範**: `.github/copilot-instructions.md`
- **錯誤處理**: `docs/ERROR_HANDLING.md`
- **README**: `README.md`
- **Vue 3 文檔**: https://vuejs.org
- **Pinia 文檔**: https://pinia.vuejs.org
- **Tailwind CSS 文檔**: https://tailwindcss.com
- **TypeScript 文檔**: https://www.typescriptlang.org

---

## 🔄 文件更新記錄

| 版本  | 日期       | 更新內容                       |
| ----- | ---------- | ------------------------------ |
| 1.0.0 | 2026-01-19 | 初始版本，包含所有核心開發規範 |

---

**重要提醒**: 本文件是專案開發的核心指南，所有開發者和 AI 助手在修改代碼時必須嚴格遵守。如有疑問，請先查閱本文件和相關文檔，或詢問專案維護者。
