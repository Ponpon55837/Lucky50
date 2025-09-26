import * as THREE from 'three'
import * as TWEEN from '@tweenjs/tween.js'

// 主題色彩配置
export const ThemeColors = {
  dark: {
    background: 0x0f172a,
    primary: 0x1e3a8a,
    secondary: 0x1e293b,
    accent: 0xf59e0b,
    success: 0x10b981,
    danger: 0xef4444,
    warning: 0xf59e0b,
    info: 0x3b82f6,
    surface: 0x334155,
    text: 0xffffff
  },
  light: {
    background: 0xf8fafc,
    primary: 0x1e3a8a,
    secondary: 0x475569,
    accent: 0xf97316,
    success: 0x059669,
    danger: 0xdc2626,
    warning: 0xd97706,
    info: 0x2563eb,
    surface: 0xe2e8f0,
    text: 0x1e293b
  }
}

export class ThreeJSScene {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private container: HTMLElement
  private animationId: number | null = null
  private isDark: boolean = true

  constructor(container: HTMLElement, options: {
    backgroundColor?: number
    alpha?: boolean
    antialias?: boolean
    isDark?: boolean
  } = {}) {
    this.container = container
    this.isDark = options.isDark ?? true
    
    // 創建場景
    this.scene = new THREE.Scene()
    const bgColor = options.backgroundColor ?? (this.isDark ? ThemeColors.dark.background : ThemeColors.light.background)
    this.scene.background = new THREE.Color(bgColor)

    // 創建相機
    const width = container.clientWidth
    const height = container.clientHeight
    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
    this.camera.position.set(0, 0, 10)

    // 創建渲染器
    this.renderer = new THREE.WebGLRenderer({
      alpha: options.alpha ?? true,
      antialias: options.antialias ?? true
    })
    this.renderer.setSize(width, height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    
    // 添加到 DOM
    container.appendChild(this.renderer.domElement)

    // 添加基本光照
    this.setupLights()

    // 開始渲染循環
    this.animate()

    // 監聽窗口大小變化
    window.addEventListener('resize', this.handleResize.bind(this))
  }

  private setupLights() {
    const colors = this.isDark ? ThemeColors.dark : ThemeColors.light
    
    // 環境光
    const ambientLight = new THREE.AmbientLight(colors.surface, this.isDark ? 0.6 : 0.8)
    this.scene.add(ambientLight)

    // 方向光
    const directionalLight = new THREE.DirectionalLight(colors.text, this.isDark ? 0.8 : 0.6)
    directionalLight.position.set(10, 10, 5)
    this.scene.add(directionalLight)

    // 點光源
    const pointLight = new THREE.PointLight(colors.accent, this.isDark ? 0.5 : 0.3, 100)
    pointLight.position.set(0, 10, 10)
    this.scene.add(pointLight)
  }

  private animate() {
    this.animationId = requestAnimationFrame(() => this.animate())
    
    // 更新 Tween 動畫
    TWEEN.update()
    
    this.renderer.render(this.scene, this.camera)
  }

  private handleResize() {
    const width = this.container.clientWidth
    const height = this.container.clientHeight

    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
  }

  // 添加對象到場景
  addToScene(object: THREE.Object3D) {
    this.scene.add(object)
  }

  // 從場景移除對象
  removeFromScene(object: THREE.Object3D) {
    this.scene.remove(object)
  }

  // 清空場景（除了光照）
  clearScene() {
    const objectsToRemove: THREE.Object3D[] = []
    this.scene.traverse((child) => {
      if (!(child instanceof THREE.Light) && child !== this.scene) {
        objectsToRemove.push(child)
      }
    })
    
    objectsToRemove.forEach(obj => {
      this.scene.remove(obj)
    })
  }

  // 獲取相機
  getCamera() {
    return this.camera
  }

  // 獲取場景
  getScene() {
    return this.scene
  }

  // 獲取主題配色
  getThemeColors() {
    return this.isDark ? ThemeColors.dark : ThemeColors.light
  }

  // 更新主題
  updateTheme(isDark: boolean) {
    this.isDark = isDark
    const colors = this.getThemeColors()
    this.scene.background = new THREE.Color(colors.background)
    
    // 重新設置光照
    this.scene.remove(...this.scene.children.filter(child => child instanceof THREE.Light))
    this.setupLights()
  }

  // 銷毀
  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
    
    window.removeEventListener('resize', this.handleResize.bind(this))
    
    this.clearScene()
    this.renderer.dispose()
    
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement)
    }
  }
}

// 創建主題感知的發光材質
export function createThemeGlowMaterial(baseColor: number, intensity: number = 1, isDark: boolean = true) {
  return new THREE.MeshPhongMaterial({
    color: baseColor,
    transparent: true,
    opacity: isDark ? 0.8 : 0.9,
    emissive: baseColor,
    emissiveIntensity: intensity * (isDark ? 0.2 : 0.1)
  })
}

// 獲取主題感知的顏色
export function getThemeColor(colorKey: keyof typeof ThemeColors.dark, isDark: boolean = true) {
  const colors = isDark ? ThemeColors.dark : ThemeColors.light
  return colors[colorKey]
}

// 創建粒子系統
export function createParticleSystem(count: number, color: number = 0xffd700, isDark: boolean = true) {
  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(count * 3)
  const velocities = new Float32Array(count * 3)

  for (let i = 0; i < count; i++) {
    const i3 = i * 3
    positions[i3] = (Math.random() - 0.5) * 20
    positions[i3 + 1] = (Math.random() - 0.5) * 20
    positions[i3 + 2] = (Math.random() - 0.5) * 20
    
    velocities[i3] = (Math.random() - 0.5) * 0.02
    velocities[i3 + 1] = (Math.random() - 0.5) * 0.02
    velocities[i3 + 2] = (Math.random() - 0.5) * 0.02
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3))

  const material = new THREE.PointsMaterial({
    color: color,
    size: isDark ? 0.1 : 0.08,
    transparent: true,
    opacity: isDark ? 0.6 : 0.4
  })

  return new THREE.Points(geometry, material)
}

// 動畫工具函數
export function animateObject(
  object: THREE.Object3D,
  to: { x?: number; y?: number; z?: number; rotation?: { x?: number; y?: number; z?: number } },
  duration: number = 1000,
  easing: typeof TWEEN.Easing.Quadratic.Out = TWEEN.Easing.Quadratic.Out
) {
  const from = {
    x: object.position.x,
    y: object.position.y,
    z: object.position.z,
    rotationX: object.rotation.x,
    rotationY: object.rotation.y,
    rotationZ: object.rotation.z
  }

  const target = {
    x: to.x ?? from.x,
    y: to.y ?? from.y,
    z: to.z ?? from.z,
    rotationX: to.rotation?.x ?? from.rotationX,
    rotationY: to.rotation?.y ?? from.rotationY,
    rotationZ: to.rotation?.z ?? from.rotationZ
  }

  return new TWEEN.Tween(from)
    .to(target, duration)
    .easing(easing)
    .onUpdate(() => {
      object.position.set(from.x, from.y, from.z)
      object.rotation.set(from.rotationX, from.rotationY, from.rotationZ)
    })
    .start()
}