import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/Home.vue'),
      meta: { 
        title: '首頁 - 農民曆智慧投資',
        description: '結合傳統農民曆智慧與現代金融科技的投資建議系統'
      }
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/Dashboard.vue'),
      meta: { 
        title: '投資儀表板 - 農民曆智慧投資',
        description: '即時投資數據分析與個人化建議'
      }
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/views/Profile.vue'),
      meta: { 
        title: '個人設定 - 農民曆智慧投資',
        description: '設定個人資料以獲得精準的投資建議'
      }
    },
    {
      path: '/analytics',
      name: 'analytics',
      component: () => import('@/views/Analytics.vue'),
      meta: { 
        title: '數據分析 - 農民曆智慧投資',
        description: '深度分析市場數據與投資趨勢'
      }
    },
    {
      path: '/history',
      name: 'history',
      component: () => import('@/views/History.vue'),
      meta: { 
        title: '運勢歷史記錄 - 農民曆智慧投資',
        description: '瀏覽所有已計算的運勢結果'
      }
    },
    {
      path: '/dev/perf',
      name: 'perf-monitor',
      component: () => import('@/views/dev/PerformanceMonitor.vue'),
      meta: { 
        title: '效能監控 - 農民曆智慧投資',
        description: '開發者效能監控面板'
      }
    },
    {
      path: '/dev/api',
      name: 'api-monitor',
      component: () => import('@/views/dev/ApiMonitor.vue'),
      meta: { 
        title: 'API 監控 - 農民曆智慧投資',
        description: '開發者 API 監控面板'
      }
    }
  ]
})

// 路由守衛 - 更新頁面標題和 meta 標籤
router.beforeEach((to) => {
  // 更新頁面標題
  document.title = (to.meta.title as string) || '農民曆智慧投資'
  
  // 更新 meta description
  const metaDescription = document.querySelector('meta[name="description"]')
  if (metaDescription && to.meta.description) {
    metaDescription.setAttribute('content', to.meta.description as string)
  }
})

export default router