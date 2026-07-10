import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useToast } from '@/composables/useToast'

describe('useToast', () => {
  let toast: ReturnType<typeof useToast>

  beforeEach(() => {
    vi.useFakeTimers()
    toast = useToast()
    toast.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initial state', () => {
    it('toasts 初始為空陣列', () => {
      expect(toast.toasts.value).toEqual([])
    })
  })

  describe('addToast', () => {
    it('加入一條 toast', () => {
      const id = toast.addToast({ type: 'info', title: '提示' })
      expect(toast.toasts.value).toHaveLength(1)
      expect(toast.toasts.value[0].title).toBe('提示')
      expect(toast.toasts.value[0].type).toBe('info')
      expect(id).toBeTruthy()
    })

    it('自動生成 id', () => {
      const id1 = toast.addToast({ type: 'success', title: 'A' })
      const id2 = toast.addToast({ type: 'error', title: 'B' })
      expect(id1).not.toBe(id2)
    })

    it('預設 duration 為 3000', () => {
      const id = toast.addToast({ type: 'info', title: 'test' })
      const item = toast.toasts.value.find(t => t.id === id)
      expect(item!.duration).toBe(3000)
    })

    it('自訂 duration', () => {
      const id = toast.addToast({ type: 'info', title: 'test', duration: 5000 })
      const item = toast.toasts.value.find(t => t.id === id)
      expect(item!.duration).toBe(5000)
    })

    it('duration 過期後自動移除', () => {
      toast.addToast({ type: 'info', title: 'auto', duration: 1000 })
      expect(toast.toasts.value).toHaveLength(1)
      vi.advanceTimersByTime(1001)
      expect(toast.toasts.value).toHaveLength(0)
    })
  })

  describe('removeToast', () => {
    it('移除指定 toast', () => {
      toast.addToast({ type: 'info', title: 'A' })
      toast.addToast({ type: 'error', title: 'B' })
      toast.removeToast(toast.toasts.value[0].id)
      expect(toast.toasts.value).toHaveLength(1)
      expect(toast.toasts.value[0].title).toBe('B')
    })
  })

  describe('convenience methods', () => {
    it('success 建立成功類型 toast', () => {
      toast.success('成功', '操作完成')
      expect(toast.toasts.value[0].type).toBe('success')
      expect(toast.toasts.value[0].title).toBe('成功')
      expect(toast.toasts.value[0].message).toBe('操作完成')
    })

    it('error 建立錯誤類型 toast', () => {
      toast.error('失敗', '發生錯誤')
      expect(toast.toasts.value[0].type).toBe('error')
    })

    it('warning 建立警告類型 toast', () => {
      toast.warning('警告')
      expect(toast.toasts.value[0].type).toBe('warning')
    })

    it('info 建立資訊類型 toast', () => {
      toast.info('資訊')
      expect(toast.toasts.value[0].type).toBe('info')
    })
  })

  describe('clear', () => {
    it('清除所有 toast', () => {
      toast.success('A')
      toast.error('B')
      toast.clear()
      expect(toast.toasts.value).toEqual([])
    })
  })
})
