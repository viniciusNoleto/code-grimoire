<script setup lang="ts">
// A matriz oficial de conflitos entre os oito modos de lock de tabela do PostgreSQL.
const MODES = ['ACCESS SHARE', 'ROW SHARE', 'ROW EXCLUSIVE', 'SHARE UPDATE EXCLUSIVE', 'SHARE', 'SHARE ROW EXCLUSIVE', 'EXCLUSIVE', 'ACCESS EXCLUSIVE']
const SHORT = ['AS', 'RS', 'RE', 'SUE', 'S', 'SRE', 'E', 'AE']
const CONFLICTS = [[7], [6, 7], [4, 5, 6, 7], [3, 4, 5, 6, 7], [2, 3, 5, 6, 7], [2, 3, 4, 5, 6, 7], [1, 2, 3, 4, 5, 6, 7], [0, 1, 2, 3, 4, 5, 6, 7]]
const COMMANDS: [string, number][] = [
  ['SELECT', 0], ['SELECT … FOR UPDATE', 1], ['INSERT / UPDATE / DELETE', 2], ['VACUUM (comum) / ANALYZE', 3],
  ['CREATE INDEX CONCURRENTLY', 3], ['CREATE INDEX', 4], ['CREATE TRIGGER / ADD FOREIGN KEY', 5],
  ['REFRESH MATERIALIZED VIEW CONCURRENTLY', 6], ['ALTER TABLE … ADD COLUMN', 7], ['TRUNCATE / DROP TABLE', 7], ['VACUUM FULL', 7],
]
const a = ref(0)
const b = ref(8)
const ma = computed(() => COMMANDS[a.value]![1])
const mb = computed(() => COMMANDS[b.value]![1])
const conflicts = computed(() => CONFLICTS[ma.value]!.includes(mb.value))

const verdict = computed(() => {
  let t = `A segura ${MODES[ma.value]}; B pede ${MODES[mb.value]}. `
  t += conflicts.value ? 'Conflito: B espera até a transação de A terminar.' : 'Compatíveis: B segue sem esperar.'
  if (ma.value === 2 && mb.value === 2) t += ' No nível da tabela não há conflito, mas se as duas alterarem a mesma linha, B espera pelo lock da linha.'
  if (ma.value === 3 && mb.value === 3) t += ' Por isso um autovacuum e um CREATE INDEX CONCURRENTLY na mesma tabela não rodam ao mesmo tempo.'
  if (conflicts.value && mb.value === 7) t += ' Pior: enquanto B espera na fila, todo comando novo que conflite com ACCESS EXCLUSIVE (até um SELECT) entra atrás dele. Use lock_timeout.'
  if (ma.value === 7 && mb.value === 0) t += ' Nem leituras passam enquanto o ALTER/TRUNCATE/VACUUM FULL estiver rodando.'
  return t
})
const selectClass = 'w-full rounded-b-lg border-0 bg-card px-3 py-2 font-sans text-[.88rem] text-foreground'
</script>

<template>
  <div>
    <div :class="workbench.columns">
      <div :class="workbench.panel">
        <label for="lk-a" :class="workbench.panelTitle">Sessão A (já segura)</label>
        <select id="lk-a" v-model.number="a" :class="selectClass">
          <option v-for="([name], i) in COMMANDS" :key="i" :value="i">
            {{ name }}
          </option>
        </select>
      </div>
      <div :class="workbench.panel">
        <label for="lk-b" :class="workbench.panelTitle">Sessão B (pede)</label>
        <select id="lk-b" v-model.number="b" :class="selectClass">
          <option v-for="([name], i) in COMMANDS" :key="i" :value="i">
            {{ name }}
          </option>
        </select>
      </div>
    </div>
    <p class="mt-3 mb-0 rounded-lg border-l-3 px-3.5 py-2.5" :class="conflicts ? 'border-destructive bg-trap-soft' : 'border-ok bg-tome-soft'" aria-live="polite">
      {{ verdict }}
    </p>
    <div class="mt-3 overflow-x-auto">
      <table class="border-collapse font-mono text-[.74rem]">
        <tr>
          <th class="px-2 py-1 text-center text-muted-foreground">
            A \ B
          </th>
          <th v-for="(s, j) in SHORT" :key="s" :title="MODES[j]" class="px-2 py-1 text-center" :class="j === mb ? 'text-tome' : 'text-muted-foreground'">
            {{ s }}
          </th>
        </tr>
        <tr v-for="(name, i) in MODES" :key="name">
          <th :title="name" class="px-2 py-1 text-center" :class="i === ma ? 'text-tome' : 'text-muted-foreground'">
            {{ SHORT[i] }}
          </th>
          <td
            v-for="(_, j) in MODES"
            :key="j"
            class="px-2 py-1 text-center"
            :class="[CONFLICTS[i]!.includes(j) ? 'text-destructive' : 'text-muted-foreground', i === ma && j === mb && 'bg-tome-soft font-bold outline-2 -outline-offset-2 outline-tome']"
          >
            {{ CONFLICTS[i]!.includes(j) ? '✕' : '·' }}
          </td>
        </tr>
      </table>
    </div>
  </div>
</template>
