# Three.js 3D 視覺化開發指南

## 🎮 Three.js 版本與配置

### 推薦版本

- **Three.js**: `^0.160.0` 或更新
- **@types/three**: 當前與 Three.js 版本一致

### Vite 配置優化

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  optimizeDeps: {
    include: ['three', 'three/examples/jsm/OrbitControls'],
  },
  resolve: {
    alias: {
      three: 'three',
      'three/addons/': 'three/examples/jsm/controls/OrbitControls',
      'three/nodes': 'three/examples/jsm/nodes/TransformNode',
      'three/loaders': 'three/examples/jsm/loaders/GLTFLoader',
      'three/loaders/DRACOLoader': 'three/examples/jsm/loaders/DRACOLoader',
    },
  },
})
```

## 🎮 場景核心概念

### 場景、相機、渲染器

```typescript
// 場景設置
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x87ceeb)
scene.fog = new THREE.Fog(0x87ceeb, 0x98d8c8)

// 相機設置
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.z = 5

// 渲染器設置
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)
```

### 幾何體和材質

```typescript
// 幾何體
const geometry = new THREE.BoxGeometry(1, 1, 1)
const sphere = new THREE.SphereGeometry(0.5, 32, 32)

// 材質
const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 })
const textureLoader = new THREE.TextureLoader()

// 材質載入
textureLoader.load('/textures/texture.jpg', texture => {
  const material = new THREE.MeshStandardMaterial({ map: texture })
  const mesh = new THREE.Mesh(geometry, material)
})
```

## 🎯 組件開發模式

### 組件封裝

```typescript
// ThreeVisualizationComponent.vue
import { onMounted, onUnmounted, ref } from 'vue'
import * as THREE from 'three'

export default defineComponent({
  name: 'ThreeVisualization',
  props: {
    data: { type: Array<any> }
  },
  setup(props) {
    const container = ref<HTMLElement>()
    let renderer: THREE.WebGLRenderer
    let scene: THREE.Scene
    let camera: THREE.PerspectiveCamera
    let animationId: number

    const init = () => {
      // 創建場景
      scene = new THREE.Scene()
      scene.background = new THREE.Color(0x87CEEB)

      // 設置相機
      camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
      camera.position.z = 5

      // 建立渲染器
      renderer = new THREE.WebGLRenderer({ antialias: true })
      renderer.setPixelRatio(window.devicePixelRatio)
      renderer.setSize(container.value.clientWidth, container.value.clientHeight)
      container.value.appendChild(renderer.domElement)

      // 添加物件到場景
      const geometry = new THREE.BoxGeometry(1, 1, 1)
      const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 })
      const cube = new THREE.Mesh(geometry, material)
      scene.add(cube)
    }

    const animate = () => {
      animationId = requestAnimationFrame(animate)

      cube.rotation.x += 0.01
      renderer.render(scene, camera)
    }

    onMounted(() => {
      init()
      animate()
    })

    onUnmounted(() => {
      cancelAnimationFrame(animationId)
      if (renderer) {
        renderer.dispose()
        if (container.value.contains(renderer.domElement)) {
          container.value.removeChild(renderer.domElement)
        }
      }
    }

    return { container }
  },
})
```

### 響應式更新

```typescript
// 動態更新幾何體
const { geometry, material } = useResponsiveGeometry()

// 使用 reactively 訿
const mesh = new THREE.Mesh(geometry, material)

// 監聽 props 變化
watch(props, newProps => {
  geometry.dispose()
  const newGeometry = createGeometryFromProps(newProps)
  material.dispose()
  const newMaterial = createMaterialFromProps(newProps)

  const newMesh = new THREE.Mesh(newGeometry, newMaterial)
  mesh.position.set(...newProps.position)
})
```

## 📋 動態幾何體

### 可重用的幾何體創建函數

```typescript
// 創建球體
export const createSphere = (radius: number, color: number = 0x00ff00) => {
  const geometry = new THREE.SphereGeometry(radius, 32, 32)
  const material = new THREE.MeshStandardMaterial({ color })
  return new THREE.Mesh(geometry, material)
}

// 創建立方體
export const createBox = (width: number, height: number, depth: number) => {
  const geometry = new THREE.BoxGeometry(width, height, depth)
  const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 })
  return new THREE.Mesh(geometry, material)
}

// 創建立複合幾何體
export const createCompositeGeometry = () => {
  const group = new THREE.Group()

  // 添加子物件
  group.add(createSphere(1, 0xff0000))
  group.add(createBox(2, 1, 1))

  return group
}
```

## 🎯 動畫系統

### 基礎動畫迴圈

```typescript
import * as THREE from 'three'

export function useBasicAnimation(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  objects: THREE.Object3D[]
) {
  let animationId: number

  const animate = () => {
    animationId = requestAnimationFrame(animate)

    // 旋轉動畫
    objects.forEach(object => {
      object.rotation.y += 0.01
      object.rotation.x += 0.005
    })

    renderer.render(scene, camera)
  }

  const start = () => {
    animate()
  }

  const stop = () => {
    cancelAnimationFrame(animationId)
  }

  const toggle = () => {
    if (animationId) {
      stop()
    } else {
      start()
    }
  }

  return { start, stop, toggle, isAnimating: computed(() => animationId !== null) }
}
```

### 進階動畫系統

```typescript
import * as THREE from 'three'
import { gsap } from 'gsap'

export function useAdvancedAnimation(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  mesh: THREE.Mesh
) {
  const clock = new THREE.Clock()

  const animate = () => {
    const delta = clock.getDelta()
    mesh.rotation.x += delta * 2
    mesh.rotation.y += delta * 1.5

    gsap.to(mesh.rotation.x, { duration: 2, ease: 'power2.inOut' })
    gsap.to(mesh.rotation.y, { duration: 1.5, ease: 'bounce.out' })

    renderer.render(scene, camera)
  }

  onMounted(() => {
    animate()
  })

  onUnmounted(() => {
    clock.stop()
  })

  return {
    pause: () => gsap.globalTimeline.pause(),
    resume: () => gsap.globalTimeline.resume(),
  }
}
```

## 📋 檢測和除錯

### 開發者工具

```typescript
// 誢查幾何體邊界框
const checkBounds = (object: THREE.Object3D) => {
  const box = new THREE.Box3D().setFromObject(object)
  const helper = new THREE.BoxHelper(box, 0xff0000)

  scene.add(helper)
  console.log('Bounding box:', helper.box)
  scene.remove(helper)
}

// 性能監控
const createPerformanceMonitor = () => {
  const stats = new Stats()
  document.body.appendChild(stats.dom)
  return stats
}

// 顯示座標軸
const createAxesHelper = () => {
  const axes = new THREE.AxesHelper(5)
  scene.add(axes)
  return axes
}
```

## 🎯 最佳實踐

### 效能最佳化

```typescript
// 使用實例化物件
import { InstancedMesh } from 'three/examples/jsm/modifiers/InstancedMesh'

// 使用幾何體合併
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils'

// 減少繪製調用
const geometry = new THREE.BufferGeometry()
geometry.setAttribute('position', new Float32Array(vertices), 3)
```

### 記憶體管理

```typescript
// 自動釋放紋理
class TextureManager {
  private textures: Map<string, THREE.Texture> = new Map()

  loadTexture(url: string): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
      const textureLoader = new THREE.TextureLoader()

      textureLoader.load(
        url,
        texture => {
          this.textures.set(url, texture)
          resolve(texture)
        },
        undefined,
        error => {
          console.error(`Failed to load texture: ${error}`)
          reject(error)
        }
      )
    })
  }

  getTexture(url: string): THREE.Texture | undefined {
    return this.textures.get(url)
  }

  dispose() {
    this.textures.forEach(texture => {
      texture.dispose()
    })
    this.textures.clear()
  }
}
```

---

**注意**：Three.js 記憶體管理非常重要，必須適當清理幾何體、材質和渲染器，避免記憶體洩漏。
