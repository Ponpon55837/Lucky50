import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { useTheme } from '@/composables/useTheme'

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    document.documentElement.classList.remove('light', 'dark')
  })

  describe('initial state', () => {
    it('預設為 dark 主題', () => {
      const theme = useTheme()
      expect(theme.theme.value).toBe('dark')
    })

    it('isDark 與主題同步', () => {
      const theme = useTheme()
      expect(theme.isDark.value).toBe(true)
      expect(theme.isLight.value).toBe(false)
    })
  })

  describe('toggleTheme', () => {
    it('切換 dark/light', () => {
      const theme = useTheme()
      theme.toggleTheme()
      expect(theme.theme.value).toBe('light')
      expect(theme.isDark.value).toBe(false)
      expect(theme.isLight.value).toBe(true)
    })
  })

  describe('setTheme', () => {
    it('設定為 light', () => {
      const theme = useTheme()
      theme.setTheme('light')
      expect(theme.theme.value).toBe('light')
    })

    it('設定為 dark', () => {
      const theme = useTheme()
      theme.setTheme('light')
      theme.setTheme('dark')
      expect(theme.theme.value).toBe('dark')
    })
  })

  describe('localStorage', () => {
    it('切換時寫入 localStorage', async () => {
      const theme = useTheme()
      theme.setTheme('light')
      await nextTick()
      expect(localStorage.setItem).toHaveBeenLastCalledWith('lucky50-theme', 'light')
    })
  })

  describe('document class', () => {
    it('設定主題時更新 document class', () => {
      const theme = useTheme()
      theme.setTheme('light')
      expect(document.documentElement.classList.contains('light')).toBe(true)
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })
  })
})
