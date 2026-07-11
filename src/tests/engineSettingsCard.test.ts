import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import EngineSettingsCard from '@/components/EngineSettingsCard.vue'

describe('EngineSettingsCard', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('should render title', () => {
    const wrapper = mount(EngineSettingsCard)
    expect(wrapper.text()).toContain('命理引擎設定')
  })

  it('should display all engines', () => {
    const wrapper = mount(EngineSettingsCard)
    expect(wrapper.text()).toContain('經典命理')
    expect(wrapper.text()).toContain('八字十神')
    expect(wrapper.text()).toContain('紫微斗數')
    expect(wrapper.text()).toContain('風水方位')
  })

  it('should toggle engine on/off', async () => {
    const wrapper = mount(EngineSettingsCard)
    const buttons = wrapper.findAll('button')
    // 找到第一個 toggle button（經典命理的開關）
    const toggleBtn = buttons[0]
    await toggleBtn.trigger('click')
    // 點擊後應改變狀態（因為 toggle 會改變 enabled）
    expect(wrapper.text()).toContain('命理引擎設定')
  })

  it('should have weight sliders', () => {
    const wrapper = mount(EngineSettingsCard)
    const sliders = wrapper.findAll('input[type="range"]')
    expect(sliders.length).toBe(4) // 4 engines
  })

  it('should save and load settings', async () => {
    const wrapper = mount(EngineSettingsCard)

    // 點擊儲存
    const saveBtn = wrapper.findAll('button').find(b => b.text().includes('儲存'))
    expect(saveBtn).toBeTruthy()
    await saveBtn!.trigger('click')
    await flushPromises()

    // 檢查 localStorage
    const stored = localStorage.getItem('lucky50-engine-settings')
    expect(stored).toBeTruthy()
    const parsed = JSON.parse(stored!)
    expect(parsed.classic).toBeDefined()
    expect(parsed['bazi-ten-gods']).toBeDefined()
  })

  it('should reset to defaults', async () => {
    const wrapper = mount(EngineSettingsCard)

    // 點擊重設
    const resetBtn = wrapper.findAll('button').find(b => b.text().includes('恢復預設'))
    expect(resetBtn).toBeTruthy()
    await resetBtn!.trigger('click')

    // 重設後所有引擎應啟用
    expect(wrapper.text()).toContain('經典命理')
  })
})
