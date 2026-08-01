import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

/**
 * 監測目標元素是否進入可視範圍，僅在「第一次」進入時將 isVisible 設為 true 並停止觀察。
 * 適合用來延遲初始化昂貴的元件（例如 Three.js 場景），避免畫面外的內容也一起搶佔資源。
 */
export function useVisibleOnce(
  target: Ref<HTMLElement | null | undefined>,
  options: IntersectionObserverInit = {}
) {
  const isVisible = ref(false)
  let observer: IntersectionObserver | null = null

  onMounted(() => {
    if (!target.value) return

    if (typeof IntersectionObserver === 'undefined') {
      // 不支援 IntersectionObserver 的環境（例如舊版瀏覽器）直接視為可見
      isVisible.value = true
      return
    }

    observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          isVisible.value = true
          observer?.disconnect()
          observer = null
        }
      },
      { rootMargin: '200px', threshold: 0, ...options }
    )
    observer.observe(target.value)
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    observer = null
  })

  return { isVisible }
}
