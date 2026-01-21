# Lucky50 程式碼規範技能

## 🎯 技能概述

提供 Lucky50 專案的完整程式碼規範、技術棧標準和開發最佳實踐。

## 📚 核心技術棧

- **前端框架**: Vue 3 + Composition API
- **語言**: TypeScript (strict mode)
- **狀態管理**: Pinia
- **樣式框架**: Tailwind CSS
- **建置工具**: Vite
- **套件管理**: pnpm
- **測試框架**: Vitest + Vue Test Utils

## 🏗️ 開發規範

### Vue 組件開發

- 使用 `<script setup>` 語法
- 遵循 Composition API 模式
- 明確的 Props 型別定義
- Emits 事件命名採用 kebab-case

### TypeScript 規範

- 嚴格模式啟用
- 所有變數必須有型別
- Interface 定義優先於 type
- 避免 any 類型使用

### CSS/Tailwind 規範

- 使用 Tailwind CSS utility classes
- 避免自定義 CSS（除非必要）
- 響應式設計使用斷點前綴
- 組件樣式作用域

## 📂 專案結構

```
src/
├── components/          # Vue 組件
├── composables/         # Composables
├── stores/             # Pinia stores
├── types/              # TypeScript 型別定義
├── services/           # API 服務
├── utils/              # 工具函式
├── views/              # 頁面組件
└── assets/             # 靜態資源
```

## 🎯 開發流程

### 1. 組件開發

- 先定義 TypeScript interface
- 實作 composable 邏輯
- 建立 Vue 組件
- 撰寫單元測試

### 2. 狀態管理

- 使用 Pinia store
- 按功能模組分類
- 支援 TypeScript 類型推導

### 3. API 整合

- 統一錯誤處理
- Request/Response 型別定義
- 攔截器統一配置

## ⚡ 快速參考

### Vue 組件模板

```vue
<script setup lang="ts">
interface Props {
  title: string
  count?: number
}

const props = withDefaults(defineProps<Props>(), {
  count: 0,
})

const emit = defineEmits<{
  update: [value: number]
}>()
</script>
```

### Composable 模板

```typescript
import { ref, computed } from 'vue'

export function useCounter(initial = 0) {
  const count = ref(initial)

  const doubled = computed(() => count.value * 2)

  const increment = () => count.value++

  return { count, doubled, increment }
}
```

---

_詳細規範請參考 code-standards/references/ 目錄下的專門文檔_
