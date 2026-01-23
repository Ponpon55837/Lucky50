# Lucky50 程式碼規範技能

## 🎯 技能概述

提供 Lucky50 專案的完整程式碼規範、技術棧標準和開發最佳實踐。

## 📚 核心技術棧

- **前端框架**: Vue 3 + Composition API
- **語言**: TypeScript (strict mode)
- **狀態管理**: Pinia
- **樣式框架**: Tailwind CSS
- **建置工具**: Vite
- **套件管理**: ppnpm
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

## 📁 參考文檔結構

### 專門規範文檔

- **[API 服務層規範](references/api.md)** - API 架構設計、錯誤處理、快取策略
- **[Vue 組件開發規範](references/components.md)** - 組件架構、Props/Slots、事件處理
- **[Composables 開發規範](references/composables.md)** - 狀態管理、實用工具、業務邏輯
- **[錯誤處理規範](references/error-handling.md)** - 統一錯誤處理、日誌記錄
- **[Chart.js 整合規範](references/chartjs.md)** - 圖表配置、數據可視化
- **[Three.js 規範](references/threejs.md)** - 3D 圖形渲染、WebGL 整合

## 🔧 開發工具配置

### VSCode 擴展推薦

```json
{
  "recommendations": [
    "vue.volar",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

### Prettier 配置

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "endOfLine": "lf",
  "arrowParens": "avoid"
}
```

### ESLint 配置

```javascript
module.exports = {
  extends: [
    'plugin:vue/vue3-essential',
    'eslint:recommended',
    '@vue/typescript/recommended',
    '@vue/prettier',
    '@vue/prettier/@typescript-eslint',
  ],
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'vue/multi-word-component-names': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': 'error',
  },
}
```

## 🎯 程式碼品質檢查

### 提交前檢查

```bash
# 類型檢查
pnpm run type-check

# ESLint 檢查
pnpm run lint

# 格式化檢查
pnpm run format:check

# 單元測試
pnpm run test:unit

# 端到端測試
pnpm run test:e2e
```

### 效能監控

```typescript
// Vue 效能監控
import { onMounted } from 'vue'

onMounted(() => {
  if (process.env.NODE_ENV === 'development') {
    // 開發模式效能監控
    const perfObserver = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        console.log(`${entry.name}: ${entry.duration}ms`)
      }
    })
    perfObserver.observe({ entryTypes: ['measure'] })
  }
})
```

## 🔒 安全規範

### 資料處理

- 所有使用者輸入必須驗證
- 敏感資料不得存放在 localStorage
- API 金鑰使用環境變數
- 實施 CSRF 防護

### 程式碼安全

```typescript
// XSS 防護
import { DOMPurify } from 'dompurify'

const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html)
}

// 內容安全政策
const CSP_HEADERS = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'",
}
```

## 🌐 國際化規範

### 語言檔案結構

```typescript
// locales/zh-TW.json
{
  "common": {
    "save": "儲存",
    "cancel": "取消",
    "delete": "刪除"
  },
  "lunar": {
    "solar_date": "西元日期",
    "lunar_date": "農曆日期",
    "auspicious": "吉日"
  }
}
```

### i18n 整合

```typescript
import { useI18n } from 'vue-i18n'

export function useI18nComposable() {
  const { t, locale } = useI18n()

  return {
    t,
    locale,
    setLanguage: (lang: string) => {
      locale.value = lang
      localStorage.setItem('language', lang)
    },
  }
}
```

## 📋 發布流程

### 版本管理

```bash
# 版本號格式：MAJOR.MINOR.PATCH
pnpm version patch  # 修復錯誤
pnpm version minor  # 新功能
pnpm version major  # 破壞性變更
```

### 建置部署

```bash
# 建置生產版本
pnpm run build

# 檢查建置大小
pnpm run build:analyze

# 部署前測試
pnpm run test:ci
```

---

**詳細規範請參考 [code-standards/references/](references/) 目錄下的專門文檔**
