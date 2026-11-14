<script setup lang="ts">
import { MoonIcon, SunIcon } from '@heroicons/vue/24/outline'
import { useTheme } from '@/composables/useTheme'

const { isDark, toggleTheme } = useTheme()
</script>

<template>
  <button
    type="button"
    class="grid h-10 w-10 place-items-center rounded-[10px] border border-line text-ink-2 transition-colors duration-150 hover:bg-raised hover:text-ink"
    :aria-label="isDark ? '切換至淺色模式' : '切換至深色模式'"
    :title="isDark ? '切換至淺色模式' : '切換至深色模式'"
    @click="toggleTheme"
  >
    <SunIcon
      v-if="isDark"
      class="h-[18px] w-[18px]"
    />
    <MoonIcon
      v-else
      class="h-[18px] w-[18px]"
    />
  </button>
</template>
