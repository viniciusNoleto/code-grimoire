<script setup lang="ts">
const props = defineProps({
  code: { type: String, default: '' },
  language: { type: String, default: null },
  filename: { type: String, default: null },
  highlights: { type: Array as () => number[], default: () => [] },
  meta: { type: String, default: null },
  class: { type: String, default: null },
  style: { type: [String, Object], default: null },
})

const LABELS: Record<string, string> = {
  php: 'PHP', bash: 'Terminal', shell: 'Terminal', sh: 'Terminal', sql: 'SQL', js: 'JavaScript', jsx: 'JSX',
  ts: 'TypeScript', tsx: 'TSX', json: 'JSON', vue: 'Vue', html: 'HTML', css: 'CSS', http: 'HTTP', text: 'Texto',
}
const SQL_MARKER = /^\s*--(\s|$)/
const hasSql = computed(() => props.language === 'php' && props.code.split('\n').some(l => SQL_MARKER.test(l)))
const name = computed(() => props.filename || LABELS[props.language] || props.language || 'Código')

const buttonLabel = ref('Copiar')
async function copy(e: MouseEvent) {
  // copia só o código: as linhas de SQL gerado não fazem parte do PHP
  const text = props.code.split('\n').filter(l => !(hasSql.value && SQL_MARKER.test(l))).join('\n')
  try {
    await navigator.clipboard.writeText(text)
    buttonLabel.value = 'Copiado'
  }
  catch {
    const pre = (e.currentTarget as HTMLElement).closest('figure')?.querySelector('pre')
    if (pre) { const r = document.createRange(); r.selectNodeContents(pre); getSelection()?.removeAllRanges(); getSelection()?.addRange(r) }
    buttonLabel.value = 'Selecionado'
  }
  setTimeout(() => { buttonLabel.value = 'Copiar' }, 1400)
}
</script>

<template>
  <figure class="mt-3.5 mb-5 overflow-hidden rounded-lg border border-border bg-code" :data-lang="language">
    <figcaption class="flex items-center justify-between gap-2 border-b border-border py-[5px] pr-2 pl-3.5 font-mono text-[.72rem] text-muted-foreground">
      <span>{{ name }}<span v-if="hasSql" class="ml-2.5 text-sql sql-hidden:hidden">+ SQL gerado</span></span>
      <Button type="button" variant="outline" size="xs" class="bg-transparent font-mono text-[length:inherit] font-normal text-muted-foreground shadow-none" @click="copy">
        {{ buttonLabel }}
      </Button>
    </figcaption>
    <!-- .line vem do Shiki; as linhas de SQL têm classes próprias (shiki/sql-lines.ts) -->
    <pre
      :class="[props.class, 'm-0 overflow-x-auto bg-transparent! py-3 font-mono text-[.8rem] leading-[1.6] text-code-foreground [tab-size:4] [&_.line]:block [&_.line]:min-h-[1.6em] [&_.line]:px-4 [&_.line]:whitespace-pre [&>code]:block [&>code]:min-w-max [&>code]:bg-transparent [&>code]:p-0 [&>code]:text-[length:inherit] [&>code]:wrap-normal']"
      :style="props.style"
    ><slot /></pre>
  </figure>
</template>
