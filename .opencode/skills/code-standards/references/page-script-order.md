# Vue 頁面 `<script>` 寫作順序規範

> 適用於 `src/views/` 下所有頁面級 `.vue` 檔案。
> 共用元件（`src/components/`）可參考但不強制。

---

## 📐 區塊順序（從上到下，嚴格遵守）

```
1. <script setup lang="ts">

2. ─── ① Import 區塊 ───────────────────────
3. ─── ② Type / Interface 區塊 ─────────────
4. ─── ③ Props / Emits 區塊 ────────────────
5. ─── ④ 常量與設定區塊 ───────────────────
6. ─── ⑤ Store 實例區塊 ───────────────────
7. ─── ⑥ 響應式狀態區塊 ───────────────────
8. ─── ⑦ 計算屬性區塊 ─────────────────────
9. ─── ⑧ 方法與函式區塊 ──────────────────
10. ─── ⑨ 監聽器區塊 ───────────────────────
11. ─── ⑩ 生命週期區塊 ─────────────────────
12. ─── ⑪ 模板輔助區塊 ─────────────────────
13. </script>
```

---

## 📝 各區塊詳細規範

### ① Import 區塊

**無註解、無空行分組，直接依以下優先順序排列：**

1. Vue 核心（`vue`）
2. Router（`vue-router`）
3. Stores（`@/stores/*`）
4. Composables（`@/composables/*`）
5. Types（`import type`）
6. 元件（第三方套件、`@/components/*`）
7. Services（`@/services/*`）
8. 工具函式（`@/utils/*`）
9. 樣式（CSS import）

```typescript
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useToast } from '@/composables/useToast'
import type { UserProfile } from '@/types'
import VueDatePicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import { FinMindService } from '@/services/finmind'
import { toLocalDateString } from '@/utils/date'
```

**規則：**

- `import type` 必須與一般 import 分開
- 第三方套件 CSS import 緊跟在對應元件 import 後

---

### ② Type / Interface 區塊

**區塊標記註解：**

```typescript
// ── 型別定義 ──
interface LocalState {
  loading: boolean
  error: string | null
}
```

僅在頁面有專屬型別時才需要此區塊。若無，直接進入下一區塊。

---

### ③ Props / Emits 區塊

**區塊標記註解：**

```typescript
// ── Props / Emits ──
interface Props {
  userId: string
  mode?: 'view' | 'edit'
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'view',
})

const emit = defineEmits<{
  save: [profile: UserProfile]
  cancel: []
}>()
```

若頁面無 props/emits（多數頁面），跳過此區塊。

---

### ④ 常量與設定區塊

**區塊標記註解：**

```typescript
// ── 常量與設定 ──
const PERIODS = [
  { label: '1M', value: '1m' },
  { label: '3M', value: '3m' },
] as const

const shichenList = [
  { name: '子時', time: '23:00-01:00' },
  { name: '丑時', time: '01:00-03:00' },
] as const
```

固定資料、枚舉值、不可變配置放此區塊。

---

### ⑤ Store 實例區塊

**區塊標記註解：**

```typescript
// ── Store 實例 ──
const userStore = useUserStore()
const dashboardStore = useDashboardStore()
const { isDark } = useTheme()
const { success, error: showError } = useToast()
```

所有 `use*Store()` 和 `use*()` composable 呼叫集中在此。
解構賦值可直接在此行完成。

---

### ⑥ 響應式狀態區塊

**區塊標記註解：**

```typescript
// ── 響應式狀態 ──
const loading = ref(true)
const error = ref<string | null>(null)
const selectedShichen = ref('')
const saving = ref(false)
const form = ref<UserProfile>(createEmptyForm())
```

- 所有 `ref()` 宣告集中在此
- 初始值建立函式（如 `createEmptyForm`）可定義在 ref 之前，但仍在本區塊內
- 命名順序：主要狀態在前，UI 狀態（loading/error/saving）在後

---

### ⑦ 計算屬性區塊

**區塊標記註解：**

```typescript
// ── 計算屬性 ──
const isFormValid = computed(() => {
  return form.value.name.length > 0
})

const filteredData = computed(() => {
  return dashboardStore.etfData.filter(d => d.date >= startDate.value)
})

const statistics = computed(() => ({
  total: filteredData.value.length,
  avg: filteredData.value.reduce((sum, d) => sum + d.price, 0),
}))
```

每個 `computed` 之間空一行。有註解需求時在 computed 內部首行寫，不在外層加多餘註解。

---

### ⑧ 監聽器區塊

**區塊標記註解：**

```typescript
// ── 監聽器 ──
watch(
  () => form.value.birthDate,
  newDate => {
    if (newDate) {
      // 自動推算生肖
    }
  }
)

watchEffect(() => {
  const surname = form.value.surname
  const givenName = form.value.givenName
  // 聯合計算姓名學五行
})
```

- `watch` 與 `watchEffect` 皆歸入此區塊
- 每個 watcher 之間空一行
- 簡短註解說明監聽目的

---

### ⑨ 生命週期區塊

**區塊標記註解：**

```typescript
// ── 生命週期 ──
onMounted(async () => {
  await loadInitialData()
})
```

- 僅 `onMounted`、`onUnmounted` 等生命週期鉤子
- 頁面級元件通常只有 `onMounted`
- 若生命週期內邏輯複雜，將主要邏輯抽成 ⑩ 區塊的函式，此處僅做呼叫

---

### ⑩ 方法與函式區塊

**區塊標記註解：**

```typescript
// ── 方法與函式 ──
const loadAnalyticsData = async () => {
  loading.value = true
  try {
    await dashboardStore.fetchETFData()
  } catch (e) {
    error.value = '載入失敗'
  } finally {
    loading.value = false
  }
}

const saveProfile = async () => {
  saving.value = true
  try {
    await userStore.updateProfile(form.value)
    success('儲存成功')
  } catch (e) {
    showError('儲存失敗')
  } finally {
    saving.value = false
  }
}

const getColorClass = (color: string): string => {
  return `bg-${color}-500`
}
```

- 非同步函式（`async`）放在同步函式之前
- 每個函式之間空一行
- 函式內部不加多餘註解，邏輯靠命名自解釋

---

### ⑪ 模板輔助區塊

**區塊標記註解：**

```typescript
// ── 模板輔助 ──
const timeToShichen = (time: string): string => {
  const hour = parseInt(time.split(':')[0], 10)
  if (hour === 23 || hour === 0) return '子時'
  // ...
  return ''
}

const onDateChange = (date: Date | null) => {
  // 純 UI 事件處理
}
```

- 僅在模板中使用的純輔助函式
- 與業務邏輯無關的 UI 轉換、格式化放此處
- 與 ⑩ 區塊的差異：此區塊函式**僅供 template 綁定**，不被其他 JS 邏輯呼叫

---

## ✅ 完整範例

```vue
<script setup lang="ts">
// ── Vue 核心 ──
import { ref, computed, watch, watchEffect, onMounted } from 'vue'

// ── Router ──
import { useRouter } from 'vue-router'

// ── Stores ──
import { useUserStore } from '@/stores/user'

// ── Composables ──
import { useToast } from '@/composables/useToast'

// ── Types ──
import type { UserProfile } from '@/types'

// ── 元件 ──
import VueDatePicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'

// ── 工具函式 ──
import { getElementFromName, getZodiacFromDate } from '@/utils/zodiac'

// ── 常量與設定 ──
const shichenList = [
  { name: '子時', time: '23:00-01:00' },
  { name: '丑時', time: '01:00-03:00' },
] as const

// ── Store 實例 ──
const userStore = useUserStore()
const router = useRouter()
const { success, error: showError } = useToast()

// ── 響應式狀態 ──
const saving = ref(false)
const form = ref<UserProfile>(createEmptyForm())

// ── 計算屬性 ──
const isFormValid = computed(() => {
  return form.value.surname.length > 0 && form.value.givenName.length > 0
})

// ── 監聽器 ──
watchEffect(() => {
  const surname = form.value.surname
  const givenName = form.value.givenName
  form.value.name = surname + givenName
  form.value.nameElement = getElementFromName(form.value.name)
})

watch(
  () => form.value.birthDate,
  newDate => {
    if (newDate) {
      form.value.zodiac = getZodiacFromDate(new Date(newDate))
      form.value.element = getElementFromDate(new Date(newDate))
    }
  }
)

// ── 生命週期 ──
onMounted(() => {
  if (userStore.profile) {
    form.value = { ...userStore.profile }
  }
})

// ── 方法與函式 ──
const saveProfile = async () => {
  saving.value = true
  try {
    await userStore.updateProfile(form.value)
    success('儲存成功')
    router.push('/dashboard')
  } catch (e) {
    showError('儲存失敗')
  } finally {
    saving.value = false
  }
}

// ── 模板輔助 ──
const timeToShichen = (time: string): string => {
  const hour = parseInt(time.split(':')[0], 10)
  if (hour === 23 || hour === 0) return '子時'
  return ''
}
</script>
```

---

## ⚠️ 注意事項

| 規則             | 說明                                                      |
| ---------------- | --------------------------------------------------------- |
| 區塊順序         | 嚴格按照 ①→⑪，不可調換                                    |
| 空行             | 區塊與區塊之間空一行；區塊內每個宣告之間空一行            |
| 註解格式         | 僅在區塊開頭用 `// ── 區塊名稱 ──` 標記，其餘不加多餘註解 |
| `import type`    | 必須獨立成行，不與一般 import 混寫                        |
| `ref` 宣告       | 所有 ref 集中在 ⑥，不要散落在 computed 或 watcher 附近    |
| 頁面級 vs 元件級 | 本規範強制用於 `src/views/`，`src/components/` 可參考     |
