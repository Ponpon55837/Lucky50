/**
 * 長時間的同步計算分段執行用的工具。
 */

interface SchedulerLike {
  yield?: () => Promise<void>
}

/**
 * 把控制權還給瀏覽器，讓畫面有機會更新與回應操作。
 * 優先用 scheduler.yield；沒有時用 MessageChannel（分頁在背景時不會像 setTimeout 被延後到一秒一次）。
 */
export function yieldToMain(): Promise<void> {
  const scheduler = (globalThis as { scheduler?: SchedulerLike }).scheduler
  if (typeof scheduler?.yield === 'function') return scheduler.yield()
  return new Promise(resolve => {
    const channel = new MessageChannel()
    channel.port1.onmessage = () => {
      channel.port1.close()
      resolve()
    }
    channel.port2.postMessage(null)
  })
}

/** 每段最多佔用主執行緒的時間（毫秒），約一個畫格 */
const SLICE_BUDGET_MS = 12

/**
 * 逐項轉換陣列，每做滿一小段時間就讓出主執行緒一次。
 * 結果與 Array.prototype.map 相同，只是不會讓畫面卡住。
 */
export async function mapInSlices<T, R>(
  items: readonly T[],
  transform: (item: T, index: number) => R
): Promise<R[]> {
  const results = new Array<R>(items.length)
  let sliceStart = performance.now()
  for (let i = 0; i < items.length; i++) {
    results[i] = transform(items[i], i)
    if (performance.now() - sliceStart >= SLICE_BUDGET_MS) {
      await yieldToMain()
      sliceStart = performance.now()
    }
  }
  return results
}
