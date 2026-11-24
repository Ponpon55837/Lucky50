import type { Branch, Stem } from '@/utils/ganzhi'
import type {
  Brightness,
  MainStar,
  MinorStar,
  PalaceName,
  Star,
  Transformation,
  ZiWeiChart,
} from '@/utils/ziwei'

export interface ZiWeiSnapshotStar {
  name: Star | MinorStar
  brightness: Brightness | null
}

export interface ZiWeiPalaceSnapshot {
  name: PalaceName
  stem: Stem
  branch: Branch
  stars: ZiWeiSnapshotStar[]
  borrowed: { fromBranch: Branch; stars: MainStar[] } | null
}

export interface ZiWeiStemTransformations {
  sourceStem: Stem
  entries: { type: Transformation; star: Star; palaceBranch: Branch }[]
}

export interface ZiWeiChartSnapshot {
  schemaVersion: 1
  conventionId: 'lucky50-natal-v1'
  lifeBranch: Branch
  bodyBranch: Branch
  bureau: ZiWeiChart['bureau']
  palaces: Record<Branch, ZiWeiPalaceSnapshot>
  natalTransformations: ZiWeiStemTransformations
}
