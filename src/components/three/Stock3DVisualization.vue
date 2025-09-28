<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue'
import * as THREE from 'three'
import { ThreeJSScene, createThemeGlowMaterial, getThemeColor } from '@/utils/three-scene'
import { useTheme } from '@/composables/useTheme'
import { useDashboardStore } from '@/stores/dashboard'
import { useAnalyticsStore } from '@/stores/analytics'

interface Props {
  title?: string
}

// 配置常量
const ANIMATION_CONFIG = {
  priceSphere: {
    radius: 0.06,
    pulseScale: 0.2,
    pulseSpeed: 0.002,
  },
  fortuneOrb: {
    radius: 0.3,
    position: { x: 4, y: 1.5, z: 0 },
    rotationSpeed: 0.01,
  },
  particles: {
    count: 150,
    bounds: { x: 12, y: 8, z: 6 },
    floatSpeed: 0.002,
  },
  priceRange: {
    width: 8,
    height: 3,
  },
} as const

type AnimationRefs = Set<() => void>

const { title = '股價 3D 動態' } = defineProps<Props>()

// 使用 stores
const dashboardStore = useDashboardStore()
const analyticsStore = useAnalyticsStore()
const { isDark } = useTheme()

// 動畫管理
const animationRefs: AnimationRefs = new Set()
const threeContainer = ref<HTMLElement>()
let scene: ThreeJSScene | null = null
let priceLineGroup: THREE.Group | null = null
let fortuneOrb: THREE.Mesh | null = null

// 清理所有動畫
const cleanupAnimations = () => {
  animationRefs.clear()
}

// 註冊動畫循環
const registerAnimation = (animationFn: () => void) => {
  animationRefs.add(animationFn)
  return animationFn
}

// 從 store 獲取數據 - 優化計算屬性
const etfData = computed(() => analyticsStore.getAdjustedEtfData(dashboardStore.etfData))
const fortuneScore = computed(() => dashboardStore.unifiedInvestmentScore)

// 計算最新價格和變化
const latestPrice = computed(() => {
  if (etfData.value.length === 0) return 0
  return etfData.value[etfData.value.length - 1]?.close || 0
})

const priceChange = computed(() => {
  if (etfData.value.length < 2) return 0
  const current = etfData.value[etfData.value.length - 1]
  const previous = etfData.value[etfData.value.length - 2]
  return current.close - previous.close
})

const priceChangePercent = computed(() => {
  if (etfData.value.length < 2) return 0
  const current = etfData.value[etfData.value.length - 1]
  const previous = etfData.value[etfData.value.length - 2]
  return ((current.close - previous.close) / previous.close) * 100
})

const priceChangeColor = computed(() => {
  const change = priceChange.value
  return change > 0 ? 'text-green-400' : change < 0 ? 'text-red-400' : 'text-gray-400'
})

const fortuneEffect = computed(() => {
  const score = fortuneScore.value
  if (score >= 80) return '極佳 ✨'
  if (score >= 60) return '良好 ⭐'
  if (score >= 40) return '普通 ➖'
  return '不佳 ❌'
})

// 創建價格球體
const createPriceSphere = (
  x: number,
  y: number,
  z: number,
  price: number,
  index: number
): THREE.Mesh => {
  const { radius } = ANIMATION_CONFIG.priceSphere

  const geometry = new THREE.SphereGeometry(radius, 16, 16)
  const isPositive = index > 0 ? price > etfData.value[index - 1].close : true
  const color = isPositive
    ? getThemeColor('success', isDark.value)
    : getThemeColor('danger', isDark.value)
  const material = createThemeGlowMaterial(color, 1.0, isDark.value)

  const sphere = new THREE.Mesh(geometry, material)
  sphere.position.set(x, y, z)

  return sphere
}

// 創建成交量柱狀圖
const createVolumeBar = (x: number, data: any, index: number): THREE.Mesh => {
  const maxVolume = Math.max(...etfData.value.map(d => d.volume))
  const volumeHeight = (data.volume / maxVolume) * 1.2

  const geometry = new THREE.CylinderGeometry(0.02, 0.04, volumeHeight, 8)
  const color = getThemeColor('info', isDark.value)
  const material = createThemeGlowMaterial(color, 0.7, isDark.value)
  const bar = new THREE.Mesh(geometry, material)
  bar.position.set(x, -2 + volumeHeight / 2, -0.8)

  // 添加上升動畫
  bar.scale.y = 0
  setTimeout(() => {
    const animateBar = () => {
      bar.scale.y += (1 - bar.scale.y) * 0.08
      if (Math.abs(1 - bar.scale.y) > 0.01) {
        requestAnimationFrame(animateBar)
      }
    }
    animateBar()
  }, index * 100)

  return bar
}

// 創建粒子背景
const createParticleBackground = (): THREE.Points => {
  const { count, bounds } = ANIMATION_CONFIG.particles

  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)

  const baseColor = new THREE.Color(getThemeColor('accent', isDark.value))

  for (let i = 0; i < count; i++) {
    const i3 = i * 3
    positions[i3] = (Math.random() - 0.5) * bounds.x
    positions[i3 + 1] = (Math.random() - 0.5) * bounds.y
    positions[i3 + 2] = (Math.random() - 0.5) * bounds.z

    colors[i3] = baseColor.r + (Math.random() - 0.5) * 0.3
    colors[i3 + 1] = baseColor.g + (Math.random() - 0.5) * 0.3
    colors[i3 + 2] = baseColor.b + (Math.random() - 0.5) * 0.3
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  const material = new THREE.PointsMaterial({
    size: 0.03,
    vertexColors: true,
    transparent: true,
    opacity: isDark.value ? 0.6 : 0.4,
  })

  const particles = new THREE.Points(geometry, material)

  // 粒子漂浮動畫
  const animate = () => {
    if (!particles.parent) return

    const positions = particles.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      positions[i3 + 1] +=
        Math.sin(Date.now() * 0.001 + i * 0.1) * ANIMATION_CONFIG.particles.floatSpeed
    }
    particles.geometry.attributes.position.needsUpdate = true
    particles.rotation.y += 0.003

    requestAnimationFrame(animate)
  }

  registerAnimation(animate)
  animate()

  return particles
}

// 創建運勢能量球
const createFortuneOrb = (): THREE.Mesh => {
  const { radius, position, rotationSpeed } = ANIMATION_CONFIG.fortuneOrb

  const geometry = new THREE.SphereGeometry(radius, 24, 24)
  const score = fortuneScore.value
  const color =
    score >= 60
      ? getThemeColor('success', isDark.value)
      : score >= 40
        ? getThemeColor('warning', isDark.value)
        : getThemeColor('danger', isDark.value)

  const material = createThemeGlowMaterial(color, score / 100, isDark.value)
  const orb = new THREE.Mesh(geometry, material)
  orb.position.set(position.x, position.y, position.z)

  // 旋轉動畫
  const animate = () => {
    if (!orb.parent) return

    orb.rotation.x += rotationSpeed
    orb.rotation.y += rotationSpeed

    requestAnimationFrame(animate)
  }

  registerAnimation(animate)
  animate()

  return orb
}

// 創建 3D 價格線 - 重構後更清晰
const createPriceLine = () => {
  if (!scene || etfData.value.length === 0) return

  // 清除舊的價格線和動畫
  if (priceLineGroup) {
    scene.removeFromScene(priceLineGroup)
  }
  cleanupAnimations()

  priceLineGroup = new THREE.Group()

  // 計算價格範圍
  const prices = etfData.value.map(d => d.close)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const priceRange = maxPrice - minPrice

  // 創建價格點和連線
  const points: THREE.Vector3[] = []

  etfData.value.forEach((data, index) => {
    const x =
      (index / (etfData.value.length - 1)) * ANIMATION_CONFIG.priceRange.width -
      ANIMATION_CONFIG.priceRange.width / 2
    const y =
      ((data.close - minPrice) / priceRange) * ANIMATION_CONFIG.priceRange.height -
      ANIMATION_CONFIG.priceRange.height / 2
    const z = 0

    points.push(new THREE.Vector3(x, y, z))

    // 創建價格點球體
    const sphere = createPriceSphere(x, y, z, data.close, index)

    // 統一的脈動動畫
    const animate = () => {
      if (!sphere.parent) return

      const time = Date.now() * ANIMATION_CONFIG.priceSphere.pulseSpeed + index * 0.3
      const scale = 1 + Math.sin(time) * ANIMATION_CONFIG.priceSphere.pulseScale
      sphere.scale.setScalar(scale)

      requestAnimationFrame(animate)
    }

    registerAnimation(animate)
    animate()
    priceLineGroup!.add(sphere)

    // 添加成交量柱狀圖
    const volumeBar = createVolumeBar(x, data, index)
    priceLineGroup!.add(volumeBar)
  })

  // 創建增強的價格線 - 管道效果
  if (points.length > 1) {
    const curve = new THREE.CatmullRomCurve3(points)
    const tubeGeometry = new THREE.TubeGeometry(curve, 100, 0.02, 8, false)
    const lineColor =
      priceChange.value >= 0
        ? getThemeColor('success', isDark.value)
        : getThemeColor('danger', isDark.value)
    const tubeMaterial = createThemeGlowMaterial(lineColor, 0.9, isDark.value)
    const tube = new THREE.Mesh(tubeGeometry, tubeMaterial)
    priceLineGroup!.add(tube)

    // 添加發光軌跡
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points)
    const lineMaterial = new THREE.LineBasicMaterial({
      color: lineColor,
      transparent: true,
      opacity: isDark.value ? 0.8 : 0.6,
      linewidth: 3,
    })
    const line = new THREE.Line(lineGeometry, lineMaterial)
    priceLineGroup!.add(line)
  }

  // 添加粒子背景效果
  const particles = createParticleBackground()
  priceLineGroup!.add(particles)

  scene.addToScene(priceLineGroup)
}

// 主要創建函數
const createVisualization = () => {
  if (!scene) return

  createPriceLine()

  // 重新創建運勢球
  if (fortuneOrb) {
    scene.removeFromScene(fortuneOrb)
  }
  fortuneOrb = createFortuneOrb()
  scene.addToScene(fortuneOrb)
}

// 初始化場景
const initScene = () => {
  if (!threeContainer.value || scene) return

  scene = new ThreeJSScene(threeContainer.value, {
    alpha: true,
    antialias: true,
    isDark: isDark.value,
  })

  // 設置相機位置
  const camera = scene.getCamera()
  camera.position.set(0, 1, 8)
  camera.lookAt(0, 0, 0)

  createVisualization()
}

// 清理資源
const cleanup = () => {
  cleanupAnimations()
  scene?.destroy()
  scene = null
  priceLineGroup = null
  fortuneOrb = null
}

// 監聽數據變化
watch(
  etfData,
  () => {
    if (scene) {
      createVisualization()
    }
  },
  { deep: true }
)

watch(fortuneScore, () => {
  if (scene) {
    createVisualization()
  }
})

// 監聽主題變化
watch(isDark, newIsDark => {
  if (scene) {
    scene.updateTheme(newIsDark)
    nextTick(() => {
      createVisualization()
    })
  }
})

onMounted(() => {
  nextTick(() => {
    initScene()
  })
})

onUnmounted(() => {
  cleanup()
})
</script>

<template>
  <div
    class="relative w-full h-full bg-gradient-to-br from-surface-bg/50 via-card-bg to-surface-bg rounded-lg overflow-hidden border border-border-light"
  >
    <div ref="threeContainer" class="w-full h-full"></div>
    <div class="absolute top-4 left-4 text-primary-text">
      <h3 class="text-lg font-semibold mb-2 text-primary-text">{{ title }}</h3>
      <div class="text-sm space-y-1">
        <div>
          最新價格: <span :class="priceChangeColor">{{ latestPrice?.toFixed(2) }}</span>
        </div>
        <div>
          漲跌:
          <span :class="priceChangeColor"
            >{{ priceChange >= 0 ? '+' : '' }}{{ priceChange?.toFixed(2) }}</span
          >
        </div>
        <div>
          漲跌幅:
          <span :class="priceChangeColor"
            >{{ priceChange >= 0 ? '+' : '' }}{{ priceChangePercent?.toFixed(2) }}%</span
          >
        </div>
      </div>
    </div>
    <div class="absolute bottom-4 right-4 text-secondary-text text-xs">
      <div>運勢影響: {{ fortuneEffect }}</div>
    </div>
  </div>
</template>
