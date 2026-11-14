import { nextTick, onBeforeUnmount, ref, shallowRef, watch, type Ref, type WatchSource } from 'vue'
import type * as THREE from 'three'
import {
  SceneStage,
  isWebGLAvailable,
  type ScenePalette,
  type SceneHit,
  type SceneStageOptions,
} from '@/utils/three-scene'
import { useTheme } from '@/composables/useTheme'
import { useVisibleOnce } from '@/composables/useVisibleOnce'

export interface UseSceneStageOptions extends Pick<SceneStageOptions, 'view' | 'fov' | 'maxYaw'> {
  /** 重建場景內容；回傳可被滑鼠指到的物件 */
  build: (stage: SceneStage, root: THREE.Group, palette: ScenePalette) => THREE.Object3D[] | void
  /** 這些資料變動時重建內容 */
  sources: WatchSource[]
}

/**
 * 3D 卡片的共用生命週期：
 * 捲進可視範圍才建立 WebGL（避免同頁四張卡片同時搶資源）、資料或主題變動時重建、
 * 卸載時完整釋放；WebGL 不可用或環境遺失時回報 unsupported，讓卡片改顯示文字摘要。
 */
export function useSceneStage(
  container: Ref<HTMLElement | undefined>,
  options: UseSceneStageOptions
) {
  const { isDark } = useTheme()
  const unsupported = ref(false)
  const hover = shallowRef<SceneHit | null>(null)
  let stage: SceneStage | null = null

  const rebuild = () => {
    const current = stage
    current?.setContent((root, palette) => options.build(current, root, palette))
  }

  const destroy = () => {
    stage?.dispose()
    stage = null
    hover.value = null
  }

  const init = () => {
    if (stage || !container.value) return
    if (!isWebGLAvailable()) {
      unsupported.value = true
      return
    }
    try {
      stage = new SceneStage(container.value, {
        view: options.view,
        fov: options.fov,
        maxYaw: options.maxYaw,
        onHover: hit => {
          hover.value = hit
        },
        onContextLost: () => {
          destroy()
          unsupported.value = true
        },
      })
    } catch {
      destroy()
      unsupported.value = true
      return
    }
    rebuild()
  }

  const { isVisible } = useVisibleOnce(container)
  watch(isVisible, visible => visible && nextTick(init), { immediate: true })

  // 主題 class 在 useTheme 內同步切換，這裡讀到的 CSS 變數已是新主題
  watch(isDark, () => {
    stage?.refreshPalette()
    rebuild()
  })
  watch(options.sources, rebuild)

  onBeforeUnmount(destroy)

  return { unsupported, hover }
}
