import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import type { UserProfile } from '@/types'

export const useUserStore = defineStore('user', () => {
  const profile = ref<UserProfile | null>(null)
  const isProfileComplete = computed(() => {
    return profile.value && 
           profile.value.name && 
           profile.value.birthDate && 
           profile.value.birthTime
  })

  const setProfile = (userProfile: UserProfile) => {
    profile.value = userProfile
    localStorage.setItem('userProfile', JSON.stringify(userProfile))
  }

  const loadProfile = () => {
    const saved = localStorage.getItem('userProfile')
    if (saved) {
      profile.value = JSON.parse(saved)
    }
  }

  const clearProfile = () => {
    profile.value = null
    localStorage.removeItem('userProfile')
  }

  return {
    profile: readonly(profile),
    isProfileComplete,
    setProfile,
    loadProfile,
    clearProfile
  }
})