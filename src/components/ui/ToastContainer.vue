<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const { toasts, removeToast } = useToast()
</script>

<template>
  <Teleport to="body">
    <div
      id="toast-viewport"
      style="
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        z-index: 999999;
        padding-top: 1rem;
        width: 100vw;
        max-width: 500px;
        pointer-events: none;
      "
    >
      <TransitionGroup
        enter-active-class="transform ease-out duration-300 transition"
        enter-from-class="translate-y-2 opacity-0 scale-95"
        enter-to-class="translate-y-0 opacity-100 scale-100"
        leave-active-class="transition ease-in duration-200"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
        tag="div"
        class="space-y-3"
        style="pointer-events: auto"
      >
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="max-w-md w-full shadow-lg rounded-lg ring-1 ring-opacity-5 overflow-hidden"
          style="
            background: rgba(17, 24, 39, 0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            pointer-events: auto;
          "
          :class="[
            toast.type === 'success' ? 'border-l-4 border-green-400' : '',
            toast.type === 'error' ? 'border-l-4 border-red-400' : '',
            toast.type === 'warning' ? 'border-l-4 border-yellow-400' : '',
            toast.type === 'info' ? 'border-l-4 border-blue-400' : '',
          ]"
        >
          <div class="p-4">
            <div class="flex items-start">
              <div class="flex-shrink-0">
                <svg
                  v-if="toast.type === 'success'"
                  class="h-6 w-6 text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <svg
                  v-else-if="toast.type === 'error'"
                  class="h-6 w-6 text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div class="ml-3 w-0 flex-1 pt-0.5">
                <p class="text-sm font-medium" style="color: white">
                  {{ toast.title }}
                </p>
                <p
                  v-if="toast.message"
                  class="mt-1 text-sm"
                  style="color: rgba(255, 255, 255, 0.8)"
                >
                  {{ toast.message }}
                </p>
              </div>
              <div class="ml-4 flex-shrink-0 flex">
                <button
                  class="rounded-md inline-flex focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500"
                  style="color: rgba(255, 255, 255, 0.6)"
                  @click="removeToast(toast.id)"
                >
                  <span class="sr-only">關閉</span>
                  <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fill-rule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
