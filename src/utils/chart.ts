/**
 * 輕量 SVG 繪圖工具（純函式）
 * 取代在儀表板上載入整個 Chart.js；全部為單趟 O(n) 計算。
 */

export interface Point {
  x: number
  y: number
}

/** 單趟同時取得最小與最大值；避免 Math.min(...arr) 的兩次走訪與大陣列堆疊溢位 */
export function extent(values: readonly number[]): [number, number] {
  if (values.length === 0) return [0, 0]
  let min = values[0]
  let max = values[0]
  for (let i = 1; i < values.length; i++) {
    const value = values[i]
    if (value < min) min = value
    else if (value > max) max = value
  }
  return [min, max]
}

/** 線性比例尺：domain → range；domain 退化（相等）時回傳 range 中點 */
export function linearScale(
  [d0, d1]: readonly [number, number],
  [r0, r1]: readonly [number, number]
): (value: number) => number {
  const span = d1 - d0
  if (span === 0) {
    const mid = (r0 + r1) / 2
    return () => mid
  }
  const ratio = (r1 - r0) / span
  return value => r0 + (value - d0) * ratio
}

const round = (n: number) => Math.round(n * 10) / 10

/**
 * 平滑折線：相鄰兩點以水平切線的三次貝茲曲線連接，
 * 曲線不會超出相鄰兩點的 y 範圍，因此不會畫出不存在的高低點。
 */
export function smoothPath(points: readonly Point[]): string {
  if (points.length === 0) return ''
  const parts: string[] = [`M${round(points[0].x)} ${round(points[0].y)}`]
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    const midX = round((prev.x + curr.x) / 2)
    parts.push(
      `C${midX} ${round(prev.y)} ${midX} ${round(curr.y)} ${round(curr.x)} ${round(curr.y)}`
    )
  }
  return parts.join(' ')
}

/** 將折線封閉到底線，作為淡色面積填色 */
export function areaPath(points: readonly Point[], baseline: number): string {
  if (points.length === 0) return ''
  const first = points[0]
  const last = points[points.length - 1]
  return `${smoothPath(points)} L${round(last.x)} ${round(baseline)} L${round(first.x)} ${round(baseline)} Z`
}

/** 弧形扇區（甜甜圈片段），角度以度為單位、0° 指向右方、順時針 */
export function annularSector(
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number
): string {
  const toRad = Math.PI / 180
  const [c0, s0] = [Math.cos(startAngle * toRad), Math.sin(startAngle * toRad)]
  const [c1, s1] = [Math.cos(endAngle * toRad), Math.sin(endAngle * toRad)]
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  return [
    `M${round(outerRadius * c0)} ${round(outerRadius * s0)}`,
    `A${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${round(outerRadius * c1)} ${round(outerRadius * s1)}`,
    `L${round(innerRadius * c1)} ${round(innerRadius * s1)}`,
    `A${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${round(innerRadius * c0)} ${round(innerRadius * s0)}`,
    'Z',
  ].join(' ')
}

/** 極座標轉直角座標（角度制，0° 指向右方） */
export function polar(radius: number, angle: number): Point {
  const rad = (angle * Math.PI) / 180
  return { x: round(radius * Math.cos(rad)), y: round(radius * Math.sin(rad)) }
}

/** 等距取 count 個索引（含頭尾），用於座標軸標籤 */
export function evenIndices(length: number, count: number): number[] {
  if (length <= 0 || count <= 0) return []
  if (length <= count) return Array.from({ length }, (_, i) => i)
  if (count === 1) return [0]
  const step = (length - 1) / (count - 1)
  return Array.from({ length: count }, (_, i) => Math.round(i * step))
}
