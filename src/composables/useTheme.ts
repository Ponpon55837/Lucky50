import { ref, computed, watch, readonly } from 'vue'

export type Theme = 'light' | 'dark'

const THEME_KEY = 'lucky50-theme'

// 全域主題狀態
const theme = ref<Theme>((localStorage.getItem(THEME_KEY) as Theme) || 'dark')

/** 套用主題：document class、localStorage 與瀏覽器網址列顏色（取自 --c-paper token） */
const applyTheme = (value: Theme) => {
  localStorage.setItem(THEME_KEY, value)
  if (typeof document === 'undefined') return

  const root = document.documentElement
  root.classList.remove('light', 'dark')
  root.classList.add(value)

  const paper = getComputedStyle(root).getPropertyValue('--c-paper').trim()
  if (paper) {
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', `rgb(${paper})`)
  }
}

// 監聽只註冊一次（模組層級），不論有幾個元件呼叫 useTheme
watch(theme, applyTheme, { immediate: true, flush: 'sync' })

export const useTheme = () => {
  const isDark = computed(() => theme.value === 'dark')
  const isLight = computed(() => theme.value === 'light')

  const toggleTheme = () => {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  const setTheme = (newTheme: Theme) => {
    theme.value = newTheme
  }

  return {
    theme: readonly(theme),
    isDark,
    isLight,
    toggleTheme,
    setTheme,
  }
}
