# Changelog

## [2026-07-10] Vue 生態系大規模升級 (Phase 1-3)

### Phase 1: Core Vue

| Package | Before | After |
|---------|--------|-------|
| vue | 3.5.22 | 3.5.39 |
| vue-router | 4.5.1 | 5.1.0 |
| pinia | 3.0.3 | 3.0.4 |
| pinia-plugin-persistedstate | 4.5.0 | 4.7.1 |
| vue-chartjs | 5.3.2 | 5.3.4 |
| vue-tsc | 3.2.2 | 3.3.7 |
| @vue/test-utils | 2.4.6 | 2.4.11 |

**Vue Router 5 upgrade** (`src/router/index.ts`):
- `beforeEach` guard 移除已棄用的 `next()` callback，改為直接 return

### Phase 2: Vite + Build Tools

| Package | Before | After |
|---------|--------|-------|
| vite | 4.5.14 | 8.1.4 |
| @vitejs/plugin-vue | 4.6.2 | 6.0.7 |
| vitest | 4.0.17 | 4.1.10 |
| @vitest/coverage-v8 | 4.0.17 | 4.1.10 |
| @vitest/ui | 4.0.17 | 4.1.10 |
| vite-plugin-pwa | 1.0.3 | 1.3.0 |
| workbox-build | 7.3.0 | 7.4.1 |
| workbox-window | 7.3.0 | 7.4.1 |
| autoprefixer | 10.4.21 | 10.5.2 |
| postcss | 8.5.6 | 8.5.16 |
| terser | 5.44.0 | 5.49.0 |

**Vite 8 breaking change** (`vite.config.ts`):
- `rollupOptions.output.manualChunks` 從物件格式改為函數格式（rolldown 相容）

### Phase 3: ESLint 生態系

| Package | Before | After |
|---------|--------|-------|
| eslint | 9.39.2 | 10.6.0 |
| eslint-plugin-vue | 9.33.0 | 10.9.2 |
| @typescript-eslint/eslint-plugin | 8.53.0 | 8.63.0 |
| @typescript-eslint/parser | 8.53.0 | 8.63.0 |
| @vue/eslint-config-typescript | 14.6.0 | 14.9.0 |
| @eslint/js (new) | — | 10.0.1 |
| vue-eslint-parser (new) | — | 10.4.1 |

**eslint-plugin-vue v10 新增規則** (`src/components/ErrorModal.vue`):
- `vue/no-required-prop-with-default`: `modelValue` 和 `message` 改為 optional interface

### 其他修復

**`index.html`**:
- 加入 `meta[name="mobile-web-app-capable"]`（`apple-mobile-web-app-capable` 已棄用的替代）
- 移除重複的 Google Fonts preload

### 驗證結果

- `vue-tsc --noEmit`: ✅ 零錯誤
- `vite build`: ✅ Build 成功 (35 entries, ~21s)
- `eslint .`: ✅ 僅 4 個預先存在的舊錯誤
- `vitest run`: ✅ 46 tests passed
