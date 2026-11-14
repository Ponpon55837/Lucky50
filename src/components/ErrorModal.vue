<script setup lang="ts">
import { ref, computed } from 'vue'
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import type { ErrorAction } from '@/composables/useErrorHandler'

interface Props {
  modelValue?: boolean
  title?: string
  message?: string
  details?: string
  showDetails?: boolean
  closable?: boolean
  actions?: ErrorAction[]
}

// Props with defaults
const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  title: '發生錯誤',
  message: '',
  details: undefined,
  showDetails: false,
  closable: true,
  actions: undefined,
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
}>()

// State
const isDetailsVisible = ref(props.showDetails)

// Computed
const defaultActions = computed<ErrorAction[]>(() => [
  {
    label: '確定',
    variant: 'primary',
    action: closeModal,
  },
])

const finalActions = computed(() => props.actions || defaultActions.value)

const hasDetails = computed(() => Boolean(props.details))

// Methods
function closeModal() {
  emit('update:modelValue', false)
  emit('close')
}

async function handleAction(action: ErrorAction) {
  try {
    await action.action()
    closeModal()
  } catch (error) {
    console.error('Error executing action:', error)
  }
}

function toggleDetails() {
  isDetailsVisible.value = !isDetailsVisible.value
}

function getButtonClass(variant?: string) {
  const baseClass = 'action-button'
  switch (variant) {
    case 'primary':
      return `${baseClass} action-button-primary`
    case 'danger':
      return `${baseClass} action-button-danger`
    case 'secondary':
      return `${baseClass} action-button-secondary`
    default:
      return `${baseClass} action-button-default`
  }
}
</script>

<template>
  <Transition name="modal-fade">
    <div
      v-if="modelValue"
      class="modal-overlay"
      @click.self="closable && closeModal()"
    >
      <Transition name="modal-scale">
        <div
          v-if="modelValue"
          class="modal-card"
        >
          <!-- Header -->
          <div class="modal-header">
            <!-- Error Icon -->
            <ExclamationTriangleIcon class="error-icon" />

            <!-- Title -->
            <h2 class="modal-title">
              {{ title }}
            </h2>
          </div>

          <!-- Body -->
          <div class="modal-body">
            <p class="error-message">
              {{ message }}
            </p>

            <!-- Details Section -->
            <div
              v-if="hasDetails"
              class="details-section"
            >
              <button
                class="details-toggle"
                @click="toggleDetails"
              >
                {{ isDetailsVisible ? '隱藏詳情' : '顯示詳情' }}
              </button>
              <div
                v-if="isDetailsVisible"
                class="error-details"
              >
                {{ details }}
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="modal-footer">
            <button
              v-for="(action, index) in finalActions"
              :key="index"
              :class="getButtonClass(action.variant)"
              @click="handleAction(action)"
            >
              {{ action.label }}
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<style scoped>
.modal-overlay {
  @apply fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4;
}

.modal-card {
  @apply flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card;
}

.modal-header {
  @apply flex items-center gap-3 border-b border-line p-6;
}

.error-icon {
  @apply h-6 w-6 shrink-0 text-danger;
}

.modal-title {
  @apply m-0 flex-1 font-serif text-xl font-bold text-ink;
}

.modal-body {
  @apply flex-1 overflow-y-auto p-6;
}

.error-message {
  @apply mb-4 leading-relaxed text-ink-2;
}

.details-section {
  @apply mt-4;
}

.details-toggle {
  @apply mb-2 p-0 text-sm text-ink-3 underline underline-offset-2 transition-colors hover:text-ink;
}

.error-details {
  @apply max-h-48 overflow-y-auto whitespace-pre-wrap break-all rounded-[10px] border border-line bg-raised p-3 font-mono text-xs text-ink-2;
}

.modal-footer {
  @apply flex justify-end gap-3 border-t border-line p-6;
}

.action-button {
  @apply inline-flex h-9 items-center justify-center rounded-full px-4 text-[13px] font-medium transition-colors duration-150;
}

.action-button-primary {
  @apply bg-seal text-seal-on hover:bg-seal-deep;
}

.action-button-secondary,
.action-button-default {
  @apply border border-line-strong text-ink hover:bg-raised;
}

.action-button-danger {
  @apply bg-danger text-seal-on hover:bg-danger/90;
}

/* Transition animations */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-scale-enter-active,
.modal-scale-leave-active {
  transition:
    opacity 0.3s var(--ease-out),
    transform 0.3s var(--ease-out);
}

.modal-scale-enter-from,
.modal-scale-leave-to {
  opacity: 0;
  transform: scale(0.96);
}
</style>
