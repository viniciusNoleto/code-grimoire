<script setup lang="ts">
// Duas sessões numa linha do tempo: o que cada uma executa e vê em cada nível de isolamento.
type Level = 'rc' | 'rr' | 's'
type PerLevel = string | Record<Level, string>
interface Step { session: 'A' | 'B', sql: PerLevel, output?: PerLevel }
interface Scenario { name: string, steps: Step[], verdict: Record<Level, string> }

const LEVELS: Record<Level, string> = { rc: 'READ COMMITTED', rr: 'REPEATABLE READ', s: 'SERIALIZABLE' }
const SERIALIZATION_ERROR = '✕ ERROR 40001: could not serialize access due to concurrent update'
const SCENARIOS: Record<'nr' | 'lu' | 'ws', Scenario> = {
  nr: {
    name: 'Leitura não repetível',
    steps: [
      { session: 'A', sql: 'BEGIN ISOLATION LEVEL %N;' },
      { session: 'A', sql: 'SELECT saldo FROM contas WHERE id = 1;', output: '→ 100' },
      { session: 'B', sql: 'UPDATE contas SET saldo = 50 WHERE id = 1;\nCOMMIT;', output: '→ UPDATE 1 · COMMIT' },
      { session: 'A', sql: 'SELECT saldo FROM contas WHERE id = 1;', output: { rc: '→ 50 (mudou dentro da mesma transação)', rr: '→ 100 (mesmo snapshot do início)', s: '→ 100 (mesmo snapshot do início)' } },
      { session: 'A', sql: 'COMMIT;' },
    ],
    verdict: {
      rc: 'Em READ COMMITTED cada instrução vê um snapshot novo, então duas leituras na mesma transação podem divergir. Normalmente aceitável; problema em relatórios que fazem várias consultas.',
      rr: 'REPEATABLE READ usa um único snapshot: a transação enxerga o banco "congelado" no momento da primeira consulta.',
      s: 'SERIALIZABLE também usa um único snapshot, e ainda detecta dependências perigosas entre transações.',
    },
  },
  lu: {
    name: 'Lost update',
    steps: [
      { session: 'A', sql: 'BEGIN ISOLATION LEVEL %N;' },
      { session: 'B', sql: 'BEGIN ISOLATION LEVEL %N;' },
      { session: 'A', sql: 'SELECT saldo FROM contas WHERE id = 1;', output: '→ 100' },
      { session: 'B', sql: 'SELECT saldo FROM contas WHERE id = 1;', output: '→ 100' },
      { session: 'A', sql: '-- app calcula 100 - 10\nUPDATE contas SET saldo = 90 WHERE id = 1;', output: '→ UPDATE 1 (trava a linha)' },
      { session: 'B', sql: '-- app calcula 100 - 20\nUPDATE contas SET saldo = 80 WHERE id = 1;', output: '⏳ espera A liberar a linha' },
      { session: 'A', sql: 'COMMIT;' },
      { session: 'B', sql: '(o UPDATE continua)', output: { rc: '→ UPDATE 1: grava 80 por cima', rr: SERIALIZATION_ERROR, s: SERIALIZATION_ERROR } },
      { session: 'B', sql: { rc: 'COMMIT;', rr: 'ROLLBACK; -- a aplicação repete a transação', s: 'ROLLBACK; -- a aplicação repete a transação' }, output: { rc: 'saldo final: 80', rr: 'ao repetir, lê 90 e grava 70', s: 'ao repetir, lê 90 e grava 70' } },
    ],
    verdict: {
      rc: 'Anomalia: o débito de 10 da sessão A sumiu (deveria ser 70). Correção: SET saldo = saldo - 20 (a conta no banco relê o valor atual) ou SELECT ... FOR UPDATE antes de ler.',
      rr: 'Correto: o Postgres percebe que B ia sobrescrever uma mudança que ela não viu e aborta. Exige retry na aplicação.',
      s: 'Correto, com o mesmo comportamento do REPEATABLE READ neste caso. Exige retry na aplicação.',
    },
  },
  ws: {
    name: 'Write skew',
    steps: [
      { session: 'A', sql: 'BEGIN ISOLATION LEVEL %N;' },
      { session: 'B', sql: 'BEGIN ISOLATION LEVEL %N;' },
      { session: 'A', sql: 'SELECT count(*) FROM plantao WHERE ativo;', output: '→ 2 (Ana e Bruno): posso sair' },
      { session: 'B', sql: 'SELECT count(*) FROM plantao WHERE ativo;', output: '→ 2 (Ana e Bruno): posso sair' },
      { session: 'A', sql: 'UPDATE plantao SET ativo = false WHERE medico = \'Ana\';', output: '→ UPDATE 1' },
      { session: 'B', sql: 'UPDATE plantao SET ativo = false WHERE medico = \'Bruno\';', output: '→ UPDATE 1 (outra linha: não espera)' },
      { session: 'A', sql: 'COMMIT;', output: '→ COMMIT' },
      { session: 'B', sql: 'COMMIT;', output: { rc: '→ COMMIT', rr: '→ COMMIT', s: '✕ ERROR 40001: could not serialize access due to read/write dependencies' } },
    ],
    verdict: {
      rc: 'Anomalia: a regra "pelo menos um médico de plantão" foi violada, sem nenhum erro. Cada transação alterou uma linha diferente.',
      rr: 'Mesma anomalia: REPEATABLE READ não detecta conflitos entre o que uma transação leu e o que a outra escreveu.',
      s: 'Correto: o SSI detecta que o resultado não equivale a nenhuma ordem serial e aborta B. Alternativa nos outros níveis: SELECT ... FOR UPDATE nas linhas lidas.',
    },
  },
}

const scenario = ref<keyof typeof SCENARIOS>('lu')
const level = ref<Level>('rc')
const forLevel = (v: PerLevel | undefined) => (v && typeof v === 'object' ? v[level.value] : v)
const steps = computed(() => SCENARIOS[scenario.value].steps.map(p => ({
  session: p.session,
  sql: forLevel(p.sql)!.replace('%N', LEVELS[level.value]),
  output: forLevel(p.output),
})))
const verdict = computed(() => SCENARIOS[scenario.value].verdict[level.value])
const isAnomaly = computed(() => /anomalia/i.test(verdict.value))
const outputClass = (s: string) => (s.includes('✕') ? 'font-semibold text-destructive' : s.includes('⏳') ? 'text-warning' : 'text-ok')
</script>

<template>
  <div>
    <div :class="workbench.buttons" role="group" aria-label="Cenário">
      <button v-for="(c, k) in SCENARIOS" :key="k" type="button" :class="workbench.button(scenario === k)" :aria-pressed="scenario === k" @click="scenario = k">
        {{ c.name }}
      </button>
    </div>
    <div :class="workbench.buttons" role="group" aria-label="Nível de isolamento">
      <button v-for="(n, k) in LEVELS" :key="k" type="button" :class="workbench.button(level === k)" :aria-pressed="level === k" @click="level = k">
        {{ n }}
      </button>
    </div>
    <div class="overflow-x-auto">
      <table class="w-full border-collapse text-[.88rem]">
        <thead>
          <tr>
            <th class="w-8 border-b border-border px-2 py-1.5 text-left text-[.72rem] tracking-widest text-muted-foreground uppercase">
              #
            </th>
            <th class="border-b border-border px-2 py-1.5 text-left text-[.72rem] tracking-widest text-muted-foreground uppercase">
              Sessão A
            </th>
            <th class="border-b border-border px-2 py-1.5 text-left text-[.72rem] tracking-widest text-muted-foreground uppercase">
              Sessão B
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(p, i) in steps" :key="`${scenario}-${i}`">
            <td class="border-b border-border px-2 py-1.5 align-top font-mono text-muted-foreground">
              {{ i + 1 }}
            </td>
            <td v-for="s in (['A', 'B'] as const)" :key="s" class="w-[48%] border-b border-border px-2 py-1.5 align-top">
              <template v-if="p.session === s">
                <code class="block rounded-sm bg-code px-2 py-1.5 font-mono text-[.76rem] whitespace-pre-wrap text-code-foreground">{{ p.sql }}</code>
                <div v-if="p.output" class="mt-1 font-mono text-[.76rem]" :class="outputClass(p.output)">
                  {{ p.output }}
                </div>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="mt-3 mb-0 rounded-lg border-l-3 px-3.5 py-2.5" :class="isAnomaly ? 'border-destructive bg-trap-soft' : 'border-ok bg-tome-soft'" aria-live="polite">
      {{ verdict }}
    </p>
  </div>
</template>
