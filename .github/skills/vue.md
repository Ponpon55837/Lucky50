---
name: vue
description: Vue 3 Composition API 開發指南 - 載入自 .opencode/skills/vue/SKILL.md
license: MIT
---

# Vue 3 開發指南技能

## 📍 實作位置

**技能實作**：`../../../.opencode/skills/vue/SKILL.md`

## 🎯 觸發關鍵詞

`vue`, `component`, `composable`, `響應式`, `Composition API`

## 📚 功能說明

本技能提供 Vue 3 Composition API 的完整開發指南：

### 🧩 Vue 組件開發模式

- Props reactive destructuring (Vue 3.5+)
- Type-safe emits 和 defineModel
- Slots 簡寫語法
- Template refs (useTemplateRef)

### 🔄 Composables 開發指引

- Composition API 結構
- VueUse 整合建議
- 生命週期鉤子
- 非同步處理模式

### 🛠️ Client utilities 規範

- 純函數設計原則
- 格式化函數指南
- 驗證器開發規範

### 🧪 測試最佳實踐

- Vitest + @vue/test-utils
- 組件測試模式
- Composable 測試指南
- Mocking 模式

### 📖 模組化載入

- 基礎檔案：~250 tokens
- 子檔案：~500-1500 tokens
- 按需載入，節省 context

## 📋 模組化載入指引

根據當前工作選擇性載入：

| 工作內容         | 載入檔案                     |
| ---------------- | ---------------------------- |
| 編輯 `.vue` 組件 | `references/components.md`   |
| 開發 composables | `references/composables.md`  |
| 開發工具函數     | `references/utils-client.md` |
| 撰寫測試         | `references/testing.md`      |

---

**注意**：此技能會與 `code-standards` 技能組合載入，確保 Vue 開發符合專案規範。
