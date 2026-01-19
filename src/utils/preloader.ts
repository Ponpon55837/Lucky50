// Resource preloading strategy
import type { Component } from 'vue'

export class ResourcePreloader {
  private static preloadedResources = new Set<string>()

  /**
   * Preload critical resources
   */
  static preloadCriticalResources() {
    // Preload critical routes
    this.preloadRoute('/dashboard')
    this.preloadRoute('/analytics')

    // Preload critical components
    this.preloadComponent(() => import('@/components/charts/PriceChart.vue'))
    this.preloadComponent(() => import('@/components/FortuneCard.vue'))
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
   * Preload component module
   */
  private static async preloadComponent(importFunc: () => Promise<{ default: Component }>) {
    try {
      await importFunc()
    } catch (error) {
      console.warn('Failed to preload component:', error)
    }
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
        // Preload after initial render
        setTimeout(() => {
          this.preloadCriticalResources()
          this.preloadFonts()
        }, 1000)
      })
    } else {
      setTimeout(() => {
        this.preloadCriticalResources()
        this.preloadFonts()
      }, 1000)
    }
  }
}

// Auto-initialize
ResourcePreloader.init()
