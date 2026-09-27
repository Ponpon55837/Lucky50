import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { PiniaColada } from '@pinia/colada'
import router from './router'
import App from './App.vue'
import './assets/style.css'
import { useTheme } from './composables/useTheme'
import './utils/preloader' // 初始化資源預載入

const app = createApp(App)

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

app.use(pinia)
// Pinia Colada 必須在 pinia 之後安裝；查詢預設不因視窗聚焦重抓（行情 10 分鐘更新已足夠）
app.use(PiniaColada, {
  queryOptions: {
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  },
})
app.use(router)

// 初始化主題
const { theme } = useTheme()
if (typeof document !== 'undefined') {
  document.documentElement.classList.add(theme.value)
}

// 註冊 Service Worker
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(registration => {
        console.log('SW registered: ', registration)
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError)
      })
  })
}

app.mount('#app')
