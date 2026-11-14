import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { PiniaColada } from '@pinia/colada'
import router from './router'
import App from './App.vue'
import './assets/style.css'
import { registerSW } from 'virtual:pwa-register'
import { useTheme } from './composables/useTheme'

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

// 初始化主題（模組載入時即套用 document class）
useTheme()

// Service worker 由 vite-plugin-pwa 產生；有新版時立即接手並重新載入，使用者不會停在舊版
registerSW({ immediate: true })

app.mount('#app')
