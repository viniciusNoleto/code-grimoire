<script setup lang="ts">
// Uma tabela de resultado de consulta, como o psql mostraria: NULL em itálico e "(0 linhas)".
type Row = Record<string, unknown>
defineProps<{ columns: string[], rows: Row[], highlight?: (row: Row) => string | undefined }>()
const isNull = (v: unknown) => v === null || v === undefined
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full border-collapse font-mono text-[.8rem] tabular-nums">
      <thead>
        <tr>
          <th v-for="c in columns" :key="c" class="border-b border-border px-3 py-1.5 text-left font-sans text-[.72rem] font-semibold tracking-widest text-muted-foreground uppercase">
            {{ c }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, i) in rows" :key="i" :class="highlight?.(row)">
          <td v-for="c in columns" :key="c" class="border-b border-border px-3 py-1.5" :class="isNull(row[c]) && 'text-muted-foreground italic'">
            {{ isNull(row[c]) ? 'NULL' : row[c] }}
          </td>
        </tr>
        <tr v-if="!rows.length">
          <td :colspan="columns.length" class="border-b border-border px-3 py-1.5 text-muted-foreground italic">
            (0 linhas)
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
