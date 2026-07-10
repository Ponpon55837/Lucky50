import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '@/stores/user'
import type { UserProfile } from '@/types'

const validProfile: UserProfile = {
  name: '測試用戶',
  birthDate: '1990-01-01',
  birthTime: '10:30',
  zodiac: '鼠',
  element: '金',
  luckyColors: ['金色', '白色'],
  luckyNumbers: [1, 6],
}

describe('useUserStore', () => {
  let store: ReturnType<typeof useUserStore>

  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    setActivePinia(createPinia())
    store = useUserStore()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('initial state', () => {
    it('profile 有預設空值', () => {
      expect(store.profile.name).toBe('')
      expect(store.profile.birthDate).toBe('')
      expect(store.profile.birthTime).toBe('')
    })

    it('isProfileComplete 初始為 false', () => {
      expect(store.isProfileComplete).toBe(false)
    })

    it('userBasicInfo 初始為空資訊物件', () => {
      const info = store.userBasicInfo
      expect(info).not.toBeNull()
      expect(info!.name).toBe('')
      expect(info!.zodiac).toBe('')
    })
  })

  describe('validateProfile', () => {
    it('完整資料通過驗證', () => {
      const result = store.validateProfile(validProfile)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('空姓名產生錯誤', () => {
      const result = store.validateProfile({ ...validProfile, name: '' })
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('姓名不能為空')
    })

    it('空出生日期產生錯誤', () => {
      const result = store.validateProfile({ ...validProfile, birthDate: '' })
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('出生日期不能為空')
    })

    it('未來出生日期產生錯誤', () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)
      const result = store.validateProfile({
        ...validProfile,
        birthDate: futureDate.toISOString().split('T')[0],
      })
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('出生日期不能是未來時間')
    })
  })

  describe('setProfile', () => {
    it('設定完整資料', () => {
      store.setProfile(validProfile)
      expect(store.profile.name).toBe('測試用戶')
      expect(store.isProfileComplete).toBe(true)
    })

    it('無效資料拋出錯誤', () => {
      expect(() => store.setProfile({ ...validProfile, name: '' })).toThrow('用戶資料驗證失敗')
    })
  })

  describe('updateProfile', () => {
    it('部份更新', () => {
      store.setProfile(validProfile)
      store.updateProfile({ name: '更新用戶', zodiac: '牛' })
      expect(store.profile.name).toBe('更新用戶')
      expect(store.profile.zodiac).toBe('牛')
    })

    it('未設定時更新拋出驗證錯誤', () => {
      expect(() => store.updateProfile({ name: '新用戶' })).toThrow('用戶資料驗證失敗')
    })
  })

  describe('clearProfile', () => {
    it('清除後回歸預設值', () => {
      store.setProfile(validProfile)
      store.clearProfile()
      expect(store.profile.name).toBe('')
      expect(store.isProfileComplete).toBe(false)
    })
  })

  describe('userBasicInfo computed', () => {
    it('回傳基本資訊', () => {
      store.setProfile(validProfile)
      const info = store.userBasicInfo
      expect(info).not.toBeNull()
      expect(info!.name).toBe('測試用戶')
      expect(info!.zodiac).toBe('鼠')
      expect(info!.hasLuckyColors).toBe(true)
    })
  })

  describe('initializeFromStorage', () => {
    it('從 localStorage 恢復資料', () => {
      localStorage.setItem('userProfile', JSON.stringify({ profile: validProfile }))
      const newStore = useUserStore()
      newStore.initializeFromStorage()
      expect(newStore.profile.name).toBe('測試用戶')
    })

    it('從根層級恢復資料', () => {
      localStorage.setItem('userProfile', JSON.stringify(validProfile))
      const newStore = useUserStore()
      newStore.initializeFromStorage()
      expect(newStore.profile.name).toBe('測試用戶')
    })
  })
})
