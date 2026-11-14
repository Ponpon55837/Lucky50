import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import FengShuiCard from '@/components/FengShuiCard.vue'
import type { UserProfileCompat } from '@/services/integratedFortune'

describe('FengShuiCard', () => {
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
    const wrapper = mount(FengShuiCard, {
      props: { profile: mockProfile, date: new Date(2026, 10, 16) },
    })
    expect(wrapper.text()).toContain('風水方位與流日')
  })

  it('should show empty state when no profile', async () => {
    const wrapper = mount(FengShuiCard, {
      props: { profile: null, date: new Date(2026, 10, 16) },
    })
    await flushPromises()
    expect(wrapper.text()).toContain('請先設定出生資料')
  })

  it('should calculate and display daily fortune', async () => {
    const wrapper = mount(FengShuiCard, {
      props: { profile: mockProfile, date: new Date(2026, 10, 16) },
    })
    await flushPromises()
    expect(wrapper.text()).toContain('今日流日')
    expect(wrapper.text()).toContain('納音屬金')
    expect(wrapper.text()).toContain('財位在東北')
  })

  it('should display lucky directions', async () => {
    const wrapper = mount(FengShuiCard, {
      props: { profile: mockProfile, date: new Date(2026, 10, 16) },
    })
    await flushPromises()
    expect(wrapper.text()).toContain('吉方')
  })

  it('should display avoid directions', async () => {
    const wrapper = mount(FengShuiCard, {
      props: { profile: mockProfile, date: new Date(2026, 10, 16) },
    })
    await flushPromises()
    expect(wrapper.text()).toContain('凶方')
  })
})
