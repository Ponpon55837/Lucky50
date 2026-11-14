import { computed, type ComputedRef } from 'vue'
import { buildBirthChart } from '@/services/engines/birthChart'
import { lunarService } from '@/services/lunar'
import type { EngineInput, MetaphysicsEngine, MetaphysicsResult } from '@/services/engines/types'
import type { UserProfileCompat } from '@/services/integratedFortune'

export interface EngineState<T> {
  result: T | null
  error: string | null
}

/**
 * 引擎卡片共用：以個人資料與日期執行引擎，並把結果整理成卡片要顯示的形狀。
 * 計算是同步純運算，放在 computed 裡，輸入不變就不重算。
 */
export function useEngineResult<T>(
  engine: MetaphysicsEngine,
  profile: () => UserProfileCompat | null,
  date: () => Date,
  present: (raw: MetaphysicsResult, input: EngineInput) => T
): ComputedRef<EngineState<T>> {
  return computed(() => {
    const current = profile()
    if (!current) return { result: null, error: null }
    try {
      const input: EngineInput = {
        profile: current,
        date: date(),
        today: lunarService.getLunarData(date()),
        chart: buildBirthChart(current),
      }
      return { result: present(engine.calculate(input), input), error: null }
    } catch (e) {
      return { result: null, error: e instanceof Error ? e.message : '計算失敗' }
    }
  })
}
