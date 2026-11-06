<script setup lang="ts">
// Cada regra de routeRules, requisição por requisição, com um relógio de mentira.
type Kind = 'prerender' | 'cache' | 'ssr' | 'spa' | 'redirect'
interface Route { id: string, path: string, rule: string, kind: Kind, ttl?: number, where?: string, desc: string }
interface LogLine { k: number, t: number, text: string, tone?: 'server' | 'warning' }
const TONE_CLASS = { server: 'text-tome', warning: 'text-client' }

const routes: Route[] = [
  { id: 'home', path: '/', rule: 'prerender: true', kind: 'prerender', desc: 'Gerada no build. Toda requisição recebe o mesmo arquivo estático, sem executar o servidor.' },
  { id: 'blog', path: '/blog/ola-nuxt', rule: 'isr (60 min)', kind: 'cache', ttl: 60, where: 'CDN', desc: 'Cache na CDN da plataforma. Depois que expira, serve a versão antiga e regenera em segundo plano. Um deploy invalida.' },
  { id: 'prod', path: '/produtos/42', rule: 'swr (10 min)', kind: 'cache', ttl: 10, where: 'Nitro', desc: 'Cache no servidor Nitro, com a mesma lógica stale-while-revalidate.' },
  { id: 'account', path: '/conta', rule: 'sem regra (SSR)', kind: 'ssr', desc: 'Renderizada no servidor a cada requisição.' },
  { id: 'dashboard', path: '/painel', rule: 'ssr: false', kind: 'spa', desc: 'O servidor devolve só a casca HTML; o app renderiza e busca os dados no navegador.' },
  { id: 'legacy', path: '/antigo/x', rule: 'redirect: \'/novo/**\'', kind: 'redirect', desc: 'Responde com redirecionamento, sem renderizar nada.' },
]

const current = ref<Route>(routes[1]!)
const clock = ref(0)
const lines = ref<LogLine[]>([])
let deploy = 1, seq = 0
const cache: Record<string, { at: number }> = {}

function record(text: string, tone?: LogLine['tone']) {
  lines.value = [{ k: ++seq, t: clock.value, text, tone }, ...lines.value].slice(0, 30)
}

function request() {
  const r = current.value
  const p = `GET ${r.path} → `
  if (r.kind === 'prerender') record(`${p}200 · arquivo gerado no build do deploy #${deploy}. O servidor não executa.`)
  else if (r.kind === 'ssr') record(`${p}200 · renderizada no servidor agora (HTML novo, dados atuais).`, 'server')
  else if (r.kind === 'spa') record(`${p}200 · casca HTML vazia. O navegador baixa o JS, renderiza e chama /api.`)
  else if (r.kind === 'redirect') record(`${p}307 · Location: /novo/x`)
  else {
    const c = cache[r.id]
    if (!c) {
      cache[r.id] = { at: clock.value }
      record(`${p}MISS no cache (${r.where}) · renderiza no servidor e guarda.`, 'server')
    }
    else {
      const age = clock.value - c.at
      if (age < r.ttl!) record(`${p}HIT · versão de ${age} min atrás, sem renderizar.`)
      else {
        record(`${p}STALE · entrega a versão de ${age} min atrás e regenera em segundo plano.`, 'warning')
        cache[r.id] = { at: clock.value }
        record('regeneração concluída: o próximo acesso recebe a versão nova.', 'server')
      }
    }
  }
}

function newDeploy() {
  deploy++
  Object.keys(cache).forEach(k => delete cache[k])
  record(`novo deploy #${deploy}: páginas pré-renderizadas geradas de novo, caches invalidados (no Nitro, depende do storage configurado).`, 'warning')
}

// estado inicial de exemplo: um MISS e, cinco minutos depois, um HIT
request()
clock.value = 5
request()
</script>

<template>
  <div>
    <div :class="workbench.buttons" role="group" aria-label="Rotas">
      <Button v-for="r in routes" :key="r.id" type="button" size="sm" class="font-mono text-[.8rem]" :variant="r === current ? 'default' : 'outline'" :aria-pressed="r === current" @click="current = r">
        {{ r.path }}
      </Button>
    </div>
    <div :class="workbench.buttons">
      <Button type="button" size="sm" @click="request">
        Requisitar
      </Button>
      <Button type="button" size="sm" variant="outline" @click="clock += 5">
        +5 min
      </Button>
      <Button type="button" size="sm" variant="outline" @click="clock += 30">
        +30 min
      </Button>
      <Button type="button" size="sm" variant="outline" @click="newDeploy">
        Novo deploy
      </Button>
      <span :class="workbench.status">relógio: <b>{{ clock }} min</b></span>
    </div>
    <p :class="workbench.hint">
      <code>{{ current.path }}</code> · <code>{{ current.rule }}</code> · {{ current.desc }}
    </p>
    <div class="h-55 overflow-auto rounded-lg border border-border bg-code px-3 py-2.5 font-mono text-[.78rem] leading-normal text-code-foreground" aria-live="polite">
      <div v-for="l in lines" :key="l.k" :class="[workbench.event, l.tone && TONE_CLASS[l.tone]]">
        <b class="text-tome">t={{ l.t }} min </b>{{ l.text }}
      </div>
    </div>
  </div>
</template>
