<script setup lang="ts">
// O índice fixo à esquerda, só em telas largas: busca, SQL gerado e os
// capítulos do tomo, marcando onde a leitura está. Os outros tomos e, no
// celular, os próprios capítulos ficam no marcador (Bookmark.vue).
import type { Division } from '~/composables/useTree'
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

const position = computed(() => tree.value.findIndex(d => d.path === props.division.path) + 1)

const groupsOf = (chapters: SidebarChapter[]) => groupChapters(chapters)
</script>

<template>
  <nav
    class="sticky top-0 -ml-1.5 max-h-screen self-start overflow-y-auto overscroll-contain pt-7 pr-3.5 pb-6 pl-1.5 [scrollbar-gutter:stable] max-book:hidden"
    aria-label="Índice"
  >
    <div class="mb-6 flex items-center justify-between gap-2">
      <NuxtLink to="/" class="-ml-1 inline-flex min-h-9 items-center gap-2 rounded-md px-1 text-[.88rem] text-muted-foreground no-underline hover:text-foreground">
        <Icon name="lucide:book-open" class="size-[17px]" /> Sumário do grimório
      </NuxtLink>
      <Button variant="ghost" size="icon-sm" class="size-9 text-muted-foreground hover:bg-tome-soft" aria-label="Alternar tema claro e escuro" @click="toggleTheme">
        <Icon name="lucide:moon" />
      </Button>
    </div>

    <a class="mb-4 grid grid-cols-[44px_minmax(0,1fr)] items-center gap-3 text-foreground no-underline" href="#top">
      <Glyph :spell="division.spell" class="size-11 text-tome" />
      <span>
        <span class="block font-book text-[.95rem] leading-tight text-tome italic">Tomo {{ toRoman(position) }}</span>
        <span class="block font-book text-[1.6rem] leading-[1.05]">{{ division.title }}</span>
      </span>
    </a>

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
              class="grid grid-cols-[40px_1fr] gap-1 rounded-sm px-1.5 py-[5px] text-[.84rem] leading-[1.35] text-foreground no-underline hover:bg-tome-soft data-selected:bg-tome-soft"
              :data-selected="i === selected || undefined"
              @click.prevent="goTo(r.section.id)"
            >
              <span class="pt-px text-[.78rem] text-tome tabular-nums">{{ numberOf(r.section.id) }}</span>
              <div>{{ r.section.title }}<small class="block text-[.74rem] text-muted-foreground">{{ r.section.location.split(' · ').slice(1).join(' · ') }}</small></div>
            </a>
          </li>
          <li v-if="!results.length" class="p-1.5 text-[.82rem] text-muted-foreground">
            Nada encontrado. Tente o nome do método, como "whereHas".
          </li>
        </ul>
      </div>
      <div v-if="hasSql" class="flex items-center gap-2 text-[.84rem] text-muted-foreground select-none">
        <Switch id="show-sql" :model-value="sqlVisible" @update:model-value="toggleSql" />
        <label for="show-sql" class="cursor-pointer">Mostrar <b class="font-semibold text-sql">SQL gerado</b></label>
      </div>
    </div>

    <ol class="grid gap-px">
      <template v-for="t in tomes" :key="t.id">
        <li v-if="tomes.length > 1" class="mx-2 mt-[18px] font-display text-[.92rem] font-semibold text-foreground">
          <a :href="`#${t.id}`" class="block text-foreground no-underline">{{ t.title }}</a>
        </li>
        <template v-for="g in groupsOf(t.chapters)" :key="t.id + g.name">
          <li class="mx-2 mt-4 mb-0.5 font-book text-[1.02rem] text-foreground italic">
            {{ g.name }}
          </li>
          <li v-for="c in g.chapters" :key="c.id">
            <a
              :href="`#${c.id}`"
              class="grid grid-cols-[26px_1fr] rounded-md px-2 py-[5px] text-[.88rem] leading-[1.35] no-underline"
              :class="active === c.id ? 'bg-card text-foreground shadow-[inset_2px_0_0_var(--tome)]' : 'text-muted-foreground hover:bg-tome-soft hover:text-foreground'"
            ><span class="pt-px text-[.8rem] text-tome tabular-nums">{{ c.number }}</span>{{ c.title }}</a>
          </li>
        </template>
      </template>
    </ol>
  </nav>
</template>
