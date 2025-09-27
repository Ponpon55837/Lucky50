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

const { title = '股價 3D 動態' } = defineProps<Props>()

// 使用 stores
const dashboardStore = useDashboardStore()
const analyticsStore = useAnalyticsStore()

// 從 store 獲取數據
const etfData = computed(() => analyticsStore.getAdjustedEtfData(dashboardStore.etfData))
const fortuneScore = computed(() => dashboardStore.unifiedInvestmentScore)

const { isDark } = useTheme()
const threeContainer = ref<HTMLElement>()
let scene: ThreeJSScene | null = null
let priceLineGroup: THREE.Group | null = null
let fortuneOrb: THREE.Mesh | null = null

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

// 創建 3D 價格線
const createPriceLine = () => {
  if (!scene || etfData.value.length === 0) return

  // 清除舊的價格線
  if (priceLineGroup) {
    scene.removeFromScene(priceLineGroup)
  }

  priceLineGroup = new THREE.Group()

  // 計算價格範圍
  const prices = etfData.value.map(d => d.close)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const priceRange = maxPrice - minPrice

  // 創建價格點和連線
  const points: THREE.Vector3[] = []
  const spheres: THREE.Mesh[] = []
  const bars: THREE.Mesh[] = []

  etfData.value.forEach((data, index) => {
    const x = (index / (etfData.value.length - 1)) * 8 - 4
    const y = ((data.close - minPrice) / priceRange) * 3 - 1.5
    const z = 0

    points.push(new THREE.Vector3(x, y, z))

    // 創建價格點球體 - 增強視覺效果
    const sphereGeometry = new THREE.SphereGeometry(0.06, 16, 16)
    const isPositive = data.close > (index > 0 ? etfData.value[index - 1].close : data.close)
    const color = isPositive
      ? getThemeColor('success', isDark.value)
      : getThemeColor('danger', isDark.value)
    const sphereMaterial = createThemeGlowMaterial(color, 1.0, isDark.value)
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
    sphere.position.set(x, y, z)

    // 添加脈動效果
    const animate = () => {
      if (sphere.parent) {
        const time = Date.now() * 0.002 + index * 0.3
        const scale = 1 + Math.sin(time) * 0.2
        sphere.scale.setScalar(scale)
        requestAnimationFrame(animate)
      }
    }

    spheres.push(sphere)
    priceLineGroup!.add(sphere)

    // 添加成交量柱狀圖 - 增強動畫
    const volumeHeight = (data.volume / Math.max(...etfData.value.map(d => d.volume))) * 1.2
    const barGeometry = new THREE.CylinderGeometry(0.02, 0.04, volumeHeight, 8)
    const barColor = getThemeColor('info', isDark.value)
    const barMaterial = createThemeGlowMaterial(barColor, 0.7, isDark.value)
    const bar = new THREE.Mesh(barGeometry, barMaterial)
    bar.position.set(x, -2 + volumeHeight / 2, -0.8)

    // 添加上升動畫
    bar.scale.y = 0
    setTimeout(() => {
      const targetScale = { y: 1 }
      const animateBar = () => {
        bar.scale.y += (targetScale.y - bar.scale.y) * 0.08
        if (Math.abs(targetScale.y - bar.scale.y) > 0.01) {
          requestAnimationFrame(animateBar)
        }
      }
      animateBar()
      animate() // 啟動球體脈動
    }, index * 100)

    bars.push(bar)
    priceLineGroup!.add(bar)
  })

  // 創建增強的價格線 - 管道效果
  if (points.length > 1) {
    // 創建曲線
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
  const particleCount = 150
  const positions = new Float32Array(particleCount * 3)
  const colors = new Float32Array(particleCount * 3)

  const baseColor = new THREE.Color(getThemeColor('accent', isDark.value))

  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3
    positions[i3] = (Math.random() - 0.5) * 12
    positions[i3 + 1] = (Math.random() - 0.5) * 8
    positions[i3 + 2] = (Math.random() - 0.5) * 6

    colors[i3] = baseColor.r + (Math.random() - 0.5) * 0.3
    colors[i3 + 1] = baseColor.g + (Math.random() - 0.5) * 0.3
    colors[i3 + 2] = baseColor.b + (Math.random() - 0.5) * 0.3
  }

  const particleGeometry = new THREE.BufferGeometry()
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  const particleMaterial = new THREE.PointsMaterial({
    size: 0.03,
    vertexColors: true,
    transparent: true,
    opacity: isDark.value ? 0.6 : 0.4,
  })

  const particles = new THREE.Points(particleGeometry, particleMaterial)
  priceLineGroup!.add(particles)

  // 粒子漂浮動畫
  const animateParticles = () => {
    if (particles.parent) {
      const positions = particles.geometry.attributes.position.array as Float32Array
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3
        positions[i3 + 1] += Math.sin(Date.now() * 0.001 + i * 0.1) * 0.002
      }
      particles.geometry.attributes.position.needsUpdate = true
      particles.rotation.y += 0.003
      requestAnimationFrame(animateParticles)
    }
  }
  animateParticles()

  scene.addToScene(priceLineGroup)
}

// 創建運勢能量球
const createFortuneOrb = () => {
  if (!scene) return

  if (fortuneOrb) {
    scene.removeFromScene(fortuneOrb)
  }

  const orbGeometry = new THREE.SphereGeometry(0.3, 24, 24) // 縮小球體
  const orbColor =
    fortuneScore.value >= 60
      ? getThemeColor('success', isDark.value)
      : fortuneScore.value >= 40
        ? getThemeColor('warning', isDark.value)
        : getThemeColor('danger', isDark.value)

  const orbMaterial = createThemeGlowMaterial(orbColor, fortuneScore.value / 100, isDark.value)
  fortuneOrb = new THREE.Mesh(orbGeometry, orbMaterial)
  fortuneOrb.position.set(4, 1.5, 0) // 調整位置

  scene.addToScene(fortuneOrb)

  // 旋轉動畫
  const rotateOrb = () => {
    if (fortuneOrb) {
      fortuneOrb.rotation.x += 0.01
      fortuneOrb.rotation.y += 0.01
      requestAnimationFrame(rotateOrb)
    }
  }
  rotateOrb()
}

// 初始化場景
const initScene = () => {
  if (!threeContainer.value) return

  scene = new ThreeJSScene(threeContainer.value, {
    alpha: true,
    antialias: true,
    isDark: isDark.value,
  })

  // 設置相機位置 - 調整視角
  const camera = scene.getCamera()
  camera.position.set(0, 1, 8) // 調整相機位置
  camera.lookAt(0, 0, 0)

  createPriceLine()
  createFortuneOrb()
}

// 監聽數據變化
watch(
  () => etfData.value,
  () => {
    if (scene) {
      createPriceLine()
    }
  },
  { deep: true }
)

watch(
  () => fortuneScore.value,
  () => {
    if (scene) {
      createFortuneOrb()
    }
  }
)

// 監聽主題變化
watch(isDark, newIsDark => {
  if (scene) {
    scene.updateTheme(newIsDark)
    createPriceLine()
    createFortuneOrb()
  }
})

onMounted(() => {
  nextTick(() => {
    initScene()
  })
})

onUnmounted(() => {
  if (scene) {
    scene.destroy()
    scene = null
  }
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
