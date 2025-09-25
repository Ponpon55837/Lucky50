<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transform ease-out duration-300 transition"
      enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
      enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
      leave-active-class="transition ease-in duration-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="visible"
        class="fixed top-0 inset-x-0 flex items-end justify-center px-4 py-6 pointer-events-none sm:p-6 sm:items-start sm:justify-end z-50"
      >
        <div
          class="max-w-sm w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden"
          :class="[
            type === 'success' ? 'border-l-4 border-green-400' : '',
            type === 'error' ? 'border-l-4 border-red-400' : '',
            type === 'warning' ? 'border-l-4 border-yellow-400' : '',
            type === 'info' ? 'border-l-4 border-blue-400' : '',
          ]"
        >
          <div class="p-4">
            <div class="flex items-start">
              <div class="flex-shrink-0">
                <!-- Success Icon -->
                <svg
                  v-if="type === 'success'"
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
                <!-- Error Icon -->
                <svg
                  v-else-if="type === 'error'"
                  class="h-6 w-6 text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <!-- Warning Icon -->
                <svg
                  v-else-if="type === 'warning'"
                  class="h-6 w-6 text-yellow-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <!-- Info Icon -->
                <svg
                  v-else-if="type === 'info'"
                  class="h-6 w-6 text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div class="ml-3 w-0 flex-1 pt-0.5">
                <p class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ title }}
                </p>
                <p v-if="message" class="mt-1 text-sm text-gray-500 dark:text-gray-300">
                  {{ message }}
                </p>
              </div>
              <div class="ml-4 flex-shrink-0 flex">
                <button
                  class="bg-white dark:bg-gray-800 rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500"
                  @click="close"
                >
                  <span class="sr-only">Close</span>
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
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Props {
  type?: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  visible?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  duration: 4000,
  visible: false,
})

const emit = defineEmits<{
  close: []
}>()

const visible = ref(props.visible)
let timeoutId: NodeJS.Timeout | null = null

const close = () => {
  visible.value = false
  if (timeoutId) {
    clearTimeout(timeoutId)
  }
  setTimeout(() => {
    emit('close')
  }, 300) // 等待動畫完成
}

const show = () => {
  visible.value = true
  if (props.duration > 0) {
    timeoutId = setTimeout(() => {
      close()
    }, props.duration)
  }
}

onMounted(() => {
  if (props.visible) {
    show()
  }
})

// 暴露方法給父元件
defineExpose({
  show,
  close,
})
</script>
