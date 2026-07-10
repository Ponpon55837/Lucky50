# Nuxt.js 應用完整技術棧指南

> **文件版本**: 1.0.0  
> **更新日期**: 2026-04-22  
> **適用框架**: Nuxt 3 + Vue 3 + TypeScript  
> **狀態管理**: Pinia + Vue TanStack Query + Vue TanStack Table

---

## 📋 目錄

- [概述](#概述)
- [技術棧架構](#技術棧架構)
- [核心套件說明](#核心套件說明)
- [狀態管理架構](#狀態管理架構)
- [表單驗證架構](#表單驗證架構)
- [表格功能架構](#表格功能架構)
- [完整範例](#完整範例)
- [最佳實踐](#最佳實踐)
- [常見問題](#常見問題)

---

## 🎯 概述

### 為什麼需要這些工具？

本技術棧將職責清楚分離，打造高效、可維護的 Nuxt.js 應用：

```
┌─────────────────────────────────────┐
│         Pinia                       │
│    管理客戶端 UI 狀態                 │
│  • 主題模式 (深色/淺色)               │
│  • 使用者偏好設定                     │
│  • 表單草稿暫存                       │
│  • 應用全局狀態                       │
└─────────────────────────────────────┘
              ↕
┌─────────────────────────────────────┐
│   Vue TanStack Query (VueQuery)     │
│    管理伺服器端資料                   │
│  • API 資料獲取與快取                 │
│  • 自動重新驗證                       │
│  • 背景更新與同步                     │
│  • 樂觀更新機制                       │
└─────────────────────────────────────┘
              ↕
┌─────────────────────────────────────┐
│   Vue TanStack Table                │
│    強大的表格 UI 邏輯                 │
│  • 排序、過濾、分頁                   │
│  • 行選擇、展開、分組                 │
│  • 虛擬滾動 (大量資料)                │
│  • SSR/SSG 支援                      │
└─────────────────────────────────────┘
              ↕
┌─────────────────────────────────────┐
│   FormKit / Vee-Validate + Zod      │
│    表單驗證與管理                     │
│  • Schema 驗證                       │
│  • 錯誤處理                          │
│  • 多步驟表單                        │
│  • i18n 支援                         │
└─────────────────────────────────────┘
```

---

## 📦 核心套件說明

### 必須安裝的套件

```json
{
  "dependencies": {
    // === 框架核心 ===
    "nuxt": "^3.14.0",
    "vue": "^3.5.0",

    // === 狀態管理 ===
    "@pinia/nuxt": "^0.7.0", // ⭐ Pinia Nuxt 模組
    "pinia": "^2.3.0", // ⭐ Pinia 核心

    // === 伺服器資料管理 ===
    "@tanstack/vue-query": "^5.62.0", // ⭐ Vue TanStack Query

    // === 表格功能 ===
    "@tanstack/vue-table": "^8.20.0", // ⭐ Vue TanStack Table

    // === 表單驗證方案 (二選一) ===

    // 選項 1: FormKit (推薦 - 功能完整、Vue 原生)
    "@formkit/nuxt": "^1.6.0",
    "@formkit/zod": "^1.6.0",
    "@formkit/themes": "^1.6.0",

    // 選項 2: Vee-Validate (輕量、靈活)
    "vee-validate": "^4.13.2",
    "@vee-validate/zod": "^4.13.2",

    // === 驗證 Schema ===
    "zod": "^3.24.0", // ⭐ TypeScript-first 驗證庫

    // === 日期處理 ===
    "date-fns": "^2.30.0"
  },

  "devDependencies": {
    "@tanstack/vue-query-devtools": "^5.62.0", // VueQuery DevTools
    "@nuxt/devtools": "^1.0.0" // Nuxt DevTools
  }
}
```

### 安裝指令

```bash
# 基礎架構
pnpm add @pinia/nuxt @tanstack/vue-query @tanstack/vue-table zod date-fns

# 表單方案 - 選項 1: FormKit (推薦)
pnpm add @formkit/nuxt @formkit/zod @formkit/themes

# 表單方案 - 選項 2: Vee-Validate
pnpm add vee-validate @vee-validate/zod

# 開發工具
pnpm add -D @tanstack/vue-query-devtools
```

---

## 🏗️ 技術棧架構

### 1. 狀態管理對照表

| 項目         | Pinia                   | Vue TanStack Query             |
| ------------ | ----------------------- | ------------------------------ |
| **狀態類型** | 客戶端 UI 狀態          | 伺服器端資料狀態               |
| **資料來源** | 應用程式內部            | API / 後端服務                 |
| **快取策略** | 手動實現                | 內建智能快取與自動重新驗證     |
| **資料同步** | 不處理                  | 自動背景更新、輪詢             |
| **錯誤處理** | 手動處理                | 內建錯誤重試、錯誤邊界         |
| **載入狀態** | 手動管理                | 自動提供 isLoading、isFetching |
| **適用場景** | 主題、偏好設定、UI 狀態 | API 資料、CRUD 操作            |

### 2. 資料流程

```
使用者操作 (點擊排序/翻頁/過濾)
    ↓
Pinia 狀態更新 (setSortBy / setPageIndex)
    ↓
TanStack Query 偵測 queryKey 變化
    ↓
自動發送 API 請求 (帶新參數)
    ↓
TanStack Table 接收新資料
    ↓
UI 自動更新
```

---

## 🔧 Nuxt.js 配置

### nuxt.config.ts

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: [
    '@pinia/nuxt',
    '@pinia-plugin-persistedstate/nuxt', // Pinia 持久化
    '@formkit/nuxt', // 如果使用 FormKit
  ],

  // Pinia 配置
  pinia: {
    storesDirs: ['./stores/**'],
    autoImports: ['defineStore', 'storeToRefs'],
  },

  // FormKit 配置 (可選)
  formkit: {
    configFile: './formkit.config.ts',
  },

  // 自動導入
  imports: {
    dirs: ['composables/**', 'utils/**'],
  },

  // TypeScript 配置
  typescript: {
    strict: true,
    typeCheck: true,
  },

  // SSR/SSG 配置
  ssr: true,

  // Runtime Config
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'https://api.example.com',
    },
  },
})
```

---

## 📊 狀態管理架構 (Pinia)

### 1. Pinia Store 定義

```typescript
// stores/user.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore(
  'user',
  () => {
    // === State ===
    const profile = ref<UserProfile | null>(null)
    const preferences = ref({
      theme: 'dark' as 'light' | 'dark',
      language: 'zh-TW',
      notifications: true,
    })

    // === Getters ===
    const isLoggedIn = computed(() => !!profile.value)
    const userName = computed(() => profile.value?.name || '訪客')
    const isDarkMode = computed(() => preferences.value.theme === 'dark')

    // === Actions ===
    const setProfile = (newProfile: UserProfile) => {
      profile.value = newProfile
    }

    const updatePreferences = (updates: Partial<typeof preferences.value>) => {
      preferences.value = { ...preferences.value, ...updates }
    }

    const toggleTheme = () => {
      preferences.value.theme = preferences.value.theme === 'dark' ? 'light' : 'dark'
    }

    const logout = () => {
      profile.value = null
    }

    return {
      // State
      profile,
      preferences,
      // Getters
      isLoggedIn,
      userName,
      isDarkMode,
      // Actions
      setProfile,
      updatePreferences,
      toggleTheme,
      logout,
    }
  },
  {
    // 持久化配置
    persist: {
      key: 'app-user',
      storage: persistedState.localStorage,
      paths: ['profile', 'preferences'], // 只持久化指定欄位
    },
  }
)
```

### 2. 在元件中使用 Pinia

```vue
<!-- components/ThemeToggle.vue -->
<script setup lang="ts">
import { useUserStore } from '~/stores/user'

const userStore = useUserStore()
const { isDarkMode, userName } = storeToRefs(userStore)
</script>

<template>
  <div>
    <p>歡迎，{{ userName }}</p>
    <button @click="userStore.toggleTheme">
      {{ isDarkMode ? '🌙 深色模式' : '☀️ 淺色模式' }}
    </button>
  </div>
</template>
```

---

## 🌐 伺服器資料管理 (Vue TanStack Query)

### 1. VueQuery 插件設定

```typescript
// plugins/vue-query.ts
import { VueQueryPlugin } from '@tanstack/vue-query'
import type { DehydratedState, VueQueryPluginOptions } from '@tanstack/vue-query'

export default defineNuxtPlugin(nuxt => {
  const vueQueryState = useState<DehydratedState | null>('vue-query')

  const options: VueQueryPluginOptions = {
    queryClientConfig: {
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000, // 5 分鐘
          refetchOnWindowFocus: true,
          retry: (failureCount, error: any) => {
            // 401 錯誤不重試
            if (error?.statusCode === 401) return false
            return failureCount < 3
          },
        },
      },
    },
    clientPersister: queryClient => {
      return {
        persistClient: async client => {
          vueQueryState.value = dehydrate(client)
        },
        restoreClient: async () => {
          if (vueQueryState.value) {
            return hydrate(queryClient, vueQueryState.value)
          }
        },
        removeClient: async () => {
          vueQueryState.value = null
        },
      }
    },
  }

  nuxt.vueApp.use(VueQueryPlugin, options)
})
```

### 2. 基礎 Query 使用

```typescript
// composables/useCharacters.ts
import { useQuery } from '@tanstack/vue-query'

export interface Character {
  id: string
  name: string
  speed: number
  acceleration: number
  weight: number
}

export function useCharacters() {
  return useQuery({
    queryKey: ['characters'],
    queryFn: async () => {
      const response = await $fetch<Character[]>('/api/characters')
      return response
    },
    staleTime: 5 * 60 * 1000,
  })
}
```

### 3. 在元件中使用 Query

```vue
<!-- components/CharacterList.vue -->
<script setup lang="ts">
import { useCharacters } from '~/composables/useCharacters'

const { data: characters, isLoading, error, refetch } = useCharacters()
</script>

<template>
  <div>
    <!-- 載入狀態 -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
    </div>

    <!-- 錯誤狀態 -->
    <div v-else-if="error" class="p-4 bg-red-50 border border-red-200 rounded-lg">
      <p class="text-red-600">載入失敗：{{ error.message }}</p>
      <button @click="refetch()" class="mt-2 px-4 py-2 bg-red-500 text-white rounded">重試</button>
    </div>

    <!-- 資料顯示 -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="character in characters" :key="character.id" class="p-4 border rounded-lg">
        <h3 class="text-lg font-bold">{{ character.name }}</h3>
        <p>速度: {{ character.speed }}/10</p>
        <p>加速: {{ character.acceleration }}/10</p>
      </div>
    </div>
  </div>
</template>
```

### 4. Mutation (資料變更)

```typescript
// composables/useCreateCharacter.ts
import { useMutation, useQueryClient } from '@tanstack/vue-query'

export function useCreateCharacter() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newCharacter: Omit<Character, 'id'>) => {
      const response = await $fetch<Character>('/api/characters', {
        method: 'POST',
        body: newCharacter,
      })
      return response
    },
    onSuccess: () => {
      // 更新快取
      queryClient.invalidateQueries({ queryKey: ['characters'] })
    },
  })
}
```

```vue
<!-- components/CreateCharacterForm.vue -->
<script setup lang="ts">
import { useCreateCharacter } from '~/composables/useCreateCharacter'
import { ref } from 'vue'

const createMutation = useCreateCharacter()

const formData = ref({
  name: '',
  speed: 5,
  acceleration: 5,
  weight: 5,
})

const handleSubmit = () => {
  createMutation.mutate(formData.value, {
    onSuccess: () => {
      alert('新增成功！')
      formData.value = { name: '', speed: 5, acceleration: 5, weight: 5 }
    },
    onError: error => {
      alert(`新增失敗：${error.message}`)
    },
  })
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <input v-model="formData.name" placeholder="角色名稱" class="w-full px-4 py-2 border rounded" />
    <button
      type="submit"
      :disabled="createMutation.isPending.value"
      class="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
    >
      {{ createMutation.isPending.value ? '新增中...' : '新增角色' }}
    </button>
  </form>
</template>
```

---

## 📝 表單驗證架構

### 推薦方案比較

| 項目            | FormKit            | Vee-Validate       |
| --------------- | ------------------ | ------------------ |
| **學習曲線**    | 中等 (完整文檔)    | 低 (靈活簡單)      |
| **功能完整度**  | ⭐⭐⭐⭐⭐         | ⭐⭐⭐⭐           |
| **Nuxt 整合**   | 官方模組           | 需手動整合         |
| **i18n 支援**   | ✅ 內建            | ✅ 支援            |
| **主題系統**    | ✅ 內建            | ❌ 需自己設計 UI   |
| **檔案上傳**    | ✅ 內建            | ❌ 需自己實現      |
| **Bundle 大小** | 中等               | 小                 |
| **適用場景**    | 複雜表單、完整系統 | 簡單表單、靈活控制 |

### 選項 1: FormKit (推薦)

#### 安裝與配置

```typescript
// formkit.config.ts
import { defaultConfig } from '@formkit/vue'
import { zh } from '@formkit/i18n'
import { createProPlugin, inputs } from '@formkit/pro'
import { createZodPlugin } from '@formkit/zod'

const pro = createProPlugin('YOUR_FORMKIT_PRO_KEY', inputs)
const zod = createZodPlugin()

export default defaultConfig({
  locales: { zh },
  locale: 'zh',
  plugins: [pro, zod],
})
```

#### 定義驗證 Schema

```typescript
// schemas/authSchemas.ts
import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().min(1, '請輸入電子郵件').email('電子郵件格式不正確'),
  password: z
    .string()
    .min(8, '密碼至少 8 個字元')
    .regex(/[A-Z]/, '密碼必須包含至少一個大寫字母')
    .regex(/[0-9]/, '密碼必須包含至少一個數字'),
})

export type LoginFormData = z.infer<typeof loginSchema>

export const registerSchema = z
  .object({
    name: z.string().min(2, '姓名至少 2 個字元').max(50, '姓名最多 50 個字元'),
    email: z.string().min(1, '請輸入電子郵件').email('電子郵件格式不正確'),
    password: z
      .string()
      .min(8, '密碼至少 8 個字元')
      .regex(/[A-Z]/, '密碼必須包含至少一個大寫字母')
      .regex(/[0-9]/, '密碼必須包含至少一個數字'),
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: '密碼不一致',
    path: ['confirmPassword'],
  })

export type RegisterFormData = z.infer<typeof registerSchema>
```

#### FormKit 表單實現

```vue
<!-- pages/login.vue -->
<script setup lang="ts">
import { useMutation } from '@tanstack/vue-query'
import { useUserStore } from '~/stores/user'
import { loginSchema, type LoginFormData } from '~/schemas/authSchemas'

const userStore = useUserStore()
const router = useRouter()

const loginMutation = useMutation({
  mutationFn: async (data: LoginFormData) => {
    const response = await $fetch('/api/auth/login', {
      method: 'POST',
      body: data,
    })
    return response
  },
  onSuccess: data => {
    userStore.setProfile(data.user)
    router.push('/')
  },
})

const handleSubmit = (data: LoginFormData) => {
  loginMutation.mutate(data)
}
</script>

<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-50">
    <div class="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
      <h1 class="text-2xl font-bold mb-6 text-center">登入</h1>

      <FormKit type="form" :actions="false" @submit="handleSubmit" :validation-schema="loginSchema">
        <FormKit
          type="email"
          name="email"
          label="電子郵件"
          placeholder="example@email.com"
          validation="required|email"
        />

        <FormKit
          type="password"
          name="password"
          label="密碼"
          placeholder="••••••••"
          validation="required|length:8"
        />

        <!-- 伺服器錯誤訊息 -->
        <div
          v-if="loginMutation.isError.value"
          class="p-3 bg-red-50 border border-red-200 rounded-lg"
        >
          <p class="text-sm text-red-600">
            {{ loginMutation.error.value?.message || '登入失敗，請稍後再試' }}
          </p>
        </div>

        <FormKit
          type="submit"
          :disabled="loginMutation.isPending.value"
          :label="loginMutation.isPending.value ? '登入中...' : '登入'"
        />
      </FormKit>
    </div>
  </div>
</template>
```

### 選項 2: Vee-Validate (輕量方案)

```vue
<!-- pages/login.vue -->
<script setup lang="ts">
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { useMutation } from '@tanstack/vue-query'
import { loginSchema, type LoginFormData } from '~/schemas/authSchemas'

const { handleSubmit, defineField, errors } = useForm({
  validationSchema: toTypedSchema(loginSchema),
})

const [email, emailAttrs] = defineField('email')
const [password, passwordAttrs] = defineField('password')

const loginMutation = useMutation({
  mutationFn: async (data: LoginFormData) => {
    return await $fetch('/api/auth/login', {
      method: 'POST',
      body: data,
    })
  },
})

const onSubmit = handleSubmit(values => {
  loginMutation.mutate(values as LoginFormData)
})
</script>

<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-50">
    <div class="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
      <h1 class="text-2xl font-bold mb-6">登入</h1>

      <form @submit="onSubmit" class="space-y-4">
        <div>
          <label for="email" class="block text-sm font-medium mb-1">電子郵件</label>
          <input
            id="email"
            v-model="email"
            v-bind="emailAttrs"
            type="email"
            class="w-full px-4 py-2 border rounded-lg"
            :class="{ 'border-red-500': errors.email }"
          />
          <p v-if="errors.email" class="mt-1 text-sm text-red-500">{{ errors.email }}</p>
        </div>

        <div>
          <label for="password" class="block text-sm font-medium mb-1">密碼</label>
          <input
            id="password"
            v-model="password"
            v-bind="passwordAttrs"
            type="password"
            class="w-full px-4 py-2 border rounded-lg"
            :class="{ 'border-red-500': errors.password }"
          />
          <p v-if="errors.password" class="mt-1 text-sm text-red-500">{{ errors.password }}</p>
        </div>

        <button
          type="submit"
          :disabled="loginMutation.isPending.value"
          class="w-full py-2 bg-blue-500 text-white rounded-lg"
        >
          {{ loginMutation.isPending.value ? '登入中...' : '登入' }}
        </button>
      </form>
    </div>
  </div>
</template>
```

---

## 📊 表格功能架構 (Vue TanStack Table)

### 1. 基礎表格實現

```vue
<!-- components/CharactersTable.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  useVueTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  FlexRender,
} from '@tanstack/vue-table'
import type { ColumnDef, SortingState } from '@tanstack/vue-table'
import { useCharacters } from '~/composables/useCharacters'

const { data: characters, isLoading } = useCharacters()

const sorting = ref<SortingState>([])

const columns: ColumnDef<Character>[] = [
  {
    accessorKey: 'name',
    header: '角色名稱',
  },
  {
    accessorKey: 'speed',
    header: '速度',
    cell: info => `${info.getValue()}/10`,
  },
  {
    accessorKey: 'acceleration',
    header: '加速',
    cell: info => `${info.getValue()}/10`,
  },
  {
    accessorKey: 'weight',
    header: '重量',
  },
]

const table = useVueTable({
  get data() {
    return characters.value ?? []
  },
  columns,
  state: {
    get sorting() {
      return sorting.value
    },
  },
  onSortingChange: updaterOrValue => {
    sorting.value =
      typeof updaterOrValue === 'function' ? updaterOrValue(sorting.value) : updaterOrValue
  },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
})
</script>

<template>
  <div>
    <!-- 載入狀態 -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
    </div>

    <!-- 表格 -->
    <div v-else class="overflow-x-auto rounded-lg border border-gray-200">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
            <th
              v-for="header in headerGroup.headers"
              :key="header.id"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              @click="header.column.getToggleSortingHandler()?.($event)"
            >
              <FlexRender :render="header.column.columnDef.header" :props="header.getContext()" />
              <span v-if="header.column.getIsSorted()">
                {{ header.column.getIsSorted() === 'asc' ? ' 🔼' : ' 🔽' }}
              </span>
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="row in table.getRowModel().rows" :key="row.id">
            <td
              v-for="cell in row.getVisibleCells()"
              :key="cell.id"
              class="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
            >
              <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 分頁控制 -->
      <div class="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
        <div class="text-sm text-gray-700">
          顯示
          {{ table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1 }} 到
          {{
            Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )
          }}
          筆，共 {{ table.getFilteredRowModel().rows.length }} 筆
        </div>

        <div class="flex items-center gap-2">
          <button
            @click="table.previousPage()"
            :disabled="!table.getCanPreviousPage()"
            class="px-3 py-1 border rounded disabled:opacity-50"
          >
            上一頁
          </button>
          <button
            @click="table.nextPage()"
            :disabled="!table.getCanNextPage()"
            class="px-3 py-1 border rounded disabled:opacity-50"
          >
            下一頁
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
```

### 2. 與 Pinia 整合 (狀態驅動)

```typescript
// stores/table.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { SortingState, PaginationState } from '@tanstack/vue-table'

export const useTableStore = defineStore('table', () => {
  const sorting = ref<SortingState>([])
  const pagination = ref<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  const setSorting = (newSorting: SortingState) => {
    sorting.value = newSorting
  }

  const setPagination = (newPagination: PaginationState) => {
    pagination.value = newPagination
  }

  return {
    sorting,
    pagination,
    setSorting,
    setPagination,
  }
})
```

```vue
<!-- components/StatefulTable.vue -->
<script setup lang="ts">
import { useTableStore } from '~/stores/table'
import { storeToRefs } from 'pinia'

const tableStore = useTableStore()
const { sorting, pagination } = storeToRefs(tableStore)

// 使用 Pinia 狀態
const table = useVueTable({
  // ...
  state: {
    get sorting() {
      return sorting.value
    },
    get pagination() {
      return pagination.value
    },
  },
  onSortingChange: updaterOrValue => {
    tableStore.setSorting(
      typeof updaterOrValue === 'function' ? updaterOrValue(sorting.value) : updaterOrValue
    )
  },
  onPaginationChange: updaterOrValue => {
    tableStore.setPagination(
      typeof updaterOrValue === 'function' ? updaterOrValue(pagination.value) : updaterOrValue
    )
  },
  // ...
})
</script>
```

### 3. 伺服器端分頁

```typescript
// composables/useServerCharacters.ts
import { useQuery } from '@tanstack/vue-query'
import { useTableStore } from '~/stores/table'
import { storeToRefs } from 'pinia'

export function useServerCharacters() {
  const tableStore = useTableStore()
  const { pagination, sorting } = storeToRefs(tableStore)

  return useQuery({
    queryKey: ['characters', { pagination, sorting }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: pagination.value.pageIndex.toString(),
        pageSize: pagination.value.pageSize.toString(),
        ...(sorting.value[0] && {
          sortBy: sorting.value[0].id,
          sortOrder: sorting.value[0].desc ? 'desc' : 'asc',
        }),
      })

      const response = await $fetch(`/api/characters?${params}`)
      return response
    },
    keepPreviousData: true,
  })
}
```

---

## 🎯 完整範例：角色管理系統

```vue
<!-- pages/characters.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  useVueTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  FlexRender,
} from '@tanstack/vue-table'
import type { ColumnDef } from '@tanstack/vue-table'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { useTableStore } from '~/stores/table'
import { storeToRefs } from 'pinia'

// === Store ===
const tableStore = useTableStore()
const { sorting, pagination } = storeToRefs(tableStore)

// === Query ===
const queryClient = useQueryClient()

const { data, isLoading, error } = useQuery({
  queryKey: ['characters', { pagination, sorting }],
  queryFn: async () => {
    const response = await $fetch('/api/characters')
    return response
  },
})

// === Mutation ===
const deleteMutation = useMutation({
  mutationFn: async (id: string) => {
    await $fetch(`/api/characters/${id}`, { method: 'DELETE' })
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['characters'] })
  },
})

// === Table ===
const columns: ColumnDef<Character>[] = [
  {
    accessorKey: 'name',
    header: '角色名稱',
  },
  {
    accessorKey: 'speed',
    header: '速度',
    cell: (info) => (
      <div class="flex items-center gap-2">
        <div class="w-24 bg-gray-200 rounded-full h-2">
          <div
            class="bg-blue-500 h-2 rounded-full"
            :style="{ width: `${(info.getValue() as number) * 10}%` }"
          />
        </div>
        <span class="text-sm">{info.getValue()}/10</span>
      </div>
    ),
  },
  {
    id: 'actions',
    header: '操作',
    cell: ({ row }) => (
      <button
        @click="() => deleteMutation.mutate(row.original.id)"
        class="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
      >
        刪除
      </button>
    ),
  },
]

const table = useVueTable({
  get data() {
    return data.value ?? []
  },
  columns,
  state: {
    get sorting() {
      return sorting.value
    },
    get pagination() {
      return pagination.value
    },
  },
  onSortingChange: tableStore.setSorting,
  onPaginationChange: tableStore.setPagination,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 p-8">
    <div class="max-w-7xl mx-auto space-y-6">
      <h1 class="text-3xl font-bold">角色管理</h1>

      <!-- 載入狀態 -->
      <div v-if="isLoading" class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>

      <!-- 錯誤狀態 -->
      <div v-else-if="error" class="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p class="text-red-600">載入失敗：{{ error.message }}</p>
      </div>

      <!-- 表格 -->
      <div v-else class="bg-white rounded-lg shadow overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
              <th
                v-for="header in headerGroup.headers"
                :key="header.id"
                @click="header.column.getToggleSortingHandler()?.($event)"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              >
                <FlexRender :render="header.column.columnDef.header" :props="header.getContext()" />
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="row in table.getRowModel().rows" :key="row.id">
              <td
                v-for="cell in row.getVisibleCells()"
                :key="cell.id"
                class="px-6 py-4 whitespace-nowrap"
              >
                <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
              </td>
            </tr>
          </tbody>
        </table>

        <!-- 分頁 -->
        <div class="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div class="text-sm text-gray-700">
            顯示
            {{
              table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1
            }}
            到
            {{
              Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                table.getFilteredRowModel().rows.length
              )
            }}
            筆
          </div>

          <div class="flex items-center gap-2">
            <button
              @click="table.previousPage()"
              :disabled="!table.getCanPreviousPage()"
              class="px-3 py-1 border rounded disabled:opacity-50"
            >
              上一頁
            </button>
            <button
              @click="table.nextPage()"
              :disabled="!table.getCanNextPage()"
              class="px-3 py-1 border rounded disabled:opacity-50"
            >
              下一頁
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
```

---

## ✅ 最佳實踐

### 1. QueryKey 命名規範

```typescript
// ✅ 好的命名
;['characters'][('characters', id)][('characters', { page: 1, sortBy: 'name' })][ // 列表 // 單筆 // 帶參數
  ('characters', 'favorites')
][ // 特定類型
  // ❌ 避免的命名
  'getCharacters'
]['char'] // 不需要動詞前綴 // 太簡短
```

### 2. 錯誤處理

```typescript
const { data, error, isError } = useQuery({
  queryKey: ['characters'],
  queryFn: async () => {
    const response = await $fetch('/api/characters')
    if (!response.ok) {
      throw new ApiError(response.status, response.message)
    }
    return response.data
  },
  retry: (failureCount, error) => {
    if (error instanceof ApiError && error.status === 404) {
      return false // 404 不重試
    }
    return failureCount < 3
  },
})
```

### 3. 樂觀更新

```typescript
const updateMutation = useMutation({
  mutationFn: async updates => {
    return await $fetch(`/api/characters/${updates.id}`, {
      method: 'PATCH',
      body: updates,
    })
  },
  onMutate: async newData => {
    // 取消正在進行的查詢
    await queryClient.cancelQueries({ queryKey: ['characters'] })

    // 快照目前資料
    const previousData = queryClient.getQueryData(['characters'])

    // 樂觀更新
    queryClient.setQueryData(['characters'], (old: any) => {
      return old.map((item: any) => (item.id === newData.id ? { ...item, ...newData } : item))
    })

    return { previousData }
  },
  onError: (err, newData, context) => {
    // 回滾
    queryClient.setQueryData(['characters'], context?.previousData)
  },
  onSettled: () => {
    // 重新驗證
    queryClient.invalidateQueries({ queryKey: ['characters'] })
  },
})
```

---

## 🤔 常見問題

### Q1: Pinia 和 VueQuery 什麼時候用哪個？

**A**:

- ✅ **Pinia**: UI 狀態、使用者偏好、表單草稿、主題設定
- ✅ **VueQuery**: API 資料、CRUD 操作、伺服器同步

```typescript
// ❌ 不要這樣做
const charactersStore = defineStore('characters', () => {
  const characters = ref([])

  const fetchCharacters = async () => {
    const data = await $fetch('/api/characters')
    characters.value = data
  }

  return { characters, fetchCharacters }
})

// ✅ 應該這樣做
const { data: characters } = useQuery({
  queryKey: ['characters'],
  queryFn: () => $fetch('/api/characters'),
})
```

### Q2: FormKit 和 Vee-Validate 如何選擇？

**A**:

- ✅ **FormKit**: 需要完整 UI、檔案上傳、多步驟表單、快速開發
- ✅ **Vee-Validate**: 需要最大靈活度、自訂 UI、輕量化

### Q3: 表格資料要持久化嗎？

**A**:

- ✅ **持久化**: 排序、分頁、列可見性 (使用 Pinia)
- ❌ **不持久化**: 表格資料本身 (使用 VueQuery 快取)

### Q4: SSR 模式下如何處理？

**A**: VueQuery 支援 SSR，使用 `useAsyncData` 整合：

```typescript
// pages/characters.vue
const { data } = await useAsyncData('characters', () => {
  return $fetch('/api/characters')
})

// 或使用 VueQuery 的 SSR 支援
const { data } = useQuery({
  queryKey: ['characters'],
  queryFn: () => $fetch('/api/characters'),
  initialData: () => useNuxtApp().payload.data['characters'],
})
```

---

## 📚 參考資源

- [Pinia 官方文檔](https://pinia.vuejs.org/)
- [Vue TanStack Query 官方文檔](https://tanstack.com/query/latest/docs/vue/overview)
- [Vue TanStack Table 官方文檔](https://tanstack.com/table/latest/docs/framework/vue/overview)
- [FormKit 官方文檔](https://formkit.com/)
- [Vee-Validate 官方文檔](https://vee-validate.logaretm.com/)
- [Zod 官方文檔](https://zod.dev/)
- [Nuxt 3 官方文檔](https://nuxt.com/)

---

**文件維護者**: AI Assistant  
**最後更新**: 2026-04-22  
**版本**: 1.0.0
