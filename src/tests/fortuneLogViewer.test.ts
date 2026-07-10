import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

vi.mock('@/services/fortuneStore', () => {
  const mockRecords = [
    {
      id: 1,
      date: '2024-01-15',
      timestamp: 1705276800000,
      overallScore: 75,
      investmentScore: 80,
      recommendation: 'BUY',
      elements: { metal: 50, wood: 60, water: 40, fire: 55, earth: 45 },
      lunarSummary: '今日財運亨通',
      userProfileHash: 'h1',
    },
    {
      id: 2,
      date: '2024-01-16',
      timestamp: 1705363200000,
      overallScore: 55,
      investmentScore: 45,
      recommendation: 'HOLD',
      elements: { metal: 55, wood: 45, water: 50, fire: 50, earth: 50 },
      lunarSummary: '今日宜觀望',
      userProfileHash: 'h1',
    },
    {
      id: 3,
      date: '2024-01-17',
      timestamp: 1705449600000,
      overallScore: 30,
      investmentScore: 25,
      recommendation: 'SELL',
      elements: { metal: 40, wood: 70, water: 30, fire: 60, earth: 50 },
      lunarSummary: '今日運勢不佳',
      userProfileHash: 'h1',
    },
  ]

  const store = {
    init: vi.fn().mockResolvedValue(undefined),
    query: vi
      .fn()
      .mockResolvedValue({ records: mockRecords, total: 3, pageIndex: 0, pageSize: 10 }),
    getStats: vi.fn().mockResolvedValue({
      totalRecords: 3,
      dateRange: { earliest: '2024-01-15', latest: '2024-01-17' },
      averageScore: 50,
      recommendationDistribution: { BUY: 1, HOLD: 1, SELL: 1 },
    }),
    clear: vi.fn().mockResolvedValue(undefined),
  }

  return { fortuneHistoryStore: store }
})

import FortuneLogViewer from '@/components/FortuneLogViewer.vue'
import { fortuneHistoryStore } from '@/services/fortuneStore'

describe('FortuneLogViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    document.body.innerHTML = ''
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should display stats when loaded', async () => {
    const wrapper = mount(FortuneLogViewer)
    await flushPromises()

    expect(wrapper.text()).toContain('共 3 筆')
  })

  it('should display records list', async () => {
    const wrapper = mount(FortuneLogViewer)
    await flushPromises()

    expect(wrapper.text()).toContain('買入')
    expect(wrapper.text()).toContain('持有')
    expect(wrapper.text()).toContain('賣出')
    expect(wrapper.text()).toContain('今日財運亨通')
  })

  it('should show recommendation badges in records', async () => {
    const wrapper = mount(FortuneLogViewer)
    await flushPromises()

    const buyBadges = wrapper.findAll('.bg-green-500\\/20')
    expect(buyBadges.length).toBeGreaterThan(0)
    expect(buyBadges[0].text().trim()).toBe('買入')
  })

  it('should display filter chip buttons instead of select', async () => {
    const wrapper = mount(FortuneLogViewer)
    await flushPromises()

    expect(wrapper.find('input[placeholder="搜尋"]').exists()).toBe(true)
    expect(wrapper.find('select').exists()).toBe(false)

    const chipTexts = ['買入', '持有', '賣出']
    for (const text of chipTexts) {
      const chip = wrapper.findAll('button').find(b => b.text().trim() === text)
      expect(chip).toBeDefined()
    }
  })

  it('should show confirmation dialog when clear button clicked', async () => {
    const wrapper = mount(FortuneLogViewer)
    await flushPromises()

    const clearBtn = wrapper.findAll('button').find(b => b.text().includes('清除'))
    expect(clearBtn).toBeDefined()
    await clearBtn!.trigger('click')
    await flushPromises()

    const dialogText = document.body.textContent || ''
    expect(dialogText).toContain('確認清除')
    expect(dialogText).toContain('此操作無法復原')
    expect(wrapper.emitted('confirmClear')).toBeFalsy()
  })

  it('should emit confirmClear after confirming in dialog', async () => {
    const wrapper = mount(FortuneLogViewer)
    await flushPromises()

    const clearBtn = wrapper.findAll('button').find(b => b.text().includes('清除'))
    await clearBtn!.trigger('click')
    await flushPromises()

    const confirmBtns = document.body.querySelectorAll('button')
    const confirmBtn = Array.from(confirmBtns).find(b => b.textContent?.includes('確認清除'))
    expect(confirmBtn).toBeDefined()
    confirmBtn!.click()
    await flushPromises()

    expect(wrapper.emitted('confirmClear')).toBeTruthy()
  })

  it('should close dialog when cancel clicked', async () => {
    const wrapper = mount(FortuneLogViewer)
    await flushPromises()

    const clearBtn = wrapper.findAll('button').find(b => b.text().includes('清除'))
    await clearBtn!.trigger('click')
    await flushPromises()

    expect(document.body.textContent).toContain('確認清除')

    const cancelBtns = document.body.querySelectorAll('button')
    const cancelBtn = Array.from(cancelBtns).find(b => b.textContent?.trim() === '取消')
    cancelBtn!.click()
    await flushPromises()

    expect(document.body.textContent).not.toContain('確認清除')
  })

  it('should show skeleton loading state', async () => {
    vi.mocked(fortuneHistoryStore.query).mockImplementation(() => new Promise(() => {}) as never)

    const wrapper = mount(FortuneLogViewer)
    await flushPromises()
    await wrapper.vm.$nextTick()

    const skeletons = wrapper.findAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })
})
