<script setup lang="ts">
// Ao abrir um framework, pergunta se o leitor quer voltar ao capítulo (e ao
// ponto do scroll) onde parou, lido do cookie last_read. Pergunta uma vez por
// framework a cada visita ao site, para não insistir a cada volta ao sumário.
import type { Division } from '~/composables/useTree'
import type { LastRead, ResumeState } from '~/composables/useLastRead'
import { Button } from '~/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog'

const props = defineProps<{ division: Division }>()
const slug = slugOf(props.division.path)

const { get } = useLastRead()
const asked = useState<string[]>('resume-asked', () => [])
const isOpen = ref(false)
const entry = ref<LastRead>()

const chapter = computed(() => {
  if (!entry.value) return undefined
  for (const tome of props.division.tomes) {
    const i = tome.chapters.findIndex(c => slugOf(c.path) === entry.value!.chapter)
    if (i >= 0) return { number: String(i + 1).padStart(2, '0'), title: tome.chapters[i]!.nav || tome.chapters[i]!.title, tome: tome.title }
  }
  return undefined
})

const when = computed(() => {
  if (!entry.value) return ''
  const minutes = Math.round((Date.now() - entry.value.at) / 60000)
  const rtf = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' })
  if (minutes < 60) return rtf.format(-Math.max(minutes, 1), 'minute')
  if (minutes < 60 * 24) return rtf.format(-Math.round(minutes / 60), 'hour')
  return rtf.format(-Math.round(minutes / 1440), 'day')
})

// o cookie só existe no navegador (a página é pré-renderizada): lido depois de montar
onMounted(() => {
  if (asked.value.includes(slug)) return
  entry.value = get(slug)
  if (chapter.value) isOpen.value = true
})
watch(isOpen, (open) => { if (!open && !asked.value.includes(slug)) asked.value.push(slug) })

function resume() {
  const e = entry.value!
  isOpen.value = false
  const state: { resume: ResumeState } = { resume: { anchor: e.anchor, offset: e.offset, scrollY: e.scrollY } }
  navigateTo({ path: `/${slug}/${e.chapter}`, state })
}
</script>

<template>
  <Dialog v-model:open="isOpen">
    <!-- só esta modal anima: fade no fundo, fade + zoom no painel (padrão do shadcn-vue) -->
    <DialogContent
      class="gap-3 rounded-[10px] p-5 duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 sm:max-w-[420px]"
      overlay-class="duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0"
    >
      <DialogHeader class="gap-1 text-left">
        <DialogTitle class="font-book text-[1.3rem] font-normal">
          Continuar de onde parou?
        </DialogTitle>
        <DialogDescription class="text-[.88rem]">
          Sua última leitura em {{ division.title }} foi {{ when }}.
        </DialogDescription>
      </DialogHeader>
      <div v-if="chapter" class="grid grid-cols-[30px_minmax(0,1fr)] gap-x-1 rounded-md border border-border bg-card px-2.5 py-2">
        <span class="pt-px text-[.82rem] text-tome tabular-nums">{{ chapter.number }}</span>
        <span class="text-[.95rem] leading-snug font-medium">{{ chapter.title }}</span>
        <span class="col-start-2 text-[.8rem] text-muted-foreground">{{ chapter.tome }}</span>
      </div>
      <DialogFooter class="gap-2">
        <Button variant="outline" size="sm" @click="isOpen = false">
          Ficar no início
        </Button>
        <Button size="sm" @click="resume">
          <Icon name="lucide:bookmark" />Continuar leitura
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
