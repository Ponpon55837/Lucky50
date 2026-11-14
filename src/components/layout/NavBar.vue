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

  <!-- 手機與平板：頂部列 + 覆蓋式下拉選單（不推擠頁面內容） -->
  <Transition name="menu-backdrop">
    <div
      v-show="mobileOpen"
      class="menu-backdrop lg:hidden"
      aria-hidden="true"
      @click="mobileOpen = false"
    />
  </Transition>
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
          <Transition
            name="menu-icon"
            mode="out-in"
          >
            <XMarkIcon
              v-if="mobileOpen"
              class="h-5 w-5"
            />
            <Bars3Icon
              v-else
              class="h-5 w-5"
            />
          </Transition>
        </button>
      </div>
    </div>
    <Transition name="menu-panel">
      <nav
        v-show="mobileOpen"
        id="mobile-navigation"
        class="absolute inset-x-0 top-full rounded-b-card border-b border-line bg-surface px-3 pb-3 pt-2 shadow-card"
        aria-label="主選單"
      >
        <RouterLink
          v-for="(item, index) in NAV_ITEMS"
          :key="item.to"
          :to="item.to"
          class="menu-item"
          exact-active-class="is-active"
          :style="{ '--i': index }"
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

/* ── 手機選單 ─────────────────────────────── */

/* 遮罩：淡淡的宣紙霧面，只是讓內容退後，不壓暗 */
.menu-backdrop {
  @apply fixed inset-0 z-30 bg-paper/60;
  backdrop-filter: blur(6px) saturate(0.9);
}

.menu-backdrop-enter-active,
.menu-backdrop-leave-active {
  transition: opacity 240ms var(--ease-out);
}

.menu-backdrop-enter-from,
.menu-backdrop-leave-to {
  opacity: 0;
}

/* 面板：像捲軸一樣由上往下展開 */
.menu-panel-enter-active {
  transition:
    clip-path 360ms var(--ease-out),
    opacity 200ms var(--ease-out);
}

.menu-panel-leave-active {
  transition:
    clip-path 200ms var(--ease-out),
    opacity 160ms var(--ease-out);
}

.menu-panel-enter-from,
.menu-panel-leave-to {
  clip-path: inset(0 0 100% 0 round 0 0 16px 16px);
  opacity: 0;
}

.menu-panel-enter-to,
.menu-panel-leave-from {
  clip-path: inset(0 0 0 0 round 0 0 16px 16px);
}

.menu-item {
  @apply relative flex h-12 items-center rounded-[10px] px-4 font-serif text-[16px] tracking-[0.12em] text-ink-2 transition-colors hover:bg-raised hover:text-ink;
}

.menu-item.is-active {
  @apply bg-raised font-bold text-ink;
}

/* 目前頁面：與桌面書脊同款的朱紅書籤線 */
.menu-item.is-active::before {
  content: '';
  @apply absolute bottom-3 left-1.5 top-3 w-[3px] rounded-sm bg-seal;
}

/* 選項依序落下 */
.menu-panel-enter-active .menu-item {
  animation: menu-item-in 380ms var(--ease-out) both;
  animation-delay: calc(80ms + var(--i) * 45ms);
}

@keyframes menu-item-in {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
}

/* 漢堡 ↔ 叉叉 旋轉切換 */
.menu-icon-enter-active,
.menu-icon-leave-active {
  transition:
    transform 160ms var(--ease-out),
    opacity 160ms var(--ease-out);
}

.menu-icon-enter-from {
  opacity: 0;
  transform: rotate(-90deg) scale(0.6);
}

.menu-icon-leave-to {
  opacity: 0;
  transform: rotate(90deg) scale(0.6);
}
</style>
