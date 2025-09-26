<style scoped>
.theme-toggle-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--surface-bg);
  border: 1px solid var(--border-light);
  border-radius: 9999px;
  color: var(--secondary-text);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease-out;
  backdrop-filter: blur(10px);
  outline: none;
  user-select: none;
}

.theme-toggle-btn:hover {
  background: var(--card-bg);
  color: var(--primary-text);
  border-color: var(--accent-text);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px var(--shadow-medium);
}

.theme-toggle-btn:active {
  transform: translateY(0);
}

.theme-toggle-btn:focus-visible {
  border-color: var(--accent-text);
  box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.2);
}

.toggle-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
}

.toggle-text {
  font-size: 0.875rem;
  white-space: nowrap;
}

/* 圖標切換動畫 */
.icon-fade-enter-active,
.icon-fade-leave-active {
  transition: opacity 0.15s ease;
}

.icon-fade-enter-from,
.icon-fade-leave-to {
  opacity: 0;
}

/* 深色模式時的樣式 */
.theme-toggle-btn.is-dark .toggle-icon {
  color: #fbbf24;
}

/* 淺色模式時的樣式增強 */
:root.light .theme-toggle-btn {
  background: var(--surface-bg);
  border-color: var(--border-medium);
  color: var(--primary-text);
}

:root.light .theme-toggle-btn:hover {
  background: rgba(59, 130, 246, 0.1);
  color: #1d4ed8;
  border-color: #3b82f6;
}

:root.light .theme-toggle-btn:not(.is-dark) .toggle-icon {
  color: #1d4ed8;
}

/* 響應式設計 */
@media (max-width: 640px) {
  .theme-toggle-btn {
    padding: 0.5rem;
    min-width: 2.5rem;
  }

  .toggle-text {
    display: none;
  }
}
</style>

<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'

const { isDark, toggleTheme } = useTheme()
</script>

<template>
  <button
    @click="toggleTheme"
    class="theme-toggle-btn"
    :class="{ 'is-dark': isDark }"
    :title="isDark ? '切換至淺色模式' : '切換至深色模式'"
  >
    <div class="toggle-icon">
      <transition name="icon-fade" mode="out-in">
        <svg
          v-if="isDark"
          key="sun"
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
        <svg
          v-else
          key="moon"
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      </transition>
    </div>
    <span class="toggle-text">
      {{ isDark ? '淺色' : '深色' }}
    </span>
  </button>
</template>
