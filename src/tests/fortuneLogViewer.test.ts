import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'

// Mock data must be defined inside vi.mock factory to avoid hoisting issues
vi.mock('@/services/fortuneStore', () => {
  const mockRecords = [
    {
      id: 1, date: '2024-01-15', timestamp: 1705276800000,
      overallScore: 75, investmentScore: 80, recommendation: 'BUY',
      elements: { metal: 50, wood: 60, water: 40, fire: 55, earth: 45 },
      lunarSummary: '今日財運亨通', userProfileHash: 'h1',
    },
    {
      id: 2, date: '2024-01-16', timestamp: 1705363200000,
      overallScore: 55, investmentScore: 45, recommendation: 'HOLD',
      elements: { metal: 55, wood: 45, water: 50, fire: 50, earth: 50 },
      lunarSummary: '今日宜觀望', userProfileHash: 'h1',
    },
    {
      id: 3, date: '2024-01-17', timestamp: 1705449600000,
      overallScore: 30, investmentScore: 25, recommendation: 'SELL',
      elements: { metal: 40, wood: 70, water: 30, fire: 60, earth: 50 },
      lunarSummary: '今日運勢不佳', userProfileHash: 'h1',
    },
  ]

  return {
    fortuneHistoryStore: {
      init: vi.fn().mockResolvedValue(undefined),
      query: vi.fn().mockResolvedValue({ records: mockRecords, total: 3, pageIndex: 0, pageSize: 10 }),
      getStats: vi.fn().mockResolvedValue({
        totalRecords: 3,
        dateRange: { earliest: '2024-01-15', latest: '2024-01-17' },
        averageScore: 50,
        recommendationDistribution: { BUY: 1, HOLD: 1, SELL: 1 },
      }),
      clear: vi.fn().mockResolvedValue(undefined),
    },
  }
})

import FortuneLogViewer from '@/components/FortuneLogViewer.vue'

describe('FortuneLogViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should display stats when loaded', async () => {
    const wrapper = mount(FortuneLogViewer)
    await vi.dynamicImportSettled()

    expect(wrapper.text()).toContain('共 3 筆')
  })

  it('should display records list', async () => {
    const wrapper = mount(FortuneLogViewer)
    await vi.dynamicImportSettled()

    expect(wrapper.text()).toContain('買入')
    expect(wrapper.text()).toContain('持有')
    expect(wrapper.text()).toContain('賣出')
    expect(wrapper.text()).toContain('今日財運亨通')
  })

  it('should show recommendation badges', async () => {
    const wrapper = mount(FortuneLogViewer)
    await vi.dynamicImportSettled()

    const badges = wrapper.findAll('.rounded-full')
    const buyBadge = badges.filter(b => b.text().trim() === '買入')
    expect(buyBadge.length).toBeGreaterThan(0)
    expect(buyBadge[0].classes()).toContain('bg-green-500/20')
  })

  it('should display filter controls', async () => {
    const wrapper = mount(FortuneLogViewer)
    await vi.dynamicImportSettled()

    expect(wrapper.find('input[placeholder="搜尋…"]').exists()).toBe(true)
    expect(wrapper.find('select').exists()).toBe(true)
    expect(wrapper.findAll('input[type="date"]').length).toBe(2)
  })

  it('should emit confirmClear when clear button clicked', async () => {
    const wrapper = mount(FortuneLogViewer)
    await vi.dynamicImportSettled()

    const clearBtn = wrapper.findAll('button').find(b => b.text().includes('清除'))
    expect(clearBtn).toBeDefined()
    await clearBtn!.trigger('click')
    await new Promise(r => setTimeout(r, 10))

    expect(wrapper.emitted('confirmClear')).toBeTruthy()
  })
})
