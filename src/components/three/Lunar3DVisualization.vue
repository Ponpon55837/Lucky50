<template>
  <div
    class="relative w-full h-full bg-gradient-to-br from-surface-bg/50 via-card-bg to-surface-bg rounded-lg overflow-hidden border border-border-light"
  >
    <div ref="threeContainer" class="w-full h-full"></div>
    <div class="absolute top-4 left-4 text-primary-text">
      <h3 class="text-lg font-semibold mb-2 text-primary-text">{{ title }}</h3>
      <div class="text-sm space-y-1">
        <div>
          農曆: <span class="text-accent-text">{{ lunarDate }}</span>
        </div>
        <div>
          節氣: <span class="text-success-text">{{ solarTerm }}</span>
        </div>
        <div>
          宜: <span class="text-success-text">{{ suitable?.slice(0, 2).join(', ') }}</span>
        </div>
        <div>
          忌: <span class="text-error-text">{{ avoid?.slice(0, 2).join(', ') }}</span>
        </div>
      </div>
    </div>
    <div class="absolute bottom-4 right-4 text-primary-text text-xs">
      <div class="text-center">
        <div class="text-lg font-bold text-accent-text">{{ investmentLuck }}</div>
        <div class="text-sm text-secondary-text">投資運勢</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as THREE from 'three'
import { ThreeJSScene, createThemeGlowMaterial, getThemeColor } from '@/utils/three-scene'
import { useTheme } from '@/composables/useTheme'

interface Props {
  lunarDate?: string
  solarTerm?: string
  suitable?: string[]
  avoid?: string[]
  investmentLuck?: string
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  lunarDate: '乙巳年八月初五',
  solarTerm: '秋分',
  suitable: () => ['開市', '投資', '求財', '交易'],
  avoid: () => ['出行', '搬遷', '動土', '結婚'],
  investmentLuck: '吉',
  title: '農民曆 3D 展示',
})

const { isDark } = useTheme()
const threeContainer = ref<HTMLElement>()
let scene: ThreeJSScene | null = null
let lunarGroup: THREE.Group | null = null

// 創建農民曆可視化
const createLunarVisualization = () => {
  if (!scene || !lunarGroup) return

  // 清空現有內容
  lunarGroup.clear()

  // 創建動態月相球
  const moonRadius = 1.2
  const moonGeometry = new THREE.IcosahedronGeometry(moonRadius, 3)
  const moonColor = getThemeColor('accent', isDark.value)
  const moonMaterial = createThemeGlowMaterial(moonColor, 0.9, isDark.value)
  const moon = new THREE.Mesh(moonGeometry, moonMaterial)
  moon.position.set(0, 1.5, 0)

  // 月亮呼吸和旋轉動畫
  const animateMoon = () => {
    if (moon.parent) {
      const time = Date.now() * 0.001
      const scale = 1 + Math.sin(time * 0.8) * 0.15
      moon.scale.setScalar(scale)
      moon.rotation.x += 0.003
      moon.rotation.y += 0.005
      moon.rotation.z += 0.002
      requestAnimationFrame(animateMoon)
    }
  }
  animateMoon()
  lunarGroup.add(moon)

  // 創建多層二十四節氣環系統
  for (let layer = 0; layer < 3; layer++) {
    const solarTermRadius = 2.2 + layer * 0.5
    const solarTermGeometry = new THREE.TorusGeometry(solarTermRadius, 0.08 + layer * 0.02, 12, 80)
    const solarTermColor =
      layer === 0
        ? getThemeColor('success', isDark.value)
        : layer === 1
          ? getThemeColor('warning', isDark.value)
          : getThemeColor('info', isDark.value)
    const solarTermMaterial = createThemeGlowMaterial(
      solarTermColor,
      0.8 - layer * 0.1,
      isDark.value
    )
    const solarTermRing = new THREE.Mesh(solarTermGeometry, solarTermMaterial)
    solarTermRing.position.set(0, 0, 0)
    solarTermRing.rotation.x = Math.PI / 2 + (layer * Math.PI) / 12
    solarTermRing.rotation.z = (layer * Math.PI) / 6

    // 每層環不同速度旋轉
    const animateRing = () => {
      if (solarTermRing.parent) {
        solarTermRing.rotation.z += (0.005 + layer * 0.003) * (layer % 2 === 0 ? 1 : -1)
        solarTermRing.rotation.y += 0.002 * (layer + 1)
        requestAnimationFrame(animateRing)
      }
    }
    animateRing()
    lunarGroup.add(solarTermRing)
  }

  // 創建宜做指示柱群組 - 增強視覺
  if (props.suitable && props.suitable.length > 0) {
    const suitableCount = Math.min(props.suitable.length, 6)
    for (let i = 0; i < suitableCount; i++) {
      const height = 1.2 + Math.random() * 0.8
      const suitableGeometry = new THREE.CylinderGeometry(0.12, 0.18, height, 8)
      const suitableColor = getThemeColor('success', isDark.value)
      const suitableMaterial = createThemeGlowMaterial(suitableColor, 0.9, isDark.value)
      const suitableBar = new THREE.Mesh(suitableGeometry, suitableMaterial)

      const angle = (i / suitableCount) * Math.PI + Math.PI / 4
      const radius = 4.0
      suitableBar.position.set(Math.cos(angle) * radius, height / 2 - 0.5, Math.sin(angle) * radius)

      // 漸進上升動畫
      suitableBar.scale.y = 0
      setTimeout(() => {
        const animateUp = () => {
          suitableBar.scale.y += (1 - suitableBar.scale.y) * 0.06
          if (Math.abs(1 - suitableBar.scale.y) > 0.01) {
            requestAnimationFrame(animateUp)
          } else {
            // 輕微搖擺
            const sway = () => {
              if (suitableBar.parent) {
                const time = Date.now() * 0.002 + i
                suitableBar.rotation.z = Math.sin(time) * 0.08
                suitableBar.rotation.x = Math.cos(time * 0.7) * 0.05
                requestAnimationFrame(sway)
              }
            }
            sway()
          }
        }
        animateUp()
      }, i * 200)

      lunarGroup.add(suitableBar)
    }
  }

  // 創建忌做指示柱群組 - 增強視覺
  if (props.avoid && props.avoid.length > 0) {
    const avoidCount = Math.min(props.avoid.length, 6)
    for (let i = 0; i < avoidCount; i++) {
      const height = 1.0 + Math.random() * 0.6
      const avoidGeometry = new THREE.CylinderGeometry(0.18, 0.12, height, 8)
      const avoidColor = getThemeColor('danger', isDark.value)
      const avoidMaterial = createThemeGlowMaterial(avoidColor, 0.9, isDark.value)
      const avoidBar = new THREE.Mesh(avoidGeometry, avoidMaterial)

      const angle = (i / avoidCount) * Math.PI + (Math.PI * 5) / 4
      const radius = 4.0
      avoidBar.position.set(Math.cos(angle) * radius, -height / 2 + 0.5, Math.sin(angle) * radius)

      // 漸進下降動畫
      avoidBar.scale.y = 0
      setTimeout(
        () => {
          const animateDown = () => {
            avoidBar.scale.y += (1 - avoidBar.scale.y) * 0.06
            if (Math.abs(1 - avoidBar.scale.y) > 0.01) {
              requestAnimationFrame(animateDown)
            } else {
              // 輕微搖擺
              const sway = () => {
                if (avoidBar.parent) {
                  const time = Date.now() * 0.002 + i + Math.PI
                  avoidBar.rotation.z = Math.sin(time) * 0.08
                  avoidBar.rotation.x = Math.cos(time * 0.7) * 0.05
                  requestAnimationFrame(sway)
                }
              }
              sway()
            }
          }
          animateDown()
        },
        i * 250 + 1000
      )

      lunarGroup.add(avoidBar)
    }
  }

  // 創建投資運勢指示器 - 增強效果
  const luckHeight = 2.5
  const luckGeometry = new THREE.CylinderGeometry(0.4, 0.6, luckHeight, 12)
  const isLucky = props.investmentLuck === '吉' || props.investmentLuck === '大吉'
  const luckColor = isLucky
    ? getThemeColor('success', isDark.value)
    : props.investmentLuck === '凶'
      ? getThemeColor('danger', isDark.value)
      : getThemeColor('warning', isDark.value)
  const luckMaterial = createThemeGlowMaterial(luckColor, isLucky ? 1.0 : 0.7, isDark.value)
  const luckIndicator = new THREE.Mesh(luckGeometry, luckMaterial)
  luckIndicator.position.set(0, -1.5, 2.0)

  // 投資運勢脈動動畫
  const animateLuck = () => {
    if (luckIndicator.parent) {
      const time = Date.now() * 0.003
      const intensity = isLucky ? 1.2 : 0.8
      const scale = 1 + Math.sin(time) * 0.1 * intensity
      luckIndicator.scale.setScalar(scale)
      luckIndicator.rotation.y += 0.01
      requestAnimationFrame(animateLuck)
    }
  }
  animateLuck()
  lunarGroup.add(luckIndicator)

  // 創建天干地支星座
  createCelestialWheel()

  // 創建星星粒子效果
  createEnhancedStarField()
}

// 創建天干地支星座
const createCelestialWheel = () => {
  if (!lunarGroup) return

  // 地支外環 (12個) - 子丑寅卯辰巳午未申酉戌亥
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2
    const radius = 5.5

    const branchGeometry = new THREE.OctahedronGeometry(0.2, 0)
    const branchColor =
      i % 3 === 0
        ? getThemeColor('primary', isDark.value)
        : i % 3 === 1
          ? getThemeColor('secondary', isDark.value)
          : getThemeColor('accent', isDark.value)
    const branchMaterial = createThemeGlowMaterial(branchColor, 0.8, isDark.value)
    const branchShape = new THREE.Mesh(branchGeometry, branchMaterial)

    branchShape.position.set(
      Math.cos(angle) * radius,
      Math.sin(i * 0.3) * 0.8,
      Math.sin(angle) * radius
    )

    // 地支自轉和軌道運動
    const animateBranch = () => {
      if (branchShape.parent) {
        const time = Date.now() * 0.001 + i * 0.5
        branchShape.rotation.x += 0.008 + i * 0.001
        branchShape.rotation.y += 0.012 + i * 0.002
        branchShape.position.y = Math.sin(time * 0.8) * 0.5 + Math.sin(i * 0.3) * 0.8

        // 順時針軌道運動
        const orbitTime = Date.now() * 0.0003 + (i * Math.PI * 2) / 12
        branchShape.position.x = Math.cos(orbitTime) * radius
        branchShape.position.z = Math.sin(orbitTime) * radius

        requestAnimationFrame(animateBranch)
      }
    }
    animateBranch()

    lunarGroup.add(branchShape)
  }

  // 天干內環 (10個) - 甲乙丙丁戊己庚辛壬癸
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2
    const radius = 3.5

    const stemGeometry = new THREE.TetrahedronGeometry(0.25, 1)
    const stemColor = getThemeColor('warning', isDark.value)
    const stemMaterial = createThemeGlowMaterial(stemColor, 0.9, isDark.value)
    const stemShape = new THREE.Mesh(stemGeometry, stemMaterial)

    stemShape.position.set(
      Math.cos(angle) * radius,
      Math.cos(i * 0.4) * 1.2 + 0.8,
      Math.sin(angle) * radius
    )

    // 天干反向旋轉
    const animateStem = () => {
      if (stemShape.parent) {
        const time = Date.now() * 0.001 + i * 0.6
        stemShape.rotation.x += 0.015 - i * 0.001
        stemShape.rotation.y -= 0.018 + i * 0.002
        stemShape.rotation.z += 0.01

        // 上下波動
        stemShape.position.y = Math.cos(time * 1.2) * 0.6 + Math.cos(i * 0.4) * 1.2 + 0.8

        // 逆時針軌道運動
        const orbitTime = -Date.now() * 0.0005 + (i * Math.PI * 2) / 10
        stemShape.position.x = Math.cos(orbitTime) * radius
        stemShape.position.z = Math.sin(orbitTime) * radius

        requestAnimationFrame(animateStem)
      }
    }
    animateStem()

    lunarGroup.add(stemShape)
  }
}

// 創建增強星空背景
const createEnhancedStarField = () => {
  if (!lunarGroup) return

  const starCount = 800
  const positions = new Float32Array(starCount * 3)
  const colors = new Float32Array(starCount * 3)
  const sizes = new Float32Array(starCount)

  const goldColor = new THREE.Color(0xffd700)
  const silverColor = new THREE.Color(0xc0c0c0)
  const blueColor = new THREE.Color(getThemeColor('info', isDark.value))
  const accentColor = new THREE.Color(getThemeColor('accent', isDark.value))

  for (let i = 0; i < starCount; i++) {
    const i3 = i * 3

    // 球形星空分布
    const radius = 12 + Math.random() * 25
    const theta = Math.random() * Math.PI * 2
    const phi = Math.random() * Math.PI

    positions[i3] = radius * Math.sin(phi) * Math.cos(theta)
    positions[i3 + 1] = radius * Math.cos(phi)
    positions[i3 + 2] = radius * Math.sin(phi) * Math.sin(theta)

    // 多種星星顏色
    const colorChoice = Math.random()
    let starColor
    if (colorChoice < 0.3) {
      starColor = goldColor
    } else if (colorChoice < 0.5) {
      starColor = silverColor
    } else if (colorChoice < 0.7) {
      starColor = blueColor
    } else {
      starColor = accentColor
    }

    colors[i3] = starColor.r
    colors[i3 + 1] = starColor.g
    colors[i3 + 2] = starColor.b

    sizes[i] = Math.random() * 0.12 + 0.03
  }

  const starGeometry = new THREE.BufferGeometry()
  starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  starGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

  const starMaterial = new THREE.PointsMaterial({
    size: 0.15,
    vertexColors: true,
    transparent: true,
    opacity: isDark.value ? 0.95 : 0.8,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
  })

  const starField = new THREE.Points(starGeometry, starMaterial)
  lunarGroup.add(starField)

  // 星空旋轉和閃爍動畫
  const animateStars = () => {
    if (starField.parent) {
      starField.rotation.y += 0.0003
      starField.rotation.x += 0.0001
      starField.rotation.z += 0.0002

      // 星星閃爍效果
      const colors = starField.geometry.attributes.color.array as Float32Array
      const sizes = starField.geometry.attributes.size.array as Float32Array
      const time = Date.now() * 0.001

      for (let i = 0; i < starCount; i++) {
        const i3 = i * 3
        const twinkle = ((Math.sin(time * 2 + i * 0.1) + 1) / 2) * 0.4 + 0.6
        const pulse = ((Math.sin(time * 3 + i * 0.2) + 1) / 2) * 0.3 + 0.7

        // 顏色閃爍
        colors[i3] *= twinkle
        colors[i3 + 1] *= twinkle
        colors[i3 + 2] *= twinkle

        // 大小脈動
        sizes[i] = sizes[i] * pulse
      }

      starField.geometry.attributes.color.needsUpdate = true
      starField.geometry.attributes.size.needsUpdate = true
      requestAnimationFrame(animateStars)
    }
  }
  animateStars()
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

  // 創建農民曆組
  lunarGroup = new THREE.Group()
  scene.addToScene(lunarGroup)

  // 創建農民曆可視化
  createLunarVisualization()

  // 設置相機位置
  scene.getCamera().position.set(0, 3, 6)
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
  createLunarVisualization() // 重新創建以應用新主題
})

// 監聽屬性變化
watch(() => props, createLunarVisualization, { deep: true })
</script>

<style scoped>
.relative {
  position: relative;
}
</style>
