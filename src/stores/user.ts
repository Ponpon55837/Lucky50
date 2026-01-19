import { defineStore } from 'pinia'
import { computed, shallowRef, watch } from 'vue'
import type { UserProfile } from '@/types'

export const useUserStore = defineStore(
  'user',
  () => {
    const profile = shallowRef<UserProfile>({
      name: '',
      birthDate: '',
      birthTime: '',
      zodiac: '',
      element: '',
      luckyNumbers: [],
      luckyColors: [],
    })

    watch(
      () => profile.value,
      (newValue, oldValue) => {
        console.log('UserStore - profile 狀態變化:', {
          old: oldValue,
          new: newValue,
          timestamp: new Date().toLocaleTimeString(),
        })
      },
      { immediate: true, deep: true }
    )

    const isProfileComplete = computed(() => {
      const p = profile.value
      return !!(p?.name && p?.birthDate && p?.birthTime)
    })

    const userBasicInfo = computed(() => {
      if (!profile.value) return null

      return {
        name: profile.value.name,
        zodiac: profile.value.zodiac,
        element: profile.value.element,
        hasLuckyNumbers: profile.value.luckyNumbers.length > 0,
        hasLuckyColors: profile.value.luckyColors.length > 0,
      }
    })

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
        errors,
      }
    }

    const setProfile = (userProfile: UserProfile) => {
      const validation = validateProfile(userProfile)
      if (!validation.isValid) {
        console.error('Profile validation failed:', validation.errors)
        throw new Error(`用戶資料驗證失敗: ${validation.errors.join(', ')}`)
      }

      profile.value = {
        ...userProfile,
        luckyColors: [...userProfile.luckyColors],
        luckyNumbers: [...userProfile.luckyNumbers],
      }
    }

    const clearProfile = () => {
      profile.value = {
        name: '',
        birthDate: '',
        birthTime: '',
        zodiac: '',
        element: '',
        luckyNumbers: [],
        luckyColors: [],
      }
    }

    const updateProfile = (updates: Partial<UserProfile>) => {
      if (!profile.value.name && !updates.name) {
        throw new Error('無法更新：用戶資料不存在')
      }

      const updatedProfile = { ...profile.value, ...updates }
      setProfile(updatedProfile)
    }

    const initializeFromStorage = () => {
      try {
        const storedData = localStorage.getItem('userProfile')

        if (storedData) {
          const parsed = JSON.parse(storedData)

          // 檢查是否有profile資料且當前store為空
          if (parsed && parsed.profile && parsed.profile.name && !profile.value.name) {
            console.log('UserStore - 手動恢復profile資料:', parsed.profile)
            profile.value = { ...parsed.profile }
          }
          // 也檢查是否直接儲存在根層級（針對pinia-plugin-persistedstate的不同版本）
          else if (parsed && parsed.name && !profile.value.name) {
            console.log('UserStore - 從根層級恢復profile資料:', parsed)
            profile.value = { ...parsed }
          }
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.error('UserStore - 從localStorage恢復失敗:', errorMessage)
      }
    }

    initializeFromStorage()

    return {
      profile,
      isProfileComplete,
      userBasicInfo,
      setProfile,
      clearProfile,
      updateProfile,
      validateProfile,
      initializeFromStorage,
    }
  },
  {
    persist: {
      key: 'lucky50-user',
      storage: localStorage,
      serializer: {
        serialize: JSON.stringify,
        deserialize: JSON.parse,
      },
    },
  }
)
