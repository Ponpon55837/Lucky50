<template>
  <div class="disclaimer-container" :class="disclaimerClass">
    <div class="disclaimer-header">
      <ExclamationTriangleIcon class="disclaimer-icon" :class="iconClass" />
      <h3 class="disclaimer-title">
        {{ title }}
      </h3>
      <button
        v-if="disclaimer.requiresAcknowledgment"
        class="expand-button"
        :aria-expanded="isExpanded"
        @click="toggleExpanded"
      >
        <ChevronDownIcon class="chevron-icon" />
      </button>
    </div>

    <Transition name="disclaimer-content">
      <div v-show="isExpanded || !disclaimer.requiresAcknowledgment" class="disclaimer-content">
        <ul class="disclaimer-list">
          <li v-for="(message, index) in disclaimer.messages" :key="index" class="disclaimer-item">
            <span class="bullet-point">{{ index + 1 }}.</span>
            <span class="message-text">{{ message }}</span>
          </li>
        </ul>

        <div v-if="disclaimer.requiresAcknowledgment" class="disclaimer-actions">
          <label class="acknowledgment-label">
            <input
              v-model="isAcknowledged"
              type="checkbox"
              class="acknowledgment-checkbox"
              @change="handleAcknowledgment"
            />
            <span>我已閱讀並同意上述免責聲明</span>
          </label>
        </div>

        <div class="disclaimer-footer">
          <small class="disclaimer-timestamp">最後更新：{{ lastUpdated }}</small>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ExclamationTriangleIcon, ChevronDownIcon } from '@heroicons/vue/24/outline'
import type { DisclaimerLevel } from '@/types'

interface Props {
  disclaimer: DisclaimerLevel
  alwaysExpanded?: boolean
}

interface Emits {
  (e: 'acknowledged', value: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  alwaysExpanded: false,
})

const emit = defineEmits<Emits>()

const isExpanded = ref(props.alwaysExpanded)
const isAcknowledged = ref(false)

// 根據免責聲明級別計算樣式類
const disclaimerClass = computed(() => `disclaimer-${props.disclaimer.level}`)

const iconClass = computed(() => `icon-${props.disclaimer.level}`)

const title = computed(() => {
  const titles = {
    low: '注意事項',
    medium: '重要提醒',
    high: '風險警告',
    critical: '重要免責聲明',
  }
  return titles[props.disclaimer.level]
})

const lastUpdated = computed(() => {
  const now = new Date()
  return now.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})

const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}

const handleAcknowledgment = () => {
  emit('acknowledged', isAcknowledged.value)
}

// 監聽 alwaysExpanded 變化
watch(
  () => props.alwaysExpanded,
  newValue => {
    isExpanded.value = newValue
  }
)
</script>

<style scoped>
.disclaimer-container {
  @apply rounded-lg border p-4 mb-4 transition-all duration-300;
}

.disclaimer-low {
  @apply border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950;
}

.disclaimer-medium {
  @apply border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950;
}

.disclaimer-high {
  @apply border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950;
}

.disclaimer-critical {
  @apply border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950;
}

.disclaimer-header {
  @apply flex items-center gap-3;
}

.disclaimer-icon {
  @apply h-5 w-5 flex-shrink-0;
}

.icon-low {
  @apply text-blue-500 dark:text-blue-400;
}

.icon-medium {
  @apply text-yellow-500 dark:text-yellow-400;
}

.icon-high {
  @apply text-orange-500 dark:text-orange-400;
}

.icon-critical {
  @apply text-red-500 dark:text-red-400;
}

.disclaimer-title {
  @apply text-sm font-medium text-gray-900 dark:text-gray-100;
}

.expand-button {
  @apply ml-auto p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors;
}

.chevron-icon {
  @apply h-4 w-4 transition-transform duration-200;
}

.expand-button[aria-expanded='true'] .chevron-icon {
  @apply rotate-180;
}

.disclaimer-content {
  @apply mt-3;
}

.disclaimer-enter-active,
.disclaimer-leave-active {
  transition: all 0.3s ease;
}

.disclaimer-enter-from,
.disclaimer-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.disclaimer-list {
  @apply space-y-2;
}

.disclaimer-item {
  @apply flex items-start gap-3;
}

.bullet-point {
  @apply text-sm font-medium text-gray-600 dark:text-gray-400 flex-shrink-0 w-5;
}

.message-text {
  @apply text-sm text-gray-700 dark:text-gray-300 leading-relaxed;
}

.disclaimer-actions {
  @apply mt-4 border-t pt-4 border-gray-200 dark:border-gray-700;
}

.disclaimer-footer {
  @apply mt-3 text-right;
}

.acknowledgment-label {
  @apply flex items-start gap-3 cursor-pointer select-none;
}

.acknowledgment-checkbox {
  @apply mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800;
}

.disclaimer-timestamp {
  @apply text-xs text-gray-500 dark:text-gray-400;
}
</style>
