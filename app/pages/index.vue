<script setup lang="ts">
// A página inicial é o livro. Aberto direto em /, começa fechado sobre a mesa:
// a capa de couro com o título em ouro. Ao clicar, a capa gira na lombada (a
// única animação elaborada do site) e surge a primeira folha: a folha de rosto
// e o sumário dos tomos. Chegando de outra página, o livro já está aberto
// (o estado 'book' nasce em app.vue).
import type { Division } from '~/composables/useTree'
import { Button } from '~/components/ui/button'

const { data: tree } = await useTree()
const { open: openSearch } = useSearch()
const { toggle: toggleTheme } = useTheme()
const book = useState<'closed' | 'opening' | 'open'>('book')
const isMac = ref(false)
// a folha só entra com fade quando acabou de ser aberta pela capa
const justOpened = ref(false)

const chapterCount = (d: Division) => d.tomes.reduce((s, t) => s + t.chapters.length, 0)
const total = computed(() => tree.value.reduce((s, d) => s + chapterCount(d), 0))
const colorsOf = (d: Division) => ({ '--tome-day': d.color ?? '#6d5a43', '--tome-night': d.colorDark ?? d.color ?? '#d9b98a' })
const groupsOf = (d: Division) => groupChapters(d.tomes.flatMap(t => t.chapters)).map(g => g.name).join(' · ')

const OPEN_MS = 1050
let timer: ReturnType<typeof setTimeout> | undefined
function openBook() {
  if (book.value !== 'closed') return
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    book.value = 'open'
    return
  }
  book.value = 'opening'
  timer = setTimeout(() => {
    justOpened.value = true
    book.value = 'open'
    scrollTo({ top: 0 })
  }, OPEN_MS)
}
function closeBook() {
  justOpened.value = false
  book.value = 'closed'
  scrollTo({ top: 0 })
}

onMounted(() => { isMac.value = /Mac|iPhone|iPad/.test(navigator.platform) })
// saindo da página inicial, quem voltar encontra o sumário
onBeforeUnmount(() => {
  clearTimeout(timer)
  book.value = 'open'
})

useHead({ bodyAttrs: { class: 'bg-desk' } })
useSeoMeta({
  title: 'Grimório de código',
  description: 'O grimório de código de Vinícius Nolêto: a plataforma web, Vue, React, Nuxt, Next.js, SQL, Laravel e Go estudados por dentro, como referência contínua.',
})
</script>

<template>
  <main id="content">
    <!-- o livro fechado sobre a mesa -->
    <section v-if="book !== 'open'" class="grid min-h-dvh place-items-center overflow-hidden px-4 pt-6 pb-16 perspective-[2200px]" aria-label="Capa">
      <!-- ao abrir, o livro anda meia largura para a direita: o livro aberto fica centrado -->
      <div
        class="relative aspect-[5/7] w-[min(440px,calc(100vw-48px),calc((100dvh-96px)*5/7))] min-w-[240px] transition-transform duration-[1000ms] ease-book transform-3d"
        :class="book === 'opening' ? 'translate-x-1/2' : ''"
      >
        <!-- a primeira folha, embaixo da capa: aparece enquanto a capa gira -->
        <div class="paper-grain absolute inset-0 rounded-[2px_12px_12px_2px] px-[9%] pt-[12%] shadow-[5px_5px_0_-1px_var(--page-edges),9px_9px_0_-2px_var(--fold)]" aria-hidden="true">
          <p class="m-0 font-book text-[clamp(1.6rem,6vw,2.4rem)] leading-none text-foreground">
            Grimório de código
          </p>
          <p class="mt-2 font-book text-[clamp(.9rem,3vw,1.1rem)] text-gold italic">
            de Vinícius Nolêto de Araújo
          </p>
          <p class="mt-[12%] mb-3 font-book text-[clamp(1.2rem,4vw,1.6rem)] text-foreground">
            Sumário
          </p>
          <ul class="m-0 grid list-none gap-2.5 p-0">
            <li v-for="d in tree" :key="d.path" data-tome :style="colorsOf(d)" class="flex items-center gap-2.5 font-book text-[clamp(.95rem,3vw,1.15rem)] text-tome">
              <Glyph :spell="d.spell" class="size-6 shrink-0" />
              {{ d.title }}
            </li>
          </ul>
        </div>

        <!-- a capa: gira na lombada; a frente é o couro, o verso é a guarda -->
        <div
          class="absolute inset-0 origin-left transition-transform duration-[1000ms] ease-book transform-3d"
          :class="book === 'opening' ? '-rotate-y-180' : ''"
        >
          <div class="absolute inset-0 rounded-[4px_14px_14px_4px] bg-leather text-gold backface-hidden">
            <!-- lombada com dois nervos -->
            <span class="absolute inset-y-0 left-0 w-[7%] rounded-l-[4px] bg-black/35" aria-hidden="true" />
            <span class="absolute top-[14%] left-0 h-[2.2%] w-[7%] bg-gold/35" aria-hidden="true" />
            <span class="absolute bottom-[14%] left-0 h-[2.2%] w-[7%] bg-gold/35" aria-hidden="true" />
            <!-- moldura dupla gravada em ouro -->
            <span class="absolute inset-y-[4.5%] right-[5%] left-[12%] rounded-[3px] border-2 border-gold/70" aria-hidden="true" />
            <span class="absolute inset-y-[6.5%] right-[7%] left-[14%] rounded-[2px] border border-gold/45" aria-hidden="true" />

            <div class="absolute inset-y-[9%] right-[10%] left-[17%] flex flex-col items-center justify-center pb-[12%] text-center">
              <Glyph :weight="1.3" class="mb-[8%] aspect-square w-[40%] max-w-[160px]" />
              <h1 class="m-0 font-book text-[clamp(1.9rem,min(8vw,6.6dvh),3.2rem)] leading-[.98] font-normal tracking-[-.01em] text-balance text-gold">
                Grimório de código
              </h1>
              <p class="mt-[5%] mb-0 font-book text-[clamp(1rem,min(3.4vw,2.6dvh),1.3rem)] text-gold/85 italic">
                de Vinícius Nolêto de Araújo
              </p>
              <p class="mt-[7%] mb-0 max-w-[24ch] text-[clamp(.8rem,min(2.9vw,2.1dvh),.95rem)] leading-[1.45] text-gold/80">
                A plataforma web, Vue, React, Nuxt, Next.js, SQL, Laravel e Go, estudados por dentro
              </p>
            </div>
            <!-- a capa inteira é o botão; o texto fica no pé da moldura -->
            <button
              type="button"
              class="group absolute inset-0 flex cursor-pointer items-end justify-center rounded-[inherit] pb-[13%] text-gold focus-visible:outline-offset-8"
              :disabled="book !== 'closed'"
              @click="openBook"
            >
              <span class="inline-flex items-center gap-2 text-[.95rem] font-medium group-hover:underline group-hover:underline-offset-4">
                <Icon name="lucide:book-open" class="size-[18px]" />
                Abrir o livro
              </span>
            </button>
          </div>
          <!-- verso da capa: a guarda de papel dentro do couro -->
          <div class="absolute inset-0 rounded-[14px_4px_4px_14px] bg-leather p-[5%] rotate-y-180 backface-hidden" aria-hidden="true">
            <div class="grid size-full place-items-center rounded-[2px] bg-fold">
              <Sigil class="size-[22%] text-gold/60" />
            </div>
          </div>
        </div>

        <!-- a fita marcadora escapa por baixo -->
        <span class="ribbon-clip absolute right-[22%] -bottom-11 h-14 w-4 bg-ribbon" aria-hidden="true" />
      </div>
    </section>

    <!-- o livro aberto: a primeira folha, no mesmo papel das páginas dos tomos -->
    <div v-else class="mx-auto max-w-[920px] px-[max(10px,env(safe-area-inset-left))] pt-3 pb-12 sm:px-6 sm:pt-6" :class="justOpened && 'motion-safe:animate-page-in'">
      <article class="paper-grain stacked-pages relative mr-2 rounded-[3px_10px_10px_3px] px-[clamp(16px,5vw,56px)] pt-2 pb-[clamp(28px,5vw,56px)] max-sm:mr-1.5">
        <div class="-mx-2 flex items-center justify-between">
          <button type="button" class="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-md px-2 text-[.88rem] text-muted-foreground hover:bg-tome-soft hover:text-foreground" @click="closeBook">
            <Icon name="lucide:book" class="size-[17px]" />
            Fechar o livro
          </button>
          <div class="flex items-center">
            <Button variant="ghost" class="h-10 gap-2 px-2.5 text-[.88rem] font-normal text-muted-foreground hover:bg-tome-soft hover:text-foreground" @click="openSearch">
              <Icon name="lucide:search" class="size-[17px]" />
              Buscar
              <kbd class="max-sm:hidden">{{ isMac ? '⌘' : 'Ctrl' }} K</kbd>
            </Button>
            <Button variant="ghost" size="icon" class="size-10 text-muted-foreground hover:bg-tome-soft hover:text-foreground" aria-label="Alternar tema claro e escuro" @click="toggleTheme">
              <Icon name="lucide:moon" class="size-[18px]" />
            </Button>
          </div>
        </div>

        <!-- folha de rosto -->
        <header class="pt-[clamp(8px,3vw,32px)]">
          <h1 class="m-0 font-book text-[clamp(2.1rem,6vw,3.6rem)] leading-none font-normal tracking-[-.015em] text-foreground">
            Grimório de código
          </h1>
          <p class="mt-1.5 mb-0 font-book text-[clamp(1.05rem,2vw,1.3rem)] text-gold italic">
            de Vinícius Nolêto de Araújo
          </p>
          <p class="mt-3 mb-0 max-w-[60ch] text-[.95rem] leading-[1.55] text-foreground">
            O que eu estudei de cada framework, para ler do começo ao fim ou consultar no meio do trabalho: {{ tree.length }} tomos, {{ total }} capítulos.
          </p>
        </header>

        <!-- sumário: cada tomo numa linha de índice -->
        <section aria-labelledby="contents-title" class="mt-[clamp(16px,3vw,32px)]">
          <div class="flex items-center gap-3">
            <h2 id="contents-title" class="m-0 font-book text-[clamp(1.5rem,3vw,2rem)] leading-none font-normal text-foreground">
              Sumário
            </h2>
            <span class="h-px flex-1 bg-border" aria-hidden="true" />
            <span class="ornament block h-3.5 w-12 [--tome:var(--gold)]" aria-hidden="true" />
          </div>
          <ol class="m-0 mt-2 grid list-none gap-3 p-0 sm:gap-4">
            <li v-for="d in tree" :key="d.path" data-tome :style="colorsOf(d)">
              <NuxtLink
                :to="d.path"
                class="group -mx-2.5 grid grid-cols-[clamp(34px,4.6vw,48px)_minmax(0,1fr)] gap-x-3 rounded-md px-2.5 py-2 text-foreground no-underline hover:bg-tome-soft sm:gap-x-4 sm:py-2.5"
              >
                <Glyph :spell="d.spell" class="mt-0.5 aspect-square w-full text-tome" />
                <span class="min-w-0">
                  <span class="flex items-baseline gap-2">
                    <span class="font-book text-[clamp(1.4rem,2.8vw,1.9rem)] leading-[1.05] text-tome group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">{{ d.title }}</span>
                    <!-- pontilhado do sumário até a contagem de capítulos -->
                    <span class="min-w-4 flex-1 translate-y-[-.25em] border-b-2 border-dotted border-muted-foreground/40" aria-hidden="true" />
                    <span class="shrink-0 text-[.85rem] text-muted-foreground tabular-nums">{{ chapterCount(d) }} cap.</span>
                  </span>
                  <span class="mt-0.5 line-clamp-2 text-[.9rem] leading-[1.45] text-foreground sm:line-clamp-none">{{ d.description }}</span>
                  <span class="mt-0.5 hidden text-[.82rem] leading-[1.45] text-muted-foreground sm:block">{{ groupsOf(d) }}</span>
                </span>
              </NuxtLink>
            </li>
          </ol>
        </section>
      </article>
    </div>
  </main>
</template>
