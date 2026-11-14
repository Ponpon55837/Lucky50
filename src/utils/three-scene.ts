import * as THREE from 'three'
import * as TWEEN from '@tweenjs/tween.js'

/**
 * 場景可用的設計 token 名稱，對應 style.css 的 `--c-*` CSS 變數。
 * `line` 不是獨立變數，會以 ink 疊在 surface 上 18% 的混色近似髮絲線。
 */
export type SceneToken =
  | 'paper'
  | 'surface'
  | 'raised'
  | 'ink'
  | 'ink-2'
  | 'ink-3'
  | 'line'
  | 'seal'
  | 'seal-deep'
  | 'seal-ink'
  | 'gold'
  | 'rise'
  | 'fall'
  | 'warn'
  | 'danger'

// SSR / jsdom 讀不到 CSS 變數時的後備值（淺色主題）
const TOKEN_FALLBACK: Record<Exclude<SceneToken, 'line'>, number> = {
  paper: 0xf3f2ee,
  surface: 0xffffff,
  raised: 0xebe9e3,
  ink: 0x1b1a18,
  'ink-2': 0x55524c,
  'ink-3': 0x6f6b64,
  seal: 0xc0282d,
  'seal-deep': 0x9e1d22,
  'seal-ink': 0xb02227,
  gold: 0xf0c43c,
  rise: 0xb02227,
  fall: 0x167854,
  warn: 0x96620a,
  danger: 0xbe4614,
}

const readChannels = (name: string): [number, number, number] | null => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return null
  const raw = getComputedStyle(document.documentElement).getPropertyValue(`--c-${name}`).trim()
  if (!raw) return null
  const parts = raw.split(/[\s,/]+/).map(Number)
  if (parts.length < 3 || parts.slice(0, 3).some(n => Number.isNaN(n))) return null
  return [parts[0], parts[1], parts[2]]
}

/**
 * 於渲染當下讀取設計 token 並轉為 THREE.Color（sRGB）。
 * 深淺主題切換後重新呼叫即可取得新顏色。
 */
export function tokenColor(name: SceneToken): THREE.Color {
  if (name === 'line') {
    return tokenColor('surface').lerp(tokenColor('ink'), 0.18)
  }
  const channels = readChannels(name)
  if (!channels) return new THREE.Color(TOKEN_FALLBACK[name])
  const [r, g, b] = channels
  return new THREE.Color().setRGB(r / 255, g / 255, b / 255, THREE.SRGBColorSpace)
}

/** 同 tokenColor，回傳 sRGB 十六進位數值，方便傳給 Three.js 材質參數 */
export function tokenHex(name: SceneToken): number {
  return tokenColor(name).getHex()
}

// 遞迴釋放 mesh 的幾何體與材質，避免記憶體/GPU 資源累積
// 元件在每次資料變動重建場景內容時（而不只是卸載時）都應呼叫，否則舊物件的
// 幾何體/材質會持續累積在 GPU 記憶體中，是長時間使用後越來越卡頓的常見成因
export function disposeObject3D(obj: THREE.Object3D) {
  obj.traverse(child => {
    if (
      child instanceof THREE.Mesh ||
      child instanceof THREE.Points ||
      child instanceof THREE.Line
    ) {
      child.geometry?.dispose()
      const material = child.material
      if (Array.isArray(material)) {
        material.forEach(m => m.dispose())
      } else {
        material?.dispose()
      }
    }
  })
}

export class ThreeJSScene {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private container: HTMLElement
  private animationId: number | null = null
  private isDark: boolean = true
  private backgroundToken: SceneToken | null
  private boundHandleResize = this.handleResize.bind(this)

  constructor(
    container: HTMLElement,
    options: {
      /** 指定場景背景 token；省略時背景透明，透出容器的 bg-surface */
      background?: SceneToken
      alpha?: boolean
      antialias?: boolean
      isDark?: boolean
    } = {}
  ) {
    this.container = container
    this.isDark = options.isDark ?? true
    this.backgroundToken = options.background ?? null

    // 創建場景
    this.scene = new THREE.Scene()
    this.applyBackground()

    // 創建相機
    const width = container.clientWidth
    const height = container.clientHeight
    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
    this.camera.position.set(0, 0, 10)

    // 創建渲染器
    this.renderer = new THREE.WebGLRenderer({
      alpha: options.alpha ?? true,
      antialias: options.antialias ?? true,
    })
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.setSize(width, height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    // 添加到 DOM
    container.appendChild(this.renderer.domElement)

    // 添加基本光照
    this.setupLights()

    // 開始渲染循環
    this.animate()

    // 監聽窗口大小變化
    window.addEventListener('resize', this.boundHandleResize)
  }

  private applyBackground() {
    this.scene.background = this.backgroundToken ? tokenColor(this.backgroundToken) : null
  }

  // 中性白光：只負責塑形，不替物件染色
  private setupLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, this.isDark ? 0.75 : 0.9)
    this.scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, this.isDark ? 0.7 : 0.6)
    directionalLight.position.set(10, 10, 5)
    this.scene.add(directionalLight)
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

  // 清空場景（除了光照），並釋放幾何體與材質的 GPU 資源
  clearScene() {
    const objectsToRemove: THREE.Object3D[] = []
    this.scene.traverse(child => {
      if (!(child instanceof THREE.Light) && child !== this.scene) {
        objectsToRemove.push(child)
      }
    })

    objectsToRemove.forEach(obj => {
      this.scene.remove(obj)
      disposeObject3D(obj)
    })
  }

  // 從場景移除物件並釋放其幾何體/材質，供元件在重建可視化內容時呼叫
  removeAndDispose(object: THREE.Object3D) {
    this.scene.remove(object)
    disposeObject3D(object)
  }

  // 獲取相機
  getCamera() {
    return this.camera
  }

  // 獲取場景
  getScene() {
    return this.scene
  }

  // 更新主題：重新讀取 token 背景並重設光照強度
  updateTheme(isDark: boolean) {
    this.isDark = isDark
    this.applyBackground()

    this.scene.remove(...this.scene.children.filter(child => child instanceof THREE.Light))
    this.setupLights()
  }

  // 銷毀
  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }

    window.removeEventListener('resize', this.boundHandleResize)

    this.clearScene()
    this.renderer.dispose()

    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement)
    }
  }
}

/** 霧面材質：不發光、低光澤，顏色由 token 決定 */
export function createSceneMaterial(color: number | THREE.Color, opacity: number = 0.92) {
  return new THREE.MeshPhongMaterial({
    color,
    transparent: opacity < 1,
    opacity,
    emissive: 0x000000,
    shininess: 12,
    specular: 0x111111,
  })
}

// 創建粒子系統
export function createParticleSystem(count: number, color: number = tokenHex('ink-3')) {
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
    color,
    size: 0.08,
    transparent: true,
    opacity: 0.45,
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
    rotationZ: object.rotation.z,
  }

  const target = {
    x: to.x ?? from.x,
    y: to.y ?? from.y,
    z: to.z ?? from.z,
    rotationX: to.rotation?.x ?? from.rotationX,
    rotationY: to.rotation?.y ?? from.rotationY,
    rotationZ: to.rotation?.z ?? from.rotationZ,
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
