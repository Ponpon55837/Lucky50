<script setup lang="ts">
import { ref, computed } from 'vue'

// Types
interface ErrorAction {
  label: string
  type?: 'primary' | 'secondary' | 'danger'
  action: () => void | Promise<void>
}

interface Props {
  modelValue: boolean
  title?: string
  message: string
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
    type: 'primary',
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

function getButtonClass(type?: string) {
  const baseClass = 'action-button'
  switch (type) {
    case 'primary':
      return `${baseClass} action-button-primary`
    case 'danger':
      return `${baseClass} action-button-danger`
    case 'secondary':
    default:
      return `${baseClass} action-button-secondary`
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
            <svg
              class="error-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>

            <!-- Title -->
            <h2 class="modal-title">
              {{ title }}
            </h2>

            <!-- Close Button -->
            <button
              v-if="closable"
              class="close-button"
              @click="closeModal"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <line
                  x1="18"
                  y1="6"
                  x2="6"
                  y2="18"
                />
                <line
                  x1="6"
                  y1="6"
                  x2="18"
                  y2="18"
                />
              </svg>
            </button>
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
              :class="getButtonClass(action.type)"
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
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}

.modal-card {
  background: white;
  border-radius: 1rem;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-width: 32rem;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.error-icon {
  width: 3rem;
  height: 3rem;
  color: #ef4444;
  flex-shrink: 0;
}

.modal-title {
  flex: 1;
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.close-button {
  width: 2rem;
  height: 2rem;
  border: none;
  background: none;
  color: #6b7280;
  cursor: pointer;
  border-radius: 0.375rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.close-button:hover {
  background-color: #f3f4f6;
  color: #111827;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.error-message {
  color: #374151;
  line-height: 1.5;
  margin-bottom: 1rem;
}

.details-section {
  margin-top: 1rem;
}

.details-toggle {
  background: none;
  border: none;
  color: #3b82f6;
  cursor: pointer;
  font-size: 0.875rem;
  padding: 0;
  text-decoration: underline;
  margin-bottom: 0.5rem;
}

.details-toggle:hover {
  color: #2563eb;
}

.error-details {
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 0.75rem;
  font-size: 0.875rem;
  color: #6b7280;
  font-family: 'Courier New', monospace;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 12rem;
  overflow-y: auto;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.action-button {
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.action-button-primary {
  background-color: #3b82f6;
  color: white;
}

.action-button-primary:hover {
  background-color: #2563eb;
}

.action-button-secondary {
  background-color: #f3f4f6;
  color: #374151;
}

.action-button-secondary:hover {
  background-color: #e5e7eb;
}

.action-button-danger {
  background-color: #ef4444;
  color: white;
}

.action-button-danger:hover {
  background-color: #dc2626;
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
  transition: all 0.3s ease;
}

.modal-scale-enter-from,
.modal-scale-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>
