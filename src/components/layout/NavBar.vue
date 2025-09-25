<template>
  <nav class="bg-black/20 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex items-center">
          <RouterLink to="/" class="flex items-center space-x-2">
            <div class="w-8 h-8 rounded-full bg-gradient-to-r from-gold-500 to-yellow-600"></div>
            <span class="font-bold text-xl text-white">農民曆投資</span>
          </RouterLink>
        </div>

        <div class="hidden md:flex items-center space-x-8">
          <RouterLink to="/" class="nav-link" :class="{ active: $route.name === 'home' }">
            首頁
          </RouterLink>
          <RouterLink
            to="/dashboard"
            class="nav-link"
            :class="{ active: $route.name === 'dashboard' }"
          >
            投資儀表板
          </RouterLink>
          <RouterLink
            to="/analytics"
            class="nav-link"
            :class="{ active: $route.name === 'analytics' }"
          >
            數據分析
          </RouterLink>
          <RouterLink to="/profile" class="nav-link" :class="{ active: $route.name === 'profile' }">
            個人設定
          </RouterLink>
        </div>

        <div class="md:hidden flex items-center">
          <button @click="toggleMobile" class="text-white hover:text-gold-400 transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                v-if="!mobileOpen"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
              <path
                v-else
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile menu -->
    <div v-show="mobileOpen" class="md:hidden bg-black/30 backdrop-blur-md">
      <div class="px-2 pt-2 pb-3 space-y-1">
        <RouterLink to="/" class="mobile-nav-link" @click="closeMobile"> 首頁 </RouterLink>
        <RouterLink to="/dashboard" class="mobile-nav-link" @click="closeMobile">
          投資儀表板
        </RouterLink>
        <RouterLink to="/analytics" class="mobile-nav-link" @click="closeMobile">
          數據分析
        </RouterLink>
        <RouterLink to="/profile" class="mobile-nav-link" @click="closeMobile">
          個人設定
        </RouterLink>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'

const mobileOpen = ref(false)

const toggleMobile = () => {
  mobileOpen.value = !mobileOpen.value
}

const closeMobile = () => {
  mobileOpen.value = false
}
</script>

<style scoped>
.nav-link {
  @apply text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200;
}

.nav-link.active {
  @apply text-gold-400;
}

.mobile-nav-link {
  @apply text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200;
}
</style>
