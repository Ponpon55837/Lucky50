import { defineStore } from 'pinia'
import { computed, shallowRef } from 'vue'
import type { UserProfile } from '@/types'

export const useUserStore = defineStore(
  'user',
  () => {
    const profile = shallowRef<UserProfile>({
      surname: '',
      givenName: '',
      name: '',
      birthDate: '',
      birthTime: '',
      zodiac: '',
      element: '',
      nameElement: '',
      nameStrokes: 0,
      luckyColors: [],
      luckyNumbers: [],
    })

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
        surname: '',
        givenName: '',
        name: '',
        birthDate: '',
        birthTime: '',
        zodiac: '',
        element: '',
        nameElement: '',
        nameStrokes: 0,
        luckyColors: [],
        luckyNumbers: [],
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
            profile.value = { ...parsed.profile }
          }
          // 也檢查是否直接儲存在根層級（針對pinia-plugin-persistedstate的不同版本）
          else if (parsed && parsed.name && !profile.value.name) {
            profile.value = { ...parsed }
          }
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.error('UserStore - 從localStorage恢復失敗:', errorMessage)
      }
    }

    /**
     * 生肖、本命五行與姓名學五行一律由出生日期與姓名推算。
     * 舊版以西元年估算生肖、以碼點估算筆畫，存下來的資料在此校正。
     * 命盤與筆畫表以動態載入，避免進入主要 chunk。
     */
    const syncDerivedFields = async () => {
      const { birthDate, name } = profile.value
      if (!birthDate) return
      try {
        const [{ deriveBirthProfile }, { getElementFromName }] = await Promise.all([
          import('@/services/engines/birthChart'),
          import('@/utils/nameStrokes'),
        ])
        const birth = deriveBirthProfile(birthDate)
        const nameResult = getElementFromName(name)
        const current = profile.value
        // 等待載入期間資料若已被改動，交給下一次同步
        if (current.birthDate !== birthDate || current.name !== name) return
        const stale =
          current.zodiac !== birth.zodiac ||
          current.element !== birth.element ||
          current.nameElement !== nameResult.element ||
          current.nameStrokes !== nameResult.totalStrokes
        if (stale) {
          profile.value = {
            ...current,
            ...birth,
            nameElement: nameResult.element,
            nameStrokes: nameResult.totalStrokes,
          }
        }
      } catch (error) {
        console.warn('UserStore - 無法由出生資料推算生肖與五行:', error)
      }
    }

    initializeFromStorage()
    void syncDerivedFields()

    return {
      profile,
      isProfileComplete,
      userBasicInfo,
      setProfile,
      clearProfile,
      updateProfile,
      validateProfile,
      initializeFromStorage,
      syncDerivedFields,
    }
  },
  {
    persist: {
      key: 'lucky50-user',
      storage: localStorage,
      afterHydrate: ({ store }) => {
        void store.syncDerivedFields()
      },
      serializer: {
        serialize: JSON.stringify,
        deserialize: JSON.parse,
      },
    },
  }
)
