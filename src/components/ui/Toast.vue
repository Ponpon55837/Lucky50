<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline'

interface Props {
  type?: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  visible?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  message: undefined,
  type: 'info',
  duration: 3000, // 改為 3 秒，與 useToast 保持一致
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
                <CheckCircleIcon
                  v-if="type === 'success'"
                  class="h-6 w-6 text-green-400"
                />
                <ExclamationTriangleIcon
                  v-else-if="type === 'error'"
                  class="h-6 w-6 text-red-400"
                />
                <ExclamationCircleIcon
                  v-else-if="type === 'warning'"
                  class="h-6 w-6 text-yellow-400"
                />
                <InformationCircleIcon
                  v-else
                  class="h-6 w-6 text-blue-400"
                />
              </div>
              <div class="ml-3 w-0 flex-1 pt-0.5">
                <p
                  v-if="title"
                  class="text-sm font-medium text-gray-900 dark:text-gray-100"
                >
                  {{ title }}
                </p>
                <p
                  v-if="message"
                  class="mt-1 text-sm text-gray-500 dark:text-gray-400"
                >
                  {{ message }}
                </p>
              </div>
              <div class="ml-4 flex-shrink-0 flex">
                <button
                  class="inline-flex text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none"
                  @click="close"
                >
                  <span class="sr-only">關閉</span>
                  <XMarkIcon class="h-5 w-5" />
                </button>
              </div>
              <div class="ml-4 flex-shrink-0 flex">
                <button
                  class="bg-white dark:bg-gray-800 rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500"
                  @click="close"
                >
                  <span class="sr-only">Close</span>
                  <svg
                    class="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
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
