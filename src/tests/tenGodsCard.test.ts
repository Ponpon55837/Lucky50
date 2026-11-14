import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import TenGodsCard from '@/components/TenGodsCard.vue'
import type { UserProfileCompat } from '@/services/integratedFortune'

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

  it('should render title', () => {
    const wrapper = mount(TenGodsCard, {
      props: { profile: mockProfile, date: new Date(2026, 10, 16) },
    })
    expect(wrapper.text()).toContain('八字十神分析')
  })

  it('should show empty state when no profile', async () => {
    const wrapper = mount(TenGodsCard, {
      props: { profile: null, date: new Date(2026, 10, 16) },
    })
    await flushPromises()
    expect(wrapper.text()).toContain('請先設定出生資料')
  })

  it('should calculate and display results', async () => {
    const wrapper = mount(TenGodsCard, {
      props: { profile: mockProfile, date: new Date(2026, 10, 16) },
    })
    await flushPromises()
    expect(wrapper.text()).toContain('今日能量')
    expect(wrapper.text()).toContain('庚午')
    expect(wrapper.text()).toContain('辛巳')
  })

  it('should display investment style', async () => {
    const wrapper = mount(TenGodsCard, {
      props: { profile: mockProfile, date: new Date(2026, 10, 16) },
    })
    await flushPromises()
    expect(wrapper.text()).toContain('投資風格')
  })

  it('should show four pillars grid', async () => {
    const wrapper = mount(TenGodsCard, {
      props: { profile: mockProfile, date: new Date(2026, 10, 16) },
    })
    await flushPromises()
    expect(wrapper.text()).toContain('年柱')
    expect(wrapper.text()).toContain('月柱')
    expect(wrapper.text()).toContain('日柱')
    expect(wrapper.text()).toContain('時柱')
  })
})
