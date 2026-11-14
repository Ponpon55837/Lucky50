import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ZiWeiCard from '@/components/ZiWeiCard.vue'
import type { UserProfileCompat } from '@/services/integratedFortune'

describe('ZiWeiCard', () => {
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
    const wrapper = mount(ZiWeiCard, {
      props: { profile: mockProfile, date: new Date(2026, 10, 16) },
    })
    expect(wrapper.text()).toContain('紫微斗數分析')
  })

  it('should show empty state when no profile', async () => {
    const wrapper = mount(ZiWeiCard, {
      props: { profile: null, date: new Date(2026, 10, 16) },
    })
    await flushPromises()
    expect(wrapper.text()).toContain('請先設定出生資料')
  })

  it('should calculate and display results', async () => {
    const wrapper = mount(ZiWeiCard, {
      props: { profile: mockProfile, date: new Date(2026, 10, 16) },
    })
    await flushPromises()
    expect(wrapper.text()).toContain('今日能量')
    expect(wrapper.text()).toMatch(/命宮主星|命無正曜/)
  })

  it('should display three palaces', async () => {
    const wrapper = mount(ZiWeiCard, {
      props: { profile: mockProfile, date: new Date(2026, 10, 16) },
    })
    await flushPromises()
    expect(wrapper.text()).toContain('命宮')
    expect(wrapper.text()).toContain('財帛宮')
    expect(wrapper.text()).toContain('官祿宮')
    expect(wrapper.text()).toContain('遷移宮')
  })

  it('should display risk assessment', async () => {
    const wrapper = mount(ZiWeiCard, {
      props: { profile: mockProfile, date: new Date(2026, 10, 16) },
    })
    await flushPromises()
    expect(wrapper.text()).toContain('風險傾向')
  })
})
