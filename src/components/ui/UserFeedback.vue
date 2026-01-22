<template>
  <div class="feedback-container">
    <!-- 回饋觸發按鈕 -->
    <button
      v-if="!showFeedbackForm && shouldShowFeedbackButton"
      class="feedback-trigger"
      @click="openFeedbackForm"
    >
      <ChatBubbleLeftRightIcon class="trigger-icon" />
      對今日運勢給予回饋
    </button>

    <!-- 回饋表單 -->
    <Transition name="feedback-form">
      <div
        v-if="showFeedbackForm"
        class="feedback-form"
      >
        <div class="form-header">
          <h3 class="form-title">
            <StarIcon class="title-icon" />
            運勢回饋
          </h3>
          <button
            class="close-btn"
            @click="closeFeedbackForm"
          >
            <XMarkIcon class="close-icon" />
          </button>
        </div>

        <div class="form-content">
          <!-- 運勢資訊 -->
          <div
            v-if="fortuneData"
            class="fortune-info"
          >
            <div class="info-row">
              <span class="info-label">日期：</span>
              <span class="info-value">{{ fortuneData.date }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">投資建議：</span>
              <span
                :class="['info-value', 'recommendation', fortuneData.recommendation.toLowerCase()]"
              >
                {{ getRecommendationLabel(fortuneData.recommendation) }}
              </span>
            </div>
            <div class="info-row">
              <span class="info-label">運勢分數：</span>
              <span class="info-value">{{ fortuneData.overallScore }}/100</span>
            </div>
          </div>

          <!-- 預測準確性 -->
          <div class="rating-section">
            <label class="rating-label">
              <AcademicCapIcon class="label-icon" />
              預測準確性評分
            </label>
            <div class="rating-stars">
              <button
                v-for="star in 5"
                :key="star"
                :class="['star-btn', { active: feedbackData.predictionAccuracy >= star }]"
                @click="setRating('predictionAccuracy', star)"
              >
                <StarIcon class="star-icon" />
              </button>
            </div>
            <span class="rating-description">{{
              getAccuracyDescription(feedbackData.predictionAccuracy)
            }}</span>
          </div>

          <!-- 建議有幫助程度 -->
          <div class="rating-section">
            <label class="rating-label">
              <HandThumbUpIcon class="label-icon" />
              建議有幫助程度
            </label>
            <div class="rating-stars">
              <button
                v-for="star in 5"
                :key="star"
                :class="['star-btn', { active: feedbackData.adviceHelpfulness >= star }]"
                @click="setRating('adviceHelpfulness', star)"
              >
                <StarIcon class="star-icon" />
              </button>
            </div>
            <span class="rating-description">{{
              getHelpfulnessDescription(feedbackData.adviceHelpfulness)
            }}</span>
          </div>

          <!-- 教育價值 -->
          <div class="rating-section">
            <label class="rating-label">
              <BookOpenIcon class="label-icon" />
              教育價值評分
            </label>
            <div class="rating-stars">
              <button
                v-for="star in 5"
                :key="star"
                :class="['star-btn', { active: feedbackData.educationalValue >= star }]"
                @click="setRating('educationalValue', star)"
              >
                <StarIcon class="star-icon" />
              </button>
            </div>
            <span class="rating-description">{{
              getEducationalDescription(feedbackData.educationalValue)
            }}</span>
          </div>

          <!-- 詳細回饋 -->
          <div class="comment-section">
            <label class="comment-label">
              <ChatBubbleLeftRightIcon class="label-icon" />
              詳細回饋（選填）
            </label>
            <textarea
              v-model="feedbackData.comments"
              placeholder="分享您的想法、建議或任何關注..."
              class="comment-textarea"
              rows="4"
            />
            <div class="comment-hint">
              您的回饋將幫助我們改善服務品質
            </div>
          </div>

          <!-- 提交按鈕 -->
          <div class="form-actions">
            <button
              class="cancel-btn"
              @click="closeFeedbackForm"
            >
              稍後再說
            </button>
            <button
              :disabled="!canSubmit"
              class="submit-btn"
              @click="submitFeedback"
            >
              <PaperAirplaneIcon class="submit-icon" />
              提交回饋
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 提交狀態 -->
    <Transition name="submit-status">
      <div
        v-if="submitStatus"
        :class="['submit-status', submitStatus.type]"
      >
        <CheckCircleIcon
          v-if="submitStatus.type === 'success'"
          class="status-icon"
        />
        <ExclamationTriangleIcon
          v-else
          class="status-icon"
        />
        {{ submitStatus.message }}
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  ChatBubbleLeftRightIcon,
  StarIcon,
  XMarkIcon,
  AcademicCapIcon,
  HandThumbUpIcon,
  BookOpenIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/vue/24/outline'
import { UserFeedbackService } from '@/services/userFeedback'
import type { FortuneData, UserFeedback } from '@/types'

interface SubmitStatus {
  type: 'success' | 'error'
  message: string
}

interface Props {
  fortuneData?: FortuneData
  userId?: string
  autoShow?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  fortuneData: undefined,
  userId: '',
  autoShow: false,
})

const emit = defineEmits<{
  feedbackSubmitted: [feedbackId: string]
}>()

const showFeedbackForm = ref(props.autoShow)
const submitStatus = ref<SubmitStatus | null>(null)

const feedbackData = ref<Omit<UserFeedback, 'id' | 'timestamp' | 'userId' | 'fortuneDate'>>({
  predictionAccuracy: 0,
  adviceHelpfulness: 0,
  educationalValue: 0,
  comments: '',
})

// 是否應該顯示回饋按鈕
const shouldShowFeedbackButton = computed(() => {
  if (!props.fortuneData || !props.userId) return false

  return UserFeedbackService.shouldRequestFeedback(props.userId, props.fortuneData.date)
})

// 是否可以提交
const canSubmit = computed(() => {
  return (
    feedbackData.value.predictionAccuracy > 0 &&
    feedbackData.value.adviceHelpfulness > 0 &&
    feedbackData.value.educationalValue > 0
  )
})

// 獲取建議標籤
const getRecommendationLabel = (recommendation: string): string => {
  const labels = {
    BUY: '買進',
    HOLD: '持有',
    SELL: '賣出',
  }
  return labels[recommendation as keyof typeof labels] || recommendation
}

// 獲取準確性描述
const getAccuracyDescription = (rating: number): string => {
  const descriptions = {
    1: '非常不準確',
    2: '不太準確',
    3: '普通',
    4: '相當準確',
    5: '非常準確',
  }
  return descriptions[rating as keyof typeof descriptions] || ''
}

// 獲取有幫助程度描述
const getHelpfulnessDescription = (rating: number): string => {
  const descriptions = {
    1: '完全沒幫助',
    2: '不太有幫助',
    3: '普通',
    4: '相當有幫助',
    5: '非常有幫助',
  }
  return descriptions[rating as keyof typeof descriptions] || ''
}

// 獲取教育價值描述
const getEducationalDescription = (rating: number): string => {
  const descriptions = {
    1: '沒有教育價值',
    2: '教育價值很低',
    3: '普通',
    4: '有教育價值',
    5: '教育價值很高',
  }
  return descriptions[rating as keyof typeof descriptions] || ''
}

// 設定評分
const setRating = (field: keyof typeof feedbackData.value, rating: number) => {
  (feedbackData.value as Record<string, number>)[field] = rating
}

// 打開回饋表單
const openFeedbackForm = () => {
  showFeedbackForm.value = true
  submitStatus.value = null
}

// 關閉回饋表單
const closeFeedbackForm = () => {
  showFeedbackForm.value = false
  // 重置表單
  feedbackData.value = {
    predictionAccuracy: 0,
    adviceHelpfulness: 0,
    educationalValue: 0,
    comments: '',
  }
}

// 提交回饋
const submitFeedback = async () => {
  if (!props.userId || !props.fortuneData || !canSubmit.value) {
    return
  }

  try {
    const feedbackId = UserFeedbackService.submitFeedback({
      userId: props.userId,
      fortuneDate: props.fortuneData.date,
      predictionAccuracy: feedbackData.value.predictionAccuracy,
      adviceHelpfulness: feedbackData.value.adviceHelpfulness,
      comments: feedbackData.value.comments,
    })

    showSubmitStatus('success', '感謝您的回饋！您的意見對我們很重要')
    emit('feedbackSubmitted', feedbackId)

    // 延遲關閉表單
    setTimeout(() => {
      closeFeedbackForm()
    }, 2000)
  } catch {
    showSubmitStatus('error', '回饋提交失敗，請稍後再試')
  }
}

// 顯示提交狀態
const showSubmitStatus = (type: 'success' | 'error', message: string) => {
  submitStatus.value = { type, message }
  setTimeout(() => {
    submitStatus.value = null
  }, 3000)
}

// 監聽 fortuneData 變化
watch(
  () => props.fortuneData,
  newData => {
    if (newData && props.autoShow) {
      openFeedbackForm()
    }
  }
)
</script>

<style scoped>
.feedback-container {
  @apply relative;
}

/* 回饋觸發按鈕 */
.feedback-trigger {
  @apply flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg font-medium;
  @apply hover:bg-blue-600 transition-colors shadow-md;
}

.trigger-icon {
  @apply h-4 w-4;
}

/* 回饋表單 */
.feedback-form {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700;
  @apply max-w-md w-full absolute top-full left-0 mt-2 z-50;
}

.form-header {
  @apply flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700;
}

.form-title {
  @apply flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100;
}

.title-icon {
  @apply h-5 w-5 text-yellow-500;
}

.close-btn {
  @apply p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors;
}

.close-icon {
  @apply h-4 w-4 text-gray-500;
}

.form-content {
  @apply p-4 space-y-4;
}

/* 運勢資訊 */
.fortune-info {
  @apply bg-gray-50 dark:bg-gray-900 rounded-lg p-3 space-y-2;
}

.info-row {
  @apply flex items-center justify-between text-sm;
}

.info-label {
  @apply text-gray-600 dark:text-gray-400;
}

.info-value {
  @apply font-medium text-gray-900 dark:text-gray-100;
}

.recommendation.buy {
  @apply text-green-600 dark:text-green-400;
}

.recommendation.hold {
  @apply text-yellow-600 dark:text-yellow-400;
}

.recommendation.sell {
  @apply text-red-600 dark:text-red-400;
}

/* 評分區塊 */
.rating-section {
  @apply space-y-2;
}

.rating-label {
  @apply flex items-center gap-2 font-medium text-gray-900 dark:text-gray-100;
}

.label-icon {
  @apply h-4 w-4 text-blue-500;
}

.rating-stars {
  @apply flex gap-1;
}

.star-btn {
  @apply p-1 transition-colors;
}

.star-btn:hover .star-icon {
  @apply text-yellow-400;
}

.star-btn.active .star-icon {
  @apply text-yellow-500 fill-current;
}

.star-icon {
  @apply h-6 w-6 text-gray-300 transition-colors;
}

.rating-description {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

/* 評論區塊 */
.comment-section {
  @apply space-y-2;
}

.comment-label {
  @apply flex items-center gap-2 font-medium text-gray-900 dark:text-gray-100;
}

.comment-textarea {
  @apply w-full px-3 py-2 border border-gray-300 rounded-lg;
  @apply dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100;
  @apply focus:ring-2 focus:ring-blue-500 focus:border-transparent;
  @apply resize-none;
}

.comment-hint {
  @apply text-xs text-gray-500 dark:text-gray-400;
}

/* 表單操作 */
.form-actions {
  @apply flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700;
}

.cancel-btn {
  @apply flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium;
  @apply hover:bg-gray-50 transition-colors dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700;
}

.submit-btn {
  @apply flex items-center justify-center gap-2 flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg font-medium;
  @apply hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors;
}

.submit-btn:disabled {
  @apply hover:bg-blue-500;
}

.submit-icon {
  @apply h-4 w-4;
}

/* 提交狀態 */
.submit-status {
  @apply fixed bottom-4 right-4 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg;
  @apply transition-all duration-300;
}

.submit-status.success {
  @apply bg-green-500 text-white;
}

.submit-status.error {
  @apply bg-red-500 text-white;
}

.status-icon {
  @apply h-5 w-5;
}

/* 動畫 */
.feedback-form-enter-active,
.feedback-form-leave-active {
  transition: all 0.3s ease;
}

.feedback-form-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.feedback-form-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.submit-status-enter-active,
.submit-status-leave-active {
  transition: all 0.3s ease;
}

.submit-status-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.submit-status-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
