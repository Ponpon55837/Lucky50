<style scoped>
.relative {
  position: relative;
}
</style>

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

const { title = '技術指標 3D' } = defineProps<Props>()

const { isDark } = useTheme()
const dashboardStore = useDashboardStore()
const analyticsStore = useAnalyticsStore()

// 從 store 獲取技術指標數據
const indicators = computed(() => {
  return analyticsStore.calculateTechnicalIndicators(dashboardStore.etfData)
})
const threeContainer = ref<HTMLElement>()
let scene: ThreeJSScene | null = null
let indicatorGroup: THREE.Group | null = null

// 計算指標顏色
const rsiColor = computed(() => {
  const rsi = indicators.value.rsi
  if (rsi > 70) return 'text-error-text'
  if (rsi < 30) return 'text-success-text'
  return 'text-accent-text'
})

const macdColor = computed(() => {
  const macd = indicators.value.macd
  return macd > 0 ? 'text-success-text' : 'text-error-text'
})

const bollColor = computed(() => {
  return indicators.value.bollingerBand === 'upper'
    ? 'text-error-text'
    : indicators.value.bollingerBand === 'lower'
      ? 'text-success-text'
      : 'text-accent-text'
})

const overallSignal = computed(() => {
  const rsi = indicators.value.rsi
  const macd = indicators.value.macd
  const k = indicators.value.kd.k
  const d = indicators.value.kd.d

  let signals = 0
  if (rsi < 30) signals++
  if (rsi > 70) signals--
  if (macd > 0) signals++
  if (macd < 0) signals--
  if (k > d) signals++
  if (k < d) signals--

  if (signals > 0) return '買入'
  if (signals < 0) return '賣出'
  return '持有'
})

const overallSignalColor = computed(() => {
  const signal = overallSignal.value
  if (signal === '買入') return 'text-success-text'
  if (signal === '賣出') return 'text-error-text'
  return 'text-accent-text'
})

// 創建所有技術指標的 3D 可視化
const createIndicators = () => {
  if (!scene || !indicatorGroup) return

  // 清空現有內容
  indicatorGroup.clear()

  const { rsi, macd, bollingerBand, kd } = indicators.value

  // 創建 RSI 球體 - 增強動效
  const rsiRadius = Math.max(0.4, Math.min(1.2, (rsi / 100) * 1.5))
  const rsiGeometry = new THREE.SphereGeometry(rsiRadius, 32, 32)
  const rsiColor =
    rsi > 70
      ? getThemeColor('danger', isDark.value)
      : rsi < 30
        ? getThemeColor('success', isDark.value)
        : getThemeColor('accent', isDark.value)
  const rsiMaterial = createThemeGlowMaterial(rsiColor, Math.abs(rsi - 50) / 50, isDark.value)
  const rsiSphere = new THREE.Mesh(rsiGeometry, rsiMaterial)
  rsiSphere.position.set(-2, 1, 0)

  // RSI 脈動動畫
  const animateRSI = () => {
    if (rsiSphere.parent) {
      const time = Date.now() * 0.003
      const scale = 1 + Math.sin(time) * 0.3
      const intensity = Math.abs(rsi - 50) / 50
      rsiSphere.scale.setScalar(scale * (1 + intensity * 0.2))
      rsiSphere.rotation.y += 0.01
      requestAnimationFrame(animateRSI)
    }
  }
  animateRSI()

  indicatorGroup.add(rsiSphere)

  // 創建 MACD 動態柱狀圖
  const macdHeight = Math.abs(macd) * 3 + 0.8
  const macdGeometry = new THREE.CylinderGeometry(0.25, 0.35, macdHeight, 12)
  const macdColor =
    macd > 0 ? getThemeColor('success', isDark.value) : getThemeColor('danger', isDark.value)
  const macdMaterial = createThemeGlowMaterial(macdColor, 1.0, isDark.value)
  const macdBar = new THREE.Mesh(macdGeometry, macdMaterial)
  macdBar.position.set(0, macdHeight / 2, 0)

  // MACD 上升動畫
  macdBar.scale.y = 0
  const animateMACD = () => {
    macdBar.scale.y += (1 - macdBar.scale.y) * 0.08
    if (Math.abs(1 - macdBar.scale.y) > 0.01) {
      requestAnimationFrame(animateMACD)
    } else {
      // 開始振盪動畫
      const oscillateMACD = () => {
        if (macdBar.parent) {
          const time = Date.now() * 0.002
          const offset = Math.sin(time) * 0.1
          macdBar.scale.y = 1 + offset * Math.abs(macd)
          macdBar.rotation.y += 0.005
          requestAnimationFrame(oscillateMACD)
        }
      }
      oscillateMACD()
    }
  }
  animateMACD()

  indicatorGroup.add(macdBar)

  // 創建布林帶旋轉環
  const bollRadius = 1.2
  const bollGeometry = new THREE.TorusGeometry(bollRadius, 0.18, 16, 100)
  const bollColor =
    bollingerBand === 'upper'
      ? getThemeColor('danger', isDark.value)
      : bollingerBand === 'lower'
        ? getThemeColor('success', isDark.value)
        : getThemeColor('warning', isDark.value)
  const bollMaterial = createThemeGlowMaterial(bollColor, 0.9, isDark.value)
  const bollRing = new THREE.Mesh(bollGeometry, bollMaterial)
  bollRing.position.set(2, 0, 0)
  bollRing.rotation.x = Math.PI / 4

  // 布林帶旋轉動畫
  const animateBoll = () => {
    if (bollRing.parent) {
      bollRing.rotation.z += 0.02
      bollRing.rotation.y += 0.008
      const time = Date.now() * 0.001
      bollRing.position.y = Math.sin(time) * 0.3
      requestAnimationFrame(animateBoll)
    }
  }
  animateBoll()

  indicatorGroup.add(bollRing)

  // 創建 KD 動態振盪器
  const kdGroup = new THREE.Group()

  // K 線 - 動態長度
  const kHeight = 2 + (kd.k / 100) * 1.5
  const kGeometry = new THREE.CylinderGeometry(0.08, 0.08, kHeight, 12)
  const kColor = getThemeColor('info', isDark.value)
  const kMaterial = createThemeGlowMaterial(kColor, 0.9, isDark.value)
  const kLine = new THREE.Mesh(kGeometry, kMaterial)
  kLine.position.set(-0.4, kHeight / 2, 0)

  // D 線 - 動態長度
  const dHeight = 2 + (kd.d / 100) * 1.5
  const dGeometry = new THREE.CylinderGeometry(0.08, 0.08, dHeight, 12)
  const dColor = getThemeColor('secondary', isDark.value)
  const dMaterial = createThemeGlowMaterial(dColor, 0.9, isDark.value)
  const dLine = new THREE.Mesh(dGeometry, dMaterial)
  dLine.position.set(0.4, dHeight / 2, 0)

  // KD 線條擺動動畫
  const animateKD = () => {
    if (kdGroup.parent) {
      const time = Date.now() * 0.002
      kLine.rotation.z = Math.sin(time) * 0.3 + (kd.k / 100 - 0.5) * 0.5
      dLine.rotation.z = Math.sin(time + 0.5) * 0.3 + (kd.d / 100 - 0.5) * 0.5
      kdGroup.rotation.y += 0.005
      requestAnimationFrame(animateKD)
    }
  }
  animateKD()

  // 添加連接粒子
  const particleCount = 50
  const positions = new Float32Array(particleCount * 3)
  const colors = new Float32Array(particleCount * 3)

  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3
    const t = i / particleCount
    positions[i3] = THREE.MathUtils.lerp(-0.4, 0.4, t)
    positions[i3 + 1] = Math.sin(t * Math.PI * 2) * 0.5 + 1
    positions[i3 + 2] = Math.cos(t * Math.PI * 2) * 0.2

    const color = new THREE.Color().lerpColors(new THREE.Color(kColor), new THREE.Color(dColor), t)
    colors[i3] = color.r
    colors[i3 + 1] = color.g
    colors[i3 + 2] = color.b
  }

  const particleGeometry = new THREE.BufferGeometry()
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  const particleMaterial = new THREE.PointsMaterial({
    size: 0.05,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
  })

  const kdParticles = new THREE.Points(particleGeometry, particleMaterial)
  kdGroup.add(kLine, dLine, kdParticles)
  kdGroup.position.set(0, -1.5, 0)

  // 粒子流動動畫
  const animateParticles = () => {
    if (kdParticles.parent) {
      const positions = kdParticles.geometry.attributes.position.array as Float32Array
      const time = Date.now() * 0.001
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3
        positions[i3 + 1] += Math.sin(time + i * 0.1) * 0.01
        positions[i3 + 2] += Math.cos(time + i * 0.15) * 0.005
      }
      kdParticles.geometry.attributes.position.needsUpdate = true
      requestAnimationFrame(animateParticles)
    }
  }
  animateParticles()

  indicatorGroup.add(kdGroup)
}

// 初始化場景
const initScene = () => {
  if (!threeContainer.value || scene) return

  scene = new ThreeJSScene(threeContainer.value, {
    backgroundColor: getThemeColor('background', isDark.value),
    alpha: true,
    antialias: true,
    isDark: isDark.value,
  })

  // 創建指標組
  indicatorGroup = new THREE.Group()
  scene.addToScene(indicatorGroup)

  // 創建指標可視化
  createIndicators()

  // 設置相機位置
  scene.getCamera().position.set(0, 2, 5)
  scene.getCamera().lookAt(0, 0, 0)
}

// 生命週期
onMounted(async () => {
  await nextTick()
  initScene()
})

onUnmounted(() => {
  scene?.destroy()
})

// 監聽主題變化
watch(isDark, newTheme => {
  scene?.updateTheme(newTheme)
  createIndicators() // 重新創建以應用新主題
})

// 監聽指標變化
watch(() => indicators.value, createIndicators, { deep: true })
</script>

<template>
  <div
    class="relative w-full h-full bg-gradient-to-br from-surface-bgconst bollingerColor = computed(() => { return indicators.value.bollingerBand === 'upper' ? 'text-error-text' : indicators.value.bollingerBand === 'lower' ? 'text-success-text' : 'text-accent-text' })-card-bg to-surface-// 創建技術指標可視化 const createIndicators = () => { if (!scene || !indicatorGroup) return // 清空現有內容 indicatorGroup.clear() const { rsi, macd, bollingerBand, kd } = indicators.valueed-lg overflow-hidden border border-border-light"
  >
    <div ref="threeContainer" class="w-full h-full"></div>
    <div class="absolute top-4 left-4 text-primary-text">
      <h3 class="text-lg font-semibold mb-2 text-primary-text">{{ title }}</h3>
      <div class="text-sm space-y-1">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <div class="text-xs text-secondary-text">RSI</div>
            <div :class="rsiColor" class="font-mono">{{ indicators.rsi.toFixed(1) }}</div>
          </div>
          <div>
            <div class="text-xs text-secondary-text">MACD</div>
            <div :class="macdColor" class="font-mono">{{ indicators.macd.toFixed(2) }}</div>
          </div>
          <div>
            <div class="text-xs text-secondary-text">布林帶</div>
            <div :class="bollColor" class="font-mono">{{ indicators.bollingerBand }}</div>
          </div>
          <div>
            <div class="text-xs text-secondary-text">KD</div>
            <div class="text-accent-text font-mono">
              {{ indicators.kd.k.toFixed(1) }}/{{ indicators.kd.d.toFixed(1) }}
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="absolute bottom-4 right-4 text-primary-text text-xs">
      <div class="text-center">
        <div class="text-lg font-bold" :class="overallSignalColor">{{ overallSignal }}</div>
        <div class="text-sm text-secondary-text">技術信號</div>
      </div>
    </div>
  </div>
</template>
