import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import TenGodsCard from '@/components/TenGodsCard.vue'
import type { UserProfileCompat } from '@/services/integratedFortune'

vi.mock('@/services/lunar', () => ({
  lunarService: {
    getLunarData: vi.fn(() => ({
      lunarYear: '庚午',
      lunarMonth: '四月',
      lunarDay: '廿一',
      ganZhi: '庚午',
      monthGanZhi: '辛巳',
      dayGanZhi: '丙寅',
      zodiac: '馬',
      constellation: '金牛座',
      naYin: '路旁土',
      jieQi: '',
      festivals: [],
      yi: [],
      ji: [],
      pengZu: '',
      naYinDay: '',
      jiuXing: '',
    })),
  },
}))

describe('TenGodsCard', () => {
  const mockProfile: UserProfileCompat = {
    name: '測試',
    birthDate: '1990-05-15',
    birthTime: '10:30',
    zodiac: '馬',
    element: '火',
    nameElement: '火',
    nameStrokes: 20,
    luckyColors: ['紅色'],
    luckyNumbers: [2, 7],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render title', () => {
    const wrapper = mount(TenGodsCard, {
      props: { profile: mockProfile },
    })
    expect(wrapper.text()).toContain('八字十神分析')
  })

  it('should show empty state when no profile', async () => {
    const wrapper = mount(TenGodsCard, {
      props: { profile: null },
    })
    await flushPromises()
    expect(wrapper.text()).toContain('請先設定出生資料')
  })

  it('should calculate and display results', async () => {
    const wrapper = mount(TenGodsCard, {
      props: { profile: mockProfile },
    })
    await flushPromises()
    expect(wrapper.text()).toContain('十神能量分數')
    expect(wrapper.text()).toContain('庚午')
    expect(wrapper.text()).toContain('辛巳')
  })

  it('should display investment style', async () => {
    const wrapper = mount(TenGodsCard, {
      props: { profile: mockProfile },
    })
    await flushPromises()
    expect(wrapper.text()).toContain('投資風格')
  })

  it('should show four pillars grid', async () => {
    const wrapper = mount(TenGodsCard, {
      props: { profile: mockProfile },
    })
    await flushPromises()
    expect(wrapper.text()).toContain('年柱')
    expect(wrapper.text()).toContain('月柱')
    expect(wrapper.text()).toContain('日柱')
    expect(wrapper.text()).toContain('時柱')
  })
})
