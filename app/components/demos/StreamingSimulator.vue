<script setup lang="ts">
// O que o usuário vê, e quando: sem Suspense, com streaming e com a casca estática do PPR.
type Mode = 'block' | 'stream' | 'ppr'
type Milestone = 'ttfb' | 'shell' | 'price' | 'recs' | 'reviews'
const modes: Record<Mode, { label: string, t: Record<Milestone, number>, desc: string }> = {
  block: { label: 'Sem Suspense', t: { ttfb: 1680, shell: 1680, price: 1680, recs: 1680, reviews: 1680 }, desc: 'O servidor espera o componente mais lento (avaliações, 1600 ms) antes de mandar qualquer byte. A tela fica em branco até lá.' },
  stream: { label: 'Suspense + streaming', t: { ttfb: 140, shell: 140, price: 340, recs: 940, reviews: 1640 }, desc: 'A casca é renderizada na requisição e enviada logo. Cada Suspense chega pelo mesmo response quando fica pronto.' },
  ppr: { label: 'PPR (casca estática)', t: { ttfb: 35, shell: 35, price: 340, recs: 940, reviews: 1640 }, desc: 'A casca veio do build (\'use cache\') e sai da CDN quase instantaneamente. Só os buracos dinâmicos rodam no servidor.' },
}
const regions = [
  { r: 'shell', label: 'Cabeçalho + info do produto', text: 'Teclado MX · layout ABNT2' },
  { r: 'price', label: '<Preco /> · por usuário', text: 'R$ 489,90 · frete grátis para Boa Vista' },
  { r: 'recs', label: '<Recomendacoes />', text: 'Mouse MX · Apoio de pulso · Cabo USB-C' },
  { r: 'reviews', label: '<Avaliacoes />', text: '4,7 de 5 · 312 avaliações' },
] as const
const milestones: [Milestone, string][] = [['ttfb', 'Primeiro byte'], ['shell', 'Casca'], ['price', 'Preço'], ['recs', 'Recomendações'], ['reviews', 'Avaliações']]
const MAX = 1700
const STATE_CLASS = {
  blank: 'border-dashed border-border bg-transparent text-transparent',
  // a "linha" cinza do esqueleto, no lugar do texto
  skel: 'border-border text-transparent bg-[linear-gradient(90deg,var(--border)_0_40%,transparent_40%_100%)] bg-size-[100%_8px] bg-position-[10px_26px] bg-no-repeat',
  ready: 'border-ok bg-card',
}

const mode = ref<Mode>('block')
const clock = ref(modes.block.t.reviews)
const arrived = reactive<Partial<Record<Milestone, number>>>({ ...modes.block.t })
const regionState = reactive<Record<string, 'blank' | 'skel' | 'ready'>>({ shell: 'ready', price: 'ready', recs: 'ready', reviews: 'ready' })
const description = ref(`${modes.block.desc} Clique em um modo para ver a sequência.`)

let timers: ReturnType<typeof setTimeout>[] = []
let raf = 0
function stop() { timers.forEach(clearTimeout); timers = []; cancelAnimationFrame(raf) }
function run() {
  stop()
  const m = modes[mode.value]
  description.value = m.desc
  for (const [k] of milestones) delete arrived[k]
  for (const { r } of regions) regionState[r] = 'blank'
  const t0 = performance.now()
  const tick = () => { clock.value = Math.min(MAX, Math.round(performance.now() - t0)); if (clock.value < MAX) raf = requestAnimationFrame(tick) }
  tick()
  timers.push(setTimeout(() => { arrived.ttfb = m.t.ttfb }, m.t.ttfb))
  timers.push(setTimeout(() => {
    arrived.shell = m.t.shell
    for (const { r } of regions) regionState[r] = r === 'shell' || mode.value === 'block' ? 'ready' : 'skel'
  }, m.t.shell))
  for (const r of ['price', 'recs', 'reviews'] as const) {
    timers.push(setTimeout(() => { arrived[r] = m.t[r]; regionState[r] = 'ready' }, m.t[r]))
  }
}
function choose(m: Mode) { mode.value = m; run() }
onBeforeUnmount(stop)
</script>

<template>
  <div>
    <div :class="workbench.buttons" role="group" aria-label="Modo de renderização">
      <Button v-for="(m, k) in modes" :key="k" type="button" size="sm" :variant="mode === k ? 'default' : 'outline'" :aria-pressed="mode === k" @click="choose(k)">
        {{ m.label }}
      </Button>
    </div>
    <div class="grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-3.5 max-sm:grid-cols-[minmax(0,1fr)]">
      <div class="grid min-w-0 content-start gap-2 rounded-lg border border-border bg-paper p-2.5">
        <div
          v-for="g in regions"
          :key="g.r"
          class="min-h-11 rounded-md border px-2.5 py-2 text-[.85rem] transition-[border-color,background-color] duration-200"
          :class="STATE_CLASS[regionState[g.r]!]"
        >
          <span class="block font-mono text-[.7rem] text-muted-foreground">{{ g.label }}</span>{{ g.text }}
        </div>
      </div>
      <div class="grid min-w-0 content-start gap-1.5">
        <div>
          <span class="text-[.85rem] text-muted-foreground">tempo desde o clique</span>
          <div class="font-mono text-[1.4rem] font-semibold tabular-nums">
            {{ clock }} ms
          </div>
        </div>
        <div v-for="[k, label] in milestones" :key="k" class="grid grid-cols-[110px_minmax(0,1fr)_56px] items-center gap-2 text-[.82rem] max-sm:grid-cols-[90px_minmax(0,1fr)_52px]">
          <span>{{ label }}</span>
          <div class="relative h-2.5 overflow-hidden rounded-[5px] bg-border">
            <i class="absolute inset-y-0 left-0 rounded-[5px] bg-tome" :style="{ width: arrived[k] != null ? `${Math.min(100, arrived[k]! / MAX * 100)}%` : '0' }" />
          </div>
          <b class="text-right font-mono text-[.78rem] tabular-nums">{{ arrived[k] != null ? `${arrived[k]} ms` : '–' }}</b>
        </div>
        <div>
          <Button type="button" size="sm" variant="outline" @click="run">
            Rodar de novo
          </Button>
        </div>
        <p class="m-0 text-[.85rem] text-muted-foreground">
          {{ description }}
        </p>
      </div>
    </div>
  </div>
</template>
