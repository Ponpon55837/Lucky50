<script setup lang="ts">
import { ref } from 'vue'
import { useTheme } from '@/composables/useTheme'

// 主題狀態
const { isDark } = useTheme()

// 彈窗狀態
const showPrivacyModal = ref(false)
const showTermsModal = ref(false)
</script>

<template>
  <footer class="bg-black/20 backdrop-blur-md border-t border-white/10 mt-auto">
    <div class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
        <div>
          <div class="flex items-center space-x-2 mb-4">
            <div class="w-8 h-8 rounded-full bg-gradient-to-r from-gold-500 to-yellow-600"></div>
            <span class="font-bold text-lg sm:text-xl text-white">農民曆智慧投資</span>
          </div>
          <p class="text-gray-300 text-sm">
            結合傳統農民曆智慧與現代金融科技，為您的 0050 ETF 投資提供個人化建議。
          </p>
        </div>

        <div>
          <h3 class="text-white font-semibold mb-4">功能特色</h3>
          <ul class="space-y-2 text-gray-300 text-sm">
            <li>• 個人化運勢分析</li>
            <li>• 農民曆整合</li>
            <li>• 3D 投資運勢球體</li>
            <li>• 0050 ETF 專業分析</li>
          </ul>
        </div>

        <div class="sm:col-span-2 md:col-span-1">
          <h3 class="text-white font-semibold mb-4">免責聲明</h3>
          <p class="text-gray-300 text-sm">
            本系統僅供參考，不構成投資建議。投資有風險，請謹慎評估自身財務狀況。
          </p>
        </div>
      </div>

      <div
        class="border-t border-white/10 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center"
      >
        <p class="text-gray-400 text-sm">© 2025 農民曆智慧投資系統. All rights reserved.</p>
        <div class="flex space-x-4 mt-4 sm:mt-0">
          <button
            @click="showPrivacyModal = true"
            class="text-gray-400 hover:text-gold-400 text-sm transition-colors focus:outline-none focus:text-gold-400"
          >
            隱私政策
          </button>
          <button
            @click="showTermsModal = true"
            class="text-gray-400 hover:text-gold-400 text-sm transition-colors focus:outline-none focus:text-gold-400"
          >
            使用條款
          </button>
        </div>
      </div>
    </div>

    <!-- 隱私政策彈窗 -->
    <Teleport to="body">
      <div
        v-if="showPrivacyModal"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        :class="isDark ? 'bg-black/60' : 'bg-black/40'"
        style="backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px)"
        @click="showPrivacyModal = false"
      >
        <div
          class="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-lg shadow-2xl border"
          :class="[isDark ? 'bg-gray-900 border-gold-500/20' : 'bg-white border-gray-200']"
          @click.stop
        >
          <div
            class="flex items-center justify-between p-4 sm:p-6 border-b flex-shrink-0"
            :class="isDark ? 'border-white/10' : 'border-gray-200'"
          >
            <h2
              class="text-lg sm:text-xl font-bold flex items-center gap-2"
              :class="isDark ? 'text-white' : 'text-gray-900'"
            >
              <div class="w-3 h-3 bg-gold-500 rounded-full flex-shrink-0"></div>
              <span class="truncate">隱私政策</span>
            </h2>
            <button
              @click="showPrivacyModal = false"
              class="transition-colors p-1 flex-shrink-0 ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              :class="
                isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
              "
              aria-label="關閉"
            >
              <svg
                class="w-5 h-5 sm:w-6 sm:h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </button>
          </div>

          <div
            class="p-4 sm:p-6 overflow-y-auto flex-1 text-sm leading-relaxed"
            :class="isDark ? 'text-gray-300' : 'text-gray-700'"
          >
            <div class="space-y-6">
              <div>
                <h3
                  class="font-semibold mb-3"
                  :class="isDark ? 'text-gold-400' : 'text-orange-600'"
                >
                  1. 資料收集與使用
                </h3>
                <p class="mb-3">我們收集您的個人資訊以提供個人化的投資運勢分析服務：</p>
                <ul class="list-disc list-inside space-y-1 ml-4">
                  <li>生辰八字資訊（出生日期、時間、地點）</li>
                  <li>投資偏好與風險承受度</li>
                  <li>使用行為數據（瀏覽記錄、功能使用頻率）</li>
                  <li>設備資訊（IP 地址、瀏覽器類型）</li>
                </ul>
              </div>

              <div>
                <h3
                  class="font-semibold mb-3"
                  :class="isDark ? 'text-gold-400' : 'text-orange-600'"
                >
                  2. 資料保護措施
                </h3>
                <p class="mb-3">我們採用業界標準的安全措施保護您的個人資料：</p>
                <ul class="list-disc list-inside space-y-1 ml-4">
                  <li>SSL/TLS 加密傳輸</li>
                  <li>資料庫加密存儲</li>
                  <li>定期安全稽核</li>
                  <li>僅授權人員可存取個人資料</li>
                </ul>
              </div>

              <div>
                <h3
                  class="font-semibold mb-3"
                  :class="isDark ? 'text-gold-400' : 'text-orange-600'"
                >
                  3. 資料使用目的
                </h3>
                <ul class="list-disc list-inside space-y-1 ml-4">
                  <li>提供個人化農民曆投資建議</li>
                  <li>生成運勢分析報告</li>
                  <li>改善服務品質</li>
                  <li>發送重要系統通知</li>
                  <li>遵循法律法規要求</li>
                </ul>
              </div>

              <div>
                <h3
                  class="font-semibold mb-3"
                  :class="isDark ? 'text-gold-400' : 'text-orange-600'"
                >
                  4. 資料分享政策
                </h3>
                <p class="mb-3">我們不會將您的個人資料出售、租借或與第三方分享，除非：</p>
                <ul class="list-disc list-inside space-y-1 ml-4">
                  <li>獲得您的明確同意</li>
                  <li>法律法規要求</li>
                  <li>保護我們的合法權益</li>
                  <li>與可信任的技術服務商合作（僅限必要範圍）</li>
                </ul>
              </div>

              <div>
                <h3
                  class="font-semibold mb-3"
                  :class="isDark ? 'text-gold-400' : 'text-orange-600'"
                >
                  5. Cookie 使用
                </h3>
                <p class="mb-3">我們使用 Cookie 來改善用戶體驗：</p>
                <ul class="list-disc list-inside space-y-1 ml-4">
                  <li>記住您的登入狀態</li>
                  <li>保存個人偏好設定</li>
                  <li>分析網站使用情況</li>
                  <li>您可以透過瀏覽器設定管理 Cookie</li>
                </ul>
              </div>

              <div>
                <h3
                  class="font-semibold mb-3"
                  :class="isDark ? 'text-gold-400' : 'text-orange-600'"
                >
                  6. 您的權利
                </h3>
                <ul class="list-disc list-inside space-y-1 ml-4">
                  <li>查閱、修改或刪除個人資料</li>
                  <li>撤回同意書</li>
                  <li>資料可攜權</li>
                  <li>停止接收行銷訊息</li>
                  <li>向主管機關申訴</li>
                </ul>
              </div>

              <div>
                <h3
                  class="font-semibold mb-3"
                  :class="isDark ? 'text-gold-400' : 'text-orange-600'"
                >
                  7. 聯絡我們
                </h3>
                <p>如有任何隱私權相關問題，請聯絡我們：</p>
                <p class="mt-2">電子郵件：privacy@lucky50.com</p>
                <p>最後更新日期：2025年9月30日</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 使用條款彈窗 -->
    <Teleport to="body">
      <div
        v-if="showTermsModal"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        :class="isDark ? 'bg-black/60' : 'bg-black/40'"
        style="backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px)"
        @click="showTermsModal = false"
      >
        <div
          class="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-lg shadow-2xl border"
          :class="[isDark ? 'bg-gray-900 border-gold-500/20' : 'bg-white border-gray-200']"
          @click.stop
        >
          <div
            class="flex items-center justify-between p-4 sm:p-6 border-b flex-shrink-0"
            :class="isDark ? 'border-white/10' : 'border-gray-200'"
          >
            <h2
              class="text-lg sm:text-xl font-bold flex items-center gap-2"
              :class="isDark ? 'text-white' : 'text-gray-900'"
            >
              <div class="w-3 h-3 bg-gold-500 rounded-full flex-shrink-0"></div>
              <span class="truncate">使用條款</span>
            </h2>
            <button
              @click="showTermsModal = false"
              class="transition-colors p-1 flex-shrink-0 ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              :class="
                isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
              "
              aria-label="關閉"
            >
              <svg
                class="w-5 h-5 sm:w-6 sm:h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </button>
          </div>

          <div
            class="p-4 sm:p-6 overflow-y-auto flex-1 text-sm leading-relaxed"
            :class="isDark ? 'text-gray-300' : 'text-gray-700'"
          >
            <div class="space-y-6">
              <div>
                <h3
                  class="font-semibold mb-3"
                  :class="isDark ? 'text-gold-400' : 'text-orange-600'"
                >
                  1. 服務說明
                </h3>
                <p class="mb-3">
                  農民曆智慧投資系統（以下簡稱「本系統」）是一個結合傳統農民曆智慧與現代金融科技的投資參考平台，專注於
                  0050 ETF 的投資分析。
                </p>
                <ul class="list-disc list-inside space-y-1 ml-4">
                  <li>提供基於個人生辰八字的運勢分析</li>
                  <li>結合農民曆節氣的投資建議</li>
                  <li>3D 視覺化投資運勢展示</li>
                  <li>歷史數據分析與回測</li>
                </ul>
              </div>

              <div>
                <h3
                  class="font-semibold mb-3"
                  :class="isDark ? 'text-gold-400' : 'text-orange-600'"
                >
                  2. 免責聲明
                </h3>
                <div
                  class="rounded-lg p-4 mb-3 border"
                  :class="isDark ? 'bg-red-900/20 border-red-500/30' : 'bg-red-50 border-red-200'"
                >
                  <p class="font-semibold mb-2" :class="isDark ? 'text-red-400' : 'text-red-700'">
                    重要聲明：
                  </p>
                  <ul class="list-disc list-inside space-y-1">
                    <li>本系統僅供參考，不構成投資建議</li>
                    <li>投資有風險，可能導致本金損失</li>
                    <li>過去表現不代表未來結果</li>
                    <li>使用者應自行判斷投資決策</li>
                  </ul>
                </div>
                <p>我們不對使用本系統所做的投資決策承擔任何責任。</p>
              </div>

              <div>
                <h3
                  class="font-semibold mb-3"
                  :class="isDark ? 'text-gold-400' : 'text-orange-600'"
                >
                  3. 使用規範
                </h3>
                <p class="mb-3">使用本系統時，您同意遵守以下規範：</p>
                <ul class="list-disc list-inside space-y-1 ml-4">
                  <li>不得進行任何非法或有害活動</li>
                  <li>不得嘗試破壞系統安全或獲取未授權資料</li>
                  <li>不得散布虛假或誤導性資訊</li>
                  <li>尊重其他用戶的權益</li>
                  <li>遵守相關法律法規</li>
                </ul>
              </div>

              <div>
                <h3
                  class="font-semibold mb-3"
                  :class="isDark ? 'text-gold-400' : 'text-orange-600'"
                >
                  4. 智慧財產權
                </h3>
                <ul class="list-disc list-inside space-y-1 ml-4">
                  <li>本系統的所有內容、設計、程式碼均受智慧財產權保護</li>
                  <li>農民曆智慧投資演算法為我們的專有技術</li>
                  <li>未經授權不得複製、分發或商業使用</li>
                  <li>用戶保留其輸入資料的所有權</li>
                </ul>
              </div>

              <div>
                <h3
                  class="font-semibold mb-3"
                  :class="isDark ? 'text-gold-400' : 'text-orange-600'"
                >
                  5. 服務可用性
                </h3>
                <ul class="list-disc list-inside space-y-1 ml-4">
                  <li>我們致力於提供穩定的服務，但不保證 100% 正常運行</li>
                  <li>系統可能因維護、升級或技術問題暫時中斷</li>
                  <li>我們保留隨時修改或終止服務的權利</li>
                  <li>重大變更將提前通知用戶</li>
                </ul>
              </div>

              <div>
                <h3
                  class="font-semibold mb-3"
                  :class="isDark ? 'text-gold-400' : 'text-orange-600'"
                >
                  6. 數據準確性
                </h3>
                <ul class="list-disc list-inside space-y-1 ml-4">
                  <li>我們努力確保數據準確性，但不保證絕對精確</li>
                  <li>農民曆與運勢分析基於傳統文化，僅供參考</li>
                  <li>金融數據來源於第三方，可能存在延遲或錯誤</li>
                  <li>用戶應自行驗證重要資訊</li>
                </ul>
              </div>

              <div>
                <h3
                  class="font-semibold mb-3"
                  :class="isDark ? 'text-gold-400' : 'text-orange-600'"
                >
                  7. 帳戶責任
                </h3>
                <ul class="list-disc list-inside space-y-1 ml-4">
                  <li>您有責任保護帳戶安全</li>
                  <li>不得與他人共享帳戶資訊</li>
                  <li>發現異常活動應立即通知我們</li>
                  <li>您需對帳戶下的所有活動負責</li>
                </ul>
              </div>

              <div>
                <h3
                  class="font-semibold mb-3"
                  :class="isDark ? 'text-gold-400' : 'text-orange-600'"
                >
                  8. 條款變更
                </h3>
                <p class="mb-3">我們保留隨時修改本使用條款的權利。重大變更將透過以下方式通知：</p>
                <ul class="list-disc list-inside space-y-1 ml-4">
                  <li>網站公告</li>
                  <li>電子郵件通知</li>
                  <li>系統內訊息</li>
                </ul>
                <p class="mt-3">繼續使用服務即表示同意修改後的條款。</p>
              </div>

              <div>
                <h3
                  class="font-semibold mb-3"
                  :class="isDark ? 'text-gold-400' : 'text-orange-600'"
                >
                  9. 爭議解決
                </h3>
                <ul class="list-disc list-inside space-y-1 ml-4">
                  <li>本條款適用中華民國法律</li>
                  <li>爭議應優先透過協商解決</li>
                  <li>如無法協商解決，提交台灣地區有管轄權的法院</li>
                </ul>
              </div>

              <div>
                <h3
                  class="font-semibold mb-3"
                  :class="isDark ? 'text-gold-400' : 'text-orange-600'"
                >
                  10. 聯絡資訊
                </h3>
                <p>如有任何疑問，請聯絡我們：</p>
                <p class="mt-2">電子郵件：support@lucky50.com</p>
                <p>最後更新日期：2025年9月30日</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </footer>
</template>
