import { defineStore } from 'pinia'
import { computed, readonly, shallowRef } from 'vue'
import type { UserProfile } from '@/types'

// 本地存儲鍵常量
const STORAGE_KEY = 'userProfile'

export const useUserStore = defineStore('user', () => {
  // 使用 shallowRef 因為 profile 是一個扁平對象
  const profile = shallowRef<UserProfile | null>(null)
  
  // 緩存驗證結果
  const isProfileComplete = computed(() => {
    const p = profile.value
    return !!(p?.name && p?.birthDate && p?.birthTime)
  })

  // 計算用戶基本信息
  const userBasicInfo = computed(() => {
    if (!profile.value) return null
    
    return {
      name: profile.value.name,
      zodiac: profile.value.zodiac,
      element: profile.value.element,
      hasLuckyNumbers: profile.value.luckyNumbers.length > 0,
      hasLuckyColors: profile.value.luckyColors.length > 0
    }
  })

  // 批量驗證用戶數據
  const validateProfile = (userProfile: UserProfile): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []
    
    if (!userProfile.name?.trim()) errors.push('姓名不能為空')
    if (!userProfile.birthDate) errors.push('出生日期不能為空')
    if (!userProfile.birthTime) errors.push('出生時間不能為空')
    
    const birthDate = new Date(userProfile.birthDate)
    const now = new Date()
    if (birthDate > now) errors.push('出生日期不能是未來時間')
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // 優化的存儲方法
  const setProfile = (userProfile: UserProfile) => {
    const validation = validateProfile(userProfile)
    if (!validation.isValid) {
      console.error('Profile validation failed:', validation.errors)
      throw new Error(`用戶資料驗證失敗: ${validation.errors.join(', ')}`)
    }

    // 使用深拷貝避免外部修改
    const profileCopy = {
      ...userProfile,
      luckyColors: Object.freeze([...userProfile.luckyColors]),
      luckyNumbers: Object.freeze([...userProfile.luckyNumbers])
    } as const

    profile.value = profileCopy as any
    
    // 異步存儲到 localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profileCopy))
    } catch (error) {
      console.error('Failed to save profile to localStorage:', error)
    }
  }

  // 優化的加載方法
  const loadProfile = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (!saved) return false

      const parsedProfile = JSON.parse(saved)
      const validation = validateProfile(parsedProfile)
      
      if (validation.isValid) {
        profile.value = parsedProfile
        return true
      } else {
        console.warn('Stored profile is invalid:', validation.errors)
        clearProfile()
        return false
      }
    } catch (error) {
      console.error('Failed to load profile from localStorage:', error)
      clearProfile()
      return false
    }
  }

  // 安全的清除方法
  const clearProfile = () => {
    profile.value = null
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('Failed to remove profile from localStorage:', error)
    }
  }

  // 更新部分資料
  const updateProfile = (updates: Partial<UserProfile>) => {
    if (!profile.value) {
      throw new Error('無法更新：用戶資料不存在')
    }

    const updatedProfile = { ...profile.value, ...updates }
    setProfile(updatedProfile)
  }

  // 獲取存儲統計
  const getStorageInfo = () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      return {
        hasData: !!data,
        dataSize: data ? data.length : 0,
        lastModified: profile.value ? new Date().toISOString() : null
      }
    } catch {
      return { hasData: false, dataSize: 0, lastModified: null }
    }
  }

  return {
    // State (readonly 防止外部直接修改)
    profile: readonly(profile),
    
    // Computed
    isProfileComplete,
    userBasicInfo,
    
    // Actions
    setProfile,
    loadProfile,
    clearProfile,
    updateProfile,
    validateProfile,
    getStorageInfo
  }
})