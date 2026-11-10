<script setup lang="ts">
// O marcador: a fita presa no alto da folha, só em telas estreitas (nas largas
// o índice lateral fica sempre à vista). Abre, pela esquerda, um painel com os
// capítulos do tomo (marcando o capítulo aberto) e os outros tomos.
import type { SidebarChapter, SidebarTome } from '~/components/Sidebar.vue'
import type { Division } from '~/composables/useTree'
import { Button } from '~/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '~/components/ui/sheet'
import { Switch } from '~/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'

const props = defineProps<{
  division: Division
  tomes: SidebarTome[]
  active: string
  hasSql: boolean
}>()

const { data: tree } = useTree()
const { open: openSearch } = useSearch()
const { isVisible: sqlVisible, toggle: toggleSql } = useSql()

const isOpen = ref(false)
const tab = ref('chapters')
const list = ref<HTMLElement>()

const position = computed(() => tree.value.findIndex(d => d.path === props.division.path) + 1)
const chapterCount = (d: Division) => d.tomes.reduce((s, t) => s + t.chapters.length, 0)
const colorsOf = (d: Division) => ({ '--tome-day': d.color ?? '#6d5a43', '--tome-night': d.colorDark ?? d.color ?? '#d9b98a' })
const groupsOf = (chapters: SidebarChapter[]) => groupChapters(chapters)

// ao abrir, o capítulo em leitura aparece no meio da lista
watch(isOpen, async (open) => {
  if (!open) return
  tab.value = 'chapters'
  await nextTick()
  list.value?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: 'center' })
})

// cada capítulo é uma página: fecha o painel e navega
function goTo(id: string) {
  isOpen.value = false
  navigateTo(`${props.division.path}/${id}`)
}
function search() {
  isOpen.value = false
  nextTick(openSearch)
}
</script>

<template>
  <Sheet v-model:open="isOpen">
    <!-- a fita: o botão é retangular (para o contorno de foco aparecer) e o desenho é recortado -->
    <SheetTrigger
      class="fixed top-0 right-[calc(max(10px,env(safe-area-inset-right))+16px)] z-30 hidden h-14 w-10 cursor-pointer outline-offset-2 max-book:block"
      :title="`Capítulos de ${division.title} e os outros tomos`"
    >
      <span class="ribbon-clip absolute inset-0 grid place-items-start justify-center bg-tome pt-3.5 text-background">
        <Icon name="lucide:list" class="size-5" />
      </span>
      <span class="sr-only">Marcador: capítulos e tomos</span>
    </SheetTrigger>

    <SheetContent
      side="left"
      class="paper-grain w-[min(380px,calc(100vw-48px))] gap-0 border-r-0 p-0 sm:max-w-none"
    >
      <div class="flex items-center gap-3 px-4 pt-4 pr-12 pb-3">
        <Glyph :spell="division.spell" class="size-10 shrink-0 text-tome" />
        <div class="min-w-0">
          <p class="m-0 font-book text-[.92rem] leading-tight text-tome italic">
            Tomo {{ toRoman(position) }}
          </p>
          <SheetTitle class="m-0 font-book text-[1.45rem] leading-[1.05] font-normal text-foreground">
            {{ division.title }}
          </SheetTitle>
        </div>
        <SheetDescription class="sr-only">
          Escolha um capítulo deste tomo ou abra outro tomo do grimório.
        </SheetDescription>
      </div>

      <Tabs v-model="tab" class="flex min-h-0 flex-1 flex-col gap-0">
        <TabsList class="mx-4 mb-1 grid h-10 w-auto grid-cols-2 rounded-md bg-paper p-1">
          <TabsTrigger value="chapters" class="h-full text-[.92rem] data-[state=active]:shadow-none">
            Capítulos
          </TabsTrigger>
          <TabsTrigger value="tomes" class="h-full text-[.92rem] data-[state=active]:shadow-none">
            Tomos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chapters" class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-4">
          <div v-if="hasSql" class="mx-2 mt-1 flex min-h-10 items-center gap-2.5 text-[.88rem] text-muted-foreground select-none">
            <Switch id="bookmark-sql" :model-value="sqlVisible" @update:model-value="toggleSql" />
            <label for="bookmark-sql" class="cursor-pointer">Mostrar <b class="font-semibold text-sql">SQL gerado</b></label>
          </div>
          <div ref="list">
            <template v-for="t in tomes" :key="t.id">
              <template v-for="g in groupsOf(t.chapters)" :key="t.id + g.name">
                <p class="mx-2 mt-3 mb-0.5 font-book text-[1rem] text-foreground italic">
                  {{ g.name }}
                </p>
                <ul class="m-0 grid list-none p-0">
                  <li v-for="c in g.chapters" :key="c.id">
                    <a
                      :href="`${division.path}/${c.id}`"
                      class="grid min-h-10 grid-cols-[26px_1fr] items-center rounded-md px-2 py-1 text-[.9rem] leading-[1.3] no-underline"
                      :class="active === c.id ? 'bg-tome-soft font-medium text-foreground' : 'text-foreground hover:bg-tome-soft'"
                      :aria-current="active === c.id ? 'page' : undefined"
                      @click.prevent="goTo(c.id)"
                    ><span class="text-[.8rem] text-tome tabular-nums">{{ c.number }}</span>{{ c.title }}</a>
                  </li>
                </ul>
              </template>
            </template>
          </div>
        </TabsContent>

        <TabsContent value="tomes" class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-4">
          <ol class="m-0 mt-1 grid list-none p-0">
            <li v-for="(d, i) in tree" :key="d.path" data-tome :style="colorsOf(d)">
              <NuxtLink
                :to="d.path"
                class="grid min-h-11 grid-cols-[30px_minmax(0,1fr)_auto] items-center gap-3 rounded-md px-2 py-1.5 text-foreground no-underline hover:bg-tome-soft aria-[current=page]:bg-tome-soft"
                :aria-current="d.path === division.path ? 'page' : undefined"
                @click="isOpen = false"
              >
                <Glyph :spell="d.spell" class="size-[30px] text-tome" />
                <span class="flex min-w-0 items-baseline gap-2">
                  <span class="w-7 shrink-0 font-book text-[.9rem] text-tome italic">{{ toRoman(i + 1) }}</span>
                  <span class="truncate font-book text-[1.25rem] leading-tight text-tome">{{ d.title }}</span>
                </span>
                <span class="text-[.8rem] text-muted-foreground tabular-nums">{{ chapterCount(d) }} cap.</span>
              </NuxtLink>
            </li>
          </ol>
          <NuxtLink to="/" class="mx-2 mt-2 inline-flex min-h-10 items-center gap-2 text-[.92rem] text-foreground underline underline-offset-4 hover:text-tome" @click="isOpen = false">
            <Icon name="lucide:book-open" class="size-[18px]" />
            Sumário do grimório
          </NuxtLink>
        </TabsContent>
      </Tabs>

      <div class="bg-paper px-3 py-2">
        <Button variant="ghost" class="h-10 w-full justify-start gap-2.5 px-2 text-[.92rem] font-normal hover:bg-tome-soft" @click="search">
          <Icon name="lucide:search" class="size-[18px]" />
          Buscar em todo o grimório
        </Button>
      </div>
    </SheetContent>
  </Sheet>
</template>
