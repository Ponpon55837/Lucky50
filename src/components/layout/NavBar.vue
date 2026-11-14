<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { Bars3Icon, XMarkIcon } from '@heroicons/vue/24/outline'
import ThemeToggle from '@/components/ThemeToggle.vue'
import { useEscapeKey } from '@/composables/useEscapeKey'

const NAV_ITEMS = [
  { to: '/', label: '首頁' },
  { to: '/dashboard', label: '儀表板' },
  { to: '/history', label: '運勢歷史' },
  { to: '/analytics', label: '數據分析' },
  { to: '/profile', label: '個人設定' },
] as const

const route = useRoute()
const mobileOpen = ref(false)

useEscapeKey(mobileOpen, () => (mobileOpen.value = false))

// 換頁時自動收起手機選單
watch(
  () => route.fullPath,
  () => (mobileOpen.value = false)
)
</script>

<template>
  <!-- 桌面：直排書脊導覽 -->
  <nav
    class="fixed inset-y-0 left-0 z-40 hidden w-[88px] flex-col items-center gap-5 border-r border-line bg-surface py-5 lg:flex"
    aria-label="主選單"
  >
    <RouterLink
      to="/"
      class="brand-mark h-11 w-11 text-2xl"
      aria-label="Lucky50 首頁"
    >
      福
    </RouterLink>
    <ul class="flex flex-col gap-1">
      <li
        v-for="item in NAV_ITEMS"
        :key="item.to"
      >
        <RouterLink
          :to="item.to"
          class="spine-link"
          exact-active-class="is-active"
        >
          {{ item.label }}
        </RouterLink>
      </li>
    </ul>
    <div class="mt-auto">
      <ThemeToggle />
    </div>
  </nav>

  <!-- 手機與平板：頂部列 + 下拉選單 -->
  <header class="sticky top-0 z-40 border-b border-line bg-surface lg:hidden">
    <div class="flex h-14 items-center justify-between px-4">
      <RouterLink
        to="/"
        class="flex items-center gap-2.5 font-semibold"
      >
        <span class="brand-mark h-8 w-8 text-lg">福</span>
        Lucky50
      </RouterLink>
      <div class="flex items-center gap-2">
        <ThemeToggle />
        <button
          type="button"
          class="grid h-10 w-10 place-items-center rounded-[10px] text-ink-2 transition-colors hover:bg-raised"
          :aria-label="mobileOpen ? '關閉導覽選單' : '開啟導覽選單'"
          :aria-expanded="mobileOpen"
          aria-controls="mobile-navigation"
          @click="mobileOpen = !mobileOpen"
        >
          <XMarkIcon
            v-if="mobileOpen"
            class="h-5 w-5"
          />
          <Bars3Icon
            v-else
            class="h-5 w-5"
          />
        </button>
      </div>
    </div>
    <Transition
      enter-from-class="opacity-0 -translate-y-1"
      enter-active-class="transition-[opacity,transform] duration-200 ease-out"
      leave-to-class="opacity-0 -translate-y-1"
      leave-active-class="transition-[opacity,transform] duration-150 ease-out"
    >
      <nav
        v-show="mobileOpen"
        id="mobile-navigation"
        class="border-t border-line px-2 py-2"
        aria-label="主選單"
      >
        <RouterLink
          v-for="item in NAV_ITEMS"
          :key="item.to"
          :to="item.to"
          class="flex h-11 items-center rounded-[10px] px-3 font-serif text-[15px] text-ink-2 transition-colors hover:bg-raised"
          exact-active-class="bg-raised font-bold text-ink"
        >
          {{ item.label }}
        </RouterLink>
      </nav>
    </Transition>
  </header>
</template>

<style scoped>
.brand-mark {
  @apply grid place-items-center rounded-[10px] bg-seal font-kai font-bold text-gold;
}

.spine-link {
  @apply relative block rounded-[10px] px-2.5 py-3.5 font-serif text-[15px] tracking-[0.25em] text-ink-2 transition-colors duration-150 hover:bg-raised hover:text-ink;
  writing-mode: vertical-rl;
}

.spine-link.is-active {
  @apply bg-raised font-bold text-ink;
}

/* 目前頁面：左側朱紅書籤線 */
.spine-link.is-active::before {
  content: '';
  @apply absolute -left-2.5 bottom-3 top-3 w-[3px] rounded-sm bg-seal;
}
</style>
