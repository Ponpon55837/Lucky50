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
    }
  ]
})

// 路由守衛 - 更新頁面標題和 meta 標籤
router.beforeEach((to, _from, next) => {
  // 更新頁面標題
  document.title = (to.meta.title as string) || '農民曆智慧投資'
  
  // 更新 meta description
  const metaDescription = document.querySelector('meta[name="description"]')
  if (metaDescription && to.meta.description) {
    metaDescription.setAttribute('content', to.meta.description as string)
  }
  
  next()
})

export default router