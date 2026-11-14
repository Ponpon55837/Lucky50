<script setup lang="ts">
import { ref, computed, watch, watchEffect, defineAsyncComponent } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useToast } from '@/composables/useToast'
import { CalendarDaysIcon, PencilSquareIcon } from '@heroicons/vue/24/outline'
import type { UserProfile } from '@/types'
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

const VueDatePicker = defineAsyncComponent(() =>
  import('@vuepic/vue-datepicker').then(m => m.default)
)

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
    success('設定已保存', '您的個人資料已成功保存', 3000)
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
  { immediate: true }
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

// 幸運色是內容本身的顏色，不走介面 tokens
const COLOR_SWATCHES: Readonly<Record<string, string>> = {
  紅色: '#d43c3c',
  橙色: '#e8833a',
  橘色: '#e8833a',
  黃色: '#e9c13b',
  綠色: '#3f9a5b',
  藍色: '#3b6fc4',
  紫色: '#7d55b8',
  黑色: '#1b1a18',
  白色: '#ffffff',
  金色: '#c9a03c',
  銀色: '#c4c4c4',
  棕色: '#8a5a2b',
  灰色: '#8a8884',
  青色: '#2f9c95',
}

const colorSwatch = (color: string): string => COLOR_SWATCHES[color] ?? '#8a8884'

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
  <div class="flex flex-col gap-6">
    <header>
      <h1 class="font-serif text-[28px] font-bold leading-tight text-ink sm:text-[36px]">
        個人設定
      </h1>
      <p class="mt-1.5 text-sm text-ink-2">
        設定個人資料以獲得精準的投資運勢分析
      </p>
    </header>

    <!-- 已儲存的資料預覽 -->
    <section
      v-if="userStore.profile && userStore.isProfileComplete"
      class="card"
    >
      <h2 class="card-title">
        當前設定
      </h2>
      <dl class="grid grid-cols-1 gap-x-8 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
        <div class="flex justify-between gap-2 border-b border-line pb-2">
          <dt class="text-ink-3">
            姓名
          </dt>
          <dd class="truncate text-ink">
            {{ userStore.profile.name }}
          </dd>
        </div>
        <div class="flex justify-between gap-2 border-b border-line pb-2">
          <dt class="text-ink-3">
            出生日期
          </dt>
          <dd class="truncate font-mono text-ink">
            {{ userStore.profile.birthDate }}
          </dd>
        </div>
        <div class="flex justify-between gap-2 border-b border-line pb-2">
          <dt class="text-ink-3">
            出生時間
          </dt>
          <dd class="truncate text-ink">
            <span class="font-mono">{{ userStore.profile.birthTime }}</span>（{{ timeToShichen(userStore.profile.birthTime) }}）
          </dd>
        </div>
        <div class="flex justify-between gap-2 border-b border-line pb-2">
          <dt class="text-ink-3">
            生肖
          </dt>
          <dd class="truncate text-ink">
            {{ userStore.profile.zodiac }}
          </dd>
        </div>
        <div class="flex justify-between gap-2 border-b border-line pb-2">
          <dt class="text-ink-3">
            年份五行
          </dt>
          <dd class="truncate text-ink">
            {{ userStore.profile.element }}
          </dd>
        </div>
        <div class="flex justify-between gap-2 border-b border-line pb-2">
          <dt class="text-ink-3">
            姓名學五行
          </dt>
          <dd class="truncate text-ink">
            {{ userStore.profile.nameElement }} ({{ userStore.profile.nameStrokes }}畫)
          </dd>
        </div>
      </dl>
    </section>

    <!-- 左右雙欄佈局 -->
    <div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
      <!-- 左側：編輯表單 -->
      <section class="card">
        <h2 class="card-title flex items-center gap-2">
          <PencilSquareIcon
            class="h-[18px] w-[18px] text-ink-3"
            aria-hidden="true"
          />
          個人資料
        </h2>
        <form
          class="flex flex-col gap-5"
          @submit.prevent="saveProfile"
        >
          <!-- 姓氏 -->
          <div>
            <label
              for="surname"
              class="mb-2 block text-sm font-medium text-ink"
            >姓氏</label>
            <input
              id="surname"
              v-model="form.surname"
              type="text"
              class="form-input"
              placeholder="請輸入姓氏（如：王、歐陽）"
            >
          </div>

          <!-- 名字 -->
          <div>
            <label
              for="givenName"
              class="mb-2 block text-sm font-medium text-ink"
            >名字</label>
            <input
              id="givenName"
              v-model="form.givenName"
              type="text"
              class="form-input"
              placeholder="請輸入名字"
            >
            <!-- 姓名學五行即時預覽 -->
            <p
              v-if="form.nameElement"
              class="mt-1.5 text-xs text-ink-2"
            >
              姓名學五行：{{ form.nameElement }} ({{ form.nameStrokes }}畫)
            </p>
          </div>

          <!-- 出生日期 -->
          <div>
            <label
              for="birthDate"
              class="mb-2 block text-sm font-medium text-ink"
            >出生日期</label>
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
                  <CalendarDaysIcon
                    class="ml-3 h-4 w-4 text-ink-3"
                    aria-hidden="true"
                  />
                </template>
              </VueDatePicker>
            </div>
            <p
              v-if="form.zodiac"
              class="mt-1.5 text-xs text-ink-2"
            >
              生肖：{{ form.zodiac }}（自動推算）
            </p>
          </div>

          <!-- 出生時間 -->
          <div>
            <label
              for="birthTime"
              class="mb-2 block text-sm font-medium text-ink"
            >出生時間</label>
            <!-- 時間模式選擇 -->
            <div
              class="mb-3 inline-flex rounded-[10px] border border-line-strong p-1"
              role="radiogroup"
              aria-label="時間輸入方式"
            >
              <label
                class="cursor-pointer rounded-md px-3 py-1.5 text-sm transition-colors"
                :class="timeMode === 'exact' ? 'bg-raised font-medium text-ink' : 'text-ink-3'"
              >
                <input
                  type="radio"
                  name="timeMode"
                  value="exact"
                  :checked="timeMode === 'exact'"
                  class="sr-only"
                  @change="switchTimeMode('exact')"
                >
                精確時間
              </label>
              <label
                class="cursor-pointer rounded-md px-3 py-1.5 text-sm transition-colors"
                :class="timeMode === 'shichen' ? 'bg-raised font-medium text-ink' : 'text-ink-3'"
              >
                <input
                  type="radio"
                  name="timeMode"
                  value="shichen"
                  :checked="timeMode === 'shichen'"
                  class="sr-only"
                  @change="switchTimeMode('shichen')"
                >
                傳統時辰
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
                class="form-input"
                @change="onShichenChange"
              >
                <option value="">
                  選擇時辰
                </option>
                <option
                  v-for="shichen in shichenList"
                  :key="shichen.name"
                  :value="shichen.name"
                >
                  {{ shichen.name }} ({{ shichen.time }})
                </option>
              </select>
            </div>
            <p class="mt-1.5 text-xs text-ink-3">
              精確時間有助於更準確的命理分析
            </p>
          </div>

          <!-- 自動推算欄位 -->
          <dl class="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <!-- 生肖（自動推算，唯讀） -->
            <div class="rounded-[10px] bg-raised px-4 py-3">
              <dt class="text-xs text-ink-3">
                生肖（自動推算）
              </dt>
              <dd class="mt-1 text-sm font-medium text-ink">
                {{ form.zodiac || '請先填寫出生日期' }}
              </dd>
            </div>

            <!-- 年份五行 -->
            <div class="rounded-[10px] bg-raised px-4 py-3">
              <dt class="text-xs text-ink-3">
                年份五行屬性（自動計算）
              </dt>
              <dd class="mt-1 text-sm font-medium text-ink">
                {{ form.element || '請先填寫出生日期' }}
              </dd>
            </div>

            <!-- 姓名學五行 -->
            <div class="rounded-[10px] bg-raised px-4 py-3">
              <dt class="text-xs text-ink-3">
                姓名學五行（基於姓名筆畫）
              </dt>
              <dd
                v-if="form.nameElement"
                class="mt-1 text-sm font-medium text-ink"
              >
                {{ form.nameElement }} ({{ form.nameStrokes }}畫)
              </dd>
              <dd
                v-else
                class="mt-1 text-sm text-ink-3"
              >
                請先填寫姓氏與名字
              </dd>
            </div>
          </dl>

          <!-- 幸運顏色 -->
          <div>
            <p class="mb-2 block text-sm font-medium text-ink">
              幸運顏色（基於年份五行）
            </p>
            <div class="flex gap-2">
              <div
                v-for="color in form.luckyColors"
                :key="color"
                :style="{ backgroundColor: colorSwatch(color) }"
                class="h-8 w-8 rounded-full border border-line-strong"
                :title="color"
              />
            </div>
          </div>

          <!-- 提交按鈕 -->
          <div
            class="flex flex-col-reverse justify-end gap-3 border-t border-line pt-5 sm:flex-row"
          >
            <button
              type="button"
              class="btn-secondary"
              @click="clearForm"
            >
              清除設定
            </button>
            <button
              type="submit"
              class="btn-primary"
              :disabled="!isFormValid || saving || redirecting"
            >
              <span v-if="saving">保存中...</span>
              <span v-else-if="redirecting">跳轉中...</span>
              <span v-else>保存設定</span>
            </button>
          </div>
        </form>
      </section>

      <!-- 右側：命理引擎設定 -->
      <EngineSettingsCard />
    </div>
  </div>
</template>
