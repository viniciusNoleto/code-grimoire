<script setup lang="ts">
// A página contínua de um framework: todos os tomos e capítulos em sequência,
// com o índice lateral acompanhando a leitura.
import type { SidebarChapter, SidebarTome } from '~/components/Sidebar.vue'

const route = useRoute()
const slug = String(route.params.division)
const { data: tree } = await useTree()
const division = computed(() => tree.value.find(d => d.path === `/${slug}`))
if (!division.value) {
  throw createError({ statusCode: 404, statusMessage: 'Este framework não está no grimório', fatal: true })
}

const { data: docs } = await useAsyncData(`division:${slug}`, () =>
  queryCollection('grimoire').where('path', 'LIKE', `/${slug}/%`).order('stem', 'ASC').all(),
)
const byPath = computed(() => new Map((docs.value ?? []).map(d => [d.path, d])))

const pad = (n: number) => String(n).padStart(2, '0')
const tomes = computed(() => division.value!.tomes.map(t => ({
  id: slugOf(t.path),
  doc: byPath.value.get(t.path)!,
  chapters: t.chapters.map(c => byPath.value.get(c.path)!).filter(Boolean),
})).filter(t => t.doc))

const sidebarTomes = computed<SidebarTome[]>(() => tomes.value.map(t => ({
  id: t.id,
  title: t.doc.title,
  chapters: t.chapters.map((c, i): SidebarChapter => ({
    id: slugOf(c.path), number: pad(i + 1), title: c.nav || c.title, group: c.group || 'Capítulos',
  })),
})))

// id → número exibido na busca do índice ("03" para capítulos, "3.2" para seções)
const numbers = computed(() => {
  const m: Record<string, string> = {}
  for (const t of tomes.value) {
    t.chapters.forEach((c, i) => {
      const chapter = slugOf(c.path)
      m[chapter] = pad(i + 1)
      let j = 0
      const walk = (ls: any[] = []) => ls.forEach((l) => { if (l.depth === 3) m[`${chapter}-${l.id}`] = `${i + 1}.${++j}`; walk(l.children) })
      walk((c.body as any)?.toc?.links)
    })
  }
  return m
})

const hasSql = computed(() => (docs.value ?? []).some(d => JSON.stringify(d.body).includes('line sql')))

// a posição do framework no sumário vira o número do tomo (Tomo I, Tomo II…)
const position = computed(() => tree.value.findIndex(d => d.path === division.value!.path) + 1)
const { open: openSearch } = useSearch()
const { toggle: toggleTheme } = useTheme()

useHead({
  htmlAttrs: {
    'style': `--tome-day:${division.value!.color ?? '#6d5a43'};--tome-night:${division.value!.colorDark ?? division.value!.color ?? '#d9b98a'}`,
    'data-spell': division.value!.spell,
  },
  bodyAttrs: { class: 'bg-desk' },
})
useSeoMeta({ title: division.value!.title, description: division.value!.description })

// capítulo onde a leitura está, para marcar no índice
const active = ref('')
let observers: IntersectionObserver[] = []
onMounted(() => {
  const reading = new IntersectionObserver((es) => {
    for (const e of es) if (e.isIntersecting) active.value = e.target.id
  }, { rootMargin: '-10% 0px -80% 0px' })
  document.querySelectorAll<HTMLElement>('section[data-chapter]').forEach(s => reading.observe(s))
  observers = [reading]
})
onBeforeUnmount(() => observers.forEach(o => o.disconnect()))
</script>

<template>
  <div class="mx-auto grid max-w-[1240px] grid-cols-[264px_minmax(0,1fr)] gap-10 pr-[max(16px,env(safe-area-inset-right))] pb-16 pl-[max(16px,env(safe-area-inset-left))] max-book:grid-cols-[minmax(0,1fr)] max-book:gap-0 max-book:pr-[max(10px,env(safe-area-inset-right))] max-book:pl-[max(10px,env(safe-area-inset-left))]">
    <Sidebar :division="division!" :tomes="sidebarTomes" :active="active" :has-sql="hasSql" :numbers="numbers" />

    <main id="top" class="min-w-0">
      <!-- no celular, a sidebar dá lugar a uma barra curta; capítulos e tomos ficam no marcador
           e a busca fica no rodapé fixo, ao alcance em qualquer ponto da leitura -->
      <div class="hidden items-center gap-1 pt-1 pr-14 max-book:flex">
        <NuxtLink to="/" class="-ml-1 inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-[.9rem] text-muted-foreground no-underline hover:text-foreground">
          <Icon name="lucide:book-open" class="size-[18px]" /> Sumário
        </NuxtLink>
        <button type="button" class="ml-auto grid size-11 place-items-center rounded-md text-muted-foreground hover:bg-tome-soft hover:text-foreground" aria-label="Alternar tema claro e escuro" @click="toggleTheme">
          <Icon name="lucide:moon" class="size-[19px]" />
        </button>
      </div>

      <!-- a folha do livro aberto: lombada à esquerda, papel com grão e páginas empilhadas à direita -->
      <div
        id="content"
        class="paper-grain stacked-pages relative mt-6 mr-2 rounded-[3px_10px_10px_3px] px-[clamp(20px,5vw,64px)] pt-2 pb-18 max-book:mt-0.5 max-book:mr-1.5 max-book:px-4"
      >
        <template v-for="(t, ti) in tomes" :key="t.id">
          <!-- a abertura do tomo, como a de um capítulo de livro -->
          <header :id="t.id" class="pt-12 pb-5 max-book:pt-6">
            <div class="flex items-center gap-4">
              <Glyph :spell="division!.spell" class="size-[clamp(40px,5vw,56px)] shrink-0 text-tome" />
              <p class="m-0 font-book text-[clamp(1.05rem,2vw,1.25rem)] leading-snug text-tome italic">
                Tomo {{ toRoman(position) }}<template v-if="t.doc.version">
                  · {{ t.doc.version }}
                </template>
              </p>
            </div>
            <component
              :is="ti === 0 ? 'h1' : 'h2'"
              class="mt-3 mb-3 font-book text-[clamp(2.1rem,5.4vw,3.5rem)] leading-[1] font-normal tracking-[-.015em] text-balance text-foreground"
            >
              {{ t.doc.title }}
            </component>
            <ContentRenderer :value="t.doc" class="m-0 max-w-[62ch] text-[1.02rem] text-foreground" />
            <!-- fleurão na magia do tomo: separa a abertura dos capítulos -->
            <div class="mt-9 flex items-center gap-3.5" aria-hidden="true">
              <span class="h-px flex-1 bg-border" />
              <span class="ornament block h-4 w-16" />
              <span class="h-px flex-1 bg-border" />
            </div>
          </header>

          <ChapterSection v-for="(c, i) in t.chapters" :key="c.path" :doc="c" :number="i + 1" />

          <footer v-if="t.doc.source" class="mt-14 border-t border-border pt-[18px] text-[.85rem] text-muted-foreground">
            {{ t.doc.source }}
          </footer>
        </template>
      </div>
    </main>
  </div>

  <Bookmark :division="division!" :tomes="sidebarTomes" :active="active" :has-sql="hasSql" />

  <!-- rodapé fixo: busca (no celular) e volta ao topo -->
  <div class="fixed right-[max(12px,env(safe-area-inset-right))] bottom-[calc(12px+env(safe-area-inset-bottom))] z-20 flex gap-1.5">
    <button
      type="button"
      class="hidden min-h-11 items-center gap-1.5 rounded-full border border-border bg-card px-4 text-[.85rem] font-medium text-foreground hover:border-tome max-book:inline-flex"
      @click="openSearch"
    >
      <Icon name="lucide:search" class="size-4" />Buscar
    </button>
    <a
      class="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border bg-card px-4 text-[.85rem] font-medium text-foreground no-underline hover:border-tome"
      href="#top"
    ><Icon name="lucide:arrow-up" class="size-4" />Topo</a>
  </div>
</template>
