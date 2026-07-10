# Lucky50 UI 樣式標準

## 頁面佈局

### 外層容器 - 統一標準
所有主頁面都使用相同的外層結構：

| 頁面 | 外層 | 說明 |
|------|------|------|
| Dashboard | `max-w-7xl` 整頁寬度 | 動態卡片網格佈局 |
| Analytics | `max-w-7xl` 整頁寬度 | 圖表和分析數據 |
| History | `max-w-7xl` 整頁寬度 | FortuneLogViewer 列表整頁寬度 |
| Profile | `max-w-7xl` 整頁寬度 | 卡片容器整頁寬度（無內部限制） |

```vue
<!-- 統一的頁面結構 - 所有主頁面都適用 -->
<template>
  <div class="min-h-screen py-6 sm:py-8 lg:py-12">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- 頁面標題區塊 -->
      <div class="mb-6 sm:mb-8">
        <h1 class="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">
          頁面標題
        </h1>
        <p class="text-xs sm:text-sm lg:text-base text-gray-400">
          頁面描述
        </p>
      </div>

      <!-- 主內容直接放在外層 div 下 -->
      <!-- 卡片、列表、網格都在這裡，整頁寬度 -->
    </div>
  </div>
</template>
```

### 內間距
- 頁面垂直 padding：`py-6 sm:py-8 lg:py-12`（響應式）
- 水平 padding（透過外層 `px-4 sm:px-6 lg:px-8`）
- 頁面標題區塊：`mb-6 sm:mb-8`
- 卡片之間間距：使用 `mb-5 sm:mb-6` 或由父容器的 `gap` 控制

## 頁面標題

| 層級 | 樣式 | 適用 |
|------|------|------|
| H1（頁面標題） | `text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2` | 每個頁面頂部唯一標題 |
| H1 副標題 | `text-xs sm:text-sm lg:text-base text-gray-400` | 標題下方的簡短說明 |
| H2（區塊標題） | `text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4` | 卡片內的區塊標題 |
| H3（小組標題） | `text-sm font-medium text-white mb-2` | 表單組、小組件標題 |

## 文字顏色系統

| 用途 | 深色模式 | 淺色模式（待補） |
|------|---------|----------------|
| 主要文字（標題、重要內容） | `text-white` | - |
| 次要文字（一般段落） | `text-gray-300` | - |
| 輔助文字（提示、標籤） | `text-gray-400` | - |
| 次級輔助（更次要） | `text-gray-500` | - |
| 最次要（disabled 等） | `text-gray-600` | - |
| 強調色 | `text-amber-400` / `text-gold-400` | - |

## 卡片系統

### 標準卡片 `.card`
已在 `style.css` 中定義為全域元件類別：
- 背景：半透明白色玻璃（深色：`rgba(30,58,138,0.1)`）
- 邊框：`1px solid var(--border-light)`
- 圓角：`1rem`
- 內邊距：`1rem`（手機）→ `1.5rem`（桌面）
- 陰影：`0 8px 32px var(--shadow-medium)`
- hover：提升陰影 + 微上移 2px

### 覆蓋卡片預設 padding
```vue
<div class="card !py-3 !px-4 sm:!py-4 sm:!px-6">
```

## 按鈕系統

### 主要按鈕 `.btn-primary`
- 漸層金黃色背景
- `font-medium`、`rounded-xl`
- 預設尺寸：`px-6 py-3 sm:px-8 sm:py-3`

### 次要按鈕 `.btn-secondary`
- 半透明表面背景

### 文字按鈕（無背景）
```vue
<button class="text-sm text-gray-400 hover:text-white transition-colors">
```

### 小型危險按鈕
```vue
<button class="px-2 py-1 text-xs font-medium text-rose-400 hover:text-rose-300 border border-rose-800/50 rounded hover:bg-rose-900/20 transition-colors">
```

### 小型一般按鈕
```vue
<button class="px-3 py-1.5 text-sm text-gray-400 hover:text-white bg-gray-800/30 hover:bg-gray-800/60 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
```

## 表單元素

### 輸入框
```vue
<input
  class="w-full px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all"
/>
```

### 選擇框
```vue
<select
  class="px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all"
>
  <option class="bg-gray-800" value="">全部</option>
</select>
```

### 標籤
```vue
<label class="block text-sm font-medium text-white mb-1.5 sm:mb-2">
  姓名
</label>
```

### 表單組間距
- 手機：`space-y-3 sm:space-y-4`
- 表單上方說明文字：`text-xs sm:text-sm text-gray-500 mt-1`

## 列表/記錄

### 記錄卡片
```vue
<div class="card px-4 sm:px-6 py-3 sm:py-4 hover:bg-white/[0.02] transition-colors">
```

### 記錄行布局（手機版）
- 使用 `flex` 水平排列
- 日期簡短（`w-12 text-[11px] text-right`）
- 分數圓圈小（`w-7 h-7 text-[10px]`）
- 建議標籤小（`text-[10px] px-1.5`）
- 時間靠右（`text-[10px] ml-auto`）
- 備註行縮進對齊分數（`pl-[60px]`）

### 記錄行布局（桌面版 sm:）
- 日期正常寬度（`w-20 text-sm`）
- 分數圓圈（`w-9 h-9 text-xs`）
- 建議標籤（`text-xs px-2`）
- 五行能量條顯示
- 備註行縮進 `pl-[88px]`

## 無資料狀態
```vue
<div class="py-12 text-center text-gray-500">
  尚無歷史記錄
</div>
```

## 載入狀態
```vue
<div class="py-12 text-center text-gray-500">
  載入中...
</div>
```

## 分頁
```vue
<div class="flex items-center justify-between pt-2">
  <button class="px-3 py-1.5 text-sm text-gray-500 hover:text-white bg-gray-800/20 hover:bg-gray-800/50 rounded-lg disabled:opacity-25 disabled:cursor-not-allowed transition-all">
    ← 上一頁
  </button>
  <span class="text-sm text-gray-600">1 / 5</span>
  <button class="px-3 py-1.5 text-sm text-gray-500 hover:text-white bg-gray-800/20 hover:bg-gray-800/50 rounded-lg disabled:opacity-25 disabled:cursor-not-allowed transition-all">
    下一頁 →
  </button>
</div>
```

## 響應式中斷點策略

| 斷點 | 目標裝置 | 主要差異 |
|------|---------|---------|
| 預設（<640px） | iPhone SE / 小手機 | 最小、最緊湊 |
| `sm:`（640px+） | 一般手機橫放 ~ 小平板 | 開始放寬 |
| `md:`（768px+） | iPad / 小平板 | 中尺寸調整 |
| `lg:`（1024px+） | 桌面 | 完整佈局 |
| `xl:`（1280px+） | 寬螢幕 | 最大寬度限制 |

### 手機版（<640px）設計原則
- 不隱藏任何功能，只縮小尺寸
- 文字用 `text-xs` ~ `text-[11px]`，不用 `text-sm` 以下
- 分數圓圈用 `w-7 h-7`
- 內邊距統一 `px-3 py-2.5`
- 卡片容器 padding 用 `!py-2.5 !px-3`
- 日期簡短格式（`MM/DD`），不加週幾
- 時間顯示但可以不顯示五行條

## 表格 / 統計條
```vue
<div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm">
  <div class="flex items-center gap-1">...</div>
  <div class="flex items-center gap-1">
    <span class="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500" />
    <span class="text-gray-400">12</span>
  </div>
</div>
```
