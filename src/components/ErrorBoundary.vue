<script setup lang="ts">
import { ref, onErrorCaptured, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ExclamationCircleIcon } from '@heroicons/vue/24/outline'
import { useErrorHandler } from '@/composables/useErrorHandler'
import type { AppError } from '@/types/error'

interface Props {
  /** 自定義錯誤標題 */
  title?: string
  /** 自定義錯誤訊息 */
  message?: string
  /** 是否顯示錯誤詳情 (僅開發環境) */
  showDetails?: boolean
  /** 是否顯示重置按鈕 */
  showReset?: boolean
  /** 重試回調 */
  onRetry?: () => void | Promise<void>
}

const props = withDefaults(defineProps<Props>(), {
  title: undefined,
  message: undefined,
  showDetails: true,
  showReset: true,
  onRetry: undefined,
})

const emit = defineEmits<{
  error: [error: Error]
  retry: []
  reset: []
}>()

const router = useRouter()
const { handleError } = useErrorHandler()

const hasError = ref(false)
const error = ref<Error | null>(null)
const appError = ref<AppError | null>(null)

const errorTitle = computed(() => {
  if (props.title) return props.title
  if (appError.value?.code) return `錯誤代碼: ${appError.value.code}`
  return '發生錯誤'
})

const errorMessage = computed(() => {
  if (props.message) return props.message
  if (appError.value?.message) return appError.value.message
  return '抱歉，應用程式發生了意外錯誤。請嘗試重新整理頁面。'
})

const errorDetails = computed(() => {
  if (!error.value) return ''
  return {
    message: error.value.message,
    stack: error.value.stack,
    appError: appError.value,
  }
})

// 捕獲子組件錯誤
onErrorCaptured((err: Error) => {
  hasError.value = true
  error.value = err
  appError.value = handleError(err, {
    showToast: false, // 不自動顯示 toast，由 ErrorBoundary 處理
  })

  emit('error', err)

  // 返回 false 防止錯誤繼續向上傳播
  return false
})

// 捕獲全域未處理的錯誤
const handleGlobalError = (event: ErrorEvent) => {
  hasError.value = true
  error.value = event.error
  appError.value = handleError(event.error, {
    showToast: false,
  })
  emit('error', event.error)
}

const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
  hasError.value = true
  const err = event.reason instanceof Error ? event.reason : new Error(String(event.reason))
  error.value = err
  appError.value = handleError(err, {
    showToast: false,
  })
  emit('error', err)
}

onMounted(() => {
  window.addEventListener('error', handleGlobalError)
  window.addEventListener('unhandledrejection', handleUnhandledRejection)
})

// onMounted 的回傳值不會被 Vue 當成清理函式，必須在卸載時明確移除
onBeforeUnmount(() => {
  window.removeEventListener('error', handleGlobalError)
  window.removeEventListener('unhandledrejection', handleUnhandledRejection)
})

const retry = async () => {
  if (props.onRetry) {
    await props.onRetry()
  }
  reset()
  emit('retry')
}

const reset = () => {
  hasError.value = false
  error.value = null
  appError.value = null
  emit('reset')
}

const goHome = () => {
  reset()
  router.push('/')
}
</script>

<template>
  <div class="h-full w-full">
    <!-- 正常顯示內容 -->
    <slot v-if="!hasError" />

    <!-- 錯誤畫面 -->
    <div
      v-else
      class="flex min-h-[400px] items-center justify-center p-8"
      role="alert"
    >
      <div class="card w-full max-w-[600px] items-center p-8 text-center sm:p-12">
        <div
          class="flex h-14 w-14 items-center justify-center rounded-full bg-danger/10 text-danger"
        >
          <ExclamationCircleIcon
            class="h-7 w-7"
            aria-hidden="true"
          />
        </div>

        <h2 class="font-serif text-2xl font-bold text-ink">
          {{ errorTitle }}
        </h2>
        <p class="leading-relaxed text-ink-2">
          {{ errorMessage }}
        </p>

        <div
          v-if="showDetails && error"
          class="w-full text-left"
        >
          <details>
            <summary
              class="mb-2 cursor-pointer select-none text-sm font-medium text-ink-2 transition-colors hover:text-ink"
            >
              錯誤詳情
            </summary>
            <pre
              class="max-h-[300px] overflow-auto rounded-[10px] border border-line bg-raised p-4 font-mono text-xs text-ink-2"
            >{{ errorDetails }}</pre>
          </details>
        </div>

        <div class="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            class="btn-primary"
            @click="retry"
          >
            重試
          </button>
          <button
            type="button"
            class="btn-secondary"
            @click="goHome"
          >
            返回首頁
          </button>
          <button
            v-if="showReset"
            type="button"
            class="inline-flex h-11 items-center px-3 text-[15px] text-ink-3 transition-colors hover:text-ink"
            @click="reset"
          >
            清除錯誤
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
