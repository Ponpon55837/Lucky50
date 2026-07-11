// Resource preloading strategy
// 注意：不要在此自動預載重型元件（PriceChart, FortuneCard 等），
// 否則會將 chart.js 等依賴拉進 main chunk，擊潰 code splitting。
// 預載由各頁面的 defineAsyncComponent 按需處理。

export class ResourcePreloader {
  private static preloadedResources = new Set<string>()

  /**
   * Preload critical resources — 僅預載 lightweight 資源
   */
  static preloadCriticalResources() {
    // 僅預載路由 prefetch（ lightweight ）
    this.preloadRoute('/dashboard')
    this.preloadRoute('/analytics')
  }

  /**
   * Preload route component
   */
  private static preloadRoute(route: string) {
    if (this.preloadedResources.has(route)) return

    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = route
    document.head.appendChild(link)

    this.preloadedResources.add(route)
  }

  /**
   * Preload fonts
   */
  static preloadFonts() {
    const fontUrl =
      'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700&display=swap'

    if (this.preloadedResources.has(fontUrl)) return

    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = fontUrl
    link.as = 'style'
    link.crossOrigin = 'anonymous'
    document.head.appendChild(link)

    this.preloadedResources.add(fontUrl)
  }

  /**
   * Initialize preloading when page loads
   */
  static init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
          this.preloadCriticalResources()
          this.preloadFonts()
        }, 2000)
      })
    } else {
      setTimeout(() => {
        this.preloadCriticalResources()
        this.preloadFonts()
      }, 2000)
    }
  }
}

// Auto-initialize — 延遲 2 秒，避免阻塞首次繪製
ResourcePreloader.init()
