<script setup lang="ts">
// Trigramas e similarity() calculados com as mesmas regras do pg_trgm.
const textA = ref('Joao da Silva')
const textB = ref('joão silva')

function trigrams(s: string) {
  const set = new Set<string>()
  for (const word of s.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []) {
    const p = `  ${word} `   // dois espaços antes e um depois, como o pg_trgm
    for (let i = 0; i + 3 <= p.length; i++) set.add(p.slice(i, i + 3))
  }
  return [...set].sort()
}
const ta = computed(() => trigrams(textA.value))
const tb = computed(() => trigrams(textB.value))
const sa = computed(() => new Set(ta.value))
const sb = computed(() => new Set(tb.value))
const shared = computed(() => ta.value.filter(t => sb.value.has(t)).length)
const total = computed(() => new Set([...ta.value, ...tb.value]).size)
const similarity = computed(() => (total.value ? shared.value / total.value : 0))
const display = (t: string) => (/\s/.test(t) ? `"${t}"` : t)
const inputClass = 'w-full rounded-b-lg border-0 bg-card px-2.5 py-2 font-mono text-[.95rem] text-foreground'
const chip = (isShared: boolean) => [
  'rounded-sm border px-1.5 py-px font-mono text-[.74rem] whitespace-pre',
  isShared ? 'border-tome bg-tome-soft font-semibold text-tome' : 'border-border bg-code text-muted-foreground',
]
</script>

<template>
  <div>
    <div :class="workbench.columns">
      <div :class="workbench.panel">
        <label for="tg-a" :class="workbench.panelTitle">Texto A</label>
        <input id="tg-a" v-model="textA" :class="inputClass" autocomplete="off">
      </div>
      <div :class="workbench.panel">
        <label for="tg-b" :class="workbench.panelTitle">Texto B</label>
        <input id="tg-b" v-model="textB" :class="inputClass" autocomplete="off">
      </div>
    </div>
    <dl :class="workbench.meters" class="mt-3">
      <div :class="workbench.meter">
        <dt :class="workbench.meterLabel">
          Em comum
        </dt><dd :class="workbench.meterValue">
          {{ shared }}
        </dd>
      </div>
      <div :class="workbench.meter">
        <dt :class="workbench.meterLabel">
          Total distinto
        </dt><dd :class="workbench.meterValue">
          {{ total }}
        </dd>
      </div>
      <div :class="workbench.meter">
        <dt :class="workbench.meterLabel">
          similarity()
        </dt><dd :class="workbench.meterValue">
          {{ similarity.toFixed(4).replace('.', ',') }}
        </dd>
      </div>
      <div :class="workbench.meter">
        <dt :class="workbench.meterLabel">
          A % B (limiar 0,3)
        </dt><dd :class="workbench.meterValue" class="data-[false]:text-destructive" :data-false="similarity < 0.3 || undefined">
          {{ similarity >= 0.3 }}
        </dd>
      </div>
    </dl>
    <div :class="workbench.columns" class="mt-3">
      <div :class="workbench.panel">
        <h4 :class="workbench.panelTitle">
          show_trgm(A)
        </h4>
        <div class="flex flex-wrap gap-1.5 p-2.5">
          <span v-for="t in ta" :key="t" :class="chip(sb.has(t))">{{ display(t) }}</span>
        </div>
      </div>
      <div :class="workbench.panel">
        <h4 :class="workbench.panelTitle">
          show_trgm(B)
        </h4>
        <div class="flex flex-wrap gap-1.5 p-2.5">
          <span v-for="t in tb" :key="t" :class="chip(sa.has(t))">{{ display(t) }}</span>
        </div>
      </div>
    </div>
    <p :class="workbench.hint" class="mt-2.5 mb-0">
      Repare em "João" contra "Joao": o acento gera trigramas diferentes. Por isso, na prática, combine com <code>unaccent</code>.
    </p>
  </div>
</template>
