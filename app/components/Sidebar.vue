<script setup lang="ts">
// O índice fixo à esquerda (como nas artifacts): busca, SQL gerado e
// os capítulos de todos os tomos do framework, marcando onde a leitura está.
import type { Division } from '~/composables/useTree'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '~/components/ui/accordion'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Switch } from '~/components/ui/switch'

export interface SidebarChapter { id: string, number: string, title: string, group: string }
export interface SidebarTome { id: string, title: string, chapters: SidebarChapter[] }

const props = defineProps<{
  division: Division
  tomes: SidebarTome[]
  active: string
  hasSql: boolean
  /** id de seção → número exibido (ex. "3.2") */
  numbers: Record<string, string>
}>()

const { data: tree } = useTree()
const { isVisible: sqlVisible, toggle: toggleSql } = useSql()
const { toggle: toggleTheme } = useTheme()
const { load, search } = useSearchIndex()

const isOpen = ref(false)
const query = ref('')
const selected = ref(-1)
const list = ref<HTMLUListElement>()

const results = computed(() => search(query.value, { division: slugOf(props.division.path), limit: 14 }))
watch(query, () => { selected.value = -1 })

const hashOf = (id: string) => id.split('#')[1] ?? ''
const numberOf = (id: string) => {
  const h = hashOf(id)
  if (props.numbers[h]) return props.numbers[h]
  const chapter = props.tomes.flatMap(t => t.chapters).find(c => h.startsWith(c.id + '-'))
  return chapter?.number ?? ''
}

function goTo(id: string) {
  query.value = ''
  isOpen.value = false
  navigateTo({ hash: '#' + hashOf(id) })
}
function onKeydown(e: KeyboardEvent) {
  const n = results.value.length
  if (e.key === 'Escape') { query.value = ''; return }
  if (!n) return
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault()
    selected.value = (selected.value + (e.key === 'ArrowDown' ? 1 : -1) + n) % n
    nextTick(() => list.value?.querySelector('[data-selected]')?.scrollIntoView({ block: 'nearest' }))
  }
  else if (e.key === 'Enter') {
    e.preventDefault()
    goTo(results.value[Math.max(0, selected.value)]!.section.id)
  }
}

const chapterCount = (d: Division) => d.tomes.reduce((s, t) => s + t.chapters.length, 0)

const groupsOf = (chapters: SidebarChapter[]) => groupChapters(chapters)
</script>

<template>
  <nav
    class="sticky top-0 -ml-1.5 max-h-screen self-start overflow-y-auto overscroll-contain pt-7 pr-3.5 pb-6 pl-1.5 [scrollbar-gutter:stable] js:motion-safe:animate-rise [animation-delay:.15s] max-book:static max-book:ml-0 max-book:max-h-none max-book:px-0 max-book:pt-5 max-book:pb-0"
    aria-label="Índice"
  >
    <div class="mb-[18px] flex items-center justify-between gap-2">
      <NuxtLink to="/" class="inline-flex items-center gap-2 text-[.84rem] text-muted-foreground no-underline hover:text-foreground">
        <Sigil /> Grimório
      </NuxtLink>
      <Button variant="outline" size="icon-sm" class="size-[30px] bg-transparent text-muted-foreground shadow-none" aria-label="Alternar tema claro e escuro" @click="toggleTheme">
        <Icon name="lucide:moon" />
      </Button>
    </div>

    <!-- os tomos do grimório: cada link solta a magia do próprio tomo (data-spell) -->
    <Accordion type="single" collapsible class="mb-3.5">
      <AccordionItem value="tomes" class="border-b-0">
        <AccordionTrigger class="items-center px-2 py-1.5 pl-1 text-foreground no-underline hover:bg-tome-soft hover:no-underline">
          <span class="inline-flex items-center gap-2.5 font-display text-[.92rem] font-semibold">
            <Glyph :spell="division.spell" class="size-[26px] text-tome" />
            Todos os tomos
          </span>
        </AccordionTrigger>
        <AccordionContent class="pb-2">
          <ul class="mt-1 grid gap-0.5">
            <li v-for="d in tree" :key="d.path">
              <NuxtLink
                :to="d.path"
                class="group grid grid-cols-[30px_minmax(0,1fr)_auto] items-center gap-2.5 rounded-md py-1.5 pr-2 pl-1 text-tome no-underline transition-colors hover:bg-tome-soft aria-[current=page]:bg-tome-soft"
                :aria-current="d.path === division.path ? 'page' : undefined"
                data-tome
                :data-spell="d.spell"
                :style="{ '--tome-day': d.color, '--tome-night': d.colorDark ?? d.color }"
              >
                <Glyph :spell="d.spell" class="size-[30px] transition-transform duration-350 ease-grimoire group-hover:scale-108 group-hover:-rotate-8" />
                <span class="font-book text-[1.2rem] leading-[1.1]">{{ d.title }}</span>
                <span class="font-sans text-[.8rem] text-muted-foreground tabular-nums">{{ chapterCount(d) }}</span>
              </NuxtLink>
            </li>
          </ul>
        </AccordionContent>
      </AccordionItem>
    </Accordion>

    <a class="mt-1.5 mb-3 block font-display text-[1.05rem] leading-[1.2] font-extrabold tracking-[-.01em] text-foreground no-underline" href="#top">{{ tomes.length === 1 ? tomes[0]!.title : division.title }}</a>

    <div class="mb-2.5 grid gap-2">
      <div class="relative">
        <Input
          v-model="query"
          type="search"
          :placeholder="`Buscar em ${division.title}…`"
          autocomplete="off"
          aria-label="Buscar método ou tema neste framework"
          class="bg-card"
          @focus="load"
          @keydown="onKeydown"
        />
        <ul v-if="query.trim()" ref="list" class="mt-1.5 grid max-h-[50vh] gap-px overflow-y-auto rounded-md border border-border bg-card p-1">
          <li v-for="(r, i) in results" :key="r.section.id">
            <a
              :href="`#${hashOf(r.section.id)}`"
              class="grid grid-cols-[48px_1fr] gap-1 rounded-sm px-1.5 py-[5px] text-[.84rem] leading-[1.35] text-foreground no-underline transition-colors hover:bg-tome-soft data-selected:bg-tome-soft"
              :data-selected="i === selected || undefined"
              @click.prevent="goTo(r.section.id)"
            >
              <span class="pt-0.5 font-mono text-[.72rem] text-tome">{{ numberOf(r.section.id) }}</span>
              <div>{{ r.section.title }}<small class="block text-[.74rem] text-muted-foreground">{{ r.section.location.split(' · ').slice(1).join(' · ') }}</small></div>
            </a>
          </li>
          <li v-if="!results.length" class="p-1.5 text-[.82rem] text-muted-foreground">
            Nada encontrado. Tente o nome do método, como "whereHas".
          </li>
        </ul>
      </div>
      <Button variant="outline" size="sm" class="hidden justify-self-start bg-card max-book:inline-flex" :aria-expanded="isOpen" @click="isOpen = !isOpen">
        Índice dos capítulos
        <Icon name="lucide:chevron-down" class="transition-transform" :class="{ 'rotate-180': isOpen }" />
      </Button>
      <div v-if="hasSql" class="flex items-center gap-2 text-[.84rem] text-muted-foreground select-none">
        <Switch id="show-sql" :model-value="sqlVisible" @update:model-value="toggleSql" />
        <label for="show-sql" class="cursor-pointer">Mostrar <b class="font-semibold text-sql">SQL gerado</b></label>
      </div>
    </div>

    <ol class="grid gap-px max-book:grid-cols-[repeat(auto-fill,minmax(160px,1fr))]" :class="{ 'max-book:hidden': !isOpen }">
      <template v-for="t in tomes" :key="t.id">
        <li v-if="tomes.length > 1" class="mx-2 mt-[18px] font-display text-[.92rem] font-semibold text-foreground max-book:col-span-full">
          <a :href="`#${t.id}`" class="block text-foreground no-underline">{{ t.title }}</a>
        </li>
        <template v-for="g in groupsOf(t.chapters)" :key="t.id + g.name">
          <li class="mx-2 mt-3.5 mb-1 text-[.68rem] tracking-[.12em] text-muted-foreground uppercase max-book:col-span-full">
            {{ g.name }}
          </li>
          <li v-for="c in g.chapters" :key="c.id">
            <a
              :href="`#${c.id}`"
              class="grid grid-cols-[26px_1fr] rounded-md px-2 py-[5px] text-[.88rem] leading-[1.35] no-underline transition-colors"
              :class="active === c.id ? 'bg-card text-foreground shadow-[inset_2px_0_0_var(--tome)]' : 'text-muted-foreground hover:bg-tome-soft hover:text-foreground'"
              @click="isOpen = false"
            ><span class="pt-0.5 font-mono text-[.74rem] text-tome">{{ c.number }}</span>{{ c.title }}</a>
          </li>
        </template>
      </template>
    </ol>
  </nav>
</template>
