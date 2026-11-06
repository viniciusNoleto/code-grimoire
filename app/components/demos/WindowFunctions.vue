<script setup lang="ts">
// Vendas mensais de dois vendedores; cada função de janela calculada como o banco faria.
// As chaves das linhas são as colunas da tabela de exemplo (vendas), as mesmas do SQL exibido.
import ResultTable from './ResultTable.vue'

interface Sale { vendedor: string, mes: number, valor: number }
const sales: Sale[] = [
  { vendedor: 'Ana', mes: 1, valor: 100 }, { vendedor: 'Ana', mes: 2, valor: 300 }, { vendedor: 'Ana', mes: 3, valor: 300 }, { vendedor: 'Ana', mes: 4, valor: 200 },
  { vendedor: 'Bruno', mes: 1, valor: 150 }, { vendedor: 'Bruno', mes: 2, valor: 150 }, { vendedor: 'Bruno', mes: 3, valor: 400 }, { vendedor: 'Bruno', mes: 4, valor: 50 },
]
type Fn = 'rn' | 'rank' | 'drank' | 'sum' | 'avg' | 'lag' | 'pct'
const FNS: Record<Fn, { label: string, expr: string, orderBy: 'valor' | 'mes', desc: string }> = {
  rn: { label: 'row_number()', expr: 'row_number() OVER (%P ORDER BY valor DESC)', orderBy: 'valor', desc: 'Numeração sequencial na ordem da janela, sem empates. A ordem entre empatados é arbitrária.' },
  rank: { label: 'rank()', expr: 'rank() OVER (%P ORDER BY valor DESC)', orderBy: 'valor', desc: 'Empates recebem a mesma posição e a próxima é pulada (1, 2, 2, 4).' },
  drank: { label: 'dense_rank()', expr: 'dense_rank() OVER (%P ORDER BY valor DESC)', orderBy: 'valor', desc: 'Empates recebem a mesma posição, sem pular (1, 2, 2, 3).' },
  sum: { label: 'soma acumulada', expr: 'sum(valor) OVER (%P ORDER BY mes)', orderBy: 'mes', desc: 'Com ORDER BY na janela, o frame padrão vai do início até a linha atual: a soma vira acumulada.' },
  avg: { label: 'média móvel 3m', expr: 'round(avg(valor) OVER (%P ORDER BY mes\n  ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 1)', orderBy: 'mes', desc: 'Frame explícito: a linha atual e as duas anteriores.' },
  lag: { label: 'variação (lag)', expr: 'valor - lag(valor) OVER (%P ORDER BY mes)', orderBy: 'mes', desc: 'lag() lê o valor da linha anterior na janela; a primeira de cada partição não tem anterior (NULL).' },
  pct: { label: '% do total', expr: 'round(100.0 * valor / sum(valor) OVER (%P), 1)', orderBy: 'mes', desc: 'Sem ORDER BY, a janela é a partição inteira: sum() dá o total do grupo em cada linha.' },
}
const fn = ref<Fn>('rank')
const partitioned = ref(true)

const sql = computed(() => {
  const P = partitioned.value
  const expr = FNS[fn.value].expr.replace('%P ', P ? 'PARTITION BY vendedor ' : '').replace('(%P)', P ? '(PARTITION BY vendedor)' : '()')
  return `SELECT vendedor, mes, valor,\n  ${expr} AS resultado\nFROM vendas;`
})

const rows = computed(() => {
  const f = FNS[fn.value]
  const groups = partitioned.value ? ['Ana', 'Bruno'].map(v => sales.filter(d => d.vendedor === v)) : [sales.slice()]
  const out: Record<string, unknown>[] = []
  for (const g of groups) {
    const sorted = f.orderBy === 'valor'
      ? g.slice().sort((a, b) => b.valor - a.valor || a.mes - b.mes || a.vendedor.localeCompare(b.vendedor))
      : g.slice().sort((a, b) => a.mes - b.mes || a.vendedor.localeCompare(b.vendedor))
    const total = g.reduce((s, x) => s + x.valor, 0)
    sorted.forEach((r, i) => {
      let v: number | string | null = null
      if (fn.value === 'rn') v = i + 1
      if (fn.value === 'rank') v = sorted.findIndex(x => x.valor === r.valor) + 1
      if (fn.value === 'drank') v = [...new Set(sorted.map(x => x.valor))].indexOf(r.valor) + 1
      if (fn.value === 'sum') v = sorted.filter(x => x.mes <= r.mes).reduce((s, x) => s + x.valor, 0)
      if (fn.value === 'avg') { const frame = sorted.slice(Math.max(0, i - 2), i + 1); v = (frame.reduce((s, x) => s + x.valor, 0) / frame.length).toFixed(1) }
      if (fn.value === 'lag') v = i === 0 ? null : r.valor - sorted[i - 1]!.valor
      if (fn.value === 'pct') v = (100 * r.valor / total).toFixed(1)
      out.push({ vendedor: r.vendedor, mes: r.mes, valor: r.valor, resultado: v })
    })
  }
  return out
})
const highlightSecondGroup = (row: Record<string, unknown>) => (partitioned.value && row.vendedor === 'Bruno' ? 'bg-tome-soft' : undefined)
</script>

<template>
  <div>
    <div :class="workbench.buttons" role="group" aria-label="Função de janela">
      <button v-for="(f, k) in FNS" :key="k" type="button" :class="workbench.button(fn === k)" :aria-pressed="fn === k" @click="fn = k">
        {{ f.label }}
      </button>
    </div>
    <label :class="workbench.status" class="mb-3">
      <input v-model="partitioned" type="checkbox"> PARTITION BY vendedor
    </label>
    <pre class="mb-2 overflow-x-auto rounded-md border border-border bg-code px-3 py-2.5 font-mono text-[.8rem] leading-relaxed text-code-foreground">{{ sql }}</pre>
    <p :class="workbench.hint" aria-live="polite">
      {{ FNS[fn].desc }}
    </p>
    <ResultTable :columns="['vendedor', 'mes', 'valor', 'resultado']" :rows="rows" :highlight="highlightSecondGroup" />
  </div>
</template>
