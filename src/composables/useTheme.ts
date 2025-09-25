import { ref, computed, watch, readonly } from 'vue'

export type Theme = 'light' | 'dark'

const THEME_KEY = 'lucky50-theme'

// 全域主題狀態
const theme = ref<Theme>((localStorage.getItem(THEME_KEY) as Theme) || 'dark')

export const useTheme = () => {
  const isDark = computed(() => theme.value === 'dark')
  const isLight = computed(() => theme.value === 'light')

  const toggleTheme = () => {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  const setTheme = (newTheme: Theme) => {
    theme.value = newTheme
  }

  // 監聽主題變化，更新 localStorage 和 document 類別
  watch(
    theme,
    (newTheme) => {
      localStorage.setItem(THEME_KEY, newTheme)
      
      // 更新 document 的 class
      if (typeof document !== 'undefined') {
        document.documentElement.classList.remove('light', 'dark')
        document.documentElement.classList.add(newTheme)
        
        // 更新 meta theme-color
        const metaTheme = document.querySelector('meta[name="theme-color"]')
        if (metaTheme) {
          metaTheme.setAttribute('content', newTheme === 'dark' ? '#1e3a8a' : '#ffffff')
        }
      }
    },
    { immediate: true }
  )

  return {
    theme: readonly(theme),
    isDark,
    isLight,
    toggleTheme,
    setTheme
  }
}