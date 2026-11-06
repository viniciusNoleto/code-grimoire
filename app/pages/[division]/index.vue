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

// título com a última palavra na cor do framework, como nas artifacts
const titleParts = (t: string) => {
  const i = t.lastIndexOf(' ')
  return i < 0 ? ['', t] : [t.slice(0, i + 1), t.slice(i + 1)]
}

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
  <div class="mx-auto grid max-w-[1240px] grid-cols-[264px_minmax(0,1fr)] gap-10 pr-[max(16px,env(safe-area-inset-right))] pb-16 pl-[max(16px,env(safe-area-inset-left))] max-book:grid-cols-[minmax(0,1fr)] max-book:gap-0">
    <Sidebar :division="division!" :tomes="sidebarTomes" :active="active" :has-sql="hasSql" :numbers="numbers" />

    <main id="top" class="min-w-0">
      <!-- a folha do livro aberto: lombada à esquerda, papel com grão, páginas empilhadas à direita e a fita marcadora -->
      <div
        id="content"
        class="paper-grain stacked-pages relative mt-6 mr-2 origin-left rounded-[3px_10px_10px_3px] px-[clamp(20px,5vw,64px)] pt-2 pb-18 before:ribbon-clip before:absolute before:-top-1.5 before:right-12 before:h-18 before:w-[18px] before:bg-tome before:opacity-90 js:motion-safe:animate-open-page max-book:mt-4 max-book:mr-1.5 max-book:px-[18px] max-book:before:right-6 max-book:before:h-13"
      >
        <template v-for="(t, ti) in tomes" :key="t.id">
          <header :id="t.id" class="pt-14 pb-7 max-book:pt-6">
            <div class="font-mono text-[.74rem] tracking-[.14em] text-tome uppercase">
              {{ division!.title }}<template v-if="t.doc.version">
                · {{ t.doc.version }}
              </template>
            </div>
            <component
              :is="ti === 0 ? 'h1' : 'h2'"
              class="mt-2.5 mb-4 font-display text-[clamp(2.4rem,6vw,3.8rem)] leading-[1.02] font-extrabold tracking-[-.03em] text-balance"
            >
              {{ titleParts(t.doc.title)[0] }}<em class="text-tome not-italic">{{ titleParts(t.doc.title)[1] }}</em>
            </component>
            <ContentRenderer :value="t.doc" class="m-0 max-w-[62ch] text-[1.02rem] text-muted-foreground" />
            <!-- fleurão: separa tomos e capítulos como num livro impresso -->
            <div class="mt-7 flex items-center gap-3.5 before:h-px before:flex-1 before:bg-linear-to-r before:from-transparent before:via-border before:to-transparent after:h-px after:flex-1 after:bg-linear-to-r after:from-transparent after:via-border after:to-transparent" aria-hidden="true">
              <span class="ornament block h-4 w-16" />
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
  <a
    class="fixed right-[max(16px,env(safe-area-inset-right))] bottom-[calc(16px+env(safe-area-inset-bottom))] z-20 rounded-full border border-border bg-card px-[13px] py-[7px] text-[.8rem] font-medium text-foreground no-underline hover:border-tome"
    href="#top"
  ><Icon name="lucide:arrow-up" class="-mt-0.5 mr-1 inline size-3.5 align-middle" />Topo</a>
</template>
