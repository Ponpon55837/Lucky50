import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './assets/style.css'
import { useTheme } from './composables/useTheme'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// 初始化主題
const { theme } = useTheme()
if (typeof document !== 'undefined') {
  document.documentElement.classList.add(theme.value)
}

app.mount('#app')