import { buildBirthChart, type BirthInput } from '@/services/engines/birthChart'
import { adaptZiWeiChart } from '@/services/ziwei-enrichment/adaptChart'
import { buildZiWeiChart } from '@/utils/ziwei'

export function natalSnapshot(input: BirthInput) {
  const { lunarYear, lunarMonth, lunarDay, hourBranch } = buildBirthChart(input)
  const chart = buildZiWeiChart({
    yearStem: lunarYear.stem,
    yearBranch: lunarYear.branch,
    lunarMonth,
    lunarDay,
    hourBranch,
  })
  return adaptZiWeiChart(chart, lunarYear.stem)
}

const pad = (value: number) => String(value).padStart(2, '0')

const generalDates = Array.from({ length: 12 }, (_, index) => {
  const year = 1980 + index
  return `${year}-${pad(index + 1)}-${pad(1 + ((index * 7) % 28))}`
})
const yearBoundaryDates = [
  '2022-01-31',
  '2022-02-01',
  '2022-02-04',
  '2023-01-21',
  '2023-01-22',
  '2023-02-04',
  '2024-02-03',
  '2024-02-04',
  '2024-02-09',
  '2024-02-10',
]
const leapMonthDates = [
  '1955-05-06',
  '1955-05-07',
  '1984-12-07',
  '1984-12-08',
  '2001-06-06',
  '2001-06-07',
  '2020-06-06',
  '2020-06-07',
  '2023-04-05',
  '2023-04-06',
  '2025-08-08',
  '2025-08-09',
]

function birthInputs(dates: string[], times: string[]): BirthInput[] {
  return dates.flatMap(birthDate => times.map(birthTime => ({ birthDate, birthTime })))
}

export const referenceSamples = {
  general: birthInputs(
    [...generalDates, '1980-06-01'],
    Array.from({ length: 12 }, (_, index) => `${pad(index * 2)}:00`)
  ),
  yearBoundary: birthInputs(yearBoundaryDates, ['00:00', '12:00', '22:59']),
  leapMonth: birthInputs(leapMonthDates, ['00:00', '12:00']),
  lateZi: birthInputs(
    ['1990-05-15', '2024-02-09', '2025-08-08'],
    ['22:59', '23:00', '23:59', '00:00', '00:59', '01:00']
  ),
}
