import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import NotFound from '@/views/NotFound.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div>Home</div>' } },
    { path: '/:pathMatch(.*)*', component: NotFound },
  ],
})

describe('NotFound', () => {
  it('should render 404 title', () => {
    const wrapper = mount(NotFound, {
      global: { plugins: [router] },
    })
    expect(wrapper.text()).toContain('找不到頁面')
  })

  it('should render 404 number', () => {
    const wrapper = mount(NotFound, {
      global: { plugins: [router] },
    })
    expect(wrapper.text()).toContain('404')
  })

  it('should render description text', () => {
    const wrapper = mount(NotFound, {
      global: { plugins: [router] },
    })
    expect(wrapper.text()).toContain('您要找的頁面不存在')
  })

  it('should have go home button', () => {
    const wrapper = mount(NotFound, {
      global: { plugins: [router] },
    })
    const buttons = wrapper.findAll('button')
    const homeBtn = buttons.find(b => b.text().includes('返回首頁'))
    expect(homeBtn).toBeDefined()
  })

  it('should have go back button', () => {
    const wrapper = mount(NotFound, {
      global: { plugins: [router] },
    })
    const buttons = wrapper.findAll('button')
    const backBtn = buttons.find(b => b.text().includes('回上一頁'))
    expect(backBtn).toBeDefined()
  })

  it('should use btn-primary class on home button', () => {
    const wrapper = mount(NotFound, {
      global: { plugins: [router] },
    })
    const buttons = wrapper.findAll('button')
    const homeBtn = buttons.find(b => b.text().includes('返回首頁'))
    expect(homeBtn?.classes()).toContain('btn-primary')
  })

  it('should use btn-secondary class on back button', () => {
    const wrapper = mount(NotFound, {
      global: { plugins: [router] },
    })
    const buttons = wrapper.findAll('button')
    const backBtn = buttons.find(b => b.text().includes('回上一頁'))
    expect(backBtn?.classes()).toContain('btn-secondary')
  })
})
