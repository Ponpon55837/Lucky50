<script setup lang="ts">
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline'
import { useToast } from '@/composables/useToast'

const { toasts, removeToast } = useToast()

const ICONS = {
  success: CheckCircleIcon,
  error: ExclamationCircleIcon,
  warning: ExclamationTriangleIcon,
  info: InformationCircleIcon,
} as const

const ICON_COLORS = {
  success: 'text-good',
  error: 'text-danger',
  warning: 'text-warn',
  info: 'text-ink-3',
} as const
</script>

<template>
  <Teleport to="body">
    <div
      id="toast-viewport"
      class="pointer-events-none fixed left-1/2 top-0 z-[999999] w-screen max-w-[500px] -translate-x-1/2 px-4 pt-4"
      aria-live="polite"
    >
      <TransitionGroup
        enter-active-class="transition-[opacity,transform] duration-300 ease-out"
        enter-from-class="-translate-y-2 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition-opacity duration-200 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
        tag="div"
        class="flex flex-col gap-3"
      >
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="pointer-events-auto w-full overflow-hidden rounded-[10px] border border-line bg-surface shadow-card"
          :role="toast.type === 'error' ? 'alert' : 'status'"
        >
          <div class="flex items-start gap-3 p-4">
            <component
              :is="ICONS[toast.type] ?? InformationCircleIcon"
              class="mt-0.5 h-5 w-5 shrink-0"
              :class="ICON_COLORS[toast.type] ?? 'text-ink-3'"
              aria-hidden="true"
            />
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-ink">
                {{ toast.title }}
              </p>
              <p
                v-if="toast.message"
                class="mt-1 text-sm text-ink-2"
              >
                {{ toast.message }}
              </p>
            </div>
            <button
              type="button"
              class="-m-1 inline-flex shrink-0 rounded-md p-1 text-ink-3 transition-colors hover:bg-raised hover:text-ink"
              @click="removeToast(toast.id)"
            >
              <span class="sr-only">關閉</span>
              <XMarkIcon
                class="h-4 w-4"
                aria-hidden="true"
              />
            </button>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
