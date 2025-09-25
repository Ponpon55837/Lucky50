<template>
  <div class="min-h-screen py-12">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-12">
        <h1 class="text-3xl md:text-4xl font-bold text-white mb-4">個人設定</h1>
        <p class="text-xl text-gray-300">設定您的個人資料以獲得精準的投資運勢分析</p>
      </div>

      <div class="card max-w-2xl mx-auto">
        <form @submit.prevent="saveProfile" class="space-y-6">
          <!-- 姓名 -->
          <div>
            <label for="name" class="block text-sm font-medium text-white mb-2"> 姓名 </label>
            <input
              v-model="form.name"
              type="text"
              id="name"
              required
              class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
              placeholder="請輸入您的姓名"
            />
          </div>

          <!-- 出生日期 -->
          <div>
            <label for="birthDate" class="block text-sm font-medium text-white mb-2">
              出生日期
            </label>
            <div class="date-picker-wrapper">
              <VueDatePicker
                v-model="form.birthDate"
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
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fill-rule="evenodd"
                      d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </template>
              </VueDatePicker>
            </div>
            <p class="text-sm text-gray-400 mt-1">請選擇您的出生日期 (西元年份)</p>
          </div>

          <!-- 出生時間 -->
          <div>
            <label for="birthTime" class="block text-sm font-medium text-white mb-2">
              出生時間
            </label>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- 精確時間輸入 -->
              <div>
                <label class="block text-xs text-gray-400 mb-1">精確時間</label>
                <VueDatePicker
                  v-model="form.birthTime"
                  time-picker
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
                  @focus="onTimeFocus"
                  @update:model-value="onTimeChange"
                />
              </div>
              <!-- 時辰選擇 -->
              <div>
                <label class="block text-xs text-gray-400 mb-1">傳統時辰</label>
                <select
                  v-model="selectedShichen"
                  @change="onShichenChange"
                  class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20"
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
            </div>
            <p class="text-sm text-gray-400 mt-1">
              可選擇精確時間或傳統十二時辰，精確時間有助於更準確的命理分析
            </p>
          </div>

          <!-- 生肖選擇 -->
          <div>
            <label class="block text-sm font-medium text-white mb-2"> 生肖 </label>
            <div class="grid grid-cols-4 gap-2">
              <button
                v-for="zodiac in zodiacList"
                :key="zodiac"
                type="button"
                @click="form.zodiac = zodiac"
                :class="[
                  'p-2 rounded-lg text-sm font-medium transition-all duration-200',
                  form.zodiac === zodiac
                    ? 'bg-gold-500 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20',
                ]"
              >
                {{ zodiac }}
              </button>
            </div>
          </div>

          <!-- 五行元素 -->
          <div>
            <label class="block text-sm font-medium text-white mb-2"> 五行屬性 (自動計算) </label>
            <div class="p-3 bg-white/5 rounded-lg">
              <span class="text-gold-400 font-medium">
                {{ form.element || '請先填寫出生日期' }}
              </span>
            </div>
          </div>

          <!-- 幸運顏色 -->
          <div>
            <label class="block text-sm font-medium text-white mb-2"> 幸運顏色 (基於五行) </label>
            <div class="flex space-x-2">
              <div
                v-for="color in form.luckyColors"
                :key="color"
                :class="`w-8 h-8 rounded-full ${getColorClass(color)}`"
                :title="color"
              ></div>
            </div>
          </div>

          <!-- 提交按鈕 -->
          <div class="flex justify-end space-x-4 pt-6">
            <button type="button" @click="clearForm" class="btn-secondary">清除</button>
            <button
              type="submit"
              :disabled="!isFormValid"
              :class="['btn-primary', !isFormValid && 'opacity-50 cursor-not-allowed']"
            >
              保存設定
            </button>
          </div>
        </form>
      </div>

      <!-- 已儲存的資料預覽 -->
      <div v-if="userStore.profile" class="card max-w-2xl mx-auto mt-8">
        <h3 class="text-xl font-semibold text-white mb-4">當前設定</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-gray-400">姓名：</span>
            <span class="text-white">{{ userStore.profile.name }}</span>
          </div>
          <div>
            <span class="text-gray-400">出生日期：</span>
            <span class="text-white">{{ userStore.profile.birthDate }}</span>
          </div>
          <div>
            <span class="text-gray-400">出生時間：</span>
            <span class="text-white">{{ userStore.profile.birthTime }}</span>
          </div>
          <div>
            <span class="text-gray-400">生肖：</span>
            <span class="text-white">{{ userStore.profile.zodiac }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import type { UserProfile } from '@/types'
import VueDatePicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'

const userStore = useUserStore()
const router = useRouter()
const { success, error } = useToast()

const zodiacList = ['鼠', '牛', '虎', '兔', '龍', '蛇', '馬', '羊', '猴', '雞', '狗', '豬']

// 十二時辰對照表
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

const form = ref<UserProfile>({
  name: '',
  birthDate: '',
  birthTime: '',
  zodiac: '',
  element: '',
  luckyColors: [],
  luckyNumbers: [],
})

const selectedShichen = ref('')

const isFormValid = computed(() => {
  return (
    form.value.name &&
    form.value.birthDate &&
    (form.value.birthTime || selectedShichen.value) &&
    form.value.zodiac
  )
})

// 根據出生日期計算五行屬性
watch(
  () => form.value.birthDate,
  newDate => {
    if (newDate) {
      form.value.element = calculateElement(newDate)
      form.value.luckyColors = calculateLuckyColors(form.value.element)
      form.value.luckyNumbers = calculateLuckyNumbers(form.value.element)
    }
  }
)

const calculateElement = (birthDate: string): string => {
  const year = parseInt(birthDate.split('-')[0])
  const elements = ['金', '水', '木', '木', '土', '火', '火', '土', '金', '金']
  return elements[year % 10] || '土'
}

const calculateLuckyColors = (element: string): string[] => {
  const colorMap: { [key: string]: string[] } = {
    金: ['白色', '金色', '銀色'],
    木: ['綠色', '青色', '棕色'],
    水: ['黑色', '藍色', '灰色'],
    火: ['紅色', '橙色', '紫色'],
    土: ['黃色', '棕色', '橘色'],
  }
  return colorMap[element] || ['金色']
}

const calculateLuckyNumbers = (element: string): number[] => {
  const numberMap: { [key: string]: number[] } = {
    金: [4, 9, 14, 19],
    木: [3, 8, 13, 18],
    水: [1, 6, 11, 16],
    火: [2, 7, 12, 17],
    土: [5, 10, 15, 20],
  }
  return numberMap[element] || [8, 18, 28]
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

// 日期選擇處理
const onDateChange = (date: Date | null) => {
  if (date) {
    // 將 Date 對象轉換為 YYYY-MM-DD 格式的字符串
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    form.value.birthDate = `${year}-${month}-${day}`
  }
}

const onTimeFocus = () => {
  selectedShichen.value = '' // 清除時辰選擇
}

const onTimeChange = (time: any) => {
  if (time) {
    // 處理時間對象，轉換為 HH:MM 格式
    if (time.hours !== undefined && time.minutes !== undefined) {
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

const saveProfile = () => {
  try {
    userStore.setProfile(form.value)
    // 使用更好的提示方式
    showSuccessToast('設定成功', '您的個人資料已成功保存，即將跳轉到儀表板')
    setTimeout(() => {
      router.push('/dashboard')
    }, 1500)
  } catch (error) {
    showErrorToast('保存失敗', '無法保存您的設定，請檢查資料後重試')
  }
}

const clearForm = () => {
  form.value = {
    name: '',
    birthDate: '',
    birthTime: '',
    zodiac: '',
    element: '',
    luckyColors: [],
    luckyNumbers: [],
  }
  selectedShichen.value = ''
}

// Toast 通知系統
const showSuccessToast = (title: string, message?: string) => {
  success(title, message)
}

const showErrorToast = (title: string, message?: string) => {
  error(title, message)
}

onMounted(() => {
  userStore.loadProfile()
  if (userStore.profile) {
    form.value = {
      ...userStore.profile,
      luckyColors: [...userStore.profile.luckyColors],
      luckyNumbers: [...userStore.profile.luckyNumbers],
    }
  }
})
</script>
