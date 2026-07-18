<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import ThemeToggle from '@/components/ThemeToggle.vue'

const mobileOpen = ref(false)

const toggleMobile = () => {
  mobileOpen.value = !mobileOpen.value
}

const closeMobile = () => {
  mobileOpen.value = false
}
</script>

<template>
  <nav class="navbar">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- Logo -->
        <RouterLink to="/" class="logo-link">
          <div class="logo-icon" />
          <span class="logo-text">Lucky50</span>
        </RouterLink>

        <!-- 桌面版導航 -->
        <div class="hidden md:flex items-center space-x-6">
          <RouterLink
            to="/"
            class="nav-link"
            :class="{ active: $route.name === 'home' }"
            :aria-current="$route.name === 'home' ? 'page' : undefined"
          >
            首頁
          </RouterLink>
          <RouterLink
            to="/dashboard"
            class="nav-link"
            :class="{ active: $route.name === 'dashboard' }"
            :aria-current="$route.name === 'dashboard' ? 'page' : undefined"
          >
            投資儀表板
          </RouterLink>
          <RouterLink
            to="/history"
            class="nav-link"
            :class="{ active: $route.name === 'history' }"
            :aria-current="$route.name === 'history' ? 'page' : undefined"
          >
            運勢歷史
          </RouterLink>
          <RouterLink
            to="/analytics"
            class="nav-link"
            :class="{ active: $route.name === 'analytics' }"
            :aria-current="$route.name === 'analytics' ? 'page' : undefined"
          >
            數據分析
          </RouterLink>
          <RouterLink
            to="/profile"
            class="nav-link"
            :class="{ active: $route.name === 'profile' }"
            :aria-current="$route.name === 'profile' ? 'page' : undefined"
          >
            個人設定
          </RouterLink>

          <!-- 主題切換按鈕 -->
          <ThemeToggle />
        </div>

        <!-- 移動版選單按鈕 -->
        <div class="md:hidden flex items-center space-x-2 flex-shrink-0">
          <ThemeToggle />
          <button
            type="button"
            class="mobile-menu-btn"
            aria-label="開啟導覽選單"
            :aria-expanded="mobileOpen"
            aria-controls="mobile-navigation"
            @click="toggleMobile"
          >
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

    <!-- 移動版選單 -->
    <Transition
      enter-active-class="menu-enter-active"
      enter-from-class="menu-enter-from"
      enter-to-class="menu-enter-to"
      leave-active-class="menu-leave-active"
      leave-from-class="menu-leave-from"
      leave-to-class="menu-leave-to"
    >
      <div v-if="mobileOpen" id="mobile-navigation" class="mobile-menu">
        <div class="px-4 pt-2 pb-3 space-y-1">
          <RouterLink
            to="/"
            class="mobile-nav-link"
            :aria-current="$route.name === 'home' ? 'page' : undefined"
            @click="closeMobile"
          >
            首頁
          </RouterLink>
          <RouterLink
            to="/dashboard"
            class="mobile-nav-link"
            :aria-current="$route.name === 'dashboard' ? 'page' : undefined"
            @click="closeMobile"
          >
            投資儀表板
          </RouterLink>
          <RouterLink
            to="/history"
            class="mobile-nav-link"
            :aria-current="$route.name === 'history' ? 'page' : undefined"
            @click="closeMobile"
          >
            運勢歷史
          </RouterLink>
          <RouterLink
            to="/analytics"
            class="mobile-nav-link"
            :aria-current="$route.name === 'analytics' ? 'page' : undefined"
            @click="closeMobile"
          >
            數據分析
          </RouterLink>
          <RouterLink
            to="/profile"
            class="mobile-nav-link"
            :aria-current="$route.name === 'profile' ? 'page' : undefined"
            @click="closeMobile"
          >
            個人設定
          </RouterLink>
        </div>
      </div>
    </Transition>
  </nav>
</template>

<style scoped>
.navbar {
  background: var(--card-bg);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border-light);
  position: sticky;
  top: 0;
  z-index: 50;
  overflow: hidden;
  transition: background 0.3s ease;
}

.logo-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  color: var(--primary-text);
  font-weight: 600;
  flex-shrink: 0;
  transition: color 0.2s ease;
}

.logo-link:hover {
  color: var(--accent-text);
}

.logo-icon {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.logo-text {
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--accent-text) 0%, #fbbf24 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* 手機版 Logo 文字縮小，避免擠壓右側按鈕 */
@media (max-width: 640px) {
  .logo-text {
    font-size: 1.25rem;
  }
}

.nav-link {
  color: var(--secondary-text);
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  position: relative;
}

.nav-link:hover {
  color: var(--primary-text);
  background: var(--surface-bg);
}

.nav-link.active {
  color: var(--accent-text);
  background: rgba(245, 158, 11, 0.1);
}

.mobile-menu-btn {
  color: var(--secondary-text);
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
  outline: none;
  border: none;
  background: transparent;
  cursor: pointer;
}

.mobile-menu-btn:hover {
  color: var(--accent-text);
  background: var(--surface-bg);
}

.mobile-menu {
  background: var(--card-bg);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border-light);
}

.mobile-nav-link {
  display: block;
  color: var(--secondary-text);
  text-decoration: none;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.mobile-nav-link:hover {
  color: var(--primary-text);
  background: var(--surface-bg);
}

/* 移動版選單過渡動畫 */
.menu-enter-active,
.menu-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
  transform-origin: top;
}

.menu-enter-from,
.menu-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.menu-enter-to,
.menu-leave-from {
  opacity: 1;
  transform: translateY(0);
}

/* 淺色模式導航欄優化 */
:root.light .navbar {
  background: rgba(255, 255, 255, 0.98);
  border-bottom-color: var(--border-medium);
  box-shadow: 0 1px 8px var(--shadow-light);
}

:root.light .nav-link.active {
  color: #1d4ed8;
  background: rgba(59, 130, 246, 0.1);
}

:root.light .nav-link:hover {
  color: var(--primary-text);
  background: rgba(59, 130, 246, 0.05);
}

:root.light .mobile-nav-link:hover {
  color: var(--primary-text);
  background: rgba(59, 130, 246, 0.05);
}
</style>
