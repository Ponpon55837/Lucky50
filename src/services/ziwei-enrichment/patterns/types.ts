import type { Branch } from '@/utils/ganzhi'
import type { Transformation } from '@/utils/ziwei'
import type { ZiWeiChartSnapshot, ZiWeiSnapshotStar } from '../types'

export interface ZiWeiPatternStar extends ZiWeiSnapshotStar {
  branch: Branch
  natalTransformation?: Transformation
}

export interface ZiWeiPatternCondition {
  id: string
  description: string
  matched: boolean
  branches: readonly Branch[]
  stars: readonly ZiWeiPatternStar[]
}

export interface ZiWeiPatternResult {
  id: 'fu-xiang-chao-yuan' | 'yang-liang-chang-lu' | 'wu-tan'
  name: string
  status: 'qualified' | 'weakened' | 'not-qualified'
  ruleVersion: 1
  conventionId: ZiWeiChartSnapshot['conventionId']
  sources: readonly { title: string; url: string }[]
  required: readonly ZiWeiPatternCondition[]
  supporting: readonly ZiWeiPatternCondition[]
  breaking: readonly ZiWeiPatternCondition[]
}
