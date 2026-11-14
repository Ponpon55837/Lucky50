<script setup lang="ts">
import { nextTick, ref, toRef, watch } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { useEscapeKey } from '@/composables/useEscapeKey'

interface Props {
  modelValue: boolean
  title: string
}

const props = defineProps<Props>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const closeButton = ref<HTMLButtonElement | null>(null)
let returnFocusTo: HTMLElement | null = null

const close = () => emit('update:modelValue', false)

useEscapeKey(toRef(props, 'modelValue'), close)

// 開啟時把焦點移進對話框，關閉後還給原本的觸發按鈕
watch(
  () => props.modelValue,
  async open => {
    if (open) {
      returnFocusTo = document.activeElement as HTMLElement | null
      await nextTick()
      closeButton.value?.focus()
    } else {
      returnFocusTo?.focus()
      returnFocusTo = null
    }
  }
)
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      :aria-label="title"
      @click="close"
    >
      <div
        class="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-card border border-line bg-surface shadow-card"
        @click.stop
      >
        <div
          class="flex shrink-0 items-center justify-between border-b border-line px-5 py-4 sm:px-6"
        >
          <h2 class="truncate font-serif text-lg font-bold">
            {{ title }}
          </h2>
          <button
            ref="closeButton"
            type="button"
            class="ml-2 grid h-9 w-9 shrink-0 place-items-center rounded-[10px] text-ink-3 transition-colors hover:bg-raised hover:text-ink"
            aria-label="關閉"
            @click="close"
          >
            <XMarkIcon class="h-5 w-5" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-5 text-sm leading-relaxed text-ink-2 sm:p-6">
          <div class="space-y-6">
            <slot />
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
