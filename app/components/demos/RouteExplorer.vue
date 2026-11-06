<script setup lang="ts">
// Quais arquivos o App Router empilha para cada URL, de fora para dentro.
import type { VNode } from 'vue'

type Kind = 'layout' | 'boundary' | 'page' | 'route'
interface Layer { kind: Kind, label: string, file: string, note?: string }
const C = (kind: Kind, label: string, file: string, note = ''): Layer => ({ kind, label, file, note })

const routes: Record<string, Layer[]> = {
  '/': [C('layout', 'Layout raiz', 'app/layout.tsx', '<html> e <body>. Obrigatório. Envolve todas as rotas.'), C('page', 'Página', 'app/page.tsx', 'Sem params.')],
  '/sobre': [C('layout', 'Layout raiz', 'app/layout.tsx'), C('page', 'Página', 'app/(marketing)/sobre/page.tsx', 'O grupo (marketing) organiza arquivos mas não aparece na URL.')],
  '/produtos': [C('layout', 'Layout raiz', 'app/layout.tsx'), C('layout', 'Layout do grupo', 'app/(loja)/layout.tsx', 'Carrinho e menu da loja. Preservado ao navegar entre produtos.'), C('boundary', 'Suspense', 'app/(loja)/produtos/loading.tsx', 'Fallback enquanto a página e os segmentos abaixo carregam.'), C('page', 'Página', 'app/(loja)/produtos/page.tsx', 'searchParams disponível (ex.: ?ordem=preco).')],
  '/produtos/teclado-mx': [C('layout', 'Layout raiz', 'app/layout.tsx'), C('layout', 'Layout do grupo', 'app/(loja)/layout.tsx', 'Continua montado vindo de /produtos: o estado do carrinho não se perde.'), C('boundary', 'Suspense', 'app/(loja)/produtos/loading.tsx', 'O loading do segmento pai também cobre [slug].'), C('boundary', 'Error boundary', 'app/(loja)/produtos/[slug]/error.tsx', 'Captura erros só desta página. Client Component.'), C('page', 'Página', 'app/(loja)/produtos/[slug]/page.tsx', 'params = Promise<{ slug: "teclado-mx" }>')],
  '/blog/2026/11/cache': [C('layout', 'Layout raiz', 'app/layout.tsx'), C('page', 'Página', 'app/blog/[...slug]/page.tsx', 'params = Promise<{ slug: ["2026", "11", "cache"] }>')],
  '/dashboard': [C('layout', 'Layout raiz', 'app/layout.tsx'), C('layout', 'Layout com slots', 'app/dashboard/layout.tsx', 'Recebe children, analytics e equipe como props e decide onde renderizar cada um.'), C('page', 'children', 'app/dashboard/page.tsx', 'Conteúdo principal.'), C('page', '@analytics', 'app/dashboard/@analytics/page.tsx', 'Slot paralelo: carrega e falha de forma independente.'), C('page', '@equipe', 'app/dashboard/@equipe/page.tsx', 'Precisa de default.tsx para rotas filhas sem correspondente no slot.')],
  '/api/stream': [C('route', 'Route Handler', 'app/api/stream/route.ts', 'Sem layouts, sem React. Exporta GET e devolve um Response (aqui, um stream SSE).')],
}
const urls = Object.keys(routes)
const current = ref('/produtos/teclado-mx')

const STYLE: Record<Kind, string> = {
  layout: 'border-tome bg-card',
  boundary: 'border-dashed border-border bg-card',
  page: 'border-tome bg-tome-soft',
  route: 'border-client bg-client-soft',
}

// layouts e boundaries envolvem o que vem depois; páginas (e slots paralelos) ficam lado a lado
function build(layers: Layer[]): VNode[] {
  const [c, ...rest] = layers
  if (!c) return []
  const header = h('div', { class: 'flex flex-wrap items-baseline gap-x-2.5 gap-y-1.5 text-[.85rem]' }, [
    h('span', { class: 'font-mono text-[.7rem] tracking-[.08em] text-muted-foreground uppercase' }, c.label),
    h('span', { class: 'font-mono text-[.8rem] font-semibold break-all' }, c.file),
    c.note ? h('span', { class: 'w-full text-[.82rem] text-muted-foreground' }, c.note) : null,
  ])
  const box = `mt-2 min-w-0 rounded-lg border px-2.5 pt-2 pb-2.5 ${STYLE[c.kind]}`
  if (c.kind === 'page' || c.kind === 'route') return [h('div', { class: box }, [header]), ...build(rest)]
  return [h('div', { class: box }, [header, ...build(rest)])]
}
const Layers = () => build(routes[current.value]!)
</script>

<template>
  <div>
    <div :class="workbench.buttons" role="group" aria-label="URLs">
      <Button v-for="u in urls" :key="u" type="button" size="sm" class="font-mono text-[.8rem]" :variant="u === current ? 'default' : 'outline'" :aria-pressed="u === current" @click="current = u">
        {{ u }}
      </Button>
    </div>
    <div class="overflow-x-auto">
      <Layers />
    </div>
  </div>
</template>
