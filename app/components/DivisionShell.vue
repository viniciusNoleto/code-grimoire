<script setup lang="ts">
// A moldura das páginas de um framework (abertura e capítulos): índice lateral,
// barra curta e marcador no celular, a folha do livro e o rodapé fixo.
// Usa só os metadados da árvore; o corpo vem pelo slot.
import type { SidebarChapter, SidebarTome } from '~/components/Sidebar.vue'
import type { Division } from '~/composables/useTree'

const props = defineProps<{
  division: Division
  /** slug do capítulo aberto ('' na abertura do framework) */
  active?: string
  hasSql?: boolean
}>()

const pad = (n: number) => String(n).padStart(2, '0')
const sidebarTomes = computed<SidebarTome[]>(() => props.division.tomes.map(t => ({
  id: slugOf(t.path),
  title: t.title,
  chapters: t.chapters.map((c, i): SidebarChapter => ({
    id: slugOf(c.path), number: pad(i + 1), title: c.nav || c.title, group: c.group || 'Capítulos',
  })),
})))

const { open: openSearch } = useSearch()
const { toggle: toggleTheme } = useTheme()

useHead({
  htmlAttrs: {
    'style': () => `--tome-day:${props.division.color ?? '#6d5a43'};--tome-night:${props.division.colorDark ?? props.division.color ?? '#d9b98a'}`,
    'data-spell': () => props.division.spell,
  },
  bodyAttrs: { class: 'bg-desk' },
})
</script>

<template>
  <div class="mx-auto grid max-w-[1240px] grid-cols-[264px_minmax(0,1fr)] gap-10 pr-[max(16px,env(safe-area-inset-right))] pb-16 pl-[max(16px,env(safe-area-inset-left))] max-book:grid-cols-[minmax(0,1fr)] max-book:gap-0 max-book:pr-[max(10px,env(safe-area-inset-right))] max-book:pl-[max(10px,env(safe-area-inset-left))]">
    <Sidebar :division="division" :tomes="sidebarTomes" :active="active ?? ''" :has-sql="hasSql ?? false" />

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
        <slot />
      </div>
    </main>
  </div>

  <Bookmark :division="division" :tomes="sidebarTomes" :active="active ?? ''" :has-sql="hasSql ?? false" />

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
