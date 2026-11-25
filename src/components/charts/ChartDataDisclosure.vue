<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  caption: string
  columns: string[]
  rows: { key: string; label: string; values: string[] }[]
}>()

const expanded = ref(false)

function updateExpanded(event: Event) {
  expanded.value = (event.currentTarget as HTMLDetailsElement).open
}
</script>

<template>
  <details
    class="chart-data-disclosure rounded-md border border-line"
    @toggle="updateExpanded"
  >
    <summary class="cursor-pointer rounded-md px-3 py-2 text-sm font-medium text-ink hover:bg-raised">
      查看{{ caption }}資料
    </summary>
    <table
      v-if="expanded"
      class="w-full text-left text-sm text-ink"
    >
      <caption class="sr-only">
        {{ caption }}資料
      </caption>
      <thead class="bg-raised text-ink-2">
        <tr>
          <th
            v-for="column in columns"
            :key="column"
            scope="col"
            class="px-3 py-2"
          >
            {{ column }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in rows"
          :key="row.key"
          class="border-t border-line"
        >
          <th
            scope="row"
            class="px-3 py-2 font-medium"
          >
            {{ row.label }}
          </th>
          <td
            v-for="(value, index) in row.values"
            :key="index"
            class="px-3 py-2 font-mono"
          >
            {{ value }}
          </td>
        </tr>
      </tbody>
    </table>
  </details>
</template>
