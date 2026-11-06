<script setup lang="ts">
// Busca em todo o grimório. Abre com ⌘K, Ctrl+K ou / em qualquer página.
import { Button } from '~/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'

const { isOpen, open, close } = useSearch()
const { data: tree } = useTree()
const { index, failed, load, search } = useSearchIndex()
const body = ref<HTMLDivElement>()
// o <Input> do shadcn-vue tem um único elemento raiz: o próprio <input>
const field = ref<{ $el: HTMLInputElement }>()
const query = ref('')
const active = ref(0)

const results = computed(() => search(query.value))
watch(query, () => { active.value = 0 })
watch(isOpen, (v) => { if (v) load() })

// ao abrir, o foco vai para o campo com o texto anterior selecionado
function focusField(e: Event) {
  e.preventDefault()
  nextTick(() => field.value?.$el.select())
}

function goTo(i: number) {
  const r = results.value[i]
  if (!r) return
  close()
  navigateTo(r.section.id)
}
function onKeydown(e: KeyboardEvent) {
  const n = results.value.length
  if (e.key === 'ArrowDown' && n) { e.preventDefault(); active.value = (active.value + 1) % n }
  else if (e.key === 'ArrowUp' && n) { e.preventDefault(); active.value = (active.value - 1 + n) % n }
  else if (e.key === 'Enter') { e.preventDefault(); goTo(active.value) }
}
watch(active, async () => {
  await nextTick()
  body.value?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
})

function onShortcut(e: KeyboardEvent) {
  const typing = (e.target as HTMLElement)?.closest?.('input, textarea, select, [contenteditable="true"]')
  if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); isOpen.value ? close() : open() }
  else if (e.key === '/' && !typing && !isOpen.value) { e.preventDefault(); open() }
}
onMounted(() => addEventListener('keydown', onShortcut))
onBeforeUnmount(() => removeEventListener('keydown', onShortcut))

const itemClass = 'grid rounded-sm px-2.5 py-2 text-[.92rem] leading-[1.35] text-foreground no-underline'
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent
      :show-close-button="false"
      class="top-[72px] flex max-h-[min(620px,calc(100dvh-96px))] max-w-[calc(100vw-32px)] translate-y-0 flex-col gap-0 overflow-hidden rounded-[10px] p-0 shadow-[0_24px_80px_rgb(0_0_0/.28)] sm:max-w-[680px]"
      @open-auto-focus="focusField"
    >
      <DialogTitle class="sr-only">
        Buscar no grimório
      </DialogTitle>
      <DialogDescription class="sr-only">
        Digite um método ou tema. Use as setas para escolher e Enter para abrir.
      </DialogDescription>
      <form class="flex gap-2 border-b border-border p-3" role="search" @submit.prevent="goTo(active)">
        <label for="search-input" class="sr-only">Buscar um método ou tema em todo o grimório</label>
        <Input
          id="search-input"
          ref="field"
          v-model="query"
          type="search"
          autocomplete="off"
          spellcheck="false"
          placeholder="Buscar em todo o grimório: whereHas, useReducer, soft delete…"
          role="combobox"
          aria-controls="search-list"
          :aria-expanded="results.length > 0"
          :aria-activedescendant="results.length ? `search-r-${active}` : undefined"
          class="h-10 flex-1 bg-card"
          @keydown="onKeydown"
        />
        <DialogClose as-child>
          <Button type="button" variant="outline" class="h-10 bg-card font-mono text-[.78rem] text-muted-foreground">
            Esc
          </Button>
        </DialogClose>
      </form>
      <div ref="body" class="overflow-y-auto overscroll-contain p-2">
        <ul v-if="results.length" id="search-list" role="listbox" class="grid gap-px">
          <li
            v-for="(r, i) in results"
            :id="`search-r-${i}`"
            :key="r.section.id"
            role="option"
            :aria-selected="i === active"
            @click="goTo(i)"
            @mousemove="active = i"
          >
            <NuxtLink :to="r.section.id" tabindex="-1" :class="[itemClass, i === active && 'bg-tome-soft']" @click.prevent>
              <div>
                {{ r.section.title }}<small class="block text-[.78rem] text-muted-foreground">{{ r.section.location }}</small>
                <small v-if="r.excerpt" class="mt-0.5 line-clamp-2 block text-[.78rem] wrap-anywhere text-foreground">{{ r.excerpt.before }}<mark class="rounded-xs bg-tome-soft font-semibold text-tome">{{ r.excerpt.match }}</mark>{{ r.excerpt.after }}</small>
              </div>
            </NuxtLink>
          </li>
        </ul>
        <p v-else-if="query.trim() && index" class="m-0 px-2.5 py-3.5 text-[.92rem]">
          Nada com “{{ query.trim() }}”. Tente o nome de um método, como <code>withCount</code>, ou um tema, como “contexto”.
        </p>
        <p v-else-if="failed" class="m-0 px-2.5 py-3.5 text-[.92rem]">
          Não consegui carregar o índice da busca. Recarregue a página e tente de novo.
        </p>
        <ul v-else class="grid gap-px">
          <li v-for="d in tree" :key="d.path">
            <NuxtLink
              :to="d.path"
              :style="{ '--tome-day': d.color, '--tome-night': d.colorDark }"
              data-tome
              :class="[itemClass, 'hover:bg-tome-soft']"
              @click="close"
            >
              <div class="font-display font-extrabold text-tome">
                {{ d.title }}<small class="block font-sans text-[.78rem] font-normal text-muted-foreground">{{ d.tomes.map(t => t.title).join(' · ') }}</small>
              </div>
            </NuxtLink>
          </li>
        </ul>
      </div>
    </DialogContent>
  </Dialog>
</template>
