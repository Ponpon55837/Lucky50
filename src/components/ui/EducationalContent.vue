<template>
  <div class="educational-content-container">
    <div class="content-header">
      <BookOpenIcon class="header-icon" />
      <h2 class="header-title">知識學習</h2>
      <div class="difficulty-filter">
        <button
          v-for="level in difficultyLevels"
          :key="level.value"
          :class="['difficulty-btn', { active: selectedDifficulty === level.value }]"
          @click="selectedDifficulty = level.value"
        >
          {{ level.label }}
        </button>
      </div>
    </div>

    <div class="content-categories">
      <button
        v-for="category in categories"
        :key="category.value"
        :class="['category-btn', { active: selectedCategory === category.value }]"
        @click="selectedCategory = category.value"
      >
        <component :is="category.icon" class="category-icon" />
        {{ category.label }}
      </button>
    </div>

    <div class="content-list">
      <TransitionGroup name="content-item" tag="div">
        <div
          v-for="item in filteredContent"
          :key="item.title"
          class="content-item"
          @click="selectContent(item)"
        >
          <div class="content-meta">
            <span :class="['difficulty-badge', item.difficulty]">
              {{ getDifficultyLabel(item.difficulty) }}
            </span>
            <span class="category-badge">{{ getCategoryLabel(content.category) }}</span>
          </div>

          <h3 class="content-title">
            {{ item.title }}
          </h3>
          <p class="content-preview">
            {{ getContentPreview(item.content) }}
          </p>

          <div class="content-footer">
            <div class="related-topics">
              <span v-for="topic in item.relatedTopics" :key="topic" class="topic-tag">
                {{ topic }}
              </span>
            </div>
            <ChevronRightIcon class="expand-icon" />
          </div>
        </div>
      </TransitionGroup>
    </div>

    <!-- 內容詳情模態框 -->
    <Transition name="modal">
      <div v-if="selectedContent" class="modal-overlay" @click="closeModal">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <div class="modal-meta">
              <span :class="['difficulty-badge', selectedContent.difficulty]">
                {{ getDifficultyLabel(selectedContent.difficulty) }}
              </span>
              <span class="category-badge">{{ getCategoryLabel(selectedContent.category) }}</span>
            </div>
            <button class="close-btn" @click="closeModal">
              <XMarkIcon class="close-icon" />
            </button>
          </div>

          <h2 class="modal-title">
            {{ selectedContent.title }}
          </h2>

          <div class="modal-body">
            <div class="content-text">
              <p v-for="(line, index) in formattedContent" :key="index" class="content-line">
                {{ line }}
              </p>
            </div>

            <div v-if="selectedContent.relatedTopics.length > 0" class="related-section">
              <h3>相關主題</h3>
              <div class="related-topics-list">
                <span v-for="topic in selectedContent.relatedTopics" :key="topic" class="topic-tag">
                  {{ topic }}
                </span>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="helpful-btn" @click="markAsHelpful">
              <HandThumbUpIcon class="helpful-icon" />
              有幫助
            </button>
            <button class="share-btn" @click="shareContent">
              <ShareIcon class="share-icon" />
              分享
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  BookOpenIcon,
  ChevronRightIcon,
  XMarkIcon,
  HandThumbUpIcon,
  ShareIcon,
  CalendarIcon,
  ChartBarIcon,
  ShieldCheckIcon,
} from '@heroicons/vue/24/outline'
import type { EducationalContent } from '@/types'

interface Props {
  content: EducationalContent[]
  initialDifficulty?: 'beginner' | 'intermediate' | 'advanced'
}

const props = withDefaults(defineProps<Props>(), {
  initialDifficulty: 'beginner',
})

const selectedDifficulty = ref<'beginner' | 'intermediate' | 'advanced'>(props.initialDifficulty)
const selectedCategory = ref<'lunar-calendar' | 'investment' | 'risk-management' | 'all'>('all')
const selectedContent = ref<EducationalContent | null>(null)

const difficultyLevels = [
  { value: 'beginner', label: '基礎' },
  { value: 'intermediate', label: '進階' },
  { value: 'advanced', label: '專業' },
]

const categories = [
  { value: 'all', label: '全部', icon: BookOpenIcon },
  { value: 'lunar-calendar', label: '農民曆', icon: CalendarIcon },
  { value: 'investment', label: '投資', icon: ChartBarIcon },
  { value: 'risk-management', label: '風險管理', icon: ShieldCheckIcon },
]

// 過濾內容
const filteredContent = computed(() => {
  return props.content.filter(item => {
    const difficultyMatch =
      selectedDifficulty.value === 'all' || item.difficulty === selectedDifficulty.value
    const categoryMatch =
      selectedCategory.value === 'all' || item.category === selectedCategory.value
    return difficultyMatch && categoryMatch
  })
})

// 格式化內容（安全的文本處理）
const formattedContent = computed(() => {
  if (!selectedContent.value) return []

  const content = selectedContent.value.content
  const lines = content.split('\n')

  return lines.map(line => {
    // 處理粗體
    line = line.replace(/\*\*(.*?)\*\*/g, '$1')
    // 處理斜體
    line = line.replace(/\*(.*?)\*/g, '$1')
    // 處理編號列表
    line = line.replace(/^(\d+\.\s)/, '$1')

    return line
  })
})

// 獲取難度標籤
const getDifficultyLabel = (difficulty: string): string => {
  const labels = {
    beginner: '基礎',
    intermediate: '進階',
    advanced: '專業',
  }
  return labels[difficulty as keyof typeof labels] || difficulty
}

// 獲取分類標籤
const getCategoryLabel = (category: string): string => {
  const labels = {
    'lunar-calendar': '農民曆',
    investment: '投資',
    'risk-management': '風險管理',
  }
  return labels[category as keyof typeof labels] || category
}

// 獲取內容預覽
const getContentPreview = (content: string): string => {
  const cleanText = content
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/\d+\.\s/g, '')
  return cleanText.length > 100 ? cleanText.substring(0, 100) + '...' : cleanText
}

// 選擇內容
const selectContent = (content: EducationalContent) => {
  selectedContent.value = content
}

// 關閉模態框
const closeModal = () => {
  selectedContent.value = null
}

// 標記為有幫助
const markAsHelpful = () => {
  // TODO: 實作統計功能
  console.log('Content marked as helpful:', selectedContent.value?.title)
  closeModal()
}

// 分享內容
const shareContent = async () => {
  if (!selectedContent.value) return

  const shareData = {
    title: selectedContent.value.title,
    text: getContentPreview(selectedContent.value.content),
    url: window.location.href,
  }

  try {
    if (navigator.share) {
      await navigator.share(shareData)
    } else {
      // 後備方案：複製到剪貼板
      await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`)
    }
  } catch (error) {
    console.error('Share failed:', error)
  }
}

// 監聽難度變化
watch(selectedDifficulty, newDifficulty => {
  // 可以發送分析事件
  console.log('Difficulty changed to:', newDifficulty)
})
</script>

<style scoped>
.educational-content-container {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6;
}

.content-header {
  @apply flex items-center justify-between mb-6;
}

.header-icon {
  @apply h-6 w-6 text-blue-500 dark:text-blue-400;
}

.header-title {
  @apply text-xl font-semibold text-gray-900 dark:text-gray-100 ml-2;
}

.difficulty-filter {
  @apply flex gap-2;
}

.difficulty-btn {
  @apply px-3 py-1 rounded-full text-sm font-medium transition-colors;
  @apply bg-gray-100 text-gray-600 hover:bg-gray-200;
  @apply dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600;
}

.difficulty-btn.active {
  @apply bg-blue-500 text-white hover:bg-blue-600;
}

.content-categories {
  @apply flex gap-3 mb-6 flex-wrap;
}

.category-btn {
  @apply flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors;
  @apply bg-gray-50 text-gray-700 hover:bg-gray-100;
  @apply dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600;
}

.category-btn.active {
  @apply bg-blue-100 text-blue-700;
  @apply dark:bg-blue-900 dark:text-blue-300;
}

.category-icon {
  @apply h-4 w-4;
}

.content-list {
  @apply space-y-4;
}

.content-item {
  @apply p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md;
  @apply border-gray-200 hover:border-blue-300;
  @apply dark:border-gray-700 dark:hover:border-blue-600;
}

.content-meta {
  @apply flex items-center gap-2 mb-2;
}

.difficulty-badge {
  @apply px-2 py-1 rounded text-xs font-medium;
}

.difficulty-badge.beginner {
  @apply bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300;
}

.difficulty-badge.intermediate {
  @apply bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300;
}

.difficulty-badge.advanced {
  @apply bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300;
}

.category-badge {
  @apply px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium;
  @apply dark:bg-blue-900 dark:text-blue-300;
}

.content-title {
  @apply text-lg font-medium text-gray-900 dark:text-gray-100 mb-2;
}

.content-preview {
  @apply text-gray-600 dark:text-gray-400 text-sm line-clamp-2;
}

.content-footer {
  @apply flex items-center justify-between mt-3;
}

.related-topics {
  @apply flex gap-2 flex-wrap;
}

.topic-tag {
  @apply px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs;
  @apply dark:bg-gray-700 dark:text-gray-400;
}

.expand-icon {
  @apply h-4 w-4 text-gray-400;
}

/* 內容項目動畫 */
.content-item-enter-active,
.content-item-leave-active {
  transition: all 0.3s ease;
}

.content-item-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.content-item-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.content-item-move {
  transition: transform 0.3s ease;
}

/* 模態框樣式 */
.modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50;
}

.modal-content {
  @apply bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto;
}

.modal-header {
  @apply flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700;
}

.modal-meta {
  @apply flex items-center gap-2;
}

.close-btn {
  @apply p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors;
}

.close-icon {
  @apply h-5 w-5 text-gray-500;
}

.modal-title {
  @apply text-2xl font-bold text-gray-900 dark:text-gray-100 p-6 pb-0;
}

.modal-body {
  @apply p-6;
}

.content-text {
  @apply prose prose-sm max-w-none dark:prose-invert;
  @apply text-gray-700 dark:text-gray-300 leading-relaxed;
}

.related-section {
  @apply mt-6 pt-6 border-t border-gray-200 dark:border-gray-700;
}

.related-section h3 {
  @apply text-sm font-medium text-gray-900 dark:text-gray-100 mb-3;
}

.related-topics-list {
  @apply flex gap-2 flex-wrap;
}

.modal-footer {
  @apply flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700;
}

.helpful-btn,
.share-btn {
  @apply flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors;
}

.helpful-btn {
  @apply bg-green-500 text-white hover:bg-green-600;
}

.share-btn {
  @apply bg-blue-500 text-white hover:bg-blue-600;
}

.helpful-icon,
.share-icon {
  @apply h-4 w-4;
}

/* 模態框動畫 */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from {
  opacity: 0;
}

.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-content {
  transition: all 0.3s ease;
}

.modal-enter-from .modal-content {
  opacity: 0;
  transform: scale(0.9);
}

.modal-leave-to .modal-content {
  opacity: 0;
  transform: scale(0.9);
}
</style>
