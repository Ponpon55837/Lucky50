<script setup lang="ts">
import { ref, computed, watch, watchEffect, defineAsyncComponent } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useToast } from '@/composables/useToast'
import type { UserProfile } from '@/types'
import VueDatePicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import {
  getZodiacFromDate,
  getElementFromDate,
  getElementFromName,
  getLuckyColors,
  getLuckyNumbers,
} from '@/utils/zodiac'

const EngineSettingsCard = defineAsyncComponent({
  loader: () => import('@/components/EngineSettingsCard.vue'),
  loadingComponent: () => import('@/components/ui/Loading.vue'),
})

// ── 常量與設定 ──
const shichenList = [
  { name: '子時', time: '23:00-01:00', hour: '00:00' },
  { name: '丑時', time: '01:00-03:00', hour: '02:00' },
  { name: '寅時', time: '03:00-05:00', hour: '04:00' },
  { name: '卯時', time: '05:00-07:00', hour: '06:00' },
  { name: '辰時', time: '07:00-09:00', hour: '08:00' },
  { name: '巳時', time: '09:00-11:00', hour: '10:00' },
  { name: '午時', time: '11:00-13:00', hour: '12:00' },
  { name: '未時', time: '13:00-15:00', hour: '14:00' },
  { name: '申時', time: '15:00-17:00', hour: '16:00' },
  { name: '酉時', time: '17:00-19:00', hour: '18:00' },
  { name: '戌時', time: '19:00-21:00', hour: '20:00' },
  { name: '亥時', time: '21:00-23:00', hour: '22:00' },
]

const createEmptyForm = (): UserProfile => ({
  surname: '',
  givenName: '',
  name: '',
  birthDate: '',
  birthTime: '',
  zodiac: '',
  element: '',
  nameElement: '',
  nameStrokes: 0,
  luckyColors: [],
  luckyNumbers: [],
})

// ── Store 實例 ──
const userStore = useUserStore()
const router = useRouter()
const { success, error: showError } = useToast()

// ── 響應式狀態 ──
const form = ref<UserProfile>(createEmptyForm())
const selectedShichen = ref('')
const saving = ref(false)
const redirecting = ref(false)
const timeMode = ref<'exact' | 'shichen'>('exact')

// ── 計算屬性 ──
const isFormValid = computed(() => {
  return (
    (form.value.surname || form.value.givenName) &&
    form.value.birthDate &&
    (form.value.birthTime || selectedShichen.value)
  )
})

// ── 方法與函式 ──
const switchTimeMode = (mode: 'exact' | 'shichen') => {
  timeMode.value = mode
  form.value.birthTime = ''
  selectedShichen.value = ''
}

const saveProfile = async () => {
  if (saving.value) return
  try {
    saving.value = true
    userStore.setProfile(form.value)
    success('設定保存成功！', '您的個人資料已成功保存', 3000)
    setTimeout(() => {
      startRedirect()
    }, 1000)
  } catch {
    saving.value = false
    showError('保存失敗', '無法保存您的設定，請檢查資料後重試')
  }
}

const startRedirect = () => {
  redirecting.value = true
  success('即將跳轉', '正在為您載入投資儀表板...', 3000)
  setTimeout(() => {
    router.push('/dashboard')
  }, 2000)
}

const clearForm = () => {
  form.value = createEmptyForm()
  selectedShichen.value = ''
  userStore.clearProfile()
  success('設定已清除', '您的個人資料已成功清除', 2000)
}

// ── 監聽器 ──
watch(
  () => userStore.profile,
  newProfile => {
    if (newProfile) {
      form.value = {
        surname: newProfile.surname || '',
        givenName: newProfile.givenName || '',
        name: newProfile.name,
        birthDate: newProfile.birthDate,
        birthTime: newProfile.birthTime,
        zodiac: newProfile.zodiac,
        element: newProfile.element,
        nameElement: newProfile.nameElement || '',
        nameStrokes: newProfile.nameStrokes || 0,
        luckyColors: [...newProfile.luckyColors],
        luckyNumbers: [...newProfile.luckyNumbers],
      }
      const matched = shichenList.find(s => s.hour === newProfile.birthTime)
      selectedShichen.value = matched ? matched.name : ''
      timeMode.value = matched ? 'shichen' : 'exact'
    }
  },
  { immediate: true, deep: true }
)

watchEffect(() => {
  const fullName = `${form.value.surname}${form.value.givenName}`
  form.value.name = fullName
  if (fullName) {
    const result = getElementFromName(fullName)
    form.value.nameElement = result.element
    form.value.nameStrokes = result.totalStrokes
  } else {
    form.value.nameElement = ''
    form.value.nameStrokes = 0
  }
})

watch(
  () => form.value.birthDate,
  newDate => {
    if (newDate) {
      form.value.zodiac = getZodiacFromDate(newDate)
      const element = getElementFromDate(newDate)
      form.value.element = element
      form.value.luckyColors = getLuckyColors(element)
      form.value.luckyNumbers = getLuckyNumbers(element)
    }
  }
)

const timeToShichen = (time: string): string => {
  if (!time) return ''
  const hour = parseInt(time.split(':')[0], 10)
  if (isNaN(hour)) return ''
  if (hour === 23 || hour === 0) return '子時'
  if (hour >= 1 && hour < 3) return '丑時'
  if (hour >= 3 && hour < 5) return '寅時'
  if (hour >= 5 && hour < 7) return '卯時'
  if (hour >= 7 && hour < 9) return '辰時'
  if (hour >= 9 && hour < 11) return '巳時'
  if (hour >= 11 && hour < 13) return '午時'
  if (hour >= 13 && hour < 15) return '未時'
  if (hour >= 15 && hour < 17) return '申時'
  if (hour >= 17 && hour < 19) return '酉時'
  if (hour >= 19 && hour < 21) return '戌時'
  if (hour >= 21 && hour < 23) return '亥時'
  return ''
}

const getColorClass = (color: string): string => {
  const classMap: { [key: string]: string } = {
    紅色: 'bg-red-500',
    橙色: 'bg-orange-500',
    黃色: 'bg-yellow-500',
    綠色: 'bg-green-500',
    藍色: 'bg-blue-500',
    紫色: 'bg-purple-500',
    黑色: 'bg-black',
    白色: 'bg-white',
    金色: 'bg-gold-500',
    銀色: 'bg-gray-300',
    棕色: 'bg-amber-700',
    灰色: 'bg-gray-500',
    青色: 'bg-cyan-500',
    橘色: 'bg-orange-400',
  }
  return classMap[color] || 'bg-gray-500'
}

const onDateChange = (date: Date | null) => {
  if (date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    form.value.birthDate = `${year}-${month}-${day}`
  }
}

const onTimeChange = (time: { hours?: number; minutes?: number } | string | null) => {
  if (time) {
    if (typeof time === 'object' && time.hours !== undefined && time.minutes !== undefined) {
      const hours = String(time.hours).padStart(2, '0')
      const minutes = String(time.minutes).padStart(2, '0')
      form.value.birthTime = `${hours}:${minutes}`
    } else if (typeof time === 'string') {
      form.value.birthTime = time
    }
  }
}

const onShichenChange = () => {
  if (selectedShichen.value) {
    const shichen = shichenList.find(s => s.name === selectedShichen.value)
    if (shichen) {
      form.value.birthTime = shichen.hour
    }
  }
}
</script>

<template>
  <div class="min-h-screen py-6 sm:py-8 lg:py-12">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Page Header -->
      <div class="mb-6 sm:mb-8">
        <h1 class="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">個人設定</h1>
        <p class="text-xs sm:text-sm lg:text-base text-gray-400">
          設定個人資料以獲得精準的投資運勢分析
        </p>
      </div>

      <!-- 已儲存的資料預覽 -->
      <div
        v-if="userStore.profile && userStore.isProfileComplete"
        class="card !py-3 !px-3 sm:!py-4 sm:!px-6 mb-5 sm:mb-6"
      >
        <h3 class="text-sm sm:text-base font-semibold text-white mb-2 sm:mb-3">當前設定</h3>
        <div class="grid grid-cols-2 gap-1.5 sm:gap-2 text-xs sm:text-sm">
          <div class="flex justify-between">
            <span class="text-gray-500">姓名：</span>
            <span class="text-white truncate ml-2">{{ userStore.profile.name }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">出生日期：</span>
            <span class="text-white truncate ml-2">{{ userStore.profile.birthDate }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">出生時間：</span>
            <span class="text-white truncate ml-2"
              >{{ userStore.profile.birthTime }}（{{
                timeToShichen(userStore.profile.birthTime)
              }}）</span
            >
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">生肖：</span>
            <span class="text-white truncate ml-2">{{ userStore.profile.zodiac }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">年份五行：</span>
            <span class="text-amber-400 truncate ml-2">{{ userStore.profile.element }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">姓名學五行：</span>
            <span class="text-amber-400 truncate ml-2"
              >{{ userStore.profile.nameElement }} ({{ userStore.profile.nameStrokes }}畫)</span
            >
          </div>
        </div>
      </div>

      <!-- 左右雙欄佈局 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 左側：編輯表單 -->
        <div class="card !py-4 !px-3 sm:!py-6 sm:!px-6">
          <h3 class="text-base font-semibold text-white mb-4 flex items-center">
            <span class="text-gold-400 mr-2">📝</span>
            個人資料
          </h3>
          <form class="space-y-4 sm:space-y-5" @submit.prevent="saveProfile">
            <!-- 姓氏 -->
            <div>
              <label
                for="surname"
                class="block text-xs sm:text-sm font-medium text-white mb-1.5 sm:mb-2"
              >
                姓氏
              </label>
              <input
                id="surname"
                v-model="form.surname"
                type="text"
                class="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 text-xs sm:text-sm transition-all"
                placeholder="請輸入姓氏（如：王、歐陽）"
              />
            </div>

            <!-- 名字 -->
            <div>
              <label
                for="givenName"
                class="block text-xs sm:text-sm font-medium text-white mb-1.5 sm:mb-2"
              >
                名字
              </label>
              <input
                id="givenName"
                v-model="form.givenName"
                type="text"
                class="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 text-xs sm:text-sm transition-all"
                placeholder="請輸入名字"
              />
              <!-- 姓名學五行即時預覽 -->
              <p v-if="form.nameElement" class="text-xs text-amber-400/80 mt-1">
                姓名學五行：{{ form.nameElement }} ({{ form.nameStrokes }}畫)
              </p>
            </div>

            <!-- 出生日期 -->
            <div>
              <label
                for="birthDate"
                class="block text-xs sm:text-sm font-medium text-white mb-1.5 sm:mb-2"
              >
                出生日期
              </label>
              <div class="date-picker-wrapper">
                <VueDatePicker
                  v-model="form.birthDate"
                  :locale="'zh-TW'"
                  :max-date="new Date()"
                  :min-date="new Date(1900, 0, 1)"
                  placeholder="選擇您的出生日期"
                  :dark="true"
                  :enable-time-picker="false"
                  :format="'yyyy年MM月dd日'"
                  text-input
                  :text-input-options="{
                    format: 'yyyy-MM-dd',
                  }"
                  :ui="{
                    input: 'date-picker-input',
                  }"
                  @update:model-value="onDateChange"
                >
                  <template #input-icon>
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fill-rule="evenodd"
                        d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </template>
                </VueDatePicker>
              </div>
              <p v-if="form.zodiac" class="text-xs text-amber-400/80 mt-1">
                生肖：{{ form.zodiac }}（自動推算）
              </p>
            </div>

            <!-- 出生時間 -->
            <div>
              <label
                for="birthTime"
                class="block text-xs sm:text-sm font-medium text-white mb-1.5 sm:mb-2"
              >
                出生時間
              </label>
              <!-- 時間模式選擇 -->
              <div class="flex gap-4 mb-3">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="timeMode"
                    value="exact"
                    :checked="timeMode === 'exact'"
                    class="w-4 h-4 text-amber-500 bg-white/10 border-white/20 focus:ring-amber-500/50"
                    @change="switchTimeMode('exact')"
                  />
                  <span class="text-xs sm:text-sm text-gray-300">精確時間</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="timeMode"
                    value="shichen"
                    :checked="timeMode === 'shichen'"
                    class="w-4 h-4 text-amber-500 bg-white/10 border-white/20 focus:ring-amber-500/50"
                    @change="switchTimeMode('shichen')"
                  />
                  <span class="text-xs sm:text-sm text-gray-300">傳統時辰</span>
                </label>
              </div>
              <!-- 精確時間 -->
              <div v-if="timeMode === 'exact'">
                <VueDatePicker
                  v-model="form.birthTime"
                  time-picker
                  :locale="'zh-TW'"
                  :dark="true"
                  placeholder="選擇時間"
                  :format="'HH:mm'"
                  text-input
                  :text-input-options="{
                    format: 'HH:mm',
                  }"
                  :ui="{
                    input: 'time-picker-input',
                  }"
                  @update:model-value="onTimeChange"
                />
              </div>
              <!-- 傳統時辰 -->
              <div v-else>
                <select
                  v-model="selectedShichen"
                  class="w-full h-[42px] px-2.5 sm:px-3 py-1.5 sm:py-2 bg-white/10 border border-white/20 rounded-lg text-white text-xs sm:text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all"
                  @change="onShichenChange"
                >
                  <option value="" class="bg-gray-800">選擇時辰</option>
                  <option
                    v-for="shichen in shichenList"
                    :key="shichen.name"
                    :value="shichen.name"
                    class="bg-gray-800"
                  >
                    {{ shichen.name }} ({{ shichen.time }})
                  </option>
                </select>
              </div>
              <p class="text-xs text-gray-400 mt-1">精確時間有助於更準確的命理分析</p>
            </div>

            <!-- 生肖（自動推算，唯讀） -->
            <div>
              <label class="block text-xs sm:text-sm font-medium text-white mb-1.5 sm:mb-2">
                生肖（自動推算）
              </label>
              <div class="p-2.5 sm:p-3 bg-white/5 rounded-lg">
                <span class="text-amber-400 font-medium text-xs sm:text-sm">
                  {{ form.zodiac || '請先填寫出生日期' }}
                </span>
              </div>
            </div>

            <!-- 年份五行 -->
            <div>
              <label class="block text-xs sm:text-sm font-medium text-white mb-1.5 sm:mb-2">
                年份五行屬性（自動計算）
              </label>
              <div class="p-2.5 sm:p-3 bg-white/5 rounded-lg">
                <span class="text-amber-400 font-medium text-xs sm:text-sm">
                  {{ form.element || '請先填寫出生日期' }}
                </span>
              </div>
            </div>

            <!-- 姓名學五行 -->
            <div>
              <label class="block text-xs sm:text-sm font-medium text-white mb-1.5 sm:mb-2">
                姓名學五行（基於姓名筆畫）
              </label>
              <div class="p-2.5 sm:p-3 bg-white/5 rounded-lg">
                <span v-if="form.nameElement" class="text-amber-400 font-medium text-xs sm:text-sm">
                  {{ form.nameElement }} ({{ form.nameStrokes }}畫)
                </span>
                <span v-else class="text-gray-500 text-xs sm:text-sm"> 請先填寫姓氏與名字 </span>
              </div>
            </div>

            <!-- 幸運顏色 -->
            <div>
              <label class="block text-xs sm:text-sm font-medium text-white mb-1.5 sm:mb-2">
                幸運顏色（基於年份五行）
              </label>
              <div class="flex space-x-2">
                <div
                  v-for="color in form.luckyColors"
                  :key="color"
                  :class="`w-6 h-6 sm:w-8 sm:h-8 rounded-full ${getColorClass(color)}`"
                  :title="color"
                />
              </div>
            </div>

            <!-- 提交按鈕 -->
            <div class="pt-4 sm:pt-6 border-t border-white/10">
              <div class="flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-3">
                <button
                  type="button"
                  class="px-4 py-2 text-xs sm:text-sm font-medium text-gray-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-all"
                  @click="clearForm"
                >
                  清除設定
                </button>
                <button
                  type="submit"
                  :disabled="!isFormValid || saving || redirecting"
                  :class="[
                    'px-4 py-2 text-xs sm:text-sm font-medium text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition-all',
                    (!isFormValid || saving || redirecting) && 'opacity-50 cursor-not-allowed',
                  ]"
                >
                  <span v-if="saving">保存中...</span>
                  <span v-else-if="redirecting">跳轉中...</span>
                  <span v-else>保存設定</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        <!-- 右側：命理引擎設定 -->
        <div>
          <EngineSettingsCard />
        </div>
      </div>
    </div>
  </div>
</template>
