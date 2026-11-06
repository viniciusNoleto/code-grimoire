<script setup lang="ts">
// O que o navegador faz com cada política de Cache-Control, com um relógio simulado.
type Policy = 'ma' | 'nc' | 'ns' | 'swr' | 'imm'
const POLICIES: Record<Policy, { label: string, header: string }> = {
  ma: { label: 'max-age=60', header: 'Cache-Control: max-age=60\nETag: "{v}"' },
  nc: { label: 'no-cache', header: 'Cache-Control: no-cache\nETag: "{v}"' },
  ns: { label: 'no-store', header: 'Cache-Control: no-store' },
  swr: { label: 'max-age=60, swr=300', header: 'Cache-Control: max-age=60, stale-while-revalidate=300\nETag: "{v}"' },
  imm: { label: 'immutable (hash)', header: 'GET /assets/app.4f9e1c.js\nCache-Control: public, max-age=31536000, immutable' },
}
interface LogLine { k: number, t: string, txt: string, tone?: 'server' | 'warning' }

const policy = ref<Policy>('ma')
const clock = ref(0)
const version = ref(1)
const cache = ref<{ at: number, v: number } | null>(null)
const log = ref<LogLine[]>([])
let seq = 0

const fmt = (s: number) => (s < 60 ? `${s} s` : `${(s / 60).toFixed(s % 60 ? 1 : 0)} min`)
const header = computed(() => POLICIES[policy.value].header.replace('{v}', `v${cache.value?.v ?? version.value}`))

function add(txt: string, tone?: LogLine['tone']) {
  log.value = [{ k: ++seq, t: fmt(clock.value), txt, tone }, ...log.value].slice(0, 30)
}
function fullResponse(reason: string) {
  cache.value = { at: clock.value, v: version.value }
  add(`200 OK · ${reason} · baixou o corpo inteiro (v${version.value}).`, 'server')
}
function conditional() {
  if (cache.value!.v === version.value) {
    cache.value!.at = clock.value
    add(`→ If-None-Match: "v${cache.value!.v}"  ← 304 Not Modified · só cabeçalhos; reusa a cópia.`, 'server')
  }
  else fullResponse('If-None-Match não bate: o conteúdo mudou')
}
function request() {
  if (policy.value === 'ns') return add('200 OK · no-store: nada foi guardado, baixa tudo sempre.', 'server')
  if (!cache.value) return fullResponse('primeira requisição')
  const age = clock.value - cache.value.at
  if (policy.value === 'imm') return add('do cache (memória/disco) · nenhuma requisição. Versão nova = URL nova com outro hash.')
  if (policy.value === 'nc') { add(`no-cache: revalida antes de usar (idade ${fmt(age)})`); return conditional() }
  if (age < 60) return add(`do cache · fresco (idade ${fmt(age)} < 60 s) · nenhuma requisição.`)
  if (policy.value === 'swr' && age < 360) {
    add(`serve a cópia velha na hora (v${cache.value.v}, idade ${fmt(age)}) e revalida em segundo plano…`, 'warning')
    return conditional()
  }
  add(`expirado (idade ${fmt(age)}) · revalida antes de mostrar`)
  conditional()
}
function switchPolicy(p: Policy) {
  policy.value = p
  cache.value = null
  add(`política trocada para "${POLICIES[p].label}"; cache do navegador vazio.`, 'warning')
}
function publish() {
  version.value++
  add(`o servidor publicou v${version.value}.`, 'warning')
}

request()
clock.value = 30
request()
</script>

<template>
  <div>
    <div :class="workbench.buttons" role="group" aria-label="Política de cache">
      <button
        v-for="(p, k) in POLICIES"
        :key="k"
        type="button"
        :class="workbench.button(policy === k)"
        :aria-pressed="policy === k"
        @click="switchPolicy(k)"
      >
        {{ p.label }}
      </button>
    </div>
    <pre class="mb-3.5 overflow-x-auto rounded-md border border-border bg-code px-3 py-2.5 font-mono text-[.8rem] leading-relaxed text-code-foreground">{{ header }}</pre>
    <div :class="workbench.buttons">
      <Button type="button" size="sm" @click="request">
        Requisitar
      </Button>
      <button type="button" :class="workbench.button()" @click="clock += 30">
        +30 s
      </button>
      <button type="button" :class="workbench.button()" @click="clock += 300">
        +5 min
      </button>
      <button type="button" :class="workbench.button()" @click="publish">
        Publicar nova versão
      </button>
      <span :class="workbench.status">relógio: <b>{{ fmt(clock) }}</b> · no servidor: <b>v{{ version }}</b></span>
    </div>
    <div class="h-56 overflow-auto rounded-lg border border-border bg-code px-3 py-2.5 font-mono text-[.78rem] leading-normal text-code-foreground" aria-live="polite">
      <div v-for="l in log" :key="l.k" :class="[workbench.event, l.tone === 'server' && 'text-sql', l.tone === 'warning' && 'text-tome']">
        <b>t={{ l.t }}</b> {{ l.txt }}
      </div>
    </div>
  </div>
</template>
