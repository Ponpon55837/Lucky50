<template>
  <div class="user-settings-container">
    <div class="settings-header">
      <CogIcon class="header-icon" />
      <h2 class="header-title">個人設定</h2>
      <div class="header-actions">
        <button class="action-btn export-btn" @click="exportSettings">
          <ArrowDownTrayIcon class="btn-icon" />
          匯出
        </button>
        <button class="action-btn import-btn" @click="triggerImport">
          <ArrowUpTrayIcon class="btn-icon" />
          匯入
        </button>
        <button class="action-btn reset-btn" @click="resetToDefaults">
          <ArrowPathIcon class="btn-icon" />
          重置
        </button>
      </div>
    </div>

    <div class="settings-sections">
      <!-- 風險承受度設定 -->
      <div class="settings-section">
        <h3 class="section-title">
          <ShieldCheckIcon class="section-icon" />
          風險承受度
        </h3>
        <div class="risk-options">
          <label v-for="option in riskOptions" :key="option.value" class="risk-option">
            <input
              v-model="localSettings.riskTolerance"
              type="radio"
              :value="option.value"
              @change="saveSettings"
            />
            <div class="risk-content">
              <span class="risk-label">{{ option.label }}</span>
              <span class="risk-description">{{ option.description }}</span>
            </div>
          </label>
        </div>
      </div>

      <!-- 權重調整 -->
      <div class="settings-section">
        <h3 class="section-title">
          <ScaleIcon class="section-icon" />
          計算權重調整
        </h3>
        <div class="weights-container">
          <div
            v-for="(weight, key) in localSettings.adjustableWeights"
            :key="key"
            class="weight-item"
          >
            <label class="weight-label">{{ getWeightLabel(key) }}</label>
            <div class="weight-controls">
              <input
                v-model="localSettings.adjustableWeights[key]"
                type="range"
                min="0"
                max="1"
                step="0.05"
                class="weight-slider"
                @input="handleWeightChange"
              />
              <span class="weight-value">{{ (weight * 100).toFixed(0) }}%</span>
            </div>
          </div>
        </div>
        <div class="weight-summary">
          <span class="weight-total">總計: {{ (totalWeight * 100).toFixed(0) }}%</span>
          <button v-if="!isWeightValid" class="normalize-btn" @click="normalizeWeights">
            正規化權重
          </button>
          <button class="recommend-btn" @click="useRecommendedWeights">使用建議權重</button>
        </div>
      </div>

      <!-- 功能設定 -->
      <div class="settings-section">
        <h3 class="section-title">
          <CogIcon class="section-icon" />
          功能設定
        </h3>
        <div class="feature-toggles">
          <label v-for="(feature, key) in featureSettings" :key="key" class="feature-toggle">
            <input
              v-model="localSettings.customSettings[key]"
              type="checkbox"
              @change="saveSettings"
            />
            <span class="feature-label">{{ feature.label }}</span>
            <span class="feature-description">{{ feature.description }}</span>
          </label>
        </div>
      </div>

      <!-- 語言與通知設定 -->
      <div class="settings-section">
        <h3 class="section-title">
          <LanguageIcon class="section-icon" />
          語言與通知
        </h3>
        <div class="misc-settings">
          <div class="setting-row">
            <label>偏好語言</label>
            <select v-model="localSettings.customSettings.preferredLanguage" @change="saveSettings">
              <option value="zh-TW">繁體中文</option>
              <option value="zh-CN">简体中文</option>
              <option value="en">English</option>
            </select>
          </div>
          <div class="setting-row">
            <label>通知頻率</label>
            <select
              v-model="localSettings.customSettings.notificationFrequency"
              @change="saveSettings"
            >
              <option value="never">從不</option>
              <option value="weekly">每週</option>
              <option value="daily">每日</option>
            </select>
          </div>
          <div class="setting-row">
            <label>資料保留天數</label>
            <input
              v-model="localSettings.customSettings.dataRetentionDays"
              type="number"
              min="1"
              max="365"
              class="number-input"
              @change="saveSettings"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 匯入檔案輸入（隱藏） -->
    <input
      ref="fileInput"
      type="file"
      accept=".json"
      class="hidden-input"
      @change="handleFileImport"
    />

    <!-- 儲存狀態提示 -->
    <Transition name="save-status">
      <div v-if="saveStatus" :class="['save-status', saveStatus.type]">
        <CheckCircleIcon v-if="saveStatus.type === 'success'" class="status-icon" />
        <ExclamationTriangleIcon v-else class="status-icon" />
        {{ saveStatus.message }}
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  CogIcon,
  ShieldCheckIcon,
  ScaleIcon,
  LanguageIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/vue/24/outline'
import { UserEmpowermentService } from '@/services/userEmpowerment'
import type { UserEmpowerment } from '@/types'

interface SaveStatus {
  type: 'success' | 'error'
  message: string
}

const localSettings = ref<UserEmpowerment>(UserEmpowermentService.getUserSettings())
const saveStatus = ref<SaveStatus | null>(null)
const fileInput = ref<HTMLInputElement>()

const riskOptions = [
  {
    value: 'conservative',
    label: '保守型',
    description: '重視資本保全，偏好低風險策略',
  },
  {
    value: 'moderate',
    label: '穩健型',
    description: '平衡風險與回報，追求穩定成長',
  },
  {
    value: 'aggressive',
    label: '積極型',
    description: '願意承擔較高風險以追求更高回報',
  },
]

const featureSettings = {
  enableFortuneAnalysis: {
    label: '運勢分析',
    description: '啟用基於農民曆的個人運勢分析',
  },
  enableEducationalContent: {
    label: '教育內容',
    description: '顯示相關的投資和農民曆知識',
  },
  enableDisclaimerReminder: {
    label: '免責聲明提醒',
    description: '定期顯示風險警告和免責聲明',
  },
  showAdvancedFeatures: {
    label: '進階功能',
    description: '開啟專業級分析工具和設定選項',
  },
}

// 計算權重總和
const totalWeight = computed(() => {
  return Object.values(localSettings.value.adjustableWeights).reduce(
    (sum, weight) => sum + weight,
    0
  )
})

// 檢查權重是否有效
const isWeightValid = computed(() => {
  return Math.abs(totalWeight.value - 1.0) < 0.01
})

// 獲取權重標籤
const getWeightLabel = (key: string): string => {
  const labels: { [key: string]: string } = {
    zodiacWeight: '生肖影響',
    lunarWeight: '農民曆影響',
    marketWeight: '市場數據',
    personalWeight: '個人八字',
    seasonalWeight: '季節因素',
  }
  return labels[key] || key
}

// 處理權重變化
const handleWeightChange = () => {
  if (isWeightValid.value) {
    saveSettings()
  }
}

// 正規化權重
const normalizeWeights = () => {
  localSettings.value.adjustableWeights = UserEmpowermentService.normalizeWeights(
    localSettings.value.adjustableWeights
  )
  saveSettings()
}

// 使用建議權重
const useRecommendedWeights = () => {
  localSettings.value.adjustableWeights = UserEmpowermentService.getWeightRecommendations(
    localSettings.value.riskTolerance
  )
  saveSettings()
}

// 儲存設定
const saveSettings = () => {
  try {
    UserEmpowermentService.saveUserSettings(localSettings.value)
    showSaveStatus('success', '設定已儲存')
  } catch {
    showSaveStatus('error', '儲存失敗')
  }
}

// 顯示儲存狀態
const showSaveStatus = (type: 'success' | 'error', message: string) => {
  saveStatus.value = { type, message }
  setTimeout(() => {
    saveStatus.value = null
  }, 3000)
}

// 匯出設定
const exportSettings = () => {
  try {
    const settingsJson = UserEmpowermentService.exportSettings()
    const blob = new Blob([settingsJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `lucky50-settings-${new Date().toISOString().split('T')[0]}.json`
    a.click()

    URL.revokeObjectURL(url)
    showSaveStatus('success', '設定已匯出')
  } catch {
    showSaveStatus('error', '匯出失敗')
  }
}

// 觸發匯入
const triggerImport = () => {
  fileInput.value?.click()
}

// 處理檔案匯入
const handleFileImport = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  const reader = new FileReader()
  reader.onload = e => {
    try {
      const content = e.target?.result as string
      const success = UserEmpowermentService.importSettings(content)

      if (success) {
        localSettings.value = UserEmpowermentService.getUserSettings()
        showSaveStatus('success', '設定已匯入')
      } else {
        showSaveStatus('error', '匯入失敗：檔案格式錯誤')
      }
    } catch {
      showSaveStatus('error', '匯入失敗：檔案讀取錯誤')
    }
  }

  reader.readAsText(file)
  target.value = '' // 重置檔案輸入
}

// 重置為預設值
const resetToDefaults = () => {
  if (confirm('確定要重置所有設定為預設值嗎？此操作無法復原。')) {
    UserEmpowermentService.resetToDefaults()
    localSettings.value = UserEmpowermentService.getUserSettings()
    showSaveStatus('success', '設定已重置')
  }
}

// 監聽風險承受度變化
watch(
  () => localSettings.value.riskTolerance,
  () => {
    // 當風險承受度改變時，建議使用對應的權重
    const recommended = UserEmpowermentService.getWeightRecommendations(
      localSettings.value.riskTolerance
    )

    if (
      confirm(`已切換至${getRiskLabel(localSettings.value.riskTolerance)}，是否要調整為建議權重？`)
    ) {
      localSettings.value.adjustableWeights = recommended
      saveSettings()
    }
  }
)

// 獲取風險標籤
const getRiskLabel = (risk: string): string => {
  const option = riskOptions.find(opt => opt.value === risk)
  return option?.label || risk
}

// 組件掛載時載入設定
onMounted(() => {
  localSettings.value = UserEmpowermentService.getUserSettings()
})
</script>

<style scoped>
.user-settings-container {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6;
}

.settings-header {
  @apply flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700;
}

.header-icon {
  @apply h-6 w-6 text-blue-500 dark:text-blue-400;
}

.header-title {
  @apply text-xl font-semibold text-gray-900 dark:text-gray-100 ml-2;
}

.header-actions {
  @apply flex gap-2;
}

.action-btn {
  @apply flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors;
}

.export-btn {
  @apply bg-green-500 text-white hover:bg-green-600;
}

.import-btn {
  @apply bg-blue-500 text-white hover:bg-blue-600;
}

.reset-btn {
  @apply bg-gray-500 text-white hover:bg-gray-600;
}

.btn-icon {
  @apply h-4 w-4;
}

.settings-sections {
  @apply space-y-6;
}

.settings-section {
  @apply border border-gray-200 dark:border-gray-700 rounded-lg p-4;
}

.section-title {
  @apply flex items-center gap-2 text-lg font-medium text-gray-900 dark:text-gray-100 mb-4;
}

.section-icon {
  @apply h-5 w-5 text-blue-500 dark:text-blue-400;
}

/* 風險選項 */
.risk-options {
  @apply space-y-3;
}

.risk-option {
  @apply flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors;
  @apply border-gray-200 hover:border-blue-300 dark:border-gray-700 dark:hover:border-blue-600;
}

.risk-option input[type='radio'] {
  @apply mt-1;
}

.risk-content {
  @apply flex flex-col;
}

.risk-label {
  @apply font-medium text-gray-900 dark:text-gray-100;
}

.risk-description {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

/* 權重調整 */
.weights-container {
  @apply space-y-4 mb-4;
}

.weight-item {
  @apply flex items-center gap-4;
}

.weight-label {
  @apply text-sm font-medium text-gray-700 dark:text-gray-300 w-24;
}

.weight-controls {
  @apply flex items-center gap-3 flex-1;
}

.weight-slider {
  @apply flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700;
}

.weight-slider::-webkit-slider-thumb {
  @apply appearance-none w-4 h-4 bg-blue-500 rounded-full cursor-pointer;
}

.weight-slider::-moz-range-thumb {
  @apply w-4 h-4 bg-blue-500 rounded-full cursor-pointer border-0;
}

.weight-value {
  @apply text-sm font-medium text-gray-700 dark:text-gray-300 w-12 text-right;
}

.weight-summary {
  @apply flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700;
}

.weight-total {
  @apply font-medium text-gray-900 dark:text-gray-100;
}

.normalize-btn,
.recommend-btn {
  @apply px-3 py-1 rounded-lg text-sm font-medium transition-colors ml-3;
}

.normalize-btn {
  @apply bg-orange-500 text-white hover:bg-orange-600;
}

.recommend-btn {
  @apply bg-blue-500 text-white hover:bg-blue-600;
}

/* 功能設定 */
.feature-toggles {
  @apply space-y-3;
}

.feature-toggle {
  @apply flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700;
}

.feature-toggle input[type='checkbox'] {
  @apply mt-1;
}

.feature-label {
  @apply font-medium text-gray-900 dark:text-gray-100;
}

.feature-description {
  @apply text-sm text-gray-600 dark:text-gray-400 block mt-1;
}

/* 其他設定 */
.misc-settings {
  @apply space-y-4;
}

.setting-row {
  @apply flex items-center justify-between;
}

.setting-row label {
  @apply text-sm font-medium text-gray-700 dark:text-gray-300;
}

.setting-row select,
.setting-row input.number-input {
  @apply px-3 py-2 border border-gray-300 rounded-lg text-sm;
  @apply dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100;
}

/* 隱藏輸入 */
.hidden-input {
  @apply hidden;
}

/* 儲存狀態 */
.save-status {
  @apply fixed bottom-4 right-4 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg;
  @apply transition-all duration-300 transform;
}

.save-status.success {
  @apply bg-green-500 text-white;
}

.save-status.error {
  @apply bg-red-500 text-white;
}

.status-icon {
  @apply h-5 w-5;
}

/* 動畫 */
.save-status-enter-active,
.save-status-leave-active {
  transition: all 0.3s ease;
}

.save-status-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.save-status-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
