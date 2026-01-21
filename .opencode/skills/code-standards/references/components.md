# Vue 組件開發規範

## 🎯 組件架構

### 基本結構

```vue
<script setup lang="ts">
// 1. Imports
import { ref, computed, onMounted } from 'vue'
import type { ComponentProps } from '@/types'

// 2. Props 定義
interface Props {
  title: string
  count?: number
  loading?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  count: 0,
  loading: false,
  disabled: false,
})

// 3. Emits 定義
interface Emits {
  update: [value: number]
  click: [event: MouseEvent]
  change: [item: any]
}

const emit = defineEmits<Emits>()

// 4. 響應式狀態
const internalState = ref('initial')

// 5. 計算屬性
const computedValue = computed(() => {
  return props.count * 2
})

// 6. 方法
const handleClick = (event: MouseEvent) => {
  emit('click', event)
  emit('update', props.count + 1)
}

// 7. 生命週期
onMounted(() => {
  // 初始化邏輯
})
</script>

<template>
  <div class="component-wrapper">
    <h2 class="component-title">{{ title }}</h2>
    <p class="component-count">Count: {{ count }}</p>
    <button @click="handleClick" :disabled="disabled || loading" class="component-button">
      <span v-if="loading">Loading...</span>
      <span v-else>Increment</span>
    </button>
  </div>
</template>

<style scoped>
.component-wrapper {
  @apply p-4 border rounded-lg bg-white shadow-sm;
}

.component-title {
  @apply text-lg font-semibold mb-2;
}

.component-count {
  @apply text-gray-600 mb-3;
}

.component-button {
  @apply px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 transition-colors;
}
</style>
```

## 📋 命名規範

### 檔案命名

- **PascalCase**: `UserProfile.vue`, `DataTable.vue`
- **描述性**: 檔名應清楚描述組件功能
- **一致性**: 同類型組件使用相同命名模式

### 組件命名

```vue
<script setup lang="ts">
// 使用 defineOptions 設定組件名稱
defineOptions({
  name: 'UserProfileCard',
})
</script>
```

## 🎯 Props 最佳實踐

### 類型定義

```typescript
// 基礎類型
interface BaseProps {
  id?: string
  class?: string
  loading?: boolean
}

// 複雜類型
interface UserListProps extends BaseProps {
  users: User[]
  maxItems?: number
  showActions?: boolean
  onUserSelect?: (user: User) => void
}
```

### Props 驗證

```vue
<script setup lang="ts">
const props = defineProps<{
  age: number
  email: string
  status: 'active' | 'inactive' | 'pending'
}>()

// 客戶端驗證
const isValidEmail = computed(() => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(props.email)
})

const isValidAge = computed(() => {
  return props.age >= 0 && props.age <= 150
})

// 錯誤處理
if (!isValidEmail.value) {
  console.warn('Invalid email format:', props.email)
}
</script>
```

## 🎨 Slots 使用

### 預設 Slot

```vue
<template>
  <div class="card">
    <header class="card-header">
      <slot name="header">
        <h3>Default Title</h3>
      </slot>
    </header>

    <main class="card-body">
      <slot>Default content</slot>
    </main>

    <footer class="card-footer">
      <slot name="footer">
        <button>Default Action</button>
      </slot>
    </footer>
  </div>
</template>
```

### 動態 Slots

```vue
<script setup lang="ts">
interface Slots {
  default: (props: { item: any; index: number }) => any
  empty?: () => any
  loading?: () => any
}

const slots = defineSlots<Slots>()
</script>

<template>
  <div class="list-container">
    <div v-if="loading && slots.loading">
      <slot name="loading" />
    </div>

    <div v-else-if="items.length === 0 && slots.empty">
      <slot name="empty" />
    </div>

    <div v-else>
      <div v-for="(item, index) in items" :key="item.id" class="list-item">
        <slot :item="item" :index="index" />
      </div>
    </div>
  </div>
</template>
```

## 🎯 事件處理

### Emits 定義

```typescript
interface Emits {
  // 基本事件
  click: [event: MouseEvent]
  change: [value: any]

  // 自定義事件
  'user-selected': [user: User, action: string]
  'item-updated': [id: string, changes: Partial<User>]

  // 響應式更新
  'update:modelValue': [value: string]
}

const emit = defineEmits<Emits>()
```

### 事件處理器

```vue
<script setup lang="ts">
// 節流處理
const handleScroll = useThrottle((event: Event) => {
  emit('scroll', event)
}, 100)

// 防抖處理
const handleSearch = useDebounce((query: string) => {
  emit('search', query)
}, 300)

// 鍵盤事件
const handleKeydown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'Enter':
      emit('submit')
      break
    case 'Escape':
      emit('cancel')
      break
  }
}
</script>
```

## 🎯 Lucky50 專案特化

### 農民曆組件

```vue
<script setup lang="ts">
import { useLunarCalendar } from '@/composables/useLunarCalendar'
import { useFormat } from '@/composables/useFormat'

const { currentDate, lunarInfo, auspiciousInfo } = useLunarCalendar()
const { formatDate } = useFormat()

// 農民曆特定 Props
interface Props {
  showAuspicious?: boolean
  showLunarDate?: boolean
  date?: Date
}

const props = withDefaults(defineProps<Props>(), {
  showAuspicious: true,
  showLunarDate: true,
  date: () => new Date(),
})

// 計算屬性
const displayDate = computed(() => {
  return props.date ? formatDate(props.date, 'zh-TW') : formatDate(currentDate.value, 'zh-TW')
})

const isAuspicious = computed(() => {
  return auspiciousInfo.value?.overallAuspicious ?? false
})
</script>

<template>
  <div class="lunar-calendar-card">
    <div class="solar-date">
      <h3 class="date-title">西元日期</h3>
      <p class="date-value">{{ displayDate }}</p>
    </div>

    <div v-if="showLunarDate" class="lunar-date">
      <h3 class="date-title">農曆日期</h3>
      <p class="date-value">{{ lunarInfo?.lunarDate }}</p>
    </div>

    <div v-if="showAuspicious" class="auspicious-info">
      <div class="auspicious-badge" :class="{ good: isAuspicious }">
        {{ isAuspicious ? '吉' : '平' }}
      </div>
      <div class="auspicious-details">
        <p>宜：{{ auspiciousInfo?.suitable?.join('、') }}</p>
        <p>忌：{{ auspiciousInfo?.unsuitable?.join('、') }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lunar-calendar-card {
  @apply bg-gradient-to-br from-red-50 to-amber-50 p-6 rounded-xl border border-red-200;
}

.date-title {
  @apply text-sm font-medium text-gray-600 mb-1;
}

.date-value {
  @apply text-lg font-semibold text-gray-900 mb-4;
}

.auspicious-badge {
  @apply w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold;

  &.good {
    @apply bg-green-500 text-white;
  }

  &:not(.good) {
    @apply bg-gray-400 text-white;
  }
}

.auspicious-details {
  @apply mt-3 text-sm;

  p {
    @apply mb-1;
  }
}
</style>
```

### 投資圖表組件

```vue
<script setup lang="ts">
import { useInvestmentAnalysis } from '@/composables/useInvestmentAnalysis'
import { Line, Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

// 註冊 Chart.js 元件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface Props {
  symbol: string
  chartType?: 'line' | 'bar'
  period?: '1D' | '1W' | '1M' | '3M' | '1Y'
  showVolume?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  chartType: 'line',
  period: '1M',
  showVolume: false,
})

const { stockData, technicalIndicators, fetchStockData } = useInvestmentAnalysis()

// Chart.js 配置
const chartData = computed(() => ({
  labels: stockData.value.map(item => item.date),
  datasets: [
    {
      label: '股價',
      data: stockData.value.map(item => item.price),
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.1,
    },
  ],
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
    },
    title: {
      display: true,
      text: `${props.symbol} - ${props.period}`,
    },
  },
  scales: {
    y: {
      beginAtZero: false,
    },
  },
}))

// 監聽 symbol 變化
watch(
  () => props.symbol,
  newSymbol => {
    if (newSymbol) {
      fetchStockData(newSymbol)
    }
  },
  { immediate: true }
)
</script>

<template>
  <div class="investment-chart">
    <div class="chart-header">
      <h2 class="chart-title">{{ symbol }} 投資分析</h2>
      <div class="chart-controls">
        <select v-model="chartType" class="chart-type-select">
          <option value="line">折線圖</option>
          <option value="bar">柱狀圖</option>
        </select>
        <select v-model="period" class="period-select">
          <option value="1D">1天</option>
          <option value="1W">1週</option>
          <option value="1M">1月</option>
          <option value="3M">3月</option>
          <option value="1Y">1年</option>
        </select>
      </div>
    </div>

    <div class="chart-container">
      <Line v-if="chartType === 'line'" :data="chartData" :options="chartOptions" />
      <Bar v-else :data="chartData" :options="chartOptions" />
    </div>

    <div class="chart-footer">
      <div class="price-info">
        <span class="current-price">最新價格: {{ stockData[0]?.price }}</span>
        <span
          class="price-change"
          :class="{ positive: priceChange > 0, negative: priceChange < 0 }"
        >
          {{ priceChange > 0 ? '+' : '' }}{{ priceChange.toFixed(2) }}%
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.investment-chart {
  @apply bg-white p-6 rounded-lg shadow-sm border;
}

.chart-header {
  @apply flex justify-between items-center mb-4;
}

.chart-title {
  @apply text-xl font-semibold text-gray-900;
}

.chart-controls {
  @apply flex gap-2;
}

.chart-type-select,
.period-select {
  @apply px-3 py-1 border border-gray-300 rounded-md text-sm;
}

.chart-container {
  @apply h-64 mb-4;
}

.price-info {
  @apply flex justify-between items-center text-sm;
}

.current-price {
  @apply font-medium text-gray-900;
}

.price-change {
  @apply font-medium;

  &.positive {
    @apply text-green-600;
  }

  &.negative {
    @apply text-red-600;
  }
}
</style>
```

## 📋 測試規範

### 單元測試

```typescript
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import UserProfile from '@/components/UserProfile.vue'

describe('UserProfile', () => {
  it('應該正確渲染使用者資訊', () => {
    const user = {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
    }

    const wrapper = mount(UserProfile, {
      props: { user },
    })

    expect(wrapper.text()).toContain(user.name)
    expect(wrapper.text()).toContain(user.email)
  })

  it('應該在點擊時觸發 update 事件', async () => {
    const wrapper = mount(UserProfile)
    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted()).toHaveProperty('update')
  })
})
```

### 組件測試

```typescript
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

describe('LunarCalendar', () => {
  it('應該顯示農曆資訊', async () => {
    const wrapper = mount(LunarCalendar, {
      props: {
        date: new Date('2024-01-01'),
      },
    })

    await nextTick()

    expect(wrapper.find('.lunar-date').exists()).toBe(true)
    expect(wrapper.text()).toContain('農曆日期')
  })
})
```

---

## 📋 最佳實踐總結

1. **使用 TypeScript**：所有組件都應該有完整的類型定義
2. **Composition API**：優先使用 `<script setup>` 語法
3. **響應式設計**：使用 Tailwind CSS 實現響應式佈局
4. **錯誤處理**：適當處理邊界情況和錯誤狀態
5. **測試覆蓋**：關鍵組件應該有對應的測試
6. **繁體中文**：所有使用者介面文字使用繁體中文
7. **Lucky50 特化**：符合農民曆和投資分析的業務需求
