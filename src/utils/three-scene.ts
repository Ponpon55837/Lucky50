import * as THREE from 'three'
import { fitDistance } from '@/utils/sceneLayout'

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
  | 'seal-ink'
  | 'gold'
  | 'rise'
  | 'fall'

// SSR / 測試環境讀不到 CSS 變數時的後備值（淺色主題）
const TOKEN_FALLBACK: Record<Exclude<SceneToken, 'line'>, number> = {
  paper: 0xf3f2ee,
  surface: 0xffffff,
  raised: 0xebe9e3,
  ink: 0x1b1a18,
  'ink-2': 0x55524c,
  'ink-3': 0x6f6b64,
  seal: 0xc0282d,
  'seal-ink': 0xb02227,
  gold: 0xf0c43c,
  rise: 0xb02227,
  fall: 0x167854,
}

const readChannels = (name: string): [number, number, number] | null => {
  if (typeof document === 'undefined') return null
  const raw = getComputedStyle(document.documentElement).getPropertyValue(`--c-${name}`).trim()
  if (!raw) return null
  const parts = raw.split(/[\s,/]+/).map(Number)
  if (parts.length < 3 || parts.slice(0, 3).some(n => Number.isNaN(n))) return null
  return [parts[0], parts[1], parts[2]]
}

/**
 * 於渲染當下讀取設計 token 並轉為 THREE.Color（sRGB → 線性）。
 * 深淺主題切換後重新呼叫即可取得新顏色。
 */
export function tokenColor(name: SceneToken): THREE.Color {
  if (name === 'line') return tokenColor('surface').lerp(tokenColor('ink'), 0.18)
  const channels = readChannels(name)
  if (!channels) return new THREE.Color(TOKEN_FALLBACK[name])
  const [r, g, b] = channels
  return new THREE.Color().setRGB(r / 255, g / 255, b / 255, THREE.SRGBColorSpace)
}

/** 場景色票：一次讀齊所有 token，元件只透過它取色 */
export type ScenePalette = Readonly<Record<SceneToken, THREE.Color>>

const PALETTE_TOKENS: readonly SceneToken[] = [
  'paper',
  'surface',
  'raised',
  'ink',
  'ink-2',
  'ink-3',
  'line',
  'seal',
  'seal-ink',
  'gold',
  'rise',
  'fall',
]

export function readPalette(): ScenePalette {
  return Object.fromEntries(PALETTE_TOKENS.map(name => [name, tokenColor(name)])) as ScenePalette
}

/** 瀏覽器能否建立 WebGL 環境（不能時元件改顯示文字摘要） */
export function isWebGLAvailable(): boolean {
  if (typeof document === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    return Boolean(
      window.WebGLRenderingContext && (canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
    )
  } catch {
    return false
  }
}

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/** 遞迴釋放物件樹的幾何體與材質（含 InstancedMesh 的實例緩衝） */
export function disposeObject3D(root: THREE.Object3D) {
  root.traverse(child => {
    if (child instanceof THREE.InstancedMesh) child.dispose()
    if (
      child instanceof THREE.Mesh ||
      child instanceof THREE.Line ||
      child instanceof THREE.Points
    ) {
      child.geometry.dispose()
      const materials = Array.isArray(child.material) ? child.material : [child.material]
      materials.forEach(material => material.dispose())
    }
  })
}

// ── 標籤 ──

export type LabelTone = 'ink' | 'ink-2' | 'ink-3' | 'seal' | 'rise' | 'fall'

export interface LabelOptions {
  tone?: LabelTone
  /** 標題字（襯線、較大）或數值字（等寬） */
  variant?: 'text' | 'title' | 'value'
  /** 標籤錨點相對於投影點的位置 */
  align?: 'center' | 'left' | 'right'
  anchor?: 'above' | 'below' | 'middle'
  /** 第二行小字（例如數值），與主文字疊成一個標籤，避免兩個標籤互相擠壓 */
  detail?: string
}

// 完整 class 字串列出，讓 Tailwind 掃描得到
const LABEL_TONE_CLASS: Readonly<Record<LabelTone, string>> = {
  ink: 'text-ink',
  'ink-2': 'text-ink-2',
  'ink-3': 'text-ink-3',
  seal: 'text-seal-ink',
  rise: 'text-rise',
  fall: 'text-fall',
}

const LABEL_VARIANT_CLASS = {
  text: 'text-[11px] sm:text-xs',
  title: 'font-serif text-[13px] font-bold sm:text-sm',
  value: 'font-mono text-[11px] sm:text-xs',
} as const

const LABEL_SHIFT_X = { center: '-50%', left: '0%', right: '-100%' } as const
const LABEL_SHIFT_Y = { above: '-100%', below: '0%', middle: '-50%' } as const

interface SceneLabel {
  element: HTMLElement
  position: THREE.Vector3
  shift: string
}

// ── 舞台 ──

export interface SceneHit {
  object: THREE.Object3D
  instanceId: number | undefined
  /** 相對於容器左上角的指標位置（px） */
  x: number
  y: number
}

export interface SceneStageOptions {
  /** 相機觀察方向（從目標指向相機），長度不拘 */
  view: [number, number, number]
  fov?: number
  /** 拖曳可左右旋轉的角度上限（弧度），0 表示不可旋轉 */
  maxYaw?: number
  /** 框景留白倍率 */
  padding?: number
  onHover?: (hit: SceneHit | null) => void
  onContextLost?: () => void
}

const MAX_PIXEL_RATIO = 2
const DRAG_RADIANS_PER_PX = 0.008

/**
 * 四個 3D 卡片共用的舞台：
 * - 紙面配色、半球光 + 主光的霧面打光，背景透明透出卡片底色
 * - 只在內容、尺寸、拖曳或動畫變動時重繪，閒置時不跑 render loop
 * - 捲出視窗或分頁隱藏時暫停動畫，回到畫面再補畫
 * - HTML 標籤層：文字用網站字體清楚呈現，隨 3D 位置投影
 */
export class SceneStage {
  readonly scene = new THREE.Scene()
  readonly camera: THREE.PerspectiveCamera
  /** 內容根節點：元件把物件加在這裡，拖曳旋轉作用在它身上 */
  readonly root = new THREE.Group()
  palette: ScenePalette = readPalette()

  private readonly renderer: THREE.WebGLRenderer
  private readonly container: HTMLElement
  private readonly labelLayer: HTMLDivElement
  private readonly options: Required<Omit<SceneStageOptions, 'onHover' | 'onContextLost'>> &
    Pick<SceneStageOptions, 'onHover' | 'onContextLost'>
  private readonly hemisphere = new THREE.HemisphereLight()
  private readonly keyLight = new THREE.DirectionalLight()
  private readonly raycaster = new THREE.Raycaster()
  private readonly pointer = new THREE.Vector2()
  private readonly resizeObserver: ResizeObserver
  private readonly intersectionObserver: IntersectionObserver | null
  private readonly reducedMotion = prefersReducedMotion()

  private labels: SceneLabel[] = []
  private hoverTargets: THREE.Object3D[] = []
  private animations = new Set<(now: number) => boolean>()
  private frame: number | null = null
  private inView = true
  private dirty = true
  private pendingHover: { x: number; y: number } | null = null
  private drag: { pointerId: number; startX: number; startYaw: number } | null = null
  private disposed = false

  constructor(container: HTMLElement, options: SceneStageOptions) {
    this.container = container
    this.options = {
      ...options,
      fov: options.fov ?? 30,
      maxYaw: options.maxYaw ?? 0.6,
      padding: options.padding ?? 1.08,
    }

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO))
    const canvas = this.renderer.domElement
    canvas.className = 'block h-full w-full'
    // 手機上垂直滑動仍交給頁面捲動，水平拖曳才旋轉場景
    canvas.style.touchAction = 'pan-y'
    container.appendChild(canvas)

    this.labelLayer = document.createElement('div')
    this.labelLayer.className = 'pointer-events-none absolute inset-0 overflow-hidden'
    this.labelLayer.setAttribute('aria-hidden', 'true')
    container.appendChild(this.labelLayer)

    this.camera = new THREE.PerspectiveCamera(this.options.fov, 1, 0.1, 200)
    this.scene.add(this.hemisphere, this.keyLight, this.keyLight.target, this.root)
    this.applyLights()

    canvas.addEventListener('pointerdown', this.handlePointerDown)
    canvas.addEventListener('pointermove', this.handlePointerMove)
    canvas.addEventListener('pointerup', this.handlePointerUp)
    canvas.addEventListener('pointercancel', this.handlePointerUp)
    canvas.addEventListener('pointerleave', this.handlePointerLeave)
    canvas.addEventListener('webglcontextlost', this.handleContextLost)
    document.addEventListener('visibilitychange', this.handleVisibility)

    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(container)
    this.intersectionObserver =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver(entries => {
            this.inView = entries.some(entry => entry.isIntersecting)
            this.schedule()
          })
    this.intersectionObserver?.observe(container)
    this.resize()
  }

  /** 是否該播放動畫（使用者偏好減少動態時，動畫直接跳到結尾） */
  get animated(): boolean {
    return !this.reducedMotion
  }

  /** 主題切換後重新讀色並更新燈光；元件接著重建內容 */
  refreshPalette() {
    this.palette = readPalette()
    this.applyLights()
    this.invalidate()
  }

  /** 清空內容並以 build 重建；build 回傳可被滑鼠指到的物件 */
  setContent(build: (root: THREE.Group, palette: ScenePalette) => THREE.Object3D[] | void) {
    this.animations.clear()
    this.clearLabels()
    for (const child of [...this.root.children]) {
      this.root.remove(child)
      disposeObject3D(child)
    }
    this.root.rotation.y = 0
    this.hoverTargets = build(this.root, this.palette) ?? []
    // build 結束時實例已在最終位置：此時算好包圍球，入場動畫縮放期間點選範圍仍正確
    for (const target of this.hoverTargets) {
      if (target instanceof THREE.InstancedMesh) target.computeBoundingSphere()
    }
    this.options.onHover?.(null)
    this.frameContent()
    this.invalidate()
  }

  /** 在 3D 位置（root 座標）放一個文字標籤 */
  addLabel(text: string, position: THREE.Vector3Tuple, options: LabelOptions = {}) {
    const {
      tone = 'ink-3',
      variant = 'text',
      align = 'center',
      anchor = 'middle',
      detail,
    } = options
    const element = document.createElement('span')
    element.className = `absolute left-0 top-0 whitespace-nowrap text-center leading-none will-change-transform ${LABEL_TONE_CLASS[tone]} ${LABEL_VARIANT_CLASS[variant]}`
    element.textContent = text
    if (detail) {
      const line = document.createElement('span')
      line.className = 'mt-1 block font-mono text-[10px] font-normal text-ink-3 sm:text-[11px]'
      line.textContent = detail
      element.appendChild(line)
    }
    this.labelLayer.appendChild(element)
    this.labels.push({
      element,
      position: new THREE.Vector3(...position),
      shift: `translate(${LABEL_SHIFT_X[align]}, ${LABEL_SHIFT_Y[anchor]})`,
    })
  }

  /**
   * 註冊一段動畫：每幀以經過的時間呼叫 step(progress 0→1)，到 1 結束。
   * 偏好減少動態時立即以 1 呼叫一次。
   */
  animate(durationMs: number, step: (progress: number) => void) {
    if (!this.animated) {
      step(1)
      this.invalidate()
      return
    }
    let start: number | null = null
    this.animations.add(now => {
      start ??= now
      const progress = Math.min(1, (now - start) / durationMs)
      step(progress)
      return progress < 1
    })
    this.schedule()
  }

  /** 請求下一幀重繪（多次呼叫只會排一幀） */
  invalidate() {
    this.dirty = true
    this.schedule()
  }

  dispose() {
    if (this.disposed) return
    this.disposed = true
    if (this.frame !== null) cancelAnimationFrame(this.frame)
    this.animations.clear()
    this.resizeObserver.disconnect()
    this.intersectionObserver?.disconnect()
    document.removeEventListener('visibilitychange', this.handleVisibility)
    const canvas = this.renderer.domElement
    canvas.removeEventListener('pointerdown', this.handlePointerDown)
    canvas.removeEventListener('pointermove', this.handlePointerMove)
    canvas.removeEventListener('pointerup', this.handlePointerUp)
    canvas.removeEventListener('pointercancel', this.handlePointerUp)
    canvas.removeEventListener('pointerleave', this.handlePointerLeave)
    canvas.removeEventListener('webglcontextlost', this.handleContextLost)
    disposeObject3D(this.root)
    this.root.clear()
    this.renderer.dispose()
    canvas.remove()
    this.labelLayer.remove()
  }

  // ── 內部 ──

  private applyLights() {
    const { surface, ink } = this.palette
    // 天光取紙色、地面反光取墨色，深淺主題各自協調；主光從左上前方打出立體面
    this.hemisphere.color.copy(surface).lerp(new THREE.Color(0xffffff), 0.6)
    this.hemisphere.groundColor.copy(ink).lerp(surface, 0.5)
    this.hemisphere.intensity = 2.2
    this.keyLight.color.set(0xffffff)
    this.keyLight.intensity = 1.6
    this.keyLight.position.set(-4, 10, 6)
  }

  private get active() {
    return this.inView && !document.hidden && !this.disposed
  }

  private schedule() {
    if (this.frame !== null || !this.active) return
    if (!this.dirty && this.animations.size === 0 && !this.pendingHover) return
    this.frame = requestAnimationFrame(this.tick)
  }

  private readonly tick = (now: number) => {
    this.frame = null
    if (!this.active) return
    for (const step of this.animations) {
      if (!step(now)) this.animations.delete(step)
      this.dirty = true
    }
    if (this.pendingHover) this.pick()
    if (this.dirty) this.render()
    this.schedule()
  }

  private render() {
    this.dirty = false
    this.renderer.render(this.scene, this.camera)
    this.positionLabels()
  }

  private positionLabels() {
    const { clientWidth: width, clientHeight: height } = this.container
    const projected = new THREE.Vector3()
    this.root.updateMatrixWorld()
    for (const label of this.labels) {
      projected.copy(label.position).applyMatrix4(this.root.matrixWorld).project(this.camera)
      const visible = projected.z < 1
      label.element.style.visibility = visible ? 'visible' : 'hidden'
      if (!visible) continue
      const x = (projected.x * 0.5 + 0.5) * width
      const y = (-projected.y * 0.5 + 0.5) * height
      label.element.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) ${label.shift}`
    }
  }

  private clearLabels() {
    for (const label of this.labels) label.element.remove()
    this.labels = []
  }

  private resize() {
    const { clientWidth: width, clientHeight: height } = this.container
    if (width === 0 || height === 0) return
    this.renderer.setSize(width, height, false)
    this.camera.aspect = width / height
    this.frameContent()
    this.invalidate()
  }

  /** 依內容的包圍盒調整相機距離，讓任何長寬比的卡片都剛好框住場景 */
  private frameContent() {
    const yaw = this.root.rotation.y
    this.root.rotation.y = 0
    this.root.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(this.root, true)
    this.root.rotation.y = yaw
    if (box.isEmpty()) return

    const center = box.getCenter(new THREE.Vector3())
    const back = new THREE.Vector3(...this.options.view).normalize()
    const right = new THREE.Vector3(0, 1, 0).cross(back).normalize()
    const up = back.clone().cross(right)
    const corners: [number, number, number][] = []
    for (const x of [box.min.x, box.max.x]) {
      for (const y of [box.min.y, box.max.y]) {
        for (const z of [box.min.z, box.max.z]) {
          const p = new THREE.Vector3(x, y, z).sub(center)
          corners.push([p.dot(right), p.dot(up), p.dot(back)])
        }
      }
    }
    const distance = fitDistance(
      corners,
      this.options.fov,
      this.camera.aspect,
      this.options.padding
    )
    this.camera.position.copy(center).addScaledVector(back, distance)
    this.camera.near = Math.max(0.1, distance / 50)
    this.camera.far = distance * 4
    this.camera.lookAt(center)
    this.camera.updateProjectionMatrix()
  }

  private pick() {
    const at = this.pendingHover
    this.pendingHover = null
    if (!at || !this.options.onHover) return
    const { clientWidth: width, clientHeight: height } = this.container
    this.pointer.set((at.x / width) * 2 - 1, -(at.y / height) * 2 + 1)
    this.raycaster.setFromCamera(this.pointer, this.camera)
    const [hit] = this.raycaster.intersectObjects(this.hoverTargets, false)
    this.renderer.domElement.style.cursor = hit ? 'pointer' : this.options.maxYaw ? 'grab' : ''
    this.options.onHover(hit ? { object: hit.object, instanceId: hit.instanceId, ...at } : null)
  }

  private localPoint(event: PointerEvent) {
    const rect = this.container.getBoundingClientRect()
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  private readonly handlePointerDown = (event: PointerEvent) => {
    if (!this.options.maxYaw || (event.pointerType === 'mouse' && event.button !== 0)) return
    this.drag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startYaw: this.root.rotation.y,
    }
  }

  private readonly handlePointerMove = (event: PointerEvent) => {
    if (this.drag && this.drag.pointerId === event.pointerId) {
      const { maxYaw } = this.options
      const yaw = this.drag.startYaw + (event.clientX - this.drag.startX) * DRAG_RADIANS_PER_PX
      this.root.rotation.y = Math.max(-maxYaw, Math.min(maxYaw, yaw))
      this.invalidate()
    }
    if (event.pointerType === 'mouse' || !this.drag) {
      this.pendingHover = this.localPoint(event)
      this.schedule()
    }
  }

  private readonly handlePointerUp = (event: PointerEvent) => {
    if (this.drag?.pointerId === event.pointerId) this.drag = null
    // 觸控沒有 hover：點一下顯示該處數值
    if (event.pointerType !== 'mouse' && event.type === 'pointerup') {
      this.pendingHover = this.localPoint(event)
      this.schedule()
    }
  }

  private readonly handlePointerLeave = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') return
    this.drag = null
    this.pendingHover = null
    this.options.onHover?.(null)
  }

  private readonly handleVisibility = () => this.schedule()

  private readonly handleContextLost = (event: Event) => {
    event.preventDefault()
    this.options.onContextLost?.()
  }
}

/** 霧面材質：低光澤、不發光，色彩完全來自 token */
export function matteMaterial(
  color: THREE.ColorRepresentation,
  options: { opacity?: number } = {}
): THREE.MeshStandardMaterial {
  const { opacity = 1 } = options
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.82,
    metalness: 0,
    transparent: opacity < 1,
    opacity,
    depthWrite: opacity >= 1,
  })
}

/** 細線材質（座標格、連線） */
export function lineMaterial(color: THREE.ColorRepresentation, opacity = 1) {
  return new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity })
}

/** 共用底座：紙面台座，所有場景放在同一種底板上 */
export function createBase(
  palette: ScenePalette,
  shape: { width: number; depth: number } | { radius: number }
): THREE.Mesh {
  const geometry =
    'radius' in shape
      ? new THREE.CylinderGeometry(shape.radius, shape.radius, 0.12, 96)
      : new THREE.BoxGeometry(shape.width, 0.12, shape.depth)
  const base = new THREE.Mesh(geometry, matteMaterial(palette.raised))
  base.position.y = -0.06
  return base
}

const scratchMatrix = new THREE.Matrix4()
const scratchPosition = new THREE.Vector3()
const scratchScale = new THREE.Vector3()
const scratchRotation = new THREE.Quaternion()
const yAxis = new THREE.Vector3(0, 1, 0)

/**
 * 以單位方塊建立大量柱體：一個 InstancedMesh 一次繪製，比逐一建立 Mesh 省下大量 draw call。
 * 每個實例以底部中心定位，scale 即長寬高。
 */
export function createColumns(count: number, material: THREE.Material): THREE.InstancedMesh {
  const geometry = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0)
  const mesh = new THREE.InstancedMesh(geometry, material, Math.max(1, count))
  mesh.count = count
  return mesh
}

/** 設定柱體實例的位置（底部中心）、尺寸與繞 y 軸的旋轉（弧度） */
export function placeColumn(
  mesh: THREE.InstancedMesh,
  index: number,
  [x, y, z]: THREE.Vector3Tuple,
  [width, height, depth]: THREE.Vector3Tuple,
  rotationY = 0
) {
  scratchPosition.set(x, y, z)
  // 高度為 0 的實例會讓矩陣不可逆，給一個極小值
  scratchScale.set(width, Math.max(height, 1e-4), depth)
  scratchRotation.setFromAxisAngle(yAxis, rotationY)
  mesh.setMatrixAt(index, scratchMatrix.compose(scratchPosition, scratchRotation, scratchScale))
  mesh.instanceMatrix.needsUpdate = true
}

/** 入場動畫用的緩動 */
export function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3
}
