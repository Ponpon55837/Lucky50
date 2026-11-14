import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

/**
 * 追蹤元素寬度（ResizeObserver）。SVG 圖表依實際寬度繪製，
 * 讓印章等元素保持正確比例，而不是被 viewBox 拉伸。
 */
export function useElementWidth(target: Ref<HTMLElement | null | undefined>, fallback = 640) {
  const width = ref(fallback)
  let observer: ResizeObserver | null = null

  onMounted(() => {
    const el = target.value
    if (!el) return
    width.value = el.clientWidth || fallback
    if (typeof ResizeObserver === 'undefined') return

    observer = new ResizeObserver(([entry]) => {
      const next = Math.round(entry.contentRect.width)
      if (next > 0 && next !== width.value) width.value = next
    })
    observer.observe(el)
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    observer = null
  })

  return { width }
}
