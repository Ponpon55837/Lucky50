# 開發文檔

## 系統架構圖

```
┌─────────────────────────────────────────────────────────────┐
│                    前端 (Vue 3 + TypeScript)                  │
├─────────────────────────────────────────────────────────────┤
│  視圖層 (Views)                                              │
│  ├─ Home.vue (首頁)                                         │
│  ├─ Dashboard.vue (投資儀表板)                               │
│  ├─ Profile.vue (個人設定)                                   │
│  └─ Analytics.vue (數據分析)                                 │
├─────────────────────────────────────────────────────────────┤
│  組件層 (Components)                                         │
│  ├─ FortuneOrb.vue (3D 運勢球體)                            │
│  ├─ NavBar.vue (導航欄)                                     │
│  └─ Footer.vue (頁腳)                                       │
├─────────────────────────────────────────────────────────────┤
│  狀態管理 (Pinia Stores)                                     │
│  ├─ useUserStore (用戶資料)                                  │
│  └─ useInvestmentStore (投資數據)                            │
├─────────────────────────────────────────────────────────────┤
│  服務層 (Services)                                          │
│  ├─ FinMindService (金融數據 API)                            │
│  └─ FortuneService (運勢計算)                                │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    外部 API 服務                             │
│  ├─ FinMind API (台灣股市數據)                               │
│  └─ Lunar Calendar API (農民曆數據)                          │
└─────────────────────────────────────────────────────────────┘
```

## 核心功能實現

### 1. 運勢計算算法

```typescript
// FortuneService.ts
class FortuneService {
  // 基於生辰八字和農民曆計算運勢
  static calculateDailyFortune(profile: UserProfile, date: Date): FortuneData {
    // 1. 獲取農民曆信息
    const lunar = Solar.fromDate(date).getLunar()

    // 2. 計算五行能量
    const elements = this.calculateElements(lunar, profile)

    // 3. 生成投資建議
    const recommendation = this.generateRecommendation(elements)

    return {
      /* 運勢數據 */
    }
  }
}
```

### 2. 3D 運勢球體

```typescript
// FortuneOrb.vue
const createFortuneSphere = () => {
  // 使用 Three.js 創建 3D 球體
  const geometry = new THREE.SphereGeometry(2, 32, 32)
  const material = new THREE.MeshPhongMaterial({
    color: getFortuneColor(props.fortuneScore),
  })

  // 添加五行粒子效果
  addElementParticles()
}
```

### 3. 金融數據整合

```typescript
// FinMindService.ts
export class FinMindService {
  // 獲取 0050 ETF 數據
  static async getETFData(startDate: string, endDate: string): Promise<ETFData[]> {
    const response = await finmindAPI.get('/data', {
      params: {
        dataset: 'TaiwanStockDaily',
        data_id: '0050',
        start_date: startDate,
        end_date: endDate,
      },
    })

    return response.data.data.map(/* 數據轉換 */)
  }
}
```

## 狀態管理架構

### 用戶狀態 (useUserStore)

```typescript
interface UserProfile {
  name: string
  birthDate: string
  birthTime: string
  zodiac: string
  element: string
  luckyColors: string[]
  luckyNumbers: number[]
}
```

### 投資狀態 (useInvestmentStore)

```typescript
interface InvestmentState {
  etfData: ETFData[]
  currentFortune: FortuneData | null
  recommendation: InvestmentRecommendation | null
  loading: boolean
  error: string | null
}
```

## API 集成說明

### FinMind API 端點

- **台灣股市日資料**: `/data?dataset=TaiwanStockDaily`
- **技術指標**: `/data?dataset=TaiwanStockStatistics`
- **即時報價**: `/data?dataset=TaiwanStockPrice`

### 請求格式

```typescript
const params = {
  dataset: 'TaiwanStockDaily',
  data_id: '0050',
  start_date: '2024-01-01',
  end_date: '2024-12-31',
}
```

## 組件設計模式

### 1. 組合式 API (Composition API)

```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

// 響應式數據
const data = ref<DataType>()

// 計算屬性
const processedData = computed(() => {
  return processData(data.value)
})

// 生命週期
onMounted(() => {
  loadData()
})
</script>
```

### 2. Props 和 Emits

```vue
<script setup lang="ts">
interface Props {
  fortuneScore?: number
  elements?: ElementsData
}

const props = withDefaults(defineProps<Props>(), {
  fortuneScore: 50,
})

const emit = defineEmits<{
  update: [value: string]
}>()
</script>
```

## 樣式系統

### TailwindCSS 客製化

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        gold: {
          400: '#facc15',
          500: '#f59e0b',
        },
      },
      animation: {
        'fortune-glow': 'fortune-glow 2s ease-in-out infinite',
      },
    },
  },
}
```

### CSS 變數和混合

```scss
@layer components {
  .card {
    @apply bg-white/10 backdrop-blur-md rounded-xl p-6;
  }

  .fortune-orb {
    @apply animate-fortune-glow shadow-2xl;
  }
}
```

## 性能優化建議

### 1. 懶加載

- 使用 `defineAsyncComponent` for 大型組件
- 路由懶加載

### 2. 狀態管理

- 合理使用 Pinia 的 `$subscribe`
- 避免不必要的響應式數據

### 3. API 請求優化

- 實施請求緩存
- 使用防抖和節流

## 部署配置

### 環境變數

```bash
# 開發環境
VITE_APP_ENV=development
VITE_API_BASE_URL=http://localhost:3001

# 生產環境
VITE_APP_ENV=production
VITE_API_BASE_URL=https://api.yourdomain.com
```

### 建置優化

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
          charts: ['chart.js', 'vue-chartjs'],
          three: ['three'],
        },
      },
    },
  },
})
```

## 測試策略

### 單元測試

```typescript
// 使用 Vitest
describe('FortuneService', () => {
  test('should calculate fortune score correctly', () => {
    const result = FortuneService.calculateDailyFortune(mockProfile, new Date())
    expect(result.investmentScore).toBeGreaterThan(0)
  })
})
```

### E2E 測試

```typescript
// 使用 Cypress
describe('Investment Dashboard', () => {
  it('should display fortune data after profile setup', () => {
    cy.visit('/profile')
    cy.fillProfileForm()
    cy.visit('/dashboard')
    cy.get('[data-cy=fortune-score]').should('be.visible')
  })
})
```

## 安全考慮

1. **API 密鑰管理**: 使用環境變數存儲敏感信息
2. **輸入驗證**: 客戶端和伺服器端雙重驗證
3. **XSS 防護**: Vue 3 內建 XSS 防護
4. **CORS 配置**: 正確設定跨域政策

## 貢獻指南

1. Fork 專案
2. 創建功能分支: `git checkout -b feature/new-feature`
3. 提交變更: `git commit -am 'Add new feature'`
4. 推送分支: `git push origin feature/new-feature`
5. 提交 Pull Request

---

**維護者**: 開發團隊
**文檔版本**: 1.0
**最後更新**: 2024年9月
