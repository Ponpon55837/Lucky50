<script setup lang="ts">
import { ref, onErrorCaptured, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
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
    showToUser: false, // 不自動顯示 toast，由 ErrorBoundary 處理
  })

  emit('error', err)

  // 返回 false 防止錯誤繼續向上傳播
  return false
})

// 捕獲全域未處理的錯誤
onMounted(() => {
  const handleGlobalError = (event: ErrorEvent) => {
    hasError.value = true
    error.value = event.error
    appError.value = handleError(event.error, {
      showToUser: false,
    })
    emit('error', event.error)
  }

  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    hasError.value = true
    const err = event.reason instanceof Error ? event.reason : new Error(String(event.reason))
    error.value = err
    appError.value = handleError(err, {
      showToUser: false,
    })
    emit('error', err)
  }

  window.addEventListener('error', handleGlobalError)
  window.addEventListener('unhandledrejection', handleUnhandledRejection)

  // 清理
  return () => {
    window.removeEventListener('error', handleGlobalError)
    window.removeEventListener('unhandledrejection', handleUnhandledRejection)
  }
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
  <div class="error-boundary">
    <!-- 正常顯示內容 -->
    <slot v-if="!hasError" />

    <!-- 錯誤畫面 -->
    <div
      v-else
      class="error-fallback"
    >
      <div class="error-container">
        <div class="error-icon">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
            />
            <line
              x1="12"
              y1="8"
              x2="12"
              y2="12"
            />
            <line
              x1="12"
              y1="16"
              x2="12.01"
              y2="16"
            />
          </svg>
        </div>

        <h2 class="error-title">
          {{ errorTitle }}
        </h2>
        <p class="error-message">
          {{ errorMessage }}
        </p>

        <div
          v-if="showDetails && error"
          class="error-details"
        >
          <details>
            <summary>錯誤詳情</summary>
            <pre>{{ errorDetails }}</pre>
          </details>
        </div>

        <div class="error-actions">
          <button
            class="btn-retry"
            @click="retry"
          >
            重試
          </button>
          <button
            class="btn-home"
            @click="goHome"
          >
            返回首頁
          </button>
          <button
            v-if="showReset"
            class="btn-reset"
            @click="reset"
          >
            清除錯誤
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.error-boundary {
  width: 100%;
  height: 100%;
}

.error-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 2rem;
  background: linear-gradient(135deg, #fef5f5 0%, #fef0f0 100%);
}

.error-container {
  max-width: 600px;
  text-align: center;
  background: white;
  padding: 3rem;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.error-icon {
  color: #ef4444;
  margin-bottom: 1.5rem;
  display: inline-block;
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  10%,
  30%,
  50%,
  70%,
  90% {
    transform: translateX(-5px);
  }
  20%,
  40%,
  60%,
  80% {
    transform: translateX(5px);
  }
}

.error-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
}

.error-message {
  font-size: 1rem;
  color: #6b7280;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.error-details {
  margin-bottom: 2rem;
  text-align: left;
}

.error-details summary {
  cursor: pointer;
  font-weight: 500;
  color: #4b5563;
  margin-bottom: 0.5rem;
  user-select: none;
}

.error-details summary:hover {
  color: #1f2937;
}

.error-details pre {
  background: #f9fafb;
  padding: 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  overflow-x: auto;
  color: #374151;
  max-height: 300px;
  overflow-y: auto;
}

.error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.error-actions button {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-retry {
  background: #ef4444;
  color: white;
}

.btn-retry:hover {
  background: #dc2626;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.btn-home {
  background: #3b82f6;
  color: white;
}

.btn-home:hover {
  background: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-reset {
  background: #f3f4f6;
  color: #6b7280;
}

.btn-reset:hover {
  background: #e5e7eb;
  color: #374151;
}
</style>
