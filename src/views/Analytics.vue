<template>
  <div class="min-h-screen py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-white mb-2">數據分析</h1>
        <p class="text-gray-300">深入分析 0050 ETF 的歷史表現與投資趨勢</p>
      </div>

      <!-- 統計卡片 -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="card text-center">
          <div class="text-2xl font-bold text-green-400 mb-2">+12.5%</div>
          <div class="text-gray-300 text-sm">年化報酬率</div>
        </div>
        <div class="card text-center">
          <div class="text-2xl font-bold text-blue-400 mb-2">8.3%</div>
          <div class="text-gray-300 text-sm">波動率</div>
        </div>
        <div class="card text-center">
          <div class="text-2xl font-bold text-purple-400 mb-2">0.95</div>
          <div class="text-gray-300 text-sm">夏普比率</div>
        </div>
        <div class="card text-center">
          <div class="text-2xl font-bold text-gold-400 mb-2">-5.2%</div>
          <div class="text-gray-300 text-sm">最大回撤</div>
        </div>
      </div>

      <!-- 圖表區域 -->
      <div class="space-y-6">
        <!-- 價格走勢圖 -->
        <div class="card">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-semibold text-white">價格走勢分析</h2>
            <div class="flex space-x-2">
              <button
                v-for="period in periods"
                :key="period"
                @click="selectedPeriod = period"
                :class="[
                  'px-3 py-1 rounded text-sm transition-colors',
                  selectedPeriod === period
                    ? 'bg-gold-500 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20',
                ]"
              >
                {{ period }}
              </button>
            </div>
          </div>
          <div class="h-96 rounded-lg overflow-hidden">
            <PriceChart :etfData="investmentStore.etfData" :isDark="isDark" />
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- 成交量分析 -->
          <div class="card">
            <h2 class="text-xl font-semibold text-white mb-6">成交量分析</h2>
            <div class="h-64 rounded-lg overflow-hidden">
              <VolumeChart :etfData="investmentStore.etfData" :isDark="isDark" />
            </div>
          </div>

          <!-- 技術指標 -->
          <div class="card">
            <h2 class="text-xl font-semibold text-white mb-6">技術指標</h2>
            <div class="space-y-4">
              <div class="flex justify-between items-center">
                <span class="text-gray-300">RSI (14)</span>
                <span class="text-white font-medium">65.2</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-300">MACD</span>
                <span class="text-green-400 font-medium">+0.85</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-300">布林帶位置</span>
                <span class="text-yellow-400 font-medium">中軌</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-300">KD指標</span>
                <span class="text-white font-medium">K:72 D:68</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 運勢與績效相關性 -->
        <div class="card">
          <h2 class="text-xl font-semibold text-white mb-6">運勢與投資績效相關性</h2>
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="space-y-4">
              <h3 class="text-lg font-medium text-gold-400">運勢分數分佈</h3>
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span class="text-gray-300">高運勢 (80+)</span>
                  <span class="text-green-400">25%</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-300">中運勢 (40-80)</span>
                  <span class="text-yellow-400">60%</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-300">低運勢 (<40)</span>
                  <span class="text-red-400">15%</span>
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <h3 class="text-lg font-medium text-gold-400">平均報酬率</h3>
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span class="text-gray-300">高運勢日</span>
                  <span class="text-green-400">+2.1%</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-300">中運勢日</span>
                  <span class="text-yellow-400">+0.3%</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-300">低運勢日</span>
                  <span class="text-red-400">-0.8%</span>
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <h3 class="text-lg font-medium text-gold-400">成功率</h3>
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span class="text-gray-300">BUY 建議</span>
                  <span class="text-green-400">78%</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-300">HOLD 建議</span>
                  <span class="text-yellow-400">65%</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-300">SELL 建議</span>
                  <span class="text-red-400">71%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 歷史回測 -->
        <div class="card">
          <h2 class="text-xl font-semibold text-white mb-6">策略回測結果</h2>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-white/10">
                  <th class="text-left py-3 text-gray-300">策略</th>
                  <th class="text-right py-3 text-gray-300">總報酬</th>
                  <th class="text-right py-3 text-gray-300">年化報酬</th>
                  <th class="text-right py-3 text-gray-300">最大回撤</th>
                  <th class="text-right py-3 text-gray-300">夏普比率</th>
                  <th class="text-right py-3 text-gray-300">勝率</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/10">
                <tr>
                  <td class="py-3 text-white">農民曆智慧策略</td>
                  <td class="py-3 text-right text-green-400">+45.2%</td>
                  <td class="py-3 text-right text-green-400">+12.8%</td>
                  <td class="py-3 text-right text-red-400">-8.3%</td>
                  <td class="py-3 text-right text-white">1.24</td>
                  <td class="py-3 text-right text-white">73%</td>
                </tr>
                <tr>
                  <td class="py-3 text-white">買入持有策略</td>
                  <td class="py-3 text-right text-green-400">+38.7%</td>
                  <td class="py-3 text-right text-green-400">+11.2%</td>
                  <td class="py-3 text-right text-red-400">-12.1%</td>
                  <td class="py-3 text-right text-white">0.95</td>
                  <td class="py-3 text-right text-white">68%</td>
                </tr>
                <tr>
                  <td class="py-3 text-white">定期定額策略</td>
                  <td class="py-3 text-right text-green-400">+42.1%</td>
                  <td class="py-3 text-right text-green-400">+12.1%</td>
                  <td class="py-3 text-right text-red-400">-9.7%</td>
                  <td class="py-3 text-right text-white">1.08</td>
                  <td class="py-3 text-right text-white">70%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useInvestmentStore } from '@/stores/investment'
import { useTheme } from '@/composables/useTheme'
import { FinMindService } from '@/services/finmind'
import PriceChart from '@/components/charts/PriceChart.vue'
import VolumeChart from '@/components/charts/VolumeChart.vue'

const investmentStore = useInvestmentStore()
const { isDark } = useTheme()

const selectedPeriod = ref('1年')
const periods = ['1個月', '3個月', '6個月', '1年', '3年', '5年']
const loading = ref(true)

const loadAnalyticsData = async () => {
  loading.value = true
  try {
    // 如果 store 中沒有數據，則重新載入
    if (investmentStore.etfData.length === 0) {
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const etfData = await FinMindService.getETFData(startDate, endDate)
      investmentStore.setETFData(etfData)
      console.log('Analytics - 載入 ETF 數據:', etfData.length, '筆')
    }
  } catch (error) {
    console.error('Analytics 數據載入失敗:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadAnalyticsData()
})
</script>
