<script setup lang="ts">
// Três clientes e cinco pedidos; cada tipo de JOIN calculado em JavaScript, como o banco faria.
// As chaves das linhas são as colunas das tabelas de exemplo (clientes, pedidos), as mesmas do SQL exibido.
import ResultTable from './ResultTable.vue'

interface Customer { id: number, nome: string, cidade: string }
interface Order { id: number, cliente_id: number | null, total: number }
const customers: Customer[] = [{ id: 1, nome: 'Ana', cidade: 'Manaus' }, { id: 2, nome: 'Bruno', cidade: 'Boa Vista' }, { id: 3, nome: 'Carla', cidade: 'Belém' }]
const orders: Order[] = [{ id: 101, cliente_id: 1, total: 250 }, { id: 102, cliente_id: 1, total: 90 }, { id: 103, cliente_id: 2, total: 410 }, { id: 104, cliente_id: null, total: 75 }, { id: 105, cliente_id: 9, total: 120 }]

type JoinKind = 'inner' | 'left' | 'right' | 'full' | 'cross' | 'semi' | 'anti' | 'notin'
const JOINS: Record<JoinKind, { label: string, sql: string, desc: string }> = {
  inner: { label: 'INNER JOIN', sql: 'SELECT c.nome, p.id, p.total\nFROM clientes c\nJOIN pedidos p ON p.cliente_id = c.id;', desc: 'Só pares que casam. Carla (sem pedido) e os pedidos 104 e 105 (sem cliente válido) ficam de fora.' },
  left: { label: 'LEFT JOIN', sql: 'SELECT c.nome, p.id, p.total\nFROM clientes c\nLEFT JOIN pedidos p ON p.cliente_id = c.id;', desc: 'Todos os clientes. Carla aparece com as colunas de pedidos em NULL.' },
  right: { label: 'RIGHT JOIN', sql: 'SELECT c.nome, p.id, p.total\nFROM clientes c\nRIGHT JOIN pedidos p ON p.cliente_id = c.id;', desc: 'Todos os pedidos. 104 e 105 aparecem sem cliente. Na prática, prefira inverter as tabelas e usar LEFT.' },
  full: { label: 'FULL JOIN', sql: 'SELECT c.nome, p.id, p.total\nFROM clientes c\nFULL JOIN pedidos p ON p.cliente_id = c.id;', desc: 'Tudo dos dois lados, casando quando possível. Útil para reconciliar duas fontes.' },
  cross: { label: 'CROSS JOIN', sql: 'SELECT c.nome, p.id, p.total\nFROM clientes c\nCROSS JOIN pedidos p;', desc: 'Produto cartesiano: cada cliente com cada pedido (3 × 5 = 15 linhas). Mostrando as 8 primeiras.' },
  semi: { label: 'EXISTS (semi)', sql: 'SELECT c.*\nFROM clientes c\nWHERE EXISTS (\n  SELECT 1 FROM pedidos p WHERE p.cliente_id = c.id\n);', desc: 'Clientes com pelo menos um pedido, sem duplicar Ana (que tem dois).' },
  anti: { label: 'NOT EXISTS (anti)', sql: 'SELECT c.*\nFROM clientes c\nWHERE NOT EXISTS (\n  SELECT 1 FROM pedidos p WHERE p.cliente_id = c.id\n);', desc: 'Clientes sem nenhum pedido.' },
  notin: { label: 'NOT IN (armadilha)', sql: 'SELECT c.*\nFROM clientes c\nWHERE c.id NOT IN (SELECT cliente_id FROM pedidos);', desc: 'Zero linhas! A subconsulta contém NULL (pedido 104), então "3 NOT IN (1, 1, 2, NULL, 9)" vale NULL, e o WHERE descarta.' },
}
const kind = ref<JoinKind>('left')

const result = computed(() => {
  const k = kind.value
  const pair = (c?: Customer | null, o?: Order | null) => ({ nome: c?.nome ?? null, pedido: o?.id ?? null, total: o?.total ?? null, unmatched: !c || !o })
  if (k === 'semi') return { columns: ['id', 'nome', 'cidade'], rows: customers.filter(c => orders.some(o => o.cliente_id === c.id)) }
  if (k === 'anti') return { columns: ['id', 'nome', 'cidade'], rows: customers.filter(c => !orders.some(o => o.cliente_id === c.id)) }
  if (k === 'notin') return { columns: ['id', 'nome', 'cidade'], rows: [] }
  let rows: ReturnType<typeof pair>[] = []
  if (k === 'inner') customers.forEach(c => orders.filter(o => o.cliente_id === c.id).forEach(o => rows.push(pair(c, o))))
  if (k === 'left' || k === 'full') {
    customers.forEach((c) => {
      const matches = orders.filter(o => o.cliente_id === c.id)
      if (matches.length) matches.forEach(o => rows.push(pair(c, o)))
      else rows.push(pair(c, null))
    })
  }
  if (k === 'right') orders.forEach(o => rows.push(pair(customers.find(c => c.id === o.cliente_id), o)))
  if (k === 'full') orders.filter(o => !customers.some(c => c.id === o.cliente_id)).forEach(o => rows.push(pair(null, o)))
  if (k === 'cross') {
    customers.forEach(c => orders.forEach(o => rows.push(pair(c, o))))
    rows = rows.slice(0, 8).map(r => ({ ...r, unmatched: false }))
  }
  return { columns: ['nome', 'pedido', 'total'], rows }
})
const highlightUnmatched = (row: Record<string, unknown>) => (row.unmatched ? 'bg-trap-soft' : undefined)
</script>

<template>
  <div>
    <div :class="workbench.columns">
      <div :class="workbench.panel">
        <h4 :class="workbench.panelTitle">
          clientes
        </h4>
        <ResultTable :columns="['id', 'nome', 'cidade']" :rows="customers as any" />
      </div>
      <div :class="workbench.panel">
        <h4 :class="workbench.panelTitle">
          pedidos
        </h4>
        <ResultTable :columns="['id', 'cliente_id', 'total']" :rows="orders as any" />
      </div>
    </div>
    <div :class="workbench.buttons" class="mt-3" role="group" aria-label="Tipo de JOIN">
      <button v-for="(t, k) in JOINS" :key="k" type="button" :class="workbench.button(kind === k)" :aria-pressed="kind === k" @click="kind = k">
        {{ t.label }}
      </button>
    </div>
    <pre class="mb-2 overflow-x-auto rounded-md border border-border bg-code px-3 py-2.5 font-mono text-[.8rem] leading-relaxed text-code-foreground">{{ JOINS[kind].sql }}</pre>
    <p :class="workbench.hint" aria-live="polite">
      {{ JOINS[kind].desc }}
    </p>
    <ResultTable :columns="result.columns" :rows="result.rows as any" :highlight="highlightUnmatched" />
  </div>
</template>
