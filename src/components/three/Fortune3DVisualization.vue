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
import { useUserStore } from '@/stores/user'

interface Props {
  title?: string
}

const { title = '生肖運勢 3D 展示' } = defineProps<Props>()

const { isDark } = useTheme()
const dashboardStore = useDashboardStore()
const userStore = useUserStore()
const threeContainer = ref<HTMLElement>()
let scene: ThreeJSScene | null = null
let fortuneGroup: THREE.Group | null = null

// 從 store 獲取數據
const zodiac = computed(() => userStore.profile?.zodiac || '龍')
const element = computed(() => userStore.profile?.element || '木')
const fortuneScore = computed(() => dashboardStore.unifiedInvestmentScore)
const investmentScore = computed(() => dashboardStore.unifiedInvestmentScore)
const lunarDate = computed(() => {
  if (!dashboardStore.lunarData) return '乙巳年八月'
  return (
    `${dashboardStore.lunarData.lunarYear || ''}${dashboardStore.lunarData.lunarMonth || ''}${dashboardStore.lunarData.lunarDay || ''}` ||
    '乙巳年八月'
  )
})

// 計算屬性
const fortuneScoreColor = computed(() => {
  const score = fortuneScore.value
  if (score >= 80) return 'text-success-text'
  if (score >= 60) return 'text-warning-text'
  return 'text-error-text'
})

const investmentAdvice = computed(() => {
  const score = investmentScore.value
  if (score >= 75) return '積極投資'
  if (score >= 50) return '謹慎投資'
  return '保守觀望'
})

const investmentAdviceColor = computed(() => {
  const advice = investmentAdvice.value
  if (advice === '積極投資') return 'text-success-text'
  if (advice === '謹慎投資') return 'text-warning-text'
  return 'text-error-text'
})

// 獲取五行對應的顏色
const getElementColor = (element: string): number => {
  const elementColors = {
    木: getThemeColor('success', isDark.value), // 綠色
    火: getThemeColor('danger', isDark.value), // 紅色
    土: getThemeColor('warning', isDark.value), // 黃色
    金: getThemeColor('info', isDark.value), // 藍色
    水: getThemeColor('primary', isDark.value), // 深藍色
  }
  return (
    elementColors[element as keyof typeof elementColors] || getThemeColor('secondary', isDark.value)
  )
}

// 創建運勢可視化
const createFortuneVisualization = () => {
  if (!scene || !fortuneGroup) return

  // 清空現有內容
  fortuneGroup.clear()

  const currentElement = element.value
  const currentFortuneScore = fortuneScore.value
  const currentInvestmentScore = investmentScore.value

  // 創建中央生肖能量球 - 增強效果
  const zodiacRadius = Math.max(0.6, Math.min(1.8, (currentFortuneScore / 100) * 2.5))
  const zodiacGeometry = new THREE.IcosahedronGeometry(zodiacRadius, 2)
  const zodiacColor = getThemeColor('accent', isDark.value)
  const zodiacMaterial = createThemeGlowMaterial(
    zodiacColor,
    currentFortuneScore / 100,
    isDark.value
  )
  const zodiacSphere = new THREE.Mesh(zodiacGeometry, zodiacMaterial)
  zodiacSphere.position.set(0, 1, 0)

  // 生肖球體脈動和旋轉動畫
  const animateZodiac = () => {
    if (zodiacSphere.parent) {
      const time = Date.now() * 0.002
      const scale = 1 + Math.sin(time) * 0.15
      zodiacSphere.scale.setScalar(scale)
      zodiacSphere.rotation.x += 0.005
      zodiacSphere.rotation.y += 0.008
      zodiacSphere.rotation.z += 0.003
      requestAnimationFrame(animateZodiac)
    }
  }
  animateZodiac()

  fortuneGroup.add(zodiacSphere)

  // 創建動態五行環系統
  const elementRadius = 2.0
  const ringCount = 3

  for (let i = 0; i < ringCount; i++) {
    const radius = elementRadius + i * 0.4
    const elementGeometry = new THREE.TorusGeometry(radius, 0.12 + i * 0.02, 16, 100)
    const elementColor = getElementColor(currentElement)
    const opacity = 0.9 - i * 0.2
    const elementMaterial = createThemeGlowMaterial(elementColor, opacity, isDark.value)
    const elementRing = new THREE.Mesh(elementGeometry, elementMaterial)
    elementRing.position.set(0, 0.5, 0)
    elementRing.rotation.x = Math.PI / 2 + (i * Math.PI) / 8
    elementRing.rotation.z = (i * Math.PI) / 4

    // 每個環不同速度旋轉
    const animateRing = () => {
      if (elementRing.parent) {
        elementRing.rotation.z += (0.01 + i * 0.005) * (i % 2 === 0 ? 1 : -1)
        elementRing.rotation.y += 0.003 * (i + 1)
        requestAnimationFrame(animateRing)
      }
    }
    animateRing()

    fortuneGroup.add(elementRing)
  }

  // 創建投資指示柱群組
  const investmentGroup = new THREE.Group()
  const barCount = 5
  const investmentHeight = Math.max(0.8, (currentInvestmentScore / 100) * 4)

  for (let i = 0; i < barCount; i++) {
    const height = investmentHeight * (0.6 + Math.random() * 0.8)
    const investmentGeometry = new THREE.CylinderGeometry(0.15, 0.2, height, 8)
    const investmentColor =
      currentInvestmentScore >= 70
        ? getThemeColor('success', isDark.value)
        : currentInvestmentScore >= 50
          ? getThemeColor('warning', isDark.value)
          : getThemeColor('danger', isDark.value)
    const investmentMaterial = createThemeGlowMaterial(investmentColor, 1.0, isDark.value)
    const investmentBar = new THREE.Mesh(investmentGeometry, investmentMaterial)

    const angle = (i / barCount) * Math.PI * 2
    const radius = 2.5
    investmentBar.position.set(Math.cos(angle) * radius, height / 2 - 1, Math.sin(angle) * radius)

    // 柱狀圖上升動畫
    investmentBar.scale.y = 0
    setTimeout(() => {
      const animateBar = () => {
        investmentBar.scale.y += (1 - investmentBar.scale.y) * 0.08
        if (Math.abs(1 - investmentBar.scale.y) > 0.01) {
          requestAnimationFrame(animateBar)
        } else {
          // 開始波動動畫
          const oscillateBar = () => {
            if (investmentBar.parent) {
              const time = Date.now() * 0.003 + i
              const offset = Math.sin(time) * 0.1
              investmentBar.scale.y = 1 + offset
              requestAnimationFrame(oscillateBar)
            }
          }
          oscillateBar()
        }
      }
      animateBar()
    }, i * 200)

    investmentGroup.add(investmentBar)
  }

  fortuneGroup.add(investmentGroup)

  // 創建五行能量粒子系統
  createElementalParticles()
}

// 創建五行能量粒子效果
const createElementalParticles = () => {
  if (!fortuneGroup) return

  const particleCount = 300
  const positions = new Float32Array(particleCount * 3)
  const colors = new Float32Array(particleCount * 3)
  const sizes = new Float32Array(particleCount)

  const elementColor = new THREE.Color(getElementColor(element.value))
  const accentColor = new THREE.Color(getThemeColor('accent', isDark.value))

  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3

    // 球形分布
    const radius = 2 + Math.random() * 6
    const theta = Math.random() * Math.PI * 2
    const phi = Math.random() * Math.PI

    positions[i3] = radius * Math.sin(phi) * Math.cos(theta)
    positions[i3 + 1] = radius * Math.cos(phi)
    positions[i3 + 2] = radius * Math.sin(phi) * Math.sin(theta)

    // 混合五行色彩
    const mixRatio = Math.random()
    const finalColor = new THREE.Color().lerpColors(elementColor, accentColor, mixRatio)
    colors[i3] = finalColor.r
    colors[i3 + 1] = finalColor.g
    colors[i3 + 2] = finalColor.b

    sizes[i] = Math.random() * 0.05 + 0.02
  }

  const particleGeometry = new THREE.BufferGeometry()
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

  const particleMaterial = new THREE.PointsMaterial({
    size: 0.08,
    vertexColors: true,
    transparent: true,
    opacity: isDark.value ? 0.8 : 0.6,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
  })

  const particles = new THREE.Points(particleGeometry, particleMaterial)
  fortuneGroup.add(particles)

  // 粒子螺旋運動動畫
  const animateParticles = () => {
    if (particles.parent) {
      const positions = particles.geometry.attributes.position.array as Float32Array
      const time = Date.now() * 0.001

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3
        const originalX = positions[i3]
        const originalZ = positions[i3 + 2]

        // 螺旋運動
        const rotationSpeed = 0.5 + (i % 10) * 0.1
        const angle = time * rotationSpeed + i * 0.1
        const radius = Math.sqrt(originalX * originalX + originalZ * originalZ)

        positions[i3] = radius * Math.cos(angle)
        positions[i3 + 2] = radius * Math.sin(angle)
        positions[i3 + 1] += Math.sin(time * 2 + i * 0.1) * 0.003
      }

      particles.geometry.attributes.position.needsUpdate = true
      particles.rotation.y += 0.002
      requestAnimationFrame(animateParticles)
    }
  }
  animateParticles()
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

  // 創建運勢組
  fortuneGroup = new THREE.Group()
  scene.addToScene(fortuneGroup)

  // 創建運勢可視化
  createFortuneVisualization()

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
  createFortuneVisualization() // 重新創建以應用新主題
})

// 監聽屬性變化
watch(
  [
    () => zodiac.value,
    () => element.value,
    () => fortuneScore.value,
    () => investmentScore.value,
    () => lunarDate.value,
  ],
  createFortuneVisualization,
  { deep: true }
)
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
          生肖: <span class="text-accent-text">{{ zodiac }}</span>
        </div>
        <div>
          五行: <span class="text-info-text">{{ element }}</span>
        </div>
        <div>
          運勢分數: <span :class="fortuneScoreColor">{{ fortuneScore }}</span>
        </div>
        <div>
          投資建議: <span :class="investmentAdviceColor">{{ investmentAdvice }}</span>
        </div>
      </div>
    </div>
    <div class="absolute bottom-4 right-4 text-secondary-text text-xs">
      <div>農民曆: {{ lunarDate }}</div>
    </div>
  </div>
</template>
