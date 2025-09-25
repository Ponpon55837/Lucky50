import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import Dashboard from '@/views/Dashboard.vue'
import Profile from '@/views/Profile.vue'
import Analytics from '@/views/Analytics.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
      meta: { title: '首頁 - 農民曆智慧投資' }
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: Dashboard,
      meta: { title: '投資儀表板 - 農民曆智慧投資' }
    },
    {
      path: '/profile',
      name: 'profile',
      component: Profile,
      meta: { title: '個人設定 - 農民曆智慧投資' }
    },
    {
      path: '/analytics',
      name: 'analytics',
      component: Analytics,
      meta: { title: '數據分析 - 農民曆智慧投資' }
    }
  ]
})

// 路由守衛 - 更新頁面標題
router.beforeEach((to, from, next) => {
  document.title = (to.meta.title as string) || '農民曆智慧投資'
  next()
})

export default router