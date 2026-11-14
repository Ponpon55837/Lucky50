import { onBeforeUnmount, watch, type Ref } from 'vue'

/**
 * 開啟期間在 document 上監聽 Esc，關閉時移除。
 * 監聽放在 document 而非元素上，焦點在哪裡都能關閉（例如焦點仍停在觸發按鈕上）。
 */
export function useEscapeKey(active: Ref<boolean>, onEscape: () => void) {
  const handler = (event: KeyboardEvent) => {
    if (event.key === 'Escape') onEscape()
  }

  const stop = () => document.removeEventListener('keydown', handler)

  watch(
    active,
    isActive => {
      stop()
      if (isActive) document.addEventListener('keydown', handler)
    },
    { immediate: true }
  )

  onBeforeUnmount(stop)
}
