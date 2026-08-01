<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'

interface Props {
  modelValue: boolean
  title: string
}

defineProps<Props>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const { isDark } = useTheme()

const close = () => emit('update:modelValue', false)
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      :class="isDark ? 'bg-black/60' : 'bg-black/40'"
      style="backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px)"
      @click="close"
    >
      <div
        class="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-lg shadow-2xl border"
        :class="[isDark ? 'bg-gray-900 border-gold-500/20' : 'bg-white border-gray-200']"
        @click.stop
      >
        <div
          class="flex items-center justify-between p-4 sm:p-6 border-b flex-shrink-0"
          :class="isDark ? 'border-white/10' : 'border-gray-200'"
        >
          <h2
            class="text-lg sm:text-xl font-bold flex items-center gap-2"
            :class="isDark ? 'text-white' : 'text-gray-900'"
          >
            <div class="w-3 h-3 bg-gold-500 rounded-full flex-shrink-0" />
            <span class="truncate">{{ title }}</span>
          </h2>
          <button
            class="transition-colors p-1 flex-shrink-0 ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            :class="isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'"
            aria-label="關閉"
            @click="close"
          >
            <svg
              class="w-5 h-5 sm:w-6 sm:h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div
          class="p-4 sm:p-6 overflow-y-auto flex-1 text-sm leading-relaxed"
          :class="isDark ? 'text-gray-300' : 'text-gray-700'"
        >
          <div class="space-y-6">
            <slot />
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
